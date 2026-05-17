param(
    [string]$MySqlContainer = "javanc-mysql",
    [string]$MongoContainer = "javanc-mongo",
    [string]$MySqlPassword = "javanc_local",
    [string]$MongoUser = "root",
    [string]$MongoPassword = "javanc_local",
    [string]$MongoDatabase = "microservice-portfolio"
)

$ErrorActionPreference = "Stop"

function Assert-ContainerRunning {
    param([string]$Name)

    $running = docker inspect -f "{{.State.Running}}" $Name 2>$null
    if ($LASTEXITCODE -ne 0 -or $running -ne "true") {
        throw "Container '$Name' is not running. Start local infra first: .\quarkus\scripts\local-infra-up.ps1"
    }
}

function Invoke-MySqlScalar {
    param([string]$Query)

    $output = docker exec $MySqlContainer mysql -uroot "-p$MySqlPassword" -N -B -e $Query
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL query failed."
    }
    return ($output | Select-Object -First 1).Trim()
}

function Invoke-MySqlScript {
    param([string]$Sql)

    $Sql | docker exec -i $MySqlContainer mysql -uroot "-p$MySqlPassword"
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL seed failed."
    }
}

function Invoke-UserFlywayMigration {
    $quarkusRoot = Split-Path -Parent $PSScriptRoot
    $userPom = Join-Path $quarkusRoot "user-service\pom.xml"
    $migrationPath = Join-Path $quarkusRoot "user-service\src\main\resources\db\migration"

    Write-Host "User-service schema is missing. Running Flyway migrations..."
    & mvn `
        -f $userPom `
        flyway:migrate `
        "-Dflyway.url=jdbc:mysql://localhost:3307/portfolio" `
        "-Dflyway.user=root" `
        "-Dflyway.password=$MySqlPassword" `
        "-Dflyway.locations=filesystem:$migrationPath"

    if ($LASTEXITCODE -ne 0) {
        throw "Flyway migration for user-service failed."
    }
}

function Invoke-MongoScript {
    param([string]$JavaScript)

    $JavaScript | docker exec -i $MongoContainer mongosh --quiet -u $MongoUser -p $MongoPassword --authenticationDatabase admin
    if ($LASTEXITCODE -ne 0) {
        throw "Mongo seed failed."
    }
}

Assert-ContainerRunning $MySqlContainer
Assert-ContainerRunning $MongoContainer

$portfolioUserTableExists = Invoke-MySqlScalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'portfolio' AND table_name = 'user';"
if ($portfolioUserTableExists -ne "1") {
    Invoke-UserFlywayMigration
    $portfolioUserTableExists = Invoke-MySqlScalar "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'portfolio' AND table_name = 'user';"
    if ($portfolioUserTableExists -ne "1") {
        throw "User-service schema is still missing after Flyway migration."
    }
}

$passwordHash = '$2a$10$OYujplxjV3AACaNyig6WN.bMcUMbjQnwGhPkqzVl/44qXNlpFDA.O'

$mysqlSql = @'
CREATE DATABASE IF NOT EXISTS portfolio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS project1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS notification1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE portfolio;

