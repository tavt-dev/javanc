package com.javanc.user.domain.port;

import com.javanc.user.application.result.VerifiedGoogleIdentity;

public interface GoogleIdentityVerifier {

    VerifiedGoogleIdentity verify(String idToken);
}
