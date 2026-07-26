package com.bjjeire.api.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bjjeire.deactivation")
public record DeactivationProperties(
        Boolean enabled, Duration initialDelay, Duration interval, Duration leaseDuration) {
    public DeactivationProperties {
        enabled = enabled == null ? Boolean.TRUE : enabled;
        initialDelay = initialDelay == null ? Duration.ofSeconds(30) : initialDelay;
        interval = interval == null ? Duration.ofHours(24) : interval;
        leaseDuration = leaseDuration == null ? Duration.ofMinutes(10) : leaseDuration;
    }
}
