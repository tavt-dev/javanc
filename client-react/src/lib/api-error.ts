import axios from "axios";
import type { ApiResponse } from "@/types/api";

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | Partial<ApiResponse<unknown>>
      | undefined;
    if (body?.message) return body.message;
    if (error.response?.status === 401) return "Session expired";
    if (error.response?.status === 403) return "Access denied";
    if (error.response?.status === 404) return "Not found";
    if (error.response?.status && error.response.status >= 500)
      return "Server error";
  }
  return "Something went wrong";
}
