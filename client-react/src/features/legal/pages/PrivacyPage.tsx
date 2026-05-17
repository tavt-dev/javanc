import { useTranslation } from "react-i18next";
import {
  LegalPageLayout,
  type LegalSection,
} from "@/features/legal/components/LegalPageLayout";

export function PrivacyPage() {
  const { t } = useTranslation();
  const sections = t("legal.privacy.sections", {
    returnObjects: true,
  }) as LegalSection[];

  return (
    <LegalPageLayout
      title={t("legal.privacy.title")}
      intro={t("legal.privacy.intro")}
      lastUpdated={t("legal.privacy.lastUpdated")}
      sections={sections}
    />
  );
}
