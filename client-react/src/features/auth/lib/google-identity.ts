type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleButtonConfiguration = {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

type GoogleIdentityApi = {
  initialize: (configuration: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: GoogleButtonConfiguration,
  ) => void;
};

type GoogleIdentitySdk = {
  accounts?: {
    id?: GoogleIdentityApi;
  };
};

declare global {
  interface Window {
    google?: GoogleIdentitySdk;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const SCRIPT_SELECTOR = 'script[data-google-identity="true"]';

let scriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;
let currentCredentialHandler: ((credential: string) => void) | null = null;

export async function prepareGoogleIdentity(
  clientId: string,
  onCredential: (credential: string) => void,
) {
  currentCredentialHandler = onCredential;
  await loadGoogleIdentityScript();

  const api = getGoogleIdentityApi();
  if (initializedClientId !== clientId) {
    api.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          currentCredentialHandler?.(response.credential);
        }
      },
    });
    initializedClientId = clientId;
  }
}

export function renderGoogleButton(
  parent: HTMLElement,
  options: GoogleButtonConfiguration,
) {
  getGoogleIdentityApi().renderButton(parent, options);
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript =
        document.querySelector<HTMLScriptElement>(SCRIPT_SELECTOR) ??
        document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), {
          once: true,
        });
        existingScript.addEventListener("error", () => reject(new Error()), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.dataset.googleIdentity = "true";
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener(
        "error",
        () => {
          script.remove();
          reject(new Error());
        },
        { once: true },
      );
      document.head.appendChild(script);
    }).catch((error: unknown) => {
      scriptPromise = null;
      throw error;
    });
  }

  return scriptPromise;
}

function getGoogleIdentityApi() {
  const api = window.google?.accounts?.id;
  if (!api) {
    throw new Error("Google Identity Services unavailable");
  }
  return api;
}

export function resetGoogleIdentityForTests() {
  scriptPromise = null;
  initializedClientId = null;
  currentCredentialHandler = null;
}
