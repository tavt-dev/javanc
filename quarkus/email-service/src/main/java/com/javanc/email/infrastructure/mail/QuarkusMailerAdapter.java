package com.javanc.email.infrastructure.mail;

import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import com.javanc.email.application.port.MailSenderPort;
import com.javanc.email.domain.model.MailMessage;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.quarkus.mailer.Mail;
import io.quarkus.mailer.Mailer;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class QuarkusMailerAdapter implements MailSenderPort {

    private static final Logger LOG = Logger.getLogger(QuarkusMailerAdapter.class);

    private final Mailer mailer;
    private final MeterRegistry meterRegistry;
    private final String configuredFrom;

    @Inject
    public QuarkusMailerAdapter(Mailer mailer, MeterRegistry meterRegistry,
            @ConfigProperty(name = "quarkus.mailer.from") String configuredFrom) {
        this.mailer = mailer;
        this.meterRegistry = meterRegistry;
        this.configuredFrom = configuredFrom;
    }

    @Override
    public void send(MailMessage mailMessage) {
        try {
            LOG.infof("Sending email to user address for recipient: %s", mailMessage.getMailTo());
            Mail mail = html(mailMessage)
                    ? Mail.withHtml(mailMessage.getMailTo(), mailMessage.getMailSubject(), mailMessage.getMailContent())
                    : Mail.withText(mailMessage.getMailTo(), mailMessage.getMailSubject(), mailMessage.getMailContent());
            String from = firstNonBlank(mailMessage.getMailFrom(), configuredFrom);
            if (from != null) {
                mail.setFrom(from);
            }
            mailer.send(mail);
            incrementMailMetric("success");
        } catch (RuntimeException exception) {
            incrementMailMetric("failure");
            throw new ApplicationException(ErrorCode.MAIL_SEND_FAILED, exception);
        }
    }

    private void incrementMailMetric(String outcome) {
        Counter.builder("javanc_email_send_total")
                .tag("service", "email-service")
                .tag("outcome", outcome)
                .register(meterRegistry)
                .increment();
    }

    private boolean html(MailMessage mailMessage) {
        return "text/html".equalsIgnoreCase(mailMessage.getContentType());
    }

    private String firstNonBlank(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred;
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return null;
    }
}
