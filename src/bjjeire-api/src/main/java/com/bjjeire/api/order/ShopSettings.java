package com.bjjeire.api.order;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * The shop's one settings document, {@code _id = "shop"} (specs/database-contracts/shop-settings.md). Until the
 * organiser saves it, delivery is free.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(ShopSettings.ENTITY_NAME)
public class ShopSettings {
    public static final String ENTITY_NAME = "ShopSettings";
    public static final String ID = "shop";

    @Id
    private String id;

    /** 0–5000. Copied onto each order when it is made, so a change applies to new orders only. */
    private int deliveryFeeCents;

    private Long version;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;
}
