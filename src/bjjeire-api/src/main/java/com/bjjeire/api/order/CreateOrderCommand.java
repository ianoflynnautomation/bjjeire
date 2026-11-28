package com.bjjeire.api.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * A guest's checkout (#6006, #6012). No account: a name, an email and a delivery address.
 *
 * @param deliveryCents the delivery fee the shopper was shown; a different current fee is 409 {@code basket-changed}
 * @param acceptTerms must be true: the shopper accepted the terms of sale
 */
public record CreateOrderCommand(
        // More than 20 lines is more than 20 items: 409 basket-too-large. 100 only bounds the body.
        @NotNull @Size(min = 1, max = 100) List<@NotNull @Valid OrderLineCommand> lines,
        @NotBlank @Email @Size(max = 254) String email,
        @NotNull @Valid DeliveryAddressDto address,
        @NotNull @Min(0) Integer deliveryCents,

        @NotNull @AssertTrue(message = "must accept the terms of sale") Boolean acceptTerms) {}
