import { Building, Mail, MapPin, Phone, Save } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ManagementDialog } from "@/components/shared/ManagementDialog";
import { MetricTile } from "@/components/shared/MetricTile";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CompanyForm } from "@/features/companies/components/CompanyForm";
import {
  useManagerCompanyQuery,
  useUpdateCompanyMutation,
} from "@/features/companies/hooks/use-company-queries";
import { useAuthStore } from "@/stores/auth-store";
import type { CompanyFormValues } from "@/types/company";

export function MyCompanyPage() {
  const user = useAuthStore((s) => s.user);
  const [editing, setEditing] = useState(false);
  const companyQuery = useManagerCompanyQuery(user?.id);
  const updateMutation = useUpdateCompanyMutation();
  const company = companyQuery.data ?? null;

  if (companyQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="My Company" description="Loading company workspace." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (companyQuery.error) {
    return (
      <PageTransition>
        <PageHeader title="My Company" description="Manage your company." />
        <EmptyState
          icon={Building}
          title="No company assigned"
          description="This manager account has not been assigned to a company yet."
        />
      </PageTransition>
    );
  }

  if (!company) {
    return (
      <PageTransition>
        <RetryState error={new Error("Company not found")} onRetry={companyQuery.refetch} />
      </PageTransition>
    );
  }

  const submit = (values: CompanyFormValues) => {
    updateMutation.mutate(
      {
        ...company,
        ...values,
        idManager: company.idManager,
        idHR: company.idHR,
        idJobs: company.idJobs,
      },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <PageTransition>
      <PageHeader
        variant="console"
        eyebrow="Manager workspace"
        title={company.name}
        description="Company workspace and operational profile."
        actions={
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-primary focus-ring bg-white text-emerald-800 hover:bg-emerald-50"
          >
            <Save size={16} />
            Edit company
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile icon={Building} label="Jobs" value={company.idJobs?.length ?? 0} />
        <MetricTile icon={Building} label="HR accounts" value={company.idHR?.length ?? 0} />
        <MetricTile icon={Building} label="Manager ID" value={company.idManager ?? "None"} />
      </div>

      <section className="surface p-5">
        <div className="flex flex-wrap items-center gap-2">
          {company.type && <StatusBadge tone="primary">{company.type}</StatusBadge>}
          <StatusBadge tone={company.idManager ? "success" : "warning"}>
            {company.idManager ? "Assigned" : "Unassigned"}
          </StatusBadge>
        </div>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
          {company.description || "No company description provided."}
        </p>
        <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <Info icon={Mail} value={company.email || "No email"} />
          <Info icon={Phone} value={company.phone || "No phone"} />
          <Info icon={MapPin} value={[company.street, company.city, company.country].filter(Boolean).join(", ") || "No location"} />
        </div>
      </section>

      <ManagementDialog
        open={editing}
        title="Edit company"
        description="Update company information. Relationship fields are preserved."
        onClose={() => setEditing(false)}
      >
        <CompanyForm
          initialCompany={company}
          loading={updateMutation.isPending}
          onSubmit={submit}
          onCancel={() => setEditing(false)}
        />
      </ManagementDialog>
    </PageTransition>
  );
}

function Info({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-muted-foreground">
      <Icon size={16} />
      <span className="min-w-0 truncate">{value}</span>
    </div>
  );
}
