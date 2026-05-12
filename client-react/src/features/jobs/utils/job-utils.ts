import type { JobApplicationState, JobDTO } from "@/types/job";

export function getJobApplicationState(
  job: JobDTO,
  profileId?: number | null,
): JobApplicationState {
  if (profileId && job.idProfile?.includes(profileId)) return "accepted";
  if (profileId && job.idProfiePending?.includes(profileId)) return "pending";
  if ((job.size ?? 0) <= 0) return "closed";
  return "open";
}

export function isJobOpen(job: JobDTO) {
  return (job.size ?? 0) > 0;
}

export function getPendingApplicantCount(job: JobDTO) {
  return job.idProfiePending?.length ?? 0;
}

export function getAcceptedApplicantCount(job: JobDTO) {
  return job.idProfile?.length ?? 0;
}

export function filterJobs(
  jobs: JobDTO[],
  filters: {
    query?: string;
    type?: string;
    companyId?: string;
    openOnly?: boolean;
  },
) {
  const query = filters.query?.trim().toLowerCase();
  return jobs.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query) ||
      (job.description ?? "").toLowerCase().includes(query);
    const matchesType = !filters.type || job.typeJob === filters.type;
    const matchesCompany =
      !filters.companyId || String(job.idCompany) === filters.companyId;
    const matchesOpen = !filters.openOnly || isJobOpen(job);
    return matchesQuery && matchesType && matchesCompany && matchesOpen;
  });
}
