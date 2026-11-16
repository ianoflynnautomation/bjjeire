package com.bjjeire.api.registration;

import static com.bjjeire.api.testsupport.RetiredNames.OLD_NAME;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.AgeCategory;
import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.Discipline;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.registration.PaymentGateway.CheckoutRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Starting a sign-up: every refusal, and what a successful start stores and sends to Stripe (User Story 3). */
class RegistrationIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String CIARAN = competitorToken("ciaran");

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @Tag("#5015")
    void shouldTakeAPlaceAndReturnACheckoutUrlWhenASignUpStarts() throws Exception {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("start", 10, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        ResponseEntity<String> response = signUp(AOIFE, competition.getId(), division.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = objectMapper.readTree(response.getBody());
        BjjEireCompetitionRegistration stored = onlyRegistration();
        assertThat(body.at("/registrationId").asString()).isEqualTo(stored.getId());
        assertThat(body.at("/checkoutUrl").asString()).startsWith("https://checkout.stripe.test/");
        assertThat(Instant.parse(body.at("/holdExpiresAt").asString()))
                .isEqualTo(FIXED_NOW.plus(Duration.ofMinutes(30)));

        assertThat(stored.getStatus()).isEqualTo(RegistrationStatus.AWAITING_PAYMENT);
        assertThat(stored.getActive()).isTrue();
        assertThat(stored.getCompetitionId()).isEqualTo(competition.getId());
        assertThat(stored.getDivisionId()).isEqualTo(division.getId());
        assertThat(stored.getDisplayName()).isEqualTo("Aoife Byrne");
        assertThat(stored.getAcademy().name()).isEqualTo("Team X");
        assertThat(stored.getAcademyKey()).isEqualTo("name:team x");
        assertThat(stored.getAffiliation()).isEqualTo("Alliance");
        assertThat(stored.getAffiliationKey()).isEqualTo("alliance");
        assertThat(stored.getAcceptedPublicListingAt()).isEqualTo(FIXED_NOW);
        assertThat(stored.getAcceptedTermsAt()).isEqualTo(FIXED_NOW);
        assertThat(stored.getPayment().getStatus()).isEqualTo(PaymentStatus.PENDING);
        assertThat(stored.getPayment().getCheckoutSessionId()).startsWith("cs_test_");
        assertThat(placesTaken(competition.getId())).isEqualTo(1);
        // Only the webhook confirms; nothing is mailed yet.
        assertThat(mailer.sent()).isEmpty();
    }

    @Test
    @Tag("#5015")
    void shouldSendStripeTheBjjEireCompetitionsFeeNeverAClientValue() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("fee", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        String body = """
            { "competitionId": "%s", "divisionId": "%s", "acceptPublicListing": true, "acceptTerms": true,
              "amountCents": 1, "entryFeeCents": 1 }
            """.formatted(competition.getId(), division.getId());

        restTemplate.exchange(ApiRoutes.REGISTRATION, HttpMethod.POST, jsonEntity(body, AOIFE), String.class);

        CheckoutRequest sent = paymentGateway.checkouts().getFirst();
        BjjEireCompetitionRegistration stored = onlyRegistration();
        assertThat(sent.amountCents()).isEqualTo(2500);
        assertThat(sent.currency()).isEqualTo("EUR");
        assertThat(sent.registrationId()).isEqualTo(stored.getId());
        assertThat(sent.competitionId()).isEqualTo(competition.getId());
        assertThat(sent.divisionId()).isEqualTo(division.getId());
        assertThat(sent.customerEmail()).isEqualTo(competitorEmail("aoife"));
        // Stripe refuses an expiry under 30 minutes after it creates the session; the margin keeps the request valid.
        assertThat(sent.expiresAt()).isEqualTo(stored.getHoldExpiresAt().plus(Duration.ofMinutes(2)));
        assertThat(sent.idempotencyKey()).isEqualTo("checkout-" + stored.getId() + "-1");
        assertThat(sent.successUrl())
                .isEqualTo("http://localhost:5173/competitions/fee/signup/complete?registration=" + stored.getId());
        assertThat(sent.cancelUrl())
                .isEqualTo("http://localhost:5173/competitions/fee/signup?registration=" + stored.getId());
        assertThat(sent.description())
                .contains("BjjEire fee")
                .contains("-76 kg")
                .doesNotContainIgnoringCase(OLD_NAME);
        assertThat(stored.getPayment().getAmountCents()).isEqualTo(2500);
    }

    @Test
    @Tag("#5015")
    void shouldKeepThePriceAlreadyPaidWhenTheOrganiserChangesTheFee() {
        Division division = maleWhiteAdult("-76 kg");
        Division other = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("price", null, division, other);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());

        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(competition.getId())),
                Update.update("entryFeeCents", 3000),
                BjjEireCompetition.class);
        signUp(CIARAN, competition.getId(), other.getId());

        List<Integer> amounts = mongoTemplate.findAll(BjjEireCompetitionRegistration.class).stream()
                .map(registration -> registration.getPayment().getAmountCents())
                .sorted()
                .toList();
        assertThat(amounts).containsExactly(2500, 3000);
    }

    @Test
    @Tag("#5018")
    void shouldMakeGiAndNoGiTwoSignUpsWithTwoPayments() {
        Division gi = division(Discipline.GI, Gender.MALE, AgeCategory.ADULT, Belt.WHITE, "-76 kg");
        Division noGi = division(Discipline.NO_GI, Gender.MALE, AgeCategory.ADULT, Belt.WHITE, "-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("both", null, gi, noGi);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertThat(signUp(AOIFE, competition.getId(), gi.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
        assertThat(signUp(AOIFE, competition.getId(), noGi.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);

        assertThat(mongoTemplate.count(new Query(), BjjEireCompetitionRegistration.class))
                .isEqualTo(2);
        assertThat(paymentGateway.checkouts()).hasSize(2);
        assertThat(paymentGateway.checkouts().stream()
                        .map(CheckoutRequest::registrationId)
                        .distinct())
                .hasSize(2);
        assertThat(placesTaken(competition.getId())).isEqualTo(2);
    }

    @Test
    @Tag("#5017")
    void shouldRefuseASecondSignUpForTheSameDivisionWithoutCharging() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("again", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        confirmAll();

        ResponseEntity<String> again = signUp(AOIFE, competition.getId(), division.getId());

        assertConflict(again, "urn:bjjeire:already-registered");
        assertThat(paymentGateway.checkouts()).hasSize(1);
        assertThat(placesTaken(competition.getId())).isEqualTo(1);
    }

    @Test
    @Tag("#5017")
    void shouldAllowANewSignUpOnceTheEarlierOneHasEnded() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("ended", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        mongoTemplate.updateMulti(
                new Query(),
                new Update()
                        .set("status", RegistrationStatus.EXPIRED)
                        .unset("active")
                        .unset("unpaidSlot"),
                BjjEireCompetitionRegistration.class);

        assertThat(signUp(AOIFE, competition.getId(), division.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @Tag("#5020")
    void shouldTellTheCompetitorTheBjjEireCompetitionIsFullAndNotCharge() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("full", 1, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        saveProfile(CIARAN, "Ciaran", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());

        ResponseEntity<String> refused = signUp(CIARAN, competition.getId(), division.getId());

        assertConflict(refused, "urn:bjjeire:competition-full");
        assertThat(paymentGateway.checkouts()).hasSize(1);
        assertThat(placesTaken(competition.getId())).isEqualTo(1);
    }

    @Test
    @Tag("#5042")
    void shouldRefuseAThirdUnpaidSignUpInTheSameBjjEireCompetition() {
        Division first = maleWhiteAdult("-70 kg");
        Division second = maleWhiteAdult("-76 kg");
        Division third = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("unpaid", null, first, second, third);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), first.getId());
        signUp(AOIFE, competition.getId(), second.getId());

        ResponseEntity<String> refused = signUp(AOIFE, competition.getId(), third.getId());

        assertConflict(refused, "urn:bjjeire:too-many-unpaid");
        assertThat(paymentGateway.checkouts()).hasSize(2);
        assertThat(placesTaken(competition.getId())).isEqualTo(2);
    }

    @Test
    @Tag("#5042")
    void shouldAllowAThirdSignUpOnceOneOfTheFirstTwoIsPaid() {
        Division first = maleWhiteAdult("-70 kg");
        Division second = maleWhiteAdult("-76 kg");
        Division third = maleWhiteAdult("-82 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("paid-one", null, first, second, third);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), first.getId());
        confirmAll();
        signUp(AOIFE, competition.getId(), second.getId());

        assertThat(signUp(AOIFE, competition.getId(), third.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @Tag("#5019")
    void shouldRefuseSomeoneWhoIsUnderEighteenOnTheBjjEireCompetitionDay() throws Exception {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("young", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, EIGHTEEN_THE_DAY_AFTER);

        ResponseEntity<String> refused = signUp(AOIFE, competition.getId(), division.getId());

        assertConflict(refused, "urn:bjjeire:under-18");
        assertThat(objectMapper.readTree(refused.getBody()).at("/detail").asString())
                .contains("18");
        assertThat(paymentGateway.checkouts()).isEmpty();
    }

    @Test
    @Tag("#5014")
    void shouldRefuseADivisionForAnotherBeltOrGender() {
        Division blue = division(Discipline.GI, Gender.MALE, AgeCategory.ADULT, Belt.BLUE, "-76 kg");
        Division female = division(Discipline.GI, Gender.FEMALE, AgeCategory.ADULT, Belt.WHITE, "-60 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("wrong", null, blue, female);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertConflict(signUp(AOIFE, competition.getId(), blue.getId()), "urn:bjjeire:not-eligible");
        assertConflict(signUp(AOIFE, competition.getId(), female.getId()), "urn:bjjeire:not-eligible");
        assertThat(paymentGateway.checkouts()).isEmpty();
    }

    @Test
    @Tag("#5014")
    void shouldRefuseAnOlderAgeCategoryThanTheCompetitorReaches() {
        Division masterThree = division(Discipline.GI, Gender.MALE, AgeCategory.MASTER_3, Belt.WHITE, "-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("older", null, masterThree);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertConflict(signUp(AOIFE, competition.getId(), masterThree.getId()), "urn:bjjeire:not-eligible");
    }

    @Test
    void shouldRefuseWhenRegistrationIsNotOpen() {
        Division notYet = maleWhiteAdult("-76 kg");
        Division closed = maleWhiteAdult("-76 kg");
        BjjEireCompetition later = insertBjjEireCompetition(
                "later",
                BjjEireCompetitionStatus.PUBLISHED,
                FIXED_NOW.plus(Duration.ofDays(1)),
                CLOSES_AT,
                null,
                notYet);
        BjjEireCompetition over = insertBjjEireCompetition(
                "over",
                BjjEireCompetitionStatus.PUBLISHED,
                OPENS_AT,
                FIXED_NOW.minus(Duration.ofDays(1)),
                null,
                closed);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertConflict(signUp(AOIFE, later.getId(), notYet.getId()), "urn:bjjeire:registration-not-open");
        assertConflict(signUp(AOIFE, over.getId(), closed.getId()), "urn:bjjeire:registration-not-open");
        assertThat(paymentGateway.checkouts()).isEmpty();
    }

    @Test
    void shouldRefuseACompetitorWhoseProfileIsIncompleteOrMissing() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("incomplete", null, division);
        restTemplate.exchange(
                ApiRoutes.COMPETITOR + "/me",
                HttpMethod.PUT,
                jsonEntity(
                        "{ \"firstName\": \"Aoife\", \"lastName\": \"Byrne\", \"dateOfBirth\": \"1990-04-12\" }",
                        AOIFE),
                String.class);

        assertConflict(signUp(AOIFE, competition.getId(), division.getId()), "urn:bjjeire:profile-incomplete");
        assertConflict(signUp(CIARAN, competition.getId(), division.getId()), "urn:bjjeire:profile-incomplete");
        assertThat(paymentGateway.checkouts()).isEmpty();
    }

    @Test
    void shouldNeedBothConsentsBeforePaying() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("consent", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertThat(signUp(AOIFE, competition.getId(), division.getId(), false, true)
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(signUp(AOIFE, competition.getId(), division.getId(), true, false)
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        String noFlags = "{ \"competitionId\": \"%s\", \"divisionId\": \"%s\" }"
                .formatted(competition.getId(), division.getId());
        assertThat(restTemplate
                        .exchange(ApiRoutes.REGISTRATION, HttpMethod.POST, jsonEntity(noFlags, AOIFE), String.class)
                        .getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(paymentGateway.checkouts()).isEmpty();
        assertThat(placesTaken(competition.getId())).isZero();
    }

    @Test
    void shouldNotFindADraftBjjEireCompetitionOrAnUnknownDivision() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition draft =
                insertBjjEireCompetition("draft", BjjEireCompetitionStatus.DRAFT, OPENS_AT, CLOSES_AT, null, division);
        BjjEireCompetition open = publishedBjjEireCompetition("open", null, maleWhiteAdult("-82 kg"));
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertThat(signUp(AOIFE, draft.getId(), division.getId()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(signUp(AOIFE, open.getId(), division.getId()).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void shouldGiveThePlaceBackWhenStripeCannotBeReached() throws Exception {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("stripe-down", 1, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        paymentGateway.failNextCheckouts(true);

        ResponseEntity<String> failed = signUp(AOIFE, competition.getId(), division.getId());

        assertThat(failed.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(objectMapper.readTree(failed.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:payment-unavailable");
        assertThat(mongoTemplate.count(new Query(), BjjEireCompetitionRegistration.class))
                .isZero();
        assertThat(placesTaken(competition.getId())).isZero();

        paymentGateway.failNextCheckouts(false);
        assertThat(signUp(AOIFE, competition.getId(), division.getId()).getStatusCode())
                .isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @Tag("#5014")
    void shouldOfferOnlyTheDivisionsTheCompetitorMayEnter() throws Exception {
        Division adult = maleWhiteAdult("-76 kg");
        Division masterTwo = division(Discipline.NO_GI, Gender.MALE, AgeCategory.MASTER_2, Belt.WHITE, "-76 kg");
        Division masterThree = division(Discipline.GI, Gender.MALE, AgeCategory.MASTER_3, Belt.WHITE, "-76 kg");
        Division blue = division(Discipline.GI, Gender.MALE, AgeCategory.ADULT, Belt.BLUE, "-76 kg");
        BjjEireCompetition competition =
                publishedBjjEireCompetition("eligible", null, adult, masterTwo, masterThree, blue);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        ResponseEntity<String> response = eligible(AOIFE, competition.getId());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.valueStream().map(node -> node.at("/id").asString()))
                .containsExactly(adult.getId(), masterTwo.getId());
    }

    @Test
    @Tag("#5019")
    void shouldExplainWhyNoDivisionIsOfferedToAnUnderEighteenOrAnIncompleteProfile() {
        BjjEireCompetition competition =
                publishedBjjEireCompetition("eligible-refused", null, maleWhiteAdult("-76 kg"));
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, EIGHTEEN_THE_DAY_AFTER);

        assertConflict(eligible(AOIFE, competition.getId()), "urn:bjjeire:under-18");
        assertConflict(eligible(CIARAN, competition.getId()), "urn:bjjeire:profile-incomplete");
    }

    @Test
    void shouldRefuseAConsentThatIsNotTheBooleanTrue() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("strict-consent", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        for (String listing : List.of("\"true\"", "1")) {
            String body = """
                { "competitionId": "%s", "divisionId": "%s", "acceptPublicListing": %s, "acceptTerms": true }
                """.formatted(competition.getId(), division.getId(), listing);
            ResponseEntity<String> refused = restTemplate.exchange(
                    ApiRoutes.REGISTRATION, HttpMethod.POST, jsonEntity(body, AOIFE), String.class);
            assertThat(refused.getStatusCode()).as(listing).isEqualTo(HttpStatus.BAD_REQUEST);
        }
        assertThat(paymentGateway.checkouts()).isEmpty();
    }

    @Test
    void shouldAnswerABodyThatIsNotJsonWithBadRequest() throws Exception {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setBearerAuth(AOIFE);
        headers.setContentType(org.springframework.http.MediaType.TEXT_PLAIN);

        ResponseEntity<String> refused = restTemplate.exchange(
                ApiRoutes.REGISTRATION,
                HttpMethod.POST,
                new org.springframework.http.HttpEntity<>("hi", headers),
                String.class);

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(objectMapper.readTree(refused.getBody()).at("/type").asString())
                .isEqualTo("urn:bjjeire:bad-request");
    }

    @Test
    void shouldOfferNoDivisionWhileRegistrationIsNotOpen() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition closed = insertBjjEireCompetition(
                "eligible-closed",
                BjjEireCompetitionStatus.PUBLISHED,
                OPENS_AT,
                FIXED_NOW.minus(Duration.ofDays(1)),
                null,
                division);
        BjjEireCompetition later = insertBjjEireCompetition(
                "eligible-later",
                BjjEireCompetitionStatus.PUBLISHED,
                FIXED_NOW.plus(Duration.ofDays(1)),
                CLOSES_AT,
                null,
                division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        assertConflict(eligible(AOIFE, closed.getId()), "urn:bjjeire:registration-not-open");
        assertConflict(eligible(AOIFE, later.getId()), "urn:bjjeire:registration-not-open");
    }

    private ResponseEntity<String> eligible(String token, String competitionId) {
        return restTemplate.exchange(
                ApiRoutes.BJJEIRE_COMPETITION + "/" + competitionId + "/eligible-division",
                HttpMethod.GET,
                jsonEntity(null, token),
                String.class);
    }

    private void confirmAll() {
        mongoTemplate.updateMulti(
                Query.query(Criteria.where("status").is(RegistrationStatus.AWAITING_PAYMENT)),
                new Update()
                        .set("status", RegistrationStatus.CONFIRMED)
                        .set("payment.status", PaymentStatus.PAID)
                        .unset("unpaidSlot"),
                BjjEireCompetitionRegistration.class);
    }

    private void assertConflict(ResponseEntity<String> response, String type) {
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        // #3011: problem titles and details never use the retired name.
        assertThat(response.getBody()).doesNotContainIgnoringCase(OLD_NAME);
        try {
            assertThat(objectMapper.readTree(response.getBody()).at("/type").asString())
                    .isEqualTo(type);
        } catch (tools.jackson.core.JacksonException unreadable) {
            throw new AssertionError(response.getBody(), unreadable);
        }
    }
}
