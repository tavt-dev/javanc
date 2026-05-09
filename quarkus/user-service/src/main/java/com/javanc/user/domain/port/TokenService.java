package com.javanc.user.domain.port;

import com.javanc.user.domain.model.User;

public interface TokenService {

    String generateAccessToken(User user);

    String generateRefreshToken(User user);

    String extractSubject(String token);

    boolean isTokenValid(String token, User user);
}
