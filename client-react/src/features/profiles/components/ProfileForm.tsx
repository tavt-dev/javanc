import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { extractErrorMessage } from "@/lib/api-error";
import {
  profileSchema,
  type ProfileSchemaInput,
  type ProfileSchemaValues,
} from "@/features/profiles/schemas/profile-schemas";
import type { ProfileDTO, ProfileFormValues } from "@/types/profile";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";
const textareaClass = `${inputClass} min-h-24 resize-y`;

function toDefaults(profile?: ProfileDTO | null): ProfileSchemaInput {
  return {
    title: profile?.title ?? "",
    typeProfile: profile?.typeProfile ?? "JAVA",
    objective: profile?.objective ?? "",
    education: profile?.education ?? "",
    workExperience: profile?.workExperience ?? "",
    skills: profile?.skills ?? "",
    contact: {
      address: profile?.contact?.address ?? "",
      phone: profile?.contact?.phone ?? "",
      email: profile?.contact?.email ?? "",
    },
  };
}

export function ProfileForm({
  profile,
  mode,
  loading,
  error,
  onSubmit,
  onCancel,
}: {
  profile?: ProfileDTO | null;
  mode: "create" | "edit";
  loading?: boolean;
  error?: unknown;
  onSubmit: (values: ProfileFormValues) => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileSchemaInput, unknown, ProfileSchemaValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toDefaults(profile),
  });

  useEffect(() => {
    reset(toDefaults(profile));
  }, [profile, reset]);

  const submit: SubmitHandler<ProfileSchemaValues> = (values) => {
    onSubmit(values);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="surface p-5"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold">
          {mode === "create" ? "Create profile" : "Edit profile"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your public profile concise and easy to scan.
        </p>
      </div>

      {Boolean(error) && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {extractErrorMessage(error)}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" error={errors.title?.message}>
          <input {...register("title")} className={inputClass} />
        </Field>
        <Field label="Profile type" error={errors.typeProfile?.message}>
          <select {...register("typeProfile")} className={inputClass}>
            <option value="JAVA">Java</option>
            <option value="PYTHON">Python</option>
            <option value="C">C</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-4">
        <Field label="Objective" error={errors.objective?.message}>
          <textarea {...register("objective")} className={textareaClass} />
        </Field>
        <Field label="Skills" error={errors.skills?.message}>
          <textarea {...register("skills")} className={textareaClass} />
        </Field>
        <Field label="Education" error={errors.education?.message}>
          <textarea {...register("education")} className={textareaClass} />
        </Field>
        <Field
          label="Work experience"
          error={errors.workExperience?.message}
        >
          <textarea {...register("workExperience")} className={textareaClass} />
        </Field>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <h3 className="text-sm font-semibold">Contact</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" error={errors.contact?.email?.message}>
            <input {...register("contact.email")} className={inputClass} />
          </Field>
          <Field label="Phone" error={errors.contact?.phone?.message}>
            <input {...register("contact.phone")} className={inputClass} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" error={errors.contact?.address?.message}>
              <input {...register("contact.address")} className={inputClass} />
            </Field>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || (mode === "edit" && !isDirty)}
          className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === "create" ? "Create profile" : "Save changes"}
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
