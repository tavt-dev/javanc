import { apiRequest, jsonBody } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import type {
  ApiResponse,
  AuthenticationResponse,
  Company,
  Job,
  Notification,
  Profile,
  Project,
  RegistrationPending,
  RoleRequest,
  User
} from "@/lib/types";

export type ListingSort = "newest" | "hot";

export const authApi = {
  signup: (user: User) =>
    apiRequest<RegistrationPending>("/auth/register", {
      method: "POST",
      auth: false,
      ...jsonBody(registerPayload(user))
    }),
  signin: (user: User) =>
    apiRequest<AuthenticationResponse>("/auth/login", {
      method: "POST",
      auth: false,
      ...jsonBody(loginPayload(user))
    }).then(normalizeAuthSession),
  verifyEmail: (email: string, otp: string) =>
    apiRequest<AuthenticationResponse>("/auth/verify-email", {
      method: "POST",
      auth: false,
      ...jsonBody({ email, otp })
    }).then(normalizeAuthSession),
  resendVerificationOtp: (email: string) =>
    apiRequest<void>("/auth/resend-verification-otp", {
      method: "POST",
      auth: false,
      ...jsonBody({ email })
    }),
  requestPasswordReset: (email: string) =>
    apiRequest<void>("/auth/password-reset/request", {
      method: "POST",
      auth: false,
      ...jsonBody({ email })
    }),
  confirmPasswordReset: (email: string, otp: string, password: string) =>
    apiRequest<void>("/auth/password-reset/confirm", {
      method: "POST",
      auth: false,
      ...jsonBody({ email, otp, password })
    }),
  currentUser: () => apiRequest<User>("/users/me"),
  getAll: () => apiRequest<User[]>("/users"),
  search: (params: { query?: string; role?: string; page?: number; size?: number } = {}) =>
    apiRequest<User[]>(`/users/search?${userSearchParams(params)}`),
  findById: (id: number) => apiRequest<User>(`/users/${id}`),
  update: (user: User) =>
    apiRequest<User>(`/users/${user.id}`, {
      method: "PATCH",
      ...jsonBody(userPayload(user))
    }),
  updateActive: (user: User) =>
    apiRequest<User>(`/users/${user.id}/status`, {
      method: "PATCH",
      ...jsonBody({ active: user.active })
    }),
  updateRole: (id: number, role: string) =>
    apiRequest<User>(`/users/${id}/role`, {
      method: "PATCH",
      ...jsonBody({ role })
    }),
  delete: (id: number) =>
    apiRequest<User>(`/users/${id}`, {
      method: "DELETE"
    })
};

function userSearchParams(params: { query?: string; role?: string; page?: number; size?: number }) {
  const search = new URLSearchParams();
  if (params.query) {
    search.set("query", params.query);
  }
  if (params.role) {
    search.set("role", params.role);
  }
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 10));
  return search.toString();
}

export const roleRequestApi = {
  createManagerUpgrade: (reason: string) =>
    apiRequest<RoleRequest>("/users/me/manager-upgrade-requests", {
      method: "POST",
      ...jsonBody({ reason })
    }),
  myRequests: () => apiRequest<RoleRequest[]>("/users/me/role-requests"),
  myHrPromotions: () => apiRequest<RoleRequest[]>("/users/me/hr-promotion-requests"),
  adminList: (params: { status?: string; type?: string } = {}) =>
    apiRequest<RoleRequest[]>(`/users/admin/role-requests?${roleRequestSearchParams(params)}`),
  approve: (id: number) =>
    apiRequest<RoleRequest>(`/users/admin/role-requests/${id}/approve`, {
      method: "PATCH"
    }),
  reject: (id: number, adminNote?: string) =>
    apiRequest<RoleRequest>(`/users/admin/role-requests/${id}/reject`, {
      method: "PATCH",
      ...jsonBody({ adminNote })
    }),
  acceptHrPromotion: (id: number) =>
    apiRequest<RoleRequest>(`/users/me/hr-promotion-requests/${id}/accept`, {
      method: "PATCH"
    }),
  rejectHrPromotion: (id: number) =>
    apiRequest<RoleRequest>(`/users/me/hr-promotion-requests/${id}/reject`, {
      method: "PATCH"
    })
};

function roleRequestSearchParams(params: { status?: string; type?: string }) {
  const search = new URLSearchParams();
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.type) {
    search.set("type", params.type);
  }
  return search.toString();
}

function loginPayload(user: User) {
  return {
    email: user.email,
    password: user.password
  };
}

function registerPayload(user: User) {
  return {
    name: user.name,
    email: user.email,
    password: user.password
  };
}

function userPayload(user: User) {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    employeeId: user.idEmployee
  };
}

function normalizeAuthSession(auth: AuthenticationResponse): AuthenticationResponse {
  if (!auth || auth.error || auth.statusCode || auth.isVaild === false) {
    throw new ApiError(auth?.message || auth?.error || "Unable to sign in", auth?.statusCode);
  }
  const token = auth.token ?? auth.accessToken;
  if (!token) {
    throw new ApiError(auth.message || "Login response did not include a session token");
  }

  return {
    ...auth,
    token,
    expirationTime: auth.expirationTime ?? (auth.expiresInSeconds ? String(auth.expiresInSeconds) : undefined),
    role: auth.role ?? auth.user?.role
  };
}

