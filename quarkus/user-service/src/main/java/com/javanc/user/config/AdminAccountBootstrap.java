package com.javanc.user.config;

import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.port.PasswordHasher;
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
    public AdminAccountBootstrap(UserRepository userRepository, PasswordHasher passwordHasher) {
        this.userRepository = userRepository;
        this.passwordHasher = passwordHasher;
    }

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (!enabled) {
            return;
        }
        if (userRepository.existsByRole(Role.admin)) {
            return;
        }
        EmailAddress adminEmail = new EmailAddress(email.orElseThrow(
                () -> new IllegalStateException("user.admin.email is required when admin bootstrap is enabled")));
        String rawPassword = password.orElseThrow(
                () -> new IllegalStateException("user.admin.password is required when admin bootstrap is enabled"));
        requirePassword(rawPassword);
        if (userRepository.findByEmail(adminEmail).isPresent()) {
            LOG.warnf("Admin bootstrap skipped because email already exists: %s", adminEmail.value());
            return;
        }
        User admin = new User(null, name, adminEmail, null, hash(rawPassword), AccountStatus.ACTIVE, Role.admin);
        userRepository.save(admin);
        LOG.infof("Admin account bootstrapped: %s", adminEmail.value());
    }

    private PasswordHash hash(String rawPassword) {
        return passwordHasher.hash(rawPassword);
    }

    private void requirePassword(String value) {
        if (value == null || value.length() < 8
                || !value.matches(".*[A-Z].*")
                || !value.matches(".*[a-z].*")
                || !value.matches(".*\\d.*")) {
            throw new IllegalStateException(
                    "Admin bootstrap password must be at least 8 characters and include upper, lower, and digit");
        }
    }
}
