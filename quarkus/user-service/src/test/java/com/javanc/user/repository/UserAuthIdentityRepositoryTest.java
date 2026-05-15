package com.javanc.user.repository;

import com.javanc.user.adapter.out.persistence.JpaUserAuthIdentityRepository;
import com.javanc.user.adapter.out.persistence.JpaUserPanacheRepository;
import com.javanc.user.domain.model.AuthProvider;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserAuthIdentity;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class UserAuthIdentityRepositoryTest {

    @Inject
    JpaUserPanacheRepository userRepository;

    @Inject
    JpaUserAuthIdentityRepository identityRepository;

    @Test
    @Transactional
    void savesAndFindsGoogleIdentityBySubject() {
        User user = userRepository.save(new User(null, "Google Repo", new EmailAddress("google.repo@example.com"),
                null, new PasswordHash("hashed-password"), true, Role.user));

        identityRepository.save(UserAuthIdentity.google(user.id(), "google-subject-repo"));

        UserAuthIdentity identity = identityRepository.findByProviderAndSubject(AuthProvider.GOOGLE,
                "google-subject-repo").orElseThrow();
        assertEquals(user.id().value(), identity.userId().value());
        assertTrue(identityRepository.findByUserIdAndProvider(user.id(), AuthProvider.GOOGLE).isPresent());
    }

    @Test
    @Transactional
    void rejectsDuplicateGoogleSubject() {
        User first = userRepository.save(new User(null, "Google First", new EmailAddress("google.first@example.com"),
                null, new PasswordHash("hashed-password"), true, Role.user));
        User second = userRepository.save(new User(null, "Google Second", new EmailAddress("google.second@example.com"),
                null, new PasswordHash("hashed-password"), true, Role.user));

        identityRepository.save(UserAuthIdentity.google(first.id(), "google-subject-duplicate"));

        assertThrows(PersistenceException.class,
                () -> identityRepository.save(UserAuthIdentity.google(second.id(), "google-subject-duplicate")));
    }
}
