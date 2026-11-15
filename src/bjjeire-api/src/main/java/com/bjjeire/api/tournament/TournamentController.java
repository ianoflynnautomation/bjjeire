package com.bjjeire.api.tournament;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Tournament pages anyone can read without an account. */
@Tag(name = "Tournaments")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.TOURNAMENT)
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    @Operation(
            summary = "List tournaments open to the public",
            description = "Published, finished and cancelled tournaments, earliest day first. Drafts are never listed.")
    public ResponseEntity<PagedResponse<TournamentSummaryDto>> listTournaments(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        return ResponseEntity.ok(
                tournamentService.getPublished(new PaginationRequest(page, pageSize), ApiRoutes.TOURNAMENT));
    }

    @GetMapping("/{slug}")
    @Operation(
            summary = "Get a tournament by slug",
            description = "Details, fee, registration window and divisions. A draft answers 404. registrationState is"
                    + " worked out by the API at the time of the request.")
    public ResponseEntity<TournamentDto> getTournamentBySlug(@PathVariable String slug) {
        return tournamentService
                .getPublishedBySlug(slug)
                .map(ResponseEntity::ok)
                .orElseThrow(ApiProblems::notFound);
    }
}
