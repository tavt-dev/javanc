package com.javanc.manager.application.exception;

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
    MONGO_CONNECTION_FAILURE(3001, "MongoDB connection failed", 500),
    MONGO_DUPLICATE_KEY_ERROR(3002, "MongoDB duplicate key error", 409),
    MONGO_VALIDATION_ERROR(3003, "MongoDB validation error", 400),
    MONGO_WRITE_CONCERN_ERROR(3004, "MongoDB write concern error", 500),
    MONGO_TIMEOUT_ERROR(3005, "MongoDB operation timed out", 500),
    MONGO_QUERY_EXECUTION_ERROR(3006, "MongoDB query execution error", 500),
    MONGO_UNKNOWN_ERROR(3007, "Unknown MongoDB error", 500),
    COMPANY_NOT_FOUND(11001, "Company not found", 404),
    COMPANY_ALREADY_EXISTS(11002, "Company already exists", 409),
    COMPANY_UNABLE_TO_SAVE(11003, "Company unable to save", 500),
    COMPANY_UNABLE_TO_UPDATE(11003, "Company unable to update", 500),
    COMPANY_UNABLE_TO_DELETE(11003, "Company unable to delete", 500),
    JOB_NOT_FOUND(12001, "Job not found", 404),
    JOB_ALREADY_EXISTS(12002, "Job already exists", 409),
    JOB_UNABLE_TO_SAVE(12003, "Job unable to save", 500),
    JOB_UNABLE_TO_UPDATE(12003, "Job unable to update", 500),
    JOB_UNABLE_TO_DELETE(12003, "Job unable to delete", 500);

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
