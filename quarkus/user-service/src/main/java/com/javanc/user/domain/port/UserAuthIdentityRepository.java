package com.javanc.user.domain.port;

import com.javanc.user.domain.model.AuthProvider;
import com.javanc.user.domain.model.UserAuthIdentity;
import com.javanc.user.domain.model.UserId;

import java.util.Optional;

public interface UserAuthIdentityRepository {

    Optional<UserAuthIdentity> findByProviderAndSubject(AuthProvider provider, String providerSubject);

    Optional<UserAuthIdentity> findByUserIdAndProvider(UserId userId, AuthProvider provider);

    UserAuthIdentity save(UserAuthIdentity identity);
}
