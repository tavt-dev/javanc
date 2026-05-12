import { describe, expect, it } from "vitest";
import {
  filterCompanies,
  getCompanyLocation,
} from "@/features/companies/utils/company-utils";
import type { CompanyDTO } from "@/types/company";

const companies: CompanyDTO[] = [
  {
    id: 1,
    name: "JavaNC",
    type: "Software",
    city: "Hanoi",
    country: "Vietnam",
  },
  {
    id: 2,
    name: "DataWorks",
    type: "Analytics",
    city: "Singapore",
    country: "Singapore",
  },
];

describe("company-utils", () => {
  it("formats location safely", () => {
    expect(getCompanyLocation(companies[0]!)).toBe("Hanoi, Vietnam");
    expect(getCompanyLocation({ id: 3, name: "No Location" })).toBe("-");
  });

  it("filters companies by query, type, and location", () => {
    expect(
      filterCompanies(companies, {
        query: "java",
        type: "Software",
        location: "viet",
      }),
    ).toEqual([companies[0]!]);
  });
});
