import { createColumnHelper } from "@tanstack/react-table";
import { Briefcase, FileEdit, Plus, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PageTransition } from "@/components/motion/PageTransition";
import { BrandPanel } from "@/components/shared/BrandPanel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ManagementDialog } from "@/components/shared/ManagementDialog";
import { MetricTile } from "@/components/shared/MetricTile";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { JobForm } from "@/features/jobs/components/JobForm";
import {
  useCreateJobMutation,
  useDeleteJobMutation,
  useJobsByCompanyQuery,
  useUpdateJobMutation,
} from "@/features/jobs/hooks/use-job-queries";
import { getAcceptedApplicantCount, getPendingApplicantCount } from "@/features/jobs/utils/job-utils";
import { useHrCompanyQuery } from "@/features/companies/hooks/use-company-queries";
import { useAuthStore } from "@/stores/auth-store";
import type { JobDTO, JobFormValues } from "@/types/job";

const columnHelper = createColumnHelper<JobDTO>();

export function ManageJobsPage() {
  const user = useAuthStore((s) => s.user);
  const [search, setSearch] = useState("");
  const [editingJob, setEditingJob] = useState<JobDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteJob, setDeleteJob] = useState<JobDTO | null>(null);

  const companyQuery = useHrCompanyQuery(user?.id);
  const company = companyQuery.data ?? null;
  const jobsQuery = useJobsByCompanyQuery(company?.id);
  const jobs = useMemo(() => jobsQuery.data ?? [], [jobsQuery.data]);
  const createMutation = useCreateJobMutation(company?.id ?? 0);
  const updateMutation = useUpdateJobMutation(company?.id ?? 0);
  const deleteMutation = useDeleteJobMutation(company?.id ?? 0);

  const filteredJobs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return jobs.filter(
      (job) =>
        !term ||
        job.title.toLowerCase().includes(term) ||
        (job.description ?? "").toLowerCase().includes(term) ||
        (job.typeJob ?? "").toLowerCase().includes(term),
    );
  }, [jobs, search]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Job",
        cell: ({ row }) => (
          <div className="min-w-44">
            <p className="font-medium text-foreground">{row.original.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.description || "No description"}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("typeJob", {
        header: "Type",
        cell: ({ getValue }) =>
          getValue() ? <StatusBadge tone="primary">{getValue() ?? ""}</StatusBadge> : "-",
      }),
      columnHelper.accessor("size", {
        header: "Openings",
        cell: ({ getValue }) => getValue() ?? 0,
      }),
      columnHelper.display({
        id: "applicants",
        header: "Applicants",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {getPendingApplicantCount(row.original)} pending /{" "}
            {getAcceptedApplicantCount(row.original)} accepted
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/hr/jobs/${row.original.id}/applicants`}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent"
            >
              <Users size={13} />
              Review
            </Link>
            <button
              type="button"
              onClick={() => {
                setEditingJob(row.original);
                setDialogOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent"
            >
              <FileEdit size={13} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteJob(row.original)}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        ),
      }),
    ],
    [],
  );

  const submitJob = (values: JobFormValues) => {
    if (!company) return;
    const payload: JobDTO = editingJob
      ? { ...editingJob, ...values, idCompany: company.id }
      : {
          id: 0,
          ...values,
          idCompany: company.id,
          idProfiePending: [],
          idProfile: [],
        };
    const mutation = editingJob ? updateMutation : createMutation;
    mutation.mutate(payload, {
      onSuccess: () => {
        setDialogOpen(false);
        setEditingJob(null);
      },
    });
  };

  if (companyQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="Manage Jobs" description="Loading HR workspace." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (companyQuery.error) {
    return (
      <PageTransition>
        <PageHeader title="Manage Jobs" description="Create and manage job postings." />
        <EmptyState
          icon={Briefcase}
          title="HR account has not been assigned to a company"
          description="Ask a manager to assign this HR account before creating jobs."
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PageHeader
        variant="brand"
        eyebrow="HR hiring console"
        title="Manage Jobs"
        description={`Hiring workspace for ${company?.name ?? "your company"}.`}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingJob(null);
              setDialogOpen(true);
            }}
            className="btn-primary focus-ring bg-white text-emerald-800 hover:bg-emerald-50"
          >
            <Plus size={16} />
            New job
          </button>
        }
      />

      <BrandPanel className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricTile variant="dark" icon={Briefcase} label="Jobs" value={jobs.length} />
          <MetricTile variant="dark" icon={Briefcase} label="Open jobs" value={jobs.filter((job) => (job.size ?? 0) > 0).length} />
          <MetricTile variant="dark" icon={Users} label="Pending applicants" value={jobs.reduce((sum, job) => sum + getPendingApplicantCount(job), 0)} />
        </div>
      </BrandPanel>

      <DataToolbar
        search={search}
        searchPlaceholder="Search jobs"
        onSearchChange={setSearch}
        onClear={() => setSearch("")}
        variant="prominent"
      />

      {jobsQuery.isLoading ? (
        <LoadingSkeleton variant="cardGrid" />
      ) : jobsQuery.error ? (
        <RetryState error={jobsQuery.error} onRetry={jobsQuery.refetch} />
      ) : (
        <DataTable data={filteredJobs} columns={columns} empty="No jobs found." />
      )}

      <ManagementDialog
        open={dialogOpen}
        title={editingJob ? "Edit job" : "Create job"}
        description="Keep job details concise and applicant-friendly."
        onClose={() => setDialogOpen(false)}
      >
        <JobForm
          initialJob={editingJob}
          loading={createMutation.isPending || updateMutation.isPending}
          onSubmit={submitJob}
          onCancel={() => setDialogOpen(false)}
        />
      </ManagementDialog>

      <ConfirmDialog
        open={Boolean(deleteJob)}
        title="Delete job"
        description={`Delete ${deleteJob?.title ?? "this job"}? This action removes it from the company job list.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteJob(null)}
        onConfirm={() => {
          if (!deleteJob) return;
          deleteMutation.mutate(deleteJob.id, {
            onSuccess: () => setDeleteJob(null),
          });
        }}
      />
    </PageTransition>
  );
}
