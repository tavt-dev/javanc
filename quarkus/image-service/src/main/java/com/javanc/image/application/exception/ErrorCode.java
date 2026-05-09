package com.javanc.image.application.exception;

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
    IMAGE_NOT_FOUND(7001, "Image not found", 404),
    IMAGE_ALREADY_EXISTS(7002, "Image already exists", 409),
    IMAGE_UNABLE_TO_SAVE(7003, "Unable to save image", 500),
    IMAGE_UNABLE_TO_UPDATE(7004, "Unable to update image", 500),
    IMAGE_UNABLE_TO_DELETE(7005, "Unable to delete image", 500),
    UPLOAD_FAILED(10001, "Failed to upload file", 500),
    DELETE_FAILED(10002, "Failed to delete file", 500),
    CONVERSION_FAILED(10003, "Failed to convert file", 500),
    FILE_DELETION_FAILED(10004, "Failed to delete temporary file", 500);

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