INSERT INTO `user` (
    id, name, email, id_employee, password, is_active, role, status,
    avatar_url, email_verified, last_login_at, created_at, updated_at, version
) VALUES
    (1001, 'Seed Admin', 'admin.seed@javanc.local', 'SEED-ADM-001', '__PASSWORD_HASH__', true, 'admin', 'ACTIVE', null, true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (1002, 'Seed Manager', 'manager.seed@javanc.local', 'SEED-MGR-001', '__PASSWORD_HASH__', true, 'manager', 'ACTIVE', null, true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (1003, 'Seed HR', 'hr.seed@javanc.local', 'SEED-HR-001', '__PASSWORD_HASH__', true, 'hr', 'ACTIVE', null, true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (1004, 'Seed Java Candidate', 'java.seed@javanc.local', 'SEED-USR-001', '__PASSWORD_HASH__', true, 'user', 'ACTIVE', null, true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (1005, 'Seed Python Candidate', 'python.seed@javanc.local', 'SEED-USR-002', '__PASSWORD_HASH__', true, 'user', 'ACTIVE', null, true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0),
    (1006, 'Seed Disabled User', 'disabled.seed@javanc.local', 'SEED-USR-003', '__PASSWORD_HASH__', false, 'user', 'DISABLED', null, true, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    is_active = VALUES(is_active),
    role = VALUES(role),
    status = VALUES(status),
    email_verified = VALUES(email_verified),
    updated_at = CURRENT_TIMESTAMP;

INSERT INTO user_auth_identity (user_id, provider, provider_subject, created_at, updated_at)
SELECT id, 'LOCAL', null, created_at, updated_at
FROM `user`
WHERE email IN (
    'admin.seed@javanc.local',
    'manager.seed@javanc.local',
    'hr.seed@javanc.local',
    'java.seed@javanc.local',
    'python.seed@javanc.local',
    'disabled.seed@javanc.local'
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

INSERT INTO role_upgrade_request (
    id, requester_user_id, target_user_id, requested_role, type, status,
    company_id, company_name, reason, admin_note, decided_by_user_id,
    created_at, updated_at, decided_at, version
) VALUES
    (9001, 1004, 1004, 'manager', 'MANAGER_UPGRADE', 'PENDING_SYSADMIN', null, null, 'Seed request to test admin review queue', null, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, null, 0),
    (9002, 1002, 1005, 'hr', 'HR_PROMOTION', 'PENDING_USER_CONFIRMATION', 7001, 'Javanc Labs', 'Seed HR invitation for user confirmation flow', null, null, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, null, 0),
    (9003, 1002, 1003, 'hr', 'HR_PROMOTION', 'APPROVED', 7001, 'Javanc Labs', 'Seed approved HR promotion', 'Seed approved', 1001, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0)
ON DUPLICATE KEY UPDATE
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

USE project1;

CREATE TABLE IF NOT EXISTS project (
    id INT NOT NULL,
    title VARCHAR(255),
    description VARCHAR(2000),
    create_at DATETIME(6),
    id_image VARCHAR(255),
    is_display BOOLEAN NOT NULL DEFAULT TRUE,
    url VARCHAR(1024),
    id_profile INT,
    PRIMARY KEY (id)
);

INSERT INTO project (id, title, description, create_at, id_image, is_display, url, id_profile) VALUES
    (8001, 'Seed Portfolio API', 'Quarkus REST API with pageable list contract and MySQL persistence.', NOW(6), null, true, 'https://github.com/example/portfolio-api', 5001),
    (8002, 'Seed Hiring Dashboard', 'React dashboard for company, job and candidate operations.', NOW(6), null, true, 'https://github.com/example/hiring-dashboard', 5001),
    (8003, 'Seed Data Pipeline', 'Python analytics pipeline for hiring funnel metrics.', NOW(6), null, true, 'https://github.com/example/data-pipeline', 5002),
    (8004, 'Seed Hidden Draft', 'Private draft project used to test display filtering.', NOW(6), null, false, 'https://github.com/example/draft', 5002)
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    is_display = VALUES(is_display),
    url = VALUES(url),
    id_profile = VALUES(id_profile);

USE notification1;

CREATE TABLE IF NOT EXISTS notifications (
    id INT NOT NULL,
    message VARCHAR(1000),
    create_at DATETIME(6),
    id_user INT,
    url VARCHAR(1024),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS processed_message (
    id BIGINT NOT NULL AUTO_INCREMENT,
    idempotency_key VARCHAR(255) NOT NULL,
    message_type VARCHAR(150) NOT NULL,
    status VARCHAR(32) NOT NULL,
    processed_at TIMESTAMP NULL,
    last_error VARCHAR(1000),
    PRIMARY KEY (id),
    CONSTRAINT uk_processed_message_idempotency_key UNIQUE (idempotency_key)
);

INSERT INTO notifications (id, message, create_at, id_user, url, is_read) VALUES
    (9101, 'Seed: Welcome to Javanc local data.', NOW(6), 1004, '/user/dashboard', false),
    (9102, 'Seed: Your application was accepted by Javanc Labs.', NOW(6), 1004, '/applications', false),
    (9103, 'Seed: HR invitation is waiting for your confirmation.', NOW(6), 1005, '/settings', false),
    (9104, 'Seed: Older notification already read.', NOW(6), 1004, '/notifications', true)
ON DUPLICATE KEY UPDATE
    message = VALUES(message),
    url = VALUES(url),
    is_read = VALUES(is_read);
'@

$mysqlSql = $mysqlSql.Replace("__PASSWORD_HASH__", $passwordHash.Replace("'", "''"))
Invoke-MySqlScript $mysqlSql

$mongoJs = @"
const databaseName = "$MongoDatabase";
const db = db.getSiblingDB(databaseName);

db.profile_sequence.updateOne(
  { _id: "profile" },
  { `$max: { sequenceValue: 5006 } },
  { upsert: true }
);

[
  {
    _id: 5001,
    idUser: 1004,
    name: "Seed Java Candidate",
    title: "Java Backend Developer",
    objective: "Build reliable Quarkus services and clean API contracts.",
    education: "B.S. Computer Science",
    workExperience: "3 years building REST APIs, MySQL, Kafka and React dashboards.",
    skills: "Java, Quarkus, MySQL, Kafka, React, TypeScript",
    typeProfile: "JAVA",
    contact: { id: 1, address: "Ho Chi Minh City, Vietnam", phone: "0900001004", email: "java.seed@javanc.local" },
    idImage: null,
    url: "https://example.test/seed-java-avatar.png",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 5002,
    idUser: 1005,
    name: "Seed Python Candidate",
    title: "Python Data Analyst",
    objective: "Analyze hiring data and automate reporting workflows.",
    education: "B.S. Information Systems",
    workExperience: "2 years with Python, SQL and data visualization.",
    skills: "Python, SQL, Pandas, ETL, dashboards",
    typeProfile: "PYTHON",
    contact: { id: 2, address: "Da Nang, Vietnam", phone: "0900001005", email: "python.seed@javanc.local" },
    idImage: null,
    url: "https://example.test/seed-python-avatar.png",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: 5003,
    idUser: 1003,
    name: "Seed HR",
    title: "Technical Recruiter",
    objective: "Support technical hiring flow for local testing.",
    education: "B.A. Business Administration",
    workExperience: "Recruiting Java and Python developers.",
    skills: "Recruiting, screening, HR operations",
    typeProfile: "JAVA",
    contact: { id: 3, address: "Ha Noi, Vietnam", phone: "0900001003", email: "hr.seed@javanc.local" },
    idImage: null,
    url: "https://example.test/seed-hr-avatar.png",
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  }
].forEach(profile => {
  db.profile.updateOne({ _id: profile._id }, { `$set: profile }, { upsert: true });
});

db.company.updateOne(
  { _id: 7001 },
  {
    `$set: {
      name: "Javanc Labs",
      type: "Software",
      description: "Local seed company for Quarkus and React development workflows.",
      street: "1 Seed Street",
      email: "labs@javanc.local",
      phone: "02800007001",
      city: "Ho Chi Minh City",
      country: "Vietnam",
      url: "https://example.test/javanc-labs.png",
      idManager: 1002,
      idHr: [1003],
      idJobs: [7101, 7102, 7103]
    }
  },
  { upsert: true }
);

db.company.updateOne(
  { _id: 7002 },
  {
    `$set: {
      name: "Data House",
      type: "Analytics",
      description: "Seed analytics company used for company and job filtering.",
      street: "22 Query Avenue",
      email: "hello@datahouse.local",
      phone: "02800007002",
      city: "Da Nang",
      country: "Vietnam",
      url: "https://example.test/data-house.png",
      idManager: null,
      idHr: [],
      idJobs: [7104]
    }
  },
  { upsert: true }
);

[
  {
    _id: 7101,
    title: "Senior Java Developer",
    description: "Build pageable APIs, service integrations and production-ready Quarkus features.",
    typeJob: "java",
    size: 3,
    idProfiePending: [5002],
    idProfile: [],
    idCompany: 7001
  },
  {
    _id: 7102,
    title: "Python Data Analyst",
    description: "Analyze hiring data and build operational dashboards.",
    typeJob: "python",
    size: 2,
    idProfiePending: [],
    idProfile: [5001],
    idCompany: 7001
  },
  {
    _id: 7103,
    title: "PHP Maintenance Engineer",
    description: "Maintain legacy integrations and internal tools.",
    typeJob: "php",
    size: 0,
    idProfiePending: [],
    idProfile: [],
    idCompany: 7001
  },
  {
    _id: 7104,
    title: "Backend Engineer",
    description: "Work on analytics APIs and asynchronous workflows.",
    typeJob: "java",
    size: 1,
    idProfiePending: [],
    idProfile: [],
    idCompany: 7002
  }
].forEach(job => {
  db.job.updateOne({ _id: job._id }, { `$set: job }, { upsert: true });
});

print("Seeded Mongo database: " + databaseName);
"@

Invoke-MongoScript $mongoJs

Write-Host ""
Write-Host "Seed data installed."
Write-Host "Accounts:"
Write-Host "  admin.seed@javanc.local / Password1"
Write-Host "  manager.seed@javanc.local / Password1"
Write-Host "  hr.seed@javanc.local / Password1"
Write-Host "  java.seed@javanc.local / Password1"
Write-Host "  python.seed@javanc.local / Password1"
Write-Host ""
Write-Host "Seeded profiles: 5001, 5002, 5003"
Write-Host "Seeded companies: 7001, 7002"
Write-Host "Seeded jobs: 7101, 7102, 7103, 7104"
