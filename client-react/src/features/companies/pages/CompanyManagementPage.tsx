import { createColumnHelper } from "@tanstack/react-table";
import { Edit, Plus, Trash2, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable } from "@/components/shared/DataTable";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ManagementDialog } from "@/components/shared/ManagementDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CompanyForm } from "@/features/companies/components/CompanyForm";
import {
  useCompaniesQuery,
  useCreateCompanyMutation,
  useCreateManagerAccountAndAssignMutation,
  useDeleteCompanyMutation,
  useUpdateCompanyMutation,
} from "@/features/companies/hooks/use-company-queries";
import { filterCompanies, formatCompanyLocation } from "@/features/companies/utils/company-utils";
import { InternalAccountForm } from "@/features/users/components/InternalAccountForm";
import type { CompanyDTO, CompanyFormValues } from "@/types/company";
import type { InternalAccountFormValues } from "@/types/user";

const columnHelper = createColumnHelper<CompanyDTO>();

export function CompanyManagementPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyDTO | null>(null);
  const [deleteCompany, setDeleteCompany] = useState<CompanyDTO | null>(null);
  const [assignCompany, setAssignCompany] = useState<CompanyDTO | null>(null);

  const companiesQuery = useCompaniesQuery();
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const createMutation = useCreateCompanyMutation();
  const updateMutation = useUpdateCompanyMutation();
  const deleteMutation = useDeleteCompanyMutation();
  const assignMutation = useCreateManagerAccountAndAssignMutation(assignCompany?.id ?? 0);

  const companyTypes = useMemo(
    () => [...new Set(companies.map((company) => company.type).filter(Boolean))],
    [companies],
  );
  const filteredCompanies = useMemo(
    () => filterCompanies(companies, { query: search, type }),
    [companies, search, type],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Company",
        cell: ({ row }) => (
          <div className="min-w-44">
            <p className="font-medium">{row.original.name}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {row.original.description || "No description"}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: ({ getValue }) =>
          getValue() ? <StatusBadge tone="primary">{getValue() ?? ""}</StatusBadge> : "-",
      }),
      columnHelper.display({
        id: "location",
        header: "Location",
        cell: ({ row }) => formatCompanyLocation(row.original) || "-",
      }),
      columnHelper.accessor("idManager", {
        header: "Manager",
        cell: ({ getValue }) => getValue() ?? "None",
      }),
      columnHelper.display({
        id: "counts",
        header: "Counts",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.idHR?.length ?? 0} HR / {row.original.idJobs?.length ?? 0} jobs
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setEditingCompany(row.original)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent">
              <Edit size={13} />
              Edit
            </button>
            <button type="button" onClick={() => setAssignCompany(row.original)} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-accent">
              <UserPlus size={13} />
              Assign manager
            </button>
            <button type="button" onClick={() => setDeleteCompany(row.original)} className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10">
              <Trash2 size={13} />
              Delete
            </button>
          </div>
        ),
      }),
    ],
    [],
  );

  const createCompany = (values: CompanyFormValues) => {
    createMutation.mutate(values, { onSuccess: () => setCreateOpen(false) });
  };

  const updateCompany = (values: CompanyFormValues) => {
    if (!editingCompany) return;
    updateMutation.mutate(
      {
        ...editingCompany,
        ...values,
        idManager: editingCompany.idManager,
        idHR: editingCompany.idHR,
        idJobs: editingCompany.idJobs,
      },
      { onSuccess: () => setEditingCompany(null) },
    );
  };

  const assignManager = (values: InternalAccountFormValues) => {
    if (!assignCompany) return;
    assignMutation.mutate(values, { onSuccess: () => setAssignCompany(null) });
  };

  return (
    <PageTransition>
      <PageHeader
        variant="console"
        eyebrow="Admin console"
        title="Company Management"
        description="Create, edit, delete, and assign company managers."
        actions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary focus-ring bg-white text-emerald-800 hover:bg-emerald-50">
            <Plus size={16} />
            Create company
          </button>
        }
      />

      <DataToolbar
        search={search}
        searchPlaceholder="Search companies"
        onSearchChange={setSearch}
        onClear={() => {
          setSearch("");
          setType("");
        }}
        variant="job-search"
        filters={
          <select className="form-input sm:w-44" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">All types</option>
            {companyTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        }
      />

      {companiesQuery.isLoading ? (
        <LoadingSkeleton variant="detail" />
      ) : companiesQuery.error ? (
        <RetryState error={companiesQuery.error} onRetry={companiesQuery.refetch} />
      ) : (
        <DataTable data={filteredCompanies} columns={columns} empty="No companies found." />
      )}

      <ManagementDialog open={createOpen} title="Create company" description="Company image is accepted by the backend but not displayed by the current DTO." onClose={() => setCreateOpen(false)}>
        <CompanyForm allowImage loading={createMutation.isPending} onSubmit={createCompany} onCancel={() => setCreateOpen(false)} />
      </ManagementDialog>

      {editingCompany && (
        <ManagementDialog open title="Edit company" description="Relationship fields are preserved during update." onClose={() => setEditingCompany(null)}>
          <CompanyForm initialCompany={editingCompany} loading={updateMutation.isPending} onSubmit={updateCompany} onCancel={() => setEditingCompany(null)} />
        </ManagementDialog>
      )}

      {assignCompany && (
        <ManagementDialog open title="Create manager account and assign" description={assignCompany.idManager ? `This will replace manager #${assignCompany.idManager}.` : "The backend creates a new manager account and assigns it."} onClose={() => setAssignCompany(null)}>
          <InternalAccountForm fixedRole="manager" loading={assignMutation.isPending} submitLabel="Create and assign" onSubmit={assignManager} onCancel={() => setAssignCompany(null)} />
        </ManagementDialog>
      )}

      <ConfirmDialog
        open={Boolean(deleteCompany)}
        title="Delete company"
        description={`Delete ${deleteCompany?.name ?? "this company"}?`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteCompany(null)}
        onConfirm={() => {
          if (!deleteCompany) return;
          deleteMutation.mutate(deleteCompany.id, { onSuccess: () => setDeleteCompany(null) });
        }}
      />
    </PageTransition>
  );
}
