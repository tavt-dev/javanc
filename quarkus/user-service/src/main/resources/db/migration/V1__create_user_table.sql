CREATE TABLE IF NOT EXISTS `user` (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    id_employee VARCHAR(255) NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role VARCHAR(32) NOT NULL,
    version BIGINT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_user_email UNIQUE (email),
    CONSTRAINT uk_user_id_employee UNIQUE (id_employee)
);
