package com.bjjeire.api.testsupport;

import com.bjjeire.api.registration.MailMessage;
import com.bjjeire.api.registration.Mailer;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** Collects the mail the API sends, in place of SMTP. Sending is asynchronous, so tests wait for it. */
public class RecordingMailer implements Mailer {
    private final List<MailMessage> sent = new CopyOnWriteArrayList<>();

    @Override
    public void send(MailMessage message) {
        sent.add(message);
    }

    public List<MailMessage> sent() {
        return List.copyOf(sent);
    }

    /** Waits up to five seconds for at least {@code count} messages, then returns what was sent. */
    public List<MailMessage> awaitSent(int count) {
        Instant deadline = Instant.now().plus(Duration.ofSeconds(5));
        while (sent.size() < count && Instant.now().isBefore(deadline)) {
            try {
                Thread.sleep(20);
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return sent();
    }

    public void reset() {
        sent.clear();
    }
}
