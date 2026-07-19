package com.bjjeire.api.event;

import java.math.BigDecimal;
import java.util.List;

public record PricingModel(
        PricingType type,
        String label,
        List<BjjEventType> appliesToTypes,
        BigDecimal amount,
        Integer durationDays,
        String currency) {}
