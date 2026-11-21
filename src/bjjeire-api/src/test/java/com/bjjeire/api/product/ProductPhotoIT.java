package com.bjjeire.api.product;

import static com.bjjeire.api.product.ProductTestData.size;
import static com.bjjeire.api.product.ProductTestData.sizes;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** Serving product photos by content address (research R4). */
class ProductPhotoIT extends ProductIntegrationTest {

    @Test
    @Tag("#6001")
    @Tag("#6002")
    void shouldServeTheStoredBytesWithTheirCheckedTypeForAYear() {
        String id = createdId(ProductTestData.createJson("harp", sizes(size("M", 1))));
        String sha = json(upload(id, ProductTestData.JPEG, "renamed.png", ORGANISER_TOKEN))
                .at("/sha256")
                .asString();

        ResponseEntity<byte[]> photo = restTemplate.exchange(
                ApiRoutes.PRODUCT + "/photo/" + sha, HttpMethod.GET, jsonEntity(null, null), byte[].class);

        assertThat(photo.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(photo.getBody()).isEqualTo(ProductTestData.JPEG);
        assertThat(photo.getHeaders().getContentType()).hasToString("image/jpeg");
        assertThat(photo.getHeaders().getCacheControl().split(",\\s*"))
                .containsExactlyInAnyOrder("public", "max-age=31536000", "immutable");
        assertThat(photo.getHeaders().getFirst("X-Content-Type-Options")).isEqualTo("nosniff");
    }

    @Test
    @Tag("#6002")
    void shouldAnswerNotFoundForAnUnknownOrMalformedHash() {
        assertThat(anonymousGet(ApiRoutes.PRODUCT + "/photo/" + "b".repeat(64)).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(anonymousGet(ApiRoutes.PRODUCT + "/photo/not-a-hash").getStatusCode())
                .isIn(HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST);
    }
}
