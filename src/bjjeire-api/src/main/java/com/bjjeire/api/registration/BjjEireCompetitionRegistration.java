package com.bjjeire.api.registration;

import com.bjjeire.api.competitor.Academy;
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
 * One competitor's entry in one division (data-model.md § BjjEireCompetitionRegistration). Public lists are built from
 * its snapshot fields, never from the private profile (FR-011, research R8).
 */
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Document(BjjEireCompetitionRegistration.ENTITY_NAME)
public class BjjEireCompetitionRegistration {
    public static final String ENTITY_NAME = "BjjEireCompetitionRegistration";

    /** Who cancelled when the system refunded a payment that arrived with no place left (research R5). */
    public static final String CANCELLED_BY_SYSTEM = "SYSTEM";

    /** The competitor cancelled their own sign-up. */
    public static final String CANCELLED_BY_COMPETITOR = "COMPETITOR";

    /** The organiser cancelled this one sign-up (FR-007). */
    public static final String CANCELLED_BY_ADMIN = "ADMIN";

    /** The organiser cancelled the whole competition (FR-029). */
    public static final String CANCELLED_BY_COMPETITION = "COMPETITION";

    /** Shown in place of the name once the competitor deleted their account (research R11). */
    public static final String DELETED_DISPLAY_NAME = "Former competitor";

    /** Also the Stripe {@code client_reference_id}. */
    @Id
    private String id;

    private String competitionId;
    private String divisionId;

    /** Null after account deletion. */
    private String competitorId;

    private RegistrationStatus status;

    /** True while awaiting payment or confirmed, absent otherwise: the partial unique index keys on it. */
    private Boolean active;

    /** Set while awaiting payment. */
    private Instant holdExpiresAt;

    /**
     * 0 or 1 while awaiting payment, absent otherwise. Unique per competitor and competition
     * ({@code ux_registration_unpaid_slot}), so the database allows at most two unpaid sign-ups at once (FR-041).
     */
    private Integer unpaidSlot;

    private String displayName;
    private Academy academy;
    private String affiliation;
    private String academyKey;
    private String affiliationKey;

    /** The profile's belt or gender no longer fits the division (spec edge case). */
    private boolean profileMismatch;

    private Instant acceptedPublicListingAt;
    private Instant acceptedTermsAt;

    private Payment payment;
    private Refund refund;

    private Instant cancelledAt;
    private String cancelledBy;

    private Instant financialRecordsExpireAt;

    @Field("createdAt")
    private Instant createdOnUtc;

    @Field("createdBy")
    private String createdBy;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;
}
