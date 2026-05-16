import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  prepareGoogleIdentity,
  renderGoogleButton,
  resetGoogleIdentityForTests,
} from "./google-identity";

describe("google identity helper", () => {
  beforeEach(() => {
    resetGoogleIdentityForTests();
    document.head.innerHTML = "";
    delete window.google;
  });

  it("passes returned credentials to the latest registered handler", async () => {
    let callback:
      | ((response: { credential?: string }) => void)
      | undefined;
    const initialize = vi.fn(
      (configuration: {
        callback: (response: { credential?: string }) => void;
      }) => {
        callback = configuration.callback;
      },
    );
    window.google = {
      accounts: {
        id: {
          initialize,
          renderButton: vi.fn(),
        },
      },
    };
    const onCredential = vi.fn();

    await prepareGoogleIdentity("client-id", onCredential);
    callback?.({ credential: "google-id-token" });

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(onCredential).toHaveBeenCalledWith("google-id-token");
  });

  it("renders the official button through the SDK", async () => {
    const renderButton = vi.fn();
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton,
        },
      },
    };
    const parent = document.createElement("div");

    await prepareGoogleIdentity("client-id", vi.fn());
    renderGoogleButton(parent, { text: "continue_with" });

    expect(renderButton).toHaveBeenCalledWith(parent, {
      text: "continue_with",
    });
  });

  it("allows a new script load after a previous load fails", async () => {
    const firstAttempt = prepareGoogleIdentity("client-id", vi.fn());
    const firstScript = document.querySelector("script");
    firstScript?.dispatchEvent(new Event("error"));

    await expect(firstAttempt).rejects.toThrow();

    const secondAttempt = prepareGoogleIdentity("client-id", vi.fn());
    const secondScript = document.querySelector("script");
    expect(secondScript).not.toBe(firstScript);

    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
        },
      },
    };
    secondScript?.dispatchEvent(new Event("load"));

    await expect(secondAttempt).resolves.toBeUndefined();
  });
});
