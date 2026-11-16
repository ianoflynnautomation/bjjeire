package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Supplier;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;

/** The last place and the same division, taken at the same moment (research R5). */
class RegistrationConcurrencyIT extends RegistrationIntegrationTest {
    private static final int RACERS = 6;

    @Test
    @Tag("#5020")
    void shouldGiveTheLastPlaceToExactlyOneOfManySimultaneousCompetitors() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("last-place", 1, division);
        for (int i = 0; i < RACERS; i++) {
            saveProfile(competitorToken("racer" + i), "Racer" + i, Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        }

        List<HttpStatusCode> statuses =
                race(i -> () -> signUp(competitorToken("racer" + i), competition.getId(), division.getId()));

        assertThat(statuses).filteredOn(HttpStatus.CREATED::equals).hasSize(1);
        assertThat(statuses).filteredOn(HttpStatus.CONFLICT::equals).hasSize(RACERS - 1);
        assertThat(mongoTemplate.count(new Query(), BjjEireCompetitionRegistration.class))
                .isEqualTo(1);
        assertThat(placesTaken(competition.getId())).isEqualTo(1);
        assertThat(paymentGateway.checkouts()).hasSize(1);
    }

    @Test
    @Tag("#5017")
    void shouldCreateOneSignUpWhenTheSameCompetitorSubmitsTheSameDivisionManyTimesAtOnce() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("double-click", null, division);
        String token = competitorToken("clicker");
        saveProfile(token, "Clicker", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        List<HttpStatusCode> statuses = race(i -> () -> signUp(token, competition.getId(), division.getId()));

        assertThat(statuses).filteredOn(HttpStatus.CREATED::equals).hasSize(1);
        assertThat(mongoTemplate.count(new Query(), BjjEireCompetitionRegistration.class))
                .isEqualTo(1);
        // Every refused attempt gave back the place it took.
        assertThat(placesTaken(competition.getId())).isEqualTo(1);
        assertThat(paymentGateway.checkouts()).hasSize(1);
    }

    @Test
    @Tag("#5042")
    void shouldHoldAtMostTwoUnpaidSignUpsWhenOneCompetitorStartsSeveralDivisionsAtOnce() {
        Division[] divisions = new Division[RACERS];
        for (int i = 0; i < RACERS; i++) {
            divisions[i] = maleWhiteAdult("-" + (60 + i) + " kg");
        }
        BjjEireCompetition competition = publishedBjjEireCompetition("unpaid-race", null, divisions);
        String token = competitorToken("hoarder");
        saveProfile(token, "Hoarder", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);

        List<HttpStatusCode> statuses = race(i -> () -> signUp(token, competition.getId(), divisions[i].getId()));

        assertThat(statuses).filteredOn(HttpStatus.CREATED::equals).hasSize(2);
        assertThat(statuses).filteredOn(HttpStatus.CONFLICT::equals).hasSize(RACERS - 2);
        assertThat(mongoTemplate.count(new Query(), BjjEireCompetitionRegistration.class))
                .isEqualTo(2);
        assertThat(placesTaken(competition.getId())).isEqualTo(2);
        assertThat(paymentGateway.checkouts()).hasSize(2);
    }

    private List<HttpStatusCode> race(java.util.function.IntFunction<Supplier<ResponseEntity<String>>> attempt) {
        CountDownLatch start = new CountDownLatch(1);
        try (ExecutorService pool = Executors.newFixedThreadPool(RACERS)) {
            List<CompletableFuture<HttpStatusCode>> futures = new java.util.ArrayList<>();
            for (int i = 0; i < RACERS; i++) {
                Supplier<ResponseEntity<String>> call = attempt.apply(i);
                futures.add(CompletableFuture.supplyAsync(
                        () -> {
                            try {
                                start.await();
                            } catch (InterruptedException interrupted) {
                                Thread.currentThread().interrupt();
                            }
                            return call.get().getStatusCode();
                        },
                        pool));
            }
            start.countDown();
            return futures.stream().map(CompletableFuture::join).toList();
        }
    }
}
