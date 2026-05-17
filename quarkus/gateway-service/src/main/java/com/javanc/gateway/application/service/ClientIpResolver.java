package com.javanc.gateway.application.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ClientIpResolver {

    private final List<CidrBlock> trustedProxyCidrs;

    public ClientIpResolver(
            @ConfigProperty(name = "gateway.rate-limit.trusted-proxy-cidrs") Optional<String> trustedProxyCidrs) {
        this.trustedProxyCidrs = Arrays.stream(trustedProxyCidrs.orElse("").split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(CidrBlock::parse)
                .toList();
    }

    public String resolve(String remoteAddress, String forwardedFor) {
        String remoteIp = normalize(remoteAddress);
        if (!trustedProxy(remoteIp) || forwardedFor == null || forwardedFor.isBlank()) {
            return remoteIp;
        }
        return Arrays.stream(forwardedFor.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .findFirst()
                .map(this::normalize)
                .orElse(remoteIp);
    }

    private boolean trustedProxy(String remoteIp) {
        return trustedProxyCidrs.stream().anyMatch(cidr -> cidr.contains(remoteIp));
    }

    private String normalize(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return "unknown";
        }
        String trimmed = candidate.trim();
        int ipv4PortSeparator = trimmed.lastIndexOf(':');
        if (ipv4PortSeparator > 0 && trimmed.indexOf(':') == ipv4PortSeparator) {
            trimmed = trimmed.substring(0, ipv4PortSeparator);
        }
        return trimmed;
    }

    private record CidrBlock(byte[] network, int prefixLength) {
        private static CidrBlock parse(String value) {
            String[] parts = value.split("/", -1);
            if (parts.length != 2) {
                throw new IllegalArgumentException("Invalid CIDR: " + value);
            }
            try {
                byte[] network = InetAddress.getByName(parts[0]).getAddress();
                int prefixLength = Integer.parseInt(parts[1]);
                if (prefixLength < 0 || prefixLength > network.length * 8) {
                    throw new IllegalArgumentException("Invalid CIDR: " + value);
                }
                return new CidrBlock(network, prefixLength);
            } catch (UnknownHostException | NumberFormatException exception) {
                throw new IllegalArgumentException("Invalid CIDR: " + value, exception);
            }
        }

        private boolean contains(String candidate) {
            try {
                byte[] address = InetAddress.getByName(candidate).getAddress();
                if (address.length != network.length) {
                    return false;
                }
                int fullBytes = prefixLength / 8;
                int remainingBits = prefixLength % 8;
                for (int index = 0; index < fullBytes; index++) {
                    if (address[index] != network[index]) {
                        return false;
                    }
                }
                if (remainingBits == 0) {
                    return true;
                }
                int mask = 0xFF << (8 - remainingBits);
                return (address[fullBytes] & mask) == (network[fullBytes] & mask);
            } catch (UnknownHostException exception) {
                return false;
            }
        }
    }
}
