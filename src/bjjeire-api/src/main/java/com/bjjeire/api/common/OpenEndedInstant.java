package com.bjjeire.api.common;

import java.time.Instant;

public final class OpenEndedInstant {
    public static final Instant VALUE = Instant.parse("9999-12-31T00:00:00Z");

    private OpenEndedInstant() {}

    public static boolean isOpen(Instant endDate) {
        return endDate == null || VALUE.equals(endDate);
    }

    public static Instant store(Instant endDate) {
        return endDate == null ? VALUE : endDate;
    }

    public static Instant expose(Instant endDate) {
        return isOpen(endDate) ? null : endDate;
    }
}
