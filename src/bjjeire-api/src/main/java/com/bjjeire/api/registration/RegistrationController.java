package com.bjjeire.api.registration;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.competitor.CompetitorIdentity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The signed-in competitor's sign-ups (User Story 3). Every route needs a competitor-tenant token. */
@Tag(name = "BJJ Éire competition sign-up")
@SecurityRequirement(name = "BearerAuth")
@RestController
@RequiredArgsConstructor
@RequestMapping(ApiRoutes.REGISTRATION)
public class RegistrationController {
    private static final String PROBLEM = "application/problem+json";

    private final RegistrationService registrationService;
    private final CancellationService cancellationService;

    @PostMapping
    @Operation(
            summary = "Start a sign-up",
            description = "Takes a place for 30 minutes and returns a Stripe Checkout page for the competition's fee."
                    + " The sign-up is confirmed only when Stripe reports the payment. Both consents must be true."
                    + " Not idempotent: a second call for the same division while the first is active is 409"
                    + " already-registered.")
    @ApiResponse(responseCode = "201", description = "The place is held; send the competitor to checkoutUrl")
    @ApiResponse(
            responseCode = "400",
            description = "Validation failed, including a consent that is not true",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "404",
            description = "No published competition with this id, or no such division in it",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "registration-not-open, profile-incomplete, under-18, not-eligible, competition-full,"
                    + " already-registered or too-many-unpaid. Nothing was charged",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "502",
            description = "payment-unavailable: Stripe could not be reached; the place was given back",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<RegistrationCheckoutDto> createRegistration(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @RequestBody @Valid CreateRegistrationCommand command) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(registrationService.create(CompetitorIdentity.from(jwt), command));
    }

    @PostMapping("/{id}/checkout")
    @Operation(
            summary = "Return to the payment page of an unpaid sign-up",
            description = "Gives the same Checkout page again while the hold lasts. It never opens a second one.")
    @ApiResponse(responseCode = "200", description = "The open Checkout page")
    @ApiResponse(
            responseCode = "403",
            description = "The sign-up belongs to another competitor",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(responseCode = "404", description = "No such sign-up", content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "hold-expired: the hold ended or the sign-up is no longer awaiting payment; payment-received:"
                    + " Stripe already took the payment and the sign-up is being confirmed",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<RegistrationCheckoutDto> resumeCheckout(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt, @PathVariable @ValidObjectId String id) {
        return ResponseEntity.ok(registrationService.resumeCheckout(CompetitorIdentity.from(jwt), id));
    }

    @GetMapping("/me")
    @Operation(
            summary = "List your sign-ups",
            description = "Newest first, with competition, division, amount and status.")
    @ApiResponse(responseCode = "200", description = "Your sign-ups, possibly none")
    public ResponseEntity<List<RegistrationDto>> getOwnRegistrations(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(registrationService.getOwn(CompetitorIdentity.from(jwt)));
    }

    @PostMapping("/{id}/cancel")
    @Operation(
            summary = "Cancel your confirmed sign-up",
            description = "Before registration closes the fee is refunded in full to the original payment method;"
                    + " after it closes there is no refund (RegistrationDto.refundableUntil says which applies). Your"
                    + " place is released and you leave the public list. A mail states the refund outcome. Safe to"
                    + " retry: cancelling a cancelled sign-up returns the same outcome and changes nothing.")
    @ApiResponse(responseCode = "200", description = "Cancelled; whether and how much was refunded")
    @ApiResponse(
            responseCode = "403",
            description = "The sign-up belongs to another competitor",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(responseCode = "404", description = "No such sign-up", content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "conflict: the sign-up is not confirmed; an unpaid one ends by itself when its hold runs out",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<CancellationDto> cancelRegistration(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt, @PathVariable @ValidObjectId String id) {
        return ResponseEntity.ok(cancellationService.cancelOwn(CompetitorIdentity.from(jwt), id));
    }

    @PutMapping("/{id}/division")
    @Operation(
            summary = "Move your confirmed sign-up to another division",
            description = "Free of charge, to a division you are eligible for, while registration is open. Your place"
                    + " and the price you paid are unchanged.")
    @ApiResponse(responseCode = "200", description = "The sign-up in its new division")
    @ApiResponse(responseCode = "400", description = "Validation failed", content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "403",
            description = "The sign-up belongs to another competitor",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "404",
            description = "No such sign-up, or no such division in its competition",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "registration-closed (contact the organiser), not-eligible, already-registered, or conflict"
                    + " when the sign-up is not confirmed",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<RegistrationDto> changeRegistrationDivision(
            @Parameter(hidden = true) @AuthenticationPrincipal Jwt jwt,
            @PathVariable @ValidObjectId String id,
            @RequestBody @Valid ChangeDivisionCommand command) {
        return ResponseEntity.ok(registrationService.changeOwnDivision(CompetitorIdentity.from(jwt), id, command));
    }
}
