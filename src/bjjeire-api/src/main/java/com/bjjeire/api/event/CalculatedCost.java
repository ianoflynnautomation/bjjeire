package com.bjjeire.api.event;

import java.math.BigDecimal;
import java.util.List;

public record CalculatedCost(
        String label,
        CostUnit unit,
        BigDecimal amount,
        BigDecimal total,
        String currency,
        List<BjjEventType> appliesToTypes) {}
