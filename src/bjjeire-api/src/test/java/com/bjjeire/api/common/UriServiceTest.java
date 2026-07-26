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

        String uri = uriService.pageUri(ApiRoutes.BJJ_EVENT, 2, 20);

        assertThat(uri).isEqualTo("https://bjjeire.com" + ApiRoutes.BJJ_EVENT + "?page=2&pageSize=20");
    }

    @Test
    void pageUriAppendsFilterQueryParams() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("https");
        request.setServerName("bjjeire.com");
        request.setServerPort(443);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        org.springframework.util.MultiValueMap<String, String> filters =
                new org.springframework.util.LinkedMultiValueMap<>();
        filters.add("county", "Dublin");
        filters.add("types", "OpenMat");
        filters.add("types", "Camp");
        filters.add("includeInactive", "true");

        String uri = uriService.pageUri(ApiRoutes.BJJ_EVENT, 2, 20, filters);

        assertThat(uri)
                .isEqualTo("https://bjjeire.com" + ApiRoutes.BJJ_EVENT
                        + "?page=2&pageSize=20&county=Dublin&types=OpenMat&types=Camp&includeInactive=true");
    }

    @Test
    void pageUriKeepsNonDefaultPort() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(5003);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        String uri = uriService.pageUri(ApiRoutes.GYM, 1, 10);

        assertThat(uri).isEqualTo("http://localhost:5003" + ApiRoutes.GYM + "?page=1&pageSize=10");
    }
}
