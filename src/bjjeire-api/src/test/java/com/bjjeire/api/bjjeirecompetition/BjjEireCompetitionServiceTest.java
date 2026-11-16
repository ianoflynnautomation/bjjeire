package com.bjjeire.api.bjjeirecompetition;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.common.PaginationRequest;
import com.bjjeire.api.common.UriService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

@ExtendWith(MockitoExtension.class)
class BjjEireCompetitionServiceTest {
    private static final String ID = "665624c1ad01ce465c6cf456";

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private AuditInfoProvider auditInfoProvider;

    @Mock
    private AuditRecorder auditRecorder;

    @Mock
    private UriService uriService;

    @Mock
    private DivisionSignUps divisionSignUps;

    private BjjEireCompetitionServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new BjjEireCompetitionServiceImpl(
                mongoTemplate,
                auditInfoProvider,
                auditRecorder,
                new ApiCache(),
                uriService,
                Clock.fixed(Instant.parse("2026-05-31T00:00:00Z"), ZoneOffset.UTC),
                divisionSignUps);
    }

    /**
     * The publish rules are checked on a copy read before the write. An edit that empties the divisions in between must
     * not let an empty competition through, so the write itself requires a division.
     */
    @Test
    void shouldPublishOnlyADraftThatStillHasADivisionWhenItIsWritten() {
        BjjEireCompetition draft = BjjEireCompetitionTestData.competition(
                "bjjeire", BjjEireCompetitionStatus.DRAFT, LocalDate.parse("2026-06-27"));
        draft.setId(ID);
        given(mongoTemplate.findById(ID, BjjEireCompetition.class)).willReturn(draft);

        // ApiExceptionHandler answers this with 409 urn:bjjeire:conflict.
        assertThatThrownBy(() -> service.publish(ID)).isInstanceOf(OptimisticLockingFailureException.class);

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate)
                .findAndModify(
                        query.capture(),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class));
        Document filter = query.getValue().getQueryObject();
        assertThat(filter.get("_id")).isEqualTo(ID);
        assertThat(filter.get("divisions.0", Document.class)).containsEntry("$exists", true);
    }

    /**
     * Publish checks the window on the copy it read. Guarding on that copy's version means any edit in between, a
     * window change included, makes the publish fail instead of publishing what was not checked.
     */
    @Test
    void shouldPublishOnlyTheVersionWhoseWindowWasChecked() {
        BjjEireCompetition draft = BjjEireCompetitionTestData.competition(
                "bjjeire", BjjEireCompetitionStatus.DRAFT, LocalDate.parse("2026-06-27"));
        draft.setId(ID);
        draft.setVersion(4L);
        given(mongoTemplate.findById(ID, BjjEireCompetition.class)).willReturn(draft);

        assertThatThrownBy(() -> service.publish(ID)).isInstanceOf(RuntimeException.class);

        ArgumentCaptor<Query> query = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate)
                .findAndModify(
                        query.capture(),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class));
        assertThat(query.getValue().getQueryObject().get("version")).isEqualTo(4L);
    }

    /**
     * #3006, #3007, research R3: the upcoming list is cached, but a page cached on the competition day is not served
     * after midnight in Ireland. The next read asks Mongo again with the new Irish date.
     */
    @Test
    @Tag("#3006")
    @Tag("#3007")
    void shouldStopServingYesterdaysCachedUpcomingListAtMidnightInIreland() {
        AtomicReference<Instant> now = new AtomicReference<>(Instant.parse("2026-06-27T22:59:00Z"));
        Clock moving = new Clock() {
            @Override
            public ZoneId getZone() {
                return ZoneOffset.UTC;
            }

            @Override
            public Clock withZone(ZoneId zone) {
                return this;
            }

            @Override
            public Instant instant() {
                return now.get();
            }
        };
        BjjEireCompetitionServiceImpl movingService = new BjjEireCompetitionServiceImpl(
                mongoTemplate, auditInfoProvider, auditRecorder, new ApiCache(), uriService, moving, divisionSignUps);
        given(mongoTemplate.find(any(Query.class), eq(BjjEireCompetition.class)))
                .willReturn(List.of());

        movingService.getUpcoming(new PaginationRequest(1, 100), "/api/v1/bjjeire-competition");
        movingService.getUpcoming(new PaginationRequest(1, 100), "/api/v1/bjjeire-competition");
        now.set(Instant.parse("2026-06-27T23:00:00Z"));
        movingService.getUpcoming(new PaginationRequest(1, 100), "/api/v1/bjjeire-competition");

        ArgumentCaptor<Query> queries = ArgumentCaptor.forClass(Query.class);
        verify(mongoTemplate, times(2)).find(queries.capture(), eq(BjjEireCompetition.class));
        Document first = queries.getAllValues().get(0).getQueryObject();
        Document second = queries.getAllValues().get(1).getQueryObject();
        assertThat(first.get("status")).isEqualTo(BjjEireCompetitionStatus.PUBLISHED);
        assertThat(first.get("date", Document.class)).containsEntry("$gte", LocalDate.parse("2026-06-27"));
        assertThat(second.get("date", Document.class)).containsEntry("$gte", LocalDate.parse("2026-06-28"));
    }
}
