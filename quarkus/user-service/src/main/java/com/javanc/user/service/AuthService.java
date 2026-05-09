package com.javanc.user.service;

import com.javanc.user.dto.request.AuthenticationRequest;
import com.javanc.user.dto.response.AuthenticationResponse;
import com.javanc.user.entity.Role;
import com.javanc.user.entity.User;
import com.javanc.user.exception.JwtServiceException;
import com.javanc.user.exception.UserNotFoundException;
import com.javanc.user.mapper.UserMapper;
import com.javanc.user.repository.UserRepository;
import com.javanc.user.security.JwtService;
import com.javanc.user.security.PasswordService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.UUID;

@ApplicationScoped
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordService passwordService;
    private final UserMapper userMapper;
    private final UserIdentityService userIdentityService;

    @Inject
    public AuthService(UserRepository userRepository, JwtService jwtService, PasswordService passwordService,
            UserMapper userMapper, UserIdentityService userIdentityService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordService = passwordService;
        this.userMapper = userMapper;
        this.userIdentityService = userIdentityService;
    }

    @Transactional
    public AuthenticationResponse signUp(AuthenticationRequest registrationRequest) {
        String normalizedEmail = normalizeEmail(registrationRequest.getEmail());
        if (emailExists(normalizedEmail)) {
            return response(409, "Email already exists", false);
        }

        String role = registrationRequest.getRole() == null ? "user" : registrationRequest.getRole();
        User user = new User(
                getGenerationId(),
                registrationRequest.getName(),
                registrationRequest.getEmail(),
                registrationRequest.getIdEmployee(),
                passwordService.hash(registrationRequest.getPassword()),
                true,
                Role.valueOf(role));

        userRepository.persist(user);
        userRepository.flush();

        AuthenticationResponse response = response(200, "User Saved Successfully", true);
        response.setUser(userMapper.toDto(user));
        return response;
    }

    public AuthenticationResponse signIn(AuthenticationRequest signinRequest) {
        String normalizedEmail = normalizeEmail(signinRequest.getEmail());
        return userRepository.findByEmail(normalizedEmail)
                .map(user -> signInExistingUser(user, signinRequest.getPassword()))
                .orElseGet(() -> response(404, "Email not found", false));
    }

    public AuthenticationResponse refreshToken(AuthenticationRequest refreshTokenRequest) {
        String email = jwtService.extractUsername(refreshTokenRequest.getToken());
        User user = userIdentityService.loadByUsername(email);

        AuthenticationResponse response = response(200, "Successfully Refreshed Token", false);
        response.setToken(jwtService.generateToken(user));
        response.setRefreshToken(refreshTokenRequest.getToken());
        response.setExpirationTime("24Hr");
        return response;
    }

    public AuthenticationResponse isValid(String token) {
        try {
            String email = jwtService.extractUsername(token);
            User user = userIdentityService.loadByUsername(email);
            if (jwtService.isTokenValid(token, user)) {
                AuthenticationResponse response = new AuthenticationResponse();
                response.setVaild(true);
                response.setRole(user.getRole() == null ? null : user.getRole().name());
                return response;
            }
        } catch (JwtServiceException | UserNotFoundException e) {
            return invalidTokenResponse();
        }
        return invalidTokenResponse();
    }

    public Integer getGenerationId() {
        UUID uuid = UUID.randomUUID();
        return (int) (uuid.getMostSignificantBits() & 0xFFFFFFFFL);
    }

    private AuthenticationResponse signInExistingUser(User user, String rawPassword) {
        if (!passwordService.matches(rawPassword, user.getPassword())) {
            return response(401, "Invalid credentials", false);
        }

        AuthenticationResponse response = response(200, "Successfully Signed In", true);
        response.setToken(jwtService.generateToken(user));
        response.setRefreshToken(jwtService.generateRefreshToken(user));
        response.setExpirationTime("24Hr");
        response.setRole(user.getRole() == null ? null : user.getRole().name());
        response.setUser(userMapper.toDto(user));
        return response;
    }

    private boolean emailExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private AuthenticationResponse invalidTokenResponse() {
        AuthenticationResponse response = new AuthenticationResponse();
        response.setVaild(false);
        return response;
    }

    private AuthenticationResponse response(int statusCode, String message, boolean valid) {
        AuthenticationResponse response = new AuthenticationResponse();
        response.setStatusCode(statusCode);
        response.setMessage(message);
        response.setVaild(valid);
        return response;
    }
}
