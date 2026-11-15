package com.bjjeire.api.competitor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.azure.core.credential.AccessToken;
import com.azure.core.credential.TokenCredential;
import com.azure.core.credential.TokenRequestContext;
import com.azure.core.exception.ClientAuthenticationException;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import reactor.core.publisher.Mono;

/**
 * Research R11: deleting the competitor from the external tenant through the Microsoft Graph SDK, app-only. A local
 * HTTP server stands in for Graph, so the SDK client is built exactly as in production.
 */
class GraphIdentityDirectoryTest {
    private record Seen(String method, String path, String authorization) {}

    private final List<Seen> requests = new CopyOnWriteArrayList<>();
    private final List<TokenRequestContext> tokenRequests = new CopyOnWriteArrayList<>();
    private final TokenCredential credential = context -> {
        tokenRequests.add(context);
        return Mono.just(new AccessToken("graph-token", OffsetDateTime.now().plusHours(1)));
    };

    private HttpServer graph;
    private int status = 204;

    @BeforeEach
    void startGraph() throws IOException {
        graph = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        graph.createContext("/", exchange -> {
            requests.add(new Seen(
                    exchange.getRequestMethod(),
                    exchange.getRequestURI().getPath(),
                    exchange.getRequestHeaders().getFirst("Authorization")));
            byte[] body = status == 204
                    ? new byte[0]
                    : "{\"error\":{\"code\":\"Refused\",\"message\":\"refused\"}}".getBytes();
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, body.length == 0 ? -1 : body.length);
            if (body.length > 0) {
                exchange.getResponseBody().write(body);
            }
            exchange.close();
        });
        graph.start();
    }

    @AfterEach
    void stopGraph() {
        graph.stop(0);
    }

    private GraphIdentityDirectory directory(TokenCredential tokens) {
        String baseUrl = "http://localhost:" + graph.getAddress().getPort() + "/v1.0";
        return new GraphIdentityDirectory(GraphIdentityDirectory.graphClient(tokens, baseUrl));
    }

    @Test
    @Tag("#5012")
    void shouldDeleteTheUserWithAnAppOnlyGraphToken() {
        directory(credential).deleteUser("0b8e5d4c-oid");

        assertThat(requests).containsExactly(new Seen("DELETE", "/v1.0/users/0b8e5d4c-oid", "Bearer graph-token"));
        assertThat(tokenRequests)
                .isNotEmpty()
                .allSatisfy(context ->
                        assertThat(context.getScopes()).containsExactly("https://graph.microsoft.com/.default"));
    }

    @Test
    void shouldTreatAUserThatIsAlreadyGoneAsDeleted() {
        status = 404;

        assertThatCode(() -> directory(credential).deleteUser("gone")).doesNotThrowAnyException();
    }

    @Test
    void shouldReportARefusalByGraph() {
        status = 403;

        assertThatThrownBy(() -> directory(credential).deleteUser("x"))
                .isInstanceOf(IdentityDirectory.IdentityDirectoryException.class)
                .hasMessageContaining("403");
    }

    @Test
    void shouldReportATokenFailureWithoutItsDetailsAndCallNothing() {
        TokenCredential refusing =
                context -> Mono.error(new ClientAuthenticationException("AADSTS7000215: invalid secret s3cr3t", null));

        assertThatThrownBy(() -> directory(refusing).deleteUser("x"))
                .isInstanceOf(IdentityDirectory.IdentityDirectoryException.class)
                .hasMessageNotContaining("s3cr3t")
                .hasNoCause();
        assertThat(requests).isEmpty();
    }

    @Test
    void shouldReportAnUnreachableGraph() {
        graph.stop(0);

        assertThatThrownBy(() -> directory(credential).deleteUser("x"))
                .isInstanceOf(IdentityDirectory.IdentityDirectoryException.class)
                .hasMessageContaining("could not be reached");
    }

    @Test
    void shouldRefuseAnObjectIdThatIsNotAPathSegment() {
        assertThatThrownBy(() -> directory(credential).deleteUser("../me"))
                .isInstanceOf(IdentityDirectory.IdentityDirectoryException.class);
        assertThat(requests).isEmpty();
        assertThat(tokenRequests).isEmpty();
    }
}
