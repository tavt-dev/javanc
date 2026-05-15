package com.javanc.user.adapter.out.security;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.javanc.user.application.result.VerifiedGoogleIdentity;
import com.javanc.user.domain.port.GoogleIdentityVerifier;
import com.javanc.user.shared.exception.ApplicationException;
import com.javanc.user.shared.exception.ErrorCode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.List;

@ApplicationScoped
public class GoogleIdTokenVerifierAdapter implements GoogleIdentityVerifier {

    private final String clientId;
    private final String issuer;
    private final GoogleIdTokenVerifier verifier;

    @Inject
    public GoogleIdTokenVerifierAdapter(@ConfigProperty(name = "google.oauth.client-id") String clientId,
            @ConfigProperty(name = "google.oauth.issuer") String issuer) {
        this(clientId, issuer, new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(List.of(clientId))
                .build());
    }

    GoogleIdTokenVerifierAdapter(String clientId, String issuer, GoogleIdTokenVerifier verifier) {
        this.clientId = clientId;
        this.issuer = issuer;
        this.verifier = verifier;
    }

    @Override
    public VerifiedGoogleIdentity verify(String idToken) {
        requireClientId();
        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw invalidToken();
            }
            GoogleIdToken.Payload payload = token.getPayload();
            if (!issuerMatches(payload.getIssuer())) {
                throw invalidToken();
            }
            String audience = payload.getAudience() == null ? null : payload.getAudience().toString();
            if (!clientId.equals(audience)) {
                throw invalidToken();
            }
            String subject = payload.getSubject();
            String email = payload.getEmail();
            if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
                throw invalidToken();
            }
            return new VerifiedGoogleIdentity(subject, email, (String) payload.get("name"),
                    (String) payload.get("picture"), Boolean.TRUE.equals(payload.getEmailVerified()));
        } catch (ApplicationException exception) {
            throw exception;
        } catch (GeneralSecurityException | IOException exception) {
            throw new ApplicationException(ErrorCode.GOOGLE_AUTH_UNAVAILABLE,
                    ErrorCode.GOOGLE_AUTH_UNAVAILABLE.getMessage(), exception);
        }
    }

    private boolean issuerMatches(String actualIssuer) {
        if (issuer == null || issuer.isBlank()) {
            return false;
        }
        if (issuer.equals(actualIssuer)) {
            return true;
        }
        return "https://accounts.google.com".equals(issuer) && "accounts.google.com".equals(actualIssuer);
    }

    private void requireClientId() {
        if (clientId == null || clientId.isBlank()) {
            throw new ApplicationException(ErrorCode.GOOGLE_AUTH_UNAVAILABLE);
        }
    }

    private ApplicationException invalidToken() {
        return new ApplicationException(ErrorCode.GOOGLE_TOKEN_INVALID);
    }
}
