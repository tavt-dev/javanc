package com.javanc.user.adapter.out.security;

import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.port.PasswordHasher;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class BcryptPasswordHasher implements PasswordHasher {

    @Override
    public PasswordHash hash(String rawPassword) {
        return new PasswordHash(BcryptUtil.bcryptHash(rawPassword));
    }

    @Override
    public boolean matches(String rawPassword, PasswordHash passwordHash) {
        if (rawPassword == null || passwordHash == null || passwordHash.value() == null
                || passwordHash.value().isBlank()) {
            return false;
        }
        return BcryptUtil.matches(rawPassword, passwordHash.value());
    }
}
