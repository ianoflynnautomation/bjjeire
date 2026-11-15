package com.bjjeire.api.competitor;

import com.azure.core.credential.TokenCredential;
import com.azure.core.exception.ClientAuthenticationException;
import com.microsoft.graph.core.requests.GraphClientFactory;
import com.microsoft.graph.serviceclient.GraphServiceClient;
import com.microsoft.kiota.ApiException;
import com.microsoft.kiota.authentication.AzureIdentityAuthenticationProvider;
import java.net.URI;
import java.time.Duration;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;

/**
 * Deletes competitors from the external tenant through the Microsoft Graph SDK with an app-only token (research R11).
 * The token comes from an Azure Identity {@link TokenCredential}, which caches and refreshes it; see
 * {@link IdentityDirectoryConfig#credential} for which one.
 *
 * <p>The application needs the least Graph permission that allows deleting users in that tenant; that permission is
 * still to be confirmed (tasks.md T009).
 */
public class GraphIdentityDirectory implements IdentityDirectory {
    static final String GRAPH_SCOPE = "https://graph.microsoft.com/.default";

    /** A hung directory must not hold the delete request open, retries included; the identity is already refused. */
    private static final Duration CALL_TIMEOUT = Duration.ofSeconds(10);

    /** Entra object ids are GUIDs; anything that is a single safe path segment is accepted. */
    private static final Pattern OBJECT_ID = Pattern.compile("^[A-Za-z0-9-]{1,64}$");

    private final GraphServiceClient graph;

    public GraphIdentityDirectory(GraphServiceClient graph) {
        this.graph = graph;
    }

    /**
     * The Graph client with the SDK's own middleware (retry, redirect, telemetry). The token is sent only to the host
     * of {@code graphBaseUrl}.
     *
     * @param credential the app-only credential
     * @param graphBaseUrl Graph's base address, for example {@code https://graph.microsoft.com/v1.0}
     */
    static GraphServiceClient graphClient(TokenCredential credential, String graphBaseUrl) {
        String host = URI.create(graphBaseUrl).getHost();
        AzureIdentityAuthenticationProvider tokens =
                new AzureIdentityAuthenticationProvider(credential, new String[] {host}, GRAPH_SCOPE);
        GraphServiceClient client = new GraphServiceClient(
                tokens, GraphClientFactory.create().callTimeout(CALL_TIMEOUT).build());
        client.getRequestAdapter().setBaseUrl(graphBaseUrl);
        return client;
    }

    @Override
    public void deleteUser(String objectId) {
        if (objectId == null || !OBJECT_ID.matcher(objectId).matches()) {
            throw new IdentityDirectoryException("The token carried no usable directory object id.");
        }
        try {
            graph.users().byUserId(objectId).delete();
        } catch (ApiException refused) {
            if (refused.getResponseStatusCode() == HttpStatus.NOT_FOUND.value()) {
                return;
            }
            throw new IdentityDirectoryException(
                    "Graph refused to delete the user: HTTP " + refused.getResponseStatusCode(), null);
        } catch (RuntimeException failed) {
            if (causedByTokenFailure(failed)) {
                // The identity library's message can echo request details; report the kind of failure only.
                throw new IdentityDirectoryException("No app-only Graph token could be had.", null);
            }
            throw new IdentityDirectoryException("Graph could not be reached.", failed);
        }
    }

    private static boolean causedByTokenFailure(Throwable failure) {
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            if (cause instanceof ClientAuthenticationException) {
                return true;
            }
        }
        return false;
    }
}
