package com.bjjeire.api.product;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.product.StockLedger.StockLine;
import com.bjjeire.api.testsupport.MongoIntegrationTest;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** Holds, releases and sales of stock as single-document conditional updates (research R5). */
class StockLedgerIT extends MongoIntegrationTest {
    @Autowired
    private StockLedger ledger;

    @Test
    @Tag("#6009")
    void shouldHoldOnlyWhatIsAvailable() {
        Product product = insert(ProductStatus.PUBLISHED, size(SizeId.M, 3, 1));

        assertThat(ledger.hold(line(product, SizeId.M, 2))).isTrue();
        assertThat(ledger.hold(line(product, SizeId.M, 1))).isFalse();

        assertThat(size(product, SizeId.M).getHeld()).isEqualTo(3);
        assertThat(size(product, SizeId.M).getStock()).isEqualTo(3);
    }

    @Test
    void shouldHoldNothingOfAProductNotOnSaleOrASizeItDoesNotComeIn() {
        Product hidden = insert(ProductStatus.HIDDEN, size(SizeId.M, 3, 0));
        Product published = insert(ProductStatus.PUBLISHED, size(SizeId.M, 3, 0));

        assertThat(ledger.hold(line(hidden, SizeId.M, 1))).isFalse();
        assertThat(ledger.hold(line(published, SizeId.XL, 1))).isFalse();
        assertThat(ledger.hold(new StockLine("6650f0c2a1b2c3d4e5f60718", SizeId.M, 1)))
                .isFalse();
        assertThat(size(hidden, SizeId.M).getHeld()).isZero();
    }

    @Test
    void shouldReleaseAndCommitWhatWasHeld() {
        Product product = insert(ProductStatus.PUBLISHED, size(SizeId.M, 5, 3), size(SizeId.L, 2, 2));

        ledger.releaseAll(List.of(line(product, SizeId.M, 1)));
        ledger.commitAll(List.of(line(product, SizeId.M, 2), line(product, SizeId.L, 2)));

        assertThat(size(product, SizeId.M).getStock()).isEqualTo(3);
        assertThat(size(product, SizeId.M).getHeld()).isZero();
        assertThat(size(product, SizeId.L).getStock()).isZero();
        assertThat(size(product, SizeId.L).getHeld()).isZero();
    }

    @Test
    @Tag("#6009")
    void shouldReleaseTheLinesAlreadyHeldWhenALaterLineCannotBeHeld() {
        Product first = insert(ProductStatus.PUBLISHED, size(SizeId.M, 5, 0));
        Product second = insert(ProductStatus.PUBLISHED, size(SizeId.L, 1, 1));

        Optional<StockLine> failed = ledger.holdAll(List.of(line(first, SizeId.M, 2), line(second, SizeId.L, 1)));

        assertThat(failed).contains(line(second, SizeId.L, 1));
        assertThat(size(first, SizeId.M).getHeld()).isZero();
        assertThat(size(second, SizeId.L).getHeld()).isEqualTo(1);
    }

    @Test
    void shouldHoldEveryLineWhenAllAreAvailable() {
        Product first = insert(ProductStatus.PUBLISHED, size(SizeId.M, 5, 0));
        Product second = insert(ProductStatus.PUBLISHED, size(SizeId.L, 1, 0));

        assertThat(ledger.holdAll(List.of(line(second, SizeId.L, 1), line(first, SizeId.M, 2))))
                .isEmpty();

        assertThat(size(first, SizeId.M).getHeld()).isEqualTo(2);
        assertThat(size(second, SizeId.L).getHeld()).isEqualTo(1);
    }

    @Test
    @Tag("#6009")
    void shouldTakeStockForALatePaymentOnlyWhenEveryLineIsAvailable() {
        Product product = insert(ProductStatus.HIDDEN, size(SizeId.M, 2, 1), size(SizeId.L, 1, 1));

        Optional<StockLine> failed = ledger.takeAll(List.of(line(product, SizeId.M, 1), line(product, SizeId.L, 1)));

        assertThat(failed).contains(line(product, SizeId.L, 1));
        assertThat(size(product, SizeId.M).getStock()).isEqualTo(2);

        assertThat(ledger.takeAll(List.of(line(product, SizeId.M, 1)))).isEmpty();
        assertThat(size(product, SizeId.M).getStock()).isEqualTo(1);
        assertThat(size(product, SizeId.M).getHeld()).isEqualTo(1);
    }

    private Product insert(ProductStatus status, ProductSize... sizes) {
        return mongoTemplate.insert(Product.builder()
                .slug("ledger-" + System.nanoTime())
                .name("Ledger tee")
                .kind(ProductKind.T_SHIRT)
                .description("Plain.")
                .priceCents(2500)
                .sizes(new ArrayList<>(List.of(sizes)))
                .status(status)
                .version(1L)
                .build());
    }

    private ProductSize size(Product product, SizeId sizeId) {
        return mongoTemplate.findById(product.getId(), Product.class).getSizes().stream()
                .filter(size -> size.getId() == sizeId)
                .findFirst()
                .orElseThrow();
    }

    private static ProductSize size(SizeId id, int stock, int held) {
        return ProductSize.builder().id(id).stock(stock).held(held).build();
    }

    private static StockLine line(Product product, SizeId sizeId, int quantity) {
        return new StockLine(product.getId(), sizeId, quantity);
    }
}
