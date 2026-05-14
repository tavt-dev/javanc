"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/features/auth/auth-provider";
import { Button, Field, inputClass, Pill } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { authApi, companyApi, notificationApi, roleRequestApi } from "@/lib/api";
import { setStoredUser } from "@/lib/storage";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

export default function InvitationsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [version, setVersion] = useState(0);
  const requests = useApi(() => roleRequestApi.myRequests(), [version]);
  const hrPromotions = useApi(() => roleRequestApi.myHrPromotions(), [version]);
  const notifications = useApi(() => (user?.id ? notificationApi.byUser(user.id) : Promise.resolve([])), [user?.id, version]);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<number | "manager" | null>(null);
  const managerRequest = requests.data?.find((request) => request.type === "MANAGER_UPGRADE" && request.status?.startsWith("PENDING"));

  function reloadRequests() {
    setVersion((item) => item + 1);
  }

  useEffect(() => {
    const unread = notifications.data?.filter((notification) => notification.id && !notification.read) ?? [];
    if (!unread.length) {
      return;
    }

    void Promise.all(unread.map((notification) => notificationApi.markRead(Number(notification.id)).catch(() => null))).then((results) => {
      if (results.some(Boolean)) {
        window.dispatchEvent(new Event("notifications-read"));
        reloadRequests();
      }
    });
  }, [notifications.data]);

  async function requestManagerUpgrade() {
    setWorking("manager");
    setMessage(null);
    setError(null);
    try {
      await roleRequestApi.createManagerUpgrade(reason);
      setMessage(t("notifications.managerRequestSent"));
      setReason("");
      reloadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("notifications.unableRequestUpgrade"));
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
      setError(err instanceof Error ? err.message : t("notifications.unableAcceptHr"));
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
      setError(err instanceof Error ? err.message : t("notifications.unableRejectHr"));
    } finally {
      setWorking(null);
    }
  }

  return (
    <Protected>
      <PageHeader eyebrow={t("account.title")} title={t("notifications.title")} description={t("notifications.description")} />
      {error ? <ErrorState message={error} /> : null}
      {message ? <div className="mb-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}

      <section className="glass-panel scroll-reveal rounded-md p-5">
        {notifications.loading || requests.loading || hrPromotions.loading ? <LoadingState /> : null}
        {notifications.error ? <ErrorState message={notifications.error} /> : null}
        <div className="grid gap-3">
          {user?.role === "user" ? (
            <div className="rounded-md border border-line bg-canvas p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl">
                  <p className="font-semibold text-ink">{t("notifications.managerAccess")}</p>
                  <p className="mt-1 text-sm text-muted">{t("notifications.managerAccessHelp")}</p>
                </div>
                <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <Field label={t("notifications.reason")}>
                    <input className={inputClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={t("notifications.reasonPlaceholder")} />
                  </Field>
                  <Button type="button" onClick={requestManagerUpgrade} disabled={Boolean(managerRequest) || working === "manager"}>
                    {managerRequest ? t("notifications.pending") : t("notifications.request")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {hrPromotions.data?.map((request) => (
            <div key={`hr-${request.id}`} className="rounded-md border border-line bg-canvas p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-ink">{t("notifications.hrInvitationFrom", { name: request.requesterName || t("notifications.managerFallback") })}</p>
                  <p className="mt-1 text-sm text-muted">{t("notifications.companyNeedsConfirmation", { company: request.companyName || t("notifications.companyFallback", { id: request.companyId ?? "" }) })}</p>
                </div>
                <Pill tone={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "orange" : "blue"}>{request.status}</Pill>
              </div>
              {request.status === "PENDING_USER_CONFIRMATION" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => rejectHrPromotion(request.id)} disabled={working === request.id}>
                    {t("notifications.reject")}
                  </Button>
                  <Button type="button" onClick={() => acceptHrPromotion(request.id)} disabled={working === request.id}>
                    {t("notifications.accept")}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}

          {requests.data?.filter((request) => request.type === "MANAGER_UPGRADE").map((request) => (
            <div key={`manager-${request.id}`} className="flex flex-col gap-3 rounded-md border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{t("notifications.managerUpgradeRequest")}</p>
                <p className="mt-1 text-sm text-muted">{request.reason || t("notifications.adminReview")}</p>
              </div>
              <Pill tone={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "orange" : "blue"}>{request.status}</Pill>
            </div>
          ))}

          {notifications.data?.map((notification) => (
            <div key={`notification-${notification.id}`} className="rounded-md border border-line bg-canvas p-4">
              <p className="font-semibold text-ink">{notification.message || t("notifications.notification")}</p>
              {notification.createAt ? <p className="mt-1 text-xs text-muted">{new Date(notification.createAt).toLocaleString()}</p> : null}
            </div>
          ))}

          {!notifications.loading && !requests.loading && !hrPromotions.loading
            && (notifications.data?.length ?? 0) === 0
            && (requests.data?.filter((request) => request.type === "MANAGER_UPGRADE").length ?? 0) === 0
            && (hrPromotions.data?.length ?? 0) === 0
            && user?.role !== "user" ? (
            <EmptyState title={t("notifications.emptyTitle")} description={t("notifications.emptyDescription")} />
          ) : null}
        </div>
      </section>
    </Protected>
  );
}
