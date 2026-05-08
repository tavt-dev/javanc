package com.javanc.profile.service;

import com.javanc.profile.client.ImageClient;
import com.javanc.profile.client.UserClient;
import com.javanc.profile.dto.ApiResponse;
import com.javanc.profile.dto.BooleanDTO;
import com.javanc.profile.dto.ImageDTO;
import com.javanc.profile.dto.ProfileDTO;
import com.javanc.profile.exception.ApplicationException;
import com.javanc.profile.exception.ErrorCode;
import com.javanc.profile.mapper.ProfileMapper;
import com.javanc.profile.model.Profile;
import com.javanc.profile.model.TypeProfile;
import com.javanc.profile.repository.ProfileRepository;
import com.mongodb.MongoException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.rest.client.inject.RestClient;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.File;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class ProfileApplicationService {

    private static final Logger LOG = Logger.getLogger(ProfileApplicationService.class);

    private final ProfileRepository profileRepository;
    private final ProfileMapper profileMapper;
    private final ImageClient imageClient;
    private final UserClient userClient;

    @Inject
    public ProfileApplicationService(ProfileRepository profileRepository, ProfileMapper profileMapper,
            @RestClient ImageClient imageClient, @RestClient UserClient userClient) {
        this.profileRepository = profileRepository;
        this.profileMapper = profileMapper;
        this.imageClient = imageClient;
        this.userClient = userClient;
    }

    public ProfileDTO saveProfile(ProfileDTO profileDTO, FileUpload imageFile) {
        try {
            String url = uploadImageForSave(imageFile);
            Profile profile = buildProfile(profileDTO, getGenerationId(), url);
            profileRepository.persist(profile);
            return profileMapper.toDto(profile);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.PROFILE_UNABLE_TO_SAVE, exception);
        }
    }

    public ProfileDTO updateProfile(ProfileDTO profileDTO, FileUpload imageFile) {
        try {
            String url = uploadImageForUpdate(imageFile);
            Profile profile = buildProfile(profileDTO, profileDTO.getId(), url);
            profileRepository.update(profile);
            return profileMapper.toDto(profile);
        } catch (ApplicationException exception) {
            throw exception;
        } catch (MongoException exception) {
            throw new ApplicationException(ErrorCode.PROFILE_UNABLE_TO_UPDATE, exception);
        }
    }

    public ProfileDTO findById(Integer id) {
        Profile profile = profileRepository.findByIdOptional(id)
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
        return new BooleanDTO(profileRepository.findByIdOptional(id).isPresent());
    }

    public boolean checkUserId(Integer id) {
        ApiResponse<Boolean> response = userClient.checkId(id);
        return response != null && Boolean.TRUE.equals(response.getData());
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

    private String uploadImageForSave(FileUpload imageFile) {
        if (imageFile == null) {
            return "";
        }
        ApiResponse<ImageDTO> response = imageClient.save(uploadedFile(imageFile));
        return response.getData().getUrl();
    }

    private String uploadImageForUpdate(FileUpload imageFile) {
        if (imageFile == null) {
            return "";
        }
        ApiResponse<ImageDTO> response = imageClient.save(uploadedFile(imageFile));
        if (response == null || response.getData() == null) {
            LOG.info("Image was not saved or image-service returned an empty response");
            return "";
        }
        return response.getData().getUrl();
    }

    private File uploadedFile(FileUpload imageFile) {
        return imageFile.uploadedFile().toFile();
    }
}
