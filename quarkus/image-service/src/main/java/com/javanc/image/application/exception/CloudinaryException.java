package com.javanc.image.application.exception;

public class CloudinaryException extends ApplicationException {

    public CloudinaryException(ErrorCode errorCode) {
        super(errorCode);
    }

    public CloudinaryException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    public CloudinaryException(ErrorCode errorCode, Throwable cause) {
        super(errorCode, cause);
    }
}
