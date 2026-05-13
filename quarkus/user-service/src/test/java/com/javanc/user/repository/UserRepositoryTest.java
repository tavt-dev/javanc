package com.javanc.user.repository;

import com.javanc.user.adapter.out.persistence.JpaUserPanacheRepository;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class UserRepositoryTest {

    @Inject
    JpaUserPanacheRepository repository;

    @Test
    @Transactional
    void saveGeneratesIdNormalizesEmailAndDeleteSoftDisablesUser() {
        User saved = repository.save(new User(null, "Repo User", new EmailAddress("Repo.User@example.com"),
                new EmployeeId("EMP-REPO-1"), new PasswordHash("hashed-password"), true, Role.user));

        assertNotNull(saved.id());
        assertTrue(repository.findByEmail(new EmailAddress("repo.user@example.com")).isPresent());

        repository.delete(saved);

        User disabled = repository.findById(new UserId(saved.id().value())).orElseThrow();
        assertFalse(disabled.active());
    }
}
