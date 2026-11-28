package com.bjjeire.api.order;

import com.bjjeire.api.common.MailMessage;
import java.util.Locale;
import java.util.stream.Collectors;

/** The text of order mails. Plain text; the site is English only. */
final class OrderMails {
    private OrderMails() {}

    /**
     * #6007: what was bought, what was paid, where it goes, and the link to the order (#6011).
     *
     * @param orderLink the order page with its key in the fragment
     */
    static MailMessage confirmed(MerchOrder order, String orderLink) {
        String body = """
                Thank you for your order. Your payment was received and your order is confirmed.

                Order: %s

                %s
                Delivery: %s
                Paid: %s

                Delivering to:
                %s

                See your order at any time:
                %s

                Keep this link to yourself: anyone who has it can see your order.
                We will email you again when your order is on its way.
                """.formatted(
                        order.getNumber(),
                        lines(order),
                        euro(order.getDeliveryCents()),
                        euro(order.getTotalCents()),
                        address(order.getAddress()),
                        orderLink);
        return new MailMessage(order.getEmail(), "Order confirmed: " + order.getNumber(), body);
    }

    /** FR-013: the payment arrived after the hold ended and the stock was gone, so it was returned in full. */
    static MailMessage refundedSoldOut(MerchOrder order) {
        String body = """
                Your payment arrived after the items were released from your basket, and they have since sold out.

                Order: %s

                %s

                We have issued a full refund of %s to your original payment method. It can take 5 to 10 days to
                appear. Nothing else is needed from you.
                """.formatted(order.getNumber(), lines(order), euro(order.getTotalCents()));
        return new MailMessage(order.getEmail(), "Order not confirmed, refund issued: " + order.getNumber(), body);
    }

    private static String lines(MerchOrder order) {
        return order.getLines().stream()
                .map(line -> "%s, size %s × %d: %s"
                        .formatted(line.getProductName(), line.getSizeId(), line.getQuantity(), euro(line.lineCents())))
                .collect(Collectors.joining("\n"));
    }

    private static String address(DeliveryAddress address) {
        StringBuilder text = new StringBuilder(address.getName()).append('\n').append(address.getLine1());
        if (address.getLine2() != null && !address.getLine2().isBlank()) {
            text.append('\n').append(address.getLine2());
        }
        text.append('\n').append(address.getTown()).append(", ").append(address.getCounty());
        if (address.getPostcode() != null && !address.getPostcode().isBlank()) {
            text.append('\n').append(address.getPostcode());
        }
        text.append('\n').append("GB".equals(address.getCountry()) ? "Northern Ireland" : "Ireland");
        return text.toString();
    }

    static String euro(int cents) {
        return String.format(Locale.ROOT, "€%d.%02d", cents / 100, cents % 100);
    }
}
