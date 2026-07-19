package com.bjjeire.api.store;

public final class StoreMapper {
    private StoreMapper() {}

    public static StoreDto toDto(Store store) {
        return new StoreDto(
                store.getId(),
                store.getName(),
                store.getDescription(),
                store.getWebsiteUrl(),
                store.getLogoUrl(),
                store.isActive());
    }
}
