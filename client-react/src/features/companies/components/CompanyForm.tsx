import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  companySchema,
  type CompanySchemaValues,
} from "@/features/companies/schemas/company-schemas";
import type { CompanyDTO, CompanyFormValues } from "@/types/company";

export function CompanyForm({
  initialCompany,
  allowImage = false,
  loading,
  onSubmit,
  onCancel,
}: {
  initialCompany?: CompanyDTO | null;
  allowImage?: boolean;
  loading: boolean;
  onSubmit: (values: CompanyFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanySchemaValues>({
    resolver: zodResolver(companySchema),
    defaultValues: toDefaults(initialCompany),
  });

  useEffect(() => {
    reset(toDefaults(initialCompany));
  }, [initialCompany, reset]);

  const submit = (values: CompanySchemaValues) => {
    onSubmit({
      ...values,
      image: values.image?.[0] ?? null,
    });
  };

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)}>
      <Field label="Name" error={errors.name?.message}>
        <input className="form-input" {...register("name")} />
      </Field>
      <Field label="Type" error={errors.type?.message}>
        <input className="form-input" {...register("type")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input className="form-input" type="email" {...register("email")} />
      </Field>
      <Field label="Phone" error={errors.phone?.message}>
        <input className="form-input" {...register("phone")} />
      </Field>
      <Field label="Street" error={errors.street?.message}>
        <input className="form-input" {...register("street")} />
      </Field>
      <Field label="City" error={errors.city?.message}>
        <input className="form-input" {...register("city")} />
      </Field>
      <Field label="Country" error={errors.country?.message}>
        <input className="form-input" {...register("country")} />
      </Field>
      {allowImage && (
        <Field label="Company image" error={errors.image?.message}>
          <input className="form-input file:mr-3 file:border-0 file:bg-muted file:text-sm" type="file" accept="image/png,image/jpeg,image/webp" {...register("image")} />
        </Field>
      )}
      <div className="sm:col-span-2">
        <Field label="Description" error={errors.description?.message}>
          <textarea className="form-input min-h-28 resize-y" {...register("description")} />
        </Field>
      </div>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={loading} className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-70">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {initialCompany ? "Save company" : "Create company"}
        </button>
      </div>
    </form>
  );
}

function toDefaults(company?: CompanyDTO | null) {
  return {
    name: company?.name ?? "",
    type: company?.type ?? "",
    description: company?.description ?? "",
    street: company?.street ?? "",
    email: company?.email ?? "",
    phone: company?.phone ?? "",
    city: company?.city ?? "",
    country: company?.country ?? "",
  };
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
