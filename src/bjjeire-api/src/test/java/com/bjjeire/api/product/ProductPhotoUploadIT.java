package com.bjjeire.api.product;

import static com.bjjeire.api.product.ProductTestData.createJson;
import static com.bjjeire.api.product.ProductTestData.size;
import static com.bjjeire.api.product.ProductTestData.sizes;
import static com.bjjeire.api.product.ProductTestData.updateJson;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/** The organiser's photo uploads (research R4, #6013). */
class ProductPhotoUploadIT extends ProductIntegrationTest {
    private static final String SIZES = sizes(size("M", 3));

    @Test
    @Tag("#6013")
    void shouldAcceptJpegPngAndWebpByTheirFirstBytesAndReturnTheirHash() {
        String id = createdId(createJson("harp", SIZES));

        for (byte[] image : new byte[][] {ProductTestData.JPEG, ProductTestData.PNG, ProductTestData.WEBP}) {
            ResponseEntity<String> uploaded = upload(id, image);
            assertThat(uploaded.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            assertThat(json(uploaded).at("/sha256").asString()).matches("^[0-9a-f]{64}$");
        }

        assertThat(photos(id)).hasSize(3);
        assertThat(version(id)).isEqualTo(3);
    }

    @Test
    @Tag("#6013")
    void shouldStoreTheSameBytesOnceAndNameThemOnceOnAProduct() {
        String first = createdId(createJson("harp", SIZES));
        String second = createdId(createJson("other", SIZES));

        String sha = json(upload(first, ProductTestData.PNG)).at("/sha256").asString();
        assertThat(json(upload(first, ProductTestData.PNG)).at("/sha256").asString())
                .isEqualTo(sha);
        upload(second, ProductTestData.PNG);

        assertThat(photos(first)).containsExactly(sha);
        assertThat(photos(second)).containsExactly(sha);
        assertThat(photoFiles()).isEqualTo(1);
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAGifAndBytesThatAreNotAnImageWhateverTheirName() {
        String id = createdId(createJson("harp", SIZES));
        byte[] notJpeg = Arrays.copyOfRange(ProductTestData.PNG, 1, ProductTestData.PNG.length);

        for (byte[] content : new byte[][] {ProductTestData.GIF, notJpeg}) {
            ResponseEntity<String> refused = upload(id, content, "photo.jpg", ORGANISER_TOKEN);
            assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
            assertThat(refused.getBody()).contains("urn:bjjeire:unsupported-image");
        }
        assertThat(photos(id)).isEmpty();
        assertThat(photoFiles()).isZero();
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAPhotoOverFiveMegabytes() throws Exception {
        String id = createdId(createJson("harp", SIZES));
        byte[] huge = Arrays.copyOf(ProductTestData.PNG, ProductRules.MAX_PHOTO_BYTES + 1);

        HttpResponse<String> refused = uploadWithContentLength(id, huge);

        assertThat(refused.statusCode()).isEqualTo(HttpStatus.CONTENT_TOO_LARGE.value());
        assertThat(refused.body()).contains("urn:bjjeire:payload-too-large", "5 MB");
        assertThat(photos(id)).isEmpty();
        assertThat(photoFiles()).isZero();
    }

    /**
     * Sends the upload with a Content-Length, as a browser sends a file. Tomcat closes the connection after a 413; with
     * a chunked body the unread end of it makes the client see a reset instead of the reply.
     */
    private HttpResponse<String> uploadWithContentLength(String id, byte[] content) throws Exception {
        String boundary = "----bjjeire-test-boundary";
        ByteArrayOutputStream body = new ByteArrayOutputStream();
        body.write(("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"big.png\"\r\n"
                        + "Content-Type: application/octet-stream\r\n\r\n")
                .getBytes(StandardCharsets.US_ASCII));
        body.write(content);
        body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.US_ASCII));
        URI uri = restTemplate.getUriTemplateHandler().expand(ADMIN + "/" + id + "/photo");
        try (HttpClient client = HttpClient.newHttpClient()) {
            return client.send(
                    HttpRequest.newBuilder(uri)
                            .header("Authorization", "Bearer " + ORGANISER_TOKEN)
                            .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                            .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                            .build(),
                    HttpResponse.BodyHandlers.ofString());
        }
    }

    @Test
    @Tag("#6013")
    void shouldRefuseASeventhPhoto() {
        String id = createdId(createJson("harp", SIZES));
        for (int i = 0; i < ProductRules.MAX_PHOTOS; i++) {
            assertThat(upload(id, ProductTestData.png(i)).getStatusCode()).isEqualTo(HttpStatus.CREATED);
        }

        ResponseEntity<String> refused = upload(id, ProductTestData.png(99));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:too-many-photos");
        assertThat(photos(id)).hasSize(ProductRules.MAX_PHOTOS);
        assertThat(photoFiles()).isEqualTo(ProductRules.MAX_PHOTOS);
    }

    @Test
    @Tag("#6013")
    void shouldAnswerNotFoundForAnUploadToAnUnknownProduct() {
        assertThat(upload("0123456789abcdef01234567", ProductTestData.PNG).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(photoFiles()).isZero();
    }

    @Test
    @Tag("#6013")
    void shouldReorderPhotosAndDeleteAFileOnlyWhenNoProductNamesIt() {
        String id = createdId(createJson("harp", SIZES));
        String other = createdId(createJson("other", SIZES));
        String shared = json(upload(id, ProductTestData.png(1))).at("/sha256").asString();
        String own = json(upload(id, ProductTestData.png(2))).at("/sha256").asString();
        upload(other, ProductTestData.png(1));

        ResponseEntity<String> reordered =
                update(id, updateJson("harp", 4500, SIZES, "[\"" + own + "\",\"" + shared + "\"]", version(id)));
        assertThat(reordered.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(photos(id)).containsExactly(own, shared);

        update(id, updateJson("harp", 4500, SIZES, "[]", version(id)));

        assertThat(photos(id)).isEmpty();
        assertThat(photoStatus(own)).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(photoStatus(shared)).isEqualTo(HttpStatus.OK);
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAPhotoTheProductDoesNotHave() {
        String id = createdId(createJson("harp", SIZES));

        ResponseEntity<String> refused =
                update(id, updateJson("harp", 4500, SIZES, "[\"" + "c".repeat(64) + "\"]", version(id)));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(refused.getBody()).contains("Photos", "UNKNOWN_PHOTO");
    }

    @Test
    @Tag("#6014")
    void shouldDeleteADraftsPhotosWithIt() {
        String id = createdId(createJson("harp", SIZES));
        String sha = json(upload(id, ProductTestData.png(1))).at("/sha256").asString();

        delete(id);

        assertThat(photoStatus(sha)).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Tag("#6017")
    void shouldRefuseAnUploadWithACompetitorToken() {
        String id = createdId(createJson("harp", SIZES));

        assertThat(upload(id, ProductTestData.PNG, "p.png", COMPETITOR_TOKEN).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(photoFiles()).isZero();
    }

    private long photoFiles() {
        return mongoTemplate.getCollection(ProductPhotoStore.BUCKET + ".files").countDocuments();
    }

    private HttpStatus photoStatus(String sha) {
        return HttpStatus.valueOf(anonymousGet(ApiRoutes.PRODUCT + "/photo/" + sha)
                .getStatusCode()
                .value());
    }
}
