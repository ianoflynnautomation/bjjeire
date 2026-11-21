package com.bjjeire.api.product;

import static com.bjjeire.api.product.ProductTestData.size;
import static com.bjjeire.api.product.ProductTestData.sizes;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.ApiRoutes;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;

/** The public catalogue routes, end to end against MongoDB (User Story 2). */
class ProductIT extends ProductIntegrationTest {

    @Test
    @Tag("#6002")
    void shouldShowAPublishedProductsPageWithAvailabilityButNeverStockOrHeld() {
        String id = published("harp-rashguard", sizes(size("XL", 0), size("S", 3), size("M", 2)));
        mongoTemplate.updateFirst(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id")
                                .is(id)),
                new org.springframework.data.mongodb.core.query.Update().set("sizes.2.held", 2),
                Product.class);

        ResponseEntity<String> page = anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard");

        assertThat(page.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = json(page);
        assertThat(body.at("/name").asString()).isEqualTo("Harp Rashguard");
        assertThat(body.at("/kind").asString()).isEqualTo("RASHGUARD");
        assertThat(body.at("/description").asString()).isEqualTo("Long sleeve, sublimated harp.");
        assertThat(body.at("/priceCents").asInt()).isEqualTo(4500);
        assertThat(body.at("/currency").asString()).isEqualTo("EUR");
        assertThat(body.at("/photos").size()).isEqualTo(1);
        assertThat(body.at("/photos/0").asString()).matches("^[0-9a-f]{64}$");
        assertThat(body.at("/sizes/0/id").asString()).isEqualTo("S");
        assertThat(body.at("/sizes/0/available").asInt()).isEqualTo(3);
        assertThat(body.at("/sizes/0/soldOut").asBoolean()).isFalse();
        assertThat(body.at("/sizes/1/id").asString()).isEqualTo("M");
        assertThat(body.at("/sizes/2/id").asString()).isEqualTo("XL");
        assertThat(body.at("/sizes/2/soldOut").asBoolean()).isTrue();
        assertThat(page.getBody()).doesNotContain("\"stock\"", "\"held\"", "\"status\"", "\"version\"");
    }

    @Test
    @Tag("#6002")
    void shouldShowASizeAllHeldInCheckoutsAsSoldOut() {
        String id = published("harp-rashguard", sizes(size("M", 2)));
        mongoTemplate.updateFirst(
                org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id")
                                .is(id)),
                new org.springframework.data.mongodb.core.query.Update().set("sizes.0.held", 2),
                Product.class);

        JsonNode body = json(anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard"));

        assertThat(body.at("/sizes/0/available").asInt()).isZero();
        assertThat(body.at("/sizes/0/soldOut").asBoolean()).isTrue();
        assertThat(body.at("/soldOut").asBoolean()).isTrue();
    }

    @Test
    @Tag("#6002")
    void shouldAnswerNotFoundForADraftAHiddenProductOrAnUnknownSlug() {
        createdId(ProductTestData.createJson("draft-tee", sizes(size("M", 3))));
        String hidden = published("hidden-shorts", sizes(size("M", 3)));
        hide(hidden);

        for (String slug : new String[] {"draft-tee", "hidden-shorts", "nope"}) {
            ResponseEntity<String> page = anonymousGet(ApiRoutes.PRODUCT + "/" + slug);
            assertThat(page.getStatusCode()).as(slug).isEqualTo(HttpStatus.NOT_FOUND);
            assertThat(page.getBody()).contains("urn:bjjeire:not-found");
        }
    }

    @Test
    @Tag("#6001")
    void shouldListAPublishedProductWithItsFirstPhotoPriceAndOutOfStockMark() {
        published("harp-rashguard", sizes(size("M", 0)));

        ResponseEntity<String> list = anonymousGet(ApiRoutes.PRODUCT);

        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode first = json(list).at("/data/0");
        assertThat(first.at("/slug").asString()).isEqualTo("harp-rashguard");
        assertThat(first.at("/kind").asString()).isEqualTo("RASHGUARD");
        assertThat(first.at("/priceCents").asInt()).isEqualTo(4500);
        assertThat(first.at("/photo").asString()).matches("^[0-9a-f]{64}$");
        assertThat(first.at("/soldOut").asBoolean()).isTrue();
        assertThat(first.has("sizes")).isFalse();
    }

    @Test
    @Tag("#6003")
    void shouldReturnAnEmptyPageWhenNoProductIsPublished() {
        createdId(ProductTestData.createJson("draft-tee", sizes(size("M", 3))));

        ResponseEntity<String> list = anonymousGet(ApiRoutes.PRODUCT);

        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(list).at("/data").size()).isZero();
        assertThat(json(list).at("/pagination/totalItems").asInt()).isZero();
    }
}
