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

    /** Publishing a competition that has no division. */
    public static final URI NO_DIVISIONS = URI.create("urn:bjjeire:no-divisions");
    /** A registration window that closes before it opens or after the competition day. */
    public static final URI INVALID_WINDOW = URI.create("urn:bjjeire:invalid-window");
    /** Removing a division that still has active sign-ups. */
    public static final URI DIVISION_HAS_SIGNUPS = URI.create("urn:bjjeire:division-has-signups");

    /** Deleting an account that still has a sign-up awaiting payment or confirmed. */
    public static final URI HAS_ACTIVE_REGISTRATION = URI.create("urn:bjjeire:has-active-registration");

    /** Sign-up outside the registration window, or in a competition that is not published. */
    public static final URI REGISTRATION_NOT_OPEN = URI.create("urn:bjjeire:registration-not-open");
    /** A division for another gender or belt, or an age category the competitor is too young for. */
    public static final URI NOT_ELIGIBLE = URI.create("urn:bjjeire:not-eligible");
    /** The competitor is under 18 on the competition day (FR-017). */
    public static final URI UNDER_18 = URI.create("urn:bjjeire:under-18");
    /** The competitor already holds an active sign-up in this division (FR-020). */
    public static final URI ALREADY_REGISTERED = URI.create("urn:bjjeire:already-registered");
    /** Every place is taken (FR-022). */
    public static final URI COMPETITION_FULL = URI.create("urn:bjjeire:competition-full");
    /** The profile lacks a field a sign-up needs (FR-015). */
    public static final URI PROFILE_INCOMPLETE = URI.create("urn:bjjeire:profile-incomplete");
    /** The competitor already has two unpaid sign-ups in this competition (FR-041). */
    public static final URI TOO_MANY_UNPAID = URI.create("urn:bjjeire:too-many-unpaid");
    /** Changing division once registration has closed; the organiser can still move the sign-up. */
    public static final URI REGISTRATION_CLOSED = URI.create("urn:bjjeire:registration-closed");
    /** Resuming payment for a sign-up whose hold has ended or that is no longer awaiting payment. */
    public static final URI HOLD_EXPIRED = URI.create("urn:bjjeire:hold-expired");
    /** The sign-up's Checkout is already paid; the confirmation is on its way. */
    public static final URI PAYMENT_RECEIVED = URI.create("urn:bjjeire:payment-received");
    /** The payment provider could not be reached; nothing was charged. */
    public static final URI PAYMENT_UNAVAILABLE = URI.create("urn:bjjeire:payment-unavailable");

    /** A medal names someone who is not a confirmed competitor in that division. */
    public static final URI NOT_IN_DIVISION = URI.create("urn:bjjeire:not-in-division");
    /** One competitor named for two places on the same podium. */
    public static final URI DUPLICATE_MEDALLIST = URI.create("urn:bjjeire:duplicate-medallist");
    /** Cancelling or moving a sign-up a recorded result names (FR-026); correct the result first. */
    public static final URI RESULT_RECORDED = URI.create("urn:bjjeire:result-recorded");

    /** Setting a size's stock below what unpaid checkouts hold of it (specs/stc/shop/contract.yaml). */
    public static final URI STOCK_BELOW_HELD = URI.create("urn:bjjeire:stock-below-held");
    /** Removing a size that unpaid checkouts still hold. */
    public static final URI SIZE_HAS_HOLDS = URI.create("urn:bjjeire:size-has-holds");
    /** Publishing a product with no photo, more than six, or no size. */
    public static final URI PRODUCT_NOT_PUBLISHABLE = URI.create("urn:bjjeire:product-not-publishable");
    /** Adding a seventh photo to a product. */
    public static final URI TOO_MANY_PHOTOS = URI.create("urn:bjjeire:too-many-photos");
    /** An upload that is not a JPEG, PNG or WebP by its first bytes. */
    public static final URI UNSUPPORTED_IMAGE = URI.create("urn:bjjeire:unsupported-image");
    /** An upload over the size limit. */
    public static final URI PAYLOAD_TOO_LARGE = URI.create("urn:bjjeire:payload-too-large");
    /** Deleting a product that is not a draft; hide it instead. */
    public static final URI PRODUCT_NOT_DRAFT = URI.create("urn:bjjeire:product-not-draft");

    /**
     * A basket line that sold out, changed price or went off sale, or a delivery fee that changed, since the shopper
     * last saw it (#6010). The body lists each change in {@code lines} and the new fee in {@code nowDeliveryCents}.
     */
    public static final URI BASKET_CHANGED = URI.create("urn:bjjeire:basket-changed");
    /** A size another shopper took the last units of while this checkout was being started (#6009). */
    public static final URI SIZE_SOLD_OUT = URI.create("urn:bjjeire:size-sold-out");
    /** More units in one line, or in one order, than a guest may hold (research R7). */
    public static final URI BASKET_TOO_LARGE = URI.create("urn:bjjeire:basket-too-large");
    /** A delivery address outside the Republic of Ireland and Northern Ireland (FR-017). */
    public static final URI DELIVERY_NOT_AVAILABLE = URI.create("urn:bjjeire:delivery-not-available");

    /** A capability that is switched on but not configured here, such as Stripe with placeholder secrets. */
    public static final URI SERVICE_UNAVAILABLE = URI.create("urn:bjjeire:service-unavailable");

    private ProblemTypes() {}
}
