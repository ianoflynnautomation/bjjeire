package com.bjjeire.api.web;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.FileSystemResource;

class FeatureFlagDefaultsTest {
    /**
     * #1014: shipping the application config alone leaves the map off. Reads the main file because the test classpath
     * has its own application.yml.
     */
    @Test
    @Tag("#1014")
    void shouldDefaultGymsMapToOffInApplicationConfiguration() throws IOException {
        PropertySource<?> config = new YamlPropertySourceLoader()
                .load("main", new FileSystemResource("src/main/resources/application.yml"))
                .getFirst();

        assertThat(String.valueOf(config.getProperty("bjjeire.feature-flags.GymsMap")))
                .isEqualTo("${FEATURE_GYMS_MAP:false}");
    }

    /** #2015: shipping the application config alone leaves the events map off. */
    @Test
    @Tag("#2015")
    void shouldDefaultEventsMapToOffInApplicationConfiguration() throws IOException {
        PropertySource<?> config = new YamlPropertySourceLoader()
                .load("main", new FileSystemResource("src/main/resources/application.yml"))
                .getFirst();

        assertThat(String.valueOf(config.getProperty("bjjeire.feature-flags.EventsMap")))
                .isEqualTo("${FEATURE_EVENTS_MAP:false}");
    }

    /** #5038: shipping the application config alone leaves in-house competitions off. */
    @Test
    @Tag("#5038")
    void shouldDefaultBjjEireCompetitionsToOffInApplicationConfiguration() throws IOException {
        PropertySource<?> config = new YamlPropertySourceLoader()
                .load("main", new FileSystemResource("src/main/resources/application.yml"))
                .getFirst();

        assertThat(String.valueOf(config.getProperty("bjjeire.feature-flags.BjjEireCompetitions")))
                .isEqualTo("${FEATURE_BJJEIRE_COMPETITIONS:false}");
    }

    /** #6026: shipping the application config alone leaves the merch shop off. */
    @Test
    @Tag("#6026")
    void shouldDefaultMerchToOffInApplicationConfiguration() throws IOException {
        PropertySource<?> config = new YamlPropertySourceLoader()
                .load("main", new FileSystemResource("src/main/resources/application.yml"))
                .getFirst();

        assertThat(String.valueOf(config.getProperty("bjjeire.feature-flags.Merch")))
                .isEqualTo("${FEATURE_MERCH:false}");
    }
}
