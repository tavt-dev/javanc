package com.javanc.user.domain.port;

import com.javanc.user.domain.model.EmailAddress;

public interface OtpHasher {

    String hash(EmailAddress email, String otp);

    boolean matches(EmailAddress email, String otp, String hash);
}
