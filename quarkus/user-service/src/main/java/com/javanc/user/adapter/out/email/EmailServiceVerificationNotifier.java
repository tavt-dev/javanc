package com.javanc.user.adapter.out.email;

import com.javanc.user.domain.port.EmailVerificationNotifier;
import com.javanc.user.shared.exception.ApplicationException;
import com.javanc.user.shared.exception.ErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.rest.client.inject.RestClient;

@ApplicationScoped
public class EmailServiceVerificationNotifier implements EmailVerificationNotifier {

    private final EmailServiceClient emailServiceClient;

    public EmailServiceVerificationNotifier(@RestClient EmailServiceClient emailServiceClient) {
        this.emailServiceClient = emailServiceClient;
    }

    @Override
    public void sendOtp(String email, String name, String otp, long expiresInMinutes) {
        try {
            emailServiceClient.sendVerificationOtp(new VerificationOtpEmailRequest(email, name, otp, expiresInMinutes));
        } catch (RuntimeException exception) {
            throw new ApplicationException(ErrorCode.EMAIL_DELIVERY_FAILED, "Unable to send verification email",
                    exception);
        }
    }

    @Override
    public void sendPasswordResetOtp(String email, String name, String otp, long expiresInMinutes) {
        try {
            emailServiceClient.sendPasswordResetOtp(new VerificationOtpEmailRequest(email, name, otp, expiresInMinutes));
        } catch (RuntimeException exception) {
            throw new ApplicationException(ErrorCode.EMAIL_DELIVERY_FAILED, "Unable to send password reset email",
                    exception);
        }
    }
}
