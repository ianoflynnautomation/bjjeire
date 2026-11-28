package com.bjjeire.api.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.bjjeire.api.product.ProductKind;
import com.bjjeire.api.product.SizeId;
import com.bjjeire.api.web.ProblemTypes;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.web.server.ResponseStatusException;

/** The order rules that need no database (data-model.md § Merch order, research R3, R7, R9). */
class OrderRulesTest {
    private static final Validator VALIDATOR =
            Validation.buildDefaultValidatorFactory().getValidator();
    private static final String PRODUCT = "6650f0c2a1b2c3d4e5f60718";

    @Test
    @Tag("#6006")
    void shouldAddTheLinesAndTheDeliveryIntoTheTotal() {
        List<OrderLine> lines = List.of(line(SizeId.M, 2, 4500), line(SizeId.L, 1, 2500));

        int items = OrderRules.itemsCents(lines);

        assertThat(items).isEqualTo(11_500);
        assertThat(OrderRules.totalCents(items, 650)).isEqualTo(12_150);
    }

    @Test
    @Tag("#6005")
    void shouldAllowTenUnitsOfALineAndTwentyInAnOrder() {
        assertThatCode(() ->
                        OrderRules.requireWithinLimits(List.of(command(SizeId.M, 10), command(SizeId.L, 10)), 10, 20))
                .doesNotThrowAnyException();
    }

    @Test
    @Tag("#6005")
    void shouldRefuseMoreThanTenUnitsOfALine() {
        assertProblem(
                () -> OrderRules.requireWithinLimits(List.of(command(SizeId.M, 11)), 10, 20),
                ProblemTypes.BASKET_TOO_LARGE);
    }

    @Test
    @Tag("#6005")
    void shouldRefuseMoreThanTwentyUnitsInAnOrder() {
        assertProblem(
                () -> OrderRules.requireWithinLimits(
                        List.of(command(SizeId.S, 10), command(SizeId.M, 10), command(SizeId.L, 1)), 10, 20),
                ProblemTypes.BASKET_TOO_LARGE);
    }

    @Test
    @Tag("#6005")
    void shouldLeaveAnOrderOfMoreThanTwentyLinesToTheItemLimit() {
        List<OrderLineCommand> lines = new java.util.ArrayList<>();
        for (int i = 0; i < 21; i++) {
            lines.add(new OrderLineCommand("6650f0c2a1b2c3d4e5f607" + String.format("%02x", i), SizeId.M, 1, 4500));
        }
        CreateOrderCommand order = new CreateOrderCommand(lines, "a@example.test", address("IE", null), 0, true);

        assertThat(fields(VALIDATOR.validate(order))).doesNotContain("lines");
        assertProblem(() -> OrderRules.requireWithinLimits(lines, 10, 20), ProblemTypes.BASKET_TOO_LARGE);
    }

