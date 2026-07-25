package com.autopost.autopost.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Partial update for a WeeklyDraft.
 * Both fields are optional — send only the ones you want to change.
 *   - content only  → saves edits, sets status = EDITED automatically
 *   - status only   → e.g. "POSTED" or "SKIPPED"
 *   - both          → content saved, status set to provided value
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDraftRequestDto {
    private String content;  // nullable — omit to leave unchanged
    private String status;   // nullable — omit to leave unchanged
}
