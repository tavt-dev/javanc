import { ArrowRight, Building2, Mail, MapPin, Phone } from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motionPresets } from "@/components/motion/motion-presets";
import { getCompanyLocation } from "@/features/companies/utils/company-utils";
import type { CompanyDTO } from "@/types/company";

export function CompanyCard({ company }: { company: CompanyDTO }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : motionPresets.card.hover}
      transition={motionPresets.card.transition}
      className="interactive-card border-t-2 border-t-primary/40 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Building2 size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-foreground">
            {company.name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {company.type && <StatusBadge tone="primary">{company.type}</StatusBadge>}
            <StatusBadge tone="neutral">
              {`${company.idJobs?.length ?? 0} jobs`}
            </StatusBadge>
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 min-h-12 text-sm text-muted-foreground">
        {company.description || "No company description yet."}
      </p>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <Meta icon={MapPin} value={getCompanyLocation(company)} />
        {company.email && <Meta icon={Mail} value={company.email} />}
        {company.phone && <Meta icon={Phone} value={company.phone} />}
      </div>

      <Link
        to={`/companies/${company.id}`}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md text-sm font-medium text-primary hover:underline"
      >
        View company
        <ArrowRight size={15} />
      </Link>
    </motion.article>
  );
}

function Meta({
  icon: Icon,
  value,
}: {
  icon: ElementType;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={14} className="shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}
