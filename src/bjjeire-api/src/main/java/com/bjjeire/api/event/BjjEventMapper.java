package com.bjjeire.api.event;

import java.util.List;

public final class BjjEventMapper {
    private BjjEventMapper() {}

    public static BjjEventDto toDto(BjjEvent event) {
        List<PricingModel> pricingOptions = event.getPricingOptions();
        List<CalculatedCost> calculatedCosts = BjjEventCostCalculator.calculate(
                event.getSchedule(), pricingOptions == null ? List.of() : pricingOptions);
        return new BjjEventDto(
                event.getId(),
                event.getName(),
                event.getDescription(),
                event.getTypes(),
                event.getOrganiser(),
                event.getStatus(),
                event.getStatusReason(),
                event.getSocialMedia(),
                event.getCounty(),
                event.getLocation(),
                event.getSchedule(),
                event.getPricingOptions(),
                event.getEventUrl(),
                event.getImageUrl(),
                event.isActive(),
                calculatedCosts);
    }

    public static BjjEvent toEntity(BjjEventDto dto) {
        BjjEvent event = new BjjEvent();
        event.setId(dto.id());
        apply(dto, event);

        return event;
    }

    public static void apply(BjjEventDto dto, BjjEvent event) {
        event.setName(dto.name());
        event.setDescription(dto.description());
        event.setTypes(dto.types());
        event.setOrganiser(dto.organiser());
        event.setStatus(dto.status());
        event.setStatusReason(dto.statusReason());
        event.setSocialMedia(dto.socialMedia());
        event.setCounty(dto.county());
        event.setLocation(dto.location());
        event.setSchedule(dto.schedule());
        event.setPricingOptions(dto.pricingOptions());
        event.setEventUrl(dto.eventUrl());
        event.setImageUrl(dto.imageUrl());
        event.setActive(dto.isActive());
    }
}
