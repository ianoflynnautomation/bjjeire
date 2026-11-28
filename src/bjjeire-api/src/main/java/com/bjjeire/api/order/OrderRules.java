package com.bjjeire.api.order;

import com.bjjeire.api.product.SizeId;
import com.bjjeire.api.web.ApiProblems;
import com.bjjeire.api.web.ProblemTypes;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;
import java.util.regex.Pattern;

/** The order rules that need no database (data-model.md § Merch order, research R3, R7, R9). */
final class OrderRules {
    /**
     * Added to the hold for the Checkout Session's own expiry, as registration does: Stripe measures its 30-minute
     * floor from when it creates the session, a moment after the hold starts. A payment in the margin arrives late.
     */
    static final Duration CHECKOUT_EXPIRY_MARGIN = Duration.ofMinutes(2);

    /** Paid orders are kept with the accounts for six years (FR-022, research R11). */
    static final int PAID_RETENTION_YEARS = 6;

    /** Unpaid orders are kept 30 days after they expire (research R11). */
    static final Duration EXPIRED_RETENTION = Duration.ofDays(30);

    static final ZoneId IRELAND = ZoneId.of("Europe/Dublin");

    /** The countries a visitor is told BJJ Éire delivers to; {@code GB-NIR} is Northern Ireland (ISO 3166-2). */
    static final List<String> DELIVERY_COUNTRIES = List.of("IE", "GB-NIR");

    /** An Eircode: a routing key (a letter and two digits, or D6W) and four characters, with an optional space. */
    private static final Pattern EIRCODE = Pattern.compile("^(?:[AC-FHKNPRTV-Y]\\d{2}|D6W) ?[0-9AC-FHKNPRTV-Y]{4}$");

    private static final DateTimeFormatter NUMBER_DATE =
            DateTimeFormatter.ofPattern("uuuuMMdd", Locale.ROOT).withZone(IRELAND);
    private static final char[] BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();

    private OrderRules() {}

    static int itemsCents(List<OrderLine> lines) {
        return lines.stream().mapToInt(OrderLine::lineCents).sum();
    }

    static int totalCents(int itemsCents, int deliveryCents) {
        return itemsCents + deliveryCents;
    }

    /**
     * Refuses a basket a guest may not hold unpaid (research R7), and the same size listed twice.
     *
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code basket-too-large}, or 400 for a
     *     repeated size
     */
    static void requireWithinLimits(List<OrderLineCommand> lines, int maxUnitsPerLine, int maxUnitsPerOrder) {
        Set<String> seen = new HashSet<>();
        int units = 0;
        for (OrderLineCommand line : lines) {
            if (!seen.add(line.productId() + "/" + line.sizeId())) {
                throw ApiProblems.validation(
                        "Lines",
                        "Size " + line.sizeId() + " of product " + line.productId() + " is listed twice.",
                        "DUPLICATE_LINE");
            }
            if (line.quantity() > maxUnitsPerLine) {
                throw tooLarge("You can buy at most " + maxUnitsPerLine + " of one size in one order.");
            }
            units += line.quantity();
        }
        if (units > maxUnitsPerOrder) {
            throw tooLarge("You can buy at most " + maxUnitsPerOrder + " items in one order.");
        }
    }

    /**
     * Refuses an address BJJ Éire does not deliver to (FR-017): only Ireland, and Northern Ireland, which is {@code GB}
     * with a {@code BT} postcode. An Irish postcode, when given, must be an Eircode.
     *
     * @throws org.springframework.web.server.ResponseStatusException 409 {@code delivery-not-available}, or 400 for a
     *     malformed Eircode
     */
    static void requireDeliverable(DeliveryAddressDto address) {
        String country = java.util.Objects.requireNonNullElse(upper(address.country()), "");
        String postcode = upper(address.postcode());
        switch (country) {
            case "IE" -> {
                if (postcode != null && !EIRCODE.matcher(postcode).matches()) {
                    throw ApiProblems.validation(
                            "Address.Postcode",
                            "must be an Eircode such as D02 X285, or left empty",
                            "INVALID_EIRCODE");
                }
            }
            case "GB" -> {
                if (postcode == null || !postcode.startsWith("BT")) {
                    throw notDelivered();
                }
            }
            default -> throw notDelivered();
        }
    }

    /** {@code BJE-<yyyymmdd>-<6 base32>}, dated by the Irish calendar day. */
    static String number(Instant createdAt, Random random) {
        StringBuilder suffix = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            suffix.append(BASE32[random.nextInt(BASE32.length)]);
        }
        return "BJE-" + NUMBER_DATE.format(createdAt) + "-" + suffix;
    }

    static String label(OrderLine line) {
        return line.getProductName() + " — " + line.getSizeId();
    }

    static String label(String productName, SizeId sizeId) {
        return productName + " — " + sizeId;
    }

    private static String upper(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private static RuntimeException tooLarge(String detail) {
        return ApiProblems.conflict(ProblemTypes.BASKET_TOO_LARGE, detail);
    }

    private static RuntimeException notDelivered() {
        return ApiProblems.conflict(
                ProblemTypes.DELIVERY_NOT_AVAILABLE,
                "We deliver only to the Republic of Ireland and Northern Ireland (postcodes starting BT). Nothing was"
                        + " charged.");
    }
}
