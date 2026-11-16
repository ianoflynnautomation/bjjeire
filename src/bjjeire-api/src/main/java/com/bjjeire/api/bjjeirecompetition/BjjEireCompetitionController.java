package com.bjjeire.api.bjjeirecompetition;

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

/** BJJ Éire competition pages anyone can read without an account. */
@Tag(name = "BJJ Éire competitions")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.BJJEIRE_COMPETITION)
public class BjjEireCompetitionController {

    private final BjjEireCompetitionService bjjEireCompetitionService;

    @GetMapping
    @Operation(
            summary = "List upcoming BJJ Éire competitions",
            description = "Published competitions whose day has not passed in Ireland (Europe/Dublin), earliest day"
                    + " then name. Drafts, finished and cancelled competitions are never listed; their pages stay"
                    + " reachable by slug.")
    public ResponseEntity<PagedResponse<BjjEireCompetitionSummaryDto>> listBjjEireCompetitions(
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        return ResponseEntity.ok(bjjEireCompetitionService.getUpcoming(
                new PaginationRequest(page, pageSize), ApiRoutes.BJJEIRE_COMPETITION));
    }

    @GetMapping("/{slug}")
    @Operation(
            summary = "Get a competition by slug",
            description = "Details, fee, registration window and divisions. A draft answers 404. registrationState is"
                    + " worked out by the API at the time of the request.")
    public ResponseEntity<BjjEireCompetitionDto> getBjjEireCompetitionBySlug(@PathVariable String slug) {
        return bjjEireCompetitionService
                .getPublishedBySlug(slug)
                .map(ResponseEntity::ok)
                .orElseThrow(ApiProblems::notFound);
    }
}
