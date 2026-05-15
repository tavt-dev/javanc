package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.UserAuthIdentity;
import com.javanc.user.domain.model.UserId;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserAuthIdentityPersistenceMapper {

    public UserAuthIdentity toDomain(JpaUserAuthIdentityEntity entity) {
        if (entity == null) {
            return null;
        }
        return new UserAuthIdentity(entity.getId(), new UserId(entity.getUserId()), entity.getProvider(),
                entity.getProviderSubject(), entity.getCreatedAt(), entity.getUpdatedAt());
    }

    public JpaUserAuthIdentityEntity toEntity(UserAuthIdentity identity) {
        if (identity == null) {
            return null;
        }
        return new JpaUserAuthIdentityEntity(identity.id(), identity.userId().value(), identity.provider(),
                identity.providerSubject(), identity.createdAt(), identity.updatedAt());
    }
}
