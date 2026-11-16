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
 * One competitor's entry in one division (data-model.md § TournamentRegistration). Public lists are built from its
 * snapshot fields, never from the private profile (FR-011, research R8).
 */
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Document(TournamentRegistration.ENTITY_NAME)
public class TournamentRegistration {
    public static final String ENTITY_NAME = "TournamentRegistration";

    /** Who cancelled when the system refunded a payment that arrived with no place left (research R5). */
    public static final String CANCELLED_BY_SYSTEM = "SYSTEM";

    /** Also the Stripe {@code client_reference_id}. */
    @Id
    private String id;

    private String tournamentId;
    private String divisionId;

    /** Null after account deletion. */
    private String competitorId;

    private RegistrationStatus status;

    /** True while awaiting payment or confirmed, absent otherwise: the partial unique index keys on it. */
    private Boolean active;

    /** Set while awaiting payment. */
    private Instant holdExpiresAt;

    /**
     * 0 or 1 while awaiting payment, absent otherwise. Unique per competitor and tournament
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
