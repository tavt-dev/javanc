package com.javanc.manager.infrastructure.outbox;

public enum OutboxStatus {
    PENDING,
    PUBLISHED,
    FAILED
}
