package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.bjjeire.api.bjjeirecompetition.Belt;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionStatus;
import com.bjjeire.api.bjjeirecompetition.Division;
import com.bjjeire.api.bjjeirecompetition.Gender;
import com.bjjeire.api.config.EventPublicationSweep;
import java.time.Duration;
import java.util.List;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

/**
 * A profile edit reaches the competitor's sign-ups in competitions still running (research R8, spec edge case on belt
 * or gender changes). Lives with the sign-ups it changes; driven through the profile route.
 *
 * <p>The copy runs after the profile is saved, from the event publication registry (ADR-0017), so each test waits until
 * the registry holds nothing outstanding before it reads a sign-up.
 */
class ProfilePropagationIT extends RegistrationIntegrationTest {
    private static final String AOIFE = competitorToken("aoife");
    private static final String EVENT_PUBLICATIONS = "event_publication";
    private static final Duration PROPAGATION = Duration.ofSeconds(10);
    // The clock is fixed, so a publication made "now" is never older than zero: look a second ahead instead.
    private static final Duration EVERYTHING_OUTSTANDING = Duration.ofSeconds(-1);

    @Autowired
    private EventPublicationSweep eventPublicationSweep;

    @BeforeEach
    void clearEventPublications() {
        mongoTemplate.getCollection(EVENT_PUBLICATIONS).deleteMany(new Document());
    }

    @Test
    void shouldCopyANewNameAcademyAndAffiliationToActiveSignUps() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("propagate", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());

        saveProfile(
                AOIFE,
                "Aoibhe",
                Gender.MALE,
                Belt.WHITE,
                ADULT_BIRTH_DATE,
                "{ \"name\": \"  New   Gym \" }",
                "\"Checkmat\"");
        awaitProfileChangesProcessed();

        BjjEireCompetitionRegistration updated = onlyRegistration();
        assertThat(updated.getDisplayName()).isEqualTo("Aoibhe Byrne");
        assertThat(updated.getAcademy().name()).isEqualTo("New   Gym");
        assertThat(updated.getAcademyKey()).isEqualTo("name:new gym");
        assertThat(updated.getAffiliation()).isEqualTo("Checkmat");
        assertThat(updated.getAffiliationKey()).isEqualTo("checkmat");
        assertThat(updated.isProfileMismatch()).isFalse();
    }

    @Test
    void shouldLeaveSignUpsInFinishedBjjEireCompetitionsAlone() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("finished", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(competition.getId())),
                Update.update("status", BjjEireCompetitionStatus.FINISHED),
                BjjEireCompetition.class);

        saveProfile(AOIFE, "Aoibhe", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE, "null", "null");
        awaitProfileChangesProcessed();

        BjjEireCompetitionRegistration untouched = onlyRegistration();
        assertThat(untouched.getDisplayName()).isEqualTo("Aoife Byrne");
        assertThat(untouched.getAcademy().name()).isEqualTo("Team X");
        assertThat(untouched.getAffiliation()).isEqualTo("Alliance");
    }

    @Test
    void shouldKeepTheDivisionButFlagAMismatchWhenBeltOrGenderChanges() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("mismatch", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());

        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.BLUE, ADULT_BIRTH_DATE);
        awaitProfileChangesProcessed();

        BjjEireCompetitionRegistration flagged = onlyRegistration();
        assertThat(flagged.getDivisionId()).isEqualTo(division.getId());
        assertThat(flagged.isProfileMismatch()).isTrue();

        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        awaitProfileChangesProcessed();

        assertThat(onlyRegistration().isProfileMismatch()).isFalse();
    }

    @Test
    void shouldCopyAProfileChangeThatFailedOnceWhenItIsResubmitted() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("retry", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        awaitProfileChangesProcessed();

        rejectSignUpsNamed("Aoibhe Byrne");
        try {
            saveProfile(AOIFE, "Aoibhe", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
            await().atMost(PROPAGATION)
                    .untilAsserted(() -> assertThat(outstandingProfileChanges())
                            .singleElement()
                            .satisfies(publication -> assertThat(publication.get("completionAttempts", Integer.class))
                                    .isPositive()));
            assertThat(onlyRegistration().getDisplayName()).isEqualTo("Aoife Byrne");
        } finally {
            acceptAllSignUps();
        }

        eventPublicationSweep.resubmitOlderThan(EVERYTHING_OUTSTANDING);
        awaitProfileChangesProcessed();

        assertThat(onlyRegistration().getDisplayName()).isEqualTo("Aoibhe Byrne");
    }

    @Test
    void shouldKeepOnlyTheCompetitorIdWhileAProfileChangeIsOutstanding() {
        Division division = maleWhiteAdult("-76 kg");
        BjjEireCompetition competition = publishedBjjEireCompetition("outstanding", null, division);
        saveProfile(AOIFE, "Aoife", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
        signUp(AOIFE, competition.getId(), division.getId());
        awaitProfileChangesProcessed();
        String competitorId = onlyRegistration().getCompetitorId();

        rejectSignUpsNamed("Aoibhe Byrne");
        try {
            saveProfile(AOIFE, "Aoibhe", Gender.MALE, Belt.WHITE, ADULT_BIRTH_DATE);
            await().atMost(PROPAGATION).until(() -> !outstandingProfileChanges().isEmpty());

            String stored = outstandingProfileChanges().getFirst().toJson();
            assertThat(stored)
                    .contains(competitorId)
                    .doesNotContain("Aoibhe")
                    .doesNotContain("Byrne")
                    .doesNotContain(ADULT_BIRTH_DATE)
                    .doesNotContain("@");
        } finally {
            acceptAllSignUps();
            eventPublicationSweep.resubmitOlderThan(EVERYTHING_OUTSTANDING);
            awaitProfileChangesProcessed();
        }
    }

    /** Completed publications are deleted (completion mode {@code delete}), so an empty registry means all done. */
    private void awaitProfileChangesProcessed() {
        await().atMost(PROPAGATION)
                .until(() -> mongoTemplate.getCollection(EVENT_PUBLICATIONS).countDocuments() == 0);
    }

    private List<Document> outstandingProfileChanges() {
        return mongoTemplate
                .getCollection(EVENT_PUBLICATIONS)
                .find(new Document("completionDate", null))
                .into(new java.util.ArrayList<>());
    }

    /** A collection validator stands in for a database that refuses the copy, without mocking a bean. */
    private void rejectSignUpsNamed(String displayName) {
        mongoTemplate
                .getDb()
                .runCommand(new Document("collMod", BjjEireCompetitionRegistration.ENTITY_NAME)
                        .append("validator", new Document("displayName", new Document("$ne", displayName)))
                        .append("validationLevel", "strict")
                        .append("validationAction", "error"));
    }

    private void acceptAllSignUps() {
        mongoTemplate
                .getDb()
                .runCommand(new Document("collMod", BjjEireCompetitionRegistration.ENTITY_NAME)
                        .append("validator", new Document())
                        .append("validationLevel", "off"));
    }
}
