package com.bjjeire.api.common;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Component
public class UriService {
    public String pageUri(String path, int page, int pageSize) {
        return ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(path)
                .queryParam("page", page)
                .queryParam("pageSize", pageSize)
                .build()
                .toUriString();
    }
}
