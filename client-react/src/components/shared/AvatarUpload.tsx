import { Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function AvatarUpload({
  src,
  name,
  disabled,
  loading,
  onUpload,
}: {
  src?: string;
  name?: string;
  disabled?: boolean;
  loading?: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const initials =
    name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "U";

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error("Upload a PNG, JPG, or WebP image");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Avatar must be 2MB or smaller");
      return;
    }
    setPreview(URL.createObjectURL(file));
    onUpload(file);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-xl font-semibold text-primary">
        {preview || src ? (
          <img
            src={preview || src}
            alt={`${name || "Profile"} avatar`}
            className="h-full w-full object-cover"
          />
        ) : (
          initials
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || loading}
          className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload size={16} />
          Upload avatar
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          PNG, JPG, or WebP. Maximum 2MB.
        </p>
      </div>
    </div>
  );
}
