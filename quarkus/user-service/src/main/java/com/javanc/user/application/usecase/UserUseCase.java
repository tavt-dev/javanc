package com.javanc.user.application.usecase;

import com.javanc.user.application.command.ChangeUserRoleCommand;
import com.javanc.user.application.command.ChangeUserStatusCommand;
import com.javanc.user.application.command.CreateUserAccountCommand;
import com.javanc.user.application.command.UpdateUserProfileCommand;
import com.javanc.user.application.result.TokenClaims;
import com.javanc.user.application.result.UserResult;
import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.TokenType;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserAuthorizationPolicy;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.TokenService;
import com.javanc.user.domain.port.UserRepository;
import com.javanc.user.shared.exception.ApplicationException;
import com.javanc.user.shared.exception.ErrorCode;
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
    private final UserAuthorizationPolicy authorizationPolicy;

    @Inject
    public UserUseCase(UserRepository userRepository, TokenService tokenService, PasswordHasher passwordHasher,
            UserAuthorizationPolicy authorizationPolicy) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
        this.authorizationPolicy = authorizationPolicy;
    }

    public UserResult me(String token) {
        return UserResultMapper.toResult(authenticatedUser(token));
    }

    public UserResult findById(String token, Integer id) {
        User actor = authenticatedUser(token);
        User target = loadById(id);
        requireCanRead(actor, target);
        return UserResultMapper.toResult(target);
    }

    public List<UserResult> list(String token, List<Integer> ids) {
        User actor = authenticatedUser(token);
        requireCanManageUsers(actor);
        if (ids != null && !ids.isEmpty()) {
            return userRepository.findUsersByIds(ids.stream().map(UserId::new).toList()).stream()
                    .map(UserResultMapper::toResult)
                    .toList();
        }
        return userRepository.findAllUsers().stream().map(UserResultMapper::toResult).toList();
    }

    @Transactional
    public UserResult update(UpdateUserProfileCommand command) {
        User actor = authenticatedUser(command.token());
        User target = loadById(command.userId());
        requireCanUpdateProfile(actor, target);

        target.updateProfile(
                command.name() == null || command.name().isBlank() ? target.name() : command.name().trim(),
                command.email() == null || command.email().isBlank() ? target.email() : parseEmail(command.email()),
                command.employeeId() == null ? target.employeeId() : new EmployeeId(command.employeeId()));
        if (command.password() != null && !command.password().isBlank()) {
            requirePassword(command.password());
            target.changePassword(passwordHasher.hash(command.password()));
        }
        return UserResultMapper.toResult(userRepository.save(target));
    }

    @Transactional
    public UserResult changeStatus(ChangeUserStatusCommand command) {
        User actor = authenticatedUser(command.token());
        requireCanManageUsers(actor);
        User target = loadById(command.userId());
        target.changeStatus(parseStatus(command.status(), command.active()));
        return UserResultMapper.toResult(userRepository.save(target));
    }

    @Transactional
    public UserResult changeRole(ChangeUserRoleCommand command) {
        User actor = authenticatedUser(command.token());
        requireCanManageUsers(actor);
        User target = loadById(command.userId());
        target.assignRole(actor.role(), parseRequiredRole(command.role()));
        return UserResultMapper.toResult(userRepository.save(target));
    }

    @Transactional
    public UserResult createAccount(CreateUserAccountCommand command) {
        User actor = authenticatedUser(command.token());
        requireCanManageUsers(actor);
        requirePassword(command.password());
        EmailAddress email = parseEmail(command.email());
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ApplicationException(ErrorCode.USER_ALREADY_EXISTS);
        }
        User user = new User(
                null,
                required(command.name(), "Name is required"),
                email,
                command.employeeId() == null || command.employeeId().isBlank() ? null
                        : new EmployeeId(command.employeeId()),
                passwordHasher.hash(command.password()),
                AccountStatus.ACTIVE,
                parseRequiredRole(command.role()));
        return UserResultMapper.toResult(userRepository.save(user));
    }

    @Transactional
    public UserResult delete(String token, Integer id) {
        User actor = authenticatedUser(token);
        requireCanManageUsers(actor);
        User target = loadById(id);
        target.deactivate();
        return UserResultMapper.toResult(userRepository.save(target));
    }

    private User authenticatedUser(String token) {
        TokenClaims claims = tokenService.validate(token, TokenType.access);
        User user = userRepository.findByEmail(new EmailAddress(claims.subject()))
                .orElseThrow(() -> new ApplicationException(ErrorCode.UNAUTHORIZED));
        if (!user.active()) {
            throw new ApplicationException(ErrorCode.FORBIDDEN, "User is inactive");
        }
        return user;
    }

    private User loadById(Integer id) {
        return userRepository.findById(new UserId(id))
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }

    private void requireCanRead(User actor, User target) {
        if (authorizationPolicy.canRead(actor, target)) {
            return;
        }
        throw new ApplicationException(ErrorCode.FORBIDDEN);
    }

    private void requireCanUpdateProfile(User actor, User target) {
        if (authorizationPolicy.canUpdateProfile(actor, target)) {
            return;
        }
        throw new ApplicationException(ErrorCode.FORBIDDEN);
    }

    private void requireCanManageUsers(User actor) {
        if (!authorizationPolicy.canManageUsers(actor)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
    }

    private EmailAddress parseEmail(String email) {
        try {
            return new EmailAddress(email);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, exception.getMessage());
        }
    }

    private Role parseRequiredRole(String role) {
        try {
            return Role.fromRequired(role);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid role");
        }
    }

    private AccountStatus parseStatus(String status, Boolean active) {
        if (status != null && !status.isBlank()) {
            try {
                return AccountStatus.fromNullable(status);
            } catch (IllegalArgumentException exception) {
                throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid account status");
            }
        }
        return active == null ? AccountStatus.DISABLED : AccountStatus.fromActive(active);
    }

    private String required(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private void requirePassword(String password) {
        if (password == null || password.length() < 8 || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*") || !password.matches(".*\\d.*")) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST,
                    "Password must be at least 8 characters and include upper, lower, and digit");
        }
    }
}
