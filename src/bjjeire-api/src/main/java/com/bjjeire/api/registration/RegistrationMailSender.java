package com.bjjeire.api.registration;

import com.bjjeire.api.common.Mailer;
import com.bjjeire.api.common.RetryingMailSender;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Sends sign-up mail after the state change it reports is saved (FR-024, research R6), with the shared retry policy of
 * {@link RetryingMailSender}. Failures are counted as {@value #FAILURE_METRIC}.
 */
@Component
public class RegistrationMailSender extends RetryingMailSender {
    static final String FAILURE_METRIC = "registration.mail.failures";
    static final int ATTEMPTS = RetryingMailSender.ATTEMPTS;

    @Autowired
    public RegistrationMailSender(Mailer mailer, MeterRegistry meterRegistry) {
        this(mailer, meterRegistry, Executors.newVirtualThreadPerTaskExecutor(), Duration.ofSeconds(2));
    }

    RegistrationMailSender(Mailer mailer, MeterRegistry meterRegistry, Executor executor, Duration backoff) {
        super(mailer, meterRegistry, executor, backoff, FAILURE_METRIC, "Sign-up");
    }
}
