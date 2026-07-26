package com.bjjeire.api.deactivation;

import com.mongodb.DuplicateKeyException;
import com.mongodb.MongoCommandException;
import com.mongodb.MongoWriteException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

/**
 * Mongo-backed lease lock. Acquire = upsert a doc keyed by lockName whose leaseUntil is either expired or matches the
 * same holder. If a foreign active lease exists, the upsert collides on _id and acquisition fails.
 */
@Component
public class MongoLeaderElection {
    static final String COLLECTION_NAME = "DeactivationLocks";
    private static final int DUPLICATE_KEY_CODE = 11000;

    private final MongoTemplate mongoTemplate;
    private final Clock clock;
    private final String identity;

    @Autowired
    public MongoLeaderElection(MongoTemplate mongoTemplate, Clock clock) {
        this(mongoTemplate, clock, null);
    }

    MongoLeaderElection(MongoTemplate mongoTemplate, Clock clock, String identity) {
        this.mongoTemplate = mongoTemplate;
        this.clock = clock;
        this.identity = identity != null ? identity : resolveIdentity();
    }

    public boolean tryAcquire(String lockName, Duration leaseDuration) {
        if (lockName == null || lockName.isBlank()) {
            throw new IllegalArgumentException("lockName must not be blank.");
        }
        if (leaseDuration == null || leaseDuration.isZero() || leaseDuration.isNegative()) {
            throw new IllegalArgumentException("Lease duration must be positive.");
        }

        Instant now = clock.instant();
        Query query = new Query(new Criteria()
                .andOperator(
                        Criteria.where("_id").is(lockName),
                        new Criteria()
                                .orOperator(
                                        Criteria.where("leaseUntil").lt(now),
                                        Criteria.where("holder").is(identity))));
        Update update = new Update()
                .setOnInsert("_id", lockName)
                .set("holder", identity)
                .set("leaseUntil", now.plus(leaseDuration));

        try {
            DeactivationLock result = mongoTemplate.findAndModify(
                    query, update, FindAndModifyOptions.options().upsert(true).returnNew(true), DeactivationLock.class);
            return result != null && identity.equals(result.getHolder());
        } catch (DuplicateKeyException | org.springframework.dao.DuplicateKeyException exception) {
            // Another holder has an active lease — upsert collided on _id.
            return false;
        } catch (MongoWriteException exception) {
            if (exception.getError().getCode() == DUPLICATE_KEY_CODE) {
                return false;
            }
            throw exception;
        } catch (MongoCommandException exception) {
            if (exception.getErrorCode() == DUPLICATE_KEY_CODE) {
                return false;
            }
            throw exception;
        }
    }

    private static String resolveIdentity() {
        String hostname = System.getenv("HOSTNAME");
        if (hostname != null && !hostname.isBlank()) {
            return hostname;
        }
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException exception) {
            return "unknown-host";
        }
    }
}
