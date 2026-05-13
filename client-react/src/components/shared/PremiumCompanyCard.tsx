import type { ReactNode } from "react";
import { PremiumJobCard } from "./PremiumJobCard";

export function PremiumCompanyCard({ children }: { children: ReactNode }) {
  return <PremiumJobCard>{children}</PremiumJobCard>;
}
