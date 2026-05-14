"use client";

import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { ErrorState, LoadingState } from "@/components/data-state";
import { ProfileForm } from "@/features/profiles/profile-form";
import { profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";
import { useLanguage } from "@/lib/i18n";

export default function EditProfilePage() {
  const { t } = useLanguage();
  const profile = useApi(() => profileApi.me(), []);

  return (
    <Protected>
      <PageHeader
        eyebrow={t("profile.createEyebrow")}
        title={t("profile.editTitle")}
        description={t("profile.editDescription")}
        breadcrumbs={[{ label: t("nav.profiles"), href: "/profiles" }, { label: t("profile.editTitle") }]}
      />
      {profile.loading ? <LoadingState label={t("state.loading")} /> : null}
      {profile.error ? <ErrorState message={profile.error} /> : null}
      {profile.data ? <ProfileForm initialProfile={profile.data} mode="edit" /> : null}
    </Protected>
  );
}
