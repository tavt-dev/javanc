package com.javanc.gateway.application.model;

import java.util.List;
import java.util.Map;

public class ForwardResponse {

    private final int status;
    private final Map<String, List<String>> headers;
    private final byte[] body;

    public ForwardResponse(int status, Map<String, List<String>> headers, byte[] body) {
        this.status = status;
        this.headers = headers;
        this.body = body;
    }

    public int status() {
        return status;
    }

    public Map<String, List<String>> headers() {
        return headers;
    }

    public byte[] body() {
        return body;
    }
}
