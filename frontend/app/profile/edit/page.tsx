"use client";

import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { ErrorState, LoadingState } from "@/components/data-state";
import { ProfileForm } from "@/features/profiles/profile-form";
import { profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function EditProfilePage() {
  const profile = useApi(() => profileApi.me(), []);

  return (
    <Protected>
      <PageHeader
        eyebrow="Profile"
        title="Edit profile"
        description="Update your profile details and avatar."
        breadcrumbs={[{ label: "Profiles", href: "/profiles" }, { label: "Edit profile" }]}
      />
      {profile.loading ? <LoadingState label="Loading profile" /> : null}
      {profile.error ? <ErrorState message={profile.error} /> : null}
      {profile.data ? <ProfileForm initialProfile={profile.data} mode="edit" /> : null}
    </Protected>
  );
}
