package com.javanc.user.exception;

public class BadRequestException extends ApplicationException {

    public BadRequestException() {
        super(ErrorCode.BAD_REQUEST);
    }
}
