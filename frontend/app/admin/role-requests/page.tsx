"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, Pill } from "@/components/ui";
import { roleRequestApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import type { RoleRequest } from "@/lib/types";

export default function AdminRoleRequestsPage() {
  const requests = useApi(() => roleRequestApi.adminList({ status: "PENDING_SYSADMIN" }), []);
  const [items, setItems] = useState<RoleRequest[] | null>(null);
  const [working, setWorking] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const visible = items ?? requests.data ?? [];

  async function decide(request: RoleRequest, action: "approve" | "reject") {
    if (!request.id) {
      return;
    }
    setWorking(request.id);
    setError(null);
    try {
      const saved = action === "approve" ? await roleRequestApi.approve(request.id) : await roleRequestApi.reject(request.id);
      setItems((current) => (current ?? visible).map((item) => (item.id === saved.id ? saved : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update request");
    } finally {
      setWorking(null);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="System Admin" title="Role requests" description="Review manager upgrade requests before account roles change." />
      {requests.loading ? <LoadingState /> : null}
      {requests.error ? <ErrorState message={requests.error} /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!requests.loading && visible.length === 0 ? <EmptyState title="No pending requests" description="New manager upgrade requests will appear here." /> : null}
      <div className="grid gap-4">
        {visible.map((request) => (
          <article key={request.id} className="interactive-card rounded-md border border-line bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-ink">{request.targetName || `User #${request.targetUserId}`}</h2>
                  <Pill tone="blue">{request.requestedRole || "manager"}</Pill>
                  <Pill tone={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "orange" : "neutral"}>{request.status}</Pill>
                </div>
                <p className="mt-1 text-sm text-muted">{request.targetEmail}</p>
                {request.reason ? <p className="mt-3 text-sm leading-6 text-muted">{request.reason}</p> : null}
              </div>
              {request.status === "PENDING_SYSADMIN" ? (
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => decide(request, "reject")} disabled={working === request.id}>
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button type="button" onClick={() => decide(request, "approve")} disabled={working === request.id}>
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
