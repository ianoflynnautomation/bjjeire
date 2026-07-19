package com.bjjeire.api.store;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.testsupport.MongoIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class StoreMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldListOnlyActiveStoresWhenListing() throws Exception {
        storeRepository.save(store("Active Store", true));
        storeRepository.save(store("Inactive Store", false));

        ResponseEntity<String> response = restTemplate.getForEntity("/api/v1/Store?page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/0/name").asText()).isEqualTo("Active Store");
        assertThat(body.at("/data/0/isActive").asBoolean()).isTrue();
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(1);
    }

    private static Store store(String name, boolean isActive) {
        Store store = new Store();
        store.setName(name);
        store.setDescription("Equipment store");
        store.setWebsiteUrl("https://example.com/" + name.toLowerCase().replace(" ", "-"));
        store.setActive(isActive);
        return store;
    }
}
