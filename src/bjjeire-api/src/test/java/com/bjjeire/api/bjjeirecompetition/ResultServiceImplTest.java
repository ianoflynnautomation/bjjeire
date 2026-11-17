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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.web.server.ResponseStatusException;

/**
 * A result and a cancellation racing (FR-026): the result is written only after the medallists were seen confirmed, so
 * it checks them again after the write and undoes itself when one was cancelled or moved meanwhile.
 */
@ExtendWith(MockitoExtension.class)
class ResultServiceImplTest {
    private static final String COMPETITION = "665624c1ad01ce465c6cf456";
    private static final String DIVISION = "665624c1ad01ce465c6cf457";
    private static final String GOLD = "665624c1ad01ce465c6cf458";

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private AuditInfoProvider auditInfoProvider;

    @Mock
    private AuditRecorder auditRecorder;

    @Mock
    private ApiCache cache;

    @Mock
    private DivisionSignUps divisionSignUps;

    @Test
    @Tag("#5028")
    void shouldUndoTheResultWhenAMedallistWasCancelledWhileItWasBeingWritten() {
        BjjEireCompetition before = competition(0L, null);
        BjjEireCompetition written = competition(
                1L,
                DivisionResult.builder()
                        .goldRegistrationId(GOLD)
                        .confirmedCompetitors(1)
                        .build());
        given(mongoTemplate.findById(COMPETITION, BjjEireCompetition.class)).willReturn(before);
        given(auditInfoProvider.currentInstant()).willReturn(Instant.parse("2026-06-27T18:00:00Z"));
        given(auditInfoProvider.currentUser()).willReturn("organiser");
        ResultEntrant gold = new ResultEntrant(GOLD, DIVISION, "Aoife Byrne", "Team X", null, "name:team x", null);
        // Confirmed when checked, cancelled by the time the result is saved.
        given(divisionSignUps.confirmed(COMPETITION)).willReturn(List.of(gold), List.of());
        given(mongoTemplate.findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class)))
                .willReturn(written, competition(2L, null));
        ResultServiceImpl service =
                new ResultServiceImpl(mongoTemplate, auditInfoProvider, auditRecorder, cache, divisionSignUps);

        assertThatThrownBy(() -> service.record(COMPETITION, DIVISION, new RecordResultCommand(GOLD, null, null)))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        refused -> assertThat(refused.getBody().getType())
                                .isEqualTo(com.bjjeire.api.web.ProblemTypes.NOT_IN_DIVISION));

        ArgumentCaptor<Update> updates = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate, times(2))
                .findAndModify(
                        any(Query.class),
                        updates.capture(),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class));
        @SuppressWarnings("unchecked")
        List<Division> restored = (List<Division>) updates.getAllValues()
                .get(1)
                .getUpdateObject()
                .get("$set", org.bson.Document.class)
                .get("divisions");
        assertThat(restored.getFirst().getResult()).isNull();
    }

    /**
     * Another organiser save lands between the result write and its undo, so the undo's version guard misses. The undo
     * reads the competition again and, as the stored result is still the one just written, puts the earlier one back.
     */
    @Test
    @Tag("#5028")
    void shouldRetryTheUndoWhenAnotherSaveChangedTheCompetitionMeanwhile() {
        DivisionResult written = writtenResult();
        BjjEireCompetition before = competition(0L, null);
        // Another division's result, say, was saved after ours: version 2, our result still in place.
        BjjEireCompetition changedByAnotherSave = competition(2L, writtenResult());
        given(mongoTemplate.findById(COMPETITION, BjjEireCompetition.class)).willReturn(before, changedByAnotherSave);
        given(auditInfoProvider.currentInstant()).willReturn(RECORDED_AT);
        given(auditInfoProvider.currentUser()).willReturn("organiser");
        given(divisionSignUps.confirmed(COMPETITION)).willReturn(List.of(goldEntrant()), List.of());
        given(mongoTemplate.findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class)))
                .willReturn(competition(1L, written), null, competition(3L, null));
        ResultServiceImpl service =
                new ResultServiceImpl(mongoTemplate, auditInfoProvider, auditRecorder, cache, divisionSignUps);

        assertThatThrownBy(() -> service.record(COMPETITION, DIVISION, new RecordResultCommand(GOLD, null, null)))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        refused -> assertThat(refused.getBody().getType())
                                .isEqualTo(com.bjjeire.api.web.ProblemTypes.NOT_IN_DIVISION));

        ArgumentCaptor<Query> queries = ArgumentCaptor.forClass(Query.class);
        ArgumentCaptor<Update> updates = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate, times(3))
                .findAndModify(
                        queries.capture(),
                        updates.capture(),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class));
        // The retry is guarded by the version it read again, and restores the earlier result (none).
        assertThat(queries.getAllValues().get(2).getQueryObject().get("version"))
                .isEqualTo(2L);
        assertThat(restoredDivisions(updates.getAllValues().get(2)).getFirst().getResult())
                .isNull();
        verify(cache).removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
    }

    /**
     * The clock has sub-millisecond precision, but Mongo stores an instant to the millisecond: the result read back
     * must still be recognised as the one just written, or the undo is never retried.
     */
    @Test
    @Tag("#5028")
    void shouldRecogniseTheWrittenResultAfterMongoTruncatedItsInstantToMilliseconds() {
        Instant precise = Instant.parse("2026-06-27T18:00:00.123456789Z");
        DivisionResult asStored = DivisionResult.builder()
                .goldRegistrationId(GOLD)
                .confirmedCompetitors(1)
                .recordedAt(Instant.parse("2026-06-27T18:00:00.123Z"))
                .recordedBy("organiser")
                .build();
        given(mongoTemplate.findById(COMPETITION, BjjEireCompetition.class))
                .willReturn(competition(0L, null), competition(2L, asStored));
        given(auditInfoProvider.currentInstant()).willReturn(precise);
        given(auditInfoProvider.currentUser()).willReturn("organiser");
        given(divisionSignUps.confirmed(COMPETITION)).willReturn(List.of(goldEntrant()), List.of());
        given(mongoTemplate.findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class)))
                .willReturn(competition(1L, asStored), null, competition(3L, null));
        ResultServiceImpl service =
                new ResultServiceImpl(mongoTemplate, auditInfoProvider, auditRecorder, cache, divisionSignUps);

        assertThatThrownBy(() -> service.record(COMPETITION, DIVISION, new RecordResultCommand(GOLD, null, null)))
                .isInstanceOf(ResponseStatusException.class);

        // Written, refused, retried against the re-read version: three writes.
        verify(mongoTemplate, times(3))
                .findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class));
    }

    /** The organiser already replaced the result before the undo could run: the newer result stays. */
    @Test
    @Tag("#5033")
    void shouldLeaveANewerResultAloneWhenTheUndoFindsItReplaced() {
        DivisionResult written = writtenResult();
        DivisionResult newer = DivisionResult.builder()
                .goldRegistrationId("665624c1ad01ce465c6cf459")
                .confirmedCompetitors(1)
                .recordedAt(RECORDED_AT.plusSeconds(1))
                .recordedBy("organiser")
                .build();
        given(mongoTemplate.findById(COMPETITION, BjjEireCompetition.class))
                .willReturn(competition(0L, null), competition(2L, newer));
        given(auditInfoProvider.currentInstant()).willReturn(RECORDED_AT);
        given(auditInfoProvider.currentUser()).willReturn("organiser");
        given(divisionSignUps.confirmed(COMPETITION)).willReturn(List.of(goldEntrant()), List.of());
        given(mongoTemplate.findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class)))
                .willReturn(competition(1L, written), (BjjEireCompetition) null);
        ResultServiceImpl service =
                new ResultServiceImpl(mongoTemplate, auditInfoProvider, auditRecorder, cache, divisionSignUps);

        assertThatThrownBy(() -> service.record(COMPETITION, DIVISION, new RecordResultCommand(GOLD, null, null)))
                .isInstanceOf(ResponseStatusException.class);

        verify(mongoTemplate, times(2))
                .findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetition.class));
        verify(cache).removeByTag(ApiCache.BJJEIRE_COMPETITIONS_TAG);
    }

    private static final Instant RECORDED_AT = Instant.parse("2026-06-27T18:00:00Z");

    private static DivisionResult writtenResult() {
        return DivisionResult.builder()
                .goldRegistrationId(GOLD)
                .confirmedCompetitors(1)
                .recordedAt(RECORDED_AT)
                .recordedBy("organiser")
                .build();
    }

    private static ResultEntrant goldEntrant() {
        return new ResultEntrant(GOLD, DIVISION, "Aoife Byrne", "Team X", null, "name:team x", null);
    }

    @SuppressWarnings("unchecked")
    private static List<Division> restoredDivisions(Update update) {
        return (List<Division>)
                update.getUpdateObject().get("$set", org.bson.Document.class).get("divisions");
    }

    private static BjjEireCompetition competition(long version, DivisionResult result) {
        return BjjEireCompetition.builder()
                .id(COMPETITION)
                .status(BjjEireCompetitionStatus.PUBLISHED)
                .version(version)
                .divisions(new ArrayList<>(
                        List.of(Division.builder().id(DIVISION).result(result).build())))
                .build();
    }
}
