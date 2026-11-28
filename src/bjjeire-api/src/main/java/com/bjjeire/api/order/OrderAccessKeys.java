package com.bjjeire.api.order;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

/** The 256-bit key in an order's link, and the hash that is stored to check it (research R6, ADR-0018). */
final class OrderAccessKeys {
    private static final SecureRandom RANDOM = new SecureRandom();

    private OrderAccessKeys() {}

    /** 32 random bytes, base64url without padding. */
    static String newKey() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** SHA-256 hex of the key's text. */
    static String hash(String key) {
        return HexFormat.of().formatHex(digest(key));
    }

    /** Whether {@code key} is the one whose hash is stored, compared in constant time. */
    static boolean matches(String key, String storedHash) {
        if (key == null || key.isBlank() || storedHash == null) {
            return false;
        }
        return MessageDigest.isEqual(digest(key), HexFormat.of().parseHex(storedHash));
    }

    private static byte[] digest(String key) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.US_ASCII));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
