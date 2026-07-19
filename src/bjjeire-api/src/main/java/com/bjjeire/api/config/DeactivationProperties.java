package com.bjjeire.api.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

// Defaults are part of the deployed contract. LeaseDuration should be >= the
// expected sweep time so a healthy leader doesn't release mid-sweep, and <=
// interval so a dead leader's lock expires before the next tick.
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
