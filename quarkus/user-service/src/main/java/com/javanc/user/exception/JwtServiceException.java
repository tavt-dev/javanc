package com.javanc.user.exception;

public class JwtServiceException extends RuntimeException {

    private final ErrorCode errorCode;

    public JwtServiceException(String message) {
        this(ErrorCode.JWT_INVALID, message);
    }

    public JwtServiceException(String message, Throwable cause) {
        this(ErrorCode.JWT_INVALID, message, cause);
    }

    public JwtServiceException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public JwtServiceException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public JwtServiceException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
