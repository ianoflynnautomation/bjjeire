package com.bjjeire.api.registration;

import com.bjjeire.api.common.ValidObjectId;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.annotation.JsonDeserialize;

/**
 * Starts a sign-up. The amount is never part of it: the API charges the competition's fee.
 *
 * @param acceptPublicListing the competitor agrees that their name, academy, affiliation and division are listed
 *     publicly (FR-012); must be true
 * @param acceptTerms the competitor accepts the terms of entry and the liability waiver (FR-012); must be true
 */
public record CreateRegistrationCommand(
        @NotNull @ValidObjectId String competitionId,
        @NotNull @ValidObjectId String divisionId,
        // Strict: a consent is the JSON value true, never "true" or 1 coerced into it (FR-012).
        @JsonDeserialize(using = StrictBooleanDeserializer.class) @NotNull @AssertTrue Boolean acceptPublicListing,

        @JsonDeserialize(using = StrictBooleanDeserializer.class) @NotNull @AssertTrue Boolean acceptTerms) {}
