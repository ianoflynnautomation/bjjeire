package com.bjjeire.api.registration;

import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.annotation.JsonDeserialize;

/**
 * The organiser cancels one sign-up (FR-007).
 *
 * @param refund whether to refund the fee in full, whatever the registration window says
 */
public record AdminCancelCommand(
        @JsonDeserialize(using = StrictBooleanDeserializer.class) @NotNull Boolean refund) {}
