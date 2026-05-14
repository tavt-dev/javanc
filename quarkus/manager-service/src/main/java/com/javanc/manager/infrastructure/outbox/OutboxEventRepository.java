package com.javanc.manager.infrastructure.outbox;

import java.time.Instant;
import java.util.List;

import org.eclipse.microprofile.config.inject.ConfigProperty;

import com.mongodb.client.model.Indexes;

import io.quarkus.mongodb.panache.PanacheMongoRepositoryBase;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OutboxEventRepository implements PanacheMongoRepositoryBase<OutboxEventDocument, String> {

    private final boolean ensureIndexes;

    public OutboxEventRepository(
            @ConfigProperty(name = "outbox.mongo.ensure-indexes", defaultValue = "false") boolean ensureIndexes) {
        this.ensureIndexes = ensureIndexes;
    }

    public List<OutboxEventDocument> findReady(Instant now, int limit) {
        return find("status = ?1 and (nextAttemptAt is null or nextAttemptAt <= ?2)",
                OutboxStatus.PENDING, now)
                .page(Page.ofSize(limit))
                .list();
    }

    public void ensureIndexesIfEnabled() {
        if (ensureIndexes) {
            mongoCollection().createIndex(Indexes.ascending("status", "nextAttemptAt", "createdAt"));
            mongoCollection().createIndex(Indexes.ascending("messageType"));
        }
    }
}