    @Test
    void shouldRefuseTheSameSizeTwiceInOneOrder() {
        assertThatThrownBy(() ->
                        OrderRules.requireWithinLimits(List.of(command(SizeId.M, 1), command(SizeId.M, 2)), 10, 20))
                .isInstanceOfSatisfying(
                        ResponseStatusException.class,
                        problem -> assertThat(problem.getStatusCode().value()).isEqualTo(400));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "D02 X285", "D02X285", "d02 x285", "T12 AC34", "D6W 1234", "A65F4E2"})
    @Tag("#6006")
    void shouldDeliverInIrelandWithOrWithoutAnEircode(String postcode) {
        assertThatCode(() -> OrderRules.requireDeliverable(address("IE", postcode.isEmpty() ? null : postcode)))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {"BT1 1AA", "bt7 1nn", "BT48 6DQ"})
    @Tag("#6006")
    void shouldDeliverInNorthernIreland(String postcode) {
        assertThatCode(() -> OrderRules.requireDeliverable(address("GB", postcode)))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @ValueSource(strings = {"SW1A 1AA", "M1 1AE"})
    @Tag("#6006")
    void shouldNotDeliverToTheRestOfTheUnitedKingdom(String postcode) {
        assertProblem(
                () -> OrderRules.requireDeliverable(address("GB", postcode)), ProblemTypes.DELIVERY_NOT_AVAILABLE);
    }

    @Test
    @Tag("#6006")
    void shouldNeedAPostcodeForNorthernIreland() {
        assertProblem(() -> OrderRules.requireDeliverable(address("GB", null)), ProblemTypes.DELIVERY_NOT_AVAILABLE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"FR", "US", "DE"})
    @Tag("#6006")
    void shouldNotDeliverOutsideIrelandAndNorthernIreland(String country) {
        assertProblem(() -> OrderRules.requireDeliverable(address(country, null)), ProblemTypes.DELIVERY_NOT_AVAILABLE);
    }

    @ParameterizedTest
    @ValueSource(strings = {"12345", "D02-X285", "B12 3456", "DUBLIN 2"})
    @Tag("#6006")
    void shouldRefuseAnIrishPostcodeThatIsNotAnEircode(String postcode) {
        assertThatThrownBy(() -> OrderRules.requireDeliverable(address("IE", postcode)))
                .isInstanceOfSatisfying(ResponseStatusException.class, problem -> {
                    assertThat(problem.getStatusCode().value()).isEqualTo(400);
                    assertThat(problem.getBody().getProperties()).containsKey("errors");
                });
    }

    @Test
    @Tag("#6006")
    void shouldAcceptAddressFieldsAtTheirLongest() {
        DeliveryAddressDto longest = new DeliveryAddressDto(
                "n".repeat(100),
                "a".repeat(100),
                "b".repeat(100),
                "t".repeat(60),
                "c".repeat(60),
                null,
                "IE",
                "0".repeat(30));

        assertThat(VALIDATOR.validate(longest)).isEmpty();
    }

    @Test
    @Tag("#6006")
    void shouldRefuseAddressFieldsOverTheirLimitOrMissing() {
        DeliveryAddressDto tooLong = new DeliveryAddressDto(
                "n".repeat(101),
                "a".repeat(101),
                "b".repeat(101),
                "t".repeat(61),
                "c".repeat(61),
                null,
                "IE",
                "0".repeat(31));
        DeliveryAddressDto missing = new DeliveryAddressDto("", " ", null, "", "", null, null, null);

        assertThat(fields(VALIDATOR.validate(tooLong)))
                .containsExactlyInAnyOrder("name", "line1", "line2", "town", "county", "phone");
        assertThat(fields(VALIDATOR.validate(missing)))
                .containsExactlyInAnyOrder("name", "line1", "town", "county", "country");
    }

    @Test
    @Tag("#6012")
    void shouldNeedAnEmailOfAtMost254Characters() {
        String longest = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "." + "d".repeat(61);
        assertThat(longest).hasSize(254);

        assertThat(fields(VALIDATOR.validate(order(longest)))).isEmpty();
        assertThat(fields(VALIDATOR.validate(order(longest + "e")))).contains("email");
        assertThat(fields(VALIDATOR.validate(order("not-an-email")))).contains("email");
        assertThat(fields(VALIDATOR.validate(order(null)))).contains("email");
    }

    @Test
    @Tag("#6005")
    void shouldNeedAtLeastOneUnitInEachLine() {
        CreateOrderCommand zero = new CreateOrderCommand(
                List.of(new OrderLineCommand(PRODUCT, SizeId.M, 0, 4500)),
                "aoife@example.test",
                address("IE", null),
                0,
                true);

        assertThat(fields(VALIDATOR.validate(zero))).contains("lines[0].quantity");
    }

    @Test
    void shouldNeedTheTermsAccepted() {
        CreateOrderCommand notAccepted = new CreateOrderCommand(
                List.of(new OrderLineCommand(PRODUCT, SizeId.M, 1, 4500)),
                "aoife@example.test",
                address("IE", null),
                0,
                false);

        assertThat(fields(VALIDATOR.validate(notAccepted))).contains("acceptTerms");
    }

    @Test
    void shouldMoveOnlyAlongTheOrderStateTransitions() {
        assertTransitions(OrderStatus.AWAITING_PAYMENT, OrderStatus.CONFIRMED, OrderStatus.EXPIRED);
        assertTransitions(OrderStatus.EXPIRED, OrderStatus.CONFIRMED, OrderStatus.REFUNDED);
        assertTransitions(OrderStatus.CONFIRMED, OrderStatus.DISPATCHED, OrderStatus.REFUNDED);
        assertTransitions(OrderStatus.DISPATCHED, OrderStatus.REFUNDED);
        assertTransitions(OrderStatus.REFUNDED);
    }

    @Test
    void shouldNumberOrdersWithTheIrishDateAndSixBase32Characters() {
        String number = OrderRules.number(java.time.Instant.parse("2026-05-31T23:30:00Z"), new java.util.Random(1));

        // 23:30 UTC on 31 May is already 1 June in Dublin (summer time).
        assertThat(number).matches("^BJE-20260601-[A-Z2-7]{6}$");
    }

    private static void assertTransitions(OrderStatus from, OrderStatus... allowed) {
        Set<OrderStatus> expected =
                allowed.length == 0 ? EnumSet.noneOf(OrderStatus.class) : EnumSet.of(allowed[0], allowed);
        for (OrderStatus target : OrderStatus.values()) {
            assertThat(from.canBecome(target)).as("%s -> %s", from, target).isEqualTo(expected.contains(target));
        }
    }

    private static void assertProblem(org.assertj.core.api.ThrowableAssert.ThrowingCallable call, java.net.URI type) {
        assertThatThrownBy(call).isInstanceOfSatisfying(ResponseStatusException.class, problem -> {
            assertThat(problem.getStatusCode().value()).isEqualTo(409);
            assertThat(problem.getBody().getType()).isEqualTo(type);
        });
    }

    private static List<String> fields(Set<? extends ConstraintViolation<?>> violations) {
        return violations.stream()
                .map(v -> v.getPropertyPath().toString())
                .map(OrderRulesTest::leaf)
                .toList();
    }

    private static String leaf(String path) {
        return path.startsWith("address.") ? path.substring("address.".length()) : path;
    }

    private static CreateOrderCommand order(String email) {
        return new CreateOrderCommand(
                List.of(new OrderLineCommand(PRODUCT, SizeId.M, 1, 4500)), email, address("IE", null), 0, true);
    }

    private static OrderLineCommand command(SizeId size, int quantity) {
        return new OrderLineCommand(PRODUCT, size, quantity, 4500);
    }

    private static OrderLine line(SizeId size, int quantity, int unitPriceCents) {
        return OrderLine.builder()
                .productId(PRODUCT)
                .productName("Harp Rashguard")
                .kind(ProductKind.RASHGUARD)
                .sizeId(size)
                .quantity(quantity)
                .unitPriceCents(unitPriceCents)
                .build();
    }

    static DeliveryAddressDto address(String country, String postcode) {
        return new DeliveryAddressDto(
                "Aoife Byrne", "1 Main Street", null, "Galway", "Galway", postcode, country, null);
    }
}
