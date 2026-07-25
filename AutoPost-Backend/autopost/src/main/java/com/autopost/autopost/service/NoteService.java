package com.autopost.autopost.service;

import com.autopost.autopost.dto.request.AddNoteRequestDto;
import com.autopost.autopost.dto.response.WeeklyNoteDto;
import com.autopost.autopost.entity.TrackedRepo;
import com.autopost.autopost.entity.UserAuth;
import com.autopost.autopost.entity.WeeklyNote;
import com.autopost.autopost.repository.TrackedRepoRepository;
import com.autopost.autopost.repository.UserAuthRepository;
import com.autopost.autopost.repository.WeeklyNoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NoteService {

    private final WeeklyNoteRepository noteRepository;
    private final UserAuthRepository userAuthRepository;
    private final TrackedRepoRepository repoRepository;

    public NoteService(WeeklyNoteRepository noteRepository,
                       UserAuthRepository userAuthRepository,
                       TrackedRepoRepository repoRepository) {
        this.noteRepository = noteRepository;
        this.userAuthRepository = userAuthRepository;
        this.repoRepository = repoRepository;
    }

    // -------------------------------------------------------------------------
    // GET /api/notes
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<WeeklyNoteDto> getAllNotes(String email) {
        UserAuth userAuth = resolveUser(email);
        return noteRepository.findAllByUserAuth(userAuth).stream()
                .map(this::toDto)
                .toList();
    }

    // -------------------------------------------------------------------------
    // POST /api/notes
    // -------------------------------------------------------------------------

    @Transactional
    public WeeklyNoteDto addNote(String email, AddNoteRequestDto request) {
        UserAuth userAuth = resolveUser(email);

        TrackedRepo repo = null;
        if (request.getRepoId() != null) {
            // Validate ownership — user must own the repo they're attaching the note to
            repo = repoRepository.findByIdAndUserAuth(request.getRepoId(), userAuth)
                    .orElseThrow(() -> new RepoService.ResourceNotFoundException(
                            "Repo not found: " + request.getRepoId()));
        }

        WeeklyNote note = WeeklyNote.builder()
                .userAuth(userAuth)
                .repo(repo)
                .weekOf(request.getWeekOf())
                .text(request.getText())
                .build();

        return toDto(noteRepository.save(note));
    }

    // -------------------------------------------------------------------------
    // DELETE /api/notes/{id}
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteNote(String email, Long noteId) {
        UserAuth userAuth = resolveUser(email);
        WeeklyNote note = noteRepository.findByIdAndUserAuth(noteId, userAuth)
                .orElseThrow(() -> new RepoService.ResourceNotFoundException("Note not found: " + noteId));
        noteRepository.delete(note);
    }

    // -------------------------------------------------------------------------
    // Mapping helpers
    // -------------------------------------------------------------------------

    private WeeklyNoteDto toDto(WeeklyNote note) {
        String repoName = note.getRepo() != null
                ? GitHubService.extractRepoName(note.getRepo().getRepoUrl())
                : null;
        return WeeklyNoteDto.builder()
                .id(note.getId())
                .repoId(note.getRepo() != null ? note.getRepo().getId() : null)
                .repoName(repoName)
                .weekOf(note.getWeekOf())
                .text(note.getText())
                .build();
    }

    private UserAuth resolveUser(String email) {
        return userAuthRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));
    }
}
