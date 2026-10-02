package com.bjjeire.api.common;

import org.springframework.dao.OptimisticLockingFailureException;

public final class Versions {
    private Versions() {}

    public static void requireMatch(Long requested, Long current) {
        if (requested == null || !requested.equals(current)) {
            throw new OptimisticLockingFailureException("The resource was modified. Reload it and retry.");
        }
    }
}
