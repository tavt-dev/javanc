package com.javanc.user.adapter.in.rest;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ClientIpResolverTest {

    @Test
    void ignoresSpoofedHeadersFromUntrustedPeer() {
        ClientIpResolver resolver = new ClientIpResolver(Optional.of("10.0.0.0/8"));

        assertEquals("203.0.113.10",
                resolver.resolve("203.0.113.10", "198.51.100.5", "198.51.100.5"));
    }

    @Test
    void trustsForwardedHeaderFromConfiguredProxy() {
        ClientIpResolver resolver = new ClientIpResolver(Optional.of("10.0.0.0/8"));

        assertEquals("198.51.100.5",
                resolver.resolve("10.1.2.3", "198.51.100.7", "198.51.100.5, 10.1.2.3"));
    }
}
