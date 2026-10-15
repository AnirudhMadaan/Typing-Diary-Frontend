// For local two-server development, route the frontend to the backend.
// When the backend serves this frontend (including Replit previews), use the same origin.
const useSeparateLocalApi = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  && window.location.port === "5500";
// Production frontend and API are deployed as separate Vercel projects.
// Override this value only if your backend deployment URL changes.
window.TYPING_DIARY_API_URL = window.TYPING_DIARY_API_URL
  || (useSeparateLocalApi ? "http://localhost:8080" : "https://typing-diary-backend.vercel.app");
