package com.bjjeire.api.bjjeirecompetition;

import com.bjjeire.api.common.ValidObjectId;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Records or corrects a division's podium (FR-031). Replaces any result already recorded.
 *
 * @param silverRegistrationId absent when nobody took silver
 * @param bronzeRegistrationIds up to two; absent means none
 */
public record RecordResultCommand(
        @NotNull @ValidObjectId String goldRegistrationId,
        @ValidObjectId String silverRegistrationId,
        @Size(max = 2) List<@NotNull @Pattern(regexp = ValidObjectId.OBJECT_ID_PATTERN) String> bronzeRegistrationIds) {

    /** The bronzes, never null. */
    public List<String> bronzes() {
        return bronzeRegistrationIds == null ? List.of() : bronzeRegistrationIds;
    }
}
