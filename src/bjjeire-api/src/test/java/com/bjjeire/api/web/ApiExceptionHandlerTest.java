package com.bjjeire.api.web;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class ApiExceptionHandlerTest {
    private final ApiExceptionHandler handler = new ApiExceptionHandler();
    private final MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/gym");

    @Test
    void unexpectedErrorUsesBjjeireTypeAndHidesTheCause() {
        ResponseEntity<ProblemDetail> response =
                handler.handleUnexpected(new IllegalStateException("db password"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getType()).isEqualTo(ProblemTypes.INTERNAL);
        assertThat(response.getBody().getDetail()).doesNotContain("db password");
        assertThat(response.getBody().getProperties()).containsKey("errorId");
    }
}
