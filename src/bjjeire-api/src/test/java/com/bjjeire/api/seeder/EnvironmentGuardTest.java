package com.bjjeire.api.seeder;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class EnvironmentGuardTest {
    @Test
    void allowsDevelopmentEnvironment() {
        assertThat(EnvironmentGuard.isAllowed("Development", false)).isTrue();
        assertThat(EnvironmentGuard.isAllowed("development", false)).isTrue();
    }

    @Test
    void refusesOtherEnvironmentsWithoutForce() {
        assertThat(EnvironmentGuard.isAllowed("Production", false)).isFalse();
        assertThat(EnvironmentGuard.isAllowed("Staging", false)).isFalse();
    }

    @Test
    void forceOverridesTheGuard() {
        assertThat(EnvironmentGuard.isAllowed("Production", true)).isTrue();
    }
}
