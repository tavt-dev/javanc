"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

export default function ManagerProfilePage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const profile = useApi(() => profileApi.findById(id), [id]);

  if (profile.loading) {
    return <LoadingState label={t("state.loading")} />;
  }

  if (profile.error) {
    return <ErrorState message={profile.error} />;
  }

  if (!profile.data) {
    return <EmptyState title={t("profile.notFound")} description={t("profile.notFoundDescription")} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("manager.profileView")}
        title={profile.data.title || profile.data.objective || `Profile #${profile.data.id}`}
        breadcrumbs={[{ label: t("manager.employeesTitle"), href: "/manager/employees" }, { label: profile.data.title || `Profile #${profile.data.id}` }]}
      />
      <section className="rounded-md border border-line bg-white p-5 shadow-soft">
        <Pill tone="blue">{profile.data.typeProfile || t("common.profile")}</Pill>
        <p className="mt-4 text-sm leading-6 text-muted">{profile.data.workExperience || profile.data.education || t("manager.noProfileDetails")}</p>
      </section>
    </div>
  );
}
