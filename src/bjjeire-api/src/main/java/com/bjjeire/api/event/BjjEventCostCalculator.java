package com.bjjeire.api.event;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

public final class BjjEventCostCalculator {
    private static final String DEFAULT_CURRENCY = "EUR";

    private BjjEventCostCalculator() {}

    public static List<CalculatedCost> calculate(BjjEventSchedule schedule, List<PricingModel> pricingOptions) {
        Objects.requireNonNull(pricingOptions, "pricingOptions");
        return pricingOptions.stream().map(option -> resolve(schedule, option)).toList();
    }

    private static CalculatedCost resolve(BjjEventSchedule schedule, PricingModel option) {
        String currency = option.currency() != null ? option.currency() : DEFAULT_CURRENCY;
        List<BjjEventType> scope = option.appliesToTypes() != null ? List.copyOf(option.appliesToTypes()) : List.of();

        return switch (option.type()) {
            case Free ->
                new CalculatedCost(option.label(), CostUnit.Free, BigDecimal.ZERO, BigDecimal.ZERO, currency, scope);

            case PerDay ->
                new CalculatedCost(
                        option.label(),
                        CostUnit.PerDay,
                        option.amount(),
                        option.amount().multiply(BigDecimal.valueOf(effectiveDays(schedule, option.durationDays()))),
                        currency,
                        scope);

            case PerSession ->
                new CalculatedCost(
                        option.label(),
                        CostUnit.PerSession,
                        option.amount(),
                        option.amount().multiply(BigDecimal.valueOf(matchingSessionCount(schedule, option))),
                        currency,
                        scope);

            case FlatRate ->
                new CalculatedCost(option.label(), CostUnit.Total, option.amount(), option.amount(), currency, scope);
        };
    }

    private static int effectiveDays(BjjEventSchedule schedule, Integer durationDays) {
        if (durationDays != null && durationDays > 0) {
            return durationDays;
        }

        if (schedule != null
                && schedule.startDate() != null
                && schedule.endDate() != null
                && !schedule.endDate().isBefore(schedule.startDate())) {
            return (int) ChronoUnit.DAYS.between(
                            schedule.startDate().truncatedTo(ChronoUnit.DAYS),
                            schedule.endDate().truncatedTo(ChronoUnit.DAYS))
                    + 1;
        }

        return 1;
    }

    private static int matchingSessionCount(BjjEventSchedule schedule, PricingModel option) {
        List<BjjEventSession> sessions = schedule != null ? schedule.sessions() : null;
        if (sessions == null || sessions.isEmpty()) {
            return 1;
        }

        List<BjjEventType> scope = option.appliesToTypes();
        if (scope == null || scope.isEmpty()) {
            return sessions.size();
        }

        return (int) sessions.stream()
                .filter(session -> session.types() == null
                        || session.types().isEmpty()
                        || session.types().stream().anyMatch(scope::contains))
                .count();
    }
}
