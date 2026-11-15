package com.bjjeire.api.web;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.config.BjjEireProperties;
import com.bjjeire.api.config.LocalSignInTokens;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Issues an organiser token to anyone who asks, so the admin screens work in local development (ADR-0014).
 *
 * <p>Exists only under the {@code local} profile with {@code bjjeire.local-sign-in.enabled}; {@code SecurityConfig}
 * refuses to start with the property on under any other profile. Hidden from the published OpenAPI document.
 */
@Hidden
@RestController
@RequiredArgsConstructor
@Profile(LocalSignInTokens.REQUIRED_PROFILE)
@ConditionalOnProperty(prefix = "bjjeire.local-sign-in", name = "enabled", havingValue = "true")
public class LocalSignInController {
    private final BjjEireProperties properties;
    private final Clock clock;

    @PostMapping(ApiRoutes.LOCAL_SIGN_IN)
    public LocalSignInTokens.Issued signIn() {
        return LocalSignInTokens.issue(
                properties.localSignIn().secret(), properties.auth().writerScope(), clock);
    }

    /** A competitor token for whoever typed this email; the same email is always the same competitor. */
    @PostMapping(ApiRoutes.LOCAL_COMPETITOR_SIGN_IN)
    public LocalSignInTokens.Issued signInCompetitor(@RequestBody @Valid CompetitorSignIn request) {
        return LocalSignInTokens.issueCompetitor(
                properties.localSignIn().secret(), properties.competitorAuth().scope(), request.email(), clock);
    }

    /** @param email identifies the local competitor */
    public record CompetitorSignIn(
            @NotBlank @Email @Size(max = 254) String email) {}
}
