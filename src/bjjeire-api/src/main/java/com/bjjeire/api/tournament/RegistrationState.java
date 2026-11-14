package com.bjjeire.api.tournament;

/** Whether a tournament takes sign-ups right now. Computed on every read, never stored. */
public enum RegistrationState {
    NOT_OPEN,
    OPEN,
    CLOSED,
    FULL
}
