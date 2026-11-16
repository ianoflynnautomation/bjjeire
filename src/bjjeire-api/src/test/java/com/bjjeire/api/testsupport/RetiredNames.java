package com.bjjeire.api.testsupport;

/**
 * The word BJJ Éire competitions were called before ADR-0015. Tests assert that nothing a visitor, competitor or
 * organiser can read contains it (#3011). This is its only occurrence in the API code on purpose.
 */
public final class RetiredNames {
    public static final String OLD_NAME = "tournament";

    private RetiredNames() {}
}
