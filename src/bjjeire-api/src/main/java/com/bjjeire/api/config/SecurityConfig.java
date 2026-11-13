package com.bjjeire.api.config;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.web.FeatureFlag;
import com.bjjeire.api.web.FeatureFlagContext;
import com.bjjeire.api.web.FeatureFlagService;
import com.bjjeire.api.web.TournamentFeatureGateFilter;
import java.time.Clock;
import java.time.Duration;
import java.util.Collection;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

@Profile("!seeder")
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private static final Duration COMPETITOR_DISCOVERY_BACKOFF = Duration.ofSeconds(30);

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter,
            SecurityProblemHandlers problemHandlers,
            BjjEireProperties properties,
            JwtDecoder workforceJwtDecoder,
            FeatureFlagService featureFlags,
            ObjectMapper objectMapper,
            Clock clock)
            throws Exception {
        String writerAuthority = "SCOPE_" + properties.auth().writerScope();
        // Two issuers, one filter chain (ADR-0012). The JwtDecoder bean stays the workforce decoder, so
        // Spring Boot's configuration and the integration-test stub both keep working.
        BjjEireProperties.CompetitorAuth competitorAuth = properties.competitorAuth();
        boolean tournamentsEnabled = featureFlags.isEnabled(FeatureFlag.TOURNAMENTS, FeatureFlagContext.anonymous());
        JwtDecoder routingDecoder = routingDecoder(
                workforceJwtDecoder, competitorJwtDecoder(competitorAuth, clock), competitorAuth, tournamentsEnabled);
        // "Authenticated" has always meant a workforce account. A self-registered competitor does not inherit it.
        AuthorizationManager<RequestAuthorizationContext> workforceAccount = (authentication, context) -> {
            Authentication current = authentication.get();
            boolean workforce = current != null
                    && current.isAuthenticated()
                    && !(current instanceof AnonymousAuthenticationToken)
                    && !isCompetitorPrincipal(current, competitorAuth.issuerUri());
            return new AuthorizationDecision(workforce);
        };
        // A competitor is a principal from the competitor tenant holding the competitor role. A workforce
        // account with an app role of the same name is not one.
        AuthorizationManager<RequestAuthorizationContext> competitorAccount = (authentication, context) -> {
            Authentication current = authentication.get();
            boolean competitor = current != null
                    && isCompetitorPrincipal(current, competitorAuth.issuerUri())
                    && current.getAuthorities().stream()
                            .anyMatch(authority -> IssuerAwareAuthoritiesConverter.COMPETITOR_AUTHORITY.equals(
                                    authority.getAuthority()));
            return new AuthorizationDecision(competitor);
        };
        return http.cors(cors -> {})
                // Ahead of authentication: a switched-off feature answers 404, not 401 (ADR-0013).
                .addFilterBefore(
                        new TournamentFeatureGateFilter(featureFlags, objectMapper),
                        BearerTokenAuthenticationFilter.class)
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(handling ->
                        handling.authenticationEntryPoint(problemHandlers).accessDeniedHandler(problemHandlers))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                ApiRoutes.FEATURE_FLAG + "/**",
                                "/health",
                                "/metrics",
                                "/actuator/health/**",
                                "/actuator/info",
                                "/swagger-ui/**",
                                "/v3/api-docs/**")
                        .permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                ApiRoutes.BJJ_EVENT + "/**",
                                ApiRoutes.COMPETITION + "/**",
                                ApiRoutes.DONATE + "/**",
                                ApiRoutes.GYM + "/**",
                                ApiRoutes.STORE + "/**")
                        .permitAll()
                        // Tournament feature (ADR-0012, ADR-0013). Order matters: the first match wins, and
                        // everything not named here falls through to the writer-only rules below.
                        .requestMatchers(HttpMethod.POST, ApiRoutes.STRIPE_WEBHOOK)
                        .permitAll()
                        .requestMatchers(ApiRoutes.COMPETITOR + "/**", ApiRoutes.REGISTRATION + "/**")
                        .access(competitorAccount)
                        // No method restriction on these: Spring MVC serves HEAD through the GET handler.
                        .requestMatchers(ApiRoutes.TOURNAMENT + "/*/eligible-division")
                        .access(competitorAccount)
                        .requestMatchers(
                                ApiRoutes.TOURNAMENT + "/admin",
                                ApiRoutes.TOURNAMENT + "/admin/**",
                                ApiRoutes.TOURNAMENT + "/*/registration",
                                ApiRoutes.TOURNAMENT + "/*/registration/**")
                        .hasAuthority(writerAuthority)
                        .requestMatchers(HttpMethod.GET, ApiRoutes.TOURNAMENT, ApiRoutes.TOURNAMENT + "/**")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/**")
                        .hasAuthority(writerAuthority)
                        .requestMatchers(HttpMethod.PUT, "/**")
                        .hasAuthority(writerAuthority)
                        .requestMatchers(HttpMethod.PATCH, "/**")
                        .hasAuthority(writerAuthority)
                        .requestMatchers(HttpMethod.DELETE, "/**")
                        .hasAuthority(writerAuthority)
                        .anyRequest()
                        .access(workforceAccount))
                .oauth2ResourceServer(oauth2 -> oauth2.authenticationEntryPoint(problemHandlers)
                        .accessDeniedHandler(problemHandlers)
                        .jwt(jwt -> jwt.decoder(routingDecoder).jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .build();
    }

    @Bean
    Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter(BjjEireProperties properties) {
        BjjEireProperties.CompetitorAuth competitorAuth = properties.competitorAuth();
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(
                new IssuerAwareAuthoritiesConverter(competitorAuth.issuerUri(), competitorAuth.scope()));
        return converter;
    }

    /**
     * Chooses between the two decoders. With the feature off no token is ever sent to the competitor tenant: the
     * workforce decoder sees it and rejects its issuer.
     */
    static JwtDecoder routingDecoder(
            JwtDecoder workforce,
            JwtDecoder competitor,
            BjjEireProperties.CompetitorAuth competitorAuth,
            boolean tournamentsEnabled) {
        return new RoutingJwtDecoder(workforce, competitor, tournamentsEnabled ? competitorAuth.issuerUri() : "");
    }

    /**
     * Builds the decoder for competitor tokens. Discovery is deferred to the first competitor token, so a tenant that
     * is unreachable, or still the placeholder, cannot stop the API from starting, and a failed discovery is not
     * repeated for {@link #COMPETITOR_DISCOVERY_BACKOFF}.
     */
    private static JwtDecoder competitorJwtDecoder(BjjEireProperties.CompetitorAuth competitorAuth, Clock clock) {
        return new BackoffJwtDecoder(
                () -> {
                    NimbusJwtDecoder decoder = JwtDecoders.fromIssuerLocation(competitorAuth.issuerUri());
                    decoder.setJwtValidator(competitorTokenValidator(competitorAuth));
                    return decoder;
                },
                COMPETITOR_DISCOVERY_BACKOFF,
                clock);
    }

    /**
     * What a competitor token must satisfy besides its signature: issued by the competitor tenant, not expired, and
     * meant for this API. With no audience configured every token is rejected.
     */
    static OAuth2TokenValidator<Jwt> competitorTokenValidator(BjjEireProperties.CompetitorAuth competitorAuth) {
        List<String> audiences = competitorAuth.audiences();
        OAuth2TokenValidator<Jwt> audience = new JwtClaimValidator<Collection<String>>(
                JwtClaimNames.AUD, values -> values != null && values.stream().anyMatch(audiences::contains));
        return new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(competitorAuth.issuerUri()), audience);
    }

    private static boolean isCompetitorPrincipal(Authentication authentication, String competitorIssuer) {
        return !competitorIssuer.isEmpty()
                && authentication.getPrincipal() instanceof Jwt jwt
                && competitorIssuer.equals(jwt.getClaimAsString(JwtClaimNames.ISS));
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(BjjEireProperties properties) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(properties.cors().allowedOrigins());
        configuration.setAllowedMethods(List.of("GET", "HEAD", "OPTIONS", "POST", "PUT", "DELETE"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setExposedHeaders(
                List.of("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
