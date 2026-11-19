package com.bjjeire.api.common;

/**
 * One plain-text mail, to a competitor or a shopper.
 *
 * @param to recipient address
 */
public record MailMessage(String to, String subject, String body) {}
