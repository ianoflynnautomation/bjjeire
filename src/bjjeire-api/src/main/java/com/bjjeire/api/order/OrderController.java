package com.bjjeire.api.order;

import com.bjjeire.api.common.ApiRoutes;
import com.bjjeire.api.common.ValidObjectId;
import com.bjjeire.api.config.BjjEireProperties;
import com.bjjeire.api.config.ClientIps;
import com.bjjeire.api.web.ApiProblems;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Guest checkout (User Story 3, ADR-0016). No account and no token: an order is read with the key from its link, sent
 * as {@value #ORDER_KEY_HEADER}; a wrong or missing key answers 404, as an unknown id does.
 */
@Tag(name = "BJJ Éire merch orders")
@RestController
@RequestMapping(ApiRoutes.ORDER)
public class OrderController {
    public static final String ORDER_KEY_HEADER = "X-Order-Key";
    private static final String PROBLEM = "application/problem+json";

    private final OrderService orderService;
    private final BjjEireProperties properties;

    public OrderController(OrderService orderService, BjjEireProperties properties) {
        this.orderService = orderService;
        this.properties = properties;
    }

    @GetMapping("/delivery")
    @Operation(
            summary = "Get the delivery fee",
            description = "One flat fee per order, in euro cents, and where BJJ Éire delivers: IE and GB-NIR"
                    + " (Northern Ireland).")
    public ResponseEntity<ShopDeliveryDto> getDelivery() {
        return ResponseEntity.ok(orderService.getDelivery());
    }

    @PostMapping
    @Operation(
            summary = "Start a guest checkout",
            description = "Holds the stock of every line for 30 minutes and returns a Stripe Checkout page for the"
                    + " items plus delivery, at the shop's own prices. No account is needed. orderKey is returned"
                    + " this once: keep it to read the order. Each line names the price the shopper saw and the body"
                    + " names the delivery fee they saw; if either changed, nothing is held and 409 basket-changed"
                    + " lists what changed. Not idempotent: each call makes a new order.")
    @ApiResponse(responseCode = "201", description = "The stock is held; send the shopper to checkoutUrl")
    @ApiResponse(
            responseCode = "400",
            description = "Validation failed, such as a quantity of 0, a missing email or a malformed Eircode",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "basket-changed (with lines[] and nowDeliveryCents), size-sold-out, basket-too-large,"
                    + " too-many-unpaid or delivery-not-available. Nothing was charged",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "502",
            description = "payment-unavailable: Stripe could not be reached; the stock was released",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<OrderCheckoutDto> createOrder(
            @RequestBody @Valid CreateOrderCommand command, HttpServletRequest request) {
        String clientIp =
                ClientIps.resolve(request, null, properties.rateLimit().trustedProxyAddresses());
        OrderCheckoutDto checkout = orderService.create(command, clientIp);
        return ResponseEntity.created(URI.create(ApiRoutes.ORDER + "/" + checkout.orderId()))
                .body(checkout);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get an order with its key",
            description = "The order's items, amounts, delivery details and status, for the holder of the key in its"
                    + " link. A wrong or missing X-Order-Key answers 404, as an unknown id does.")
    @ApiResponse(responseCode = "200", description = "The order")
    @ApiResponse(
            responseCode = "404",
            description = "No such order, or the key is wrong or missing",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<OrderDto> getOrder(
            @PathVariable @ValidObjectId String id,
            @Parameter(description = "The access key from the order's link")
                    @RequestHeader(name = ORDER_KEY_HEADER, required = false)
                    String key) {
        return orderService.getWithKey(id, key).map(ResponseEntity::ok).orElseThrow(ApiProblems::notFound);
    }

    @PostMapping("/{id}/checkout")
    @Operation(
            summary = "Return to payment",
            description = "The order's open Stripe Checkout page again, while its hold lasts. orderKey is not"
                    + " returned. 409 hold-expired once the hold ended, and 409 payment-received when Stripe already"
                    + " has the money.")
    @ApiResponse(responseCode = "200", description = "The open Checkout page")
    @ApiResponse(
            responseCode = "404",
            description = "No such order, or the key is wrong or missing",
            content = @Content(mediaType = PROBLEM))
    @ApiResponse(
            responseCode = "409",
            description = "hold-expired or payment-received",
            content = @Content(mediaType = PROBLEM))
    public ResponseEntity<OrderCheckoutDto> resumeCheckout(
            @PathVariable @ValidObjectId String id,
            @Parameter(description = "The access key from the order's link")
                    @RequestHeader(name = ORDER_KEY_HEADER, required = false)
                    String key) {
        return ResponseEntity.ok(orderService.resumeCheckout(id, key));
    }
}
