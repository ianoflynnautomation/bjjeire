package com.bjjeire.api.tournament;

import com.bjjeire.api.common.Location;
import java.time.Instant;
import java.time.LocalDate;
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

/** A competition BjjEire runs itself. Distinct from {@code Competition}, the directory of other organisers' events. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(Tournament.ENTITY_NAME)
public class Tournament {
    public static final String ENTITY_NAME = "Tournament";
    public static final String CURRENCY = "EUR";

    @Id
    private String id;

    /**
     * Counts organiser writes. An update or publish names the version it was made from and is refused when another
     * write came first. Kept by hand, not {@code @Version}: every write is a guarded {@code findAndModify}.
     */
    private Long version;

    private String slug;
    private String name;
    private String description;

    /** The competition day, read in Europe/Dublin. */
    private LocalDate date;

    private Location venue;

    /** Fee for one division sign-up, in cents. */
    private int entryFeeCents;

    @Builder.Default
    private String currency = CURRENCY;

    private Instant registrationOpensAt;
    private Instant registrationClosesAt;

    /** Null means no limit. */
    private Integer competitorLimit;

    /** Active sign-ups. Changed only by an atomic increment, never by saving the document. */
    private int placesTaken;

    @Builder.Default
    private TournamentStatus status = TournamentStatus.DRAFT;

    @Builder.Default
    private List<Division> divisions = new ArrayList<>();

    @Field("createdAt")
    private Instant createdOnUtc;

    @Field("createdBy")
    private String createdBy;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;
}
