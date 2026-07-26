package com.bjjeire.api.common;

import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class UriService {
    public String pageUri(String path, int page, int pageSize) {
        return pageUri(path, page, pageSize, null);
    }

    public String pageUri(String path, int page, int pageSize, MultiValueMap<String, String> extraQuery) {
        UriComponentsBuilder builder = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path(path)
                .queryParam("page", page)
                .queryParam("pageSize", pageSize);
        if (extraQuery != null) {
            extraQuery.forEach(builder::queryParam);
        }
        return builder.build().toUriString();
    }
}
