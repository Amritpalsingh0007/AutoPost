package com.autopost.autopost.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddRepoRequestDto {

    @NotBlank
    @Pattern(
        regexp = "https://github\\.com/[\\w.-]+/[\\w.-]+",
        message = "Must be a valid GitHub repository URL (https://github.com/owner/repo)"
    )
    private String repoUrl;
}
