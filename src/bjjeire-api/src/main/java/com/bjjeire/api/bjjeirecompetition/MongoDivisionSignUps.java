package com.bjjeire.api.bjjeirecompetition;

import java.util.Collection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

/**
 * Reads the sign-up collection by name, so this package does not depend on {@code registration}, which depends on it.
 * Relies only on the documented shape (specs/database-contracts/competition-registration.md): {@code competitionId},
 * {@code divisionId}, and {@code active: true} while a sign-up is awaiting payment or confirmed. Must match
 * {@code BjjEireCompetitionRegistration.ENTITY_NAME}.
 */
@Component
@RequiredArgsConstructor
public class MongoDivisionSignUps implements DivisionSignUps {
    static final String REGISTRATION_COLLECTION = "BjjEireCompetitionRegistration";

    private final MongoTemplate mongoTemplate;

    @Override
    public boolean anyActive(String competitionId, Collection<String> divisionIds) {
        if (divisionIds.isEmpty()) {
            return false;
        }
        Query query = Query.query(Criteria.where("competitionId")
                .is(competitionId)
                .and("divisionId")
                .in(divisionIds)
                .and("active")
                .is(true));
        return mongoTemplate.exists(query, REGISTRATION_COLLECTION);
    }
}
