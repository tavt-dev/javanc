import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { motionPresets } from "@/components/motion/motion-presets";
import { formatDate } from "@/lib/utils";
import type { ProjectDTO } from "@/types/project";

export function ProjectCard({
  project,
  onDelete,
  onEdit,
}: {
  project: ProjectDTO;
  onDelete?: (project: ProjectDTO) => void;
  onEdit?: (project: ProjectDTO) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : motionPresets.card.hover}
      transition={motionPresets.card.transition}
      className="interactive-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            {project.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(project.createAt)}
          </p>
        </div>
        <StatusBadge tone={project.display ? "success" : "neutral"}>
          {project.display ? "Public" : "Private"}
        </StatusBadge>
      </div>

      <p className="mt-4 line-clamp-3 min-h-12 text-sm text-muted-foreground">
        {project.description || "No description yet."}
      </p>

      <div className="mt-5 flex items-center justify-between gap-3">
        {project.url ? (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-md text-sm font-medium text-primary hover:underline"
          >
            Open
            <ExternalLink size={15} />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">No URL</span>
        )}
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(project)}
                className="btn-secondary focus-ring"
              >
                <Pencil size={15} />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(project)}
                className="inline-flex items-center gap-2 rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}
