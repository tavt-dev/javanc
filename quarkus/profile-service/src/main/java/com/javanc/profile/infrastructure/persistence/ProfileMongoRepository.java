package com.javanc.profile.infrastructure.persistence;

import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.ProfileStatus;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.FindOneAndUpdateOptions;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;
import com.mongodb.client.model.ReturnDocument;
import io.quarkus.mongodb.panache.PanacheMongoRepositoryBase;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.bson.Document;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@ApplicationScoped
public class ProfileMongoRepository implements ProfileRepository, PanacheMongoRepositoryBase<Profile, Integer> {

    private static final Logger LOG = Logger.getLogger(ProfileMongoRepository.class);
    private static final int DEFAULT_LIMIT = 20;
    private static final String SEQUENCE_COLLECTION = "profile_sequence";
    private static final String PROFILE_SEQUENCE_ID = "profile";

    private final MongoClient mongoClient;
    private final String databaseName;

    @Inject
    public ProfileMongoRepository(MongoClient mongoClient,
            @ConfigProperty(name = "quarkus.mongodb.database") String databaseName) {
        this.mongoClient = mongoClient;
        this.databaseName = databaseName;
    }

    @PostConstruct
    void ensureIndexes() {
        try {
            mongoCollection().createIndex(Indexes.ascending("idUser"), new IndexOptions().unique(true));
        } catch (RuntimeException exception) {
            LOG.warn("Profile idUser unique index could not be created. Existing duplicate data will be handled lazily.",
                    exception);
        }
    }

    @Override
    public void create(Profile profile) {
        persist(profile);
    }

    @Override
    public void replace(Profile profile) {
        update(profile);
    }

    @Override
    public void delete(Profile profile) {
        profile.setStatus(ProfileStatus.DELETED);
        update(profile);
    }

    @Override
    public Integer nextProfileId() {
        MongoCollection<Document> sequenceCollection = mongoClient.getDatabase(databaseName)
                .getCollection(SEQUENCE_COLLECTION);
        Document updated = sequenceCollection.findOneAndUpdate(
                Filters.eq("_id", PROFILE_SEQUENCE_ID),
                new Document("$inc", new Document("sequenceValue", 1)),
                new FindOneAndUpdateOptions().upsert(true).returnDocument(ReturnDocument.AFTER));
        return updated == null ? 1 : updated.getInteger("sequenceValue", 1);
    }

    @Override
    public Optional<Profile> findByProfileId(Integer id) {
        return findByIdOptional(id).filter(this::active);
    }

    @Override
    public Optional<Profile> findByUserId(Integer idUser) {
        return findAllByUserId(idUser).stream().findFirst();
    }

    @Override
    public List<Profile> findAllByUserId(Integer idUser) {
        if (idUser == null) {
            return List.of();
        }
        return findAnyByUserId(idUser).stream().filter(this::active).toList();
    }

    @Override
    public List<Profile> findAnyByUserId(Integer idUser) {
        if (idUser == null) {
            return List.of();
        }
        return find("idUser", idUser).list();
    }

    @Override
    public boolean existsByUserId(Integer idUser) {
        return !findAllByUserId(idUser).isEmpty();
    }

    @Override
    public List<Profile> findByType(TypeProfile typeProfile) {
        return find("typeProfile", typeProfile).page(0, DEFAULT_LIMIT).list().stream().filter(this::active).toList();
    }

    @Override
    public List<Profile> findAllLimited() {
        return findAll().page(0, DEFAULT_LIMIT).list().stream().filter(this::active).toList();
    }

    @Override
    public List<Profile> findByTitleRegex(String title) {
        return mongoCollection().find(Filters.and(activeFilter(), titleFilter(title))).limit(DEFAULT_LIMIT)
                .into(new ArrayList<>());
    }

    @Override
    public List<Profile> search(TypeProfile typeProfile, String title, int page, int size) {
        List<org.bson.conversions.Bson> filters = new ArrayList<>();
        filters.add(activeFilter());
        if (typeProfile != null) {
            filters.add(Filters.eq("typeProfile", typeProfile.name()));
        }
        if (title != null && !title.isBlank()) {
            filters.add(titleFilter(title));
        }
        return mongoCollection().find(Filters.and(filters))
                .skip(page * size)
                .limit(size)
                .into(new ArrayList<>());
    }

    @Override
    public Profile findByIdUser(Integer idUser) {
        return findByUserId(idUser).orElse(null);
    }

    @Override
    public List<Profile> findByIdIn(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return mongoCollection().find(Filters.and(activeFilter(), Filters.in("_id", ids))).into(new ArrayList<>());
    }

    private org.bson.conversions.Bson titleFilter(String title) {
        String safeTitle = title == null ? "" : Pattern.quote(title.trim());
        return Filters.regex("title", safeTitle, "i");
    }

    private org.bson.conversions.Bson activeFilter() {
        return Filters.or(Filters.exists("status", false), Filters.eq("status", ProfileStatus.ACTIVE.name()));
    }

    private boolean active(Profile profile) {
        return profile != null && profile.getStatus() != ProfileStatus.DELETED;
    }
}
