package com.bjjeire.api.store;

public record StoreDto(
        String id, String name, String description, String websiteUrl, String logoUrl, boolean isActive) {}
