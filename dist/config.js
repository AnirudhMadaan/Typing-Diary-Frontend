// For local two-server development, route the frontend to the backend.
// When the backend serves this frontend (including Replit previews), use the same origin.
const useSeparateLocalApi = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && window.location.port === "5500";
window.TYPING_DIARY_API_URL = window.TYPING_DIARY_API_URL
  || (useSeparateLocalApi ? "http://localhost:8080" : "");
