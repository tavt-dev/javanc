import { apiRequest, jsonBody } from "@/lib/api-client";
import type {
  ApiResponse,
  AuthenticationResponse,
  Company,
  Job,
  Notification,
  Profile,
  Project,
  User
} from "@/lib/types";
import { getToken } from "@/lib/storage";

function tokenParam() {
  const token = getToken();
  return token ? `token=${encodeURIComponent(token)}` : "token=";
}

export const authApi = {
  signup: (user: User) =>
    apiRequest<AuthenticationResponse>("/auth/signup", {
      method: "POST",
      auth: false,
      ...jsonBody(authPayload(user))
    }),
  signin: (user: User) =>
    apiRequest<AuthenticationResponse>("/auth/signin", {
      method: "POST",
      auth: false,
      ...jsonBody(authPayload(user))
    }),
  currentUser: () => apiRequest<User>("/auth/getCurrentUser"),
  getAll: () => apiRequest<User[]>(`/auth/getAll?${tokenParam()}`),
  findById: (id: number) => apiRequest<User>(`/auth/findbyid?id=${id}&${tokenParam()}`),
  update: (user: User) =>
    apiRequest<User>(`/auth/update?${tokenParam()}`, {
      method: "POST",
      ...jsonBody(user)
    }),
  updateActive: (user: User) =>
    apiRequest<User>(`/auth/updateactive?${tokenParam()}`, {
      method: "POST",
      ...jsonBody(user)
    }),
  delete: (id: number) =>
    apiRequest<User>(`/auth/delete?${tokenParam()}&id=${id}`, {
      method: "DELETE"
    })
};

function authPayload(user: User) {
  return {
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role?.toLowerCase(),
    idEmployee: user.idEmployee
  };
}

export const profileApi = {
  list: () => apiRequest<Profile[]>("/profile/user/getAll"),
  findById: (id: number) => apiRequest<Profile>(`/profile/user/findById?id=${id}`),
  findByUserId: (userId: number) => apiRequest<Profile>(`/profile/user/findByUserId?userId=${userId}`),
  findByType: (typeProfile: string) =>
    apiRequest<Profile[]>(`/profile/user/findProfileByType?typeProfile=${encodeURIComponent(typeProfile)}`),
  save: (formData: FormData) =>
    apiRequest<Profile>("/profile/user/save", {
      method: "POST",
      body: formData
    }),
  update: (formData: FormData) =>
    apiRequest<Profile>("/profile/user/update", {
      method: "POST",
      body: formData
    }),
  pendingJobProfiles: (ids: number[]) =>
    apiRequest<Profile[]>(`/profile/manager/getProfileByIdPendingJob?ids=${ids.join(",")}`)
};

export const projectApi = {
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
  }
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
  byUser: (userId: number) => apiRequest<Notification[]>(`/notification/user/findByUser?userId=${userId}`)
};

export const companyApi = {
  list: () => apiRequest<Company[]>("/manager/user/company/getcompany"),
  byId: (id?: number) => apiRequest<Company>(`/manager/user/company/getbyid?id=${id ?? ""}`),
  byType: (type: string) => apiRequest<Company[]>(`/manager/user/company/getcompanybytype?type=${type}`),
  byManager: (managerId?: number) =>
    apiRequest<Company>(`/manager/company/getcompanybyidmanager?managerId=${managerId ?? ""}`),
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
    })
};

export const jobApi = {
  list: () => apiRequest<Job[]>("/manager/user/job/getall"),
  byId: (id: number) => apiRequest<Job>(`/manager/user/job/findbyid?id=${id}`),
  byCompany: (id: number) => apiRequest<Job[]>(`/manager/user/job/getjobbycompany?id=${id}`),
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
  accept: (jobDTO: number, idProfile: number) =>
    apiRequest<Job>(`/manager/hr/job/accept?jobDTO=${jobDTO}&idProfile=${idProfile}`, {
      method: "PUT"
    }),
  reject: (jobDTO: number, idProfile: number) =>
    apiRequest<Job>(`/manager/hr/job/reject?jobDTO=${jobDTO}&idProfile=${idProfile}`, {
      method: "PUT"
    })
};

export type Wrapped<T> = ApiResponse<T>;
