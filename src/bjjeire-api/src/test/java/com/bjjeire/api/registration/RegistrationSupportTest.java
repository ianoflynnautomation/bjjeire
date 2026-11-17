package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionService;
import com.bjjeire.api.bjjeirecompetition.ResultService;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competitor.CompetitorService;
import com.bjjeire.api.web.ProblemTypes;
import java.time.Instant;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
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
 * A cancellation or move racing a result (FR-026): each checks for a result before its write, and again after it. When
 * the organiser saved a result naming the sign-up in between, the write is undone and refused.
 */
@ExtendWith(MockitoExtension.class)
class RegistrationSupportTest {
    private static final String COMPETITION = "665624c1ad01ce465c6cf456";
    private static final String REGISTRATION = "665624c1ad01ce465c6cf458";

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private BjjEireCompetitionService bjjEireCompetitionService;

    @Mock
    private CompetitorService competitorService;

    @Mock
    private RegistrationMailSender mailSender;

    @Mock
    private AuditInfoProvider auditInfoProvider;

    @Mock
    private AuditRecorder auditRecorder;

    @Mock
    private ApiCache cache;

    @Mock
    private ResultService resultService;

    private RegistrationSupport support;

    @BeforeEach
    void createSupport() {
        support = new RegistrationSupport(
                mongoTemplate,
                bjjEireCompetitionService,
                competitorService,
                mailSender,
                auditInfoProvider,
                auditRecorder,
                cache,
                resultService);
    }

    @Test
    @Tag("#5028")
    void shouldMoveTheSignUpBackWhenAResultNamedItWhileItWasMoving() {
        BjjEireCompetitionRegistration before = signUp("division-a", RegistrationStatus.CONFIRMED);
        given(auditInfoProvider.currentInstant()).willReturn(Instant.parse("2026-06-27T18:00:00Z"));
        given(mongoTemplate.findAndModify(
                        any(Query.class),
                        any(Update.class),
                        any(FindAndModifyOptions.class),
                        eq(BjjEireCompetitionRegistration.class)))
                .willReturn(signUp("division-b", RegistrationStatus.CONFIRMED));
        given(resultService.isNamedInResult(COMPETITION, REGISTRATION)).willReturn(true);

        assertThatThrownBy(() -> support.move(before, "division-b", false))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        refused -> assertThat(refused.getBody().getType()).isEqualTo(ProblemTypes.RESULT_RECORDED));

        ArgumentCaptor<Update> undo = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), undo.capture(), eq(BjjEireCompetitionRegistration.class));
        assertThat(undo.getValue().getUpdateObject().get("$set", Document.class).get("divisionId"))
                .isEqualTo("division-a");
    }

    @Test
    @Tag("#5028")
    void shouldRestoreTheSignUpWhenAResultNamedItWhileItWasBeingCancelled() {
        BjjEireCompetitionRegistration cancelled = signUp("division-a", RegistrationStatus.CANCELLED);
        given(resultService.isNamedInResult(COMPETITION, REGISTRATION)).willReturn(true);

        assertThatThrownBy(() -> support.undoCancellationIfMedallist(cancelled))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        refused -> assertThat(refused.getBody().getType()).isEqualTo(ProblemTypes.RESULT_RECORDED));

        ArgumentCaptor<Update> undo = ArgumentCaptor.forClass(Update.class);
        verify(mongoTemplate).updateFirst(any(Query.class), undo.capture(), eq(BjjEireCompetitionRegistration.class));
        Document set = undo.getValue().getUpdateObject().get("$set", Document.class);
        assertThat(set.get("status")).isEqualTo(RegistrationStatus.CONFIRMED);
        assertThat(set.get("active")).isEqualTo(Boolean.TRUE);
        assertThat(undo.getValue().getUpdateObject().get("$unset", Document.class))
                .containsKeys("cancelledAt", "cancelledBy", "refund");
    }

    @Test
    void shouldKeepACancellationNoResultNames() {
        given(resultService.isNamedInResult(COMPETITION, REGISTRATION)).willReturn(false);

        support.undoCancellationIfMedallist(signUp("division-a", RegistrationStatus.CANCELLED));

        org.mockito.Mockito.verifyNoInteractions(mongoTemplate);
    }

    private static BjjEireCompetitionRegistration signUp(String divisionId, RegistrationStatus status) {
        return BjjEireCompetitionRegistration.builder()
                .id(REGISTRATION)
                .competitionId(COMPETITION)
                .divisionId(divisionId)
                .status(status)
                .build();
    }
}
