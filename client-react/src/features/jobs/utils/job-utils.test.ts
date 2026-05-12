import { describe, expect, it } from "vitest";
import {
  filterJobs,
  getJobApplicationState,
  isJobOpen,
} from "@/features/jobs/utils/job-utils";
import type { JobDTO } from "@/types/job";

const baseJob: JobDTO = {
  id: 1,
  title: "Java Developer",
  description: "Build Quarkus services",
  typeJob: "java",
  size: 2,
  idCompany: 10,
};

describe("job-utils", () => {
  it("detects pending, accepted, closed, and open states", () => {
    expect(
      getJobApplicationState({ ...baseJob, idProfiePending: [7] }, 7),
    ).toBe("pending");
    expect(getJobApplicationState({ ...baseJob, idProfile: [7] }, 7)).toBe(
      "accepted",
    );
    expect(getJobApplicationState({ ...baseJob, size: 0 }, 7)).toBe("closed");
    expect(getJobApplicationState(baseJob, 7)).toBe("open");
  });

  it("detects open jobs by positive size", () => {
    expect(isJobOpen(baseJob)).toBe(true);
    expect(isJobOpen({ ...baseJob, size: 0 })).toBe(false);
  });

  it("filters jobs by query, type, company, and open state", () => {
    const jobs: JobDTO[] = [
      baseJob,
      {
        id: 2,
        title: "Python Analyst",
        typeJob: "python",
        size: 0,
        idCompany: 11,
      },
    ];

    expect(
      filterJobs(jobs, {
        query: "quarkus",
        type: "java",
        companyId: "10",
        openOnly: true,
      }),
    ).toEqual([baseJob]);
  });
});
