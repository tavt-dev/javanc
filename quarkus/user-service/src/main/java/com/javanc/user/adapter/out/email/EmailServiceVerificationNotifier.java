package com.javanc.user.adapter.out.email;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.user.adapter.out.outbox.OutboxEventEntity;
import com.javanc.user.adapter.out.outbox.OutboxEventRepository;
import com.javanc.user.adapter.out.outbox.OutboxMessageKind;
import com.javanc.user.domain.port.EmailVerificationNotifier;
import com.javanc.user.shared.exception.ApplicationException;
import com.javanc.user.shared.exception.ErrorCode;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.MDC;

import java.util.UUID;

@ApplicationScoped
public class EmailServiceVerificationNotifier implements EmailVerificationNotifier {

    private final EmailServiceClient emailServiceClient;
    private final OutboxEventRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final MeterRegistry meterRegistry;
    private final boolean asyncOtpEmailEnabled;
    private final boolean asyncHttpFallbackEnabled;
    private final String emailCommandsTopic;

    @Inject
    public EmailServiceVerificationNotifier(@RestClient EmailServiceClient emailServiceClient,
            OutboxEventRepository outboxRepository, ObjectMapper objectMapper, MeterRegistry meterRegistry,
            @ConfigProperty(name = "async.otp-email.enabled", defaultValue = "false") boolean asyncOtpEmailEnabled,
            @ConfigProperty(name = "async.http-fallback.enabled", defaultValue = "true") boolean asyncHttpFallbackEnabled,
            @ConfigProperty(name = "mp.messaging.outgoing.email-commands-out.topic", defaultValue = "javanc.email.commands") String emailCommandsTopic) {
        this.emailServiceClient = emailServiceClient;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        this.meterRegistry = meterRegistry;
        this.asyncOtpEmailEnabled = asyncOtpEmailEnabled;
        this.asyncHttpFallbackEnabled = asyncHttpFallbackEnabled;
        this.emailCommandsTopic = emailCommandsTopic;
    }

    @Override
    public void sendOtp(String email, String name, String otp, long expiresInMinutes) {
        sendOtpForUser(null, email, name, otp, expiresInMinutes);
    }

    @Override
    public void sendOtpForUser(Integer userId, String email, String name, String otp, long expiresInMinutes) {
        if (asyncOtpEmailEnabled) {
            writeOutbox(userId, email, name, otp, expiresInMinutes);
            if (!asyncHttpFallbackEnabled) {
                return;
            }
        }
        try {
            emailServiceClient.sendVerificationOtp(new VerificationOtpEmailRequest(email, name, otp, expiresInMinutes));
            record("otp-email", asyncOtpEmailEnabled ? "dual-http" : "http", "success");
        } catch (RuntimeException exception) {
            record("otp-email", asyncOtpEmailEnabled ? "dual-http" : "http", "failure");
            throw new ApplicationException(ErrorCode.EMAIL_DELIVERY_FAILED, "Unable to send verification email",
                    exception);
        }
    }

    private void writeOutbox(Integer userId, String email, String name, String otp, long expiresInMinutes) {
        try {
            SendVerificationOtpEmailPayload payload = new SendVerificationOtpEmailPayload(email, name, otp,
                    expiresInMinutes);
            String payloadJson = objectMapper.writeValueAsString(payload);
            String aggregateId = userId == null ? email : userId.toString();
            String idempotencyKey = "otp-email:" + email + ":" + UUID.randomUUID();
            outboxRepository.persist(OutboxEventEntity.pending(OutboxMessageKind.COMMAND, "SendVerificationOtpEmail",
                    emailCommandsTopic, "User", aggregateId, correlationId(), idempotencyKey, payloadJson));
            record("otp-email", "outbox", "success");
        } catch (JsonProcessingException exception) {
            record("otp-email", "outbox", "failure");
            throw new ApplicationException(ErrorCode.EMAIL_DELIVERY_FAILED, "Unable to create verification email command",
                    exception);
        }
    }

    private void record(String useCase, String path, String outcome) {
        Counter.builder("javanc_async_side_effect_total")
                .tag("service", "user-service")
                .tag("useCase", useCase)
                .tag("path", path)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private String correlationId() {
        Object requestId = MDC.get("requestId");
        if (requestId instanceof String value && !value.isBlank()) {
            return value;
        }
        return UUID.randomUUID().toString();
    }

    private record SendVerificationOtpEmailPayload(String to, String name, String otp, long expiresInMinutes) {
    }
}
