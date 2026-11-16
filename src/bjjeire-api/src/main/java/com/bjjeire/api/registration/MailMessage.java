package com.bjjeire.api.registration;

/**
 * One plain-text mail to a competitor.
 *
 * @param to recipient address
 */
public record MailMessage(String to, String subject, String body) {}
