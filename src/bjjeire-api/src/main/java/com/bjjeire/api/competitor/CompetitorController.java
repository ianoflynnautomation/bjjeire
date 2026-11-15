package com.bjjeire.api.competitor;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The signed-in competitor's own profile. Every route needs a competitor-tenant token ({@code SecurityConfig}) and acts
 * on the caller only: there is no route that takes a competitor id (#5009).
 */
@Tag(name = "Competitor profile")
@SecurityRequirement(name = "BearerAuth")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.COMPETITOR + "/me")
public class CompetitorController {
    private static final String PROBLEM = "application/problem+json";

    private final CompetitorService competitorService;

    @GetMapping
    @Operation(summary = "Get your profile", description = "404 until you have saved one.")
    @ApiResponse(responseCode = "200", description = "Your profile")
    @ApiResponse(responseCode = "404", description = "No profile saved yet", content = @Content(mediaType = PROBLEM))
    public ResponseEntity<CompetitorDto> getOwnProfile(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        return competitorService
                .getOwn(CompetitorIdentity.from(jwt))
                .map(ResponseEntity::ok)
                .orElseThrow(ApiProblems::notFound);
    }

    @PutMapping
    @Operation(
            summary = "Create or replace your profile",
            description = "Safe to retry: one profile per account. The email is taken from your sign-in, not the body."
                    + " An academy is a directory gym by gymId (400 UNKNOWN_GYM when it is not listed) or a typed name;"
                    + " null means no academy.")
    @ApiResponse(responseCode = "200", description = "The saved profile")
    @ApiResponse(
            responseCode = "400",
            description = "Validation failed, or UNKNOWN_GYM",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "401",
            description = "Not signed in, or the account was deleted while this save was in flight",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<CompetitorDto> saveOwnProfile(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid SaveCompetitorCommand command) {
        return ResponseEntity.ok(competitorService.saveOwn(CompetitorIdentity.from(jwt), command));
    }

    @GetMapping("/history")
    @Operation(summary = "Get your medal totals and the tournaments you entered")
    public ResponseEntity<CompetitorHistoryDto> getOwnHistory(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(competitorService.getOwnHistory(CompetitorIdentity.from(jwt)));
    }

    @DeleteMapping
    @Operation(
            summary = "Delete your account",
            description = "Removes your profile and your sign-in. Returns 409 has-active-registration while a sign-up"
                    + " is awaiting payment or confirmed. Afterwards this account's sign-in is refused.")
    @ApiResponse(responseCode = "204", description = "The account is deleted")
    @ApiResponse(
            responseCode = "409",
            description = "has-active-registration: cancel your sign-ups first",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<Void> deleteOwnAccount(@Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        competitorService.deleteOwn(CompetitorIdentity.from(jwt));
        return ResponseEntity.noContent().build();
    }
}
