package com.autopost.autopost.service;

import com.autopost.autopost.dto.request.AddRepoRequestDto;
import com.autopost.autopost.dto.request.UpdateDescriptionRequestDto;
import com.autopost.autopost.dto.response.TrackedRepoDto;
import com.autopost.autopost.dto.response.WeekStatusDto;
import com.autopost.autopost.entity.TrackedRepo;
import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.entity.WeeklyDraft;
import com.autopost.autopost.repository.TrackedRepoRepository;
import com.autopost.autopost.repository.UserAuthRepository;
import com.autopost.autopost.repository.WeeklyDraftRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RepoService {

    @Value("${app.weeklyGrid.weeks:12}")
    private int gridWeeks;

    private final TrackedRepoRepository repoRepository;
    private final WeeklyDraftRepository draftRepository;
    private final UserAuthRepository userAuthRepository;
    private final GitHubService gitHubService;
    private final GeminiService geminiService;
    private final DraftService draftService;

    public RepoService(TrackedRepoRepository repoRepository,
                       WeeklyDraftRepository draftRepository,
                       UserAuthRepository userAuthRepository,
                       GitHubService gitHubService,
                       GeminiService geminiService,
                       DraftService draftService) {
        this.repoRepository = repoRepository;
        this.draftRepository = draftRepository;
        this.userAuthRepository = userAuthRepository;
        this.gitHubService = gitHubService;
        this.geminiService = geminiService;
        this.draftService = draftService;
    }

    // -------------------------------------------------------------------------
    // GET /api/repos
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<TrackedRepoDto> getAllRepos(String email) {
        UserAuth userAuth = resolveUser(email);
        return repoRepository.findAllByUserAuth(userAuth).stream()
                .map(this::toDto)
                .toList();
    }

    // -------------------------------------------------------------------------
    // GET /api/repos/{id}
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public TrackedRepoDto getRepo(String email, Long repoId) {
        UserAuth userAuth = resolveUser(email);
        TrackedRepo repo = repoRepository.findByIdAndUserAuth(repoId, userAuth)
                .orElseThrow(() -> new ResourceNotFoundException("Repo not found: " + repoId));
        return toDto(repo);
    }

    // -------------------------------------------------------------------------
    // POST /api/repos
    // -------------------------------------------------------------------------

    @Transactional
    public TrackedRepoDto addRepo(String email, AddRepoRequestDto request) {
        UserAuth userAuth = resolveUser(email);

        // Normalise: strip trailing slash
        String repoUrl = request.getRepoUrl().stripTrailing();
        if (repoUrl.endsWith("/")) {
            repoUrl = repoUrl.substring(0, repoUrl.length() - 1);
        }

        if (repoRepository.existsByRepoUrlAndUserAuth(repoUrl, userAuth)) {
            throw new IllegalArgumentException("You are already tracking this repository");
        }

        // Call A: validate repo exists on GitHub
        gitHubService.validatePublicRepo(repoUrl);

        // Fetch a few recent commits to give Gemini some context for the description
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<String> recentCommits = gitHubService.fetchCommitMessages(repoUrl, weekStart.minusWeeks(4), today);

        // Call A: generate project description
        String description = geminiService.generateProjectDescription(repoUrl, recentCommits);

        TrackedRepo repo = TrackedRepo.builder()
                .userAuth(userAuth)
                .repoUrl(repoUrl)
                .projectDescription(description)
                .build();
        repo = repoRepository.save(repo);

        // Eagerly generate the first draft for this week (confirmed: yes, do this on add)
        draftService.generateDraft(repo);

        return toDto(repo);
    }

    // -------------------------------------------------------------------------
    // PUT /api/repos/{id}/description
    // -------------------------------------------------------------------------

    @Transactional
    public void updateDescription(String email, Long repoId, UpdateDescriptionRequestDto request) {
        UserAuth userAuth = resolveUser(email);
        TrackedRepo repo = repoRepository.findByIdAndUserAuth(repoId, userAuth)
                .orElseThrow(() -> new ResourceNotFoundException("Repo not found: " + repoId));
        repo.setProjectDescription(request.getDescription());
        repoRepository.save(repo);
    }

    // -------------------------------------------------------------------------
    // DELETE /api/repos/{id}
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteRepo(String email, Long repoId) {
        UserAuth userAuth = resolveUser(email);
        TrackedRepo repo = repoRepository.findByIdAndUserAuth(repoId, userAuth)
                .orElseThrow(() -> new ResourceNotFoundException("Repo not found: " + repoId));
        // CascadeType.ALL + orphanRemoval on TrackedRepo.drafts and .notes handles child cleanup
        repoRepository.delete(repo);
    }

    // -------------------------------------------------------------------------
    // weeklyGrid computation (§4 of Backend-Plan.md)
    // -------------------------------------------------------------------------

    List<WeekStatusDto> buildWeeklyGrid(TrackedRepo repo) {
        // Index existing drafts by their weekOf for O(1) lookup
        Map<LocalDate, String> draftStatusByWeek = draftRepository.findAllByRepo(repo).stream()
                .collect(Collectors.toMap(
                        WeeklyDraft::getWeekOf,
                        d -> d.getStatus().name()
                ));

        LocalDate currentMonday = LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<WeekStatusDto> grid = new ArrayList<>(gridWeeks);

        for (int i = 0; i < gridWeeks; i++) {
            LocalDate weekOf = currentMonday.minusWeeks(i);
            String status = draftStatusByWeek.getOrDefault(weekOf, "NONE");
            grid.add(WeekStatusDto.builder().weekOf(weekOf).status(status).build());
        }

        return grid;  // index 0 = current week, index N-1 = oldest
    }

    // -------------------------------------------------------------------------
    // Mapping helpers
    // -------------------------------------------------------------------------

    TrackedRepoDto toDto(TrackedRepo repo) {
        return TrackedRepoDto.builder()
                .id(repo.getId())
                .repoUrl(repo.getRepoUrl())
                .projectDescription(repo.getProjectDescription())
                .lastSyncedCommitSha(repo.getLastSyncedCommitSha())
                .addedAt(repo.getAddedAt())
                .weeklyGrid(buildWeeklyGrid(repo))
                .build();
    }

    private UserAuth resolveUser(String email) {
        return userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
    }

    // -------------------------------------------------------------------------
    // Typed exceptions
    // -------------------------------------------------------------------------

    public static class ResourceNotFoundException extends RuntimeException {
        public ResourceNotFoundException(String message) { super(message); }
    }
}
