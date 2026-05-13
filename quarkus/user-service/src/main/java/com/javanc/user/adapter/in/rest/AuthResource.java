package com.javanc.user.adapter.in.rest;

import com.javanc.user.adapter.in.rest.dto.ApiResponse;
import com.javanc.user.adapter.in.rest.dto.AuthSession;
import com.javanc.user.adapter.in.rest.dto.LoginRequest;
import com.javanc.user.adapter.in.rest.dto.RegistrationPending;
import com.javanc.user.adapter.in.rest.dto.RefreshTokenRequest;
import com.javanc.user.adapter.in.rest.dto.ResendVerificationOtpRequest;
import com.javanc.user.adapter.in.rest.dto.RegisterRequest;
import com.javanc.user.adapter.in.rest.dto.TokenIntrospection;
import com.javanc.user.adapter.in.rest.dto.TokenIntrospectionRequest;
import com.javanc.user.adapter.in.rest.dto.VerifyEmailRequest;
import com.javanc.user.application.command.RefreshSessionCommand;
import com.javanc.user.application.usecase.AuthUseCase;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    private final AuthUseCase authUseCase;
    private final RestAuthMapper mapper;
    private final TokenResolver tokenResolver;

    @Inject
    public AuthResource(AuthUseCase authUseCase, RestAuthMapper mapper, TokenResolver tokenResolver) {
        this.authUseCase = authUseCase;
        this.mapper = mapper;
        this.tokenResolver = tokenResolver;
    }

    @POST
    @Path("/register")
    public ApiResponse<RegistrationPending> register(RegisterRequest request) {
        return new ApiResponse<>(true, "Verification OTP sent",
                mapper.toDto(authUseCase.register(mapper.toCommand(request))));
    }

    @POST
    @Path("/verify-email")
    public ApiResponse<AuthSession> verifyEmail(VerifyEmailRequest request) {
        return new ApiResponse<>(true, "Email verified successfully",
                mapper.toDto(authUseCase.verifyEmail(mapper.toCommand(request))));
    }

    @POST
    @Path("/resend-verification-otp")
    public ApiResponse<Void> resendVerificationOtp(ResendVerificationOtpRequest request) {
        authUseCase.resendVerificationOtp(mapper.toCommand(request));
        return new ApiResponse<>(true, "If the account is pending, a verification OTP has been sent", null);
    }

    @POST
    @Path("/login")
    public ApiResponse<AuthSession> login(LoginRequest request) {
        return new ApiResponse<>(true, "Login successfully", mapper.toDto(authUseCase.login(mapper.toCommand(request))));
    }

    @POST
    @Path("/refresh")
    public ApiResponse<AuthSession> refresh(RefreshTokenRequest request) {
        return new ApiResponse<>(true, "Token refreshed successfully",
                mapper.toDto(authUseCase.refresh(new RefreshSessionCommand(request.refreshToken))));
    }

    @POST
    @Path("/introspect")
    public ApiResponse<TokenIntrospection> introspect(TokenIntrospectionRequest request) {
        return new ApiResponse<>(true, "Token introspected successfully",
                mapper.toDto(authUseCase.introspect(request.token)));
    }

    @POST
    @Path("/logout")
    public ApiResponse<Void> logout(@HeaderParam("Authorization") String authorizationHeader) {
        authUseCase.logout(tokenResolver.requireHeaderToken(authorizationHeader));
        return new ApiResponse<>(true, "Logout successfully", null);
    }
}
