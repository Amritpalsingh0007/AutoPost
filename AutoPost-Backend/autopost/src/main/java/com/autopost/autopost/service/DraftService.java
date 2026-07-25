package com.autopost.autopost.service;

import com.autopost.autopost.dto.request.UpdateDraftRequestDto;
import com.autopost.autopost.dto.response.WeeklyDraftDto;
import com.autopost.autopost.entity.DraftStatus;
import com.autopost.autopost.entity.TrackedRepo;
import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.entity.WeeklyDraft;
import com.autopost.autopost.entity.WeeklyNote;
import com.autopost.autopost.repository.TrackedRepoRepository;
import com.autopost.autopost.repository.UserAuthRepository;
import com.autopost.autopost.repository.WeeklyDraftRepository;
import com.autopost.autopost.repository.WeeklyNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class DraftService {

    private final WeeklyDraftRepository draftRepository;
    private final WeeklyNoteRepository noteRepository;
    private final TrackedRepoRepository repoRepository;
    private final UserAuthRepository userAuthRepository;
    private final GitHubService gitHubService;
    private final GeminiService geminiService;

    public DraftService(WeeklyDraftRepository draftRepository,
                        WeeklyNoteRepository noteRepository,
                        TrackedRepoRepository repoRepository,
                        UserAuthRepository userAuthRepository,
                        GitHubService gitHubService,
                        GeminiService geminiService) {
        this.draftRepository = draftRepository;
        this.noteRepository = noteRepository;
        this.repoRepository = repoRepository;
        this.userAuthRepository = userAuthRepository;
        this.gitHubService = gitHubService;
        this.geminiService = geminiService;
    }

    // -------------------------------------------------------------------------
    // GET /api/drafts  — all drafts across all user repos
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<WeeklyDraftDto> getAllDrafts(String email) {
        UserAuth userAuth = resolveUser(email);
        return draftRepository.findAllByUserAuth(userAuth).stream()
                .map(this::toDto)
                .toList();
    }

    // -------------------------------------------------------------------------
    // GET /api/drafts/repo/{repoId}
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<WeeklyDraftDto> getDraftsForRepo(String email, Long repoId) {
        UserAuth userAuth = resolveUser(email);
        TrackedRepo repo = resolveRepo(repoId, userAuth);
        return draftRepository.findAllByRepoOrderByWeekOfDesc(repo).stream()
                .map(this::toDto)
                .toList();
    }

    // -------------------------------------------------------------------------
    // GET /api/drafts/{id}
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public WeeklyDraftDto getDraft(String email, Long draftId) {
        UserAuth userAuth = resolveUser(email);
        WeeklyDraft draft = draftRepository.findByIdAndUserAuth(draftId, userAuth)
                .orElseThrow(() -> new RepoService.ResourceNotFoundException("Draft not found: " + draftId));
        return toDto(draft);
    }

    // -------------------------------------------------------------------------
    // PUT /api/drafts/{id}  — partial update
    // -------------------------------------------------------------------------

    @Transactional
    public WeeklyDraftDto updateDraft(String email, Long draftId, UpdateDraftRequestDto request) {
        UserAuth userAuth = resolveUser(email);
        WeeklyDraft draft = draftRepository.findByIdAndUserAuth(draftId, userAuth)
                .orElseThrow(() -> new RepoService.ResourceNotFoundException("Draft not found: " + draftId));

        boolean contentChanged = false;

        if (request.getContent() != null) {
            draft.setContent(request.getContent());
            contentChanged = true;
        }

        if (request.getStatus() != null) {
            draft.setStatus(DraftStatus.valueOf(request.getStatus().toUpperCase()));
        } else if (contentChanged) {
            // Inline edit without explicit status → automatically mark as EDITED
            draft.setStatus(DraftStatus.EDITED);
        }

        return toDto(draftRepository.save(draft));
    }

    // -------------------------------------------------------------------------
    // POST /api/drafts/generate/{repoId}  — manual / on-demand generation (Call B)
    // -------------------------------------------------------------------------

    @Transactional
    public WeeklyDraftDto generateForRepo(String email, Long repoId) {
        UserAuth userAuth = resolveUser(email);
        TrackedRepo repo = resolveRepo(repoId, userAuth);
        WeeklyDraft draft = generateDraft(repo);
        return toDto(draft);
    }

    /**
     * Core generation logic — called both from the manual endpoint and from
     * RepoService.addRepo() (eager first draft on repo add).
     *
     * If a draft already exists for the current week, it is regenerated (content
     * replaced, status reset to DRAFT, generatedAt updated).
     */
    @Transactional
    public WeeklyDraft generateDraft(TrackedRepo repo) {
        LocalDate weekStart = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate weekEnd = weekStart.plusDays(6);

        // Fetch commits for the current week
        List<String> commits = gitHubService.fetchCommitMessages(repo.getRepoUrl(), weekStart, weekEnd);

        // Fetch this user's notes for this repo and week
        List<String> notes = noteRepository
                .findAllByRepoAndWeekOf(repo, weekStart)
                .stream()
                .map(WeeklyNote::getText)
                .toList();

        // Call B: generate post content
        String content = geminiService.generateWeeklyDraft(
                repo.getRepoUrl(),
                repo.getProjectDescription(),
                commits,
                notes
        );

        // Upsert: update if exists, insert if not
        WeeklyDraft draft = draftRepository.findByRepoAndWeekOf(repo, weekStart)
                .orElseGet(() -> WeeklyDraft.builder()
                        .repo(repo)
                        .weekOf(weekStart)
                        .build());

        draft.setContent(content);
        draft.setStatus(DraftStatus.DRAFT);
        draft.setGeneratedAt(java.time.Instant.now());
        draft.setCommitCount(commits.size());
        draft.setNoteCount(notes.size());

        return draftRepository.save(draft);
    }

    // -------------------------------------------------------------------------
    // Mapping helpers
    // -------------------------------------------------------------------------

    WeeklyDraftDto toDto(WeeklyDraft draft) {
        return WeeklyDraftDto.builder()
                .id(draft.getId())
                .repoId(draft.getRepo().getId())
                .repoName(GitHubService.extractRepoName(draft.getRepo().getRepoUrl()))
                .weekOf(draft.getWeekOf())
                .content(draft.getContent())
                .status(draft.getStatus().name())
                .generatedAt(draft.getGeneratedAt())
                .commitCount(draft.getCommitCount())
                .noteCount(draft.getNoteCount())
                .build();
    }

    private UserAuth resolveUser(String email) {
        return userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
    }

    private TrackedRepo resolveRepo(Long repoId, UserAuth userAuth) {
        return repoRepository.findByIdAndUserAuth(repoId, userAuth)
                .orElseThrow(() -> new RepoService.ResourceNotFoundException("Repo not found: " + repoId));
    }
}
