package com.javanc.user.exception;

public enum ErrorCode {
    NOT_FOUND(404, "Resource not found", 404),
    BAD_REQUEST(400, "Bad request", 400),
    UNAUTHORIZED(401, "Unauthorized", 401),
    FORBIDDEN(403, "Forbidden", 403),
    CONFLICT(409, "Conflict", 409),
    UNCATEGORIZED_EXCEPTION(9999, "Unclassified error", 500),
    DATABASE_ACCESS_ERROR(9998, "Database access error", 500),
    DUPLICATE_KEY(9996, "Duplicate key found", 409),
    EMPTY_RESULT(9995, "No result found", 404),
    NON_UNIQUE_RESULT(9994, "Non-unique result found", 409),
    USER_NOT_FOUND(1001, "User not found", 404),
    USER_ALREADY_EXISTS(1002, "User already exists", 409),
    USER_UNABLE_TO_SAVE(1003, "Unable to save user", 500),
    USER_UNABLE_TO_UPDATE(1004, "Unable to update user", 500),
    USER_UNABLE_TO_DELETE(1005, "Unable to delete user", 500),
    JWT_INVALID(1101, "Invalid JWT token", 401),
    JWT_EXPIRED(1102, "JWT token expired", 401),
    JWT_MALFORMED(1103, "Malformed JWT token", 401);

    private final int code;
    private final String message;
    private final int status;

    ErrorCode(int code, String message, int status) {
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

    public int getStatus() {
        return status;
    }
}
