package com.bjjeire.api.bjjeirecompetition;

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

/** BJJ Éire competition set-up. Every route needs the organiser's token; {@code SecurityConfig} enforces it. */
@Tag(name = "BJJ Éire competition administration")
@SecurityRequirement(name = "BearerAuth")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.BJJEIRE_COMPETITION)
public class BjjEireCompetitionAdminController {
    private static final String ADMIN = ApiRoutes.BJJEIRE_COMPETITION + "/admin";

    private final BjjEireCompetitionService bjjEireCompetitionService;

    @GetMapping("/admin")
    @Operation(summary = "List every competition, drafts included")
    public ResponseEntity<PagedResponse<BjjEireCompetitionSummaryDto>> listBjjEireCompetitionsForAdmin(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        return ResponseEntity.ok(
                bjjEireCompetitionService.getAllForAdmin(new PaginationRequest(page, pageSize), ADMIN));
    }

    @GetMapping("/admin/{id}")
    @Operation(summary = "Get a competition in any status by id")
    public ResponseEntity<BjjEireCompetitionDto> getBjjEireCompetitionForAdmin(@PathVariable @ValidObjectId String id) {
        return bjjEireCompetitionService.getForAdmin(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping
    @Operation(
            summary = "Create a competition as a draft",
            description = "Not safe to retry: the slug is unique, so the same request again returns 409.")
    public ResponseEntity<BjjEireCompetitionDto> createBjjEireCompetition(
            @RequestBody @Valid CreateBjjEireCompetitionCommand command) {
        BjjEireCompetitionDto created = bjjEireCompetitionService.create(command);
        return ResponseEntity.created(URI.create(ADMIN + "/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Update a competition",
            description = "Replaces the details and the full division list. Send each existing division with its id;"
                    + " a division left out is removed, and removing one with active sign-ups returns 409"
                    + " division-has-signups. A finished or cancelled competition returns 409. Send the version from the"
                    + " last read; a missing version is 400, and a stale one is 409: reload and retry.")
    public ResponseEntity<BjjEireCompetitionDto> updateBjjEireCompetition(
            @PathVariable @ValidObjectId String id, @RequestBody @Valid UpdateBjjEireCompetitionCommand command) {
        return bjjEireCompetitionService
                .update(id, command)
                .map(ResponseEntity::ok)
                .orElseThrow(ApiProblems::notFound);
    }

    @PostMapping("/{id}/publish")
    @Operation(
            summary = "Publish a draft competition",
            description = "Returns 409 no-divisions or invalid-window when the draft is not ready, and 409 when the"
                    + " competition is not a draft or was changed by another save while it was being published.")
    public ResponseEntity<BjjEireCompetitionDto> publishBjjEireCompetition(@PathVariable @ValidObjectId String id) {
        return bjjEireCompetitionService.publish(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping("/{id}/finish")
    @Operation(
            summary = "Mark a published competition finished",
            description = "Names the top academy and affiliation as winners on the leaderboard; results can still be"
                    + " corrected. Finishing a finished competition returns it unchanged. A draft or cancelled one is"
                    + " 409.")
    public ResponseEntity<BjjEireCompetitionDto> finishBjjEireCompetition(@PathVariable @ValidObjectId String id) {
        return bjjEireCompetitionService.finish(id).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }
}
