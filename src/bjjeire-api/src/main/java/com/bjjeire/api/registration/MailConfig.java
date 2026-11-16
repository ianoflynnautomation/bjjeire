package com.bjjeire.api.registration;

import com.bjjeire.api.config.BjjEireProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Chooses how sign-up mail leaves the API. With {@code spring.mail.host} set, Spring Boot builds a
 * {@link JavaMailSender} and mail goes over SMTP; without it, mail is logged without its body, so a missing relay is
 * visible but never fails a sign-up.
 */
@Slf4j
@Configuration
class MailConfig {
    @Bean
    Mailer mailer(ObjectProvider<JavaMailSender> senders, BjjEireProperties properties, Environment environment) {
        // Spring Boot builds a sender even for a blank host; that one could never deliver.
        String host = environment.getProperty("spring.mail.host", "");
        JavaMailSender sender = host.isBlank() ? null : senders.getIfAvailable();
        if (sender != null) {
            return new SmtpMailer(sender, properties.mail().from());
        }
        log.warn("No SMTP relay configured (spring.mail.host): sign-up mail is logged, not sent");
        return message -> log.info("Mail not sent, no relay configured: subject \"{}\"", message.subject());
    }
}
