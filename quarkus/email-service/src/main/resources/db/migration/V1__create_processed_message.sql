CREATE TABLE IF NOT EXISTS processed_message (
    id BIGINT NOT NULL AUTO_INCREMENT,
    idempotency_key VARCHAR(255) NOT NULL,
    message_type VARCHAR(150) NOT NULL,
    status VARCHAR(32) NOT NULL,
    processed_at TIMESTAMP NULL,
    last_error VARCHAR(1000),
    PRIMARY KEY (id),
    UNIQUE KEY uk_processed_message_idempotency_key (idempotency_key),
    INDEX idx_processed_message_type_status (message_type, status)
);
