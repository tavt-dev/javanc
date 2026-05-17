package com.javanc.gateway.application.port;

import com.javanc.gateway.application.model.AuthenticatedPrincipal;
import io.smallrye.mutiny.Uni;

public interface TokenValidationPort {
    Uni<AuthenticatedPrincipal> introspect(String token);
}
