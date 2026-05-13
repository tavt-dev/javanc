package com.javanc.user.domain.port;

import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository {

    Optional<User> findById(UserId id);

    Optional<User> findByEmail(EmailAddress email);

    Optional<User> findByEmployeeId(EmployeeId employeeId);

    List<User> findAllUsers();

    List<User> findUsersByIds(Collection<UserId> ids);

    List<User> searchUsers(String query, Role role, int page, int size);

    boolean existsByRole(Role role);

    boolean existsActiveByRole(Role role);

    User save(User user);

    void delete(User user);
}
