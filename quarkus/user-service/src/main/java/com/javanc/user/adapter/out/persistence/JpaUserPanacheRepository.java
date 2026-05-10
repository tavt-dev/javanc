package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.UserRepository;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class JpaUserPanacheRepository implements PanacheRepositoryBase<JpaUserEntity, Integer>, UserRepository {

    private final UserPersistenceMapper mapper;

    @Inject
    public JpaUserPanacheRepository(UserPersistenceMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public Optional<User> findById(UserId id) {
        return findByIdOptional(id.value()).map(mapper::toDomain);
    }

    @Override
    public Optional<User> findByEmail(EmailAddress email) {
        return find("email", email.value()).firstResultOptional().map(mapper::toDomain);
    }

    @Override
    public List<User> findAllUsers() {
        return listAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<User> findUsersByIds(Collection<UserId> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Integer> idValues = ids.stream().map(UserId::value).toList();
        return list("id in ?1", idValues).stream().map(mapper::toDomain).toList();
    }

    @Override
    public boolean existsByRole(Role role) {
        return count("role", role) > 0;
    }

    @Override
    public User save(User user) {
        JpaUserEntity existing = user.id() == null ? null : findByIdOptional(user.id().value()).orElse(null);
        if (existing == null) {
            JpaUserEntity entity = mapper.toEntity(user);
            persist(entity);
            flush();
            return mapper.toDomain(entity);
        }
        mapper.copyToEntity(user, existing);
        flush();
        return mapper.toDomain(existing);
    }

    @Override
    public void delete(User user) {
        JpaUserEntity existing = findByIdOptional(user.id().value()).orElse(null);
        if (existing != null) {
            existing.setStatus(AccountStatus.DELETED);
            flush();
        }
    }
}
