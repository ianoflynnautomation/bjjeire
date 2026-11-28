package com.bjjeire.api.product;

import com.bjjeire.api.common.ApiCache;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Moves stock for orders (research R5). The only writer of a size's {@code held}; every change is one conditional
 * single-document update, so concurrent checkouts never sell more than the shelf holds (#6009, SC-003).
 *
 * <p>A hold or a take reads the size, then writes only if it still has the {@code stock} and {@code held} it read. When
 * another write came first it reads again. No version bump: the organiser's own writes are guarded on {@code held}
 * instead, so neither overwrites the other.
 *
 * <p>Every change clears {@link ApiCache#MERCH_TAG}, so the public availability is never stale (SC-006).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StockLedger {
    /** Attempts at a compare-and-set before giving up; each failure means another write changed the size. */
    private static final int ATTEMPTS = 50;

    /** Lines in a fixed order, product then size, so two baskets never wait on each other (research R5). */
    private static final Comparator<StockLine> LOCK_ORDER =
            Comparator.comparing(StockLine::productId).thenComparing(StockLine::sizeId);

    private final MongoTemplate mongoTemplate;
    private final ApiCache cache;

    /**
     * One size of one product, and how many units.
     *
     * @param quantity at least 1
     */
    public record StockLine(String productId, SizeId sizeId, int quantity) {}

    /**
     * Holds every line for an unpaid checkout, in a fixed order. When one cannot be held, the lines already held are
     * released again.
     *
     * @return the line that could not be held, or empty when every line is held
     */
    public Optional<StockLine> holdAll(List<StockLine> lines) {
        List<StockLine> held = new ArrayList<>();
        for (StockLine line : sorted(lines)) {
            if (!hold(line)) {
                releaseAll(held);
                return Optional.of(line);
            }
            held.add(line);
        }
        return Optional.empty();
    }

    /**
     * Holds one line of a published product when {@code stock - held} covers it.
     *
     * @return false when the product is not on sale, does not come in the size, or has too few available
     */
    public boolean hold(StockLine line) {
        return compareAndSet(line, true, new Update().inc("sizes.$.held", line.quantity()));
    }

    /** Gives back what an unpaid checkout held, when it expires or fails. */
    public void releaseAll(List<StockLine> lines) {
        for (StockLine line : lines) {
            apply(
                    line,
                    Criteria.where("id").is(line.sizeId()).and("held").gte(line.quantity()),
                    new Update().inc("sizes.$.held", -line.quantity()),
                    "release");
        }
    }

    /** Sells what a paid checkout held: both {@code stock} and {@code held} go down. */
    public void commitAll(List<StockLine> lines) {
        for (StockLine line : lines) {
            apply(
                    line,
                    Criteria.where("id")
                            .is(line.sizeId())
                            .and("held")
                            .gte(line.quantity())
                            .and("stock")
                            .gte(line.quantity()),
                    new Update().inc("sizes.$.held", -line.quantity()).inc("sizes.$.stock", -line.quantity()),
                    "commit");
        }
    }

    /**
     * Sells stock straight from the shelf for a payment that arrived after its hold was released (data-model.md § State
     * transitions, {@code EXPIRED} to {@code CONFIRMED}). Taken in the fixed order; when one line cannot be taken, the
     * lines already taken go back on the shelf.
     *
     * <p>The product need not be published any more: the shopper paid while it was on sale.
     *
     * @return the line that could not be taken, or empty when every line is sold
     */
    public Optional<StockLine> takeAll(List<StockLine> lines) {
        List<StockLine> taken = new ArrayList<>();
        for (StockLine line : sorted(lines)) {
            if (!compareAndSet(line, false, new Update().inc("sizes.$.stock", -line.quantity()))) {
                restockAll(taken);
                return Optional.of(line);
            }
            taken.add(line);
        }
        return Optional.empty();
    }

    /** Puts sold units back on the shelf. */
    public void restockAll(List<StockLine> lines) {
        for (StockLine line : lines) {
            apply(
                    line,
                    Criteria.where("id").is(line.sizeId()),
                    new Update().inc("sizes.$.stock", line.quantity()),
                    "restock");
        }
    }

    /**
     * Applies {@code update} to the line's size while it still has the stock and holds it was read with, and while
     * {@code stock - held} covers the line.
     */
    private boolean compareAndSet(StockLine line, boolean requirePublished, Update update) {
        for (int attempt = 0; attempt < ATTEMPTS; attempt++) {
            Product product = mongoTemplate.findById(line.productId(), Product.class);
            boolean offSale = requirePublished && product != null && product.getStatus() != ProductStatus.PUBLISHED;
            if (product == null || offSale) {
                return false;
            }
            Optional<ProductSize> size = sizeOf(product, line.sizeId());
            if (size.isEmpty() || ProductRules.available(size.get()) < line.quantity()) {
                return false;
            }
            Criteria which = Criteria.where("_id")
                    .is(line.productId())
                    .and("sizes")
                    .elemMatch(Criteria.where("id")
                            .is(line.sizeId())
                            .and("stock")
                            .is(size.get().getStock())
                            .and("held")
                            .is(size.get().getHeld()));
            if (requirePublished) {
                which = which.and("status").is(ProductStatus.PUBLISHED);
            }
            if (mongoTemplate
                            .updateFirst(Query.query(which), update, Product.class)
                            .getModifiedCount()
                    == 1) {
                cache.removeByTag(ApiCache.MERCH_TAG);
                return true;
            }
        }
        log.warn(
                "Stock of product {} size {} changed on every one of {} attempts; treated as unavailable",
                line.productId(),
                line.sizeId(),
                ATTEMPTS);
        return false;
    }

    private void apply(StockLine line, Criteria size, Update update, String what) {
        long modified = mongoTemplate
                .updateFirst(
                        Query.query(Criteria.where("_id")
                                .is(line.productId())
                                .and("sizes")
                                .elemMatch(size)),
                        update,
                        Product.class)
                .getModifiedCount();
        cache.removeByTag(ApiCache.MERCH_TAG);
        if (modified == 0) {
            // Only possible when the product or size went away, which a size with holds never does.
            log.error(
                    "ALERT stock {} of {} x product {} size {} matched nothing; check the product's stock by hand",
                    what,
                    line.quantity(),
                    line.productId(),
                    line.sizeId());
        }
    }

    private static Optional<ProductSize> sizeOf(Product product, SizeId sizeId) {
        return product.getSizes() == null
                ? Optional.empty()
                : product.getSizes().stream()
                        .filter(size -> size.getId() == sizeId)
                        .findFirst();
    }

    private static List<StockLine> sorted(List<StockLine> lines) {
        return lines.stream().sorted(LOCK_ORDER).toList();
    }
}
