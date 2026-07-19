package com.bjjeire.api.gym;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface GymRepository extends MongoRepository<Gym, String> {}
