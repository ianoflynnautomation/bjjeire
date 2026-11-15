package com.bjjeire.api.competitor;

import com.bjjeire.api.config.RevokedCompetitors;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

/**
 * Answers from the {@link DeletedCompetitor} collection, which {@code ix_deletedCompetitor_issuer_subject_unique}
 * covers.
 */
@Component
@RequiredArgsConstructor
class MongoRevokedCompetitors implements RevokedCompetitors {
    private final MongoTemplate mongoTemplate;

    @Override
    public boolean isRevoked(String issuer, String subject, Instant issuedAt) {
        if (issuer == null || subject == null) {
            return false;
        }
        Criteria deleted = Criteria.where("issuer").is(issuer).and("subject").is(subject);
        if (issuedAt != null) {
            // iat has whole seconds: a token from the second of the deletion counts as older, and is refused.
            deleted.and("deletedAt").gt(issuedAt);
        }
        return mongoTemplate.exists(Query.query(deleted), DeletedCompetitor.class);
    }
}
