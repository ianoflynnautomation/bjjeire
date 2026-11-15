package com.bjjeire.api.competitor;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * A sign-in identity whose account was deleted (#5012, research R11). Its tokens are refused from then on, even while
 * the external tenant still holds the identity. Holds no personal details: the subject is a pseudonymous id that the
 * tenant never reuses for anyone else.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(DeletedCompetitor.ENTITY_NAME)
public class DeletedCompetitor {
    public static final String ENTITY_NAME = "DeletedCompetitor";

    @Id
    private String id;

    private String issuer;
    private String subject;
    private Instant deletedAt;

    /** Whether the external tenant confirmed the identity was removed. False means it must be removed by hand. */
    private boolean directoryDeleted;
}
