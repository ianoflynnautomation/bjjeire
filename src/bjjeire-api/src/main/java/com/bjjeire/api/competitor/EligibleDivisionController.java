package com.bjjeire.api.competitor;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.tournament.DivisionDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** The divisions of a tournament the signed-in competitor may enter (#5014, #5019). Competitor token only. */
@Tag(name = "Competitor profile")
@SecurityRequirement(name = "BearerAuth")
@RestController
@RequiredArgsConstructor
public class EligibleDivisionController {
    private static final String PROBLEM = "application/problem+json";

    private final CompetitorService competitorService;

    @GetMapping(ApiRoutes.TOURNAMENT + "/{id}/eligible-division")
    @Operation(
            summary = "List the divisions you may enter",
            description = "Only divisions for your gender and belt whose minimum age you reach on the tournament day.")
    @ApiResponse(responseCode = "200", description = "The eligible divisions, possibly none")
    @ApiResponse(
            responseCode = "404",
            description = "No published tournament with this id",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "registration-not-open, profile-incomplete, or under-18 on the tournament day",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<List<DivisionDto>> getEligibleDivisions(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt, @PathVariable @ValidObjectId String id) {
        return ResponseEntity.ok(competitorService.getEligibleDivisions(CompetitorIdentity.from(jwt), id));
    }
}
