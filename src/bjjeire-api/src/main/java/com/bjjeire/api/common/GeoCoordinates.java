package com.bjjeire.api.common;

import java.util.List;

public record GeoCoordinates(String type, List<Double> coordinates, String placeName, String placeId) {
    public GeoCoordinates {
        if (type == null || type.isBlank()) {
            type = "Point";
        }
        if (coordinates == null) {
            coordinates = List.of(0.0, 0.0);
        }
    }
}
