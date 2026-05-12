import type { CompanyDTO } from "@/types/company";

export function getCompanyLocation(company: CompanyDTO) {
  return [company.city, company.country].filter(Boolean).join(", ") || "-";
}

export function filterCompanies(
  companies: CompanyDTO[],
  filters: { query?: string; type?: string; location?: string },
) {
  const query = filters.query?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();
  return companies.filter((company) => {
    const haystack = [
      company.name,
      company.type,
      company.description,
      company.city,
      company.country,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const locationHaystack = [company.city, company.country]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesType = !filters.type || company.type === filters.type;
    const matchesLocation = !location || locationHaystack.includes(location);
    return matchesQuery && matchesType && matchesLocation;
  });
}

export function formatCompanyLocation(company: {
  street?: string;
  city?: string;
  country?: string;
}) {
  return [company.street, company.city, company.country].filter(Boolean).join(", ");
}
