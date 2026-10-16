package com.bjjeire.api.common;

import org.springframework.util.MultiValueMap;

/** Builds pagination links for the current request. */
public interface UriService {
    /**
     * Builds a page link.
     *
     * @param path resource path
     * @param page 1-based page
     * @param pageSize page size
     * @return absolute page URI
     */
    String pageUri(String path, int page, int pageSize);

    /**
     * Builds a page link with extra query parameters.
     *
     * @param path resource path
     * @param page 1-based page
     * @param pageSize page size
     * @param extraQuery additional query parameters, or null
     * @return absolute page URI
     */
    String pageUri(String path, int page, int pageSize, MultiValueMap<String, String> extraQuery);
}
