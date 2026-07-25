package com.bjjeire.api.event;

import org.jspecify.annotations.Nullable;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToBjjEventTypeConverter implements Converter<String, BjjEventType> {
    @Override
    @Nullable public BjjEventType convert(String source) {
        return BjjEventType.fromWire(source);
    }
}
