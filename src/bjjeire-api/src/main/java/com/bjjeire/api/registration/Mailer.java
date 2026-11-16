package com.bjjeire.api.registration;

/** Delivers one mail. {@link SmtpMailer} is the real one (research R6); tests record instead. */
@FunctionalInterface
public interface Mailer {
    /**
     * Sends a mail now, on the calling thread.
     *
     * @throws MailDeliveryException when the relay refuses or cannot be reached
     */
    void send(MailMessage message);
}
