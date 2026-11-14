package com.bjjeire.api.tournament;

import java.util.Collection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

/**
 * Reads the sign-up collection by name. The {@code registration} package that owns it is not built yet, so this depends
 * only on the documented shape (specs/001-tournament-registration/data-model.md): {@code tournamentId},
 * {@code divisionId}, and {@code active: true} while a sign-up is awaiting payment or confirmed.
 */
@Component
@RequiredArgsConstructor
public class MongoDivisionSignUps implements DivisionSignUps {
    static final String REGISTRATION_COLLECTION = "TournamentRegistration";

    private final MongoTemplate mongoTemplate;

    @Override
    public boolean anyActive(String tournamentId, Collection<String> divisionIds) {
        if (divisionIds.isEmpty()) {
            return false;
        }
        Query query = Query.query(Criteria.where("tournamentId")
                .is(tournamentId)
                .and("divisionId")
                .in(divisionIds)
                .and("active")
                .is(true));
        return mongoTemplate.exists(query, REGISTRATION_COLLECTION);
    }
}
