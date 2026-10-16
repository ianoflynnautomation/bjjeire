package com.bjjeire.api.common;

import java.util.List;

/** Range checks for a GeoJSON {@code [longitude, latitude]} pair. */
public final class GeoJsonPoints {
    private GeoJsonPoints() {}

    /**
     * Returns whether {@code coordinates} is a two-element pair with no nulls.
     *
     * @param coordinates GeoJSON position, longitude first
     * @return {@code true} when both values are present
     */
    public static boolean isPair(List<Double> coordinates) {
        return coordinates != null
                && coordinates.size() == 2
                && coordinates.get(0) != null
                && coordinates.get(1) != null;
    }

    /**
     * Returns whether {@code longitude} is inside the GeoJSON range.
     *
     * @param longitude degrees, from the first position value
     * @return {@code true} when the value is from -180 through 180
     */
    public static boolean longitudeInRange(double longitude) {
        return longitude >= -180.0 && longitude <= 180.0;
    }

    /**
     * Returns whether {@code latitude} is inside the GeoJSON range.
     *
     * @param latitude degrees, from the second position value
     * @return {@code true} when the value is from -90 through 90
     */
    public static boolean latitudeInRange(double latitude) {
        return latitude >= -90.0 && latitude <= 90.0;
    }
}
