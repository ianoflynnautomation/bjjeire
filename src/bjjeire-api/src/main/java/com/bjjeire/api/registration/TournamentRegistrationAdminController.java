package com.bjjeire.api.registration;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.PagedResponse;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.tournament.TournamentDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * The organiser's sign-up tools and tournament cancellation (User Story 4, FR-006, FR-007, FR-029). In the
 * {@code registration} package because they act on sign-ups. Every route needs the organiser's token;
 * {@code SecurityConfig} enforces it.
 */
@Tag(name = "Tournament administration")
@SecurityRequirement(name = "BearerAuth")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.TOURNAMENT + "/{id}")
public class TournamentRegistrationAdminController {
    private static final String PROBLEM = "application/problem+json";
    private static final MediaType CSV = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final RegistrationAdminService adminService;
    private final CancellationService cancellationService;

    @GetMapping("/registration")
    @Operation(
            summary = "List a tournament's sign-ups with the competitors' private details",
            description = "Every status, oldest first. Add format=csv for the full list as a CSV download with the"
                    + " same columns.")
    @ApiResponse(responseCode = "200", description = "The page")
    @ApiResponse(responseCode = "404", description = "No such tournament", content = @Content(mediaType = PROBLEM))
    public ResponseEntity<PagedResponse<AdminRegistrationDto>> listTournamentRegistrations(
            @PathVariable @ValidObjectId String id,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize) {
        return ResponseEntity.ok(adminService.list(id, new PaginationRequest(page, pageSize)));
    }

    @GetMapping(value = "/registration", params = "format=csv", produces = "text/csv")
    @Operation(
            summary = "Export a tournament's sign-ups as CSV",
            description = "Every row; page and pageSize are ignored.")
    @ApiResponse(responseCode = "200", description = "The CSV file")
    public ResponseEntity<String> exportTournamentRegistrations(@PathVariable @ValidObjectId String id) {
        return ResponseEntity.ok()
                .contentType(CSV)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("tournament-" + id + "-signups.csv")
                                .build()
                                .toString())
                .body(adminService.exportCsv(id));
    }

    @PutMapping("/registration/{registrationId}/division")
    @Operation(
            summary = "Move a confirmed sign-up to another division",
            description = "Any division of the tournament, also after registration closes, with no eligibility check."
                    + " No charge; the place is unchanged.")
    @ApiResponse(responseCode = "200", description = "The sign-up in its new division")
    @ApiResponse(
            responseCode = "404",
            description = "The sign-up or division is not in this tournament",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "already-registered, or conflict when the sign-up is not confirmed",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<AdminRegistrationDto> moveTournamentRegistration(
            @PathVariable @ValidObjectId String id,
            @PathVariable @ValidObjectId String registrationId,
            @RequestBody @Valid ChangeDivisionCommand command) {
        return ResponseEntity.ok(adminService.move(id, registrationId, command));
    }

    @PostMapping("/registration/{registrationId}/cancel")
    @Operation(
            summary = "Cancel a confirmed sign-up, with or without a refund",
            description = "The refund is the organiser's choice, whatever the registration window. Safe to retry.")
    @ApiResponse(responseCode = "200", description = "Cancelled; whether and how much was refunded")
    @ApiResponse(
            responseCode = "404",
            description = "The sign-up is not in this tournament",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "conflict: the sign-up is not confirmed",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<CancellationDto> cancelTournamentRegistration(
            @PathVariable @ValidObjectId String id,
            @PathVariable @ValidObjectId String registrationId,
            @RequestBody @Valid AdminCancelCommand command) {
        return ResponseEntity.ok(cancellationService.cancelByAdmin(id, registrationId, command.refund()));
    }

    @PostMapping("/team-merge")
    @Operation(
            summary = "Merge differently typed academy or affiliation names",
            description = "Rewrites every sign-up of this tournament whose key is in fromKeys, so points are not split."
                    + " Other tournaments are untouched.")
    @ApiResponse(responseCode = "200", description = "How many sign-ups were rewritten")
    @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content(mediaType = PROBLEM))
    @ApiResponse(responseCode = "404", description = "No such tournament", content = @Content(mediaType = PROBLEM))
    public ResponseEntity<TeamMergeDto> mergeTournamentTeams(
            @PathVariable @ValidObjectId String id, @RequestBody @Valid MergeTeamsCommand command) {
        return ResponseEntity.ok(adminService.mergeTeams(id, command));
    }

    @PostMapping("/cancel")
    @Operation(
            summary = "Cancel a tournament and refund every confirmed sign-up",
            description = "Ends unpaid holds, refunds every confirmed sign-up in full and mails each competitor. Safe"
                    + " to repeat on a cancelled tournament: only refunds that failed or never reached Stripe are"
                    + " retried, never one already issued.")
    @ApiResponse(responseCode = "200", description = "The cancelled tournament")
    @ApiResponse(responseCode = "404", description = "No such tournament", content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "conflict: the tournament is finished",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<TournamentDto> cancelTournament(@PathVariable @ValidObjectId String id) {
        return ResponseEntity.ok(cancellationService.cancelTournament(id));
    }
}
