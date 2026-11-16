package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.ApiRoutes;
import java.time.Duration;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** Account deletion anonymises sign-ups and keeps payment records for six years (FR-013, research R11). */
class FinancialRetentionIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");

    @Autowired
    private FinancialRecordsSweep sweep;

    @Test
    @Tag("#5012")
    void shouldAnonymiseTheSignUpsAndKeepTheirPaymentRecordsForSixYears() {
        BjjEireCompetitionRegistration cancelled = cancelledSignUp(AOIFE, "Aoife", "retention-delete");

        ResponseEntity<String> deleted = restTemplate.exchange(
                ApiRoutes.COMPETITOR + "/me", HttpMethod.DELETE, jsonEntity("", AOIFE), String.class);

        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        BjjEireCompetitionRegistration anonymised = reload(cancelled);
        assertThat(anonymised.getCompetitorId()).isNull();
        assertThat(anonymised.getDisplayName()).isEqualTo(BjjEireCompetitionRegistration.DELETED_DISPLAY_NAME);
        assertThat(anonymised.getFinancialRecordsExpireAt())
                .isEqualTo(FIXED_NOW.atOffset(ZoneOffset.UTC).plusYears(6).toInstant());
        assertThat(anonymised.getPayment().getAmountCents()).isEqualTo(2500);
        assertThat(anonymised.getRefund().getAmountCents()).isEqualTo(2500);
        assertThat(anonymised.getDivisionId()).isEqualTo(cancelled.getDivisionId());
    }

    @Test
    @Tag("#5012")
    void shouldRemovePaymentAndRefundOnlyFromSignUpsPastTheirRetention() {
        BjjEireCompetitionRegistration expired = cancelledSignUp(AOIFE, "Aoife", "retention-past");
        BjjEireCompetitionRegistration kept = cancelledSignUp(CIARAN, "Ciaran", "retention-future");
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(expired.getId())),
                new Update()
                        .set("financialRecordsExpireAt", FIXED_NOW.minus(Duration.ofSeconds(1)))
                        .unset("competitorId")
                        .set("displayName", BjjEireCompetitionRegistration.DELETED_DISPLAY_NAME),
                BjjEireCompetitionRegistration.class);
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(kept.getId())),
                Update.update("financialRecordsExpireAt", FIXED_NOW.plus(Duration.ofDays(1))),
                BjjEireCompetitionRegistration.class);

        int removed = sweep.sweep();

        assertThat(removed).isEqualTo(1);
        BjjEireCompetitionRegistration swept = reload(expired);
        assertThat(swept.getPayment()).isNull();
        assertThat(swept.getRefund()).isNull();
        assertThat(swept.getDisplayName()).isEqualTo(BjjEireCompetitionRegistration.DELETED_DISPLAY_NAME);
        assertThat(swept.getDivisionId()).isEqualTo(expired.getDivisionId());
        assertThat(swept.getStatus()).isEqualTo(RegistrationStatus.CANCELLED);
        assertThat(reload(kept).getPayment()).isNotNull();
        assertThat(reload(kept).getRefund()).isNotNull();
        assertThat(sweep.sweep()).isZero();
    }

    private BjjEireCompetitionRegistration cancelledSignUp(String token, String name, String slug) {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition(slug, null, division);
        saveProfile(token, name, Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        BjjEireCompetitionRegistration confirmed = confirmedSignUp(token, competition, division);
        assertThat(cancel(token, confirmed.getId()).getStatusCode()).isEqualTo(HttpStatus.OK);
        return reload(confirmed);
    }
}
