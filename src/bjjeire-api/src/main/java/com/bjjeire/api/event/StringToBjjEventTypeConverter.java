package com.bjjeire.api.event;

import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component
public class StringToBjjEventTypeConverter implements Converter<String, BjjEventType> {
    @Override
    @Nullable public BjjEventType convert(String source) {
        if (source == null || source.isBlank()) {
            return null;
        }
        BjjEventType type = BjjEventType.fromWire(source);
        if (type == null) {
            throw new IllegalArgumentException("Unknown BJJ event type '" + source + "'.");
        }
        return type;
    }
}
