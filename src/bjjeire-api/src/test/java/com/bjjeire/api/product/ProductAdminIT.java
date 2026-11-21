package com.bjjeire.api.product;

import static com.bjjeire.api.product.ProductTestData.createJson;
import static com.bjjeire.api.product.ProductTestData.size;
import static com.bjjeire.api.product.ProductTestData.sizes;
import static com.bjjeire.api.product.ProductTestData.updateJson;
import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditLogEntry;
import com.bjjeire.api.common.ApiRoutes;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;

/** The organiser's product routes, end to end against MongoDB (User Story 4). */
class ProductAdminIT extends ProductIntegrationTest {
    private static final String THREE_SIZES = sizes(size("S", 3), size("M", 4), size("L", 2));

    @Test
    @Tag("#6013")
    void shouldStoreANewProductAsADraftThatVisitorsCannotSee() {
        ResponseEntity<String> created = create(createJson("harp-rashguard", THREE_SIZES));

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = json(created);
        String id = body.at("/id").asString();
        assertThat(body.at("/status").asString()).isEqualTo("DRAFT");
        assertThat(body.at("/photos").size()).isZero();
        assertThat(body.at("/version").asLong()).isZero();
        assertThat(body.at("/sizes/1/id").asString()).isEqualTo("M");
        assertThat(body.at("/sizes/1/stock").asInt()).isEqualTo(4);
        assertThat(body.at("/sizes/1/held").asInt()).isZero();
        assertThat(created.getHeaders().getLocation()).hasToString(ADMIN + "/" + id);

        assertThat(anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard").getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(json(anonymousGet(ApiRoutes.PRODUCT)).at("/data").size()).isZero();

        Product stored = mongoTemplate.findById(id, Product.class);
        assertThat(stored.getCreatedBy()).isEqualTo(AUTHENTICATED_USER);
        assertThat(stored.getCreatedOnUtc()).isEqualTo(FIXED_NOW);
    }

    @Test
    @Tag("#6013")
    void shouldListAndOpenProductsInEveryStatusForTheOrganiser() {
        createdId(createJson("draft-tee", THREE_SIZES));
        String hidden = published("hidden-shorts", THREE_SIZES);
        hide(hidden);
        published("live-rash", THREE_SIZES);

        JsonNode list = json(adminGet(ADMIN + "?page=1&pageSize=100"));
        List<String> statuses = new java.util.ArrayList<>();
        list.at("/data").forEach(item -> statuses.add(item.at("/status").asString()));

        assertThat(statuses).containsExactlyInAnyOrder("DRAFT", "HIDDEN", "PUBLISHED");
        assertThat(json(adminGet(ADMIN + "/" + hidden)).at("/sizes/0/stock").asInt())
                .isEqualTo(3);
    }

    @Test
    @Tag("#6014")
    void shouldShowAPublishedProductAndRemoveItWhenHidden() {
        String id = createdId(createJson("harp-rashguard", THREE_SIZES));
        upload(id, ProductTestData.png(1));

        ResponseEntity<String> published = publish(id);

        assertThat(published.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(published).at("/status").asString()).isEqualTo("PUBLISHED");
        assertThat(anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard").getStatusCode())
                .isEqualTo(HttpStatus.OK);
        assertThat(json(anonymousGet(ApiRoutes.PRODUCT)).at("/data/0/slug").asString())
                .isEqualTo("harp-rashguard");

        ResponseEntity<String> hidden = hide(id);

        assertThat(json(hidden).at("/status").asString()).isEqualTo("HIDDEN");
        assertThat(anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard").getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(json(anonymousGet(ApiRoutes.PRODUCT)).at("/data").size()).isZero();

        assertThat(json(publish(id)).at("/status").asString()).isEqualTo("PUBLISHED");
    }

    @Test
    @Tag("#6014")
    void shouldRefuseToPublishWithoutAPhoto() {
        String id = createdId(createJson("harp-rashguard", THREE_SIZES));

        ResponseEntity<String> refused = publish(id);

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:product-not-publishable");
        assertThat(anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard").getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Tag("#6014")
    void shouldRefuseToRemoveTheLastPhotoOfAPublishedProduct() {
        String id = published("harp-rashguard", THREE_SIZES);

        ResponseEntity<String> refused = update(id, updateJson("harp-rashguard", 4500, THREE_SIZES, "[]", version(id)));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:product-not-publishable");
    }

    @Test
    @Tag("#6014")
    void shouldRefuseToHideADraft() {
        String id = createdId(createJson("harp-rashguard", THREE_SIZES));

        assertThat(hide(id).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @Tag("#6015")
    void shouldShowAPriceChangeOnTheNextRead() {
        String id = published("harp-rashguard", THREE_SIZES);
        anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard");
        anonymousGet(ApiRoutes.PRODUCT);

        ResponseEntity<String> updated = update(
                id,
                updateJson(
                        "harp-rashguard", 5000, THREE_SIZES, "[\"" + photos(id).get(0) + "\"]", version(id)));

        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard"))
                        .at("/priceCents")
                        .asInt())
                .isEqualTo(5000);
        assertThat(json(anonymousGet(ApiRoutes.PRODUCT))
                        .at("/data/0/priceCents")
                        .asInt())
                .isEqualTo(5000);
    }

    @Test
    @Tag("#6016")
    void shouldShowAStockChangeOnTheNextPublicRead() {
        String id = published("harp-rashguard", THREE_SIZES);
        anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard");

        ResponseEntity<String> stocked = setStock(id, sizes(size("M", 0)), version(id));

        assertThat(stocked.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(stocked).at("/sizes/1/stock").asInt()).isZero();
        assertThat(json(stocked).at("/sizes/0/stock").asInt()).isEqualTo(3);
        JsonNode page = json(anonymousGet(ApiRoutes.PRODUCT + "/harp-rashguard"));
        assertThat(page.at("/sizes/1/id").asString()).isEqualTo("M");
        assertThat(page.at("/sizes/1/soldOut").asBoolean()).isTrue();
    }

    @Test
    @Tag("#6016")
    void shouldRefuseStockBelowWhatIsHeldNamingTheNumberHeld() {
        String id = published("harp-rashguard", THREE_SIZES);
        holdTwoOfM(id);

        ResponseEntity<String> refused = setStock(id, sizes(size("M", 1)), version(id));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:stock-below-held", "2");
        assertThat(mongoTemplate.findById(id, Product.class).getSizes().get(1).getStock())
                .isEqualTo(4);
    }

    @Test
    @Tag("#6016")
    void shouldKeepWhatIsHeldWhenTheOrganiserEdits() {
        String id = published("harp-rashguard", THREE_SIZES);
        holdTwoOfM(id);

        ResponseEntity<String> updated = update(
                id,
                updateJson(
                        "harp-rashguard",
                        4500,
                        sizes(size("S", 3), size("M", 6), size("L", 2)),
                        "[\"" + photos(id).get(0) + "\"]",
                        version(id)));

        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(json(updated).at("/sizes/1/held").asInt()).isEqualTo(2);
        assertThat(json(updated).at("/sizes/1/available").asInt()).isEqualTo(4);
    }

    @Test
    @Tag("#6016")
    void shouldRefuseToRemoveASizeThatCheckoutsHold() {
        String id = published("harp-rashguard", THREE_SIZES);
        holdTwoOfM(id);

        ResponseEntity<String> refused = update(
                id,
                updateJson(
                        "harp-rashguard",
                        4500,
                        sizes(size("S", 3), size("L", 2)),
                        "[\"" + photos(id).get(0) + "\"]",
                        version(id)));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:size-has-holds");
    }

    @Test
    @Tag("#6016")
    void shouldRefuseAnEditMadeFromAStaleVersion() {
        String id = createdId(createJson("harp-rashguard", THREE_SIZES));
        long stale = version(id);
        setStock(id, sizes(size("S", 9)), stale);

        ResponseEntity<String> refused = update(id, updateJson("harp-rashguard", 4500, THREE_SIZES, "[]", stale));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:conflict", "Reload");
        assertThat(setStock(id, sizes(size("S", 1)), stale).getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @Tag("#6013")
    void shouldRefuseAnUpdateWithoutAVersion() {
        String id = createdId(createJson("harp-rashguard", THREE_SIZES));

        ResponseEntity<String> refused = update(
                id, updateJson("harp-rashguard", 4500, THREE_SIZES, "[]", 0).replace(",\n  \"version\": 0", ""));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(refused.getBody()).contains("Version");
    }

    @Test
    @Tag("#6013")
    void shouldRefuseASlugThatIsAlreadyTaken() {
        create(createJson("harp-rashguard", THREE_SIZES));

        ResponseEntity<String> refused = create(createJson("harp-rashguard", THREE_SIZES));

        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:conflict", "slug");
    }

    @Test
    @Tag("#6014")
    void shouldDeleteOnlyADraft() {
        String draft = createdId(createJson("draft-tee", THREE_SIZES));
        String live = published("live-rash", THREE_SIZES);

        assertThat(delete(draft).getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(mongoTemplate.findById(draft, Product.class)).isNull();
        assertThat(delete(draft).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        ResponseEntity<String> refused = delete(live);
        assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(refused.getBody()).contains("urn:bjjeire:product-not-draft");
    }

    @Test
    @Tag("#6013")
    void shouldAnswerNotFoundForAnUnknownProduct() {
        String missing = "0123456789abcdef01234567";

        assertThat(adminGet(ADMIN + "/" + missing).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(publish(missing).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(setStock(missing, sizes(size("S", 1)), 0).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @Tag("#6013")
    void shouldRecordEachOrganiserWriteInTheAuditLog() {
        String id = createdId(createJson("harp-rashguard", THREE_SIZES));
        upload(id, ProductTestData.png(1));
        publish(id);
        setStock(id, sizes(size("S", 1)), version(id));
        hide(id);

        List<AuditLogEntry> entries = mongoTemplate.findAll(AuditLogEntry.class);
        assertThat(entries)
                .extracting(AuditLogEntry::getAction)
                .containsExactlyInAnyOrder(
                        AuditAction.Create,
                        AuditAction.Update,
                        AuditAction.Publish,
                        AuditAction.Update,
                        AuditAction.Update);
        assertThat(entries).allSatisfy(entry -> {
            assertThat(entry.getEntityType()).isEqualTo(Product.ENTITY_NAME);
            assertThat(entry.getEntityId()).isEqualTo(id);
            assertThat(entry.getActor()).isEqualTo(AUTHENTICATED_USER);
        });
    }

    /** #6017: only the organiser creates, edits, publishes, hides, restocks or deletes a product. */
    @Test
    @Tag("#6017")
    void shouldRefuseEveryProductWriteToAnyoneWhoIsNotTheOrganiser() {
        String id = createdId(createJson("harp-rashguard", THREE_SIZES));
        String edit = updateJson("harp-rashguard", 4500, THREE_SIZES, "[]", 0);
        String stock = "{\"sizes\":" + sizes(size("S", 1)) + ",\"version\":0}";

        record Caller(String token, HttpStatus expected) {}
        record Call(HttpMethod method, String path, String body) {}
        for (Caller caller : List.of(
                new Caller(null, HttpStatus.UNAUTHORIZED),
                new Caller(COMPETITOR_TOKEN, HttpStatus.FORBIDDEN),
                new Caller(COMPETITOR_TOKEN_WITHOUT_SCOPE, HttpStatus.FORBIDDEN),
                new Caller(READER_TOKEN, HttpStatus.FORBIDDEN))) {
            for (Call call : List.of(
                    new Call(HttpMethod.GET, ADMIN, null),
                    new Call(HttpMethod.GET, ADMIN + "/" + id, null),
                    new Call(HttpMethod.POST, ADMIN, createJson("another", THREE_SIZES)),
                    new Call(HttpMethod.PUT, ADMIN + "/" + id, edit),
                    new Call(HttpMethod.POST, ADMIN + "/" + id + "/publish", null),
                    new Call(HttpMethod.POST, ADMIN + "/" + id + "/hide", null),
                    new Call(HttpMethod.PUT, ADMIN + "/" + id + "/stock", stock),
                    new Call(HttpMethod.DELETE, ADMIN + "/" + id, null))) {
                assertThat(exchange(call.method(), call.path(), call.body(), caller.token())
                                .getStatusCode())
                        .as("%s %s with %s", call.method(), call.path(), caller.token())
                        .isEqualTo(caller.expected());
            }
            assertThat(upload(id, ProductTestData.png(9), "p.png", caller.token())
                            .getStatusCode())
                    .as("upload with %s", caller.token())
                    .isEqualTo(caller.expected());
        }
        Product stored = mongoTemplate.findById(id, Product.class);
        assertThat(stored.getStatus()).isEqualTo(ProductStatus.DRAFT);
        assertThat(stored.getVersion()).isZero();
        assertThat(stored.getPhotos()).isEmpty();
        assertThat(mongoTemplate.count(new Query(), Product.class)).isEqualTo(1);
    }

    /** Stands in for slice 3's checkout: two units of M held in an unpaid order. */
    private void holdTwoOfM(String id) {
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(id)),
                new Update()
                        .set("sizes.$[m].held", 2)
                        .filterArray(Criteria.where("m._id").is("M")),
                Product.class);
    }
}
