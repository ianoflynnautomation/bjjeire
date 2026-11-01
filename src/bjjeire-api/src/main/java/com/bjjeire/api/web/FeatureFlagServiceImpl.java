package com.bjjeire.api.web;

import com.bjjeire.api.config.BjjEireProperties;
import java.util.Collections;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;

/**
 * Config-backed {@link FeatureFlagService}.
 *
 * <p>Each known flag is resolved once from {@link BjjEireProperties#featureFlags()} into an immutable map. That map is
 * the local cache: a lookup does not re-read configuration and does not leave the process. Configuration keys may use
 * {@code -} or {@code _} and any letter case; the wire names stay PascalCase.
 */
@Service
public class FeatureFlagServiceImpl implements FeatureFlagService {
    private final Map<FeatureFlag, Boolean> resolved;

    public FeatureFlagServiceImpl(BjjEireProperties properties) {
        Map<String, Boolean> configured =
                Objects.requireNonNull(properties, "properties").featureFlags();
        EnumMap<FeatureFlag, Boolean> snapshot = new EnumMap<>(FeatureFlag.class);
        for (FeatureFlag flag : FeatureFlag.values()) {
            snapshot.put(flag, match(configured, flag.wireName()));
        }
        this.resolved = Map.copyOf(snapshot);
    }

    @Override
    public boolean isEnabled(FeatureFlag flag, FeatureFlagContext context) {
        Objects.requireNonNull(flag, "flag");
        Objects.requireNonNull(context, "context");
        // Global toggles ignore the subject. The context is still required so a later provider can
        // target on the same call, and so a caller cannot forget who they are evaluating for.
        return Boolean.TRUE.equals(resolved.get(flag));
    }

    @Override
    public Map<String, Boolean> frontendFlags() {
        Map<String, Boolean> flags = new LinkedHashMap<>();
        for (FeatureFlag flag : FeatureFlag.values()) {
            flags.put(flag.wireName(), isEnabled(flag, FeatureFlagContext.anonymous()));
        }
        return Collections.unmodifiableMap(flags);
    }

    private static boolean match(Map<String, Boolean> configured, String wireName) {
        Boolean exactMatch = configured.get(wireName);
        if (exactMatch != null) {
            return exactMatch;
        }
        String normalizedName = normalize(wireName);
        for (Map.Entry<String, Boolean> entry : configured.entrySet()) {
            Boolean value = entry.getValue();
            if (value != null && normalize(entry.getKey()).equals(normalizedName)) {
                return value;
            }
        }
        return false;
    }

    private static String normalize(String name) {
        return name.replace("-", "").replace("_", "").toLowerCase(Locale.ROOT);
    }
}
