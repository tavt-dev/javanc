package com.javanc.manager.infrastructure.bootstrap;

import com.javanc.manager.domain.model.Company;
import com.javanc.manager.domain.model.Job;
import com.javanc.manager.domain.model.TypeJob;
import com.javanc.manager.domain.repository.CompanyRepository;
import com.javanc.manager.domain.repository.JobRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class ManagerDemoDataSeeder {

    private static final Logger LOG = Logger.getLogger(ManagerDemoDataSeeder.class);

    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final boolean enabled;

    @Inject
    public ManagerDemoDataSeeder(CompanyRepository companyRepository, JobRepository jobRepository,
            @ConfigProperty(name = "app.seed-demo-data", defaultValue = "false") boolean enabled) {
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.enabled = enabled;
    }

    void seed(@Observes StartupEvent event) {
        if (!enabled) {
            return;
        }
        int companies = 0;
        for (Company company : demoCompanies()) {
            if (companyRepository.findByCompanyId(company.id).isEmpty()) {
                companyRepository.create(company);
                companies++;
            }
        }

        int jobs = 0;
        for (Job job : demoJobs()) {
            if (jobRepository.findByJobId(job.id).isEmpty()) {
                jobRepository.create(job);
                jobs++;
            }
        }
        LOG.infof("Manager demo data seed completed companies=%d jobs=%d", companies, jobs);
    }

    private List<Company> demoCompanies() {
        return List.of(
                company(9201, "NovaStack Labs", "Product Software", "Ho Chi Minh City", "Vietnam",
                        "Builds cloud-native hiring and portfolio tooling for modern software teams.",
                        List.of(9301, 9302, 9303, 9304), List.of(8101, 8102)),
                company(9202, "BluePeak Systems", "Fintech", "Da Nang", "Vietnam",
                        "Payment, account, and risk platforms with strong Java service practices.",
                        List.of(9305, 9306, 9307, 9308), List.of(8103)),
                company(9203, "BrightWorks Studio", "Digital Agency", "Ha Noi", "Vietnam",
                        "Design-led web products, internal portals, and fast customer integrations.",
                        List.of(9309, 9310, 9311, 9312), List.of(8104, 8105)),
                company(9204, "Orbit Data", "Data Platform", "Ho Chi Minh City", "Vietnam",
                        "Data pipelines, search, analytics, and automation for high-growth teams.",
                        List.of(9313, 9314, 9315, 9316), List.of(8106)),
                company(9205, "GreenLine Tech", "Logistics", "Can Tho", "Vietnam",
                        "Operational software for fleet planning, tracking, and warehouse workflows.",
                        List.of(9317, 9318, 9319, 9320), List.of(8107)),
                company(9206, "PulseCare AI", "Healthtech", "Ho Chi Minh City", "Vietnam",
                        "Healthcare workflow systems with privacy-aware backend and data services.",
                        List.of(9321, 9322, 9323, 9324), List.of(8108, 8109)));
    }

    private Company company(int id, String name, String type, String city, String country, String description,
            List<Integer> jobIds, List<Integer> hrIds) {
        Company company = new Company();
        company.id = id;
        company.name = name;
        company.type = type;
        company.city = city;
        company.country = country;
        company.street = "Demo Tower, " + city;
        company.description = description;
        company.email = "hello+" + id + "@javanc.test";
        company.phone = "+84 280 000 " + id % 1000;
        company.url = "https://api.dicebear.com/9.x/initials/svg?seed=" + name.replace(" ", "%20");
        company.idManager = 8000 + id % 100;
        company.idHr = hrIds;
        company.idJobs = jobIds;
        return company;
    }

    private List<Job> demoJobs() {
        return List.of(
                job(9301, 9201, "Senior Java Service Engineer", TypeJob.java, 4, 4, 2),
                job(9302, 9201, "Next.js Product Engineer", TypeJob.java, 3, 4, 1),
                job(9303, 9201, "Kafka Integration Developer", TypeJob.java, 2, 5, 2),
                job(9304, 9201, "Backend Intern", TypeJob.java, 5, 2, 0),
                job(9305, 9202, "Payment API Engineer", TypeJob.java, 3, 5, 3),
                job(9306, 9202, "Risk Automation Analyst", TypeJob.python, 2, 5, 1),
                job(9307, 9202, "Redis Caching Specialist", TypeJob.java, 2, 3, 1),
                job(9308, 9202, "Internal Tools Developer", TypeJob.php, 3, 2, 1),
                job(9309, 9203, "Frontend Experience Engineer", TypeJob.java, 2, 5, 1),
                job(9310, 9203, "PHP Portal Developer", TypeJob.php, 4, 5, 2),
                job(9311, 9203, "API QA Automation", TypeJob.python, 3, 4, 1),
                job(9312, 9203, "UI Integration Developer", TypeJob.java, 2, 3, 0),
                job(9313, 9204, "Python Data Pipeline Engineer", TypeJob.python, 4, 5, 3),
                job(9314, 9204, "Search Platform Backend", TypeJob.java, 2, 5, 2),
                job(9315, 9204, "Analytics API Developer", TypeJob.python, 3, 5, 1),
                job(9316, 9204, "Platform Reliability Engineer", TypeJob.java, 2, 4, 1),
                job(9317, 9205, "Logistics Backend Developer", TypeJob.java, 4, 5, 2),
                job(9318, 9205, "Warehouse Dashboard Engineer", TypeJob.php, 3, 3, 1),
                job(9319, 9205, "Route Optimization Engineer", TypeJob.python, 2, 5, 1),
                job(9320, 9205, "Junior Java Developer", TypeJob.java, 5, 2, 0),
                job(9321, 9206, "Healthcare API Engineer", TypeJob.java, 3, 5, 2),
                job(9322, 9206, "Data Privacy Tooling Engineer", TypeJob.python, 2, 4, 1),
                job(9323, 9206, "Patient Workflow Developer", TypeJob.php, 3, 5, 1),
                job(9324, 9206, "Notification Service Engineer", TypeJob.java, 2, 5, 2));
    }

    private Job job(int id, int companyId, String title, TypeJob type, int size, int pendingCount, int acceptedCount) {
        Job job = new Job();
        job.id = id;
        job.idCompany = companyId;
        job.title = title;
        job.typeJob = type;
        job.size = size;
        job.description = "Demo role focused on production delivery, clean APIs, collaboration with HR, and measurable product impact.";
        job.idProfiePending = demoProfileIds(9101, pendingCount);
        job.idProfile = demoProfileIds(9101 + pendingCount, acceptedCount);
        return job;
    }

    private List<Integer> demoProfileIds(int start, int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(index -> 9101 + Math.floorMod(start - 9101 + index, 8))
                .toList();
    }
}
