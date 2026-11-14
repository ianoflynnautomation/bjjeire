package com.bjjeire.api.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

/** ADR-0012: authorities depend on which tenant issued the token. */
class IssuerAwareAuthoritiesConverterTest {
    private static final String WORKFORCE_ISSUER = "https://login.microsoftonline.com/workforce/v2.0";
    private static final String COMPETITOR_ISSUER = "https://competitors.ciamlogin.com/competitors/v2.0";
    private static final String COMPETITOR_SCOPE = "access_as_competitor";

    private final IssuerAwareAuthoritiesConverter converter =
            new IssuerAwareAuthoritiesConverter(COMPETITOR_ISSUER, COMPETITOR_SCOPE);

    @Test
    void shouldMapWorkforceScopeToScopeAuthority() {
        assertThat(authorities(jwt(WORKFORCE_ISSUER).claim("scp", "access_as_writer")))
                .containsExactly("SCOPE_access_as_writer");
    }

    @Test
    void shouldMapWorkforceRolesToRoleAuthorities() {
        assertThat(authorities(jwt(WORKFORCE_ISSUER).claim("roles", List.of("Tests.Invoke"))))
                .containsExactly("ROLE_Tests.Invoke");
    }

    @Test
    void shouldKeepMappingScopesWhenTokenHasNoIssuerClaim() {
        Jwt.Builder token =
                Jwt.withTokenValue("t").header("alg", "none").claim("sub", "u").claim("scope", "access_as_writer");

        assertThat(authorities(token)).containsExactly("SCOPE_access_as_writer");
    }

    @Test
    void shouldGrantOnlyCompetitorRoleWhenCompetitorTokenHasCompetitorScope() {
        assertThat(authorities(jwt(COMPETITOR_ISSUER).claim("scp", COMPETITOR_SCOPE)))
                .containsExactly("ROLE_COMPETITOR");
    }

    @Test
    void shouldGrantNothingWhenCompetitorTokenLacksCompetitorScope() {
        assertThat(authorities(jwt(COMPETITOR_ISSUER).claim("scp", "openid profile")))
                .isEmpty();
    }

    /** #5037: a competitor-tenant token can never carry the directory's writer authority. */
    @Test
    @Tag("#5037")
    void shouldNeverTurnCompetitorTenantScopesOrRolesIntoAuthorities() {
        Jwt.Builder token = jwt(COMPETITOR_ISSUER)
                .claim("scp", "access_as_writer " + COMPETITOR_SCOPE)
                .claim("roles", List.of("Admin", "Tests.Invoke"));

        assertThat(authorities(token)).containsExactly("ROLE_COMPETITOR");
    }

    @Test
    void shouldNotGrantCompetitorRoleToWorkforceTokenWithCompetitorScope() {
        assertThat(authorities(jwt(WORKFORCE_ISSUER).claim("scp", COMPETITOR_SCOPE)))
                .containsExactly("SCOPE_" + COMPETITOR_SCOPE);
    }

    @Test
    void shouldTreatBlankCompetitorIssuerAsNoCompetitorTenant() {
        IssuerAwareAuthoritiesConverter noCompetitors = new IssuerAwareAuthoritiesConverter("", COMPETITOR_SCOPE);
        Jwt token = Jwt.withTokenValue("t")
                .header("alg", "none")
                .claim("sub", "u")
                .claim("scp", COMPETITOR_SCOPE)
                .build();

        assertThat(noCompetitors.convert(token))
                .extracting(GrantedAuthority::getAuthority)
                .containsExactly("SCOPE_" + COMPETITOR_SCOPE);
    }

    private Collection<String> authorities(Jwt.Builder token) {
        return converter.convert(token.build()).stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }

    private static Jwt.Builder jwt(String issuer) {
        return Jwt.withTokenValue("t")
                .header("alg", "none")
                .claim("sub", "user-1")
                .claim("iss", issuer);
    }
}
