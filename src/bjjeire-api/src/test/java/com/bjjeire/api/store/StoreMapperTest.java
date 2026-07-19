package com.bjjeire.api.store;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class StoreMapperTest {
    @Test
    void toDtoMapsStoreFields() {
        Store store = new Store();
        store.setId("665624c1ad01ce465c6cf456");
        store.setName("BJJ Shop");
        store.setDescription("Equipment store");
        store.setWebsiteUrl("https://example.com");
        store.setLogoUrl("https://example.com/logo.webp");
        store.setActive(true);

        StoreDto dto = StoreMapper.toDto(store);

        assertThat(dto.id()).isEqualTo("665624c1ad01ce465c6cf456");
        assertThat(dto.name()).isEqualTo("BJJ Shop");
        assertThat(dto.websiteUrl()).isEqualTo("https://example.com");
        assertThat(dto.logoUrl()).isEqualTo("https://example.com/logo.webp");
        assertThat(dto.isActive()).isTrue();
    }
}
