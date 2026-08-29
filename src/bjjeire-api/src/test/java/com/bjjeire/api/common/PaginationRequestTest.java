package com.bjjeire.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class PaginationRequestTest {
    @ParameterizedTest(name = "page {0} / pageSize {1} -> page {2} / pageSize {3}")
    @CsvSource({
        // within bounds: kept as-is
        "1,    1,   1,    1",
        "2,    50,  2,    50",
        "1000, 100, 1000, 100",
        // out of bounds: falls back to the contract defaults.
        "0,    101, 1,    20",
        "-1,   20,  1,    20",
        "1,    0,   1,    20",
        "1,    101, 1,    20",
        "-10, -10,  1,    20",
    })
    void shouldClampInvalidValuesToDefaults(int page, int pageSize, int expectedPage, int expectedPageSize) {
        PaginationRequest request = new PaginationRequest(page, pageSize);

        assertThat(request.page()).isEqualTo(expectedPage);
        assertThat(request.pageSize()).isEqualTo(expectedPageSize);
    }
}
