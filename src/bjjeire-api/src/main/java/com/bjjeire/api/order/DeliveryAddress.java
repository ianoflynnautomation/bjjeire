package com.bjjeire.api.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Where an order goes: the Republic of Ireland or Northern Ireland only (FR-017). Personal data (GDPR). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAddress {
    private String name;
    private String line1;
    private String line2;
    private String town;
    private String county;
    private String postcode;

    /** {@code IE}, or {@code GB} with a {@code BT} postcode. */
    private String country;

    private String phone;
}
