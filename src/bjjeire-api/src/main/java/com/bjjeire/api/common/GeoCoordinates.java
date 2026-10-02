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
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public Double latitude() {
        return coordinates != null && coordinates.size() > 1 ? coordinates.get(1) : null;
    }

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public Double longitude() {
        return coordinates != null && !coordinates.isEmpty() ? coordinates.get(0) : null;
    }
}
