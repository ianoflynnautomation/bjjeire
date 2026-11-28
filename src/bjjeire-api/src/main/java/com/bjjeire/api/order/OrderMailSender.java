package com.bjjeire.api.order;

import com.bjjeire.api.common.Mailer;
import com.bjjeire.api.common.RetryingMailSender;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.util.concurrent.Executors;
import org.springframework.stereotype.Component;

/**
 * Sends order mail after the state change it reports is saved (FR-014), with the shared retry policy of
 * {@link RetryingMailSender}. Failures are counted as {@value #FAILURE_METRIC}. A mail that cannot be sent never undoes
 * the order: the organiser still sees it (spec edge case).
 */
@Component
public class OrderMailSender extends RetryingMailSender {
    static final String FAILURE_METRIC = "order.mail.failures";

    public OrderMailSender(Mailer mailer, MeterRegistry meterRegistry) {
        super(
                mailer,
                meterRegistry,
                Executors.newVirtualThreadPerTaskExecutor(),
                Duration.ofSeconds(2),
                FAILURE_METRIC,
                "Order");
    }
}
