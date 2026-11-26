export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const TOKEN_STORAGE_KEY = "meridian_access_token";

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Turn FastAPI's two error shapes into one readable message. */
export function parseApiError(data, fallback = "Request failed. Please try again.") {
  const detail = data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        const field = Array.isArray(item?.loc)
          ? item.loc.filter((part) => part !== "body").join(".")
          : "";
        return field ? `${field}: ${item?.msg || "invalid value"}` : item?.msg;
      })
      .filter(Boolean);
    if (messages.length) return messages.join(" ");
  }
  if (typeof data?.message === "string" && data.message.trim()) return data.message;
  return fallback;
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  const bearer = token !== undefined ? token : getStoredToken();
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Check that the backend is running and try again.");
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    const error = new Error(parseApiError(data, `Request failed (${response.status}).`));
    error.status = response.status;
    throw error;
  }
  return data;
}
