import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { jobSchema, type JobSchemaValues } from "@/features/jobs/schemas/job-schemas";
import type { JobDTO, JobFormValues } from "@/types/job";

export function JobForm({
  initialJob,
  loading,
  onSubmit,
  onCancel,
}: {
  initialJob?: JobDTO | null;
  loading: boolean;
  onSubmit: (values: JobFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobSchemaValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: initialJob?.title ?? "",
      description: initialJob?.description ?? "",
      typeJob: initialJob?.typeJob ?? "java",
      size: initialJob?.size ?? 1,
    },
  });

  useEffect(() => {
    reset({
      title: initialJob?.title ?? "",
      description: initialJob?.description ?? "",
      typeJob: initialJob?.typeJob ?? "java",
      size: initialJob?.size ?? 1,
    });
  }, [initialJob, reset]);

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Title" error={errors.title?.message}>
        <input className="form-input" {...register("title")} />
      </Field>

      <Field label="Type" error={errors.typeJob?.message}>
        <select className="form-input" {...register("typeJob")}>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="php">PHP</option>
        </select>
      </Field>

      <Field label="Openings" error={errors.size?.message}>
        <input className="form-input" type="number" min={1} {...register("size", { valueAsNumber: true })} />
      </Field>

      <Field label="Description" error={errors.description?.message}>
        <textarea className="form-input min-h-28 resize-y" {...register("description")} />
      </Field>

      <FormActions loading={loading} onCancel={onCancel} submitLabel={initialJob ? "Save job" : "Create job"} />
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
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function FormActions({
  loading,
  submitLabel,
  onCancel,
}: {
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-70"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-w-28 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}
