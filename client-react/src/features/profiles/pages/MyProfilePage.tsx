import { FileText, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageTransition } from "@/components/motion/PageTransition";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { RetryState } from "@/components/shared/RetryState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProfileForm } from "@/features/profiles/components/ProfileForm";
import {
  isProfileMissingError,
  useCreateProfileMutation,
  useDeleteProfileMutation,
  useMyProfileQuery,
  useUpdateAvatarMutation,
  useUpdateProfileMutation,
} from "@/features/profiles/hooks/use-profile-queries";
import { useAuthStore } from "@/stores/auth-store";
import type { ProfileFormValues } from "@/types/profile";

export function MyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const profileQuery = useMyProfileQuery();
  const createMutation = useCreateProfileMutation();
  const updateMutation = useUpdateProfileMutation();
  const avatarMutation = useUpdateAvatarMutation();
  const deleteMutation = useDeleteProfileMutation();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const profile = profileQuery.profile;
  const missing = profileQuery.profileMissing;

  if (profileQuery.isLoading) {
    return (
      <PageTransition>
        <PageHeader title="My Profile" description="Loading your profile." />
        <LoadingSkeleton variant="detail" />
      </PageTransition>
    );
  }

  if (profileQuery.error && !isProfileMissingError(profileQuery.error)) {
    return (
      <PageTransition>
        <PageHeader title="My Profile" description="Manage your profile." />
        <RetryState error={profileQuery.error} onRetry={profileQuery.refetch} />
      </PageTransition>
    );
  }

  const handleCreate = (values: ProfileFormValues) => {
    createMutation.mutate(values, { onSuccess: () => setEditing(false) });
  };

  const handleUpdate = (values: ProfileFormValues) => {
    updateMutation.mutate(values, { onSuccess: () => setEditing(false) });
  };

  return (
    <PageTransition>
      <PageHeader
        title="My Profile"
        description="Create and maintain the professional profile used across the platform."
        actions={
          profile && !editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Pencil size={16} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </>
          ) : null
        }
      />

      {missing && !editing && (
        <EmptyState
          icon={FileText}
          title="Create your profile"
          description="Your profile is required before you can add portfolio projects or apply to jobs in later phases."
          action={
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create profile
            </button>
          }
        />
      )}

      {(editing || missing) && (
        <ProfileForm
          profile={profile}
          mode={profile ? "edit" : "create"}
          loading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error || updateMutation.error}
          onSubmit={profile ? handleUpdate : handleCreate}
          onCancel={profile ? () => setEditing(false) : undefined}
        />
      )}

      {profile && !editing && (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <AvatarUpload
              src={profile.url}
              name={profile.title || user?.name}
              loading={avatarMutation.isPending}
              onUpload={(file) => avatarMutation.mutate(file)}
            />
            <div className="mt-5 space-y-3">
              <h2 className="text-xl font-semibold">
                {profile.title || "Untitled profile"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.typeProfile && (
                  <StatusBadge tone="primary">{profile.typeProfile}</StatusBadge>
                )}
                {profile.status && (
                  <StatusBadge tone="success">{profile.status}</StatusBadge>
                )}
              </div>
              <InfoLine label="Contact email" value={profile.contact?.email} />
              <InfoLine label="Phone" value={profile.contact?.phone} />
              <InfoLine label="Address" value={profile.contact?.address} />
            </div>
          </aside>

          <section className="space-y-4">
            <ProfileSection title="Objective" value={profile.objective} />
            <ProfileSection title="Skills" value={profile.skills} />
            <ProfileSection title="Education" value={profile.education} />
            <ProfileSection
              title="Work experience"
              value={profile.workExperience}
            />
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete profile?"
        description="This removes your active profile and hides related projects from profile-driven screens."
        confirmLabel="Delete profile"
        destructive
        loading={deleteMutation.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteMutation.mutate(undefined, {
            onSuccess: () => setConfirmDelete(false),
          })
        }
      />
    </PageTransition>
  );
}

function InfoLine({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm text-foreground">{value || "-"}</p>
    </div>
  );
}

function ProfileSection({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
        {value || "Not provided yet."}
      </p>
    </div>
  );
}
