"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Pill } from "@/components/ui";
import { profileApi } from "@/lib/api";
import { useApi } from "@/lib/use-api";

export default function ManagerProfilePage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const profile = useApi(() => profileApi.findById(id), [id]);

  if (profile.loading) {
    return <LoadingState label="Loading profile" />;
  }

  if (profile.error) {
    return <ErrorState message={profile.error} />;
  }

  if (!profile.data) {
    return <EmptyState title="Profile not found" description="This profile may have been removed or is no longer available." />;
  }

  return (
    <div>
      <PageHeader eyebrow="Manager profile view" title={profile.data.title || profile.data.objective || `Profile #${profile.data.id}`} />
      <section className="rounded-md border border-line bg-white p-5 shadow-soft">
        <Pill tone="blue">{profile.data.typeProfile || "Profile"}</Pill>
        <p className="mt-4 text-sm leading-6 text-muted">{profile.data.workExperience || profile.data.education || "No profile details"}</p>
      </section>
    </div>
  );
}
