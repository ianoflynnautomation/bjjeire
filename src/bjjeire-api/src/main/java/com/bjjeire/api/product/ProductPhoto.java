package com.bjjeire.api.product;

import java.util.Arrays;

/** A stored photo's bytes and the content type its first bytes showed. Not a record: records should not hold arrays. */
public final class ProductPhoto {
    private final byte[] content;
    private final String contentType;

    public ProductPhoto(byte[] content, String contentType) {
        this.content = Arrays.copyOf(content, content.length);
        this.contentType = contentType;
    }

    public byte[] content() {
        return Arrays.copyOf(content, content.length);
    }

    public String contentType() {
        return contentType;
    }
}
