package com.javanc.user.adapter.out.security;

import com.javanc.user.domain.port.OtpGenerator;
import jakarta.enterprise.context.ApplicationScoped;

import java.security.SecureRandom;

@ApplicationScoped
public class SecureNumericOtpGenerator implements OtpGenerator {

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public String generate(int length) {
        int normalizedLength = Math.max(4, length);
        StringBuilder builder = new StringBuilder(normalizedLength);
        for (int index = 0; index < normalizedLength; index++) {
            builder.append(secureRandom.nextInt(10));
        }
        return builder.toString();
    }
}
