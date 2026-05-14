const companies = [
  {
    _id: 9201,
    name: "NovaStack Labs",
    type: "Product Software",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    street: "Demo Tower, Ho Chi Minh City",
    description: "Builds cloud-native hiring and portfolio tooling for modern software teams.",
    email: "hello+9201@javanc.test",
    phone: "+84 280 000 201",
    url: "https://api.dicebear.com/9.x/initials/svg?seed=NovaStack%20Labs",
    idManager: 8001,
    idHr: [8101, 8102],
    idJobs: [9301, 9302, 9303, 9304]
  },
  {
    _id: 9202,
    name: "BluePeak Systems",
    type: "Fintech",
    city: "Da Nang",
    country: "Vietnam",
    street: "Demo Tower, Da Nang",
    description: "Payment, account, and risk platforms with strong Java service practices.",
    email: "hello+9202@javanc.test",
    phone: "+84 280 000 202",
    url: "https://api.dicebear.com/9.x/initials/svg?seed=BluePeak%20Systems",
    idManager: 8002,
    idHr: [8103],
    idJobs: [9305, 9306, 9307, 9308]
  },
  {
    _id: 9203,
    name: "BrightWorks Studio",
    type: "Digital Agency",
    city: "Ha Noi",
    country: "Vietnam",
    street: "Demo Tower, Ha Noi",
    description: "Design-led web products, internal portals, and fast customer integrations.",
    email: "hello+9203@javanc.test",
    phone: "+84 280 000 203",
    url: "https://api.dicebear.com/9.x/initials/svg?seed=BrightWorks%20Studio",
    idManager: 8003,
    idHr: [8104, 8105],
    idJobs: [9309, 9310, 9311, 9312]
  },
  {
    _id: 9204,
    name: "Orbit Data",
    type: "Data Platform",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    street: "Demo Tower, Ho Chi Minh City",
    description: "Data pipelines, search, analytics, and automation for high-growth teams.",
    email: "hello+9204@javanc.test",
    phone: "+84 280 000 204",
    url: "https://api.dicebear.com/9.x/initials/svg?seed=Orbit%20Data",
    idManager: 8004,
    idHr: [8106],
    idJobs: [9313, 9314, 9315, 9316]
  },
  {
    _id: 9205,
    name: "GreenLine Tech",
    type: "Logistics",
    city: "Can Tho",
    country: "Vietnam",
    street: "Demo Tower, Can Tho",
    description: "Operational software for fleet planning, tracking, and warehouse workflows.",
    email: "hello+9205@javanc.test",
    phone: "+84 280 000 205",
    url: "https://api.dicebear.com/9.x/initials/svg?seed=GreenLine%20Tech",
    idManager: 8005,
    idHr: [8107],
    idJobs: [9317, 9318, 9319, 9320]
  },
  {
    _id: 9206,
    name: "PulseCare AI",
    type: "Healthtech",
    city: "Ho Chi Minh City",
    country: "Vietnam",
    street: "Demo Tower, Ho Chi Minh City",
    description: "Healthcare workflow systems with privacy-aware backend and data services.",
    email: "hello+9206@javanc.test",
    phone: "+84 280 000 206",
    url: "https://api.dicebear.com/9.x/initials/svg?seed=PulseCare%20AI",
    idManager: 8006,
    idHr: [8108, 8109],
    idJobs: [9321, 9322, 9323, 9324]
  }
];

const profiles = [
  profile(9101, 9101, "Nguyen Minh Anh", "Senior Java Backend Engineer", "JAVA", "Builds resilient Quarkus services, payment flows, and event-driven APIs.", "Java, Quarkus, Kafka, Redis, MongoDB, Docker", 1),
  profile(9102, 9102, "Tran Gia Huy", "Full-stack Developer", "JAVA", "Ships product dashboards with Next.js, REST APIs, and clean operational UX.", "Next.js, TypeScript, Java, Tailwind, MongoDB", 2),
  profile(9103, 9103, "Le Bao Chau", "Python Data Engineer", "PYTHON", "Turns messy recruiting and business data into searchable analytics pipelines.", "Python, FastAPI, Airflow, PostgreSQL, Pandas", 3),
  profile(9104, 9104, "Pham Quoc Viet", "Java Platform Engineer", "JAVA", "Focuses on service reliability, observability, caching, and CI quality gates.", "Java, Redis, Kafka, Prometheus, Kubernetes", 4),
  profile(9105, 9105, "Do My Linh", "C Systems Developer", "C", "Builds internal tooling, native integrations, and performance-sensitive modules.", "C, Linux, REST, Docker, MongoDB", 5),
  profile(9106, 9106, "Hoang Nam", "Backend Intern", "JAVA", "Learning production Java through profile, job, and notification services.", "Java, Spring basics, MongoDB, Git", 6),
  profile(9107, 9107, "Vu Thanh Mai", "Automation QA Engineer", "PYTHON", "Creates API test suites and release checks for hiring workflows.", "Python, Playwright, REST Assured, CI", 7),
  profile(9108, 9108, "Dang Khoa", "Frontend Engineer", "JAVA", "Designs responsive candidate and manager experiences with strong detail polish.", "TypeScript, React, Next.js, Tailwind, UX", 8)
];

