package com.javanc.email.application.service;

import com.javanc.email.application.dto.MailDTO;
import com.javanc.email.application.dto.MessageDTO;
import com.javanc.email.application.dto.UserMessageEmailDTO;
import com.javanc.email.application.dto.VerificationOtpEmailDTO;
import com.javanc.email.application.exception.ApplicationException;
import com.javanc.email.application.exception.ErrorCode;
import com.javanc.email.application.port.MailSenderPort;
import com.javanc.email.application.port.UserLookupPort;
import com.javanc.email.domain.model.MailMessage;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class EmailApplicationService {

    private static final String TEXT_PLAIN = "text/plain";
    private static final String TEXT_HTML = "text/html";

    private final UserLookupPort userLookupPort;
    private final MailSenderPort mailSenderPort;

    @Inject
    public EmailApplicationService(UserLookupPort userLookupPort, MailSenderPort mailSenderPort) {
        this.userLookupPort = userLookupPort;
        this.mailSenderPort = mailSenderPort;
    }

    public void send(MessageDTO messageDTO) {
        if (messageDTO == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        String mailTo = userLookupPort.findEmailByUserId(messageDTO.getId());
        MailDTO mailDTO = new MailDTO(mailTo, messageDTO.getMessage(), messageDTO.getMessage());
        mailSenderPort.send(toMailMessage(mailDTO));
    }

    public void sendUserMessage(UserMessageEmailDTO request) {
        if (request == null || request.getUserId() == null || blank(request.getMessage())) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        String mailTo = userLookupPort.findEmailByUserId(request.getUserId());
        String subject = blank(request.getSubject()) ? request.getMessage() : request.getSubject().trim();
        String content = request.getMessage().trim();
        mailSenderPort.send(new MailMessage(null, mailTo, subject, content, TEXT_PLAIN));
    }

    public void sendVerificationOtp(VerificationOtpEmailDTO request) {
        if (request == null || blank(request.getTo()) || blank(request.getOtp()) || request.getExpiresInMinutes() <= 0) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        String name = blank(request.getName()) ? "there" : request.getName().trim();
        String subject = "Verify your Javanc account";
        String content = verificationOtpTemplate(name, request.getOtp().trim(), request.getExpiresInMinutes());
        mailSenderPort.send(new MailMessage(null, request.getTo().trim(), subject, content, TEXT_HTML));
    }

    private MailMessage toMailMessage(MailDTO mailDTO) {
        return new MailMessage(null, mailDTO.getMailTo(), mailDTO.getMailSubject(), mailDTO.getMailContent(),
                TEXT_PLAIN);
    }

    private String verificationOtpTemplate(String name, String otp, long expiresInMinutes) {
        return """
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>Verify your Javanc account</title>
                </head>
                <body style="margin:0;padding:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;margin:0;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5ebf3;box-shadow:0 18px 44px rgba(23,32,51,0.10);">
                          <tr>
                            <td style="padding:28px 32px;background:#0f766e;color:#ffffff;">
                              <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;opacity:0.82;">Javanc</div>
                              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;font-weight:800;">Verify your email</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:32px;">
                              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#334155;">Hi %s,</p>
                              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#334155;">Use this one-time code to finish creating your Javanc account.</p>
                              <div style="margin:0 0 24px;padding:22px 20px;text-align:center;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;">
                                <div style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#047857;font-weight:700;">Verification code</div>
                                <div style="font-size:34px;line-height:1.2;letter-spacing:0.22em;font-weight:800;color:#064e3b;font-family:'Courier New',Courier,monospace;">%s</div>
                              </div>
                              <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">This code expires in <strong>%d minutes</strong>. For your security, do not share this code with anyone.</p>
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">If you did not create an account, you can safely ignore this email.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5ebf3;">
                              <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">This is an automated message from Javanc.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(escapeHtml(name), escapeHtml(otp), expiresInMinutes);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
