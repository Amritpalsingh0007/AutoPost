package com.autopost.autopost.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * One cell in the weeklyGrid.
 * status values: "DRAFT" | "EDITED" | "POSTED" | "SKIPPED" | "NONE"
 * "NONE" is used for weeks that have no draft record — never stored in the DB.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeekStatusDto {
    private LocalDate weekOf;
    private String status;  // String so "NONE" can be returned without a DB enum value
}