export const profileApi = {
  list: (params: { type?: string; title?: string; page?: number; size?: number; sort?: ListingSort } = {}) =>
    apiRequest<Profile[]>(`/profiles?${profileSearchParams(params)}`, { auth: false }),
  me: () => apiRequest<Profile>("/profiles/me"),
  findById: (id: number) => apiRequest<Profile>(`/profiles/${id}`, { auth: false }),
  findByUserId: (userId: number) => apiRequest<Profile>(`/profiles/by-user/${userId}`),
  findByType: (typeProfile: string) =>
    apiRequest<Profile[]>(`/profiles?${profileSearchParams({ type: typeProfile })}`),
  save: (profile: Profile) =>
    apiRequest<Profile>("/profiles/me", {
      method: "POST",
      ...jsonBody(profile)
    }),
  update: (profile: Profile) =>
    apiRequest<Profile>("/profiles/me", {
      method: "PATCH",
      ...jsonBody(profile)
    }),
  deleteMe: () =>
    apiRequest<void>("/profiles/me", {
      method: "DELETE"
    }),
  uploadAvatar: (image: File) => {
    const formData = new FormData();
    formData.append("image", image);
    return apiRequest<Profile>("/profiles/me/avatar", {
      method: "POST",
      body: formData
    });
  },
  pendingJobProfiles: (ids: number[]) =>
    apiRequest<Profile[]>(`/profiles/batch?${ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&")}`)
};

function profileSearchParams(params: { type?: string; title?: string; page?: number; size?: number; sort?: ListingSort }) {
  const search = new URLSearchParams();
  if (params.type) {
    search.set("type", params.type);
  }
  if (params.title) {
    search.set("title", params.title);
  }
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 20));
  if (params.sort) {
    search.set("sort", params.sort);
  }
  return search.toString();
}

export const projectApi = {
  myProjects: () => apiRequest<Project[]>("/project/user/projects"),
  findMine: (id: number) => apiRequest<Project>(`/project/user/projects/${id}`),
  createMine: (project: Project) =>
    apiRequest<Project>("/project/user/projects", {
      method: "POST",
      ...jsonBody(project)
    }),
  updateMine: (project: Project) =>
    apiRequest<Project>(`/project/user/projects/${project.id}`, {
      method: "PATCH",
      ...jsonBody(project)
    }),
  deleteMine: (id: number) =>
    apiRequest<void>(`/project/user/projects/${id}`, {
      method: "DELETE"
    }),
  save: (project: Project) =>
    apiRequest<Project>("/project/user/save", {
      method: "POST",
      ...jsonBody(project)
    }),
  update: (project: Project) =>
    apiRequest<Project>("/project/user/update", {
      method: "POST",
      ...jsonBody(project)
    }),
  byProfile: (id?: number) => apiRequest<Project[]>(`/project/user/getProject?id=${id ?? ""}`),
  profiles: () => apiRequest<Profile[]>("/project/user/getProfile")
};

export const imageApi = {
  upload: (image: File) => {
    const formData = new FormData();
    formData.append("image", image);
    return apiRequest<{ id?: number; url?: string }>("/image/save", {
      method: "POST",
      body: formData
    });
  },
  previewUrl: (url: string, width = 160) =>
    apiRequest<string>(`/image/preview?url=${encodeURIComponent(url)}&width=${encodeURIComponent(width)}`, {
      auth: false
    })
};

export const notificationApi = {
  create: (notification: Notification) =>
    apiRequest<string>("/notification/create", {
      method: "POST",
      ...jsonBody(notification)
    }),
  update: (notification: Notification) =>
    apiRequest<Notification>("/notification/update", {
      method: "POST",
      ...jsonBody(notification)
    }),
  byUser: (userId: number) => apiRequest<Notification[]>(`/notification/user/findByUser?userId=${userId}`),
  markRead: (id: number) =>
    apiRequest<Notification>(`/notification/seen?id=${id}`, {
      method: "POST"
    })
};

