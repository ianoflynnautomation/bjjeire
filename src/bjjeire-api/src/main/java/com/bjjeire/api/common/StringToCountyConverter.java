package com.bjjeire.api.common;

import org.jspecify.annotations.Nullable;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToCountyConverter implements Converter<String, County> {
    @Override
    @Nullable public County convert(String source) {
        if (source == null || source.isBlank()) {
            return null;
        }
        for (County county : County.values()) {
            if (county.name().equalsIgnoreCase(source.trim())) {
                return county;
            }
        }
        return null;
    }
}
