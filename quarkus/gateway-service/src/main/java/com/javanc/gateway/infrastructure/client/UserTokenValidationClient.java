package com.javanc.gateway.infrastructure.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.gateway.application.port.TokenValidationPort;
import com.javanc.gateway.infrastructure.client.dto.ApiResponse;
import com.javanc.gateway.infrastructure.client.dto.AuthenticationResponse;
import io.smallrye.mutiny.Uni;
import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import io.vertx.ext.web.client.WebClient;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class UserTokenValidationClient implements TokenValidationPort {

    private static final Logger LOG = Logger.getLogger(UserTokenValidationClient.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final String validationUrl;
    private final long timeoutMillis;

    public UserTokenValidationClient(Vertx vertx, ObjectMapper objectMapper,
            @ConfigProperty(name = "services.user.url") String userServiceUrl,
            @ConfigProperty(name = "gateway.auth-timeout-millis") long timeoutMillis) {
        this.webClient = WebClient.create(vertx);
        this.objectMapper = objectMapper;
        this.validationUrl = trimTrailingSlash(userServiceUrl) + "/auth/isValid";
        this.timeoutMillis = timeoutMillis;
    }

    @Override
    public Uni<Boolean> isValid(String token) {
        LOG.debugf("Calling user-service token validation url=%s", validationUrl);
        return Uni.createFrom().completionStage(
                webClient.postAbs(validationUrl)
                        .timeout(timeoutMillis)
                        .putHeader("Content-Type", "text/plain")
                        .sendBuffer(Buffer.buffer(token))
                        .toCompletionStage())
                .map(response -> {
                    LOG.debugf("User-service validation response status=%d", response.statusCode());
                    if (response.statusCode() < 200 || response.statusCode() >= 300) {
                        return false;
                    }
                    ApiResponse<AuthenticationResponse> apiResponse = parseResponse(response.bodyAsString());
                    return apiResponse.getData() != null && apiResponse.getData().isVaild();
                })
                .onFailure().recoverWithItem(false);
    }

    private ApiResponse<AuthenticationResponse> parseResponse(String body) {
        try {
            return objectMapper.readValue(body, new TypeReference<ApiResponse<AuthenticationResponse>>() {
            });
        } catch (Exception e) {
            LOG.warn("Could not parse user-service validation response");
            return new ApiResponse<>();
        }
    }

    @PreDestroy
    void close() {
        webClient.close();
    }

    private static String trimTrailingSlash(String value) {
        String result = value == null ? "" : value.trim();
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }
}
