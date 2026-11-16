package com.bjjeire.api.web;

import java.net.URI;

/** Problem type URIs for every API error. One family, so clients can match on `type`. */
public final class ProblemTypes {
    public static final URI BAD_REQUEST = URI.create("urn:bjjeire:bad-request");
    public static final URI UNAUTHORIZED = URI.create("urn:bjjeire:unauthorized");
    public static final URI FORBIDDEN = URI.create("urn:bjjeire:forbidden");
    public static final URI NOT_FOUND = URI.create("urn:bjjeire:not-found");
    public static final URI METHOD_NOT_ALLOWED = URI.create("urn:bjjeire:method-not-allowed");
    public static final URI CONFLICT = URI.create("urn:bjjeire:conflict");
    public static final URI VALIDATION = URI.create("urn:bjjeire:validation-error");
    public static final URI RATE_LIMIT = URI.create("urn:bjjeire:rate-limit-exceeded");
    public static final URI INTERNAL = URI.create("urn:bjjeire:internal-error");

    /** Publishing a tournament that has no division. */
    public static final URI NO_DIVISIONS = URI.create("urn:bjjeire:no-divisions");
    /** A registration window that closes before it opens or after the tournament day. */
    public static final URI INVALID_WINDOW = URI.create("urn:bjjeire:invalid-window");
    /** Removing a division that still has active sign-ups. */
    public static final URI DIVISION_HAS_SIGNUPS = URI.create("urn:bjjeire:division-has-signups");

    /** Deleting an account that still has a sign-up awaiting payment or confirmed. */
    public static final URI HAS_ACTIVE_REGISTRATION = URI.create("urn:bjjeire:has-active-registration");

    /** Sign-up outside the registration window, or in a tournament that is not published. */
    public static final URI REGISTRATION_NOT_OPEN = URI.create("urn:bjjeire:registration-not-open");
    /** A division for another gender or belt, or an age category the competitor is too young for. */
    public static final URI NOT_ELIGIBLE = URI.create("urn:bjjeire:not-eligible");
    /** The competitor is under 18 on the tournament day (FR-017). */
    public static final URI UNDER_18 = URI.create("urn:bjjeire:under-18");
    /** The competitor already holds an active sign-up in this division (FR-020). */
    public static final URI ALREADY_REGISTERED = URI.create("urn:bjjeire:already-registered");
    /** Every place is taken (FR-022). */
    public static final URI TOURNAMENT_FULL = URI.create("urn:bjjeire:tournament-full");
    /** The profile lacks a field a sign-up needs (FR-015). */
    public static final URI PROFILE_INCOMPLETE = URI.create("urn:bjjeire:profile-incomplete");
    /** The competitor already has two unpaid sign-ups in this tournament (FR-041). */
    public static final URI TOO_MANY_UNPAID = URI.create("urn:bjjeire:too-many-unpaid");
    /** Changing division once registration has closed; the organiser can still move the sign-up. */
    public static final URI REGISTRATION_CLOSED = URI.create("urn:bjjeire:registration-closed");
    /** Resuming payment for a sign-up whose hold has ended or that is no longer awaiting payment. */
    public static final URI HOLD_EXPIRED = URI.create("urn:bjjeire:hold-expired");
    /** The sign-up's Checkout is already paid; the confirmation is on its way. */
    public static final URI PAYMENT_RECEIVED = URI.create("urn:bjjeire:payment-received");
    /** The payment provider could not be reached; nothing was charged. */
    public static final URI PAYMENT_UNAVAILABLE = URI.create("urn:bjjeire:payment-unavailable");

    /** A capability that is switched on but not configured here, such as Stripe with placeholder secrets. */
    public static final URI SERVICE_UNAVAILABLE = URI.create("urn:bjjeire:service-unavailable");

    private ProblemTypes() {}
}
