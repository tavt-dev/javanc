import { useTranslation } from "react-i18next";
import {
  LegalPageLayout,
  type LegalSection,
} from "@/features/legal/components/LegalPageLayout";

export function AboutPage() {
  const { t } = useTranslation();
  const sections = t("legal.about.sections", {
    returnObjects: true,
  }) as LegalSection[];

  return (
    <LegalPageLayout
      title={t("legal.about.title")}
      intro={t("legal.about.intro")}
      sections={sections}
    />
  );
}
