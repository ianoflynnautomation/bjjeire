package com.bjjeire.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class PagedResponsesTest {

    @Test
    void shouldRoundTotalPagesUpForPartialLastPage() {
        PagedResponse<String> response = PagedResponses.of(List.of("a"), new PaginationRequest(1, 20), 41);

        assertThat(response.data()).containsExactly("a");
        assertThat(response.pagination().totalItems()).isEqualTo(41);
        assertThat(response.pagination().currentPage()).isEqualTo(1);
        assertThat(response.pagination().pageSize()).isEqualTo(20);
        assertThat(response.pagination().totalPages()).isEqualTo(3);
    }

    @Test
    void shouldFlagNextAndPreviousPagesOnMiddlePage() {
        PagedResponse<String> response = PagedResponses.of(List.of("a"), new PaginationRequest(2, 20), 60);

        assertThat(response.pagination().hasNextPage()).isTrue();
        assertThat(response.pagination().hasPreviousPage()).isTrue();
        assertThat(response.pagination().nextPageUrl()).isNull();
        assertThat(response.pagination().previousPageUrl()).isNull();
    }

    @Test
    void shouldFlagNoNavigationOnSinglePage() {
        PagedResponse<String> response = PagedResponses.of(List.of("a"), new PaginationRequest(1, 20), 1);

        assertThat(response.pagination().totalPages()).isEqualTo(1);
        assertThat(response.pagination().hasNextPage()).isFalse();
        assertThat(response.pagination().hasPreviousPage()).isFalse();
    }

    @Test
    void shouldReturnZeroTotalPagesWhenNoItems() {
        PagedResponse<String> response = PagedResponses.of(List.of(), new PaginationRequest(1, 20), 0);

        assertThat(response.data()).isEmpty();
        assertThat(response.pagination().totalPages()).isZero();
        assertThat(response.pagination().hasNextPage()).isFalse();
        assertThat(response.pagination().hasPreviousPage()).isFalse();
    }
}
