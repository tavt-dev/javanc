export type TypeProfile = "JAVA" | "PYTHON" | "C";

export interface Contact {
  id?: number;
  address?: string;
  phone?: string;
  email?: string;
}

export interface ProfileDTO {
  id: number;
  objective?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  name?: string;
  contact?: Contact;
  typeProfile?: TypeProfile;
  idUser: number;
  url?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileFormValues {
  title: string;
  typeProfile: TypeProfile;
  objective?: string;
  education?: string;
  workExperience?: string;
  skills?: string;
  contact?: Contact;
}

export interface ProfileSearchParams {
  type?: TypeProfile;
  title?: string;
  page?: number;
  size?: number;
}
