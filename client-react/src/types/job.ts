export type TypeJob = "java" | "python" | "php";

export interface JobDTO {
  id: number;
  title: string;
  description?: string;
  typeJob?: TypeJob;
  size?: number;
  idProfiePending?: number[];
  idProfile?: number[];
  idCompany: number;
}

export type JobApplicationState =
  | "accepted"
  | "pending"
  | "closed"
  | "open";

export interface JobFormValues {
  title: string;
  description?: string;
  typeJob: TypeJob;
  size: number;
}
