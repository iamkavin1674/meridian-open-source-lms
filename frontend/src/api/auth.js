import { apiRequest } from "./client";

const trim = (value) => (typeof value === "string" ? value.trim() : value);

export function registerUser({ full_name, email, password }) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: { full_name: trim(full_name), email: trim(email), password },
  });
}

export function loginUser({ email, password }) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: { email: trim(email), password },
  });
}

export function googleLogin(idToken) {
  return apiRequest("/auth/google", {
    method: "POST",
    body: { id_token: idToken },
  });
}

export function forgotPassword(email) {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: { email: trim(email) },
  });
}

export function resetPassword({ email, otp, new_password }) {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: { email: trim(email), otp: trim(otp), new_password },
  });
}

export function fetchMe(token) {
  return apiRequest("/auth/me", { token });
}
