package com.bjjeire.api.event;

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
public class BjjEventDeactivator implements Deactivator {
    private final MongoTemplate mongoTemplate;
    private final AuditRecorder auditRecorder;
    private final AuditInfoProvider auditInfoProvider;
    private final ApiCache cache;

    @Override
    public String entityName() {
        return "BjjEvent";
    }

    @Override
    public long deactivateExpired(Instant nowUtc) {
        Query expired = new Query(new Criteria()
                .andOperator(
                        Criteria.where("isActive").is(true),
                        Criteria.where("schedule.endDate").ne(null),
                        Criteria.where("schedule.endDate").lt(nowUtc)));
        Update update = Update.update("isActive", false)
                .set("updatedAt", nowUtc)
                .set("updatedBy", auditInfoProvider.currentUser());

        long modified =
                mongoTemplate.updateMulti(expired, update, BjjEvent.class).getModifiedCount();
        auditRecorder.record(AuditAction.UpdateMany, entityName(), null, modified);
        if (modified > 0) {
            cache.removeByTag(ApiCache.BJJ_EVENTS_TAG);
        }
        return modified;
    }
}
