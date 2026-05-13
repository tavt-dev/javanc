"use client";

import { useState } from "react";
import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/features/auth/auth-provider";
import { Button, Field, inputClass, Pill } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { authApi, companyApi, roleRequestApi } from "@/lib/api";
import { setStoredUser } from "@/lib/storage";
import { useApi } from "@/lib/use-api";

export default function InvitationsPage() {
  const { user } = useAuth();
  const [version, setVersion] = useState(0);
  const requests = useApi(() => roleRequestApi.myRequests(), [version]);
  const hrPromotions = useApi(() => roleRequestApi.myHrPromotions(), [version]);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<number | "manager" | null>(null);
  const managerRequest = requests.data?.find((request) => request.type === "MANAGER_UPGRADE" && request.status?.startsWith("PENDING"));

  function reloadRequests() {
    setVersion((item) => item + 1);
  }

  async function requestManagerUpgrade() {
    setWorking("manager");
    setMessage(null);
    setError(null);
    try {
      await roleRequestApi.createManagerUpgrade(reason);
      setMessage("Manager upgrade request sent.");
      setReason("");
      reloadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request upgrade");
    } finally {
      setWorking(null);
    }
  }

  async function acceptHrPromotion(id?: number) {
    if (!id) {
      return;
    }
    setWorking(id);
    setError(null);
    try {
      await companyApi.acceptHrPromotion(id);
      setStoredUser(await authApi.currentUser());
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept HR invitation");
      setWorking(null);
    }
  }

  async function rejectHrPromotion(id?: number) {
    if (!id) {
      return;
    }
    setWorking(id);
    setError(null);
    try {
      await roleRequestApi.rejectHrPromotion(id);
      reloadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reject HR invitation");
    } finally {
      setWorking(null);
    }
  }

  async function leaveHr() {
    setWorking("manager");
    setMessage(null);
    setError(null);
    try {
      await companyApi.leaveHr();
      setStoredUser(await authApi.currentUser());
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to leave HR role");
      setWorking(null);
    }
  }

  return (
    <Protected>
      <PageHeader eyebrow="Account" title="Invitations" description="Review role requests and company invitations." />
      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">Manager upgrade</h2>
          <p className="mt-1 text-sm text-muted">Request manager access for system admin review.</p>
          {user?.role === "user" ? (
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <Field label="Reason">
                <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="I need to manage a company workspace" />
              </Field>
              <Button type="button" onClick={requestManagerUpgrade} disabled={Boolean(managerRequest) || working === "manager"}>
                {managerRequest ? "Request pending" : "Request upgrade"}
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Your current role does not need manager upgrade.</p>
          )}
          {requests.loading ? <LoadingState /> : null}
          <div className="mt-4 grid gap-3">
            {requests.data?.filter((request) => request.type === "MANAGER_UPGRADE").map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 rounded-md bg-canvas p-3 text-sm">
                <span className="font-medium text-ink">{request.requestedRole || "manager"}</span>
                <Pill tone={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "orange" : "blue"}>{request.status}</Pill>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">HR invitations</h2>
          <p className="mt-1 text-sm text-muted">Confirm before your account becomes HR for a company.</p>
          {user?.role === "hr" ? (
            <div className="mt-4 flex flex-col gap-3 rounded-md border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">Current HR role</p>
                <p className="text-sm text-muted">Leave HR to return to a normal user account.</p>
              </div>
              <Button type="button" variant="secondary" onClick={leaveHr} disabled={working === "manager"}>
                Leave HR
              </Button>
            </div>
          ) : null}
          {hrPromotions.loading ? <LoadingState /> : null}
          {!hrPromotions.loading && (hrPromotions.data?.length ?? 0) === 0 ? <EmptyState title="No HR invitations" description="Pending invitations will appear here." /> : null}
          <div className="mt-4 grid gap-3">
            {hrPromotions.data?.map((request) => (
              <div key={request.id} className="flex flex-col gap-3 rounded-md border border-line bg-canvas p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-ink">{request.companyName || `Company #${request.companyId}`}</p>
                  <p className="mt-1 text-sm text-muted">{request.status}</p>
                </div>
                {request.status === "PENDING_USER_CONFIRMATION" ? (
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={() => rejectHrPromotion(request.id)} disabled={working === request.id}>
                      Reject
                    </Button>
                    <Button type="button" onClick={() => acceptHrPromotion(request.id)} disabled={working === request.id}>
                      Accept
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </Protected>
  );
}
