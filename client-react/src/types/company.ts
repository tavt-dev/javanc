export interface CompanyDTO {
  id: number;
  name: string;
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
}

export interface CompanyFormValues {
  name: string;
  type?: string;
  description?: string;
  street?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  image?: File | null;
}
