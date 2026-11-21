package com.bjjeire.api.product;

import java.util.Arrays;

/** Request bodies and image bytes for the product tests. */
final class ProductTestData {
    /** The smallest PNG signature and header a magic-number check reads. */
    static final byte[] PNG = bytes(
            new int[] {0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52});

    static final byte[] JPEG = bytes(new int[] {0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00});

    static final byte[] WEBP = bytes(
            new int[] {'R', 'I', 'F', 'F', 0x24, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' ', 0x00, 0x00});

    static final byte[] GIF = bytes(new int[] {'G', 'I', 'F', '8', '9', 'a', 0x01, 0x00, 0x01, 0x00});

    private ProductTestData() {}

    /** A create body for a rashguard with the sizes given as JSON, such as {@code {"id":"M","stock":3}}. */
    static String createJson(String slug, String sizesJson) {
        return """
                {
                  "slug": "%s",
                  "name": "Harp Rashguard",
                  "kind": "RASHGUARD",
                  "description": "Long sleeve, sublimated harp.",
                  "priceCents": 4500,
                  "sizes": %s
                }""".formatted(slug, sizesJson);
    }

    /** An update body. */
    static String updateJson(String slug, int priceCents, String sizesJson, String photosJson, long version) {
        return """
                {
                  "slug": "%s",
                  "name": "Harp Rashguard",
                  "kind": "RASHGUARD",
                  "description": "Long sleeve, sublimated harp.",
                  "priceCents": %d,
                  "sizes": %s,
                  "photos": %s,
                  "version": %d
                }""".formatted(slug, priceCents, sizesJson, photosJson, version);
    }

    static String size(String id, int stock) {
        return "{\"id\":\"" + id + "\",\"stock\":" + stock + "}";
    }

    static String sizes(String... sizes) {
        return "[" + String.join(",", sizes) + "]";
    }

    /** A distinct PNG for each seed, so each upload is a different photo. */
    static byte[] png(int seed) {
        byte[] content = Arrays.copyOf(PNG, PNG.length + 4);
        content[PNG.length] = (byte) seed;
        content[PNG.length + 1] = (byte) (seed >> 8);
        return content;
    }

    private static byte[] bytes(int[] values) {
        byte[] result = new byte[values.length];
        for (int i = 0; i < values.length; i++) {
            result[i] = (byte) values[i];
        }
        return result;
    }
}
