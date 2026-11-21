package com.bjjeire.api.product;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** The product rules in data-model.md § Product, without MongoDB. */
class ProductRulesTest {
    private static final String PHOTO = "a".repeat(64);

    @Test
    @Tag("#6014")
    void shouldBePublishableWithOneToSixPhotosAndAtLeastOneSize() {
        List<ProductSize> sizes = List.of(size(SizeId.M, 3, 0));

        assertThatCode(() -> ProductRules.requirePublishable(List.of(PHOTO), sizes))
                .doesNotThrowAnyException();
        assertThatCode(() -> ProductRules.requirePublishable(photos(6), sizes)).doesNotThrowAnyException();
        assertNotPublishable(() -> ProductRules.requirePublishable(List.of(), sizes));
        assertNotPublishable(() -> ProductRules.requirePublishable(photos(7), sizes));
        assertNotPublishable(() -> ProductRules.requirePublishable(List.of(PHOTO), List.of()));
    }

    @Test
    @Tag("#6002")
    @Tag("#6013")
    void shouldOrderSizesFromXsToXxl() {
        List<ProductSize> ordered = ProductRules.ordered(
                List.of(size(SizeId.XXL, 1, 0), size(SizeId.S, 1, 0), size(SizeId.XS, 1, 0), size(SizeId.L, 1, 0)));

        assertThat(ordered).extracting(ProductSize::getId).containsExactly(SizeId.XS, SizeId.S, SizeId.L, SizeId.XXL);
    }

    @Test
    @Tag("#6013")
    void shouldRefuseTheSameSizeTwice() {
        assertThatThrownBy(() -> ProductRules.requireUniqueSizes(List.of(SizeId.M, SizeId.L, SizeId.M)))
                .isInstanceOfSatisfying(ResponseStatusException.class, refused -> {
                    assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(refused.getBody().getProperties().get("errors").toString())
                            .contains("Sizes", "DUPLICATE_SIZE");
                });
    }

    @Test
    @Tag("#6002")
    void shouldWorkOutAvailabilityAsStockLessHeld() {
        assertThat(ProductRules.available(size(SizeId.M, 5, 2))).isEqualTo(3);
        assertThat(ProductRules.soldOut(size(SizeId.M, 5, 2))).isFalse();
        assertThat(ProductRules.soldOut(size(SizeId.M, 2, 2))).isTrue();
        assertThat(ProductRules.soldOut(size(SizeId.M, 0, 0))).isTrue();
    }

    /** Edge case: holds already taken are honoured, so the shown stock never goes below zero. */
    @Test
    @Tag("#6016")
    void shouldNeverShowLessThanNothingAvailable() {
        assertThat(ProductRules.available(size(SizeId.M, 1, 3))).isZero();
    }

    @Test
    @Tag("#6001")
    void shouldMarkAProductOutOfStockOnlyWhenNoSizeIsAvailable() {
        assertThat(ProductRules.soldOut(List.of(size(SizeId.S, 0, 0), size(SizeId.M, 1, 0))))
                .isFalse();
        assertThat(ProductRules.soldOut(List.of(size(SizeId.S, 0, 0), size(SizeId.M, 2, 2))))
                .isTrue();
        assertThat(ProductRules.soldOut(List.of())).isTrue();
    }

    @Test
    @Tag("#6016")
    void shouldRefuseStockBelowWhatIsHeldNamingTheNumberHeld() {
        assertThatCode(() -> ProductRules.requireStockCoversHeld(SizeId.M, 2, 2))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> ProductRules.requireStockCoversHeld(SizeId.M, 1, 2))
                .isInstanceOfSatisfying(ResponseStatusException.class, refused -> {
                    assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(refused.getBody().getType()).hasToString("urn:bjjeire:stock-below-held");
                    assertThat(refused.getReason()).contains("M", "2");
                });
    }

    @Test
    @Tag("#6014")
    void shouldMoveBetweenDraftPublishedAndHiddenOnly() {
        assertThat(ProductStatus.DRAFT.canBecome(ProductStatus.PUBLISHED)).isTrue();
        assertThat(ProductStatus.PUBLISHED.canBecome(ProductStatus.HIDDEN)).isTrue();
        assertThat(ProductStatus.HIDDEN.canBecome(ProductStatus.PUBLISHED)).isTrue();
        assertThat(ProductStatus.DRAFT.canBecome(ProductStatus.HIDDEN)).isFalse();
        assertThat(ProductStatus.PUBLISHED.canBecome(ProductStatus.DRAFT)).isFalse();
        assertThat(ProductStatus.HIDDEN.canBecome(ProductStatus.DRAFT)).isFalse();
    }

    private static void assertNotPublishable(org.assertj.core.api.ThrowableAssert.ThrowingCallable call) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class, refused -> {
            assertThat(refused.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            assertThat(refused.getBody().getType()).hasToString("urn:bjjeire:product-not-publishable");
        });
    }

    private static List<String> photos(int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> Integer.toHexString(i).repeat(64).substring(0, 64))
                .toList();
    }

    private static ProductSize size(SizeId id, int stock, int held) {
        return ProductSize.builder().id(id).stock(stock).held(held).build();
    }
}
