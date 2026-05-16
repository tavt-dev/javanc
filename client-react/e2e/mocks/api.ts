import type { Page, Route } from "@playwright/test";
import {
  companies as baseCompanies,
  jobs as baseJobs,
  notifications as baseNotifications,
  profile as baseProfile,
  projects as baseProjects,
  googleSessionFor,
  sessionFor,
  users,
  type TestRole,
} from "../fixtures/data";

type MockOptions = {
  role?: TestRole;
  profileMissing?: boolean;
  hrUnassigned?: boolean;
  refreshFails?: boolean;
};

type RoleRequestMock = {
  id: number;
  requesterUserId: number;
  targetUserId: number;
  requesterName?: string;
  targetName?: string;
  requestedRole: string;
  type: string;
  status: string;
  companyId?: number;
  companyName?: string;
  createdAt?: string;
};

export type MockState = ReturnType<typeof createMockState>;

export function createMockState() {
  return {
    companies: structuredClone(baseCompanies),
    jobs: structuredClone(baseJobs),
    notifications: structuredClone(baseNotifications),
    profile: structuredClone(baseProfile),
    projects: structuredClone(baseProjects),
    users: Object.values(users).map((user) => ({ ...user, idEmployee: `EMP-${user.id}` })),
    roleRequests: [] as RoleRequestMock[],
    refreshCount: 0,
    activeAuthProvider: "LOCAL" as "LOCAL" | "GOOGLE",
  };
}

export async function installApiMocks(
  page: Page,
  options: MockOptions = {},
  state = createMockState(),
) {
  const role = options.role ?? "user";

  await page.route(
    /.*\/(auth|users|profiles|project|notification|manager)(\/|\?|$).*/,
    async (route) => handleApiRoute(route, role, options, state),
  );

  return state;
}

