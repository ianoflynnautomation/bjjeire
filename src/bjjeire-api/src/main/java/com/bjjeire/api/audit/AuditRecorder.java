package com.bjjeire.api.audit;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AuditRecorder {
    private final AuditLogRepository auditLogRepository;
    private final AuditInfoProvider auditInfoProvider;
    private final Counter auditFailures;

    public AuditRecorder(
            AuditLogRepository auditLogRepository, AuditInfoProvider auditInfoProvider, MeterRegistry meterRegistry) {
        this.auditLogRepository = auditLogRepository;
        this.auditInfoProvider = auditInfoProvider;
        this.auditFailures = Counter.builder("audit.record.failures")
                .description("Audit log writes that were swallowed after the repository threw")
                .register(meterRegistry);
    }

    public void record(AuditAction action, String entityType, String entityId, long affectedCount) {
        record(action, entityType, entityId, null, affectedCount);
    }

    public void record(
            AuditAction action, String entityType, String entityId, List<String> entityIds, long affectedCount) {
        try {
            auditLogRepository.save(AuditLogEntry.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .entityIds(entityIds)
                    .affectedCount(affectedCount)
                    .actor(auditInfoProvider.currentUser())
                    .correlationId(auditInfoProvider.correlationId())
                    .timestampUtc(auditInfoProvider.currentInstant())
                    .build());
        } catch (RuntimeException exception) {
            auditFailures.increment();
            log.warn(
                    "Audit record failed for action {} on {} (affected {})",
                    action,
                    entityType,
                    affectedCount,
                    exception);
        }
    }
}
