export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type User = {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  active?: boolean;
  status?: string;
  role?: string;
  idEmployee?: string;
};

export type AuthenticationResponse = {
  accessToken?: string;
  statusCode?: number;
  error?: string;
  message?: string;
  token?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresInSeconds?: number;
  expirationTime?: string;
  user?: User;
  isVaild?: boolean;
  role?: string;
};

export type RegistrationPending = {
  email: string;
  status: string;
  expiresInSeconds: number;
};

export type SavedAccount = {
  key: string;
  label: string;
  email?: string;
  role?: string;
  credentials?: {
    email: string;
    password: string;
  };
  auth?: AuthenticationResponse;
  savedAt: string;
};

export type Contact = {
  id?: number;
  address?: string;
  phone?: string;
  email?: string;
  profileID?: number;
};

export type Profile = {
  id?: number;
  objective?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  name?: string;
  typeProfile?: string;
  idUser?: number;
  url?: string;
  title?: string;
  contact?: Contact;
};

export type Project = {
  id?: number;
  title?: string;
  description?: string;
  createAt?: string;
  url?: string;
  imageId?: number;
  display?: boolean;
  idProfile?: number;
};

export type Company = {
  id?: number;
  name?: string;
  type?: string;
  description?: string;
  street?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  url?: string;
  idManager?: number;
  idHR?: number[];
  idJobs?: number[];
  image?: string | File;
};

export type RoleRequest = {
  id?: number;
  requesterUserId?: number;
  targetUserId?: number;
  requesterName?: string;
  requesterEmail?: string;
  targetName?: string;
  targetEmail?: string;
  requestedRole?: string;
  type?: "MANAGER_UPGRADE" | "HR_PROMOTION" | string;
  status?: "PENDING_SYSADMIN" | "PENDING_USER_CONFIRMATION" | "APPROVED" | "REJECTED" | "CANCELLED" | string;
  companyId?: number;
  companyName?: string;
  reason?: string;
  adminNote?: string;
  decidedByUserId?: number;
  createdAt?: string;
  updatedAt?: string;
  decidedAt?: string;
};

export type Job = {
  id?: number;
  title?: string;
  description?: string;
  typeJob?: string;
  size?: number;
  idProfiePending?: number[];
  idProfile?: number[];
  idCompany?: number;
};

export type Notification = {
  id?: number;
  message?: string;
  createAt?: string;
  url?: string;
  idUser?: number;
  read?: boolean;
};

export type DashboardStats = {
  users: number;
  profiles: number;
  companies: number;
  jobs: number;
};
