package com.javanc.user.adapter.out.persistence;

import com.javanc.user.domain.model.EmailAddress;
import com.javanc.user.domain.model.EmailVerificationOtp;
import com.javanc.user.domain.model.UserId;
import com.javanc.user.domain.port.EmailVerificationOtpRepository;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.util.Optional;

@ApplicationScoped
public class JpaEmailVerificationOtpRepository
        implements PanacheRepositoryBase<JpaEmailVerificationOtpEntity, Long>, EmailVerificationOtpRepository {

    @Override
    public Optional<EmailVerificationOtp> findLatestOpenByEmail(EmailAddress email) {
        return find("email = ?1 and consumedAt is null order by createdAt desc", email.value())
                .firstResultOptional()
                .map(this::toDomain);
    }

    @Override
    public EmailVerificationOtp save(EmailVerificationOtp otp) {
        JpaEmailVerificationOtpEntity existing = otp.id() == null ? null : findById(otp.id());
        if (existing == null) {
            JpaEmailVerificationOtpEntity entity = toEntity(otp);
            persist(entity);
            flush();
            return toDomain(entity);
        }
        copyToEntity(otp, existing);
        flush();
        return toDomain(existing);
    }

    @Override
    public void consumeOpenOtps(EmailAddress email) {
        update("consumedAt = ?1 where email = ?2 and consumedAt is null", Instant.now(), email.value());
        flush();
    }

    private EmailVerificationOtp toDomain(JpaEmailVerificationOtpEntity entity) {
        return new EmailVerificationOtp(entity.getId(), new UserId(entity.getUserId()),
                new EmailAddress(entity.getEmail()), entity.getOtpHash(), entity.getExpiresAt(),
                entity.getAttemptCount(), entity.getMaxAttempts(), entity.getConsumedAt(), entity.getCreatedAt(),
                entity.getLastSentAt());
    }

    private JpaEmailVerificationOtpEntity toEntity(EmailVerificationOtp otp) {
        JpaEmailVerificationOtpEntity entity = new JpaEmailVerificationOtpEntity();
        copyToEntity(otp, entity);
        return entity;
    }

    private void copyToEntity(EmailVerificationOtp otp, JpaEmailVerificationOtpEntity entity) {
        entity.setUserId(otp.userId().value());
        entity.setEmail(otp.email().value());
        entity.setOtpHash(otp.otpHash());
        entity.setExpiresAt(otp.expiresAt());
        entity.setAttemptCount(otp.attemptCount());
        entity.setMaxAttempts(otp.maxAttempts());
        entity.setConsumedAt(otp.consumedAt());
        entity.setCreatedAt(otp.createdAt());
        entity.setLastSentAt(otp.lastSentAt());
    }
}
