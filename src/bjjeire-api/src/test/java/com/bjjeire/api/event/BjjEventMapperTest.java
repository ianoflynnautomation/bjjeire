package com.bjjeire.api.event;

import static org.assertj.core.api.Assertions.assertThat;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.Location;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class BjjEventMapperTest {
    private static final BjjEventSchedule SCHEDULE = new BjjEventSchedule(
            ScheduleKind.FixedDates,
            Instant.parse("2026-07-25T00:00:00Z"),
            Instant.parse("2026-07-27T00:00:00Z"),
            List.of(new BjjEventSession(
                    Instant.parse("2026-07-25T00:00:00Z"),
                    null,
                    LocalTime.of(10, 0),
                    LocalTime.of(16, 0),
                    "Day 1 — Gi",
                    List.of(BjjEventType.Camp))));

    private static final List<PricingModel> PRICING_OPTIONS = List.of(
            new PricingModel(PricingType.FlatRate, "Full camp", null, new BigDecimal("275"), 3, "EUR"),
            new PricingModel(
                    PricingType.PerDay, "Day pass", List.of(BjjEventType.OpenMat), new BigDecimal("110"), null, "EUR"));

    @Test
    void toDtoMapsBjjEventFields() {
        BjjEvent event = new BjjEvent();
        event.setId("665624c1ad01ce465c6cf789");
        event.setName("Ground Game Camp");
        event.setDescription("Coach: Paulo Miyao");
        event.setTypes(List.of(BjjEventType.Camp, BjjEventType.OpenMat));
        event.setOrganiser(new Organizer("BJJ Eire", "https://bjjeire.com"));
        event.setStatus(EventStatus.Upcoming);
        event.setCounty(County.Clare);
        event.setLocation(new Location("1 Main Street", "Shannon Jiu-Jitsu Academy", null));
        event.setSchedule(SCHEDULE);
        event.setPricingOptions(PRICING_OPTIONS);
        event.setEventUrl("https://groundgame.camp/");
        event.setActive(true);

        BjjEventDto dto = BjjEventMapper.toDto(event);

        assertThat(dto.id()).isEqualTo("665624c1ad01ce465c6cf789");
        assertThat(dto.types()).containsExactly(BjjEventType.Camp, BjjEventType.OpenMat);
        assertThat(dto.organiser().name()).isEqualTo("BJJ Eire");
        assertThat(dto.county()).isEqualTo(County.Clare);
        assertThat(dto.schedule().kind()).isEqualTo(ScheduleKind.FixedDates);
        assertThat(dto.schedule().sessions()).hasSize(1);
        assertThat(dto.schedule().sessions().get(0).startTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(dto.pricingOptions()).hasSize(2);
        assertThat(dto.pricingOptions().get(0).label()).isEqualTo("Full camp");
        assertThat(dto.pricingOptions().get(1).appliesToTypes()).containsExactly(BjjEventType.OpenMat);
        assertThat(dto.isActive()).isTrue();

        assertThat(dto.calculatedCosts()).hasSize(2);
        assertThat(dto.calculatedCosts().get(0).unit()).isEqualTo(CostUnit.Total);
        assertThat(dto.calculatedCosts().get(0).total()).isEqualByComparingTo("275");
        assertThat(dto.calculatedCosts().get(1).unit()).isEqualTo(CostUnit.PerDay);
        assertThat(dto.calculatedCosts().get(1).total()).isEqualByComparingTo("330");
    }

    @Test
    void toEntityMapsBjjEventDtoFields() {
        BjjEventDto dto = new BjjEventDto(
                "665624c1ad01ce465c6cf789",
                "Ground Game Camp",
                "Coach: Paulo Miyao",
                List.of(BjjEventType.Camp, BjjEventType.OpenMat),
                new Organizer("BJJ Eire", "https://bjjeire.com"),
                EventStatus.Upcoming,
                null,
                null,
                County.Clare,
                new Location("1 Main Street", "Shannon Jiu-Jitsu Academy", null),
                SCHEDULE,
                PRICING_OPTIONS,
                "https://groundgame.camp/",
                null,
                true);

        BjjEvent event = BjjEventMapper.toEntity(dto);

        assertThat(event.getId()).isEqualTo("665624c1ad01ce465c6cf789");
        assertThat(event.getName()).isEqualTo("Ground Game Camp");
        assertThat(event.getTypes()).containsExactly(BjjEventType.Camp, BjjEventType.OpenMat);
        assertThat(event.getOrganiser().name()).isEqualTo("BJJ Eire");
        assertThat(event.getSchedule().sessions()).hasSize(1);
        assertThat(event.getPricingOptions().get(0).type()).isEqualTo(PricingType.FlatRate);
        assertThat(event.isActive()).isTrue();
    }

    @Test
    void applyUpdatesMutableEntityFields() {
        BjjEvent event = new BjjEvent();
        event.setId("665624c1ad01ce465c6cf789");
        event.setName("Old Name");
        event.setTypes(List.of(BjjEventType.OpenMat));
        event.setActive(false);

        BjjEventDto dto = new BjjEventDto(
                "ignored",
                "New Name",
                "Updated",
                List.of(BjjEventType.Seminar),
                new Organizer("BJJ Eire", "https://bjjeire.com"),
                EventStatus.Upcoming,
                null,
                null,
                County.Cork,
                null,
                SCHEDULE,
                PRICING_OPTIONS,
                "https://example.com/events/seminar",
                "https://cdn.bjjeire.com/events/seminar.webp",
                true);

        BjjEventMapper.apply(dto, event);

        assertThat(event.getId()).isEqualTo("665624c1ad01ce465c6cf789");
        assertThat(event.getName()).isEqualTo("New Name");
        assertThat(event.getTypes()).containsExactly(BjjEventType.Seminar);
        assertThat(event.getCounty()).isEqualTo(County.Cork);
        assertThat(event.isActive()).isTrue();
    }
}
