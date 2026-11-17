package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Results and the public leaderboard (US5). The leaderboard is public; recording, correcting and the results tab need
 * the organiser's token, which {@code SecurityConfig} enforces (#5035).
 */
@Tag(name = "BJJ Éire competition results")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.BJJEIRE_COMPETITION)
public class BjjEireCompetitionResultController {
    private final ResultService resultService;

    @GetMapping("/{id}/leaderboard")
    @Operation(
            summary = "Get a competition's leaderboard",
            description = "The podium of every division with a result, in the competition's division order, and the"
                    + " academy and affiliation rankings: 9 points per gold, 3 per silver, 1 per bronze, ties broken by"
                    + " golds, then silvers, then bronzes. A division that had fewer than two confirmed competitors when"
                    + " its result was recorded adds no points. winners is present only once the competition is"
                    + " finished. Names, academies and affiliations only. A draft, cancelled or unknown id answers"
                    + " 404.")
    public ResponseEntity<LeaderboardDto> getBjjEireCompetitionLeaderboard(@PathVariable @ValidObjectId String id) {
        return resultService.getLeaderboard(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @GetMapping("/admin/{id}/result")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "List each division's result and confirmed competitors",
            description = "For the organiser's results tab: the recorded podium by sign-up id, and the confirmed"
                    + " competitors who may be chosen.")
    public ResponseEntity<List<AdminDivisionResultDto>> getBjjEireCompetitionResultsForAdmin(
            @PathVariable @ValidObjectId String id) {
        return resultService.getForAdmin(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PutMapping("/{id}/division/{divisionId}/result")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Record or correct a division's podium",
            description = "Replaces any result already recorded. Every id must be a confirmed sign-up in this division"
                    + " (409 not-in-division) and appear once (409 duplicate-medallist). Allowed while the competition"
                    + " is published or finished; otherwise 409. Safe to retry.")
    public ResponseEntity<AdminDivisionResultDto> recordDivisionResult(
            @PathVariable @ValidObjectId String id,
            @PathVariable @ValidObjectId String divisionId,
            @RequestBody @Valid RecordResultCommand command) {
        return resultService
                .record(id, divisionId, command)
                .map(ResponseEntity::ok)
                .orElseThrow(ApiProblems::notFound);
    }

    @DeleteMapping("/{id}/division/{divisionId}/result")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(
            summary = "Remove a division's podium",
            description = "Answers 204 also when no result was recorded. Allowed while the competition is published or"
                    + " finished; otherwise 409.")
    public ResponseEntity<Void> clearDivisionResult(
            @PathVariable @ValidObjectId String id, @PathVariable @ValidObjectId String divisionId) {
        if (!resultService.clear(id, divisionId)) {
            throw ApiProblems.notFound();
        }
        return ResponseEntity.noContent().build();
    }
}
