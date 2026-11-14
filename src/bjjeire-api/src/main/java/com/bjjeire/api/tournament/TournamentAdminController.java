package com.bjjeire.api.tournament;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Tournament set-up. Every route needs the organiser's token; {@code SecurityConfig} enforces it. */
@Tag(name = "Tournament administration")
@SecurityRequirement(name = "BearerAuth")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.TOURNAMENT)

public class TournamentAdminController {
    private static final String ADMIN = ApiRoutes.TOURNAMENT + "/admin";

    private final TournamentService tournamentService;

    @GetMapping("/admin")
    @Operation(summary = "List every tournament, drafts included")
    public ResponseEntity<PagedResponse<TournamentSummaryDto>> listTournamentsForAdmin(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        return ResponseEntity.ok(tournamentService.getAllForAdmin(new PaginationRequest(page, pageSize), ADMIN));
    }

    @GetMapping("/admin/{id}")
    @Operation(summary = "Get a tournament in any status by id")
    public ResponseEntity<TournamentDto> getTournamentForAdmin(@PathVariable @ValidObjectId String id) {
        return tournamentService.getForAdmin(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping
    @Operation(
            summary = "Create a tournament as a draft",
            description = "Not safe to retry: the slug is unique, so the same request again returns 409.")
    public ResponseEntity<TournamentDto> createTournament(@RequestBody @Valid CreateTournamentCommand command) {
        TournamentDto created = tournamentService.create(command);
        return ResponseEntity.created(URI.create(ADMIN + "/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update a tournament",
            description = "Replaces the details and the full division list. Send each existing division with its id;"
                    + " a division left out is removed, and removing one with active sign-ups returns 409"
                    + " division-has-signups. A finished or cancelled tournament returns 409. Send the version from the"
                    + " last read; a missing version is 400, and a stale one is 409: reload and retry.")
    public ResponseEntity<TournamentDto> updateTournament(
            @PathVariable @ValidObjectId String id, @RequestBody @Valid UpdateTournamentCommand command) {
        return tournamentService.update(id, command).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping("/{id}/publish")
    @Operation(
            summary = "Publish a draft tournament",
            description = "Returns 409 no-divisions or invalid-window when the draft is not ready, and 409 when the"
                    + " tournament is not a draft or was changed by another save while it was being published.")
    public ResponseEntity<TournamentDto> publishTournament(@PathVariable @ValidObjectId String id) {
        return tournamentService.publish(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }
}
