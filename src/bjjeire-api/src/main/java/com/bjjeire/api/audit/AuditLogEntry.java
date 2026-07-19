package com.bjjeire.api.audit;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document("AuditLog")
public class AuditLogEntry {
    @Id
    private String id;

    private AuditAction action;
    private String entityType;
    private String entityId;
    private List<String> entityIds;
    private long affectedCount;

    @Builder.Default
    private String actor = "system";

    private String correlationId;
    private Instant timestampUtc;
}
