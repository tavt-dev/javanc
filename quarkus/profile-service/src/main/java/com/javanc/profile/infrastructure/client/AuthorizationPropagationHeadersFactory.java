package com.javanc.profile.infrastructure.client;

import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import org.eclipse.microprofile.rest.client.ext.ClientHeadersFactory;

public class AuthorizationPropagationHeadersFactory implements ClientHeadersFactory {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @Override
    public MultivaluedMap<String, String> update(MultivaluedMap<String, String> incomingHeaders,
            MultivaluedMap<String, String> outgoingHeaders) {
        MultivaluedHashMap<String, String> headers = new MultivaluedHashMap<>();
        headers.putAll(outgoingHeaders);
        String authorization = incomingHeaders == null ? null : incomingHeaders.getFirst(HttpHeaders.AUTHORIZATION);
        if (authorization != null && !authorization.isBlank() && !headers.containsKey(HttpHeaders.AUTHORIZATION)) {
            headers.putSingle(HttpHeaders.AUTHORIZATION, authorization);
        }
        String requestId = incomingHeaders == null ? null : incomingHeaders.getFirst(REQUEST_ID_HEADER);
        if (requestId != null && !requestId.isBlank() && !headers.containsKey(REQUEST_ID_HEADER)) {
            headers.putSingle(REQUEST_ID_HEADER, requestId);
        }
        return headers;
    }
}
