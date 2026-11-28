package com.bjjeire.api.order;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * A delivery address. Only the Republic of Ireland ({@code IE}) and Northern Ireland ({@code GB} with a {@code BT}
 * postcode) are delivered to; anything else is 409 {@code delivery-not-available} (FR-017, research R3).
 *
 * @param postcode an Eircode in Ireland, optional; required in Northern Ireland
 * @param country ISO 3166-1 alpha-2
 */
public record DeliveryAddressDto(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String line1,
        @Size(max = 100) String line2,
        @NotBlank @Size(max = 60) String town,
        @NotBlank @Size(max = 60) String county,
        @Size(max = 10) String postcode,

        @NotBlank @Pattern(regexp = "^[A-Za-z]{2}$", message = "must be a two-letter country code") String country,

        @Size(max = 30) String phone) {}
