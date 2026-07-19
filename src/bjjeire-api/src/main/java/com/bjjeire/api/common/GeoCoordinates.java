package com.bjjeire.api.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GeoCoordinates(String type, List<Double> coordinates, String placeName, String placeId) {
    public GeoCoordinates {
        if (type == null || type.isBlank()) {
            type = "Point";
        }
        if (coordinates == null) {
            coordinates = List.of(0.0, 0.0);
        }
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public double latitude() {
        return coordinates.size() > 1 ? coordinates.get(1) : 0.0;
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public double longitude() {
        return coordinates.isEmpty() ? 0.0 : coordinates.get(0);
    }
}
