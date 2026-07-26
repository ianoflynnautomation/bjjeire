package com.bjjeire.api.event;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@ValidBjjEvent
public record BjjEventDto(
        String id,
        String name,
        String description,
        List<BjjEventType> types,
        Organizer organiser,
        EventStatus status,
        String statusReason,
        SocialMedia socialMedia,
        County county,
        Location location,
        BjjEventSchedule schedule,
        List<PricingModel> pricingOptions,
        String eventUrl,
        String imageUrl,
        boolean isActive,

        @JsonProperty(access = JsonProperty.Access.READ_ONLY)
        List<CalculatedCost> calculatedCosts) {

    public BjjEventDto(
            String id,
            String name,
            String description,
            List<BjjEventType> types,
            Organizer organiser,
            EventStatus status,
            String statusReason,
            SocialMedia socialMedia,
            County county,
            Location location,
            BjjEventSchedule schedule,
            List<PricingModel> pricingOptions,
            String eventUrl,
            String imageUrl,
            boolean isActive) {
        this(
                id,
                name,
                description,
                types,
                organiser,
                status,
                statusReason,
                socialMedia,
                county,
                location,
                schedule,
                pricingOptions,
                eventUrl,
                imageUrl,
                isActive,
                null);
    }
}
