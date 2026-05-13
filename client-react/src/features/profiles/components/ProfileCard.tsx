import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PremiumProfileCard } from "@/components/shared/PremiumProfileCard";
import type { ProfileDTO } from "@/types/profile";

export function ProfileCard({ profile }: { profile: ProfileDTO }) {
  const displayName = profile.name || profile.title || "Untitled profile";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "P";

  return (
    <PremiumProfileCard>
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[hsl(var(--job-cyan)/0.12)] text-sm font-semibold text-[hsl(var(--job-cyan))]">
          {profile.url ? (
            <img
              src={profile.url}
              alt={`${displayName} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="display-title truncate text-base font-semibold text-foreground">
            {displayName}
          </h2>
          {profile.name && profile.title && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {profile.title}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.typeProfile && (
              <StatusBadge tone="cyan">{profile.typeProfile}</StatusBadge>
            )}
            {profile.status && (
              <StatusBadge tone="success">{profile.status}</StatusBadge>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 min-h-12 text-sm text-muted-foreground">
        {profile.objective || profile.skills || "No profile summary yet."}
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {profile.contact?.email && (
          <span className="inline-flex items-center gap-1">
            <Mail size={13} />
            Contact email
          </span>
        )}
        {profile.contact?.phone && (
          <span className="inline-flex items-center gap-1">
            <Phone size={13} />
            Phone
          </span>
        )}
      </div>

      <Link
        to={`/profiles/${profile.id}`}
        className="focus-ring mt-5 inline-flex items-center gap-2 rounded-md text-sm font-medium text-primary hover:underline"
      >
        View profile
        <ArrowRight size={15} />
      </Link>
    </PremiumProfileCard>
  );
}
