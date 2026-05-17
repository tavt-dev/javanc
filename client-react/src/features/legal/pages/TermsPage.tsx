import { useTranslation } from "react-i18next";
import {
  LegalPageLayout,
  type LegalSection,
} from "@/features/legal/components/LegalPageLayout";

export function TermsPage() {
  const { t } = useTranslation();
  const sections = t("legal.terms.sections", {
    returnObjects: true,
  }) as LegalSection[];

  return (
    <LegalPageLayout
      title={t("legal.terms.title")}
      intro={t("legal.terms.intro")}
      lastUpdated={t("legal.terms.lastUpdated")}
      sections={sections}
    />
  );
}
