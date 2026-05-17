package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.AccountStatus;
import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmployeeId;
import com.javanc.user.domain.model.Role;
import com.javanc.user.domain.model.User;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.UserRepository;
import com.javanc.common.pagination.PageRequest;
import com.javanc.common.pagination.PageResponse;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
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
    public Optional<User> findByEmployeeId(EmployeeId employeeId) {
        if (employeeId == null) {
            return Optional.empty();
        }
        return find("idEmployee", employeeId.value()).firstResultOptional().map(mapper::toDomain);
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
    public PageResponse<User> findUsers(String query, Role role, AccountStatus status, PageRequest pageRequest) {
        String normalized = query == null ? "" : query.trim().toLowerCase();
        String like = "%" + normalized + "%";
        boolean numeric = normalized.matches("\\d+");
        StringBuilder queryBuilder = new StringBuilder("1 = 1");
        List<Object> params = new java.util.ArrayList<>();
        if (role != null) {
            queryBuilder.append(" and role = ?").append(params.size() + 1);
            params.add(role);
        }
        if (status != null) {
            queryBuilder.append(" and status = ?").append(params.size() + 1);
            params.add(status);
        }
        if (!normalized.isBlank()) {
            queryBuilder.append(" and (");
            if (numeric) {
                queryBuilder.append("id = ?").append(params.size() + 1).append(" or ");
                params.add(Integer.valueOf(normalized));
            }
            queryBuilder.append("lower(name) like ?").append(params.size() + 1)
                    .append(" or lower(email) like ?").append(params.size() + 1)
                    .append(" or (idEmployee is not null and lower(idEmployee) like ?").append(params.size() + 1)
                    .append("))");
            params.add(like);
        }
        var panacheQuery = find(queryBuilder.toString(), sort(pageRequest), params.toArray());
        long total = panacheQuery.count();
        List<User> items = panacheQuery.page(pageRequest.page(), pageRequest.size()).list().stream()
                .map(mapper::toDomain)
                .toList();
        return PageResponse.of(items, pageRequest, total);
    }

    @Override
    public List<User> findAllUsers() {
        return listAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public boolean existsByRole(Role role) {
        return count("role", role) > 0;
    }

    @Override
    public boolean existsActiveByRole(Role role) {
        return count("role = ?1 and status = ?2", role, AccountStatus.ACTIVE) > 0;
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

    private Sort sort(PageRequest request) {
        return request.direction() == com.javanc.common.pagination.SortDirection.ASC
                ? Sort.ascending(request.sortField())
                : Sort.descending(request.sortField());
    }
}
