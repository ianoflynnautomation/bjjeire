package com.bjjeire.api.competitor;

import com.azure.core.credential.TokenCredential;
import com.azure.core.http.HttpClient;
import com.azure.core.http.jdk.httpclient.JdkHttpClientBuilder;
import com.azure.identity.ClientSecretCredentialBuilder;
import com.azure.identity.WorkloadIdentityCredentialBuilder;
import com.bjjeire.api.config.BjjEireProperties;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Chooses the Graph directory when its credentials are configured, and the stand-in otherwise. */
@Configuration
class IdentityDirectoryConfig {
    /** A hung directory must not hold the delete request open; the identity is already refused by then. */
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    /**
     * The app-only credential: the client secret when one is set (local, or a cluster without workload identity),
     * otherwise AKS workload identity through the projected service-account token, so no secret is stored.
     */
    static TokenCredential credential(BjjEireProperties.CompetitorDirectory settings) {
        HttpClient http = new JdkHttpClientBuilder()
                .connectionTimeout(TIMEOUT)
                .responseTimeout(TIMEOUT)
                .build();
        if (settings.usesClientSecret()) {
            return new ClientSecretCredentialBuilder()
                    .authorityHost(settings.authorityHost())
                    .tenantId(settings.tenantId())
                    .clientId(settings.clientId())
                    .clientSecret(settings.clientSecret())
                    .httpClient(http)
                    .build();
        }
        return new WorkloadIdentityCredentialBuilder()
                .authorityHost(settings.authorityHost())
                .tenantId(settings.tenantId())
                .clientId(settings.clientId())
                .tokenFilePath(settings.federatedTokenFile())
                .httpClient(http)
                .build();
    }

    @Bean
    IdentityDirectory identityDirectory(BjjEireProperties properties) {
        return identityDirectory(properties.competitorDirectory());
    }

    IdentityDirectory identityDirectory(BjjEireProperties.CompetitorDirectory settings) {
        return settings.configured()
                ? new GraphIdentityDirectory(
                        GraphIdentityDirectory.graphClient(credential(settings), settings.graphBaseUrl()))
                : new UnconfiguredIdentityDirectory();
    }
}
