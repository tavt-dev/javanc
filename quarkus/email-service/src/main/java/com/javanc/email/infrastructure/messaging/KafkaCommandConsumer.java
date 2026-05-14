package com.javanc.email.infrastructure.messaging;

import java.time.Instant;
import java.util.Objects;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.reactive.messaging.Channel;
import org.eclipse.microprofile.reactive.messaging.Emitter;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.jboss.logging.Logger;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.email.application.dto.UserMessageEmailDTO;
import com.javanc.email.application.dto.VerificationOtpEmailDTO;
import com.javanc.email.application.service.EmailApplicationService;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;

@ApplicationScoped
public class KafkaCommandConsumer {

    private static final Logger LOG = Logger.getLogger(KafkaCommandConsumer.class);
    private static final String SERVICE_NAME = "email-service";
    private static final String SEND_VERIFICATION_OTP_EMAIL = "SendVerificationOtpEmail";
    private static final String SEND_USER_MESSAGE_EMAIL = "SendUserMessageEmail";

    @Inject
    ObjectMapper objectMapper;

    @Inject
    MeterRegistry meterRegistry;

    @Inject
    IdempotentCommandProcessor idempotentCommandProcessor;

    @Inject
    EmailApplicationService emailApplicationService;

    @Inject
    @Channel("email-commands-dlq-out")
    Instance<Emitter<String>> dlqEmitter;

    @ConfigProperty(name = "mp.messaging.incoming.email-commands-in.topic", defaultValue = "javanc.email.commands")
    String topic;

    @ConfigProperty(name = "mp.messaging.outgoing.email-commands-dlq-out.topic", defaultValue = "javanc.email.commands.dlq")
    String dlqTopic;

    @ConfigProperty(name = "kafka.consumer.side-effects.enabled", defaultValue = "false")
    boolean sideEffectsEnabled;

    @ConfigProperty(name = "kafka.dlq.enabled", defaultValue = "false")
    boolean dlqEnabled;

    @Incoming("email-commands-in")
    public void consume(String rawMessage) {
        CommandEnvelope<?> envelope = null;
        try {
            envelope = objectMapper.readValue(rawMessage, CommandEnvelope.class);
            CommandEnvelope<?> current = envelope;
            idempotentCommandProcessor.process(current, () -> handleValidatedCommand(current));
            record("success");
            LOG.infof("Kafka consume topic=%s service=%s commandType=%s commandId=%s correlationId=%s idempotencyKey=%s outcome=success",
                    topic, SERVICE_NAME, current.commandType(), current.commandId(), current.correlationId(),
                    current.idempotencyKey());
        } catch (Exception exception) {
            record("failure");
            publishDlq(envelope, exception);
            LOG.warnf(exception, "Kafka consume topic=%s service=%s commandType=%s commandId=%s correlationId=%s idempotencyKey=%s outcome=failure",
                    topic, SERVICE_NAME, value(envelope == null ? null : envelope.commandType()),
                    value(envelope == null ? null : envelope.commandId()),
                    value(envelope == null ? null : envelope.correlationId()),
                    value(envelope == null ? null : envelope.idempotencyKey()));
        }
    }

    private void handleValidatedCommand(CommandEnvelope<?> envelope) {
        if (!SEND_VERIFICATION_OTP_EMAIL.equals(envelope.commandType())
                && !SEND_USER_MESSAGE_EMAIL.equals(envelope.commandType())) {
            throw new IllegalArgumentException("Unsupported email command type: " + envelope.commandType());
        }
        if (!sideEffectsEnabled) {
            return;
        }
        if (SEND_VERIFICATION_OTP_EMAIL.equals(envelope.commandType())) {
            VerificationOtpEmailDTO request = objectMapper.convertValue(envelope.payload(),
                    VerificationOtpEmailDTO.class);
            try {
                emailApplicationService.sendVerificationOtp(request);
                recordSideEffect("otp-email", "kafka", "success");
            } catch (RuntimeException exception) {
                recordSideEffect("otp-email", "kafka", "failure");
                throw exception;
            }
            return;
        }
        UserMessageEmailDTO request = objectMapper.convertValue(envelope.payload(), UserMessageEmailDTO.class);
        try {
            emailApplicationService.sendUserMessage(request);
            recordSideEffect("job-email", "kafka", "success");
        } catch (RuntimeException exception) {
            recordSideEffect("job-email", "kafka", "failure");
            throw exception;
        }
    }

