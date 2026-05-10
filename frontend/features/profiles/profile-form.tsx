"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { profileApi } from "@/lib/api";
import { Button, Field, inputClass } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useAuth } from "@/features/auth/auth-provider";

export function ProfileForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    if (user?.id && !form.get("idUser")) {
      form.set("idUser", String(user.id));
    }

    try {
      const profile = await profileApi.save(form);
      router.push(profile.id ? `/profiles/${profile.id}` : "/profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-line bg-white p-5 shadow-soft">
      {error ? <ErrorState message={error} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input name="title" className={inputClass} placeholder="Senior Java Developer" />
        </Field>
        <Field label="Profile type">
          <select name="typeProfile" className={inputClass}>
            <option value="JAVA">Java</option>
            <option value="C">C</option>
            <option value="FULLSTACK">Fullstack</option>
            <option value="MANAGER">Manager</option>
          </select>
        </Field>
      </div>
      <Field label="Objective">
        <textarea name="objective" className={inputClass} rows={3} placeholder="Professional objective" />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Education">
          <textarea name="education" className={inputClass} rows={3} />
        </Field>
        <Field label="Work experience">
          <textarea name="workExperience" className={inputClass} rows={3} />
        </Field>
      </div>
      <Field label="Skills">
        <input name="skills" className={inputClass} placeholder="Java, React, teamwork, leadership" />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Contact email">
          <input name="contact.email" className={inputClass} type="email" />
        </Field>
        <Field label="Phone">
          <input name="contact.phone" className={inputClass} />
        </Field>
        <Field label="Address">
          <input name="contact.address" className={inputClass} />
        </Field>
      </div>
      <Field label="Profile image">
        <input name="image" className={inputClass} type="file" accept="image/*" />
      </Field>
      <input name="idUser" type="hidden" value={user?.id ?? ""} readOnly />
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
