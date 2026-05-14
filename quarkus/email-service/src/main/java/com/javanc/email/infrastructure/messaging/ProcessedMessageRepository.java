package com.javanc.email.infrastructure.messaging;

import java.util.Optional;

import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ProcessedMessageRepository implements PanacheRepository<ProcessedMessageEntity> {

    public Optional<ProcessedMessageEntity> findByIdempotencyKey(String idempotencyKey) {
        return find("idempotencyKey", idempotencyKey).firstResultOptional();
    }
}
