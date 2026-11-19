package com.bjjeire.api.registration;

import com.bjjeire.api.bjjeirecompetition.BjjEireCompetitionDto;
import com.bjjeire.api.bjjeirecompetition.DivisionDto;
import com.bjjeire.api.common.MailMessage;
import java.util.Locale;

/** The text of sign-up mails. Plain text; the site is English only. */
final class RegistrationMails {
    private RegistrationMails() {}

    static MailMessage confirmed(String to, BjjEireCompetitionDto competition, DivisionDto division, int amountCents) {
        String body = """
                Your sign-up is confirmed.

                Competition: %s
                Date: %s
                Division: %s
                Paid: %s

                You are now on the public competitor list for your division. You can see and manage your
                sign-ups under My sign-ups on the site.
                """.formatted(competition.name(), competition.date(), label(division), euro(amountCents));
        return new MailMessage(to, "Sign-up confirmed: " + competition.name(), body);
    }

    static MailMessage refundedNoPlace(
            String to, BjjEireCompetitionDto competition, DivisionDto division, int amountCents) {
        String body = """
                Your payment arrived after your place was released, and the competition had no place left.

                Competition: %s
                Division: %s
                We have issued a full refund of %s to your original payment method.
                """.formatted(competition.name(), label(division), euro(amountCents));
        return new MailMessage(to, "Sign-up not confirmed, refund issued: " + competition.name(), body);
    }

    /** FR-024, #5027: says whether a refund was issued and for how much. */
    static MailMessage cancelled(String to, BjjEireCompetitionDto competition, DivisionDto division, Refund refund) {
        String outcome;
        if (refund == null) {
            outcome = "No refund is due: the sign-up was cancelled after registration closed.";
        } else if (refund.getStatus() == RefundStatus.FAILED) {
            outcome = ("Your full refund of %s could not be completed automatically. The organiser has been told and"
                            + " will make sure you are refunded.")
                    .formatted(euro(refund.getAmountCents()));
        } else {
            outcome = "We have issued a full refund of %s to your original payment method. It can take 5 to 10 days to"
                            .formatted(euro(refund.getAmountCents()))
                    + " appear.";
        }
        String body = """
                Your sign-up has been cancelled.

                Competition: %s
                Date: %s
                Division: %s

                %s

                You are no longer on the competitor list for this division.
                """.formatted(competition.name(), competition.date(), label(division), outcome);
        return new MailMessage(to, "Sign-up cancelled: " + competition.name(), body);
    }

    /** Stripe reported the refund of a cancelled sign-up as completed. */
    static MailMessage refundCompleted(
            String to, BjjEireCompetitionDto competition, DivisionDto division, int amountCents) {
        String body = """
                Your refund has been completed.

                Competition: %s
                Division: %s
                Refunded: %s to your original payment method.
                """.formatted(competition.name(), label(division), euro(amountCents));
        return new MailMessage(to, "Refund completed: " + competition.name(), body);
    }

    /** FR-024, #5026: the organiser cancelled the whole competition. */
    static MailMessage bjjEireCompetitionCancelled(
            String to, BjjEireCompetitionDto competition, DivisionDto division, int amountCents) {
        String body = """
                The organiser has cancelled this competition.

                Competition: %s
                Date: %s
                Division: %s

                Your sign-up is cancelled and we are issuing a full refund of %s to your original payment method.
                It can take 5 to 10 days to appear.
                """.formatted(competition.name(), competition.date(), label(division), euro(amountCents));
        return new MailMessage(to, "Competition cancelled: " + competition.name(), body);
    }

    static String label(DivisionDto division) {
        if (division == null) {
            return "a division that is no longer offered";
        }
        return "%s, %s, %s, %s belt, %s"
                .formatted(
                        division.discipline() == com.bjjeire.api.bjjeirecompetition.Discipline.NO_GI ? "No-gi" : "Gi",
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
