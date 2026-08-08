import axios from "axios";
import appSettings from "./appSettings";

/**
 * The single Axios instance for this app. Every request goes through here —
 * do not call axios.create() anywhere else. See CLAUDE.md → "HTTP client".
 *
 * Auth is carried by an httpOnly session cookie (set by POST /api/auth/login), not a
 * client-readable token — the browser attaches it automatically on every same-origin
 * request, so there's no request interceptor to attach an Authorization header here.
 */
const apiClient = axios.create({
  baseURL: appSettings.apiUrl,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
