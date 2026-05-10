package com.javanc.user.domain.port;

import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserRepository {

    Optional<User> findById(UserId id);

    Optional<User> findByEmail(EmailAddress email);

    List<User> findAllUsers();

    List<User> findUsersByIds(Collection<UserId> ids);

    boolean existsByRole(Role role);

    User save(User user);

    void delete(User user);
}
