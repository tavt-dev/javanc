package com.javanc.user.adapter.out.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.javanc.user.application.result.TokenClaims;
import com.javanc.user.domain.model.TokenType;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.port.TokenService;
import com.javanc.user.shared.exception.ErrorCode;
import com.javanc.user.shared.exception.JwtServiceException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@ApplicationScoped
public class JwtTokenService implements TokenService {

    private static final Base64.Encoder URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder URL_DECODER = Base64.getUrlDecoder();

    private String jwtSecret;
    private long accessExpirationSeconds;
    private long refreshExpirationSeconds;
    private String issuer;
    private Clock clock;
    private ObjectMapper objectMapper;

    public JwtTokenService() {
    }

    @Inject
    public JwtTokenService(@ConfigProperty(name = "jwt.secret") String jwtSecret,
            @ConfigProperty(name = "jwt.access-expiration-seconds") long accessExpirationSeconds,
            @ConfigProperty(name = "jwt.refresh-expiration-seconds") long refreshExpirationSeconds,
            @ConfigProperty(name = "jwt.issuer") String issuer,
            Clock clock,
            ObjectMapper objectMapper) {
        this.jwtSecret = jwtSecret;
        this.accessExpirationSeconds = accessExpirationSeconds;
        this.refreshExpirationSeconds = refreshExpirationSeconds;
        this.issuer = issuer;
        this.clock = clock;
        this.objectMapper = objectMapper;
    }

    @Override
    public String generateAccessToken(User user) {
        return generateToken(user, TokenType.access, accessExpirationSeconds);
    }

    @Override
    public String generateRefreshToken(User user) {
        return generateToken(user, TokenType.refresh, refreshExpirationSeconds);
    }

    @Override
    public TokenClaims validate(String token, TokenType expectedType) {
        JsonNode payload = verifyToken(token);
        TokenType actualType = tokenType(payload);
        if (actualType != expectedType) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        if (issuer != null && !issuer.isBlank() && !issuer.equals(payload.path("iss").asText(null))) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        long expiresAt = payload.path("exp").asLong(0);
        if (expiresAt <= clock.instant().getEpochSecond()) {
            throw new JwtServiceException(ErrorCode.JWT_EXPIRED);
        }
        return new TokenClaims(
                payload.path("sub").asText(null),
                payload.path("userId").isMissingNode() ? null : payload.path("userId").asInt(),
                payload.path("role").asText(null),
                actualType,
                expiresAt);
    }

    @Override
    public long accessExpiresInSeconds() {
        return accessExpirationSeconds;
    }

    private String generateToken(User user, TokenType type, long expirationSeconds) {
        if (user == null || user.id() == null || user.email() == null) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        try {
            Instant now = clock.instant();
            Map<String, Object> header = new LinkedHashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("sub", user.email().value());
            payload.put("iss", issuer);
            payload.put("iat", now.getEpochSecond());
            payload.put("exp", now.plusSeconds(expirationSeconds).getEpochSecond());
            payload.put("userId", user.id().value());
            payload.put("role", user.role().name());
            payload.put("typ", type.name());

            String headerPart = encodeJson(header);
            String payloadPart = encodeJson(payload);
            String signingInput = headerPart + "." + payloadPart;
            return signingInput + "." + sign(signingInput);
        } catch (Exception exception) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID, ErrorCode.JWT_INVALID.getMessage(), exception);
        }
    }

    private JsonNode verifyToken(String token) {
        requireJwtSecret();
        if (token == null || token.isBlank()) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            throw new JwtServiceException(ErrorCode.JWT_MALFORMED);
        }
        try {
            String signingInput = parts[0] + "." + parts[1];
            if (!constantTimeEquals(sign(signingInput), parts[2])) {
                throw new JwtServiceException(ErrorCode.JWT_INVALID);
            }
            return mapper().readTree(URL_DECODER.decode(parts[1]));
        } catch (JwtServiceException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new JwtServiceException(ErrorCode.JWT_MALFORMED, ErrorCode.JWT_MALFORMED.getMessage(), exception);
        }
    }

    private TokenType tokenType(JsonNode payload) {
        try {
            return TokenType.valueOf(payload.path("typ").asText());
        } catch (IllegalArgumentException exception) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
    }

    private String encodeJson(Map<String, Object> value) throws Exception {
        return URL_ENCODER.encodeToString(mapper().writeValueAsBytes(value));
    }

    private String sign(String signingInput) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(requireJwtSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return URL_ENCODER.encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return MessageDigestUtil.equals(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }

    private String requireJwtSecret() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        return jwtSecret;
    }

    private ObjectMapper mapper() {
        if (objectMapper == null) {
            objectMapper = new ObjectMapper();
        }
        return objectMapper;
    }

    private static final class MessageDigestUtil {
        private static boolean equals(byte[] left, byte[] right) {
            if (left.length != right.length) {
                return false;
            }
            int result = 0;
            for (int i = 0; i < left.length; i++) {
                result |= left[i] ^ right[i];
            }
            return result == 0;
        }
    }
}
