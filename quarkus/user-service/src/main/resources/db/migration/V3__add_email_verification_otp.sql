CREATE TABLE IF NOT EXISTS user_email_verification_otp (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    consumed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL,
    last_sent_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_user_email_verification_otp_user_id (user_id),
    INDEX idx_user_email_verification_otp_email (email),
    INDEX idx_user_email_verification_otp_expires_at (expires_at),
    CONSTRAINT fk_user_email_verification_otp_user FOREIGN KEY (user_id) REFERENCES `user` (id)
);
