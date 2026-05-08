package com.javanc.profile.exception;

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
    PROFILE_NOT_FOUND(2001, "Profile not found", 404),
    PROFILE_ALREADY_EXISTS(2002, "Profile already exists", 409),
    PROFILE_UNABLE_TO_SAVE(2003, "Unable to save profile", 500),
    PROFILE_UNABLE_TO_UPDATE(2004, "Unable to update profile", 500),
    PROFILE_UNABLE_TO_DELETE(2005, "Unable to delete profile", 500),
    CONTACT_NOT_FOUND(6001, "Contact not found", 404),
    CONTACT_ALREADY_EXISTS(6002, "Contact already exists", 409),
    CONTACT_UNABLE_TO_SAVE(6003, "Unable to save contact", 500),
    CONTACT_UNABLE_TO_UPDATE(6004, "Unable to update contact", 500),
    CONTACT_UNABLE_TO_DELETE(6005, "Unable to delete contact", 500);

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
