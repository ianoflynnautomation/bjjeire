package com.bjjeire.api.competition;

import com.bjjeire.api.audit.AuditAction;
import com.bjjeire.api.audit.AuditInfoProvider;
import com.bjjeire.api.audit.AuditRecorder;
import com.bjjeire.api.common.ApiCache;
import com.bjjeire.api.deactivation.Deactivator;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CompetitionDeactivator implements Deactivator {
    private final MongoTemplate mongoTemplate;
    private final AuditRecorder auditRecorder;
    private final AuditInfoProvider auditInfoProvider;
    private final ApiCache cache;

    @Override
    public String entityName() {
        return "Competition";
    }

    @Override
    public long deactivateExpired(Instant nowUtc) {
        Query expired = new Query(new Criteria()
                .andOperator(
                        Criteria.where("isActive").is(true),
                        Criteria.where("endDate").ne(null),
                        Criteria.where("endDate").lt(nowUtc)));
        Update update = Update.update("isActive", false)
                .set("updatedAt", nowUtc)
                .set("updatedBy", auditInfoProvider.currentUser());

        long modified =
                mongoTemplate.updateMulti(expired, update, Competition.class).getModifiedCount();
        auditRecorder.record(AuditAction.UpdateMany, entityName(), null, modified);
        if (modified > 0) {
            cache.removeByTag(ApiCache.COMPETITIONS_TAG);
        }
        return modified;
    }
}
