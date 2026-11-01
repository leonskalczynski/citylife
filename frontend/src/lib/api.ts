const API_URL = import.meta.env.VITE_API_URL ?? "";

export async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`La API respondió con el estado ${response.status}`);
  }

  return response.json() as Promise<T>;
}

