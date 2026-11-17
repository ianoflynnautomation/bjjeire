package com.bjjeire.api.bjjeirecompetition;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Component;

/**
 * Reads the sign-up collection by name, so this package does not depend on {@code registration}, which depends on it.
 * Relies only on the documented shape (specs/database-contracts/bjjeire-competition-registration.md):
 * {@code competitionId}, {@code divisionId}, {@code status}, {@code active: true} while a sign-up is awaiting payment
 * or confirmed, and the public snapshot {@code displayName}, {@code academy.name}, {@code affiliation},
 * {@code academyKey}, {@code affiliationKey}. Must match {@code BjjEireCompetitionRegistration.ENTITY_NAME}.
 */
@Component
@RequiredArgsConstructor
public class MongoDivisionSignUps implements DivisionSignUps {
    static final String REGISTRATION_COLLECTION = "BjjEireCompetitionRegistration";
    static final String CONFIRMED = "CONFIRMED";

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

    @Override
    public List<ResultEntrant> confirmed(String competitionId) {
        Query query = Query.query(
                Criteria.where("competitionId").is(competitionId).and("status").is(CONFIRMED));
        return read(query).stream()
                .sorted(Comparator.comparing(
                        entrant -> entrant.displayName() == null ? "" : entrant.displayName(),
                        String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Override
    public List<ResultEntrant> byIds(String competitionId, Collection<String> registrationIds) {
        if (registrationIds.isEmpty()) {
            return List.of();
        }
        // Ids are stored as ObjectIds; a string is matched too, so a hand-written document is not missed.
        List<Object> ids = new ArrayList<>();
        for (String id : registrationIds) {
            ids.add(id);
            if (ObjectId.isValid(id)) {
                ids.add(new ObjectId(id));
            }
        }
        return read(
                Query.query(Criteria.where("_id").in(ids).and("competitionId").is(competitionId)));
    }

    private List<ResultEntrant> read(Query query) {
        query.fields()
                .include("_id", "divisionId", "displayName", "academy", "affiliation", "academyKey", "affiliationKey");
        return mongoTemplate.find(query, Document.class, REGISTRATION_COLLECTION).stream()
                .map(MongoDivisionSignUps::toEntrant)
                .toList();
    }

    private static ResultEntrant toEntrant(Document document) {
        Object id = document.get("_id");
        Object academy = document.get("academy");
        String academyName = academy instanceof Document academyDocument ? academyDocument.getString("name") : null;
        return new ResultEntrant(
                id instanceof ObjectId objectId ? objectId.toHexString() : String.valueOf(id),
                document.getString("divisionId"),
                document.getString("displayName"),
                academyName,
                document.getString("affiliation"),
                document.getString("academyKey"),
                document.getString("affiliationKey"));
    }
}
