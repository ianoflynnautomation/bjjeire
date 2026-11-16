package com.bjjeire.api.bjjeirecompetition;

/** Whether a competition takes sign-ups right now. Computed on every read, never stored. */
public enum RegistrationState {
    NOT_OPEN,
    OPEN,
    CLOSED,
    FULL
}
