package com.bjjeire.api.event;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.OpenEndedInstant;
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
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(BjjEvent.ENTITY_NAME)
public class BjjEvent {

    public static final String ENTITY_NAME = "BjjEvent";
    public static final Duration EXPIRY_GRACE = Duration.ofDays(365L * 2);

    @Id
    private String id;

    @Version
    private Long version;

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
        if (schedule == null || OpenEndedInstant.isOpen(schedule.endDate())) {
            return null;
        }
        return schedule.endDate().plus(EXPIRY_GRACE);
    }

    public void stampExpiry() {
        if (schedule != null) {
            schedule = new BjjEventSchedule(
                    schedule.kind(),
                    schedule.startDate(),
                    OpenEndedInstant.store(schedule.endDate()),
                    schedule.sessions());
        }
        expiresAt = computeExpiresAt();
    }
}
