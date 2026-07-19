package com.bjjeire.api.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class UriServiceTest {
    private final UriService uriService = new UriService();

    @AfterEach
    void resetRequestContext() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void pageUriIsAbsoluteWithOnlyPageAndPageSize() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("https");
        request.setServerName("bjjeire.com");
        request.setServerPort(443);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        String uri = uriService.pageUri("/api/v1/BjjEvent", 2, 20);

        assertThat(uri).isEqualTo("https://bjjeire.com/api/v1/BjjEvent?page=2&pageSize=20");
    }

    @Test
    void pageUriKeepsNonDefaultPort() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(5003);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        String uri = uriService.pageUri("/api/v1/Gym", 1, 10);

        assertThat(uri).isEqualTo("http://localhost:5003/api/v1/Gym?page=1&pageSize=10");
    }
}
