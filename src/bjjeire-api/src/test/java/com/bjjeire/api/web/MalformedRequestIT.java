package com.bjjeire.api.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/**
 * A request Tomcat refuses before Spring sees it, such as an encoded NUL in the path, is answered with the same RFC
 * 9457 problem document as every other error, not Tomcat's HTML error page.
 */
class MalformedRequestIT extends MongoIntegrationTest {
    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    @ParameterizedTest
    @ValueSource(strings = {"/api/v1/bjjeire-competition/%00", "/api/v1/gym/%00", "/api/v1/bjjeire-competition/a%00b"})
    void shouldAnswerAProblemDocumentWhenTomcatRefusesThePath(String path) throws Exception {
        HttpResponse<String> response;
        try (HttpClient client = HttpClient.newHttpClient()) {
            response = client.send(
                    HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                            .GET()
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
        }

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.headers().firstValue("Content-Type"))
                .hasValueSatisfying(type -> assertThat(type).startsWith("application/problem+json"));
        assertThat(response.body()).doesNotContainIgnoringCase("<html").doesNotContain("Tomcat");
        JsonNode problem = objectMapper.readTree(response.body());
        assertThat(problem.at("/type").asString()).isEqualTo(ProblemTypes.BAD_REQUEST.toString());
        assertThat(problem.at("/title").asString()).isEqualTo("Bad Request");
        assertThat(problem.at("/status").asInt()).isEqualTo(400);
        assertThat(problem.at("/detail").asString()).isNotBlank();
        assertThat(problem.at("/traceId").asString()).isNotBlank();
    }
}
