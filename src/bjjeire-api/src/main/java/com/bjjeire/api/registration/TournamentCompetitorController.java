package com.bjjeire.api.registration;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.ValidObjectId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** The public competitor list of a tournament (#5015). Built from sign-up snapshots only (FR-011). */
@Tag(name = "Tournaments")
@RestController
@RequiredArgsConstructor
public class TournamentCompetitorController {
    private final RegistrationService registrationService;

    @GetMapping(ApiRoutes.TOURNAMENT + "/{id}/competitor")
    @Operation(
            summary = "List a tournament's confirmed competitors by division",
            description = "Name, academy and affiliation only. One entry per division, in the tournament's order.")
    @ApiResponse(responseCode = "200", description = "The competitor lists")
    @ApiResponse(
            responseCode = "404",
            description = "No published tournament with this id",
            content = @Content(mediaType = "application/problem+json"))
    public ResponseEntity<List<DivisionCompetitorsDto>> getTournamentCompetitors(
            @PathVariable @ValidObjectId String id) {
        return ResponseEntity.ok(registrationService.getListedCompetitors(id));
    }
}
