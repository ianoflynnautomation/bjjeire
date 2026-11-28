package com.bjjeire.api.order;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** When the organiser sent an order, and its tracking reference if any (#6019). */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderDispatch {
    private Instant dispatchedAt;
    private String trackingReference;
    private String by;
}
