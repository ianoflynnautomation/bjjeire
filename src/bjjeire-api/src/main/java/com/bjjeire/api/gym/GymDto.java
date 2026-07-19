package com.bjjeire.api.gym;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record GymDto(
        String id,
        @NotBlank @Size(max = 100) String name,
        @Size(max = 200) String description,
        @NotNull GymStatus status,
        @NotNull County county,
        Affiliation affiliation,
        @NotNull TrialOffer trialOffer,
        @NotNull Location location,
        @NotNull SocialMedia socialMedia,
        List<ClassCategory> offeredClasses,
        String website,
        String timetableUrl,
        String imageUrl,
        String thumbnailUrl) {}
