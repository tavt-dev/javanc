ALTER TABLE `user`
    MODIFY password VARCHAR(255) NULL,
    ADD COLUMN avatar_url VARCHAR(1024) NULL,
    ADD COLUMN email_verified BOOLEAN NULL,
    ADD COLUMN last_login_at TIMESTAMP NULL,
    ADD COLUMN created_at TIMESTAMP NULL,
    ADD COLUMN updated_at TIMESTAMP NULL;

UPDATE `user`
SET email_verified = CASE WHEN status = 'PENDING_VERIFICATION' THEN FALSE ELSE TRUE END
WHERE email_verified IS NULL;

UPDATE `user`
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE created_at IS NULL OR updated_at IS NULL;

ALTER TABLE `user`
    MODIFY email_verified BOOLEAN NOT NULL,
    MODIFY created_at TIMESTAMP NOT NULL,
    MODIFY updated_at TIMESTAMP NOT NULL;

CREATE TABLE IF NOT EXISTS user_auth_identity (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    provider VARCHAR(32) NOT NULL,
    provider_subject VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_auth_identity_user_provider UNIQUE (user_id, provider),
    CONSTRAINT uk_user_auth_identity_provider_subject UNIQUE (provider, provider_subject),
    CONSTRAINT fk_user_auth_identity_user FOREIGN KEY (user_id) REFERENCES `user` (id)
);

INSERT INTO user_auth_identity (user_id, provider, provider_subject, created_at, updated_at)
SELECT id, 'LOCAL', NULL, created_at, updated_at
FROM `user`
WHERE NOT EXISTS (
    SELECT 1
    FROM user_auth_identity existing_identity
    WHERE existing_identity.user_id = `user`.id
      AND existing_identity.provider = 'LOCAL'
);
