package com.bjjeire.api.bjjeirecompetition;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A division's podium (FR-031), embedded in its {@link Division}. Each id is a sign-up that was confirmed in this
 * division when the result was recorded, and no id appears twice.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DivisionResult {
    private String goldRegistrationId;

    /** Null when nobody took silver. */
    private String silverRegistrationId;

    /** Zero, one or two. */
    @Builder.Default
    private List<String> bronzeRegistrationIds = new ArrayList<>();

    /**
     * Confirmed competitors in the division when the result was recorded or last corrected. Fewer than two means its
     * medals add no team points (FR-035); a later cancellation or move does not change that.
     */
    private Integer confirmedCompetitors;

    private Instant recordedAt;
    private String recordedBy;

    /** Every sign-up the result names, gold first. */
    public List<String> medallistIds() {
        List<String> ids = new ArrayList<>();
        ids.add(goldRegistrationId);
        if (silverRegistrationId != null) {
            ids.add(silverRegistrationId);
        }
        if (bronzeRegistrationIds != null) {
            ids.addAll(bronzeRegistrationIds);
        }
        return ids;
    }
}
