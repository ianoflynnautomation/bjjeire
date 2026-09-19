package com.bjjeire.api.store;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

class StoreMongoRepositoryIT extends MongoIntegrationTest {
    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldListOnlyActiveStoresWhenListing() throws Exception {
        storeRepository.save(store("Active Store", true));
        storeRepository.save(store("Inactive Store", false));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.STORE + "?page=1&pageSize=20", String.class);

        JsonNode body = objectMapper.readTree(response.getBody());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(body.at("/data/0/name").asText()).isEqualTo("Active Store");
        assertThat(body.at("/data/0/isActive").asBoolean()).isTrue();
        assertThat(body.at("/pagination/totalItems").asInt()).isEqualTo(1);
    }

    @Test
    void shouldListActiveStoresOrderedByName() throws Exception {
        storeRepository.save(store("Zebra Store", true));
        storeRepository.save(store("Alpha Store", true));
        storeRepository.save(store("Inactive Store", false));

        ResponseEntity<String> response =
                restTemplate.getForEntity(ApiRoutes.STORE + "?page=1&pageSize=20", String.class);

        JsonNode data = objectMapper.readTree(response.getBody()).at("/data");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(data).hasSize(2);
        assertThat(data.get(0).at("/name").asText()).isEqualTo("Alpha Store");
        assertThat(data.get(1).at("/name").asText()).isEqualTo("Zebra Store");
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
