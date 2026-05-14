package com.javanc.email.interfaces.rest.resource;

import com.javanc.email.application.dto.ApiResponse;
import com.javanc.email.application.dto.VerificationOtpEmailDTO;
import com.javanc.email.application.service.EmailApplicationService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/internal/emails")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class InternalEmailResource {

    private final EmailApplicationService emailApplicationService;

    @Inject
    public InternalEmailResource(EmailApplicationService emailApplicationService) {
        this.emailApplicationService = emailApplicationService;
    }

    @POST
    @Path("/verification-otp")
    public ApiResponse<Void> sendVerificationOtp(VerificationOtpEmailDTO request) {
        emailApplicationService.sendVerificationOtp(request);
        return new ApiResponse<>(true, "Verification OTP email sent", null);
    }

    @POST
    @Path("/password-reset-otp")
    public ApiResponse<Void> sendPasswordResetOtp(VerificationOtpEmailDTO request) {
        emailApplicationService.sendPasswordResetOtp(request);
        return new ApiResponse<>(true, "Password reset OTP email sent", null);
    }
}
