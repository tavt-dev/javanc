import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  createInternalAccountSchema,
  type CreateInternalAccountSchemaValues,
} from "@/features/users/schemas/user-schemas";
import type { Role } from "@/types/auth";
import type { InternalAccountFormValues } from "@/types/user";

export function InternalAccountForm({
  fixedRole,
  loading,
  submitLabel = "Create account",
  onSubmit,
  onCancel,
}: {
  fixedRole?: Role;
  loading: boolean;
  submitLabel?: string;
  onSubmit: (values: InternalAccountFormValues) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInternalAccountSchemaValues>({
    resolver: zodResolver(createInternalAccountSchema),
    defaultValues: { role: fixedRole ?? "user" },
  });

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={handleSubmit((values) => onSubmit({ ...values, role: fixedRole ?? values.role }))}
    >
      <Field label="Name" error={errors.name?.message}>
        <input className="form-input" {...register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input className="form-input" type="email" {...register("email")} />
      </Field>
      <Field label="Employee ID" error={errors.employeeId?.message}>
        <input className="form-input" {...register("employeeId")} />
      </Field>
      {!fixedRole && (
        <Field label="Role" error={errors.role?.message}>
          <select className="form-input" {...register("role")}>
            <option value="user">User</option>
            <option value="hr">HR</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      )}
      {fixedRole && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <p className="text-muted-foreground">Role</p>
          <p className="mt-1 font-medium uppercase">{fixedRole}</p>
        </div>
      )}
      <Field label="Password" error={errors.password?.message}>
        <input className="form-input" type="password" {...register("password")} />
      </Field>
      <Field label="Confirm password" error={errors.confirmPassword?.message}>
        <input className="form-input" type="password" {...register("confirmPassword")} />
      </Field>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={loading} className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-70">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="inline-flex min-w-32 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
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
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </label>
  );
}
