import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { updateUserSchema } from "@/features/users/schemas/user-schemas";
import type { AdminUserDTO, UpdateUserRequest } from "@/types/user";

export function UserEditForm({
  user,
  loading,
  onSubmit,
  onCancel,
}: {
  user: AdminUserDTO;
  loading: boolean;
  onSubmit: (values: UpdateUserRequest) => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateUserRequest>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      employeeId: user.idEmployee ?? "",
      password: "",
      active: user.active,
    },
  });

  useEffect(() => {
    reset({
      name: user.name,
      email: user.email,
      employeeId: user.idEmployee ?? "",
      password: "",
      active: user.active,
    });
  }, [reset, user]);

  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <Field label="Name" error={errors.name?.message}>
        <input className="form-input" {...register("name")} />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input className="form-input" type="email" {...register("email")} />
      </Field>
      <Field label="Employee ID" error={errors.employeeId?.message}>
        <input className="form-input" {...register("employeeId")} />
      </Field>
      <Field label="New password" error={errors.password?.message}>
        <input className="form-input" type="password" {...register("password")} />
      </Field>
      <div className="flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={loading} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-70">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="inline-flex min-w-28 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
          {loading && <Loader2 size={16} className="animate-spin" />}
          Save user
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
