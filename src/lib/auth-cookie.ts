export const ACCESS_TOKEN_COOKIE = "studyorbit-access-token";
export const REFRESH_TOKEN_COOKIE = "studyorbit-refresh-token";

export function persistBrowserSession(accessToken: string, refreshToken?: string | null) {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(accessToken)}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  if (refreshToken) {
    document.cookie = `${REFRESH_TOKEN_COOKIE}=${encodeURIComponent(refreshToken)}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
}

export function clearBrowserSession() {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  document.cookie = `${REFRESH_TOKEN_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}
