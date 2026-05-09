package com.javanc.user.repository;

import com.javanc.user.adapter.out.persistence.JpaUserPanacheRepository;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.PasswordHash;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@QuarkusTest
class UserRepositoryTest {

    @Inject
    JpaUserPanacheRepository userRepository;

    @Inject
    EntityManager entityManager;

    @Test
    @TestTransaction
    void persistsAndFindsUserByIdAndEmail() {
        User user = user(1001, "Jane", "jane@example.com", "EMP-1", "encoded", true, Role.user);

        userRepository.save(user);

        Optional<User> byId = userRepository.findById(new UserId(1001));
        Optional<User> byEmail = userRepository.findByEmail(new EmailAddress("jane@example.com"));

        assertTrue(byId.isPresent());
        assertTrue(byEmail.isPresent());
        assertEquals("Jane", byId.orElseThrow().name());
        assertEquals(Role.user, byEmail.orElseThrow().role());
    }

    @Test
    @TestTransaction
    void listsFindsByIdsAndDeletesUsers() {
        User first = user(2001, "Jane", "jane.list@example.com", "EMP-1", "encoded", true, Role.hr);
        User second = user(2002, "John", "john.list@example.com", "EMP-2", "encoded-2", false, Role.manager);

        userRepository.save(first);
        userRepository.save(second);

        List<User> usersByIds = userRepository.findUsersByIds(List.of(new UserId(2001), new UserId(2002),
                new UserId(9999)));

        assertEquals(2, userRepository.findAllUsers().stream()
                .filter(found -> List.of(2001, 2002).contains(found.id().value()))
                .count());
        assertEquals(2, usersByIds.size());
        assertTrue(userRepository.findUsersByIds(List.of()).isEmpty());
        userRepository.delete(second);
        assertFalse(userRepository.findById(new UserId(2002)).isPresent());
    }

    @Test
    @TestTransaction
    void mapsExplicitColumnNamesAndRoleAsString() {
        User user = user(3001, "Admin", "admin@example.com", "EMP-ADMIN", "encoded-admin", true, Role.admin);

        userRepository.save(user);

        Object[] row = (Object[]) entityManager
                .createNativeQuery("select id_employee, is_active, role from user where id = ?1")
                .setParameter(1, 3001)
                .getSingleResult();

        assertEquals("EMP-ADMIN", row[0]);
        assertEquals(Boolean.TRUE, row[1]);
        assertEquals("admin", row[2]);
    }

    private User user(Integer id, String name, String email, String employeeId, String passwordHash, boolean active,
            Role role) {
        return new User(new UserId(id), name, new EmailAddress(email), new EmployeeId(employeeId),
                new PasswordHash(passwordHash), active, role);
    }
}
