package com.bjjeire.api.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.stream.StreamSupport;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class OpenApiContractIT extends MongoIntegrationTest {
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldExposeMigratedEndpointsAndRequireBearerAuthForWriteOperations() throws Exception {
        ResponseEntity<String> response = restTemplate.getForEntity("/v3/api-docs", String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode document = objectMapper.readTree(response.getBody());

        assertThat(document.at("/components/securitySchemes/BearerAuth/type").asText())
                .isEqualTo("http");
        assertThat(document.at("/components/securitySchemes/BearerAuth/scheme").asText())
                .isEqualTo("bearer");
        assertThat(document.at("/paths").propertyNames())
                .contains(
                        "/api/v1/Gym",
                        "/api/v1/BjjEvent",
                        "/api/v1/Competition",
                        "/api/v1/Store",
                        "/api/v1/Donate/bitcoin/qr");

        JsonNode gymGet = document.at("/paths/~1api~1v1~1Gym/get");
        JsonNode gymPost = document.at("/paths/~1api~1v1~1Gym/post");
        JsonNode eventPut = document.at("/paths/~1api~1v1~1BjjEvent~1{id}/put");
        JsonNode eventDelete = document.at("/paths/~1api~1v1~1BjjEvent~1{id}/delete");

        assertThat(gymGet.has("security")).isFalse();
        assertThat(hasBearerSecurity(gymPost)).isTrue();
        assertThat(hasBearerSecurity(eventPut)).isTrue();
        assertThat(hasBearerSecurity(eventDelete)).isTrue();
    }

    // CI contract export: when
    // OPENAPI_ARTIFACT_PATH is set, the served spec is written there for the
    // breaking-change gate and frontend type generation. Skipped otherwise.
    @Test
    void shouldExportOpenApiArtifactWhenRequestedByCi() throws Exception {
        String artifactPath = System.getenv("OPENAPI_ARTIFACT_PATH");
        Assumptions.assumeTrue(artifactPath != null && !artifactPath.isBlank());

        ResponseEntity<String> response = restTemplate.getForEntity("/v3/api-docs", String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        JsonNode document = objectMapper.readTree(response.getBody());
        assertThat(document.hasNonNull("openapi")).isTrue();
        assertThat(document.hasNonNull("paths")).isTrue();

        Path output = Path.of(artifactPath);
        if (output.getParent() != null) {
            Files.createDirectories(output.getParent());
        }
        Files.writeString(output, response.getBody());
    }

    private static boolean hasBearerSecurity(JsonNode operation) {
        JsonNode security = operation.path("security");
        if (!security.isArray()) {
            return false;
        }

        return StreamSupport.stream(security.spliterator(), false)
                .map(requirement -> requirement.path("BearerAuth"))
                .anyMatch(scopes -> scopes.isArray()
                        && StreamSupport.stream(scopes.spliterator(), false)
                                .map(JsonNode::asText)
                                .toList()
                                .equals(List.of()));
    }
}
