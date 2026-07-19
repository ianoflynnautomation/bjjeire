package com.bjjeire.api.event;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface BjjEventRepository extends MongoRepository<BjjEvent, String> {}