export const companyApi = {
  list: (params: { query?: string; type?: string; page?: number; size?: number; sort?: ListingSort } = {}) =>
    apiRequest<Company[]>(`/manager/user/company/getcompany?${listingSearchParams(params)}`, { auth: false }),
  byId: (id?: number) => apiRequest<Company>(`/manager/user/company/getbyid?id=${id ?? ""}`, { auth: false }),
  byType: (type: string, params: { query?: string; page?: number; size?: number; sort?: ListingSort } = {}) =>
    apiRequest<Company[]>(`/manager/user/company/getcompanybytype?${listingSearchParams({ ...params, type })}`, { auth: false }),
  byManager: (managerId?: number) =>
    apiRequest<Company>(`/manager/company/getcompanybyidmanager?managerId=${managerId ?? ""}`),
  myManagedCompany: () => apiRequest<Company>("/manager/manager/company/me"),
  hrCandidates: (query: string, page = 0, size = 10) =>
    apiRequest<User[]>(`/manager/manager/hr-candidates?${userSearchParams({ query, page, size })}`),
  byHr: (id: number) => apiRequest<Company>(`/manager/hr/findByIdHr?id=${id}`),
  create: (formData: FormData) =>
    apiRequest<Company>("/manager/admin/company/create", {
      method: "POST",
      body: formData
    }),
  update: (company: Company) =>
    apiRequest<Company>("/manager/manager/company/update", {
      method: "POST",
      ...jsonBody(company)
    }),
  delete: (id: number) =>
    apiRequest<string>(`/manager/admin/company/delete?id=${id}`, {
      method: "POST"
    }),
  setHr: (user: User, idCompany: number) =>
    apiRequest<Company>(`/manager/manager/sethrtocompany?idCompany=${idCompany}`, {
      method: "PUT",
      ...jsonBody(user)
    }),
  setManager: (user: User, idCompany: number) =>
    apiRequest<Company>(`/manager/manager/setmaanagertocompany?idCompany=${idCompany}`, {
      method: "PUT",
      ...jsonBody(user)
    }),
  promoteHr: (idUser: number, idCompany: number) =>
    apiRequest<Company>(`/manager/manager/promotehrtocompany?idUser=${idUser}&idCompany=${idCompany}`, {
      method: "PUT"
    }),
  requestHrPromotion: (targetUserId: number) =>
    apiRequest<RoleRequest>(`/manager/manager/hr-promotions?targetUserId=${targetUserId}`, {
      method: "POST"
    }),
  acceptHrPromotion: (requestId: number) =>
    apiRequest<Company>(`/manager/user/hr-promotions/${requestId}/accept`, {
      method: "PATCH"
    }),
  leaveHr: () =>
    apiRequest<Company>("/manager/hr/leave", {
      method: "PATCH"
    })
};

export const jobApi = {
  list: (params: { query?: string; page?: number; size?: number; sort?: ListingSort } = {}) =>
    apiRequest<Job[]>(`/manager/user/job/getall?${listingSearchParams(params)}`, { auth: false }),
  byId: (id: number) => apiRequest<Job>(`/manager/user/job/findbyid?id=${id}`, { auth: false }),
  byCompany: (id: number, params: { query?: string; page?: number; size?: number; sort?: ListingSort } = {}) =>
    apiRequest<Job[]>(`/manager/user/job/getjobbycompany?${listingSearchParams({ ...params, id })}`, { auth: false }),
  pending: (id: number) => apiRequest<Job[]>(`/manager/user/job/getjobpending?id=${id}`),
  accepted: (id: number) => apiRequest<Job[]>(`/manager/user/job/getjobaccepted?id=${id}`),
  newJobs: (id: number) => apiRequest<Job[]>(`/manager/user/job/getnewjob?id=${id}`),
  create: (job: Job) =>
    apiRequest<Job>("/manager/hr/job/create", {
      method: "POST",
      ...jsonBody(job)
    }),
  update: (job: Job) =>
    apiRequest<Job>("/manager/hr/job/update", {
      method: "POST",
      ...jsonBody(job)
    }),
  delete: (id: number) =>
    apiRequest<string>(`/manager/hr/job/delete?id=${id}`, {
      method: "POST"
    }),
  apply: (jobDTO: number, idProfile: number) =>
    apiRequest<Job>(`/manager/user/job/apply?jobDTO=${jobDTO}&idProfile=${idProfile}`, {
      method: "PUT"
    }),
  applyMine: (id: number) =>
    apiRequest<Job>(`/manager/user/jobs/${id}/applications`, {
      method: "POST"
    }),
  leaveMine: (id: number) =>
    apiRequest<Job>(`/manager/user/jobs/${id}/leave`, {
      method: "POST"
    }),
  applicationStatus: (id: number) =>
    apiRequest<"NONE" | "PENDING" | "ACCEPTED">(`/manager/user/jobs/${id}/application-status`),
  accept: (jobDTO: number, idProfile: number) =>
    apiRequest<Job>(`/manager/hr/job/accept?jobDTO=${jobDTO}&idProfile=${idProfile}`, {
      method: "PUT"
    }),
  reject: (jobDTO: number, idProfile: number) =>
    apiRequest<Job>(`/manager/hr/job/reject?jobDTO=${jobDTO}&idProfile=${idProfile}`, {
      method: "PUT"
    })
};

function listingSearchParams(params: {
  id?: number;
  query?: string;
  type?: string;
  page?: number;
  size?: number;
  sort?: ListingSort;
}) {
  const search = new URLSearchParams();
  if (params.id !== undefined) {
    search.set("id", String(params.id));
  }
  if (params.query) {
    search.set("query", params.query);
  }
  if (params.type) {
    search.set("type", params.type);
  }
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 20));
  if (params.sort) {
    search.set("sort", params.sort);
  }
  return search.toString();
}

export type Wrapped<T> = ApiResponse<T>;
