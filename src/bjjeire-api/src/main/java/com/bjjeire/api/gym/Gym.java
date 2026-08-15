package com.bjjeire.api.gym;

import com.bjjeire.api.common.County;
import com.bjjeire.api.common.Location;
import com.bjjeire.api.common.SocialMedia;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(Gym.ENTITY_NAME)
public class Gym {
    public static final String ENTITY_NAME = "Gym";

    @Id
    private String id;

    private String name;
    private String description;
    private GymStatus status;
    private County county;
    private Affiliation affiliation;
    private TrialOffer trialOffer;
    private Location location;
    private SocialMedia socialMedia;

    @Builder.Default
    private List<ClassCategory> offeredClasses = new ArrayList<>();

    private String website;
    private String timetableUrl;
    private String imageUrl;

    @Field("createdAt")
    private Instant createdOnUtc;

    @Field("createdBy")
    private String createdBy;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;
}
