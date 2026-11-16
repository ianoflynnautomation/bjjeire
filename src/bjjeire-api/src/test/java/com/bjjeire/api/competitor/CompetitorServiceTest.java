package com.bjjeire.api.competitor;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.Gender;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Instant;
import java.time.LocalDate;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class CompetitorServiceTest {
    private static final CompetitorIdentity CALLER = new CompetitorIdentity("iss", "sub", "a@example.test", "oid");

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private AuditInfoProvider auditInfoProvider;

    @Mock
    private AuditRecorder auditRecorder;

    @Mock
    private IdentityDirectory identityDirectory;

    /**
     * FR-013: a save authenticated just before the same person deleted their account must not leave a profile behind
     * that nobody can read or delete again.
     */
    @Test
    @Tag("#5012")
    void shouldRemoveAProfileSavedWhileTheAccountWasBeingDeleted() {
        CompetitorServiceImpl service = new CompetitorServiceImpl(
                mongoTemplate,
                auditInfoProvider,
                auditRecorder,
                identityDirectory,
                new SimpleMeterRegistry(),
                org.mockito.Mockito.mock(com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService.class),
                event -> {});
        given(auditInfoProvider.currentInstant()).willReturn(Instant.parse("2026-05-31T00:00:00Z"));
        given(mongoTemplate.exists(any(Query.class), eq(DeletedCompetitor.class)))
                .willReturn(true);

        assertThatThrownBy(() -> service.saveOwn(CALLER, command()))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        refused -> org.assertj.core.api.Assertions.assertThat(refused.getStatusCode())
                                .isEqualTo(HttpStatus.UNAUTHORIZED));
        assertThatThrownBy(() -> service.saveOwn(CALLER, command()))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        refused -> org.assertj.core.api.Assertions.assertThat(
                                        refused.getHeaders().getFirst("WWW-Authenticate"))
                                .isEqualTo("Bearer"));
        verify(mongoTemplate, org.mockito.Mockito.times(2))
                .findAndModify(
                        any(Query.class), any(Update.class), any(FindAndModifyOptions.class), eq(Competitor.class));
        verify(mongoTemplate, org.mockito.Mockito.times(2)).remove(any(Query.class), eq(Competitor.class));
        verify(auditRecorder, never()).record(any(), any(), any(), any(Long.class));
    }

    /** The profile was removed by a delete between the upsert and the read-back: refuse, never a 500. */
    @Test
    @Tag("#5012")
    void shouldRefuseRatherThanFailWhenTheProfileVanishedAfterTheSave() {
        CompetitorServiceImpl service = new CompetitorServiceImpl(
                mongoTemplate,
                auditInfoProvider,
                auditRecorder,
                identityDirectory,
                new SimpleMeterRegistry(),
                org.mockito.Mockito.mock(com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService.class),
                event -> {});
        given(auditInfoProvider.currentInstant()).willReturn(Instant.parse("2026-05-31T00:00:00Z"));

        assertThatThrownBy(() -> service.saveOwn(CALLER, command()))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        refused -> org.assertj.core.api.Assertions.assertThat(refused.getStatusCode())
                                .isEqualTo(HttpStatus.UNAUTHORIZED));
        verify(auditRecorder, never()).record(any(), any(), any(), any(Long.class));
    }

    /**
     * A first save can insert the profile after the delete looked for one and found none. The delete must remove by
     * identity after revoking it, not only the copy it read before.
     */
    @Test
    @Tag("#5012")
    void shouldRemoveByIdentityAfterRevokingSoARacingFirstSaveIsNotLeftBehind() {
        CompetitorServiceImpl service = new CompetitorServiceImpl(
                mongoTemplate,
                auditInfoProvider,
                auditRecorder,
                identityDirectory,
                new SimpleMeterRegistry(),
                org.mockito.Mockito.mock(com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService.class),
                event -> {});
        given(mongoTemplate.findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(DeletedCompetitor.class)))
                .willReturn(DeletedCompetitor.builder().id("tombstone").build());

        service.deleteOwn(CALLER);

        org.mockito.InOrder order = org.mockito.Mockito.inOrder(mongoTemplate);
        order.verify(mongoTemplate)
                .findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(DeletedCompetitor.class));
        order.verify(mongoTemplate).remove(any(Query.class), eq(Competitor.class));
    }

    private static SaveCompetitorCommand command() {
        return new SaveCompetitorCommand(
                "Aoife",
                null,
                "Byrne",
                "IE",
                LocalDate.of(1990, 4, 12),
                Gender.FEMALE,
                Belt.BLUE,
                null,
                null,
                null,
                null);
    }
}
