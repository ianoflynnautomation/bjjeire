package com.bjjeire.api.deactivation;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(MongoLeaderElection.COLLECTION_NAME)
public class DeactivationLock {
    @Id
    private String id;

    @Field("holder")
    private String holder;

    @Field("leaseUntil")
    private Instant leaseUntil;
}
