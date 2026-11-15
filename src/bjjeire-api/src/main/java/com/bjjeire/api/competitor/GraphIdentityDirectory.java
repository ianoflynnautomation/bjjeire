package com.bjjeire.api.competitor;

import com.bjjeire.api.config.BjjEireProperties;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Deletes competitors from the external tenant through Microsoft Graph, with an app-only token from the client
 * credentials grant (research R11). Deletions are rare, so a token is fetched for each one and never cached.
 *
 * <p>The application needs the least Graph permission that allows deleting users in that tenant; that permission is
 * still to be confirmed (tasks.md T009).
 */
public class GraphIdentityDirectory implements IdentityDirectory {
    static final String GRAPH_SCOPE = "https://graph.microsoft.com/.default";

    /** Entra object ids are GUIDs; anything that is a single safe path segment is accepted. */
    private static final Pattern OBJECT_ID = Pattern.compile("^[A-Za-z0-9-]{1,64}$");

    private final BjjEireProperties.CompetitorDirectory settings;
    private final RestClient restClient;

    public GraphIdentityDirectory(BjjEireProperties.CompetitorDirectory settings, RestClient.Builder builder) {
        this.settings = settings;
        this.restClient = builder.build();
    }

    @Override
    public void deleteUser(String objectId) {
        if (objectId == null || !OBJECT_ID.matcher(objectId).matches()) {
            throw new IdentityDirectoryException("The token carried no usable directory object id.");
        }
        String token = appToken();
        try {
            restClient
                    .delete()
                    .uri(settings.graphBaseUrl() + "/users/{id}", objectId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException refused) {
            if (refused.getStatusCode().value() == HttpStatus.NOT_FOUND.value()) {
                return;
            }
            throw new IdentityDirectoryException(
                    "Graph refused to delete the user: HTTP "
                            + refused.getStatusCode().value(),
                    refused);
        } catch (RestClientException unreachable) {
            throw new IdentityDirectoryException("Graph could not be reached.", unreachable);
        }
    }

    private String appToken() {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", settings.clientId());
        form.add("client_secret", settings.clientSecret());
        form.add("scope", GRAPH_SCOPE);
        TokenResponse response;
        try {
            response = restClient
                    .post()
                    .uri(settings.tokenUri())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(TokenResponse.class);
        } catch (RestClientResponseException refused) {
            // The response body can echo request details; report the status only.
            throw new IdentityDirectoryException(
                    "The token endpoint refused the client credentials: HTTP "
                            + refused.getStatusCode().value(),
                    null);
        } catch (RestClientException unreachable) {
            throw new IdentityDirectoryException("The token endpoint could not be reached.", unreachable);
        }
        if (response == null || response.access_token() == null) {
            throw new IdentityDirectoryException("The token endpoint returned no access token.");
        }
        return response.access_token();
    }

    @SuppressWarnings("checkstyle:RecordComponentName")
    record TokenResponse(String access_token) {}
}
