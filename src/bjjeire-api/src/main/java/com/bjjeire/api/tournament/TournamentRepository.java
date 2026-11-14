package com.bjjeire.api.tournament;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface TournamentRepository extends MongoRepository<Tournament, String> {}
