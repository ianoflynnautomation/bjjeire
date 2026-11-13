package com.bjjeire.api.config;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

/**
 * Maps a validated token to authorities according to the tenant that issued it (ADR-0012).
 *
 * <p>A token from the competitor issuer is granted {@link #COMPETITOR_AUTHORITY} when it carries the competitor scope,
 * and nothing else. Its scopes and roles are never turned into authorities, so a member of the public cannot obtain the
 * directory's writer authority by naming a scope in their own tenant. Every other token keeps the workforce mapping.
 */
public final class IssuerAwareAuthoritiesConverter implements Converter<Jwt, Collection<GrantedAuthority>> {
    /** Role name, for {@code hasRole}. */
    public static final String COMPETITOR_ROLE = "COMPETITOR";

    /** Authority granted to a signed-in competitor. */
    public static final String COMPETITOR_AUTHORITY = "ROLE_" + COMPETITOR_ROLE;

    private final JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();
    private final String competitorIssuer;
    private final String competitorScopeAuthority;

    public IssuerAwareAuthoritiesConverter(String competitorIssuer, String competitorScope) {
        this.competitorIssuer = competitorIssuer == null ? "" : competitorIssuer.trim();
        this.competitorScopeAuthority = "SCOPE_" + competitorScope;
    }

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        if (isCompetitorToken(jwt)) {
            boolean hasCompetitorScope = scopes.convert(jwt).stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(competitorScopeAuthority::equals);
            return hasCompetitorScope ? List.of(new SimpleGrantedAuthority(COMPETITOR_AUTHORITY)) : List.of();
        }
        return Stream.concat(scopes.convert(jwt).stream(), roleAuthorities(jwt).stream())
                .toList();
    }

    private boolean isCompetitorToken(Jwt jwt) {
        return !competitorIssuer.isEmpty() && competitorIssuer.equals(jwt.getClaimAsString(JwtClaimNames.ISS));
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
