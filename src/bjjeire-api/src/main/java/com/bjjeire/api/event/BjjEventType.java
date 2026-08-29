package com.bjjeire.api.event;

public enum BjjEventType {
    OpenMat(0),
    Seminar(1),
    Camp(3),
    Other(4);

    private final int code;

    BjjEventType(int code) {
        this.code = code;
    }

    public int code() {
        return code;
    }

    public static BjjEventType fromWire(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        for (BjjEventType type : values()) {
            if (type.name().equalsIgnoreCase(trimmed)
                    || Integer.toString(type.code).equals(trimmed)) {
                return type;
            }
        }
        return null;
    }
}
