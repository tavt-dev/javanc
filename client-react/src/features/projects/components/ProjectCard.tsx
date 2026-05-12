import { ExternalLink, Pencil } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { ProjectDTO } from "@/types/project";

export function ProjectCard({
  project,
  onEdit,
}: {
  project: ProjectDTO;
  onEdit?: (project: ProjectDTO) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -1 }}
      transition={{ duration: 0.16 }}
      className="rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
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
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Open
            <ExternalLink size={15} />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">No URL</span>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Pencil size={15} />
            Edit
          </button>
        )}
      </div>
    </motion.article>
  );
}
