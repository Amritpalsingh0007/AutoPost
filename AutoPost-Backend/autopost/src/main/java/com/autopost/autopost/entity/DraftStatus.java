package com.autopost.autopost.entity;

/**
 * Lifecycle states of a WeeklyDraft.
 *
 * DRAFT   — freshly AI-generated, not yet reviewed
 * EDITED  — user has made manual changes to the content
 * POSTED  — user has published this post to LinkedIn (or marked it posted)
 * SKIPPED — the scheduled job ran for this week but found no activity worth posting
 *
 * Note: "NONE" is NOT stored here — it is a virtual status used only in the
 * weeklyGrid response DTO to indicate a week that has no draft record at all.
 */
public enum DraftStatus {
    DRAFT,
    EDITED,
    POSTED,
    SKIPPED
}
