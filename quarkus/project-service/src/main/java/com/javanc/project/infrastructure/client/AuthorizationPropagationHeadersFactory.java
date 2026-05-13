package com.javanc.project.infrastructure.client;

import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import org.eclipse.microprofile.rest.client.ext.ClientHeadersFactory;

public class AuthorizationPropagationHeadersFactory implements ClientHeadersFactory {

    @Override
    public MultivaluedMap<String, String> update(MultivaluedMap<String, String> incomingHeaders,
            MultivaluedMap<String, String> outgoingHeaders) {
        MultivaluedHashMap<String, String> headers = new MultivaluedHashMap<>();
        headers.putAll(outgoingHeaders);
        String authorization = incomingHeaders == null ? null : incomingHeaders.getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization != null && !authorization.isBlank() && !headers.containsKey(HttpHeaders.AUTHORIZATION)) {
            headers.putSingle(HttpHeaders.AUTHORIZATION, authorization);
        }
        return headers;
    }
}
