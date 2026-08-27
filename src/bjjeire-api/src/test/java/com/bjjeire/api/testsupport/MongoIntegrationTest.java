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
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
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
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.DefaultUriBuilderFactory;
import org.testcontainers.mongodb.MongoDBContainer;

/**
 * Base class for MongoDB-backed integration tests.
 *
 * <p>A single container and a single Spring context are shared by every subclass: the container is started once per JVM
 * and the identical context configuration lets Spring's context cache reuse one application context for the whole
 * failsafe run.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@ContextConfiguration(classes = MongoIntegrationTest.SharedOverrides.class)
public abstract class MongoIntegrationTest {

    protected static final Instant FIXED_NOW = Instant.parse("2026-05-31T00:00:00Z");
    protected static final String AUTHENTICATED_USER = "integration-test";

    /** Matches {@code bjjeire.auth.writer-scope} default in application.yml. */
    protected static final String WRITER_SCOPE = "access_as_writer";

    @Autowired
    protected MongoTemplate mongoTemplate;

    @Autowired
    protected ApiCache apiCache;

    @LocalServerPort
    private int port;

    protected RestTemplate restTemplate;

    @BeforeEach
    void configureRestTemplate() {
        RestTemplate template = new RestTemplate();
        template.setUriTemplateHandler(new DefaultUriBuilderFactory("http://localhost:" + port));
        template.setErrorHandler(response -> false);
        this.restTemplate = template;
    }

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

    protected static HttpEntity<String> jsonEntity(String body) {
        return jsonEntity(body, "integration-test-token");
    }

    protected static HttpEntity<String> jsonEntity(String body, String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null) {
            headers.setBearerAuth(bearerToken);
        }
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    @TestConfiguration
    public static class SharedOverrides {
        @Bean
        @ServiceConnection
        MongoDBContainer mongoDbContainer() {
            return new MongoDBContainer("mongo:8.2");
        }

        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        }

        // Stub decoder: every token authenticates as the same user and, unless the token value
        // contains "reader", carries the writer scope so existing write ITs keep passing. A
        // "reader" token lets negative security tests assert 403 on writes.
        @Bean
        JwtDecoder jwtDecoder() {
            return token -> {
                Jwt.Builder builder =
                        Jwt.withTokenValue(token).header("alg", "none").claim("sub", AUTHENTICATED_USER);
                if (!token.contains("reader")) {
                    builder.claim("scope", WRITER_SCOPE);
                }
                return builder.build();
            };
        }
    }
}
