import { Protected } from "@/components/protected";
import { PageHeader } from "@/components/page-header";
import { ProfileForm } from "@/features/profiles/profile-form";

export default function CreateProfilePage() {
  return (
    <Protected>
      <PageHeader
        eyebrow="Profile"
        title="Create profile"
        description="Build a professional profile with your experience, skills, contact details, and photo."
      />
      <ProfileForm />
    </Protected>
  );
}
