package com.javanc.email.infrastructure.messaging;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "processed_message", uniqueConstraints = {
        @UniqueConstraint(name = "uk_processed_message_idempotency_key", columnNames = "idempotency_key")
})
public class ProcessedMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "idempotency_key", nullable = false)
    public String idempotencyKey;

    @Column(name = "message_type", nullable = false, length = 150)
    public String messageType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    public ProcessedMessageStatus status;

    @Column(name = "processed_at")
    public Instant processedAt;

    @Column(name = "last_error", length = 1000)
    public String lastError;
}
