const API_URL = import.meta.env.VITE_API_URL ?? "";

export type ApiErrorBody = {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
};

export class ApiClientError extends Error {
  constructor(public readonly body: ApiErrorBody) {
    super(body.message);
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    const fallback: ApiErrorBody = {
      status: response.status,
      code: "HTTP_ERROR",
      message: `La API respondió con el estado ${response.status}`,
    };
    const error = (await response.json().catch(() => fallback)) as ApiErrorBody;
    throw new ApiClientError(error);
  }

  return response.json() as Promise<T>;
}

export function getJson<T>(path: string, signal?: AbortSignal) {
  return requestJson<T>(path, { signal });
}

