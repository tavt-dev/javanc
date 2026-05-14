package com.javanc.user.adapter.out.email;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.rest.client.annotation.RegisterClientHeaders;
import org.eclipse.microprofile.rest.client.inject.RegisterRestClient;
import com.javanc.user.adapter.out.AuthorizationPropagationHeadersFactory;

@RegisterRestClient(configKey = "email-service")
@RegisterClientHeaders(AuthorizationPropagationHeadersFactory.class)
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public interface EmailServiceClient {

    @POST
    @Path("/internal/emails/verification-otp")
    void sendVerificationOtp(VerificationOtpEmailRequest request);
}
