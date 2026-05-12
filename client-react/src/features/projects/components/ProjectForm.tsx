import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { extractErrorMessage } from "@/lib/api-error";
import {
  projectSchema,
  type ProjectSchemaInput,
  type ProjectSchemaValues,
} from "@/features/projects/schemas/project-schemas";
import type { ProjectDTO, ProjectFormValues } from "@/types/project";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

function toDefaults(project?: ProjectDTO | null): ProjectSchemaInput {
  return {
    title: project?.title ?? "",
    description: project?.description ?? "",
    url: project?.url ?? "",
    display: project?.display ?? true,
  };
}

export function ProjectForm({
  project,
  loading,
  error,
  onSubmit,
  onCancel,
}: {
  project?: ProjectDTO | null;
  loading?: boolean;
  error?: unknown;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProjectSchemaInput, unknown, ProjectSchemaValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: toDefaults(project),
  });

  useEffect(() => {
    reset(toDefaults(project));
  }, [project, reset]);

  const submit: SubmitHandler<ProjectSchemaValues> = (values) => {
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="rounded-lg border border-border bg-popover p-5 shadow-xl"
    >
      <h2 className="text-lg font-semibold">
        {project ? "Edit project" : "New project"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Projects are shown on your profile when visibility is public.
      </p>

      {Boolean(error) && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {extractErrorMessage(error)}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <Field label="Title" error={errors.title?.message}>
          <input {...register("title")} className={inputClass} />
        </Field>
        <Field label="URL" error={errors.url?.message}>
          <input
            {...register("url")}
            placeholder="https://example.com"
            className={inputClass}
          />
        </Field>
        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register("description")}
            className={`${inputClass} min-h-28 resize-y`}
          />
        </Field>
        <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm">
          <input type="checkbox" {...register("display")} />
          <span>
            <span className="block font-medium">Public project</span>
            <span className="text-muted-foreground">
              Show this project on profile detail pages.
            </span>
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || Boolean(project && !isDirty)}
          className="inline-flex min-w-28 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {project ? "Save" : "Create"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </label>
  );
}
