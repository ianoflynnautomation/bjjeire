package com.bjjeire.api.event;

import java.time.Instant;
import java.util.List;

public record BjjEventSchedule(ScheduleKind kind, Instant startDate, Instant endDate, List<BjjEventSession> sessions) {}
