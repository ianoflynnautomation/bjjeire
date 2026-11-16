package com.bjjeire.api.registration;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Sends sign-up mail after the state change it reports is saved (FR-024, research R6). Queued on its own threads, so a
 * slow or failing relay never delays or undoes that change; three attempts, then the failure is counted and logged.
 */
@Slf4j
@Component
public class RegistrationMailSender {
    static final String FAILURE_METRIC = "registration.mail.failures";
    static final int ATTEMPTS = 3;

    private final Mailer mailer;
    private final Executor executor;
    private final Duration backoff;
    private final Counter failures;

    @Autowired
    public RegistrationMailSender(Mailer mailer, MeterRegistry meterRegistry) {
        this(mailer, meterRegistry, Executors.newVirtualThreadPerTaskExecutor(), Duration.ofSeconds(2));
    }

    RegistrationMailSender(Mailer mailer, MeterRegistry meterRegistry, Executor executor, Duration backoff) {
        this.mailer = mailer;
        this.executor = executor;
        this.backoff = backoff;
        this.failures = Counter.builder(FAILURE_METRIC)
                .description("Sign-up mails given up on after every attempt failed")
                .register(meterRegistry);
    }

    /** Queues a mail. Call only once the state change it reports has been saved. */
    public void send(MailMessage message) {
        executor.execute(() -> deliver(message));
    }

    private void deliver(MailMessage message) {
        for (int attempt = 1; attempt <= ATTEMPTS; attempt++) {
            try {
                mailer.send(message);
                return;
            } catch (RuntimeException failed) {
                if (attempt == ATTEMPTS) {
                    failures.increment();
                    log.error(
                            "Sign-up mail \"{}\" not sent after {} attempts: {}",
                            message.subject(),
                            ATTEMPTS,
                            failed.getMessage());
                    return;
                }
                pause(attempt);
            }
        }
    }

    private void pause(int attempt) {
        if (backoff.isZero()) {
            return;
        }
        try {
            Thread.sleep(backoff.multipliedBy(attempt));
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        }
    }
}
