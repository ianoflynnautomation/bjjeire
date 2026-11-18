package com.bjjeire.api.registration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.bjjeire.api.common.MailDeliveryException;
import com.bjjeire.api.common.MailMessage;
import com.bjjeire.api.common.Mailer;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/** Sending a sign-up mail after its state change is saved (FR-024, research R6). */
class RegistrationMailSenderTest {
    private static final MailMessage MESSAGE = new MailMessage("aoife@example.test", "Subject", "Body");

    @Test
    @Tag("#5015")
    void shouldTryThreeTimesThenGiveUpAndCountTheFailure() {
        AtomicInteger attempts = new AtomicInteger();
        Mailer failing = message -> {
            attempts.incrementAndGet();
            throw new MailDeliveryException("relay down");
        };
        SimpleMeterRegistry meters = new SimpleMeterRegistry();
        RegistrationMailSender sender = new RegistrationMailSender(failing, meters, Runnable::run, Duration.ZERO);

        assertThatCode(() -> sender.send(MESSAGE)).doesNotThrowAnyException();

        assertThat(attempts.get()).isEqualTo(3);
        assertThat(meters.counter(RegistrationMailSender.FAILURE_METRIC).count())
                .isEqualTo(1.0);
    }

    @Test
    @Tag("#5015")
    void shouldStopRetryingOnceAnAttemptSucceeds() {
        AtomicInteger attempts = new AtomicInteger();
        List<MailMessage> sent = new ArrayList<>();
        Mailer flaky = message -> {
            if (attempts.incrementAndGet() == 1) {
                throw new MailDeliveryException("temporary");
            }
            sent.add(message);
        };
        SimpleMeterRegistry meters = new SimpleMeterRegistry();
        RegistrationMailSender sender = new RegistrationMailSender(flaky, meters, Runnable::run, Duration.ZERO);

        sender.send(MESSAGE);

        assertThat(sent).containsExactly(MESSAGE);
        assertThat(meters.counter(RegistrationMailSender.FAILURE_METRIC).count())
                .isZero();
    }

    @Test
    @Tag("#5015")
    void shouldSendOnlyWhenTheCallerHandsTheMessageOverNotBefore() {
        // The service calls send after the state change is saved. Sending is queued, so a slow or failing relay
        // can neither delay nor undo that change.
        List<Runnable> queued = new ArrayList<>();
        Executor queue = queued::add;
        List<MailMessage> sent = new ArrayList<>();
        RegistrationMailSender sender =
                new RegistrationMailSender(sent::add, new SimpleMeterRegistry(), queue, Duration.ZERO);

        sender.send(MESSAGE);

        assertThat(sent).isEmpty();
        queued.forEach(Runnable::run);
        assertThat(sent).containsExactly(MESSAGE);
    }
}
