package com.bjjeire.api.event;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class BjjEventCostCalculatorTest {
    private static BjjEventSchedule threeDayCamp(BjjEventSession... sessions) {
        return new BjjEventSchedule(
                ScheduleKind.FixedDates,
                Instant.parse("2026-07-25T00:00:00Z"),
                Instant.parse("2026-07-27T00:00:00Z"),
                Arrays.asList(sessions));
    }

    private static BjjEventSession session(int day, BjjEventType... types) {
        return new BjjEventSession(
                Instant.parse("2026-07-%02dT00:00:00Z".formatted(24 + day)),
                null,
                LocalTime.of(10, 0),
                LocalTime.of(16, 0),
                null,
                types.length > 0 ? List.of(types) : null);
    }

    private static PricingModel pricing(
            PricingType type, String amount, Integer durationDays, String currency, List<BjjEventType> appliesToTypes) {
        return new PricingModel(type, null, appliesToTypes, new BigDecimal(amount), durationDays, currency);
    }

    @Test
    void calculateFreeOptionReturnsZeroTotalWithDefaultCurrency() {
        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                threeDayCamp(), List.of(pricing(PricingType.Free, "0", null, null, null)));

        assertThat(costs).hasSize(1);
        assertThat(costs.get(0).unit()).isEqualTo(CostUnit.Free);
        assertThat(costs.get(0).total()).isEqualByComparingTo("0");
        assertThat(costs.get(0).currency()).isEqualTo("EUR");
    }

    @Test
    void calculateFlatRateOptionReturnsAmountAsTotal() {
        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                threeDayCamp(), List.of(pricing(PricingType.FlatRate, "275", 3, "EUR", null)));

        assertThat(costs).hasSize(1);
        assertThat(costs.get(0).unit()).isEqualTo(CostUnit.Total);
        assertThat(costs.get(0).total()).isEqualByComparingTo("275");
    }

    @Test
    void calculatePerDayWithExplicitDurationMultipliesByDuration() {
        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                threeDayCamp(), List.of(pricing(PricingType.PerDay, "100", 2, "EUR", null)));

        assertThat(costs.get(0).total()).isEqualByComparingTo("200");
        assertThat(costs.get(0).unit()).isEqualTo(CostUnit.PerDay);
    }

    @Test
    void calculatePerDayWithoutDurationUsesScheduleSpanInclusive() {
        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                threeDayCamp(), List.of(pricing(PricingType.PerDay, "100", null, "EUR", null)));

        assertThat(costs.get(0).total()).isEqualByComparingTo("300");
    }

    @Test
    void calculatePerDayWithoutDurationOrDatesDefaultsToOneDay() {
        List<CalculatedCost> costs =
                BjjEventCostCalculator.calculate(null, List.of(pricing(PricingType.PerDay, "100", null, "EUR", null)));

        assertThat(costs.get(0).total()).isEqualByComparingTo("100");
    }

    @Test
    void calculatePerSessionUnscopedCountsAllSessions() {
        BjjEventSchedule schedule = threeDayCamp(session(1), session(2), session(3));

        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                schedule, List.of(pricing(PricingType.PerSession, "20", null, "EUR", null)));

        assertThat(costs.get(0).total()).isEqualByComparingTo("60");
        assertThat(costs.get(0).unit()).isEqualTo(CostUnit.PerSession);
    }

    @Test
    void calculatePerSessionScopedToTypeCountsOnlyMatchingSessions() {
        BjjEventSchedule schedule = threeDayCamp(
                session(1, BjjEventType.Camp), session(2, BjjEventType.Camp), session(3, BjjEventType.OpenMat));

        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                schedule, List.of(pricing(PricingType.PerSession, "20", null, "EUR", List.of(BjjEventType.OpenMat))));

        assertThat(costs.get(0).total()).isEqualByComparingTo("20");
    }

    @Test
    void calculatePerSessionScopedUntaggedSessionsAlwaysCount() {
        BjjEventSchedule schedule = threeDayCamp(session(1), session(2, BjjEventType.Camp));

        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                schedule, List.of(pricing(PricingType.PerSession, "20", null, "EUR", List.of(BjjEventType.OpenMat))));

        assertThat(costs.get(0).total()).isEqualByComparingTo("20");
    }

    @Test
    void calculateMultipleOptionsReturnsOneResolvedCostPerOption() {
        BjjEventSchedule schedule = threeDayCamp(session(1, BjjEventType.Camp), session(3, BjjEventType.OpenMat));

        List<CalculatedCost> costs = BjjEventCostCalculator.calculate(
                schedule,
                List.of(
                        new PricingModel(PricingType.FlatRate, "Full camp", null, new BigDecimal("275"), 3, "EUR"),
                        new PricingModel(
                                PricingType.PerDay,
                                "Day pass",
                                List.of(BjjEventType.OpenMat),
                                new BigDecimal("110"),
                                1,
                                "EUR")));

        assertThat(costs).hasSize(2);
        assertThat(costs.get(0).label()).isEqualTo("Full camp");
        assertThat(costs.get(0).total()).isEqualByComparingTo("275");
        assertThat(costs.get(1).label()).isEqualTo("Day pass");
        assertThat(costs.get(1).total()).isEqualByComparingTo("110");
        assertThat(costs.get(1).appliesToTypes()).containsExactly(BjjEventType.OpenMat);
    }
}
