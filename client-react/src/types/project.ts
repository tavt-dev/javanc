export interface ProjectDTO {
  id: number;
  title: string;
  description?: string;
  createAt?: string;
  url?: string;
  imageId?: string;
  display: boolean;
  idProfile: number;
}

export interface ProjectFormValues {
  title: string;
  description?: string;
  url?: string;
  display: boolean;
}
