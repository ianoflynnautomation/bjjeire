package com.bjjeire.api.seeder;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RelativeInstantDeserializer extends JsonDeserializer<Instant> {
    private static final Pattern RELATIVE_TOKEN = Pattern.compile(
            "^now(?:\\s*(?<sign>[+-])\\s*(?<value>\\d+)\\s*(?<unit>[dhm]))?$", Pattern.CASE_INSENSITIVE);

    private final Clock clock;

    public RelativeInstantDeserializer(Clock clock) {
        this.clock = clock;
    }

    @Override
    public Instant deserialize(JsonParser parser, DeserializationContext context) throws IOException {
        String raw = parser.getValueAsString();
        if (raw == null) {
            return null;
        }

        Matcher matcher = RELATIVE_TOKEN.matcher(raw.trim());
        if (matcher.matches()) {
            return resolveRelative(matcher);
        }

        // A value that looks like a relative token but did not parse is a
        // mistake in the fixture — fail loudly rather than as a vague
        // date-parse error further down.
        if (raw.trim().toLowerCase(Locale.ROOT).startsWith("now")) {
            throw new InvalidFormatException(
                    parser,
                    "Invalid relative date token '" + raw + "'. Expected 'now' optionally followed by a signed "
                            + "offset such as '+7d', '-30d', or '+12h' (units: d = days, h = hours, m = minutes).",
                    raw,
                    Instant.class);
        }

        try {
            return Instant.parse(raw);
        } catch (DateTimeParseException exception) {
            // Zone-less timestamps are treated as UTC.
            return LocalDateTime.parse(raw).toInstant(ZoneOffset.UTC);
        }
    }

    private Instant resolveRelative(Matcher matcher) {
        Instant now = clock.instant();
        if (matcher.group("value") == null) {
            return now;
        }

        long magnitude = Long.parseLong(matcher.group("value"));
        if ("-".equals(matcher.group("sign"))) {
            magnitude = -magnitude;
        }

        return switch (matcher.group("unit").toLowerCase(Locale.ROOT)) {
            case "d" -> now.plus(magnitude, ChronoUnit.DAYS);
            case "h" -> now.plus(magnitude, ChronoUnit.HOURS);
            default -> now.plus(magnitude, ChronoUnit.MINUTES);
        };
    }
}
