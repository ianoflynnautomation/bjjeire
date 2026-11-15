package com.bjjeire.api.competitor;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.bjjeire.api.config.BjjEireProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

/** Research R11: deleting the competitor from the external tenant through Microsoft Graph, app-only. */
class GraphIdentityDirectoryTest {
    private static final String TOKEN_URI = "https://login.microsoftonline.com/tenant/oauth2/v2.0/token";
    private static final String GRAPH = "https://graph.microsoft.com/v1.0";

    private MockRestServiceServer server;
    private GraphIdentityDirectory directory;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        directory = new GraphIdentityDirectory(
                new BjjEireProperties.CompetitorDirectory(TOKEN_URI, "client-id", "client-secret", GRAPH), builder);
    }

    @Test
    @Tag("#5012")
    void shouldDeleteTheUserWithAnAppOnlyToken() {
        expectToken();
        server.expect(requestTo(GRAPH + "/users/0b8e5d4c-oid"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(header("Authorization", "Bearer graph-token"))
                .andRespond(withStatus(HttpStatus.NO_CONTENT));

        directory.deleteUser("0b8e5d4c-oid");

        server.verify();
    }

    @Test
    void shouldTreatAUserThatIsAlreadyGoneAsDeleted() {
        expectToken();
        server.expect(requestTo(GRAPH + "/users/gone")).andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatCode(() -> directory.deleteUser("gone")).doesNotThrowAnyException();
    }

    @Test
    void shouldReportAFailureWithoutTheSecret() {
        expectToken();
        server.expect(requestTo(GRAPH + "/users/x")).andRespond(withStatus(HttpStatus.FORBIDDEN));

        assertThatThrownBy(() -> directory.deleteUser("x"))
                .isInstanceOf(IdentityDirectory.IdentityDirectoryException.class)
                .hasMessageNotContaining("client-secret");
    }

    @Test
    void shouldRefuseAnObjectIdThatIsNotAPathSegment() {
        assertThatThrownBy(() -> directory.deleteUser("../me"))
                .isInstanceOf(IdentityDirectory.IdentityDirectoryException.class);
    }

    private void expectToken() {
        server.expect(requestTo(TOKEN_URI))
                .andExpect(method(HttpMethod.POST))
                .andExpect(content()
                        .formDataContains(java.util.Map.of(
                                "grant_type", "client_credentials",
                                "client_id", "client-id",
                                "client_secret", "client-secret",
                                "scope", "https://graph.microsoft.com/.default")))
                .andRespond(withSuccess(
                        "{\"access_token\":\"graph-token\",\"token_type\":\"Bearer\",\"expires_in\":3599}",
                        MediaType.APPLICATION_JSON));
    }
}
