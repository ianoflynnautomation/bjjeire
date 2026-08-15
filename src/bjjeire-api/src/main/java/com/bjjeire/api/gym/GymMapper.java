package com.bjjeire.api.gym;

import java.util.ArrayList;
import java.util.List;

public final class GymMapper {
    private GymMapper() {}

    public static GymDto toDto(Gym gym) {
        return new GymDto(
                gym.getId(),
                gym.getName(),
                gym.getDescription(),
                gym.getStatus(),
                gym.getCounty(),
                gym.getAffiliation(),
                gym.getTrialOffer(),
                gym.getLocation(),
                gym.getSocialMedia(),
                gym.getOfferedClasses() == null ? List.of() : List.copyOf(gym.getOfferedClasses()),
                gym.getWebsite(),
                gym.getTimetableUrl(),
                gym.getImageUrl(),
                thumbnailUrl(gym.getImageUrl()));
    }

    public static Gym toEntity(GymDto dto) {
        Gym gym = new Gym();
        apply(dto, gym);
        return gym;
    }

    public static void apply(GymDto dto, Gym gym) {
        gym.setId(dto.id());
        gym.setName(dto.name());
        gym.setDescription(dto.description());
        gym.setStatus(dto.status());
        gym.setCounty(dto.county());
        gym.setAffiliation(dto.affiliation());
        gym.setTrialOffer(dto.trialOffer());
        gym.setLocation(dto.location());
        gym.setSocialMedia(dto.socialMedia());
        gym.setOfferedClasses(dto.offeredClasses() == null ? new ArrayList<>() : new ArrayList<>(dto.offeredClasses()));
        gym.setWebsite(dto.website());
        gym.setTimetableUrl(dto.timetableUrl());
        gym.setImageUrl(dto.imageUrl());
    }

    /**
     * CDN convention: large assets end in {@code -lg.}; thumbs use {@code -thumb.}. When the marker is absent the
     * original URL is returned unchanged.
     */
    private static String thumbnailUrl(String imageUrl) {
        return imageUrl == null ? null : imageUrl.replace("-lg.", "-thumb.");
    }
}
