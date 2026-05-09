package com.javanc.user.repository;

import com.javanc.user.entity.Role;
import com.javanc.user.entity.User;
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
    UserRepository userRepository;

    @Inject
    EntityManager entityManager;

    @Test
    @TestTransaction
    void persistsAndFindsUserByIdAndEmail() {
        User user = new User(1001, "Jane", "jane@example.com", "EMP-1", "encoded", true, Role.user);

        userRepository.persist(user);
        userRepository.flush();

        Optional<User> byId = userRepository.findByIdOptional(1001);
        Optional<User> byEmail = userRepository.findByEmail("jane@example.com");

        assertTrue(byId.isPresent());
        assertTrue(byEmail.isPresent());
        assertEquals("Jane", byId.orElseThrow().getName());
        assertEquals(Role.user, byEmail.orElseThrow().getRole());
    }

    @Test
    @TestTransaction
    void listsFindsByIdsAndDeletesUsers() {
        User first = new User(2001, "Jane", "jane.list@example.com", "EMP-1", "encoded", true, Role.hr);
        User second = new User(2002, "John", "john.list@example.com", "EMP-2", "encoded-2", false, Role.manager);

        userRepository.persist(first);
        userRepository.persist(second);
        userRepository.flush();

        List<User> usersByIds = userRepository.findUsersByIds(List.of(2001, 2002, 9999));

        assertEquals(2, userRepository.listAll().stream()
                .filter(user -> List.of(2001, 2002).contains(user.getId()))
                .count());
        assertEquals(2, usersByIds.size());
        assertTrue(userRepository.findUsersByIds(List.of()).isEmpty());
        assertTrue(userRepository.deleteUserById(2002));
        assertFalse(userRepository.findByIdOptional(2002).isPresent());
    }

    @Test
    @TestTransaction
    void mapsExplicitColumnNamesAndRoleAsString() {
        User user = new User(3001, "Admin", "admin@example.com", "EMP-ADMIN", "encoded-admin", true, Role.admin);

        userRepository.persist(user);
        userRepository.flush();

        Object[] row = (Object[]) entityManager
                .createNativeQuery("select id_employee, is_active, role from user where id = ?1")
                .setParameter(1, 3001)
                .getSingleResult();

        assertEquals("EMP-ADMIN", row[0]);
        assertEquals(Boolean.TRUE, row[1]);
        assertEquals("admin", row[2]);
    }
}
