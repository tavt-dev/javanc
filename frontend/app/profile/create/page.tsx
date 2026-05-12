"use client";

import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/features/profiles/profile-form";
import { useLanguage } from "@/lib/i18n";

export default function CreateProfilePage() {
  const { t } = useLanguage();

  return (
    <Protected>
      <PageHeader
        eyebrow={t("profile.createEyebrow")}
        title={t("profile.createTitle")}
        description={t("profile.createDescription")}
      />
      <ProfileForm />
    </Protected>
  );
}
