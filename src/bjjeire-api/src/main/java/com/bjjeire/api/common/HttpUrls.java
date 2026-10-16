package com.bjjeire.api.common;

import java.net.URI;

/** Checks that a string is an absolute http or https URL with a host. */
public final class HttpUrls {
    private HttpUrls() {}

    /**
     * Returns whether {@code url} is an absolute http or https URL.
     *
     * @param url candidate URL, including schemes such as {@code javascript:}
     * @return {@code true} when the scheme is http or https and a host is present
     */
    public static boolean isHttpOrHttps(String url) {
        try {
            URI uri = URI.create(url);
            return uri.isAbsolute()
                    && ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null
                    && !uri.getHost().isBlank();
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
