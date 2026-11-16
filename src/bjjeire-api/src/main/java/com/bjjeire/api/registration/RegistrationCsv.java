package com.bjjeire.api.registration;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Writes the organiser's sign-up export (FR-006) as RFC 4180 CSV, one column per {@link AdminRegistrationDto} field in
 * declaration order. A value a spreadsheet would run as a formula is prefixed with an apostrophe (OWASP CSV injection).
 */
final class RegistrationCsv {
    static final List<String> COLUMNS = List.of(
            "registrationId",
            "displayName",
            "email",
            "phone",
            "dateOfBirth",
            "gender",
            "belt",
            "academy",
            "affiliation",
            "academyKey",
            "affiliationKey",
            "division",
            "status",
            "amountCents",
            "paymentStatus",
            "refundStatus",
            "paymentUnconfirmed",
            "profileMismatch",
            "createdAt");

    private static final String LINE_END = "\r\n";

    private RegistrationCsv() {}

    static String write(List<AdminRegistrationDto> rows) {
        StringBuilder csv = new StringBuilder(String.join(",", COLUMNS)).append(LINE_END);
        for (AdminRegistrationDto row : rows) {
            csv.append(Stream.of(
                                    row.registrationId(),
                                    row.displayName(),
                                    row.email(),
                                    row.phone(),
                                    row.dateOfBirth(),
                                    row.gender(),
                                    row.belt(),
                                    row.academy(),
                                    row.affiliation(),
                                    row.academyKey(),
                                    row.affiliationKey(),
                                    row.division() == null ? null : RegistrationMails.label(row.division()),
                                    row.status(),
                                    row.amountCents(),
                                    row.paymentStatus(),
                                    row.refundStatus(),
                                    row.paymentUnconfirmed(),
                                    row.profileMismatch(),
                                    row.createdAt())
                            .map(RegistrationCsv::cell)
                            .collect(Collectors.joining(",")))
                    .append(LINE_END);
        }
        return csv.toString();
    }

    static String cell(Object value) {
        if (value == null) {
            return "";
        }
        String text = Objects.toString(value);
        if (!text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) {
            text = "'" + text;
        }
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            text = "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }
}
