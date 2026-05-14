package com.javanc.project.infrastructure.outbox;

import java.time.Instant;
import java.util.List;

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Page;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OutboxEventRepository implements PanacheRepositoryBase<OutboxEventEntity, String> {

    public List<OutboxEventEntity> findReady(Instant now, int limit) {
        return find("status = ?1 and (nextAttemptAt is null or nextAttemptAt <= ?2) order by createdAt",
                OutboxStatus.PENDING, now)
                .page(Page.ofSize(limit))
                .list();
    }
}
