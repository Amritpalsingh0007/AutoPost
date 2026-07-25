package com.autopost.autopost.contoller;

import com.autopost.autopost.dto.request.AddRepoRequestDto;
import com.autopost.autopost.dto.request.UpdateDescriptionRequestDto;
import com.autopost.autopost.dto.response.TrackedRepoDto;
import com.autopost.autopost.service.RepoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repos")
public class RepoController {

    private final RepoService repoService;

    public RepoController(RepoService repoService) {
        this.repoService = repoService;
    }

    /** GET /api/repos — all repos for the authenticated user */
    @GetMapping
    public ResponseEntity<List<TrackedRepoDto>> getAllRepos(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(repoService.getAllRepos(principal.getUsername()));
    }

    /** GET /api/repos/{id} — single repo with weeklyGrid */
    @GetMapping("/{id}")
    public ResponseEntity<TrackedRepoDto> getRepo(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(repoService.getRepo(principal.getUsername(), id));
    }

    /**
     * POST /api/repos — add a new tracked repo.
     * Triggers Call A (description generation) and generates a first draft immediately.
     */
    @PostMapping
    public ResponseEntity<TrackedRepoDto> addRepo(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody AddRepoRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(repoService.addRepo(principal.getUsername(), request));
    }

    /** PUT /api/repos/{id}/description — manually update the project description */
    @PutMapping("/{id}/description")
    public ResponseEntity<Void> updateDescription(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateDescriptionRequestDto request) {
        repoService.updateDescription(principal.getUsername(), id, request);
        return ResponseEntity.ok().build();
    }

    /** DELETE /api/repos/{id} — removes repo + all its drafts and notes */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepo(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable Long id) {
        repoService.deleteRepo(principal.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
