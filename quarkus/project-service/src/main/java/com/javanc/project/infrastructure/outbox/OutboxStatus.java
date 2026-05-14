package com.javanc.project.infrastructure.outbox;

public enum OutboxStatus {
    PENDING,
    PUBLISHED,
    FAILED
}
