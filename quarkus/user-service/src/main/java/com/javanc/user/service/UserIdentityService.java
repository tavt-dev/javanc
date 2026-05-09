package com.javanc.user.service;

import com.javanc.user.entity.User;
import com.javanc.user.exception.UserNotFoundException;
import com.javanc.user.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class UserIdentityService {

    private final UserRepository userRepository;

    @Inject
    public UserIdentityService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User loadByUsername(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
    }
}
