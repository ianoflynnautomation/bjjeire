package com.bjjeire.api.competitor;

/**
 * The gym a competitor represents: a gym from the directory ({@code gymId} set, name copied from it) or a name the
 * competitor typed ({@code gymId} null).
 *
 * @param gymId directory gym id, or null
 * @param name display name
 */
public record Academy(String gymId, String name) {}
