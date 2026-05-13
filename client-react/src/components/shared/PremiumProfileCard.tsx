import type { ReactNode } from "react";
import { PremiumJobCard } from "./PremiumJobCard";

export function PremiumProfileCard({ children }: { children: ReactNode }) {
  return <PremiumJobCard>{children}</PremiumJobCard>;
}
