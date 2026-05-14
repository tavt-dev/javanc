package com.javanc.email.application.port;

public interface EmailCommandIdempotencyPort {

    boolean claim(String commandId);

    void complete(String commandId);

    void release(String commandId);
}
