import { Building, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { InlineMetric } from "@/components/shared/InlineMetric";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ManagementDialog } from "@/components/shared/ManagementDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { InternalAccountForm } from "@/features/users/components/InternalAccountForm";
import {
  useCreateHrAccountAndAssignMutation,
  useManagerCompanyQuery,
} from "@/features/companies/hooks/use-company-queries";
import { useAuthStore } from "@/stores/auth-store";
import type { InternalAccountFormValues } from "@/types/user";

export function ManageHRPage() {
  const user = useAuthStore((s) => s.user);
  const [dialogOpen, setDialogOpen] = useState(false);
  const companyQuery = useManagerCompanyQuery(user?.id);
  const company = companyQuery.data ?? null;
  const assignMutation = useCreateHrAccountAndAssignMutation(company?.id ?? 0);

  if (companyQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Manage HR" description="Loading HR assignment workspace." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (companyQuery.error || !company) {
    return (
      <PageTransition>
        <PageHeader title="Manage HR" description="Create HR accounts for your company." />
        <EmptyState
          icon={Building}
          title="No company assigned"
          description="This manager account needs an assigned company before creating HR accounts."
        />
      </PageTransition>
    );
  }

  const submit = (values: InternalAccountFormValues) => {
    assignMutation.mutate(values, { onSuccess: () => setDialogOpen(false) });
  };

  return (
    <PageTransition>
      <PageHeader
        title="Manage HR"
        description={`Create HR accounts and assign them to ${company.name}.`}
        actions={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <UserPlus size={16} />
            Create HR account
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <InlineMetric icon={Users} label="Assigned HR" value={company.idHR?.length ?? 0} />
        <InlineMetric icon={Building} label="Company" value={company.name} />
      </div>

      <section className="surface p-5">
        <h2 className="text-lg font-semibold">Assigned HR accounts</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {company.idHR?.length ? (
            company.idHR.map((hrId) => (
              <div key={hrId} className="rounded-md border border-border px-3 py-3 text-sm">
                <p className="font-medium">HR user #{hrId}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  User details are admin-only in the current backend.
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No HR accounts assigned yet.</p>
          )}
        </div>
      </section>

      <ManagementDialog
        open={dialogOpen}
        title="Create HR account"
        description="The backend creates a new HR user and assigns it to this company."
        onClose={() => setDialogOpen(false)}
      >
        <InternalAccountForm
          fixedRole="hr"
          loading={assignMutation.isPending}
          submitLabel="Create and assign"
          onSubmit={submit}
          onCancel={() => setDialogOpen(false)}
        />
      </ManagementDialog>
    </PageTransition>
  );
}
