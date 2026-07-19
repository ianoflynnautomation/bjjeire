package com.bjjeire.api.event;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;

public record BjjEventSession(
        Instant date, WeekDay day, LocalTime startTime, LocalTime endTime, String title, List<BjjEventType> types) {}
