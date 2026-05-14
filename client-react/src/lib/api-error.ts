import axios from "axios";
import i18n from "@/i18n";
import type { ApiResponse } from "@/types/api";

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | Partial<ApiResponse<unknown>>
      | undefined;
    if (body?.message) return body.message;
    if (error.response?.status === 401) return i18n.t("errors.unauthorized");
    if (error.response?.status === 403) return i18n.t("errors.forbidden");
    if (error.response?.status === 404) return i18n.t("errors.notFound");
    if (error.response?.status === 409) return i18n.t("errors.conflict");
    if (error.response?.status && error.response.status >= 500)
      return i18n.t("errors.server");
    if (!error.response) return i18n.t("errors.network");
  }
  return i18n.t("errors.generic");
}
