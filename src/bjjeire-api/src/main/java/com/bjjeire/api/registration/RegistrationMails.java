package com.bjjeire.api.registration;

import com.bjjeire.api.tournament.DivisionDto;
import com.bjjeire.api.tournament.TournamentDto;
import java.util.Locale;

/** The text of sign-up mails. Plain text; the site is English only. */
final class RegistrationMails {
    private RegistrationMails() {}

    static MailMessage confirmed(String to, TournamentDto tournament, DivisionDto division, int amountCents) {
        String body = """
                Your sign-up is confirmed.

                Tournament: %s
                Date: %s
                Division: %s
                Paid: %s

                You are now on the public competitor list for your division. You can see and manage your
                sign-ups under My sign-ups on the site.
                """.formatted(tournament.name(), tournament.date(), label(division), euro(amountCents));
        return new MailMessage(to, "Sign-up confirmed: " + tournament.name(), body);
    }

    static MailMessage refundedNoPlace(String to, TournamentDto tournament, DivisionDto division, int amountCents) {
        String body = """
                Your payment arrived after your place was released, and the tournament had no place left.

                Tournament: %s
                Division: %s
                We have issued a full refund of %s to your original payment method.
                """.formatted(tournament.name(), label(division), euro(amountCents));
        return new MailMessage(to, "Sign-up not confirmed, refund issued: " + tournament.name(), body);
    }

    static String label(DivisionDto division) {
        if (division == null) {
            return "a division that is no longer offered";
        }
        return "%s, %s, %s, %s belt, %s"
                .formatted(
                        division.discipline() == com.bjjeire.api.tournament.Discipline.NO_GI ? "No-gi" : "Gi",
                        capitalise(division.gender().name()),
                        capitalise(division.ageCategory().name().replace('_', ' ')),
                        capitalise(division.belt().name()),
                        division.weightClass());
    }

    static String euro(int cents) {
        return String.format(Locale.ROOT, "€%d.%02d", cents / 100, cents % 100);
    }

    private static String capitalise(String value) {
        String lower = value.toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
