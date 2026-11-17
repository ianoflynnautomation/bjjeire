package com.bjjeire.api.bjjeirecompetition;

import java.time.Instant;
import java.util.List;

/** A recorded podium as the organiser sees it, by sign-up id. Admin only. */
public record DivisionResultDto(
        String goldRegistrationId,
        String silverRegistrationId,
        List<String> bronzeRegistrationIds,
        Instant recordedAt) {}
