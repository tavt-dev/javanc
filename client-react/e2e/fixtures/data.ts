export type TestRole = "user" | "hr" | "manager" | "admin";

export const users = {
  user: {
    id: 1,
    name: "User One",
    email: "user@example.com",
    role: "user",
    active: true,
    status: "ACTIVE",
  },
  hr: {
    id: 2,
    name: "HR One",
    email: "hr@example.com",
    role: "hr",
    active: true,
    status: "ACTIVE",
  },
  manager: {
    id: 3,
    name: "Manager One",
    email: "manager@example.com",
    role: "manager",
    active: true,
    status: "ACTIVE",
  },
  admin: {
    id: 4,
    name: "Admin One",
    email: "admin@example.com",
    role: "admin",
    active: true,
    status: "ACTIVE",
  },
} as const;

export function sessionFor(role: TestRole) {
  return {
    accessToken: `${role}-access-token`,
    refreshToken: `${role}-refresh-token`,
    tokenType: "Bearer",
    expiresInSeconds: 3600,
    user: users[role],
  };
}

export const profile = {
  id: 101,
  title: "Senior Java Developer",
  objective: "Build reliable backend systems.",
  education: "Computer Science",
  workExperience: "5 years building Java platforms.",
  skills: "Java, Quarkus, PostgreSQL",
  contact: {
    email: "user@example.com",
    phone: "+1 555 111 2222",
    address: "New York",
  },
  typeProfile: "JAVA",
  idUser: users.user.id,
  url: "",
  status: "ACTIVE",
  createdAt: "2026-05-01T09:00:00Z",
  updatedAt: "2026-05-12T09:00:00Z",
};

export const companies = [
  {
    id: 301,
    name: "Acme Software",
    type: "Software",
    description: "Enterprise software company.",
    street: "1 Main St",
    email: "hello@acme.test",
    phone: "+1 555 111 3333",
    city: "New York",
    country: "USA",
    idManager: users.manager.id,
    idHR: [users.hr.id],
    idJobs: [501, 502],
  },
  {
    id: 302,
    name: "Python Labs",
    type: "Research",
    description: "Data and AI products.",
    city: "Boston",
    country: "USA",
    idJobs: [],
  },
];

export const jobs = [
  {
    id: 501,
    title: "Java API Engineer",
    description: "Build Quarkus gateway APIs.",
    typeJob: "java",
    size: 2,
    idProfiePending: [],
    idProfile: [],
    idCompany: 301,
  },
  {
    id: 502,
    title: "Python Data Engineer",
    description: "Build data pipelines.",
    typeJob: "python",
    size: 1,
    idProfiePending: [101],
    idProfile: [],
    idCompany: 301,
  },
];

export const projects = [
  {
    id: 201,
    title: "Gateway Monitor",
    description: "A monitoring dashboard for Quarkus services.",
    createAt: "2026-05-03T09:00:00Z",
    url: "https://example.com",
    display: true,
    idProfile: profile.id,
  },
];

export const notifications = [
  {
    id: 401,
    message: "Your application moved to pending review.",
    createAt: "2026-05-12T09:00:00Z",
    url: "/my-applications",
    read: false,
    idUser: users.user.id,
  },
  {
    id: 402,
    message: "Welcome to JavaNC.",
    createAt: "2026-05-10T09:00:00Z",
    read: true,
    idUser: users.user.id,
  },
];
