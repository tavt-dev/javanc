package com.javanc.user.application.ratelimit;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;

@ApplicationScoped
public class RateLimitKeyFactory {

    private final byte[] secret;

    public RateLimitKeyFactory(@ConfigProperty(name = "rate-limit.key-secret") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String key(String service, String policy, String identity) {
        return "javanc:rate:" + service + ":" + policy + ":" + hash(identity);
    }

    private String hash(String identity) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(identity.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to build rate-limit key", exception);
        }
    }
}
