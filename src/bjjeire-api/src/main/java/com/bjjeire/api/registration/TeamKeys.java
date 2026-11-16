package com.bjjeire.api.registration;

import com.bjjeire.api.competitor.Academy;
import java.util.Locale;

/**
 * Grouping keys for academy and affiliation points (research R8): a directory gym by its id, otherwise the name
 * trimmed, case-folded and with runs of whitespace collapsed, so "Team X" and " team x" count together.
 */
final class TeamKeys {
    private TeamKeys() {}

    static String academyKey(Academy academy) {
        if (academy == null) {
            return null;
        }
        if (academy.gymId() != null) {
            return "gym:" + academy.gymId();
        }
        String name = normalise(academy.name());
        return name == null ? null : "name:" + name;
    }

    static String affiliationKey(String affiliation) {
        return normalise(affiliation);
    }

    private static String normalise(String name) {
        if (name == null || name.isBlank()) {
            return null;
        }
        return name.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }
}
