import { ApiError } from "@/types/api";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "/api/v1";

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: any = null;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const apiError: ApiError = {
        statusCode: response.status,
        message: errorData?.detail || errorData?.message || `HTTP ${response.status} Error`,
        detail: errorData,
      };

      throw apiError;
    }

    // Return empty object for 204 or empty response
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if ((error as ApiError).statusCode) {
      throw error;
    }
    const networkError: ApiError = {
      statusCode: 0,
      message: (error as Error).message || "Network request failed. Is the backend server running?",
    };
    throw networkError;
  }
}
