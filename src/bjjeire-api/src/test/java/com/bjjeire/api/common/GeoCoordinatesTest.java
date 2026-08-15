package com.bjjeire.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class GeoCoordinatesTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void shouldSerializeDerivedLatitudeAndLongitudeFromGeoJsonOrder() throws Exception {

        GeoCoordinates coordinates = new GeoCoordinates("Point", List.of(-6.2603, 53.3498), "Dublin", "place-id");

        JsonNode json = mapper.readTree(mapper.writeValueAsString(coordinates));

        assertThat(json.get("longitude").asDouble()).isEqualTo(-6.2603);
        assertThat(json.get("latitude").asDouble()).isEqualTo(53.3498);
        assertThat(json.get("coordinates").get(0).asDouble()).isEqualTo(-6.2603);
        assertThat(json.get("coordinates").get(1).asDouble()).isEqualTo(53.3498);
    }

    @Test
    void shouldNotInventZeroCoordinatesWhenCoordinatesAreNull() {
        GeoCoordinates coordinates = new GeoCoordinates("Point", null, "Unknown", null);

        assertThat(coordinates.coordinates()).isNull();
        assertThat(coordinates.latitude()).isZero();
        assertThat(coordinates.longitude()).isZero();
    }

    @Test
    void shouldDeserializeIgnoringDerivedLatitudeAndLongitude() throws Exception {
        String payload = """
                {
                  "type": "Point",
                  "coordinates": [-6.2603, 53.3498],
                  "latitude": 53.3498,
                  "longitude": -6.2603,
                  "placeName": "Dublin",
                  "placeId": "place-id"
                }
                """;

        GeoCoordinates coordinates = mapper.readValue(payload, GeoCoordinates.class);

        assertThat(coordinates.coordinates()).containsExactly(-6.2603, 53.3498);
        assertThat(coordinates.latitude()).isEqualTo(53.3498);
        assertThat(coordinates.longitude()).isEqualTo(-6.2603);
    }
}
