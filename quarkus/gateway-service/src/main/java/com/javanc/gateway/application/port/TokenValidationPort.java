package com.javanc.gateway.application.port;

import io.smallrye.mutiny.Uni;

public interface TokenValidationPort {
    Uni<Boolean> isValid(String token);
}
