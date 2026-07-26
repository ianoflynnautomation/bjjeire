package com.bjjeire.api.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuditRecorderTest {
    private static final Instant NOW = Instant.parse("2026-07-18T06:00:00Z");

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditInfoProvider auditInfoProvider;

    private AuditRecorder recorder;
    private SimpleMeterRegistry meterRegistry;

    @BeforeEach
    void setUp() {
        given(auditInfoProvider.currentInstant()).willReturn(NOW);
        given(auditInfoProvider.currentUser()).willReturn("ops-user");
        given(auditInfoProvider.correlationId()).willReturn("trace-123");
        meterRegistry = new SimpleMeterRegistry();
        recorder = new AuditRecorder(auditLogRepository, auditInfoProvider, meterRegistry);
    }

    @Test
    void shouldPersistEntryWithActorCorrelationAndTimestampWhenRecording() {
        recorder.record(AuditAction.Delete, "BjjEvent", "665624c1ad01ce465c6cf789", 1);

        ArgumentCaptor<AuditLogEntry> entry = ArgumentCaptor.forClass(AuditLogEntry.class);
        then(auditLogRepository).should().save(entry.capture());
        assertThat(entry.getValue().getAction()).isEqualTo(AuditAction.Delete);
        assertThat(entry.getValue().getEntityType()).isEqualTo("BjjEvent");
        assertThat(entry.getValue().getEntityId()).isEqualTo("665624c1ad01ce465c6cf789");
        assertThat(entry.getValue().getAffectedCount()).isEqualTo(1);
        assertThat(entry.getValue().getActor()).isEqualTo("ops-user");
        assertThat(entry.getValue().getCorrelationId()).isEqualTo("trace-123");
        assertThat(entry.getValue().getTimestampUtc()).isEqualTo(NOW);
    }

    @Test
    void shouldSwallowRepositoryFailuresSoTheBusinessWriteNeverFails() {
        given(auditLogRepository.save(any())).willThrow(new IllegalStateException("mongo down"));

        assertThatCode(() -> recorder.record(AuditAction.UpdateMany, "Competition", null, 3))
                .doesNotThrowAnyException();
        assertThat(meterRegistry.counter("audit.record.failures").count()).isEqualTo(1.0);
    }
}
