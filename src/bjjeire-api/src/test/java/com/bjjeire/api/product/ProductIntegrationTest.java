package com.bjjeire.api.product;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

/** Calls the product routes the way the SPA does. Adds no context configuration, so it shares the one context. */
abstract class ProductIntegrationTest extends MongoIntegrationTest {
    protected static final String ADMIN = ApiRoutes.PRODUCT + "/admin";
    protected static final String ORGANISER_TOKEN = "integration-test-token";

    @Autowired
    protected ObjectMapper objectMapper;

    protected ResponseEntity<String> exchange(HttpMethod method, String path, String body, String token) {
        return restTemplate.exchange(path, method, jsonEntity(body, token), String.class);
    }

    protected ResponseEntity<String> anonymousGet(String path) {
        return exchange(HttpMethod.GET, path, null, null);
    }

    protected ResponseEntity<String> adminGet(String path) {
        return exchange(HttpMethod.GET, path, null, ORGANISER_TOKEN);
    }

    protected ResponseEntity<String> create(String body) {
        return exchange(HttpMethod.POST, ADMIN, body, ORGANISER_TOKEN);
    }

    protected ResponseEntity<String> update(String id, String body) {
        return exchange(HttpMethod.PUT, ADMIN + "/" + id, body, ORGANISER_TOKEN);
    }

    protected ResponseEntity<String> setStock(String id, String sizesJson, long version) {
        return exchange(
                HttpMethod.PUT,
                ADMIN + "/" + id + "/stock",
                "{\"sizes\":" + sizesJson + ",\"version\":" + version + "}",
                ORGANISER_TOKEN);
    }

    protected ResponseEntity<String> publish(String id) {
        return exchange(HttpMethod.POST, ADMIN + "/" + id + "/publish", null, ORGANISER_TOKEN);
    }

    protected ResponseEntity<String> hide(String id) {
        return exchange(HttpMethod.POST, ADMIN + "/" + id + "/hide", null, ORGANISER_TOKEN);
    }

    protected ResponseEntity<String> delete(String id) {
        return exchange(HttpMethod.DELETE, ADMIN + "/" + id, null, ORGANISER_TOKEN);
    }

    protected ResponseEntity<String> upload(String id, byte[] content, String filename, String token) {
        HttpHeaders partHeaders = new HttpHeaders();
        partHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new HttpEntity<>(new NamedBytes(content, filename), partHeaders));
        HttpHeaders headers = new HttpHeaders();
        if (token != null) {
            headers.setBearerAuth(token);
        }
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        return restTemplate.exchange(
                ADMIN + "/" + id + "/photo", HttpMethod.POST, new HttpEntity<>(body, headers), String.class);
    }

    protected ResponseEntity<String> upload(String id, byte[] content) {
        return upload(id, content, "photo.png", ORGANISER_TOKEN);
    }

    protected JsonNode json(ResponseEntity<String> response) {
        return objectMapper.readTree(response.getBody());
    }

    /** Creates a draft and returns its id. */
    protected String createdId(String body) {
        return json(create(body)).at("/id").asString();
    }

    /** Creates a product with one photo and publishes it; returns its id. */
    protected String published(String slug, String sizesJson) {
        String id = createdId(ProductTestData.createJson(slug, sizesJson));
        upload(id, ProductTestData.png(slug.hashCode()));
        publish(id);
        return id;
    }

    protected long version(String id) {
        return mongoTemplate.findById(id, Product.class).getVersion();
    }

    protected List<String> photos(String id) {
        return mongoTemplate.findById(id, Product.class).getPhotos();
    }

    /** A byte resource with a filename, which a multipart part needs. */
    private static final class NamedBytes extends ByteArrayResource {
        private final String filename;

        NamedBytes(byte[] content, String filename) {
            super(content);
            this.filename = filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }

        @Override
        public boolean equals(Object other) {
            return super.equals(other);
        }

        @Override
        public int hashCode() {
            return super.hashCode();
        }
    }
}
