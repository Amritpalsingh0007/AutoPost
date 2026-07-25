package com.autopost.autopost.contoller;

import com.autopost.autopost.dto.request.UpdateDraftRequestDto;
import com.autopost.autopost.dto.response.WeeklyDraftDto;
import com.autopost.autopost.service.DraftService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drafts")
public class DraftController {

    private final DraftService draftService;

    public DraftController(DraftService draftService) {
        this.draftService = draftService;
    }

    /** GET /api/drafts — all drafts across all repos of the authenticated user */
    @GetMapping
    public ResponseEntity<List<WeeklyDraftDto>> getAllDrafts(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(draftService.getAllDrafts(principal.getUsername()));
    }

    /** GET /api/drafts/repo/{repoId} — drafts for a specific repo, newest first */
    @GetMapping("/repo/{repoId}")
    public ResponseEntity<List<WeeklyDraftDto>> getDraftsForRepo(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long repoId) {
        return ResponseEntity.ok(draftService.getDraftsForRepo(principal.getUsername(), repoId));
    }

    /** GET /api/drafts/{id} — single draft */
    @GetMapping("/{id}")
    public ResponseEntity<WeeklyDraftDto> getDraft(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(draftService.getDraft(principal.getUsername(), id));
    }

    /**
     * PUT /api/drafts/{id} — partial update.
     * Sending only content → saves edits, auto-sets status = EDITED.
     * Sending only status → e.g. mark as POSTED.
     * Sending both → content saved, status set to provided value.
     */
    @PutMapping("/{id}")
    public ResponseEntity<WeeklyDraftDto> updateDraft(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id,
            @RequestBody UpdateDraftRequestDto request) {
        return ResponseEntity.ok(draftService.updateDraft(principal.getUsername(), id, request));
    }

    /**
     * POST /api/drafts/generate/{repoId} — manual "Generate now" / "Regenerate".
     * Runs Call B on demand. If a draft already exists for the current week it is replaced.
     */
    @PostMapping("/generate/{repoId}")
    public ResponseEntity<WeeklyDraftDto> generateDraft(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long repoId) {
        return ResponseEntity.ok(draftService.generateForRepo(principal.getUsername(), repoId));
    }
}
