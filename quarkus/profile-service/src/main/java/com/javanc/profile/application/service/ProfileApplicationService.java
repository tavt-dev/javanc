package com.javanc.profile.application.service;

import com.javanc.profile.application.exception.ApplicationException;
import com.javanc.profile.application.exception.ErrorCode;
import com.javanc.profile.application.mapper.ProfileMapper;
import com.javanc.profile.application.port.ImageStoragePort;
import com.javanc.profile.application.port.UserLookupPort;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import com.javanc.profile.interfaces.rest.dto.BooleanDTO;
import com.javanc.profile.interfaces.rest.dto.ProfileDTO;
import com.mongodb.MongoException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ProfileApplicationService {

    private final ProfileRepository profileRepository;
    private final ProfileMapper profileMapper;
    private final ImageStoragePort imageStoragePort;
    private final UserLookupPort userLookupPort;

    @Inject
    public ProfileApplicationService(ProfileRepository profileRepository, ProfileMapper profileMapper,
            ImageStoragePort imageStoragePort, UserLookupPort userLookupPort) {
        this.profileRepository = profileRepository;
        this.profileMapper = profileMapper;
        this.imageStoragePort = imageStoragePort;
        this.userLookupPort = userLookupPort;
    }

    public ProfileDTO saveProfile(ProfileDTO profileDTO, FileUpload imageFile) {
        try {
            String url = imageStoragePort.uploadForSave(imageFile);
            Profile profile = buildProfile(profileDTO, getGenerationId(), url);
            profileRepository.create(profile);
            return profileMapper.toDto(profile);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.PROFILE_UNABLE_TO_SAVE, exception);
        }
    }

    public ProfileDTO updateProfile(ProfileDTO profileDTO, FileUpload imageFile) {
        try {
            String url = imageStoragePort.uploadForUpdate(imageFile);
            Profile profile = buildProfile(profileDTO, profileDTO.getId(), url);
            profileRepository.replace(profile);
            return profileMapper.toDto(profile);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.PROFILE_UNABLE_TO_UPDATE, exception);
        }
    }

    public ProfileDTO findById(Integer id) {
        Profile profile = profileRepository.findByProfileId(id)
                .orElseThrow(() -> new ApplicationException(ErrorCode.PROFILE_NOT_FOUND));
        return profileMapper.toDto(profile);
    }

    public ProfileDTO findByIdUser(Integer id) {
        return profileMapper.toDto(profileRepository.findByIdUser(id));
    }

    public List<ProfileDTO> findProfilesByType(TypeProfile typeProfile) {
        try {
            return profileRepository.findByType(typeProfile).stream()
                    .map(profileMapper::toDto)
                    .toList();
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.MONGO_QUERY_EXECUTION_ERROR, exception);
        }
    }

    public List<ProfileDTO> getAllProfile() {
        try {
            return profileRepository.findAllLimited().stream()
                    .map(profileMapper::toDto)
                    .toList();
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR, exception);
        }
    }

    public List<ProfileDTO> findByTitle(String title) {
        try {
            return profileRepository.findByTitleRegex(title).stream()
                    .map(profileMapper::toDto)
                    .toList();
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.MONGO_QUERY_EXECUTION_ERROR, exception);
        }
    }

    public BooleanDTO checkIdProfile(Integer id) {
        return new BooleanDTO(profileRepository.findByProfileId(id).isPresent());
    }

    public boolean checkUserId(Integer id) {
        return userLookupPort.checkUserId(id);
    }

    public List<ProfileDTO> findListProfileByIdPendingJob(List<Integer> ids) {
        try {
            return profileRepository.findByIdIn(ids).stream()
                    .map(profileMapper::toDto)
                    .toList();
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.DATABASE_ACCESS_ERROR, exception);
        }
    }

    public Integer getGenerationId() {
        UUID uuid = UUID.randomUUID();
        return (int) (uuid.getMostSignificantBits() & 0xFFFFFFFFL);
    }

    private Profile buildProfile(ProfileDTO profileDTO, Integer id, String url) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setObjective(profileDTO.getObjective());
        profile.setEducation(profileDTO.getEducation());
        profile.setWorkExperience(profileDTO.getWorkExperience());
        profile.setTypeProfile(profileMapper.toTypeProfile(profileDTO.getTypeProfile()));
        profile.setSkills(profileDTO.getSkills());
        profile.setTitle(profileDTO.getTitle());
        profile.setContact(profileDTO.getContact());
        profile.setIdUser(profileDTO.getIdUser());
        profile.setUrl(url);
        return profile;
    }

}
