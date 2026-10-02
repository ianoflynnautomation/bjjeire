package com.bjjeire.api.event;

public enum BjjEventType {
    OpenMat,
    Seminar,
    Camp,
    Other;

    public static BjjEventType fromWire(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        for (BjjEventType type : values()) {
            if (type.name().equalsIgnoreCase(trimmed)) {
                return type;
            }
        }
        return null;
    }
}
