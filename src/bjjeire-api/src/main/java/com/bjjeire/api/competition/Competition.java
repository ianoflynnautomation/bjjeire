package com.bjjeire.api.competition;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(Competition.ENTITY_NAME)
public class Competition {

    public static final String ENTITY_NAME = "Competition";
    public static final Duration EXPIRY_GRACE = Duration.ofDays(365L * 2);

    @Id
    private String id;

    @Field("expiresAt")
    private Instant expiresAt;

    private String slug;
    private String name;
    private String description;
    private String organisation;

    @Builder.Default
    private String country = "Ireland";

    private String websiteUrl;
    private String registrationUrl;
    private String logoUrl;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    private Instant startDate;
    private Instant endDate;

    @Builder.Default
    private boolean isActive = true;

    @Field("createdAt")
    private Instant createdOnUtc;

    @Field("createdBy")
    private String createdBy;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;

    public Instant computeExpiresAt() {
        return endDate != null ? endDate.plus(EXPIRY_GRACE) : null;
    }

    public void stampExpiry() {
        expiresAt = computeExpiresAt();
    }
}
