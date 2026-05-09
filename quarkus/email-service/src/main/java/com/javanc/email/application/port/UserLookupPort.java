package com.javanc.email.application.port;

public interface UserLookupPort {

    String findEmailByUserId(Integer id);
}
