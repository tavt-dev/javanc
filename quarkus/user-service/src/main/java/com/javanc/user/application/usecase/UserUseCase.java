package com.javanc.user.application.usecase;

import com.javanc.user.application.command.ChangeUserRoleCommand;
import com.javanc.user.application.command.ChangeUserStatusCommand;
import com.javanc.user.application.command.CreateUserAccountCommand;
import com.javanc.user.application.command.UpdateUserProfileCommand;
import com.javanc.user.application.result.TokenClaims;
import com.javanc.user.application.result.RoleRequestResult;
import com.javanc.user.application.result.UserResult;
import com.javanc.user.adapter.out.persistence.JpaRoleUpgradeRequestEntity;
import com.javanc.user.adapter.out.persistence.JpaRoleUpgradeRequestRepository;
import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.AuthProvider;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.RoleRequestStatus;
import com.javanc.user.domain.model.RoleRequestType;
import com.javanc.user.domain.model.TokenType;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserAuthIdentity;
import com.javanc.user.domain.model.UserAuthorizationPolicy;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.RoleRequestNotifier;
import com.javanc.user.domain.port.TokenService;
import com.javanc.user.domain.port.UserAuthIdentityRepository;
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
    private final UserAuthIdentityRepository identityRepository;
    private final TokenService tokenService;
    private final PasswordHasher passwordHasher;
    private final UserAuthorizationPolicy authorizationPolicy;
    private final JpaRoleUpgradeRequestRepository roleRequestRepository;
    private final RoleRequestNotifier roleRequestNotifier;

    @Inject
    public UserUseCase(UserRepository userRepository, UserAuthIdentityRepository identityRepository,
            TokenService tokenService, PasswordHasher passwordHasher,
            UserAuthorizationPolicy authorizationPolicy, JpaRoleUpgradeRequestRepository roleRequestRepository,
            RoleRequestNotifier roleRequestNotifier) {
        this.userRepository = userRepository;
        this.identityRepository = identityRepository;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
        this.authorizationPolicy = authorizationPolicy;
        this.roleRequestRepository = roleRequestRepository;
        this.roleRequestNotifier = roleRequestNotifier;
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
        requireCanListUsers(actor);
        if (ids != null && !ids.isEmpty()) {
            return userRepository.findUsersByIds(ids.stream().map(UserId::new).toList()).stream()
                    .map(UserResultMapper::toResult)
                    .toList();
        }
        return userRepository.findAllUsers().stream().map(UserResultMapper::toResult).toList();
    }

    public List<UserResult> search(String token, String query, String role, Integer page, Integer size) {
        User actor = authenticatedUser(token);
        requireCanListUsers(actor);
        int resolvedPage = page == null ? 0 : page;
        int resolvedSize = size == null ? 10 : size;
        if (resolvedPage < 0 || resolvedSize < 1 || resolvedSize > 50) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid pagination");
        }
        Role roleFilter = role == null || role.isBlank() ? null : parseRequiredRole(role);
        return userRepository.searchUsers(query, roleFilter, resolvedPage, resolvedSize).stream()
                .map(UserResultMapper::toResult)
                .toList();
    }

    @Transactional
    public UserResult update(UpdateUserProfileCommand command) {
        User actor = authenticatedUser(command.token());
        User target = loadById(command.userId());
        requireCanUpdateProfile(actor, target);

        EmailAddress email = command.email() == null || command.email().isBlank()
                ? target.email()
                : parseEmail(command.email());
        EmployeeId employeeId = command.employeeId() == null
                ? target.employeeId()
                : parseOptionalEmployeeId(command.employeeId());
        ensureEmailAvailable(email, target.id());
        ensureEmployeeIdAvailable(employeeId, target.id());

        target.updateProfile(
                command.name() == null || command.name().isBlank() ? target.name() : command.name().trim(),
                email,
                employeeId);
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
        AccountStatus status = parseStatus(command.status(), command.active());
        requireCanChangeAccountState(target, status);
        target.changeStatus(status);
        return UserResultMapper.toResult(userRepository.save(target));
    }

    @Transactional
    public UserResult changeRole(ChangeUserRoleCommand command) {
        authenticatedUser(command.token());
        throw new ApplicationException(ErrorCode.FORBIDDEN, "Direct role changes are disabled. Use role requests.");
    }

    @Transactional
    public RoleRequestResult requestManagerUpgrade(String token, String reason) {
        User actor = authenticatedUser(token);
        if (actor.role() != Role.user) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Only normal users can request manager upgrade");
        }
        if (roleRequestRepository.existsPending(actor.id().value(), RoleRequestType.MANAGER_UPGRADE)) {
            throw new ApplicationException(ErrorCode.CONFLICT, "A manager upgrade request is already pending");
        }
        JpaRoleUpgradeRequestEntity request = newRequest(actor.id().value(), actor.id().value(), Role.manager,
                RoleRequestType.MANAGER_UPGRADE, RoleRequestStatus.PENDING_SYSADMIN);
        request.reason = normalizeOptional(reason);
        roleRequestRepository.persist(request);
        roleRequestRepository.flush();
        notifyAdmins("New manager upgrade request from " + actor.name());
        return toRoleRequestResult(request);
    }

    public List<RoleRequestResult> myRoleRequests(String token) {
        User actor = authenticatedUser(token);
        return roleRequestRepository.findForUser(actor.id().value()).stream().map(this::toRoleRequestResult).toList();
    }

    public List<RoleRequestResult> adminRoleRequests(String token, String status, String type) {
        User actor = authenticatedUser(token);
        requireCanManageUsers(actor);
        return roleRequestRepository.findForAdmin(parseOptionalStatus(status), parseOptionalType(type)).stream()
                .map(this::toRoleRequestResult)
                .toList();
    }

    @Transactional
    public RoleRequestResult approveRoleRequest(String token, Integer id) {
        User actor = authenticatedUser(token);
        requireCanManageUsers(actor);
        JpaRoleUpgradeRequestEntity request = loadRoleRequest(id);
        if (request.type != RoleRequestType.MANAGER_UPGRADE || request.status != RoleRequestStatus.PENDING_SYSADMIN) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Only pending manager upgrade requests can be approved here");
        }
        User target = loadById(request.targetUserId);
        target.assignRole(Role.admin, request.requestedRole);
        userRepository.save(target);
        decide(request, RoleRequestStatus.APPROVED, actor.id().value(), null);
        roleRequestNotifier.notifyRoleRequest(request.id, request.targetUserId,
                "Your manager upgrade request was approved", "APPROVED");
        return toRoleRequestResult(request);
    }

    @Transactional
    public RoleRequestResult rejectRoleRequest(String token, Integer id, String adminNote) {
        User actor = authenticatedUser(token);
        requireCanManageUsers(actor);
        JpaRoleUpgradeRequestEntity request = loadRoleRequest(id);
        if (request.status != RoleRequestStatus.PENDING_SYSADMIN) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Only pending requests can be rejected");
        }
        decide(request, RoleRequestStatus.REJECTED, actor.id().value(), normalizeOptional(adminNote));
        roleRequestNotifier.notifyRoleRequest(request.id, request.targetUserId,
                "Your manager upgrade request was rejected", "REJECTED");
        return toRoleRequestResult(request);
    }

    @Transactional
    public RoleRequestResult requestHrPromotion(String token, Integer targetUserId, Integer companyId,
            String companyName) {
        User actor = authenticatedUser(token);
        if (actor.role() != Role.manager) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        requirePositive(targetUserId, "Target user id is required");
        requirePositive(companyId, "Company id is required");
        User target = loadById(targetUserId);
        if (target.role() != Role.user) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Only normal users can be invited to HR");
        }
        if (roleRequestRepository.existsPending(target.id().value(), RoleRequestType.HR_PROMOTION)) {
            throw new ApplicationException(ErrorCode.CONFLICT, "An HR promotion request is already pending");
        }
        JpaRoleUpgradeRequestEntity request = newRequest(actor.id().value(), target.id().value(), Role.hr,
                RoleRequestType.HR_PROMOTION, RoleRequestStatus.PENDING_USER_CONFIRMATION);
        request.companyId = companyId;
        request.companyName = normalizeOptional(companyName);
        roleRequestRepository.persist(request);
        roleRequestRepository.flush();
        roleRequestNotifier.notifyRoleRequest(request.id, target.id().value(),
                actor.name() + " invited you to become HR for " + (request.companyName == null ? "their company" : request.companyName),
                "PENDING_USER_CONFIRMATION");
        return toRoleRequestResult(request);
    }

    public List<RoleRequestResult> myHrPromotions(String token) {
        User actor = authenticatedUser(token);
        return roleRequestRepository.findHrPromotionsForUser(actor.id().value()).stream()
                .map(this::toRoleRequestResult)
                .toList();
    }

    @Transactional
    public RoleRequestResult acceptHrPromotion(String token, Integer id) {
        User actor = authenticatedUser(token);
        JpaRoleUpgradeRequestEntity request = loadRoleRequest(id);
        requireHrPromotionTarget(actor, request);
        if (request.status != RoleRequestStatus.PENDING_USER_CONFIRMATION) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Only pending HR invitations can be accepted");
        }
        actor.assignRole(Role.admin, Role.hr);
        userRepository.save(actor);
        decide(request, RoleRequestStatus.APPROVED, actor.id().value(), null);
        roleRequestNotifier.notifyRoleRequest(request.id, request.requesterUserId,
                actor.name() + " accepted your HR invitation", "APPROVED");
        return toRoleRequestResult(request);
    }

    @Transactional
    public RoleRequestResult rejectHrPromotion(String token, Integer id) {
        User actor = authenticatedUser(token);
        JpaRoleUpgradeRequestEntity request = loadRoleRequest(id);
        requireHrPromotionTarget(actor, request);
        if (request.status != RoleRequestStatus.PENDING_USER_CONFIRMATION) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Only pending HR invitations can be rejected");
        }
        decide(request, RoleRequestStatus.REJECTED, actor.id().value(), null);
        roleRequestNotifier.notifyRoleRequest(request.id, request.requesterUserId,
                actor.name() + " rejected your HR invitation", "REJECTED");
        return toRoleRequestResult(request);
    }

    public RoleRequestResult findRoleRequest(String token, Integer id) {
        User actor = authenticatedUser(token);
        JpaRoleUpgradeRequestEntity request = loadRoleRequest(id);
        if (authorizationPolicy.isAdmin(actor) || actor.id().value().equals(request.requesterUserId)
                || actor.id().value().equals(request.targetUserId)) {
            return toRoleRequestResult(request);
        }
        throw new ApplicationException(ErrorCode.FORBIDDEN);
    }

    @Transactional
    public UserResult leaveHr(String token) {
        User actor = authenticatedUser(token);
        if (actor.role() != Role.hr) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Only HR users can leave HR role");
        }
        actor.assignRole(Role.admin, Role.user);
        return UserResultMapper.toResult(userRepository.save(actor));
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
        EmployeeId employeeId = parseOptionalEmployeeId(command.employeeId());
        ensureEmployeeIdAvailable(employeeId, null);
        User user = new User(
                null,
                required(command.name(), "Name is required"),
                email,
                employeeId,
                passwordHasher.hash(command.password()),
                AccountStatus.ACTIVE,
                parseRequiredRole(command.role()));
        User saved = userRepository.save(user);
        identityRepository.save(UserAuthIdentity.local(saved.id()));
        return UserResultMapper.toResult(saved, AuthProvider.LOCAL);
    }

    @Transactional
    public UserResult delete(String token, Integer id) {
        User actor = authenticatedUser(token);
        requireCanManageUsers(actor);
        User target = loadById(id);
        requireCanChangeAccountState(target, AccountStatus.DELETED);
        target.deactivate();
        return UserResultMapper.toResult(userRepository.save(target));
    }

    private void requireCanChangeAccountState(User target, AccountStatus nextStatus) {
        if (target.role() == Role.admin && nextStatus != AccountStatus.ACTIVE) {
            throw new ApplicationException(ErrorCode.CONFLICT, "Admin accounts cannot be disabled or deleted");
        }
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

    private void requireCanListUsers(User actor) {
        if (!authorizationPolicy.canListUsers(actor)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
    }

    private void requireCanAssignRole(User actor, Role requestedRole) {
        if (!authorizationPolicy.canAssignRole(actor, requestedRole)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
    }

    private void requireAssignableTarget(User actor, User target) {
        if (actor.role() == Role.manager && target.role() != Role.user) {
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

    private EmployeeId parseOptionalEmployeeId(String employeeId) {
        try {
            return EmployeeId.optional(employeeId);
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, exception.getMessage());
        }
    }

    private void ensureEmailAvailable(EmailAddress email, UserId currentUserId) {
        userRepository.findByEmail(email)
                .filter(existing -> !sameUser(existing.id(), currentUserId))
                .ifPresent(existing -> {
                    throw new ApplicationException(ErrorCode.USER_ALREADY_EXISTS);
                });
    }

    private void ensureEmployeeIdAvailable(EmployeeId employeeId, UserId currentUserId) {
        if (employeeId == null) {
            return;
        }
        userRepository.findByEmployeeId(employeeId)
                .filter(existing -> !sameUser(existing.id(), currentUserId))
                .ifPresent(existing -> {
                    throw new ApplicationException(ErrorCode.CONFLICT, "Employee ID already exists");
                });
    }

    private boolean sameUser(UserId left, UserId right) {
        return left != null && right != null && left.value().equals(right.value());
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

    private JpaRoleUpgradeRequestEntity newRequest(Integer requesterUserId, Integer targetUserId, Role requestedRole,
            RoleRequestType type, RoleRequestStatus status) {
        java.time.Instant now = java.time.Instant.now();
        JpaRoleUpgradeRequestEntity request = new JpaRoleUpgradeRequestEntity();
        request.requesterUserId = requesterUserId;
        request.targetUserId = targetUserId;
        request.requestedRole = requestedRole;
        request.type = type;
        request.status = status;
        request.createdAt = now;
        request.updatedAt = now;
        return request;
    }

    private JpaRoleUpgradeRequestEntity loadRoleRequest(Integer id) {
        if (id == null || id <= 0) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        return roleRequestRepository.findRequest(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.NOT_FOUND));
    }

    private void decide(JpaRoleUpgradeRequestEntity request, RoleRequestStatus status, Integer decidedByUserId,
            String note) {
        java.time.Instant now = java.time.Instant.now();
        request.status = status;
        request.decidedByUserId = decidedByUserId;
        request.adminNote = note;
        request.updatedAt = now;
        request.decidedAt = now;
    }

    private void requireHrPromotionTarget(User actor, JpaRoleUpgradeRequestEntity request) {
        if (request.type != RoleRequestType.HR_PROMOTION || !actor.id().value().equals(request.targetUserId)) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
    }

    private RoleRequestStatus parseOptionalStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return RoleRequestStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid role request status");
        }
    }

    private RoleRequestType parseOptionalType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return RoleRequestType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid role request type");
        }
    }

    private RoleRequestResult toRoleRequestResult(JpaRoleUpgradeRequestEntity request) {
        User requester = loadById(request.requesterUserId);
        User target = loadById(request.targetUserId);
        return new RoleRequestResult(request.id, request.requesterUserId, request.targetUserId, requester.name(),
                requester.email().value(), target.name(), target.email().value(), request.requestedRole.name(),
                request.type.name(), request.status.name(), request.companyId, request.companyName, request.reason,
                request.adminNote, request.decidedByUserId, request.createdAt, request.updatedAt, request.decidedAt);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void requirePositive(Integer value, String message) {
        if (value == null || value <= 0) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, message);
        }
    }

    private void notifyAdmins(String message) {
        userRepository.findAllUsers().stream()
                .filter(user -> user.role() == Role.admin && user.active())
                .forEach(user -> roleRequestNotifier.notifyUser(user.id().value(), message));
    }
}
