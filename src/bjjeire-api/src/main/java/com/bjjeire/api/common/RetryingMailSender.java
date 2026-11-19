package com.bjjeire.api.common;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Duration;
import java.util.concurrent.Executor;
import lombok.extern.slf4j.Slf4j;

/**
 * Sends mail after the state change it reports is saved. Queued on its own threads, so a slow or failing relay never
 * delays or undoes that change; three attempts, then the failure is counted under the feature's metric and logged.
 *
 * <p>Each feature subclasses it with its own metric name, so an alert says whose mail failed.
 */
@Slf4j
public class RetryingMailSender {
    public static final int ATTEMPTS = 3;

    private final Mailer mailer;
    private final Executor executor;
    private final Duration backoff;
    private final Counter failures;
    private final String kind;

    /**
     * @param failureMetric the counter incremented when every attempt failed
     * @param kind what the mail is, for the metric description and the log, e.g. "Sign-up"
     */
    protected RetryingMailSender(
            Mailer mailer,
            MeterRegistry meterRegistry,
            Executor executor,
            Duration backoff,
            String failureMetric,
            String kind) {
        this.mailer = mailer;
        this.executor = executor;
        this.backoff = backoff;
        this.kind = kind;
        this.failures = Counter.builder(failureMetric)
                .description(kind + " mails given up on after every attempt failed")
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
                            "{} mail \"{}\" not sent after {} attempts: {}",
                            kind,
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
