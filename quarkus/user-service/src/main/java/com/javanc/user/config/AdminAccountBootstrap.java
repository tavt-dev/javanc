package com.javanc.user.config;

import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserAuthIdentity;
import com.javanc.user.domain.port.PasswordHasher;
import com.javanc.user.domain.port.UserAuthIdentityRepository;
import com.javanc.user.domain.port.UserRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Optional;

@ApplicationScoped
public class AdminAccountBootstrap {

    private static final Logger LOG = Logger.getLogger(AdminAccountBootstrap.class);

    private final UserRepository userRepository;
    private final UserAuthIdentityRepository identityRepository;
    private final PasswordHasher passwordHasher;

    @ConfigProperty(name = "user.admin.bootstrap.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "user.admin.email")
    Optional<String> email;

    @ConfigProperty(name = "user.admin.password")
    Optional<String> password;

    @ConfigProperty(name = "user.admin.name", defaultValue = "System Admin")
    String name;

    @Inject
    public AdminAccountBootstrap(UserRepository userRepository, UserAuthIdentityRepository identityRepository,
            PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.identityRepository = identityRepository;
        this.passwordHasher = passwordHasher;
    }

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (!enabled) {
            return;
        }
        if (userRepository.existsActiveByRole(Role.admin)) {
            LOG.info("Admin bootstrap skipped because an active admin already exists");
            return;
        }

        AdminAccountConfig config = loadConfig();
        ensureEmailAvailable(config.email());
        User admin = createAdmin(config);
        User saved = userRepository.save(admin);
        identityRepository.save(UserAuthIdentity.local(saved.id()));
        LOG.infof("Admin account bootstrapped: %s", config.email().value());
    }

    private AdminAccountConfig loadConfig() {
        EmailAddress adminEmail = new EmailAddress(requiredConfig(email,
                "user.admin.email is required when admin bootstrap is enabled"));
        String rawPassword = requiredConfig(password,
                "user.admin.password is required when admin bootstrap is enabled");
        validatePassword(rawPassword);
        return new AdminAccountConfig(adminEmail, requireName(name), rawPassword);
    }

    private void ensureEmailAvailable(EmailAddress adminEmail) {
        userRepository.findByEmail(adminEmail).ifPresent(existing -> {
            throw new IllegalStateException("Admin bootstrap email already belongs to a non-active-admin user: "
                    + adminEmail.value());
        });
    }

    private User createAdmin(AdminAccountConfig config) {
        return new User(null, config.name(), config.email(), null, hash(config.rawPassword()),
                AccountStatus.ACTIVE, Role.admin);
    }

    private String requiredConfig(Optional<String> value, String message) {
        String resolved = value.orElse(null);
        if (resolved == null || resolved.isBlank()) {
            throw new IllegalStateException(message);
        }
        return resolved.trim();
    }

    private String requireName(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("user.admin.name is required when admin bootstrap is enabled");
        }
        return value.trim();
    }

    private PasswordHash hash(String rawPassword) {
        return passwordHasher.hash(rawPassword);
    }

    private void validatePassword(String value) {
        if (value == null || value.length() < 8
                || !value.matches(".*[A-Z].*")
                || !value.matches(".*[a-z].*")
                || !value.matches(".*\\d.*")) {
            throw new IllegalStateException(
                    "Admin bootstrap password must be at least 8 characters and include upper, lower, and digit");
        }
    }

    private record AdminAccountConfig(EmailAddress email, String name, String rawPassword) {
    }
}
