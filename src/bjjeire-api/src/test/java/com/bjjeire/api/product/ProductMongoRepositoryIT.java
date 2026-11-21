package com.bjjeire.api.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.common.ApiRoutes;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DuplicateKeyException;
import tools.jackson.databind.JsonNode;

/** The Product collection's indexes and the public listing's filter and order. */
class ProductMongoRepositoryIT extends ProductIntegrationTest {

    @Test
    @Tag("#6013")
    void shouldRejectASecondProductWithTheSameSlug() {
        mongoTemplate.insert(product("harp", "Harp", ProductKind.RASHGUARD, ProductStatus.DRAFT));

        assertThatThrownBy(
                        () -> mongoTemplate.insert(product("harp", "Other", ProductKind.SHORTS, ProductStatus.DRAFT)))
                .isInstanceOf(DuplicateKeyException.class);
    }

    @Test
    @Tag("#6001")
    void shouldDeclareTheProductIndexes() {
        List<String> names = mongoTemplate.indexOps(Product.class).getIndexInfo().stream()
                .map(index -> index.getName())
                .toList();

        assertThat(names).contains("ux_product_slug", "ix_product_status_kind_name");
    }

    @Test
    @Tag("#6001")
    @Tag("#6003")
    void shouldListOnlyPublishedProductsByKindThenName() {
        mongoTemplate.insert(product("zip-tee", "Zip Tee", ProductKind.T_SHIRT, ProductStatus.PUBLISHED));
        mongoTemplate.insert(product("b-shorts", "B Shorts", ProductKind.SHORTS, ProductStatus.PUBLISHED));
        mongoTemplate.insert(product("z-rash", "Z Rash", ProductKind.RASHGUARD, ProductStatus.PUBLISHED));
        mongoTemplate.insert(product("a-rash", "A Rash", ProductKind.RASHGUARD, ProductStatus.PUBLISHED));
        mongoTemplate.insert(product("a-shorts", "A Shorts", ProductKind.SHORTS, ProductStatus.PUBLISHED));
        mongoTemplate.insert(product("draft", "Draft", ProductKind.RASHGUARD, ProductStatus.DRAFT));
        mongoTemplate.insert(product("hidden", "Hidden", ProductKind.RASHGUARD, ProductStatus.HIDDEN));

        JsonNode list = json(anonymousGet(ApiRoutes.PRODUCT + "?page=1&pageSize=100"));

        List<String> slugs = new java.util.ArrayList<>();
        list.at("/data").forEach(item -> slugs.add(item.at("/slug").asString()));
        assertThat(slugs).containsExactly("a-rash", "z-rash", "a-shorts", "b-shorts", "zip-tee");
        assertThat(list.at("/pagination/totalItems").asInt()).isEqualTo(5);
    }

    private static Product product(String slug, String name, ProductKind kind, ProductStatus status) {
        return Product.builder()
                .slug(slug)
                .name(name)
                .kind(kind)
                .description("Description")
                .priceCents(3000)
                .status(status)
                .version(0L)
                .photos(List.of("a".repeat(64)))
                .sizes(List.of(ProductSize.builder().id(SizeId.M).stock(1).build()))
                .build();
    }
}
