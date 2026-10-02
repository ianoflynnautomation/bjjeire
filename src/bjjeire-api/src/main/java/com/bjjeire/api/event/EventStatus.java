package com.bjjeire.api.event;

import java.util.EnumSet;
import java.util.List;

public enum EventStatus {
    Postponed,
    Upcoming,
    RegistrationOpen,
    RegistrationClosed,
    Ongoing,
    Completed,
    Canceled;

    private static final List<EventStatus> LISTABLE = List.copyOf(EnumSet.complementOf(EnumSet.of(Completed)));

    public static List<EventStatus> listable() {
        return LISTABLE;
    }
}
