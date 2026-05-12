package com.javanc.user.domain.port;

import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmailVerificationOtp;

import java.util.Optional;

public interface EmailVerificationOtpRepository {

    Optional<EmailVerificationOtp> findLatestOpenByEmail(EmailAddress email);

    EmailVerificationOtp save(EmailVerificationOtp otp);

    void consumeOpenOtps(EmailAddress email);
}
