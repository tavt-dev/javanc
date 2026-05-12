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
  role?: string;
  idEmployee?: string;
};

export type AuthenticationResponse = {
  statusCode?: number;
  error?: string;
  message?: string;
  token?: string;
  refreshToken?: string;
  expirationTime?: string;
  user?: User;
  isVaild?: boolean;
  role?: string;
};

export type SavedAccount = {
  key: string;
  label: string;
  email?: string;
  role?: string;
  auth: AuthenticationResponse;
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
  idManager?: number;
  idHR?: number[];
  idJobs?: number[];
  image?: string | File;
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
