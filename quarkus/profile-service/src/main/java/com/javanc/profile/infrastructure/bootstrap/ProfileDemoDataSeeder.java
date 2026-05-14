package com.javanc.profile.infrastructure.bootstrap;

import com.javanc.profile.domain.model.Contact;
import com.javanc.profile.domain.model.Profile;
import com.javanc.profile.domain.model.ProfileStatus;
import com.javanc.profile.domain.model.TypeProfile;
import com.javanc.profile.domain.repository.ProfileRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.List;

@ApplicationScoped
public class ProfileDemoDataSeeder {

    private static final Logger LOG = Logger.getLogger(ProfileDemoDataSeeder.class);

    private final ProfileRepository profileRepository;
    private final boolean enabled;

    @Inject
    public ProfileDemoDataSeeder(ProfileRepository profileRepository,
            @ConfigProperty(name = "app.seed-demo-data", defaultValue = "false") boolean enabled) {
        this.profileRepository = profileRepository;
        this.enabled = enabled;
    }

    void seed(@Observes StartupEvent event) {
        if (!enabled) {
            return;
        }
        int created = 0;
        for (Profile profile : demoProfiles()) {
            if (profileRepository.findByProfileId(profile.getId()).isEmpty()
                    && profileRepository.findAnyByUserId(profile.getIdUser()).isEmpty()) {
                profileRepository.create(profile);
                created++;
            }
        }
        LOG.infof("Profile demo data seed completed created=%d", created);
    }

    private List<Profile> demoProfiles() {
        Instant base = Instant.parse("2026-05-14T10:00:00Z");
        return List.of(
                profile(9101, 9101, "Nguyen Minh Anh", "Senior Java Backend Engineer", TypeProfile.JAVA,
                        "Builds resilient Quarkus services, payment flows, and event-driven APIs.",
                        "Java, Quarkus, Kafka, Redis, MongoDB, Docker", base.plusSeconds(60)),
                profile(9102, 9102, "Tran Gia Huy", "Full-stack Developer", TypeProfile.JAVA,
                        "Ships product dashboards with Next.js, REST APIs, and clean operational UX.",
                        "Next.js, TypeScript, Java, Tailwind, MongoDB", base.plusSeconds(120)),
                profile(9103, 9103, "Le Bao Chau", "Python Data Engineer", TypeProfile.PYTHON,
                        "Turns messy recruiting and business data into searchable analytics pipelines.",
                        "Python, FastAPI, Airflow, PostgreSQL, Pandas", base.plusSeconds(180)),
                profile(9104, 9104, "Pham Quoc Viet", "Java Platform Engineer", TypeProfile.JAVA,
                        "Focuses on service reliability, observability, caching, and CI quality gates.",
                        "Java, Redis, Kafka, Prometheus, Kubernetes", base.plusSeconds(240)),
                profile(9105, 9105, "Do My Linh", "C Systems Developer", TypeProfile.C,
                        "Builds internal tooling, native integrations, and performance-sensitive modules.",
                        "C, Linux, REST, Docker, MongoDB", base.plusSeconds(300)),
                profile(9106, 9106, "Hoang Nam", "Backend Intern", TypeProfile.JAVA,
                        "Learning production Java through profile, job, and notification services.",
                        "Java, Spring basics, MongoDB, Git", base.plusSeconds(360)),
                profile(9107, 9107, "Vu Thanh Mai", "Automation QA Engineer", TypeProfile.PYTHON,
                        "Creates API test suites and release checks for hiring workflows.",
                        "Python, Playwright, REST Assured, CI", base.plusSeconds(420)),
                profile(9108, 9108, "Dang Khoa", "Frontend Engineer", TypeProfile.JAVA,
                        "Designs responsive candidate and manager experiences with strong detail polish.",
                        "TypeScript, React, Next.js, Tailwind, UX", base.plusSeconds(480)));
    }

    private Profile profile(int id, int userId, String name, String title, TypeProfile type, String objective,
            String skills, Instant createdAt) {
        Profile profile = new Profile();
        profile.setId(id);
        profile.setIdUser(userId);
        profile.setName(name);
        profile.setTitle(title);
        profile.setTypeProfile(type);
        profile.setObjective(objective);
        profile.setEducation("Bachelor of Software Engineering");
        profile.setWorkExperience("Built production features for candidate profiles, job boards, and company tools.");
        profile.setSkills(skills);
        profile.setContact(new Contact(null, "Ho Chi Minh City, Vietnam", "+84 900 000 " + id % 1000,
                "demo" + id + "@javanc.test"));
        profile.setUrl("https://api.dicebear.com/9.x/initials/svg?seed=" + name.replace(" ", "%20"));
        profile.setStatus(ProfileStatus.ACTIVE);
        profile.setCreatedAt(createdAt);
        profile.setUpdatedAt(createdAt.plusSeconds(3600));
        return profile;
    }
}