const jobs = [
  job(9301, 9201, "Senior Java Service Engineer", "java", 4, 4, 2),
  job(9302, 9201, "Next.js Product Engineer", "java", 3, 4, 1),
  job(9303, 9201, "Kafka Integration Developer", "java", 2, 5, 2),
  job(9304, 9201, "Backend Intern", "java", 5, 2, 0),
  job(9305, 9202, "Payment API Engineer", "java", 3, 5, 3),
  job(9306, 9202, "Risk Automation Analyst", "python", 2, 5, 1),
  job(9307, 9202, "Redis Caching Specialist", "java", 2, 3, 1),
  job(9308, 9202, "Internal Tools Developer", "php", 3, 2, 1),
  job(9309, 9203, "Frontend Experience Engineer", "java", 2, 5, 1),
  job(9310, 9203, "PHP Portal Developer", "php", 4, 5, 2),
  job(9311, 9203, "API QA Automation", "python", 3, 4, 1),
  job(9312, 9203, "UI Integration Developer", "java", 2, 3, 0),
  job(9313, 9204, "Python Data Pipeline Engineer", "python", 4, 5, 3),
  job(9314, 9204, "Search Platform Backend", "java", 2, 5, 2),
  job(9315, 9204, "Analytics API Developer", "python", 3, 5, 1),
  job(9316, 9204, "Platform Reliability Engineer", "java", 2, 4, 1),
  job(9317, 9205, "Logistics Backend Developer", "java", 4, 5, 2),
  job(9318, 9205, "Warehouse Dashboard Engineer", "php", 3, 3, 1),
  job(9319, 9205, "Route Optimization Engineer", "python", 2, 5, 1),
  job(9320, 9205, "Junior Java Developer", "java", 5, 2, 0),
  job(9321, 9206, "Healthcare API Engineer", "java", 3, 5, 2),
  job(9322, 9206, "Data Privacy Tooling Engineer", "python", 2, 4, 1),
  job(9323, 9206, "Patient Workflow Developer", "php", 3, 5, 1),
  job(9324, 9206, "Notification Service Engineer", "java", 2, 5, 2)
];

upsertMany("company", companies);
upsertMany("profile", profiles);
upsertMany("job", jobs);

printjson({
  seeded: true,
  database: db.getName(),
  companies: companies.length,
  profiles: profiles.length,
  jobs: jobs.length
});

function upsertMany(collection, docs) {
  docs.forEach((doc) => db[collection].replaceOne({ _id: doc._id }, doc, { upsert: true }));
}

function profile(id, userId, name, title, typeProfile, objective, skills, offset) {
  const createdAt = new Date(Date.UTC(2026, 4, 14, 10, offset, 0));
  return {
    _id: id,
    objective,
    education: "Bachelor of Software Engineering",
    workExperience: "Built production features for candidate profiles, job boards, and company tools.",
    skills,
    name,
    contact: {
      address: "Ho Chi Minh City, Vietnam",
      phone: "+84 900 000 " + String(id % 1000).padStart(3, "0"),
      email: "demo" + id + "@javanc.test"
    },
    typeProfile,
    title,
    idUser: userId,
    url: "https://api.dicebear.com/9.x/initials/svg?seed=" + encodeURIComponent(name),
    status: "ACTIVE",
    createdAt,
    updatedAt: new Date(createdAt.getTime() + 3600 * 1000)
  };
}

function job(id, idCompany, title, typeJob, size, pendingCount, acceptedCount) {
  return {
    _id: id,
    title,
    description: "Demo role focused on production delivery, clean APIs, collaboration with HR, and measurable product impact.",
    typeJob,
    size,
    idProfiePending: demoProfileIds(9101, pendingCount),
    idProfile: demoProfileIds(9101 + pendingCount, acceptedCount),
    idCompany
  };
}

function demoProfileIds(start, count) {
  return Array.from({ length: count }, (_, index) => 9101 + ((start - 9101 + index) % 8));
}
