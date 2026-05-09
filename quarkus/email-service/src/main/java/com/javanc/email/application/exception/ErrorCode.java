package com.javanc.email.application.exception;

import jakarta.ws.rs.core.Response;

public enum ErrorCode {
    BAD_REQUEST(400, "Bad request", Response.Status.BAD_REQUEST),
    USER_NOT_FOUND(404, "User not found", Response.Status.NOT_FOUND),
    USER_EMAIL_NOT_FOUND(404, "User email not found", Response.Status.NOT_FOUND),
    MAIL_SEND_FAILED(500, "Mail send failed", Response.Status.INTERNAL_SERVER_ERROR),
    UNCATEGORIZED_EXCEPTION(9999, "Unclassified error", Response.Status.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String message;
    private final Response.Status status;

    ErrorCode(int code, String message, Response.Status status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }

    public Response.Status getStatus() {
        return status;
    }
}
