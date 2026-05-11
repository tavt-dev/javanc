package com.javanc.user.config;

import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AdminAccountBootstrapTest {

    @Test
    void disabledBootstrapDoesNotCreateAdminOrRequireConfig() {
        FakeUserRepository repository = new FakeUserRepository();
        AdminAccountBootstrap bootstrap = bootstrap(repository, false, null, null, "System Admin");

        assertDoesNotThrow(() -> bootstrap.onStart(null));

        assertTrue(repository.users.isEmpty());
    }

    @Test
    void enabledBootstrapCreatesActiveAdminWhenNoActiveAdminExists() {
        FakeUserRepository repository = new FakeUserRepository();
        AdminAccountBootstrap bootstrap = bootstrap(repository, true, "Admin@Example.com", "Password1!",
                " System Admin ");

        bootstrap.onStart(null);

        assertEquals(1, repository.users.size());
        User admin = repository.users.getFirst();
        assertEquals("admin@example.com", admin.email().value());
        assertEquals("System Admin", admin.name());
        assertEquals(Role.admin, admin.role());
        assertEquals(AccountStatus.ACTIVE, admin.status());
        assertEquals("hashed:Password1!", admin.passwordHash().value());
    }

    @Test
    void enabledBootstrapIsIdempotentWhenActiveAdminAlreadyExists() {
        FakeUserRepository repository = new FakeUserRepository();
        repository.seed(user(1, "existing.admin@example.com", Role.admin, AccountStatus.ACTIVE));
        AdminAccountBootstrap bootstrap = bootstrap(repository, true, "new.admin@example.com", "Password1!",
                "System Admin");

        bootstrap.onStart(null);
        bootstrap.onStart(null);

        assertEquals(1, repository.users.size());
        assertEquals("existing.admin@example.com", repository.users.getFirst().email().value());
    }

    @Test
    void activeAdminSkipsBeforeValidatingMissingConfig() {
        FakeUserRepository repository = new FakeUserRepository();
        repository.seed(user(1, "existing.admin@example.com", Role.admin, AccountStatus.ACTIVE));
        AdminAccountBootstrap bootstrap = bootstrap(repository, true, null, null, "");

        assertDoesNotThrow(() -> bootstrap.onStart(null));

        assertEquals(1, repository.users.size());
    }

    @Test
    void enabledBootstrapFailsWhenRequiredConfigIsMissingOrWeak() {
        FakeUserRepository repository = new FakeUserRepository();

        assertThrows(IllegalStateException.class,
                () -> bootstrap(repository, true, null, "Password1!", "System Admin").onStart(null));
        assertThrows(IllegalStateException.class,
                () -> bootstrap(repository, true, "admin@example.com", null, "System Admin").onStart(null));
        assertThrows(IllegalStateException.class,
                () -> bootstrap(repository, true, "admin@example.com", "password", "System Admin").onStart(null));
        assertThrows(IllegalStateException.class,
                () -> bootstrap(repository, true, "admin@example.com", "Password1!", " ").onStart(null));
    }

    @Test
    void enabledBootstrapFailsWhenConfiguredEmailBelongsToNonActiveAdminUser() {
        FakeUserRepository repository = new FakeUserRepository();
        repository.seed(user(1, "admin@example.com", Role.user, AccountStatus.ACTIVE));
        AdminAccountBootstrap bootstrap = bootstrap(repository, true, "admin@example.com", "Password1!",
                "System Admin");

        assertThrows(IllegalStateException.class, () -> bootstrap.onStart(null));

        assertEquals(1, repository.users.size());
        assertFalse(repository.users.getFirst().role() == Role.admin);
    }

    @Test
    void disabledOrDeletedAdminsDoNotCountAsUsableAdmins() {
        FakeUserRepository repository = new FakeUserRepository();
        repository.seed(user(1, "disabled.admin@example.com", Role.admin, AccountStatus.DISABLED));
        repository.seed(user(2, "deleted.admin@example.com", Role.admin, AccountStatus.DELETED));
        AdminAccountBootstrap bootstrap = bootstrap(repository, true, "active.admin@example.com", "Password1!",
                "System Admin");

        bootstrap.onStart(null);

        assertEquals(3, repository.users.size());
        assertTrue(repository.existsActiveByRole(Role.admin));
        assertTrue(repository.findByEmail(new EmailAddress("active.admin@example.com")).isPresent());
    }

    private AdminAccountBootstrap bootstrap(FakeUserRepository repository, boolean enabled, String email,
            String password, String name) {
        AdminAccountBootstrap bootstrap = new AdminAccountBootstrap(repository, new FakePasswordHasher());
        bootstrap.enabled = enabled;
        bootstrap.email = Optional.ofNullable(email);
        bootstrap.password = Optional.ofNullable(password);
        bootstrap.name = name;
        return bootstrap;
    }

    private User user(int id, String email, Role role, AccountStatus status) {
        return new User(new UserId(id), "Existing User", new EmailAddress(email), null,
                new PasswordHash("hashed-existing-password"), status, role);
    }

    private static final class FakePasswordHasher implements PasswordHasher {
        @Override
        public PasswordHash hash(String rawPassword) {
            return new PasswordHash("hashed:" + rawPassword);
        }

        @Override
        public boolean matches(String rawPassword, PasswordHash passwordHash) {
            return false;
        }
    }

    private static final class FakeUserRepository implements UserRepository {
        private final List<User> users = new ArrayList<>();

        void seed(User user) {
            users.add(user);
        }

        @Override
        public Optional<User> findById(UserId id) {
            return users.stream()
                    .filter(user -> user.id() != null && user.id().value().equals(id.value()))
                    .findFirst();
        }

        @Override
        public Optional<User> findByEmail(EmailAddress email) {
            return users.stream()
                    .filter(user -> user.email().equals(email))
                    .findFirst();
        }

        @Override
        public Optional<User> findByEmployeeId(EmployeeId employeeId) {
            return users.stream()
                    .filter(user -> user.employeeId() != null && user.employeeId().equals(employeeId))
                    .findFirst();
        }

        @Override
        public List<User> findAllUsers() {
            return List.copyOf(users);
        }

        @Override
        public List<User> findUsersByIds(Collection<UserId> ids) {
            return users.stream()
                    .filter(user -> ids.contains(user.id()))
                    .toList();
        }

        @Override
        public boolean existsByRole(Role role) {
            return users.stream().anyMatch(user -> user.role() == role);
        }

        @Override
        public boolean existsActiveByRole(Role role) {
            return users.stream().anyMatch(user -> user.role() == role && user.status() == AccountStatus.ACTIVE);
        }

        @Override
        public User save(User user) {
            users.add(user);
            return user;
        }

        @Override
        public void delete(User user) {
            users.remove(user);
        }
    }
}
