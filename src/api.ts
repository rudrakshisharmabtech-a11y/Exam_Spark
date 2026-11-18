export type ApiError = Error & { status?: number };

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("Cannot reach the ExamSpark API. Start `pnpm server:dev` and verify its configuration.");
  }
  const text = await response.text();
  let body: { error?: string; message?: string } = {};
  if (text) {
    try {
      body = JSON.parse(text) as { error?: string; message?: string };
    } catch {
      throw new Error(
        `The ExamSpark API returned an unexpected response (HTTP ${response.status}). Start \`pnpm server:dev\` and check its configuration.`,
      );
    }
  }
  if (!response.ok) {
    const error = new Error(body.error || body.message || "The request could not be completed.") as ApiError;
    error.status = response.status;
    throw error;
  }
  return body as T;
}

export function startOAuth(provider: "google" | "github", role: "student" | "teacher") {
  const query = new URLSearchParams({ role });
  window.location.assign(`/api/auth/${provider}?${query}`);
}