async function handleApiRoute(
  route: Route,
  role: TestRole,
  options: MockOptions,
  state: MockState,
) {
  const request = route.request();
  if (!["fetch", "xhr"].includes(request.resourceType())) {
    return route.fallback();
  }
  const url = new URL(request.url());
  const path = url.pathname;
  if (
    path.startsWith("/src/") ||
    path.startsWith("/node_modules/") ||
    path.startsWith("/@") ||
    path.startsWith("/@fs/") ||
    path.startsWith("/assets/") ||
    /\.(js|ts|tsx|css|map|png|jpg|jpeg|webp|svg|woff2?)$/i.test(path)
  ) {
    return route.fallback();
  }
  const method = request.method();

  if (method === "POST" && path === "/auth/login") {
    const body = readJson(request);
    const matchedRole =
      (Object.entries(users).find(([, user]) => user.email === body.email)?.[0] as
        | TestRole
        | undefined) ?? role;
    state.activeAuthProvider = "LOCAL";
    return ok(route, sessionFor(matchedRole), "Login successful");
  }

  if (method === "POST" && path === "/auth/google") {
    state.activeAuthProvider = "GOOGLE";
    return ok(route, googleSessionFor(role), "Login successful");
  }

  if (method === "POST" && path === "/auth/refresh") {
    state.refreshCount += 1;
    if (options.refreshFails) return fail(route, 401, "Refresh token expired");
    return ok(
      route,
      state.activeAuthProvider === "GOOGLE"
        ? googleSessionFor(role)
        : sessionFor(role),
      "Token refreshed",
    );
  }

  if (method === "POST" && path === "/auth/logout") return ok(route, true);

  if (path === "/users/me" && method === "GET") return ok(route, users[role]);
  if (path === "/users/me/role-requests" && method === "GET") return ok(route, state.roleRequests);
  if (path === "/users/me/hr-promotion-requests" && method === "GET") {
    return ok(route, state.roleRequests.filter((request) => request.type === "HR_PROMOTION"));
  }
  if (path === "/users/me/manager-upgrade-requests" && method === "POST") {
    const request = {
      id: 100 + state.roleRequests.length,
      requesterUserId: users[role].id,
      targetUserId: users[role].id,
      requesterName: users[role].name,
      targetName: users[role].name,
      requestedRole: "manager",
      type: "MANAGER_UPGRADE",
      status: "PENDING_SYSADMIN",
      createdAt: new Date().toISOString(),
    };
    state.roleRequests.push(request);
    return ok(route, request);
  }
  if (path === "/users/admin/role-requests" && method === "GET") return ok(route, state.roleRequests);
  if (path.includes("/users/admin/role-requests/") && method === "PATCH") {
    const id = Number(path.split("/").at(-2));
    const status = path.endsWith("/approve") ? "APPROVED" : "REJECTED";
    state.roleRequests = state.roleRequests.map((request) =>
      request.id === id ? { ...request, status } : request,
    );
    return ok(route, state.roleRequests.find((request) => request.id === id) ?? null);
  }
  if (path.includes("/users/me/hr-promotion-requests/") && method === "PATCH") {
    const id = Number(path.split("/").at(-2));
    const status = path.endsWith("/accept") ? "APPROVED" : "REJECTED";
    state.roleRequests = state.roleRequests.map((request) =>
      request.id === id ? { ...request, status } : request,
    );
    return ok(route, state.roleRequests.find((request) => request.id === id) ?? null);
  }
  if (path === "/users/me/leave-hr" && method === "PATCH") {
    return ok(route, { ...users.user, id: users[role].id, role: "user" });
  }

  if (path === "/users" && method === "GET") return ok(route, state.users);
  if (path.startsWith("/users/") && method === "GET") {
    const id = Number(path.split("/").at(-1));
    return ok(route, state.users.find((user) => user.id === id) ?? null);
  }
  if (path.startsWith("/users/") && method === "PATCH") return ok(route, true);
  if (path === "/users/admin/accounts" && method === "POST") {
    const body = readJson(request);
    const user = {
      id: 100 + state.users.length,
      name: body.name,
      email: body.email,
      role: body.role ?? "user",
      active: true,
      status: "ACTIVE",
      idEmployee: body.employeeId,
    };
    state.users.push(user);
    return ok(route, user);
  }
  if (path.startsWith("/users/") && method === "DELETE") return ok(route, true);

  if (path === "/profiles/me" && method === "GET") {
    if (options.profileMissing) return fail(route, 404, "PROFILE_NOT_FOUND");
    return ok(route, state.profile);
  }
  if (path === "/profiles/me" && ["POST", "PATCH"].includes(method)) {
    const body = readJson(request);
    state.profile = { ...state.profile, ...body, id: state.profile.id };
    return ok(route, state.profile);
  }
  if (path === "/profiles/me/avatar" && method === "POST") {
    state.profile = { ...state.profile, url: "avatar.png" };
    return ok(route, state.profile);
  }
  if (path === "/profiles/batch" && method === "GET") return ok(route, [state.profile]);
  if (path.startsWith("/profiles/") && method === "GET") return ok(route, state.profile);
  if (path === "/profiles" && method === "GET") return ok(route, [state.profile]);

  if (path === "/project/user/getProfile") return ok(route, [state.profile]);
  if (path === "/project/user/getProject") return ok(route, state.projects);
  if (path === "/project/user/get1") return ok(route, "ok");
  if (path === "/project/user/projects" && method === "GET") return ok(route, state.projects);
  if (path === "/project/user/projects" && method === "POST") {
    const body = readJson(request);
    const project = { ...body, id: 900 + state.projects.length, createAt: new Date().toISOString() };
    state.projects.push(project);
    return ok(route, project);
  }
  if (path.startsWith("/project/user/projects/") && method === "GET") {
    const id = Number(path.split("/").at(-1));
    return ok(route, state.projects.find((project) => project.id === id) ?? null);
  }
  if (path.startsWith("/project/user/projects/") && method === "PATCH") {
    const id = Number(path.split("/").at(-1));
    const body = readJson(request);
    state.projects = state.projects.map((project) =>
      project.id === id ? { ...project, ...body, id } : project,
    );
    return ok(route, state.projects.find((project) => project.id === id));
  }
  if (path.startsWith("/project/user/projects/") && method === "DELETE") {
    const id = Number(path.split("/").at(-1));
    state.projects = state.projects.filter((project) => project.id !== id);
    return ok(route, null);
  }
  if (path === "/project/user/save" && method === "POST") {
    const body = readJson(request);
    const project = { ...body, id: 900 + state.projects.length, createAt: new Date().toISOString() };
    state.projects.push(project);
    return ok(route, project);
  }
  if (path === "/project/user/update" && method === "POST") {
    const body = readJson(request);
    state.projects = state.projects.map((project) =>
      project.id === body.id ? { ...project, ...body } : project,
    );
    return ok(route, state.projects.find((project) => project.id === body.id));
  }

  if (path === "/notification/user/findByUser") return ok(route, state.notifications);
  if (path === "/notification/update" && method === "POST") {
    const body = readJson(request);
    state.notifications = state.notifications.map((item) =>
      item.id === body.id ? { ...item, ...body } : item,
    );
    return ok(route, body);
  }

  if (path === "/manager/user/company/getcompany") return ok(route, state.companies);
  if (path === "/manager/user/company/getbyid") {
    const id = Number(url.searchParams.get("id"));
    return ok(route, state.companies.find((company) => company.id === id) ?? null);
  }
  if (path === "/manager/user/company/getcompanybytype") return ok(route, state.companies);
  if (path === "/manager/manager/company/me") return ok(route, state.companies[0]);
  if (path === "/manager/company/getcompanybyidmanager") return ok(route, state.companies[0]);
  if (path === "/manager/hr/findByIdHr") {
    if (options.hrUnassigned) return fail(route, 404, "HR company not assigned");
    return ok(route, state.companies[0]);
  }
  if (path === "/manager/manager/company/update" && method === "POST") {
    const body = readJson(request);
    state.companies = state.companies.map((company) =>
      company.id === body.id ? { ...company, ...body } : company,
    );
    return ok(route, body);
  }
  if (path === "/manager/admin/company/create" && method === "POST") {
    const company = { ...state.companies[0], id: 900 + state.companies.length, name: "Created Company" };
    state.companies.push(company);
    return ok(route, company);
  }
  if (path === "/manager/admin/company/delete" && method === "POST") return ok(route, true);
  if (path.includes("sethrto") || path.includes("setmaanagerto")) return ok(route, true);
  if (path === "/manager/manager/hr-candidates" && method === "GET") return ok(route, state.users);
  if (path === "/manager/manager/hr-promotions" && method === "POST") {
    const targetUserId = Number(url.searchParams.get("targetUserId"));
    const target = state.users.find((user) => user.id === targetUserId) ?? state.users[0];
    const request = {
      id: 100 + state.roleRequests.length,
      requesterUserId: users[role].id,
      targetUserId,
      requesterName: users[role].name,
      targetName: target.name,
      requestedRole: "hr",
      type: "HR_PROMOTION",
      status: "PENDING_USER_CONFIRMATION",
      companyId: state.companies[0].id,
      companyName: state.companies[0].name,
      createdAt: new Date().toISOString(),
    };
    state.roleRequests.push(request);
    return ok(route, request);
  }
  if (path.includes("/manager/user/hr-promotions/") && method === "PATCH") return ok(route, state.companies[0]);
  if (path === "/manager/hr/leave" && method === "PATCH") return ok(route, state.companies[0]);

  if (path === "/manager/user/job/getall") return ok(route, state.jobs);
  if (path === "/manager/user/job/getnewjob") return ok(route, state.jobs);
  if (path === "/manager/user/job/findbyid") {
    const id = Number(url.searchParams.get("id"));
    return ok(route, state.jobs.find((job) => job.id === id) ?? null);
  }
  if (path === "/manager/user/job/getjobbycompany") {
    const id = Number(url.searchParams.get("id"));
    return ok(route, state.jobs.filter((job) => job.idCompany === id));
  }
  if (path === "/manager/user/job/getjobpending") {
    return ok(route, state.jobs.filter((job) => job.idProfiePending.includes(state.profile.id)));
  }
  if (path === "/manager/user/job/getjobaccepted") {
    return ok(route, state.jobs.filter((job) => job.idProfile.includes(state.profile.id)));
  }
  if (path === "/manager/user/job/apply" && method === "PUT") {
    const jobId = Number(url.searchParams.get("jobDTO"));
    const profileId = Number(url.searchParams.get("idProfile"));
    state.jobs = state.jobs.map((job) =>
      job.id === jobId
        ? { ...job, idProfiePending: unique([...job.idProfiePending, profileId]) }
        : job,
    );
    return ok(route, state.jobs.find((job) => job.id === jobId));
  }
  if (path.includes("/manager/user/jobs/") && path.endsWith("/application-status")) {
    const jobId = Number(path.split("/").at(-2));
    const job = state.jobs.find((item) => item.id === jobId);
    if (job?.idProfile.includes(state.profile.id)) return ok(route, "ACCEPTED");
    if (job?.idProfiePending.includes(state.profile.id)) return ok(route, "PENDING");
    return ok(route, "NONE");
  }
  if (path.includes("/manager/user/jobs/") && path.endsWith("/applications") && method === "POST") {
    const jobId = Number(path.split("/").at(-2));
    state.jobs = state.jobs.map((job) =>
      job.id === jobId
        ? { ...job, idProfiePending: unique([...job.idProfiePending, state.profile.id]) }
        : job,
    );
    return ok(route, state.jobs.find((job) => job.id === jobId));
  }
  if (path.includes("/manager/user/jobs/") && path.endsWith("/leave") && method === "POST") {
    const jobId = Number(path.split("/").at(-2));
    state.jobs = state.jobs.map((job) =>
      job.id === jobId
        ? {
            ...job,
            idProfiePending: job.idProfiePending.filter((id) => id !== state.profile.id),
            idProfile: job.idProfile.filter((id) => id !== state.profile.id),
          }
        : job,
    );
    return ok(route, state.jobs.find((job) => job.id === jobId));
  }
  if (path === "/manager/hr/job/create" && method === "POST") {
    const body = readJson(request);
    const job = { ...body, id: 900 + state.jobs.length };
    state.jobs.push(job);
    return ok(route, job);
  }
  if (path === "/manager/hr/job/update" && method === "POST") {
    const body = readJson(request);
    state.jobs = state.jobs.map((job) => (job.id === body.id ? { ...job, ...body } : job));
    return ok(route, body);
  }
  if (path === "/manager/hr/job/delete" && method === "POST") {
    const id = Number(url.searchParams.get("id"));
    state.jobs = state.jobs.filter((job) => job.id !== id);
    return ok(route, true);
  }
  if (path === "/manager/hr/job/accept" && method === "PUT") {
    const jobId = Number(url.searchParams.get("jobDTO"));
    const profileId = Number(url.searchParams.get("idProfile"));
    state.jobs = state.jobs.map((job) =>
      job.id === jobId
        ? {
            ...job,
            idProfiePending: job.idProfiePending.filter((id) => id !== profileId),
            idProfile: unique([...job.idProfile, profileId]),
          }
        : job,
    );
    return ok(route, true);
  }
  if (path === "/manager/hr/job/reject" && method === "PUT") return ok(route, true);

  return fail(route, 404, `Unhandled mock route ${method} ${path}`);
}

function unique(values: number[]) {
  return Array.from(new Set(values));
}

function readJson(request: Route["request"] extends () => infer T ? T : never) {
  try {
    return request.postDataJSON();
  } catch {
    return {};
  }
}

function ok(route: Route, data: unknown, message = "OK") {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, message, data }),
  });
}

function fail(route: Route, status: number, message: string) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ success: false, message, data: null }),
  });
}
