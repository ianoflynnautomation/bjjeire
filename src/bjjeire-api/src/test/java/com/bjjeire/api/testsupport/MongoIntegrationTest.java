package com.bjjeire.api.testsupport;

import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.deactivation.DeactivationLock;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.store.Store;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MongoDBContainer;

/**
 * Base class for MongoDB-backed integration tests.
 *
 * <p>A single container and a single Spring context are shared by every subclass: the container is started once per JVM
 * (never stopped between classes) and the identical context configuration lets Spring's context cache reuse one
 * application context for the whole failsafe run.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ContextConfiguration(classes = MongoIntegrationTest.SharedOverrides.class)
public abstract class MongoIntegrationTest {
    /** Fixed "now" every subclass can rely on when building past/future fixtures. */
    protected static final Instant FIXED_NOW = Instant.parse("2026-05-31T00:00:00Z");

    protected static final String AUTHENTICATED_USER = "integration-test";

    private static final MongoDBContainer MONGO = new MongoDBContainer("mongo:7.0");

    static {
        MONGO.start();
    }

    @DynamicPropertySource
    static void mongoProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.data.mongodb.uri", MONGO::getReplicaSetUrl);
        registry.add("spring.data.mongodb.database", () -> "BjjEireTest");
        registry.add(
                "spring.security.oauth2.resourceserver.jwt.issuer-uri",
                () -> "https://login.microsoftonline.com/test/v2.0");
    }

    @Autowired
    protected MongoTemplate mongoTemplate;

    @Autowired
    protected TestRestTemplate restTemplate;

    @Autowired
    protected ApiCache apiCache;

    @BeforeEach
    void resetPersistentState() {
        for (Class<?> entityType : List.of(
                Gym.class,
                BjjEvent.class,
                Competition.class,
                Store.class,
                DeactivationLock.class,
                AuditLogEntry.class)) {
            mongoTemplate.remove(new Query(), entityType);
        }
        for (String tag :
                List.of(ApiCache.GYMS_TAG, ApiCache.BJJ_EVENTS_TAG, ApiCache.COMPETITIONS_TAG, ApiCache.STORES_TAG)) {
            apiCache.removeByTag(tag);
        }
    }

    /** Wraps a JSON body with the bearer token accepted by the stubbed {@link JwtDecoder}. */
    protected static HttpEntity<String> jsonEntity(String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth("integration-test-token");
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    @TestConfiguration
    public static class SharedOverrides {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        }

        @Bean
        JwtDecoder jwtDecoder() {
            return token -> Jwt.withTokenValue(token)
                    .header("alg", "none")
                    .claim("sub", AUTHENTICATED_USER)
                    .build();
        }
    }
}
