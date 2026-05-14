import axios from "axios";
import { describe, expect, it } from "vitest";
import { extractErrorMessage } from "@/lib/api-error";

function axiosError(status: number, message?: string) {
  return new axios.AxiosError("Request failed", undefined, undefined, null, {
    status,
    statusText: "Error",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
    data: message ? { message } : {},
  });
}

describe("extractErrorMessage", () => {
  it("uses backend ApiResponse message first", () => {
    expect(extractErrorMessage(axiosError(403, "Email verification required"))).toBe(
      "Email verification required",
    );
  });

  it("maps common HTTP statuses", () => {
    expect(extractErrorMessage(axiosError(401))).toBe(
      "Phiên đăng nhập đã hết hạn",
    );
    expect(extractErrorMessage(axiosError(403))).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
    expect(extractErrorMessage(axiosError(409))).toBe(
      "Dữ liệu đã thay đổi, vui lòng tải lại",
    );
    expect(extractErrorMessage(axiosError(429))).toBe("Đã có lỗi xảy ra");
    expect(extractErrorMessage(axiosError(500))).toBe(
      "Máy chủ đang gặp sự cố",
    );
  });
});
