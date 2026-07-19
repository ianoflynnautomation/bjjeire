package com.bjjeire.api.event;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import java.time.Duration;
import java.time.Instant;
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
@Document("BjjEvent")
public class BjjEvent {
    // Grace period kept past the event's end date before Mongo's TTL monitor
    // hard-deletes the document. Preserves audit / historical-search semantics.
    public static final Duration EXPIRY_GRACE = Duration.ofDays(365L * 2);

    @Id
    private String id;

    @Field("expiresAt")
    private Instant expiresAt;

    private String name;
    private String description;
    private List<BjjEventType> types;
    private Organizer organiser;
    private EventStatus status;
    private String statusReason;
    private SocialMedia socialMedia;
    private County county;
    private Location location;
    private BjjEventSchedule schedule;
    private List<PricingModel> pricingOptions;
    private String eventUrl;
    private String imageUrl;

    @Field("isActive")
    private boolean active;

    @Field("createdAt")
    private Instant createdOnUtc;

    @Field("createdBy")
    private String createdBy;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;

    public Instant computeExpiresAt() {
        return schedule != null && schedule.endDate() != null
                ? schedule.endDate().plus(EXPIRY_GRACE)
                : null;
    }

    public void stampExpiry() {
        expiresAt = computeExpiresAt();
    }
}
