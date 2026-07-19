package com.bjjeire.api.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;

import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.County;
import com.bjjeire.api.common.UriService;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

@ExtendWith(MockitoExtension.class)
class BjjEventServiceTest {
    private static final String EVENT_ID = "665624c1ad01ce465c6cf789";
    private static final Instant NOW = Instant.parse("2026-06-03T06:00:00Z");
    private static final Instant END_DATE = Instant.parse("2026-08-01T12:00:00Z");
    private static final String AUDIT_USER = "audit-user";

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private AuditInfoProvider auditInfoProvider;

    @Mock
    private AuditRecorder auditRecorder;

    @Mock
    private UriService uriService;

    private ApiCache cache;
    private BjjEventService service;

    @BeforeEach
    void setUp() {
        cache = new ApiCache();
        service = new BjjEventService(
                mongoTemplate, Clock.systemUTC(), auditInfoProvider, auditRecorder, cache, uriService);
    }

    @Test
    void shouldStampAuditFieldsWhenCreatingEvent() {
        givenAuditContext();
        givenSaveReturnsItsArgument();

        CreateBjjEventResponse response = service.create(new CreateBjjEventCommand(dto(EVENT_ID)));

        BjjEvent saved = capturedSave();
        assertThat(saved.getCreatedOnUtc()).isEqualTo(NOW);
        assertThat(saved.getCreatedBy()).isEqualTo(AUDIT_USER);
        assertThat(response.data().id()).isEqualTo(EVENT_ID);
    }

    @Test
    void shouldStampExpiryFromScheduleEndDateWhenCreatingEvent() {
        givenAuditContext();
        givenSaveReturnsItsArgument();

        service.create(new CreateBjjEventCommand(dto(EVENT_ID)));

        assertThat(capturedSave().getExpiresAt()).isEqualTo(END_DATE.plus(BjjEvent.EXPIRY_GRACE));
    }

    @Test
    void shouldApplyChangesAndAuditFieldsWhenUpdatingExistingEvent() {
        givenAuditContext();
        givenSaveReturnsItsArgument();
        BjjEvent existing = existingEvent(EVENT_ID, "Old Name");
        given(mongoTemplate.findById(EVENT_ID, BjjEvent.class)).willReturn(existing);

        Optional<UpdateBjjEventResponse> response = service.update(EVENT_ID, new UpdateBjjEventCommand(dto("ignored")));

        assertThat(response).isPresent();
        assertThat(response.orElseThrow().data().id()).isEqualTo(EVENT_ID);
        assertThat(response.orElseThrow().data().name()).isEqualTo("Dublin Open Mat");
        assertThat(existing.getUpdatedOnUtc()).isEqualTo(NOW);
        assertThat(existing.getUpdatedBy()).isEqualTo(AUDIT_USER);
        assertThat(existing.getExpiresAt()).isEqualTo(END_DATE.plus(BjjEvent.EXPIRY_GRACE));
    }

    @Test
    void shouldReturnEmptyWithoutSavingWhenUpdatingMissingEvent() {
        given(mongoTemplate.findById("missing", BjjEvent.class)).willReturn(null);

        Optional<UpdateBjjEventResponse> response =
                service.update("missing", new UpdateBjjEventCommand(dto("missing")));

        assertThat(response).isEmpty();
        then(mongoTemplate).should(never()).save(any(BjjEvent.class));
    }

    @Test
    void shouldServeRepeatGetByIdFromCache() {
        given(mongoTemplate.findById(EVENT_ID, BjjEvent.class)).willReturn(existingEvent(EVENT_ID, "Cached Event"));

        assertThat(service.getById(EVENT_ID)).isPresent();
        assertThat(service.getById(EVENT_ID)).isPresent();

        then(mongoTemplate).should(times(1)).findById(EVENT_ID, BjjEvent.class);
    }

    @Test
    void shouldPrimeByIdCacheOnCreateSoFollowUpReadSkipsMongo() {
        givenAuditContext();
        givenSaveReturnsItsArgument();

        service.create(new CreateBjjEventCommand(dto(EVENT_ID)));
        Optional<BjjEventDto> cachedRead = service.getById(EVENT_ID);

        assertThat(cachedRead).isPresent();
        then(mongoTemplate).should(never()).findById(EVENT_ID, BjjEvent.class);
    }

    @Test
    void shouldEvictCachedEntryWhenDeletingEvent() {
        given(mongoTemplate.findById(EVENT_ID, BjjEvent.class)).willReturn(existingEvent(EVENT_ID, "Cached Event"));
        assertThat(service.getById(EVENT_ID)).isPresent();

        service.delete(EVENT_ID);
        given(mongoTemplate.findById(EVENT_ID, BjjEvent.class)).willReturn(null);

        assertThat(service.getById(EVENT_ID)).isEmpty();
    }

    @Test
    void shouldRemoveEventWhenDeletingExistingEvent() {
        BjjEvent existing = existingEvent(EVENT_ID, "Doomed Event");
        given(mongoTemplate.findById(EVENT_ID, BjjEvent.class)).willReturn(existing);

        boolean deleted = service.delete(EVENT_ID);

        assertThat(deleted).isTrue();
        then(mongoTemplate).should().remove(existing);
    }

    @Test
    void shouldReturnFalseWhenDeletingMissingEvent() {
        given(mongoTemplate.findById("missing", BjjEvent.class)).willReturn(null);

        boolean deleted = service.delete("missing");

        assertThat(deleted).isFalse();
    }

    private void givenAuditContext() {
        given(auditInfoProvider.currentInstant()).willReturn(NOW);
        given(auditInfoProvider.currentUser()).willReturn(AUDIT_USER);
    }

    private void givenSaveReturnsItsArgument() {
        given(mongoTemplate.save(any(BjjEvent.class))).willAnswer(invocation -> invocation.getArgument(0));
    }

    private BjjEvent capturedSave() {
        ArgumentCaptor<BjjEvent> event = ArgumentCaptor.forClass(BjjEvent.class);
        then(mongoTemplate).should().save(event.capture());
        return event.getValue();
    }

    private static BjjEvent existingEvent(String id, String name) {
        BjjEvent event = new BjjEvent();
        event.setId(id);
        event.setName(name);
        return event;
    }

    private static BjjEventDto dto(String id) {
        return new BjjEventDto(
                id,
                "Dublin Open Mat",
                "Open training session",
                List.of(BjjEventType.OpenMat),
                new Organizer("BJJ Eire", "https://bjjeire.com"),
                EventStatus.Upcoming,
                null,
                null,
                County.Dublin,
                null,
                new BjjEventSchedule(
                        ScheduleKind.FixedDates, Instant.parse("2026-08-01T10:00:00Z"), END_DATE, List.of()),
                List.of(new PricingModel(PricingType.Free, null, null, BigDecimal.ZERO, null, null)),
                "https://example.com/events/open-mat",
                null,
                true);
    }
}
