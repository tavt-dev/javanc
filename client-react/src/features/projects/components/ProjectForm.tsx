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

const inputClass = "form-input";

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
      className="surface bg-popover p-5 shadow-xl"
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
        <label className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-3 text-sm">
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
          className="btn-secondary focus-ring"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || Boolean(project && !isDirty)}
          className="btn-primary focus-ring min-w-28"
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
      <span className="form-label">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p className="form-error">{error}</p>}
    </label>
  );
}
