package com.bjjeire.api.common;

import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

/** Sends through the SMTP relay Spring Boot configures from {@code spring.mail.*}. */
final class SmtpMailer implements Mailer {
    private final JavaMailSender sender;
    private final String from;

    SmtpMailer(JavaMailSender sender, String from) {
        this.sender = sender;
        this.from = from;
    }

    @Override
    public void send(MailMessage message) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setFrom(from);
        mail.setTo(message.to());
        mail.setSubject(message.subject());
        mail.setText(message.body());
        try {
            sender.send(mail);
        } catch (MailException failed) {
            throw new MailDeliveryException("SMTP relay refused the mail: " + failed.getMessage(), failed);
        }
    }
}
