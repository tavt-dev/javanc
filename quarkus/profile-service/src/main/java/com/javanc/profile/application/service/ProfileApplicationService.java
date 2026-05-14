package com.javanc.profile.application.service;

import com.javanc.profile.application.exception.ApplicationException;
import com.javanc.profile.application.exception.ErrorCode;
import com.javanc.profile.application.mapper.ProfileMapper;
import com.javanc.profile.application.port.ImageStoragePort;
import com.javanc.profile.application.port.UserLookupPort;
import com.javanc.profile.application.security.CurrentUser;
import com.javanc.profile.domain.model.Contact;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.ProfileStatus;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import com.javanc.profile.interfaces.rest.dto.ProfileDTO;
import com.mongodb.MongoException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.time.Clock;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

@ApplicationScoped
public class ProfileApplicationService {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9+() .-]{7,32}$");

    private final ProfileRepository profileRepository;
    private final ProfileMapper profileMapper;
    private final ImageStoragePort imageStoragePort;
    private final UserLookupPort userLookupPort;
    private final Clock clock;

    @Inject
    public ProfileApplicationService(ProfileRepository profileRepository, ProfileMapper profileMapper,
            ImageStoragePort imageStoragePort, UserLookupPort userLookupPort) {
        this(profileRepository, profileMapper, imageStoragePort, userLookupPort, Clock.systemUTC());
    }

    ProfileApplicationService(ProfileRepository profileRepository, ProfileMapper profileMapper,
            ImageStoragePort imageStoragePort, UserLookupPort userLookupPort, Clock clock) {
        this.profileRepository = profileRepository;
        this.profileMapper = profileMapper;
        this.imageStoragePort = imageStoragePort;
        this.userLookupPort = userLookupPort;
        this.clock = clock;
    }

    public ProfileDTO createProfile(CurrentUser actor, ProfileDTO request) {
        requireActor(actor);
        try {
            Profile profile = buildNewProfile(actor, request);
            List<Profile> ownerProfiles = profileRepository.findAnyByUserId(actor.userId());
            if (ownerProfiles.size() > 1) {
                throw new ApplicationException(ErrorCode.PROFILE_OWNER_CONFLICT,
                        "Multiple profiles already exist for this user");
            }
            if (ownerProfiles.size() == 1 && ownerProfiles.getFirst().getStatus() != ProfileStatus.DELETED) {
                throw new ApplicationException(ErrorCode.PROFILE_OWNER_CONFLICT);
            }
            if (ownerProfiles.size() == 1) {
                Profile deletedProfile = ownerProfiles.getFirst();
                profile.setId(deletedProfile.getId());
                profile.setCreatedAt(deletedProfile.getCreatedAt() == null ? profile.getCreatedAt()
                        : deletedProfile.getCreatedAt());
                profileRepository.replace(profile);
                return profileMapper.toDto(profile);
            }
            profileRepository.create(profile);
            return profileMapper.toDto(profile);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.PROFILE_UNABLE_TO_SAVE, exception);
        }
    }

    public ProfileDTO getMyProfile(CurrentUser actor) {
        requireActor(actor);
        return profileMapper.toDto(singleActiveProfileByUserId(actor.userId()));
    }

    public ProfileDTO updateMyProfile(CurrentUser actor, ProfileDTO request) {
        requireActor(actor);
        try {
            Profile existing = singleActiveProfileByUserId(actor.userId());
            mergeProfile(existing, request);
            existing.setUpdatedAt(clock.instant());
            profileRepository.replace(existing);
            return profileMapper.toDto(existing);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.PROFILE_UNABLE_TO_UPDATE, exception);
        }
    }

    public ProfileDTO updateMyAvatar(CurrentUser actor, FileUpload imageFile) {
        requireActor(actor);
        if (imageFile == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Image is required");
        }
        try {
            Profile existing = singleActiveProfileByUserId(actor.userId());
            String url = imageStoragePort.uploadForUpdate(imageFile);
            if (url == null || url.isBlank()) {
                throw new ApplicationException(ErrorCode.IMAGE_UPLOAD_FAILED);
            }
            existing.setUrl(url.trim());
            existing.setUpdatedAt(clock.instant());
            profileRepository.replace(existing);
            return profileMapper.toDto(existing);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new ApplicationException(ErrorCode.IMAGE_UPLOAD_FAILED, exception);
        }
    }

    public void deleteMyProfile(CurrentUser actor) {
        requireActor(actor);
        try {
            Profile existing = singleActiveProfileByUserId(actor.userId());
            existing.setUpdatedAt(clock.instant());
            profileRepository.delete(existing);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.PROFILE_UNABLE_TO_DELETE, exception);
        }
    }

    public ProfileDTO findById(CurrentUser actor, Integer id) {
        requireActor(actor);
        return findById(id);
    }

    public ProfileDTO findById(Integer id) {
        requirePositive(id, "Profile id is required");
        Profile profile = profileRepository.findByProfileId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.PROFILE_NOT_FOUND));
        return profileMapper.toDto(profile);
    }

    public ProfileDTO findByUserId(CurrentUser actor, Integer userId) {
        requireActor(actor);
        requirePositive(userId, "User id is required");
        if (!actor.isSelf(userId) && !actor.isAdmin()) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        return findByUserId(userId);
    }

    public ProfileDTO findByUserId(Integer userId) {
        requirePositive(userId, "User id is required");
        return profileMapper.toDto(singleActiveProfileByUserId(userId));
    }

    public List<ProfileDTO> search(CurrentUser actor, String typeProfile, String title, Integer page, Integer size) {
        requireActor(actor);
        return search(typeProfile, title, page, size);
    }

    public List<ProfileDTO> search(String typeProfile, String title, Integer page, Integer size) {
        return search(typeProfile, title, page, size, null);
    }

    public List<ProfileDTO> search(String typeProfile, String title, Integer page, Integer size, String sort) {
        int resolvedPage = page == null ? 0 : page;
        int resolvedSize = size == null ? DEFAULT_PAGE_SIZE : size;
        if (resolvedPage < 0 || resolvedSize < 1 || resolvedSize > MAX_PAGE_SIZE) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid pagination");
        }
        TypeProfile type = parseTypeProfile(typeProfile);
        return profileRepository.searchAll(type, normalizeOptional(title)).stream()
                .sorted(profileComparator(sort))
                .skip((long) resolvedPage * resolvedSize)
                .limit(resolvedSize)
                .map(profileMapper::toDto)
                .toList();
    }

    public List<ProfileDTO> findByIds(CurrentUser actor, List<Integer> ids) {
        requireActor(actor);
        if (!actor.canReadBatch()) {
            throw new ApplicationException(ErrorCode.FORBIDDEN);
        }
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return profileRepository.findByIdIn(ids).stream()
                .map(profileMapper::toDto)
                .toList();
    }

    public boolean checkUserId(Integer id) {
        return userLookupPort.checkUserId(id);
    }

    private Profile buildNewProfile(CurrentUser actor, ProfileDTO request) {
        validateRequest(request, true);
        Instant now = clock.instant();
        Profile profile = new Profile();
        profile.setId(profileRepository.nextProfileId());
        profile.setIdUser(actor.userId());
        applyEditableFields(profile, request, true);
        profile.setStatus(ProfileStatus.ACTIVE);
        profile.setCreatedAt(now);
        profile.setUpdatedAt(now);
        return profile;
    }

    private void mergeProfile(Profile profile, ProfileDTO request) {
        validateRequest(request, false);
        applyEditableFields(profile, request, false);
    }

    private void applyEditableFields(Profile profile, ProfileDTO request, boolean create) {
        if (create || request.getObjective() != null) {
            profile.setObjective(normalizeOptional(request.getObjective()));
        }
        if (create || request.getEducation() != null) {
            profile.setEducation(normalizeOptional(request.getEducation()));
        }
        if (create || request.getWorkExperience() != null) {
            profile.setWorkExperience(normalizeOptional(request.getWorkExperience()));
        }
        if (create || request.getSkills() != null) {
            profile.setSkills(normalizeOptional(request.getSkills()));
        }
        if (create || request.getName() != null) {
            profile.setName(normalizeOptional(request.getName()));
        }
        if (create || request.getTitle() != null) {
            profile.setTitle(requiredTrimmed(request.getTitle(), "Title is required"));
        }
        if (create || request.getTypeProfile() != null) {
            profile.setTypeProfile(parseRequiredTypeProfile(request.getTypeProfile()));
        }
        if (create || request.getContact() != null) {
            profile.setContact(normalizeContact(request.getContact()));
        }
    }

    private void validateRequest(ProfileDTO request, boolean create) {
        if (request == null) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST);
        }
        if (create) {
            requiredTrimmed(request.getTitle(), "Title is required");
            parseRequiredTypeProfile(request.getTypeProfile());
        }
        if (request.getTitle() != null) {
            requiredTrimmed(request.getTitle(), "Title is required");
        }
        if (request.getTypeProfile() != null) {
            parseRequiredTypeProfile(request.getTypeProfile());
        }
        normalizeContact(request.getContact());
    }

    private Profile singleActiveProfileByUserId(Integer userId) {
        List<Profile> profiles = profileRepository.findAllByUserId(userId);
        if (profiles.size() > 1) {
            throw new ApplicationException(ErrorCode.PROFILE_OWNER_CONFLICT,
                    "Multiple active profiles exist for this user");
        }
        return profiles.stream()
                .findFirst()
                .orElseThrow(() -> new ApplicationException(ErrorCode.PROFILE_NOT_FOUND));
    }

    private Contact normalizeContact(Contact contact) {
        if (contact == null) {
            return null;
        }
        String email = normalizeOptional(contact.getEmail());
        if (email != null && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Contact email is invalid");
        }
        String phone = normalizeOptional(contact.getPhone());
        if (phone != null && !PHONE_PATTERN.matcher(phone).matches()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Contact phone is invalid");
        }
        return new Contact(contact.getId(), normalizeOptional(contact.getAddress()), phone, email);
    }

    private TypeProfile parseRequiredTypeProfile(String value) {
        String normalized = requiredTrimmed(value, "Profile type is required");
        try {
            return TypeProfile.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, "Invalid profile type");
        }
    }

    private TypeProfile parseTypeProfile(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return parseRequiredTypeProfile(value);
    }

    private String requiredTrimmed(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Comparator<Profile> profileComparator(String sort) {
        if ("hot".equalsIgnoreCase(normalizeOptional(sort))) {
            return Comparator.comparingInt(this::profileHotScore).reversed()
                    .thenComparing(this::updatedAtOrCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(Profile::getId, Comparator.nullsLast(Comparator.reverseOrder()));
        }
        return Comparator.comparing(Profile::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(Profile::getId, Comparator.nullsLast(Comparator.reverseOrder()));
    }

    private Instant updatedAtOrCreatedAt(Profile profile) {
        if (profile == null) {
            return null;
        }
        return profile.getUpdatedAt() == null ? profile.getCreatedAt() : profile.getUpdatedAt();
    }

    private int profileHotScore(Profile profile) {
        if (profile == null) {
            return 0;
        }
        int score = 0;
        score += hasText(profile.getUrl()) ? 4 : 0;
        score += hasText(profile.getName()) ? 2 : 0;
        score += hasText(profile.getTitle()) ? 2 : 0;
        score += hasText(profile.getObjective()) ? 2 : 0;
        score += hasText(profile.getEducation()) ? 2 : 0;
        score += hasText(profile.getWorkExperience()) ? 3 : 0;
        score += hasText(profile.getSkills()) ? Math.min(6, profile.getSkills().split("[,;\\n]").length * 2) : 0;
        if (profile.getContact() != null) {
            score += hasText(profile.getContact().getEmail()) ? 2 : 0;
            score += hasText(profile.getContact().getPhone()) ? 1 : 0;
            score += hasText(profile.getContact().getAddress()) ? 1 : 0;
        }
        return score;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void requirePositive(Integer value, String message) {
        if (value == null || value <= 0) {
            throw new ApplicationException(ErrorCode.BAD_REQUEST, message);
        }
    }

    private void requireActor(CurrentUser actor) {
        if (actor == null || actor.userId() == null) {
            throw new ApplicationException(ErrorCode.UNAUTHORIZED);
        }
    }
}
