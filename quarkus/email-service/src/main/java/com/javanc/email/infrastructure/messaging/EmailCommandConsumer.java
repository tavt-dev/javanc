package com.javanc.email.infrastructure.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.email.application.dto.MailDTO;
import com.javanc.email.application.dto.MessageDTO;
import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import com.javanc.email.application.port.EmailCommandIdempotencyPort;
import com.javanc.email.application.service.EmailApplicationService;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.reactive.messaging.Incoming;
import org.eclipse.microprofile.reactive.messaging.Message;
import org.jboss.logging.Logger;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

@ApplicationScoped
public class EmailCommandConsumer {

    private static final Logger LOG = Logger.getLogger(EmailCommandConsumer.class);

    private final EmailApplicationService emailApplicationService;
    private final EmailCommandIdempotencyPort idempotencyPort;
    private final ObjectMapper objectMapper;

    public EmailCommandConsumer(EmailApplicationService emailApplicationService,
            EmailCommandIdempotencyPort idempotencyPort,
            ObjectMapper objectMapper) {
        this.emailApplicationService = emailApplicationService;
        this.idempotencyPort = idempotencyPort;
        this.objectMapper = objectMapper;
    }

    @Incoming("email-commands")
    public CompletionStage<Void> consume(Message<String> message) {
        try {
            process(message.getPayload());
            return message.ack();
        } catch (Exception ex) {
            return message.nack(ex);
        }
    }

    void process(String payload) {
        EmailCommand command = readCommand(payload);
        String commandId = required(command.getCommandId(), "commandId");
        if (!idempotencyPort.claim(commandId)) {
            LOG.infof("Skipping duplicate email command commandId=%s correlationId=%s", commandId,
                    command.getCorrelationId());
            return;
        }
        try {
            send(command);
            idempotencyPort.complete(commandId);
            LOG.infof("Processed email command commandId=%s correlationId=%s", commandId,
                    command.getCorrelationId());
        } catch (RuntimeException ex) {
            idempotencyPort.release(commandId);
            throw ex;
        }
    }

    private EmailCommand readCommand(String payload) {
        try {
            return objectMapper.readValue(required(payload, "payload"), EmailCommand.class);
        } catch (ApplicationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
    }

    private void send(EmailCommand command) {
        if (command.getRecipientUserId() != null) {
            String message = firstNonBlank(command.getBody(), command.getSubject());
            emailApplicationService.send(new MessageDTO(required(message, "body"), command.getRecipientUserId()));
            return;
        }
        emailApplicationService.sendDirect(new MailDTO(required(command.getTo(), "to"),
                required(command.getSubject(), "subject"), required(command.getBody(), "body")));
    }

    private static String firstNonBlank(String first, String second) {
        return !value(first).isBlank() ? first : second;
    }

    private static String required(String value, String field) {
        if (value(value).isBlank()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return value.trim();
    }

    private static String value(String value) {
        return value == null ? "" : value.trim();
    }
}
