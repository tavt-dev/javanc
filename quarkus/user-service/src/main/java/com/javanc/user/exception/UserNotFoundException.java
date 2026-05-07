package com.javanc.user.exception;

public class UserNotFoundException extends ApplicationException {

    public UserNotFoundException(String message) {
        super(ErrorCode.USER_NOT_FOUND);
    }
}
