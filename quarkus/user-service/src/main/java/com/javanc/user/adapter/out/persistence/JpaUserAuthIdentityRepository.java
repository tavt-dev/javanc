package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.AuthProvider;
import com.javanc.user.domain.model.UserAuthIdentity;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.UserAuthIdentityRepository;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Optional;

@ApplicationScoped
public class JpaUserAuthIdentityRepository
        implements PanacheRepositoryBase<JpaUserAuthIdentityEntity, Integer>, UserAuthIdentityRepository {

    private final UserAuthIdentityPersistenceMapper mapper;

    @Inject
    public JpaUserAuthIdentityRepository(UserAuthIdentityPersistenceMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public Optional<UserAuthIdentity> findByProviderAndSubject(AuthProvider provider, String providerSubject) {
        return find("provider = ?1 and providerSubject = ?2", provider, providerSubject)
                .firstResultOptional()
                .map(mapper::toDomain);
    }

    @Override
    public Optional<UserAuthIdentity> findByUserIdAndProvider(UserId userId, AuthProvider provider) {
        return find("userId = ?1 and provider = ?2", userId.value(), provider)
                .firstResultOptional()
                .map(mapper::toDomain);
    }

    @Override
    public UserAuthIdentity save(UserAuthIdentity identity) {
        JpaUserAuthIdentityEntity entity = mapper.toEntity(identity);
        persist(entity);
        flush();
        return mapper.toDomain(entity);
    }
}
