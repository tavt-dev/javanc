package com.javanc.user.adapter.out.security;

import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.port.OtpHasher;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@ApplicationScoped
public class HmacOtpHasher implements OtpHasher {

    private static final String ALGORITHM = "HmacSHA256";

    private final byte[] secret;

    public HmacOtpHasher(@ConfigProperty(name = "otp.hash.secret") String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("otp.hash.secret is required");
        }
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public String hash(EmailAddress email, String otp) {
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(secret, ALGORITHM));
            byte[] digest = mac.doFinal((email.value() + ":" + otp).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash OTP", exception);
        }
    }

    @Override
    public boolean matches(EmailAddress email, String otp, String hash) {
        return MessageDigest.isEqual(hash(email, otp).getBytes(StandardCharsets.UTF_8),
                hash.getBytes(StandardCharsets.UTF_8));
    }
}
