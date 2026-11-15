package com.bjjeire.api.competitor;

import com.bjjeire.api.tournament.Belt;
import com.bjjeire.api.tournament.Gender;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

/**
 * A member of the public's competing details, one per sign-in identity (data-model.md § Competitor). Private to its
 * owner and the organiser (FR-011): no public response is ever built from this document.
 */
@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Document(Competitor.ENTITY_NAME)
public class Competitor {
    public static final String ENTITY_NAME = "Competitor";

    @Id
    private String id;

    /** Token issuer of the competitor tenant. With {@link #subject}, unique: the person's identity (ADR-0012). */
    private String issuer;

    private String subject;

    /** From the token's email claim, refreshed on every save. Never taken from the request body. */
    private String email;

    private String firstName;
    private String middleName;
    private String lastName;

    /** ISO 3166-1 alpha-2. */
    private String nationality;

    private LocalDate dateOfBirth;
    private Gender gender;
    private Belt belt;

    /** Null means "no academy". */
    private Academy academy;

    private String affiliation;
    private String phone;
    private PostalAddress address;

    @Field("createdAt")
    private Instant createdOnUtc;

    @Field("createdBy")
    private String createdBy;

    @Field("updatedAt")
    private Instant updatedOnUtc;

    @Field("updatedBy")
    private String updatedBy;

    /** Whether the profile holds everything a sign-up needs (FR-015). */
    public boolean isProfileComplete() {
        return hasText(firstName)
                && hasText(lastName)
                && hasText(nationality)
                && dateOfBirth != null
                && gender != null
                && belt != null;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
