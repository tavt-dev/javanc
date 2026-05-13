import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motionPresets } from "@/components/motion/motion-presets";
import type { ProfileDTO } from "@/types/profile";

export function ProfileCard({ profile }: { profile: ProfileDTO }) {
  const reduceMotion = useReducedMotion();
  const initials =
    profile.title
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "P";

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : motionPresets.card.hover}
      transition={motionPresets.card.transition}
      className="interactive-card border-t-2 border-t-primary/40 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {profile.url ? (
            <img
              src={profile.url}
              alt={`${profile.title || "Profile"} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-foreground">
            {profile.title || "Untitled profile"}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.typeProfile && (
              <StatusBadge tone="primary">{profile.typeProfile}</StatusBadge>
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
    </motion.article>
  );
}
