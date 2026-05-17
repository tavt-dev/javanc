package com.javanc.user.application.service;

import com.javanc.user.adapter.out.ratelimit.RedisTokenBucketLimiter;
import com.javanc.user.application.ratelimit.RateLimitDecision;
import com.javanc.user.application.ratelimit.RateLimitExceededException;
import com.javanc.user.application.ratelimit.RateLimitPolicy;
import com.javanc.user.application.ratelimit.RateLimitResponseContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.Locale;
import java.util.stream.Stream;

@ApplicationScoped
public class AuthRateLimitService {

    private final RedisTokenBucketLimiter limiter;
    private final RateLimitResponseContext responseContext;
    private final RateLimitPolicy loginIp;
    private final RateLimitPolicy loginEmail;
    private final RateLimitPolicy googleIp;
    private final RateLimitPolicy registerIp;
    private final RateLimitPolicy verifyIp;
    private final RateLimitPolicy verifyEmail;
    private final RateLimitPolicy resendIp;
    private final RateLimitPolicy resendEmail;

    @Inject
    public AuthRateLimitService(RedisTokenBucketLimiter limiter, RateLimitResponseContext responseContext,
            @ConfigProperty(name = "auth.rate-limit.login.ip-capacity") long loginIpCapacity,
            @ConfigProperty(name = "auth.rate-limit.login.email-capacity") long loginEmailCapacity,
            @ConfigProperty(name = "auth.rate-limit.google.ip-capacity") long googleIpCapacity,
            @ConfigProperty(name = "auth.rate-limit.register.ip-capacity") long registerIpCapacity,
            @ConfigProperty(name = "auth.rate-limit.verify.ip-capacity") long verifyIpCapacity,
            @ConfigProperty(name = "auth.rate-limit.verify.email-capacity") long verifyEmailCapacity,
            @ConfigProperty(name = "auth.rate-limit.resend.ip-capacity") long resendIpCapacity,
            @ConfigProperty(name = "auth.rate-limit.resend.email-capacity") long resendEmailCapacity) {
        this.limiter = limiter;
        this.responseContext = responseContext;
        this.loginIp = new RateLimitPolicy("auth-login-ip", loginIpCapacity, Duration.ofMinutes(1));
        this.loginEmail = new RateLimitPolicy("auth-login-email", loginEmailCapacity, Duration.ofMinutes(15));
        this.googleIp = new RateLimitPolicy("auth-google-ip", googleIpCapacity, Duration.ofMinutes(1));
        this.registerIp = new RateLimitPolicy("auth-register-ip", registerIpCapacity, Duration.ofHours(1));
        this.verifyIp = new RateLimitPolicy("auth-verify-email-ip", verifyIpCapacity, Duration.ofMinutes(10));
        this.verifyEmail = new RateLimitPolicy("auth-verify-email-email", verifyEmailCapacity, Duration.ofMinutes(10));
        this.resendIp = new RateLimitPolicy("auth-resend-otp-ip", resendIpCapacity, Duration.ofHours(1));
        this.resendEmail = new RateLimitPolicy("auth-resend-otp-email", resendEmailCapacity, Duration.ofMinutes(10));
    }

    public void beforeRegister(String clientIp) {
        evaluate(rate(registerIp, clientIp, "ip"));
    }

    public void beforeLogin(String clientIp, String email) {
        evaluate(rate(loginIp, clientIp, "ip"), emailDecision(loginEmail, email));
    }

    public void beforeGoogleLogin(String clientIp) {
        evaluate(rate(googleIp, clientIp, "ip"));
    }

    public void beforeVerifyEmail(String clientIp, String email) {
        evaluate(rate(verifyIp, clientIp, "ip"), emailDecision(verifyEmail, email));
    }

    public void beforeResendVerificationOtp(String clientIp, String email) {
        evaluate(rate(resendIp, clientIp, "ip"), emailDecision(resendEmail, email));
    }

    private RateLimitDecision rate(RateLimitPolicy policy, String identity, String identityType) {
        return limiter.evaluate("user-service", policy, identity == null || identity.isBlank() ? "unknown" : identity,
                identityType);
    }

    private RateLimitDecision emailDecision(RateLimitPolicy policy, String email) {
        String normalized = normalizeEmail(email);
        return normalized == null ? null : rate(policy, normalized, "email");
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void evaluate(RateLimitDecision... decisions) {
        Stream.of(decisions)
                .filter(java.util.Objects::nonNull)
                .forEach(responseContext::consider);
        Stream.of(decisions)
                .filter(java.util.Objects::nonNull)
                .filter(RateLimitDecision::enforcedBlock)
                .min((left, right) -> Long.compare(left.remaining(), right.remaining()))
                .ifPresent(decision -> {
                    throw new RateLimitExceededException(decision);
                });
    }
}
