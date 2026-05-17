import { Building, Search, Send, UserPlus, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { EmptyState } from "@/components/shared/EmptyState";
import { InlineMetric } from "@/components/shared/InlineMetric";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ManagementDialog } from "@/components/shared/ManagementDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { InternalAccountForm } from "@/features/users/components/InternalAccountForm";
import {
  useCreateHrAccountAndAssignMutation,
  useHrCandidatesQuery,
  useMyManagedCompanyQuery,
  useRequestHrPromotionMutation,
} from "@/features/companies/hooks/use-company-queries";
import type { InternalAccountFormValues } from "@/types/user";

export function ManageHRPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [debouncedCandidateSearch, setDebouncedCandidateSearch] = useState("");
  const companyQuery = useMyManagedCompanyQuery();
  const company = companyQuery.data ?? null;
  const assignMutation = useCreateHrAccountAndAssignMutation(company?.id ?? 0);
  const candidatesQuery = useHrCandidatesQuery(
    debouncedCandidateSearch,
    Boolean(company),
  );
  const candidates = candidatesQuery.data?.items ?? [];
  const requestHrMutation = useRequestHrPromotionMutation();

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedCandidateSearch(candidateSearch),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [candidateSearch]);

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

      <section className="surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Invite existing users</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Search normal user accounts and send an HR promotion invitation.
            </p>
          </div>
          <div className="relative sm:w-80">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="form-input pl-9"
              value={candidateSearch}
              onChange={(event) => setCandidateSearch(event.target.value)}
              placeholder="Search by name or email"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {candidatesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading candidates...</p>
          ) : candidatesQuery.error ? (
            <p className="text-sm text-destructive">
              Unable to load HR candidates.
            </p>
          ) : candidates.length ? (
            candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="flex flex-col gap-3 rounded-md border border-border bg-background/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium">{candidate.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {candidate.email}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={requestHrMutation.isPending}
                  onClick={() => requestHrMutation.mutate(candidate.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                >
                  <Send size={15} />
                  Invite HR
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No candidates found.
            </p>
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
