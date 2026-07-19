package com.bjjeire.api.audit;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class AuditRecorder {
    private final AuditLogRepository auditLogRepository;
    private final AuditInfoProvider auditInfoProvider;

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
            log.warn(
                    "Audit record failed for action {} on {} (affected {})",
                    action,
                    entityType,
                    affectedCount,
                    exception);
        }
    }
}
