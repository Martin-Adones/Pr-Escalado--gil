import keycloak from "../auth/keycloak";

function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || "") + "/api";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      console.warn("[API 401] URL:", response.url, "| Body:", body);
    }
    throw new ApiError(
      response.status,
      body?.message || `Error ${response.status}`,
    );
  }
  const json = await response.json();
  if (!json.success) {
    throw new ApiError(200, json?.message || "Error desconocido del servidor");
  }
  return json.data as T;
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
      )
      .join("&")
  );
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    await keycloak.updateToken(10);
  } catch {
    return {};
  }
  const token = keycloak.token;
  const parsed = keycloak.tokenParsed as Record<string, unknown> | null;
  console.log("[AUTH] Token existe?", !!token, "| iss:", parsed?.iss, "| sub:", parsed?.sub, "| exp:", parsed?.exp ? new Date((parsed.exp as number) * 1000).toISOString() : "N/A");
  return { Authorization: `Bearer ${token}` };
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  signal?: AbortSignal,
): Promise<T> {
  const url = `${getApiBase()}${path}${params ? buildQuery(params) : ""}`;
  const response = await fetch(url, {
    headers: await getAuthHeaders(),
    signal,
  });
  return handleResponse<T>(response);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await getAuthHeaders()),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });
  return handleResponse<T>(response);
}

