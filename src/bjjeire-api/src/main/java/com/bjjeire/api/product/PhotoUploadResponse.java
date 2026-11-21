package com.bjjeire.api.product;

/** The stored photo's SHA-256 hex, which is also its address under {@code /api/v1/product/photo/}. */
public record PhotoUploadResponse(String sha256) {}
