import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleSignInButton } from "./GoogleSignInButton";

vi.mock("@/lib/constants", () => ({
  GOOGLE_CLIENT_ID: "google-client-id",
}));

const prepareGoogleIdentity = vi.fn();
const renderGoogleButton = vi.fn();

vi.mock("@/features/auth/lib/google-identity", () => ({
  prepareGoogleIdentity: (...args: unknown[]) =>
    prepareGoogleIdentity(...args),
  renderGoogleButton: (...args: unknown[]) => renderGoogleButton(...args),
}));

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepareGoogleIdentity.mockResolvedValue(undefined);
  });

  it("renders the google sdk button after initialization", async () => {
    render(<GoogleSignInButton onCredential={vi.fn()} />);

    await waitFor(() => {
      expect(renderGoogleButton).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByLabelText("Tiếp tục với Google")).toBeInTheDocument();
  });

  it("keeps the rendered button within narrow auth layouts", async () => {
    const resizeObservers: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeObservers.push(callback);
        }

        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
    const { container } = render(<GoogleSignInButton onCredential={vi.fn()} />);
    const target = container.querySelector("div[aria-label]") as HTMLDivElement;
    Object.defineProperty(target, "clientWidth", { value: 216 });

    resizeObservers.forEach((callback) =>
      callback(
        [{ target } as unknown as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    );

    await waitFor(() => {
      expect(renderGoogleButton).toHaveBeenLastCalledWith(
        target,
        expect.objectContaining({ width: 216 }),
      );
    });
    vi.unstubAllGlobals();
  });

  it("shows an unavailable state when the sdk fails", async () => {
    prepareGoogleIdentity.mockRejectedValueOnce(new Error("failed"));

    render(<GoogleSignInButton onCredential={vi.fn()} />);

    expect(
      await screen.findByText("Không thể tải đăng nhập Google"),
    ).toBeInTheDocument();
  });
});
