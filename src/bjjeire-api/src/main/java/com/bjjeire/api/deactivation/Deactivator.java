package com.bjjeire.api.deactivation;

import java.time.Instant;

public interface Deactivator {
    String entityName();

    long deactivateExpired(Instant nowUtc);
}
