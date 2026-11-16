package com.bjjeire.api.registration;

import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

/**
 * Reads only the JSON literals {@code true} and {@code false}. A consent must be given as the value true; Jackson's
 * default coercion would turn {@code "true"} or {@code 1} into it (FR-012). Anything else is a 400.
 */
class StrictBooleanDeserializer extends ValueDeserializer<Boolean> {
    @Override
    public Boolean deserialize(JsonParser parser, DeserializationContext context) {
        JsonToken token = parser.currentToken();
        if (token == JsonToken.VALUE_TRUE) {
            return Boolean.TRUE;
        }
        if (token == JsonToken.VALUE_FALSE) {
            return Boolean.FALSE;
        }
        return (Boolean) context.handleUnexpectedToken(Boolean.class, parser);
    }
}
