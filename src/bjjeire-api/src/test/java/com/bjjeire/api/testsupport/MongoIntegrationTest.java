package com.bjjeire.api.testsupport;

import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.competition.Competition;
import com.bjjeire.api.competitor.Competitor;
import com.bjjeire.api.competitor.DeletedCompetitor;
import com.bjjeire.api.deactivation.DeactivationLock;
import com.bjjeire.api.event.BjjEvent;
import com.bjjeire.api.gym.Gym;
import com.bjjeire.api.store.Store;
import com.bjjeire.api.tournament.Tournament;
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
import org.springframework.http.client.JdkClientHttpRequestFactory;
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
    protected static final String WRITER_SCOPE = "access_as_writer";

    /** A bearer value the stub decoder turns into a signed-in competitor (ADR-0012). */
    protected static final String COMPETITOR_TOKEN = "competitor-token";

    /** A competitor-tenant token that lacks the competitor scope. */
    protected static final String COMPETITOR_TOKEN_WITHOUT_SCOPE = "competitor-noscope-token";

    /** A workforce token without the writer scope. */
    protected static final String READER_TOKEN = "reader-token-without-writer-scope";

    /** A workforce token whose roles claim contains an app role named COMPETITOR. */
    protected static final String WORKFORCE_TOKEN_WITH_COMPETITOR_APP_ROLE = "reader-token-with-approle";

    protected static final String COMPETITOR_SUBJECT = "competitor-integration-test";

    /**
     * Prefix of a bearer value naming its own competitor: {@code competitorToken("b")} is a competitor whose subject is
     * {@code b}, so a test can sign in as two different people.
     */
    protected static final String COMPETITOR_TOKEN_AS = "competitor-token-as-";

    protected static final String COMPETITOR_SCOPE = "access_as_competitor";
    // Must match bjjeire.competitor-auth.issuer-uri in src/test/resources/application.yml.
    protected static final String COMPETITOR_ISSUER =
            "https://00000000-0000-0000-0000-000000000000.ciamlogin.com/" + "00000000-0000-0000-0000-000000000000/v2.0";

    @Autowired
    protected MongoTemplate mongoTemplate;

    @Autowired
    protected ApiCache apiCache;

    @Autowired
    protected RecordingIdentityDirectory identityDirectory;

    @LocalServerPort
    private int port;

    protected RestTemplate restTemplate;

    @BeforeEach
    void configureRestTemplate() {
        RestTemplate template = new RestTemplate();
        // HttpURLConnection hides a 401 body once WWW-Authenticate is set.
        template.setRequestFactory(new JdkClientHttpRequestFactory());
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
                Tournament.class,
                Competitor.class,
                DeletedCompetitor.class,
                DeactivationLock.class,
                AuditLogEntry.class)) {
            mongoTemplate.remove(new Query(), entityType);
        }
        // Sign-ups have no Java type yet; tournament tests write them by collection name.
        mongoTemplate.remove(new Query(), "TournamentRegistration");
        for (String tag : List.of(
                ApiCache.GYMS_TAG,
                ApiCache.BJJ_EVENTS_TAG,
                ApiCache.COMPETITIONS_TAG,
                ApiCache.STORES_TAG,
                ApiCache.TOURNAMENTS_TAG)) {
            apiCache.removeByTag(tag);
        }
        identityDirectory.reset();
    }

    /** A competitor token for the competitor whose subject is {@code subject}. It carries no {@code iat}. */
    protected static String competitorToken(String subject) {
        return COMPETITOR_TOKEN_AS + subject;
    }

    /** A competitor token for {@code subject} issued at {@code issuedAt}: a later sign-in of the same person. */
    protected static String competitorToken(String subject, Instant issuedAt) {
        return COMPETITOR_TOKEN_AS + subject + ISSUED_AT_MARKER + issuedAt.getEpochSecond();
    }

    private static final String ISSUED_AT_MARKER = "~iat~";

    /** The email the stub decoder puts in a competitor token. */
    protected static String competitorEmail(String subject) {
        return subject + "@example.test";
    }

    /** The directory object id the stub decoder puts in a competitor token. */
    protected static String competitorObjectId(String subject) {
        return "oid-" + subject;
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
        // "reader" token lets negative security tests assert 403 on writes. A "competitor" token is
        // issued by the competitor tenant; it carries a scope claim naming the writer scope as well,
        // which must never become an authority.
        @Bean
        @Primary
        RecordingIdentityDirectory recordingIdentityDirectory() {
            return new RecordingIdentityDirectory();
        }

        @Bean
        JwtDecoder jwtDecoder() {
            return token -> {
                if (token.contains("competitor")) {
                    String scope = token.contains("noscope") ? WRITER_SCOPE : WRITER_SCOPE + " " + COMPETITOR_SCOPE;
                    String subject;
                    Instant issuedAt = null;
                    if (token.startsWith(COMPETITOR_TOKEN_AS)) {
                        subject = token.substring(COMPETITOR_TOKEN_AS.length());
                        int marker = subject.indexOf(ISSUED_AT_MARKER);
                        if (marker >= 0) {
                            issuedAt = Instant.ofEpochSecond(
                                    Long.parseLong(subject.substring(marker + ISSUED_AT_MARKER.length())));
                            subject = subject.substring(0, marker);
                        }
                    } else {
                        subject = token.contains("noscope") ? COMPETITOR_SUBJECT + "-noscope" : COMPETITOR_SUBJECT;
                    }
                    Instant tokenIssuedAt = issuedAt;
                    return Jwt.withTokenValue(token)
                            .header("alg", "none")
                            .claim("sub", subject)
                            .claim("email", competitorEmail(subject))
                            .claims(claims -> {
                                if (tokenIssuedAt != null) {
                                    claims.put("iat", tokenIssuedAt);
                                }
                            })
                            .claim("oid", competitorObjectId(subject))
                            .claim("iss", COMPETITOR_ISSUER)
                            .claim("scope", scope)
                            .build();
                }
                Jwt.Builder builder =
                        Jwt.withTokenValue(token).header("alg", "none").claim("sub", AUTHENTICATED_USER);
                if (token.contains("approle")) {
                    builder.claim("roles", List.of("COMPETITOR"));
                }
                if (!token.contains("reader")) {
                    builder.claim("scope", WRITER_SCOPE);
                }
                return builder.build();
            };
        }
    }
}
