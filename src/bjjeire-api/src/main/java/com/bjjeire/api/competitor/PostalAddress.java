package com.bjjeire.api.competitor;

import jakarta.validation.constraints.Size;

/**
 * Optional contact address, used only by the organiser.
 *
 * @param country ISO 3166-1 alpha-2 country of residence
 */
public record PostalAddress(
        @Size(max = 200) String street,
        @Size(max = 20) String postcode,
        @Size(max = 100) String city,
        @Size(max = 100) String region,
        @IsoCountry String country) {}
