package com.bjjeire.api.event;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
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
        boolean isActive) {}
