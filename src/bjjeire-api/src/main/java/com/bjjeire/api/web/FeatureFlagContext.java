package com.bjjeire.api.web;

/**
 * Who a flag is evaluated for.
 *
 * <p>Catalogue flags are environment toggles, not per-person experiments. The public endpoint always evaluates
 * {@link #anonymous()}. A server-side caller may pass an opaque {@code subjectKey} (for example a token {@code sub})
 * for a future targeted provider. Email addresses and display names are rejected so this type cannot become a store for
 * direct identifiers. {@link #toString()} never includes the key.
 */
public record FeatureFlagContext(String subjectKey) {
    private static final int MAX_SUBJECT_KEY_LENGTH = 128;

    public FeatureFlagContext {
        if (subjectKey != null) {
            String trimmed = subjectKey.trim();
            if (trimmed.isEmpty()) {
                subjectKey = null;
            } else {
                rejectDirectIdentifier(trimmed);
                subjectKey = trimmed;
            }
        }
    }

    /**
     * Returns a context with no subject.
     *
     * @return anonymous evaluation
     */
    public static FeatureFlagContext anonymous() {
        return new FeatureFlagContext(null);
    }

    @Override
    public String toString() {
        return subjectKey == null ? "FeatureFlagContext[anonymous]" : "FeatureFlagContext[subject]";
    }

    private static void rejectDirectIdentifier(String candidate) {
        if (candidate.length() > MAX_SUBJECT_KEY_LENGTH || containsDirectIdentifier(candidate)) {
            throw new IllegalArgumentException("subjectKey must be an opaque identifier");
        }
    }

    private static boolean containsDirectIdentifier(String candidate) {
        return candidate.indexOf('@') >= 0 || candidate.chars().anyMatch(Character::isWhitespace);
    }
}
