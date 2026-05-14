"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { profileApi } from "@/lib/api";
import { Button, Field, inputClass, Pill } from "@/components/ui";
import { ErrorState } from "@/components/data-state";
import { useAuth } from "@/features/auth/auth-provider";
import { useLanguage } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

export function ProfileForm({ initialProfile, mode = "create" }: { initialProfile?: Profile | null; mode?: "create" | "edit" }) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Profile>(() => ({
    name: initialProfile?.name ?? user?.name ?? "",
    title: initialProfile?.title ?? "",
    typeProfile: initialProfile?.typeProfile ?? "JAVA",
    objective: initialProfile?.objective ?? "",
    education: initialProfile?.education ?? "",
    workExperience: initialProfile?.workExperience ?? "",
    skills: initialProfile?.skills ?? "",
    idUser: initialProfile?.idUser ?? user?.id,
    url: initialProfile?.url,
    contact: {
      email: initialProfile?.contact?.email ?? "",
      phone: initialProfile?.contact?.phone ?? "",
      address: initialProfile?.contact?.address ?? ""
    }
  }));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>(initialProfile?.url);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const skillItems = useMemo(() => skillList(draft.skills), [draft.skills]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      if (pendingImageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(pendingImageUrl);
      }
    };
  }, [imagePreviewUrl, pendingImageUrl]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const profile = normalizeProfile(draft, user?.id);

    try {
      let saved = mode === "edit" ? await profileApi.update(profile) : await profileApi.save(profile);
      if (imageFile) {
        saved = await profileApi.uploadAvatar(imageFile);
      }
      router.push(saved.id ? `/profiles/${saved.id}` : "/profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("profile.unableSave"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-md border border-line bg-white p-5 shadow-soft">
        {error ? <ErrorState message={error} /> : null}
        <Field label={t("profile.imageLabel")}>
          <input
            name="image"
            className={inputClass}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                setImageFile(null);
                setImageError(t("profile.unsupportedImage"));
                event.target.value = "";
                return;
              }
              setImageError(null);
              if (file) {
                openCropModal(file);
              }
              event.target.value = "";
            }}
          />
          {imageError ? <span className="mt-1 block text-xs font-medium text-danger">{imageError}</span> : null}
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("profile.nameLabel")}>
            <input name="name" className={inputClass} placeholder={t("profile.namePlaceholder")} value={draft.name ?? ""} onChange={(event) => updateDraft("name", event.target.value)} />
          </Field>
          <Field label={t("profile.titleLabel")}>
            <input name="title" className={inputClass} placeholder={t("profile.titlePlaceholder")} value={draft.title ?? ""} onChange={(event) => updateDraft("title", event.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("profile.typeLabel")}>
            <select name="typeProfile" className={inputClass} value={draft.typeProfile ?? "JAVA"} onChange={(event) => updateDraft("typeProfile", event.target.value)}>
              <option value="JAVA">Java</option>
              <option value="PYTHON">Python</option>
              <option value="C">C</option>
            </select>
          </Field>
        </div>
        <Field label={t("profile.objectiveLabel")}>
          <textarea name="objective" className={inputClass} rows={3} placeholder={t("profile.objectiveLabel")} value={draft.objective ?? ""} onChange={(event) => updateDraft("objective", event.target.value)} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t("profile.contactEmailLabel")}>
            <input name="contact.email" className={inputClass} type="email" value={draft.contact?.email ?? ""} onChange={(event) => updateContact("email", event.target.value)} />
          </Field>
          <Field label={t("profile.phoneLabel")}>
            <input name="contact.phone" className={inputClass} value={draft.contact?.phone ?? ""} onChange={(event) => updateContact("phone", event.target.value)} />
          </Field>
          <Field label={t("profile.addressLabel")}>
            <input name="contact.address" className={inputClass} value={draft.contact?.address ?? ""} onChange={(event) => updateContact("address", event.target.value)} />
          </Field>
        </div>
        <Field label={t("profile.educationLabel")}>
          <textarea name="education" className={inputClass} rows={3} value={draft.education ?? ""} onChange={(event) => updateDraft("education", event.target.value)} />
        </Field>
        <Field label={t("profile.skillsLabel")}>
          <textarea
            name="skills"
            className={inputClass}
            rows={5}
            placeholder={t("profile.skillsPlaceholder")}
            value={draft.skills ?? ""}
            onChange={(event) => updateDraft("skills", event.target.value)}
          />
        </Field>
        <Field label={t("profile.workExperienceLabel")}>
          <textarea name="workExperience" className={inputClass} rows={3} value={draft.workExperience ?? ""} onChange={(event) => updateDraft("workExperience", event.target.value)} />
        </Field>
        <input name="idUser" type="hidden" value={user?.id ?? ""} readOnly />
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? t("profile.saving") : mode === "edit" ? t("profile.update") : t("profile.save")}
          </Button>
        </div>
      </form>
      <aside className="scroll-reveal rounded-md border border-line bg-white p-5 shadow-soft">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{t("profile.preview")}</p>
        <div className="mx-auto mt-4 aspect-square w-full max-w-[420px] overflow-hidden rounded-md border border-line bg-slate-50">
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreviewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-indigo-100 to-yellow-50 text-sm font-semibold text-muted">
              {t("profile.imagePreview")}
            </div>
          )}
        </div>
        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="break-words font-serif text-4xl font-bold leading-tight text-ink">{draft.name || t("profile.namePreview")}</h2>
            <p className="mt-2 break-words text-xl font-semibold text-brand">{draft.title || t("profile.titlePreview")}</p>
          </div>
          <Pill tone="blue">{draft.typeProfile || t("common.profile")}</Pill>
        </div>
        <div className="mt-4 grid gap-2 rounded-md border border-line bg-white p-3 text-sm text-muted">
          <span className="font-semibold text-ink">{t("profile.contact")}</span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand" />
            {draft.contact?.email || t("state.emailNotSet")}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-brand" />
            {draft.contact?.phone || t("state.phoneNotSet")}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand" />
            {draft.contact?.address || t("state.addressNotSet")}
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">{draft.objective || t("profile.objectivePreview")}</p>
        <div className="mt-5 grid gap-3 text-sm text-muted">
          <p><span className="font-semibold text-ink">{t("profile.education")}</span> {draft.education || t("common.notSet")}</p>
          <div>
            <span className="font-semibold text-ink">{t("profile.skills")}</span>
            {skillItems.length ? (
              <ul className="mt-2 grid gap-1">
                {skillItems.map((skill, index) => (
                  <li key={`${skill}-${index}`} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span> {t("common.notSet")}</span>
            )}
          </div>
          <p><span className="font-semibold text-ink">{t("profile.experience")}</span> {draft.workExperience || t("common.notSet")}</p>
        </div>
      </aside>
      {pendingImageUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-md bg-white text-ink shadow-soft">
            <div className="border-b border-line p-4">
              <h2 className="text-lg font-bold">{t("profile.cropAvatar")}</h2>
            </div>
            <div className="relative h-[420px] bg-slate-950">
              <Cropper
                image={pendingImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            </div>
            <div className="grid gap-4 border-t border-line p-4">
              <Field label={t("profile.zoom")}>
                <input className={inputClass} type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </Field>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeCropModal}>
                  {t("common.cancel")}
                </Button>
                <Button type="button" onClick={confirmCrop}>
                  {t("profile.applyCrop")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  function updateDraft(field: keyof Profile, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateContact(field: "email" | "phone" | "address", value: string) {
    setDraft((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));
  }

  function openCropModal(file: File) {
    if (pendingImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(pendingImageUrl);
    }
    setPendingImageFile(file);
    setPendingImageUrl(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function closeCropModal() {
    setPendingImageUrl((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return null;
    });
    setPendingImageFile(null);
    setCroppedAreaPixels(null);
  }

  async function confirmCrop() {
    if (!pendingImageFile || !croppedAreaPixels) {
      closeCropModal();
      return;
    }
    const croppedFile = await cropImage(pendingImageFile, croppedAreaPixels);
    setImageFile(croppedFile);
    setImagePreviewUrl((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return URL.createObjectURL(croppedFile);
    });
    closeCropModal();
  }
}

function normalizeProfile(profile: Profile, userId?: number): Profile {
  const contact = {
    email: stringValue(profile.contact?.email),
    phone: stringValue(profile.contact?.phone),
    address: stringValue(profile.contact?.address)
  };

  return {
    title: requiredString(profile.title),
    typeProfile: requiredString(profile.typeProfile),
    objective: stringValue(profile.objective),
    education: stringValue(profile.education),
    workExperience: stringValue(profile.workExperience),
    skills: stringValue(profile.skills),
    name: stringValue(profile.name),
    idUser: userId,
    contact: Object.values(contact).some(Boolean) ? contact : undefined
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function requiredString(value: unknown) {
  return stringValue(value) ?? "";
}

function skillList(value?: string) {
  return (value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

async function cropImage(file: File, area: Area) {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const size = 512;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    return file;
  }

  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
  return blob ? new File([blob], "avatar.png", { type: "image/png" }) : file;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to read image"));
    };
    image.src = url;
  });
}
