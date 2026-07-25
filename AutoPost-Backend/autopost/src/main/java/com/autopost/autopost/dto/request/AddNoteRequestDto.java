package com.autopost.autopost.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddNoteRequestDto {

    /** Optional — null means this is a general note not tied to a repo. */
    private Long repoId;

    @NotNull
    private LocalDate weekOf;

    @NotBlank
    private String text;
}
