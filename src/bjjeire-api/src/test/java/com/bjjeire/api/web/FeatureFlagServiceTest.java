package com.bjjeire.api.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.config.BjjEireProperties;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FeatureFlagServiceTest {
    @Test
    void shouldFailClosedWhenConfigurationIsEmpty() {
        FeatureFlagService service = service(Map.of());

        for (FeatureFlag flag : FeatureFlag.values()) {
            assertThat(service.isEnabled(flag, FeatureFlagContext.anonymous())).isFalse();
        }
    }

    @Test
    void shouldMatchExactWireName() {
        FeatureFlagService service = service(Map.of(
                "BjjEvents", true,
                "Gyms", false,
                "Competitions", true,
                "Stores", true));

        assertThat(service.isEnabled(FeatureFlag.BJJ_EVENTS, FeatureFlagContext.anonymous()))
                .isTrue();
        assertThat(service.isEnabled(FeatureFlag.GYMS, FeatureFlagContext.anonymous()))
                .isFalse();
        assertThat(service.isEnabled(FeatureFlag.COMPETITIONS, FeatureFlagContext.anonymous()))
                .isTrue();
        assertThat(service.isEnabled(FeatureFlag.STORES, FeatureFlagContext.anonymous()))
                .isTrue();
    }

    @Test
    void shouldMatchRelaxedConfigurationKey() {
        FeatureFlagService service = service(Map.of(
                "bjj-events", true,
                "gyms", true,
                "competitions", true,
                "stores", true));

        assertThat(service.frontendFlags())
                .containsEntry("BjjEvents", true)
                .containsEntry("Gyms", true)
                .containsEntry("Competitions", true)
                .containsEntry("Stores", true);
    }

    @Test
    void shouldPreferExactKeyOverRelaxedKey() {
        Map<String, Boolean> configured = new LinkedHashMap<>();
        configured.put("BjjEvents", false);
        configured.put("bjj-events", true);

        FeatureFlagService service = service(configured);

        assertThat(service.isEnabled(FeatureFlag.BJJ_EVENTS, FeatureFlagContext.anonymous()))
                .isFalse();
    }

    @Test
    void shouldUseFirstRelaxedKeyInConfigurationOrder() {
        Map<String, Boolean> configured = new LinkedHashMap<>();
        configured.put("bjj_events", false);
        configured.put("bjj-events", true);

        FeatureFlagService service = service(configured);

        assertThat(service.isEnabled(FeatureFlag.BJJ_EVENTS, FeatureFlagContext.anonymous()))
                .isFalse();
    }

    @Test
    void shouldOmitUnknownConfigurationKeysFromTheFrontendSnapshot() {
        Map<String, Boolean> configured = new LinkedHashMap<>();
        configured.put("BjjEvents", true);
        configured.put("RetiredFlag", true);
        configured.put("gyms", true);

        assertThat(service(configured).frontendFlags().keySet())
                .containsExactly("BjjEvents", "Gyms", "Competitions", "Stores");
        assertThat(service(configured).frontendFlags())
                .containsEntry("BjjEvents", true)
                .containsEntry("Gyms", true)
                .containsEntry("Competitions", false)
                .containsEntry("Stores", false);
    }

    @Test
    void shouldKeepTheSameResultForAnonymousAndOpaqueSubjects() {
        FeatureFlagService service = service(Map.of("Gyms", true, "Stores", false));
        FeatureFlagContext subject = new FeatureFlagContext("principal-sub-1");

        assertThat(service.isEnabled(FeatureFlag.GYMS, FeatureFlagContext.anonymous()))
                .isTrue();
        assertThat(service.isEnabled(FeatureFlag.GYMS, subject)).isTrue();
        assertThat(service.isEnabled(FeatureFlag.STORES, subject)).isFalse();
        assertThat(service.frontendFlags()).doesNotContainKey("subjectKey");
        assertThat(service.frontendFlags().toString()).doesNotContain("principal-sub-1");
    }

    @Test
    void shouldRejectMutationOfTheFrontendSnapshot() {
        FeatureFlagService service = service(Map.of("Gyms", true));
        Map<String, Boolean> snapshot = service.frontendFlags();

        assertThatThrownBy(() -> snapshot.put("Gyms", false)).isInstanceOf(UnsupportedOperationException.class);
        assertThat(service.frontendFlags()).containsEntry("Gyms", true);
    }

    @Test
    void shouldRejectNullFlagAndNullContext() {
        FeatureFlagService service = service(Map.of());

        assertThatThrownBy(() -> service.isEnabled(null, FeatureFlagContext.anonymous()))
                .isInstanceOf(NullPointerException.class);
        assertThatThrownBy(() -> service.isEnabled(FeatureFlag.GYMS, null)).isInstanceOf(NullPointerException.class);
    }

    @Test
    void shouldRejectEmailAndDisplayNameSubjectKeysWithoutEchoingThem() {
        assertThatThrownBy(() -> new FeatureFlagContext("ian@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageNotContaining("ian@example.com")
                .hasMessageNotContaining("@");
        assertThatThrownBy(() -> new FeatureFlagContext("Jane Doe"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageNotContaining("Jane");
    }

    @Test
    void shouldTreatBlankSubjectAsAnonymousAndHideTheKeyFromToString() {
        assertThat(new FeatureFlagContext("   ")).isEqualTo(FeatureFlagContext.anonymous());
        assertThat(new FeatureFlagContext("  principal-sub-1  ")).isEqualTo(new FeatureFlagContext("principal-sub-1"));
        assertThat(new FeatureFlagContext("principal-sub-1").toString()).doesNotContain("principal-sub-1");
    }

    private static FeatureFlagService service(Map<String, Boolean> flags) {
        return new FeatureFlagServiceImpl(new BjjEireProperties(null, null, null, null, null, flags));
    }
}
