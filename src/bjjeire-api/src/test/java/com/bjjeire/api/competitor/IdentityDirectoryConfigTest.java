package com.bjjeire.api.competitor;

import static org.assertj.core.api.Assertions.assertThat;

import com.azure.identity.ClientSecretCredential;
import com.azure.identity.WorkloadIdentityCredential;
import com.bjjeire.api.config.BjjEireProperties.CompetitorDirectory;
import org.junit.jupiter.api.Test;

/** Research R11: which credential the Graph directory uses, and when there is none. */
class IdentityDirectoryConfigTest {
    private static final String TENANT = "11111111-1111-1111-1111-111111111111";

    @Test
    void shouldUseTheClientSecretWhenOneIsSet() {
        CompetitorDirectory settings = new CompetitorDirectory(TENANT, "client-id", "client-secret", "", "", "");

        assertThat(settings.configured()).isTrue();
        assertThat(IdentityDirectoryConfig.credential(settings)).isInstanceOf(ClientSecretCredential.class);
    }

    @Test
    void shouldUseWorkloadIdentityWhenOnlyAFederatedTokenFileIsSet() {
        CompetitorDirectory settings =
                new CompetitorDirectory(TENANT, "client-id", "", "/var/run/secrets/azure/tokens/token", "", "");

        assertThat(settings.configured()).isTrue();
        assertThat(IdentityDirectoryConfig.credential(settings)).isInstanceOf(WorkloadIdentityCredential.class);
    }

    @Test
    void shouldStopTheIdentityAtTheApiOnlyWithoutACredential() {
        CompetitorDirectory settings = new CompetitorDirectory(TENANT, "client-id", "", "", "", "");

        assertThat(settings.configured()).isFalse();
        assertThat(new IdentityDirectoryConfig().identityDirectory(settings))
                .isInstanceOf(UnconfiguredIdentityDirectory.class);
    }

    @Test
    void shouldNeedTheTenantAndTheClient() {
        assertThat(new CompetitorDirectory("", "client-id", "client-secret", "", "", "").configured())
                .isFalse();
        assertThat(new CompetitorDirectory(TENANT, "", "client-secret", "", "", "").configured())
                .isFalse();
    }

    @Test
    void shouldDefaultToThePublicCloudAndNeverPrintTheSecret() {
        CompetitorDirectory settings = new CompetitorDirectory(TENANT, "client-id", "client-secret", null, null, null);

        assertThat(settings.authorityHost()).isEqualTo("https://login.microsoftonline.com/");
        assertThat(settings.graphBaseUrl()).isEqualTo("https://graph.microsoft.com/v1.0");
        assertThat(settings.toString()).doesNotContain("client-secret");
    }
}
