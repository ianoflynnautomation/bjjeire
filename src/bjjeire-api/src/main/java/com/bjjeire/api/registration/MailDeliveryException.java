package com.bjjeire.api.registration;

/** A mail could not be handed to the relay. */
public class MailDeliveryException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public MailDeliveryException(String message) {
        super(message);
    }

    public MailDeliveryException(String message, Throwable cause) {
        super(message, cause);
    }
}
