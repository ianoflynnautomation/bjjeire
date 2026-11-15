package com.bjjeire.api.competitor;

import com.bjjeire.api.config.BjjEireProperties;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Chooses the Graph directory when its credentials are configured, and the stand-in otherwise. */
@Configuration
class IdentityDirectoryConfig {
    /** A hung directory must not hold the delete request open; the identity is already refused by then. */
    private static final Duration TIMEOUT = Duration.ofSeconds(10);

    private static ClientHttpRequestFactory timeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(TIMEOUT);
        factory.setReadTimeout(TIMEOUT);
        return factory;
    }

    @Bean
    IdentityDirectory identityDirectory(BjjEireProperties properties) {
        BjjEireProperties.CompetitorDirectory settings = properties.competitorDirectory();
        return settings.configured()
                ? new GraphIdentityDirectory(settings, RestClient.builder().requestFactory(timeouts()))
                : new UnconfiguredIdentityDirectory();
    }
}
