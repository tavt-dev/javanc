package com.javanc.manager.infrastructure.outbox;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletionException;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import com.javanc.manager.infrastructure.messaging.KafkaFoundationPublisher;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.scheduler.Scheduled;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class OutboxPublisherWorker {

    private static final Logger LOG = Logger.getLogger(OutboxPublisherWorker.class);
    private static final String SERVICE_NAME = "manager-service";
    private static final List<Duration> BACKOFF = List.of(
            Duration.ofSeconds(30),
            Duration.ofMinutes(2),
            Duration.ofMinutes(10),
            Duration.ofMinutes(30),
            Duration.ofHours(2));

    private final OutboxEventRepository repository;
    private final KafkaFoundationPublisher publisher;
    private final MeterRegistry meterRegistry;
    private final boolean outboxEnabled;
    private final boolean messagingEnabled;
    private final int batchSize;
    private final int maxAttempts;

    public OutboxPublisherWorker(OutboxEventRepository repository, KafkaFoundationPublisher publisher,
            MeterRegistry meterRegistry,
            @ConfigProperty(name = "outbox.publisher.enabled", defaultValue = "false") boolean outboxEnabled,
            @ConfigProperty(name = "messaging.enabled", defaultValue = "false") boolean messagingEnabled,
            @ConfigProperty(name = "outbox.batch-size", defaultValue = "25") int batchSize,
            @ConfigProperty(name = "outbox.max-attempts", defaultValue = "5") int maxAttempts) {
        this.repository = repository;
        this.publisher = publisher;
        this.meterRegistry = meterRegistry;
        this.outboxEnabled = outboxEnabled;
        this.messagingEnabled = messagingEnabled;
        this.batchSize = batchSize;
        this.maxAttempts = maxAttempts;
    }

    @PostConstruct
    void init() {
        repository.ensureIndexesIfEnabled();
    }

    @Scheduled(every = "{outbox.poll.interval}", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void poll() {
        if (!outboxEnabled || !messagingEnabled) {
            return;
        }
        for (OutboxEventDocument record : repository.findReady(Instant.now(), batchSize)) {
            publish(record);
            repository.update(record);
        }
    }

    public void publish(OutboxEventDocument record) {
        try {
            publisher.publishOutboxMessage(record.id, record.messageKind.name(), record.messageType, record.topic,
                    record.aggregateType, record.aggregateId, record.correlationId, record.idempotencyKey,
                    record.payloadVersion, record.payloadJson)
                    .toCompletableFuture()
                    .join();
            record.status = OutboxStatus.PUBLISHED;
            record.publishedAt = Instant.now();
            record.lastError = null;
            recordMetric(record, "published");
            publishMetric(record, "success");
        } catch (CompletionException exception) {
            markFailure(record, exception.getCause() == null ? exception : exception.getCause());
        } catch (Exception exception) {
            markFailure(record, exception);
        }
    }

    private void markFailure(OutboxEventDocument record, Throwable failure) {
        record.attemptCount++;
        record.lastError = truncate(failure.getMessage());
        if (record.attemptCount >= maxAttempts) {
            record.status = OutboxStatus.FAILED;
            record.nextAttemptAt = null;
            recordMetric(record, "failed");
            publishMetric(record, "failed");
            LOG.warnf("Outbox publish failed permanently service=%s topic=%s messageType=%s id=%s",
                    SERVICE_NAME, record.topic, record.messageType, record.id);
            return;
        }
        record.status = OutboxStatus.PENDING;
        record.nextAttemptAt = Instant.now().plus(BACKOFF.get(Math.min(record.attemptCount - 1, BACKOFF.size() - 1)));
        recordMetric(record, "pending");
        publishMetric(record, "failure");
    }

    private void recordMetric(OutboxEventDocument record, String status) {
        Counter.builder("javanc_outbox_records_total")
                .tag("service", SERVICE_NAME)
                .tag("status", status)
                .tag("messageType", record.messageType)
                .register(meterRegistry)
                .increment();
    }

    private void publishMetric(OutboxEventDocument record, String outcome) {
        Counter.builder("javanc_outbox_publish_attempt_total")
                .tag("service", SERVICE_NAME)
                .tag("topic", record.topic)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private static String truncate(String message) {
        if (message == null) {
            return null;
        }
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }
}
