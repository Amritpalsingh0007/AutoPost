package com.autopost.autopost.contoller;

import com.autopost.autopost.dto.request.AddNoteRequestDto;
import com.autopost.autopost.dto.response.WeeklyNoteDto;
import com.autopost.autopost.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    /** GET /api/notes — all notes for the authenticated user */
    @GetMapping
    public ResponseEntity<List<WeeklyNoteDto>> getAllNotes(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(noteService.getAllNotes(principal.getUsername()));
    }

    /**
     * POST /api/notes — create a note.
     * Body: { repoId? (null = general note), weekOf, text }
     */
    @PostMapping
    public ResponseEntity<WeeklyNoteDto> addNote(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody AddNoteRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(noteService.addNote(principal.getUsername(), request));
    }

    /** DELETE /api/notes/{id} — 204 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id) {
        noteService.deleteNote(principal.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
