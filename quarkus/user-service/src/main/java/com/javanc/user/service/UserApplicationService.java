package com.javanc.user.service;

import com.javanc.user.dto.UserDTO;
import com.javanc.user.entity.Role;
import com.javanc.user.entity.User;
import com.javanc.user.exception.ErrorCode;
import com.javanc.user.exception.JwtServiceException;
import com.javanc.user.exception.UserNotFoundException;
import com.javanc.user.mapper.UserMapper;
import com.javanc.user.repository.UserRepository;
import com.javanc.user.security.JwtService;
import com.javanc.user.security.PasswordService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class UserApplicationService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final PasswordService passwordService;

    @Inject
    public UserApplicationService(UserRepository userRepository, UserMapper userMapper, JwtService jwtService,
            PasswordService passwordService) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.jwtService = jwtService;
        this.passwordService = passwordService;
    }

    public UserDTO findById(Integer id) {
        return userMapper.toDto(loadById(id));
    }

    public boolean checkUser(Integer id) {
        return id != null && userRepository.findByIdOptional(id).isPresent();
    }

    public UserDTO getCurrentUser(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        String email = jwtService.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        if (!jwtService.isTokenValid(token, user)) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        return userMapper.toDto(user);
    }

    public List<UserDTO> getAll(String token) {
        validateToken(token);
        return userRepository.listAll().stream()
                .map(userMapper::toDto)
                .toList();
    }

    public List<UserDTO> findUsersByIds(String token, List<Integer> ids) {
        validateToken(token);
        return userRepository.findUsersByIds(ids).stream()
                .map(userMapper::toDto)
                .toList();
    }

    @Transactional
    public UserDTO update(String token, UserDTO userDTO) {
        validateToken(token);
        User currentUser = loadById(userDTO.getId());

        currentUser.setName(userDTO.getName());
        currentUser.setEmail(userDTO.getEmail());
        currentUser.setIdEmployee(userDTO.getIdEmployee());
        currentUser.setActive(userDTO.isActive());
        if (userDTO.getRole() != null) {
            currentUser.setRole(Role.valueOf(userDTO.getRole()));
        }
        if (userDTO.getPassword() != null && !userDTO.getPassword().equals(currentUser.getPassword())) {
            currentUser.setPassword(passwordService.hash(userDTO.getPassword()));
        }

        return userMapper.toDto(currentUser);
    }

    @Transactional
    public UserDTO updateIsActive(String token, Integer id) {
        User user = loadById(id);
        user.setActive(!user.isActive());
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDTO deleteUser(String token, Integer id) {
        validateToken(token);
        User user = loadById(id);
        UserDTO userDTO = userMapper.toDto(user);
        userRepository.delete(user);
        return userDTO;
    }

    private User loadById(Integer id) {
        return userRepository.findByIdOptional(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }

    private void validateToken(String token) {
        String email = jwtService.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        if (!jwtService.isTokenValid(token, user)) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new JwtServiceException(ErrorCode.UNAUTHORIZED);
        }
        return authorizationHeader.substring("Bearer ".length());
    }
}
