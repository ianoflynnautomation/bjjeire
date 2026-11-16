package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.bjjeirecompetition.BjjEireCompetition;
import com.bjjeire.api.registration.BjjEireCompetitionRegistration;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.util.List;
import org.bson.Document;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.data.mongodb.core.index.IndexInfo;

/** #3017, research R4: the pre-rename collections are dropped at startup, not migrated. */
@ExtendWith(OutputCaptureExtension.class)
class LegacyCollectionDropIT extends MongoIntegrationTest {
    @Autowired
    private MongoIndexInitializer indexes;

    @Test
    @Tag("#3017")
    void shouldDropTheLegacyCollectionsLogTheirCountsAndKeepTheNewOnesIndexed(CapturedOutput output) {
        String competitions = MongoIndexInitializer.LEGACY_COLLECTIONS.get(0);
        String registrations = MongoIndexInitializer.LEGACY_COLLECTIONS.get(1);
        mongoTemplate.insert(List.of(new Document("slug", "a"), new Document("slug", "b")), competitions);
        mongoTemplate.insert(List.of(new Document("status", "CONFIRMED")), registrations);

        indexes.run(new DefaultApplicationArguments());

        assertThat(mongoTemplate.collectionExists(competitions)).isFalse();
        assertThat(mongoTemplate.collectionExists(registrations)).isFalse();
        assertThat(output)
                .contains("Dropped legacy collection " + competitions + " holding 2 document(s)")
                .contains("Dropped legacy collection " + registrations + " holding 1 document(s)");
        assertThat(indexNames(BjjEireCompetition.ENTITY_NAME))
                .contains("ix_bjjeire_competition_slug_unique", "ix_bjjeire_competition_status_date");
        assertThat(indexNames(BjjEireCompetitionRegistration.ENTITY_NAME))
                .contains("ix_registration_competition_division_status", "ux_registration_active_competitor_division");
    }

    @Test
    @Tag("#3017")
    void shouldStartNormallyAndSaySoWhenTheLegacyCollectionsAreAbsent(CapturedOutput output) {
        indexes.run(new DefaultApplicationArguments());
        indexes.run(new DefaultApplicationArguments());

        for (String legacy : MongoIndexInitializer.LEGACY_COLLECTIONS) {
            assertThat(mongoTemplate.collectionExists(legacy)).isFalse();
            assertThat(output).contains("Legacy collection " + legacy + " not present");
        }
    }

    private List<String> indexNames(String collection) {
        return mongoTemplate.indexOps(collection).getIndexInfo().stream()
                .map(IndexInfo::getName)
                .toList();
    }
}
