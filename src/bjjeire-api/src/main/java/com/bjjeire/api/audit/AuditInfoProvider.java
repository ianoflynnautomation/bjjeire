package com.bjjeire.api.audit;

import java.time.Instant;

public interface AuditInfoProvider {
    Instant currentInstant();

    String currentUser();

    String correlationId();
}
