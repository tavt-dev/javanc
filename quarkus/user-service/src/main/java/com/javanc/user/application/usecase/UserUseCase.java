package com.javanc.user.application.usecase;

import com.javanc.user.application.command.UpdateUserCommand;
import com.javanc.user.application.result.UserResult;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.TokenService;
import com.javanc.user.domain.port.UserRepository;
import com.javanc.user.shared.exception.ErrorCode;
import com.javanc.user.shared.exception.JwtServiceException;
import com.javanc.user.shared.exception.UserNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class UserUseCase {

    private final UserRepository userRepository;
    private final TokenService tokenService;
    private final PasswordHasher passwordHasher;

    @Inject
    public UserUseCase(UserRepository userRepository, TokenService tokenService, PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
    }

    public UserResult findById(Integer id) {
        return UserResultMapper.toResult(loadById(id));
    }

    public boolean checkUser(Integer id) {
        return id != null && userRepository.findById(new UserId(id)).isPresent();
    }

    public UserResult getCurrentUser(String token) {
        return UserResultMapper.toResult(validateTokenAndLoadUser(token));
    }

    public List<UserResult> getAll(String token) {
        validateTokenAndLoadUser(token);
        return userRepository.findAllUsers().stream()
                .map(UserResultMapper::toResult)
                .toList();
    }

    public List<UserResult> findUsersByIds(String token, List<Integer> ids) {
        validateTokenAndLoadUser(token);
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return userRepository.findUsersByIds(ids.stream().map(UserId::new).toList()).stream()
                .map(UserResultMapper::toResult)
                .toList();
    }

    @Transactional
    public UserResult update(UpdateUserCommand command) {
        validateTokenAndLoadUser(command.token());
        User currentUser = loadById(command.id());

        currentUser.updateProfile(
                command.name(),
                new EmailAddress(command.email()),
                new EmployeeId(command.idEmployee()),
                command.role() == null ? null : Role.valueOf(command.role()));
        if (command.password() != null && !passwordHasher.matches(command.password(), currentUser.passwordHash())) {
            currentUser.changePassword(passwordHasher.hash(command.password()));
        }

        userRepository.save(currentUser);
        return UserResultMapper.toResult(currentUser);
    }

    @Transactional
    public UserResult updateActive(String token, Integer id) {
        validateTokenAndLoadUser(token);
        User user = loadById(id);
        user.toggleActive();
        userRepository.save(user);
        return UserResultMapper.toResult(user);
    }

    @Transactional
    public UserResult deleteUser(String token, Integer id) {
        validateTokenAndLoadUser(token);
        User user = loadById(id);
        UserResult userResult = UserResultMapper.toResult(user);
        userRepository.delete(user);
        return userResult;
    }

    private User loadById(Integer id) {
        return userRepository.findById(new UserId(id))
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }

    private User validateTokenAndLoadUser(String token) {
        String email = tokenService.extractSubject(token);
        User user = userRepository.findByEmail(new EmailAddress(email))
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        if (!tokenService.isTokenValid(token, user)) {
            throw new JwtServiceException(ErrorCode.JWT_INVALID);
        }
        return user;
    }
}