    private void publishDlq(CommandEnvelope<?> envelope, Exception exception) {
        if (!dlqEnabled) {
            return;
        }
        try {
            DlqMessage dlqMessage = new DlqMessage(Instant.now(), SERVICE_NAME, topic,
                    envelope == null ? "unknown" : value(envelope.commandType()),
                    envelope == null ? "unknown" : value(envelope.commandId()),
                    envelope == null ? "unknown" : value(envelope.correlationId()),
                    envelope == null ? "unknown" : value(envelope.idempotencyKey()),
                    errorType(exception), sanitize(exception.getMessage()));
            if (dlqEmitter.isResolvable()) {
                dlqEmitter.get().send(objectMapper.writeValueAsString(dlqMessage));
                recordDlq(dlqMessage.commandType(), "success");
            } else {
                recordDlq(dlqMessage.commandType(), "failure");
            }
        } catch (Exception dlqException) {
            recordDlq(envelope == null ? "unknown" : value(envelope.commandType()), "failure");
            LOG.warnf(dlqException, "Unable to publish email command DLQ metadata to topic=%s", dlqTopic);
        }
    }

    private void record(String outcome) {
        Counter.builder("javanc_kafka_consume_total")
                .tag("service", SERVICE_NAME)
                .tag("topic", topic)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private void recordSideEffect(String useCase, String path, String outcome) {
        Counter.builder("javanc_async_side_effect_total")
                .tag("service", SERVICE_NAME)
                .tag("useCase", useCase)
                .tag("path", path)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private void recordDlq(String commandType, String outcome) {
        Counter.builder("javanc_kafka_dlq_total")
                .tag("service", SERVICE_NAME)
                .tag("topic", dlqTopic)
                .tag("commandType", commandType)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private static String errorType(Exception exception) {
        if (exception instanceof IllegalArgumentException
                && exception.getMessage() != null
                && exception.getMessage().startsWith("Unsupported")) {
            return "UnsupportedCommand";
        }
        if (exception instanceof IllegalArgumentException) {
            return "Validation";
        }
        return "Handler";
    }

    private static String sanitize(String message) {
        if (message == null || message.isBlank()) {
            return "Command processing failed";
        }
        String sanitized = message.replaceAll("(?i)(otp|password|token|secret)=\\S+", "$1=<redacted>");
        return sanitized.length() > 300 ? sanitized.substring(0, 300) : sanitized;
    }

    private static String value(String value) {
        return value == null || value.isBlank() ? "unknown" : value;
    }

    public record CommandEnvelope<T>(String commandId, String commandType, Instant requestedAt, String sourceService,
            String correlationId, String idempotencyKey, int payloadVersion, T payload) {

        public CommandEnvelope {
            require(commandId, "commandId");
            require(commandType, "commandType");
            require(sourceService, "sourceService");
            require(correlationId, "correlationId");
            require(idempotencyKey, "idempotencyKey");
            Objects.requireNonNull(requestedAt, "requestedAt");
            Objects.requireNonNull(payload, "payload");
            if (payloadVersion < 1) {
                throw new IllegalArgumentException("payloadVersion must be positive");
            }
        }
    }

    private record DlqMessage(Instant failedAt, String serviceName, String topic, String commandType, String commandId,
            String correlationId, String idempotencyKey, String errorType, String errorMessage) {
    }

    private static void require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " is required");
        }
    }
}
