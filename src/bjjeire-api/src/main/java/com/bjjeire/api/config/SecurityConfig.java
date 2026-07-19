package com.bjjeire.api.config;

import com.bjjeire.api.common.ApiRoutes;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// The seeder profile runs as a non-web one-shot CLI; web security has nothing
// to secure there and cannot bootstrap without a servlet environment.
@Profile("!seeder")
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http, Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter)
            throws Exception {
        return http.cors(cors -> {})
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(
                                ApiRoutes.FEATURE_FLAG + "/**",
                                ApiRoutes.FEATURE_FLAG_LOWERCASE + "/**",
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
                                ApiRoutes.BJJ_EVENT_LOWERCASE + "/**",
                                ApiRoutes.COMPETITION + "/**",
                                ApiRoutes.COMPETITION_LOWERCASE + "/**",
                                ApiRoutes.DONATE + "/**",
                                ApiRoutes.DONATE_LOWERCASE + "/**",
                                ApiRoutes.GYM + "/**",
                                ApiRoutes.GYM_LOWERCASE + "/**",
                                ApiRoutes.STORE + "/**",
                                ApiRoutes.STORE_LOWERCASE + "/**")
                        .permitAll()
                        .anyRequest()
                        .authenticated())
                .oauth2ResourceServer(
                        oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
                .build();
    }

    @Bean
    Converter<Jwt, AbstractAuthenticationToken> jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(
                jwt -> Stream.concat(scopes.convert(jwt).stream(), roleAuthorities(jwt).stream())
                        .toList());
        return converter;
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

    @SuppressWarnings("unchecked")
    private static Collection<GrantedAuthority> roleAuthorities(Jwt jwt) {
        Collection<?> values;
        Object roles = jwt.getClaims().get("roles");
        if (roles instanceof Collection<?> roleValues) {
            values = roleValues;
        } else {
            Object resourceAccess = jwt.getClaims().get("resource_access");
            if (!(resourceAccess instanceof Map<?, ?> map)) {
                return List.of();
            }

            values = map.values().stream()
                    .filter(Map.class::isInstance)
                    .map(value -> ((Map<String, Object>) value).get("roles"))
                    .filter(Collection.class::isInstance)
                    .flatMap(value -> ((Collection<?>) value).stream())
                    .toList();
        }

        return values.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .<GrantedAuthority>map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
    }
}
