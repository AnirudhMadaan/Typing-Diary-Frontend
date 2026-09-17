const state = {
  user: null,
  entries: [],
  editingId: null,
  mood: "",
  seconds: 0,
  timerId: null,
  authMode: "login",
  theme: localStorage.getItem("typingDiaryTheme") || "dark",
  font: localStorage.getItem("typingDiaryFont") || "dm",
  pageStyle: localStorage.getItem("typingDiaryPageStyle") || "lined",
};

const API_BASE = window.TYPING_DIARY_API_URL ||
  (window.location.port === "8080" || window.location.pathname.startsWith("/api")
    ? ""
    : "https://typing-diary-backend.vercel.app");

const $ = (id) => document.getElementById(id);
const authView = $("authView");
const appView = $("appView");
const authForm = $("authForm");
const authError = $("authError");
const titleInput = $("titleInput");
const editor = $("editor");
const saveStatus = $("saveStatus");

const prompts = [
  "What made today feel like yours?",
  "What are you learning to leave room for?",
  "Describe one small thing that went right.",
  "What would you like to remember about this season?",
  "Where did your attention go today?",
];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character]));
}

function showToast(message, type = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  $("toastRegion").append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body;
}

function applyTheme() {
  document.body.classList.toggle("light", state.theme === "light");
  $("themeButton").textContent = state.theme === "light" ? "☀" : "☾";
  localStorage.setItem("typingDiaryTheme", state.theme);
}

function applyAppearance() {
  editor.className = `editor-textarea font-${state.font === "dm" ? "dm-sans" : state.font}`;
  $("editorCard").classList.remove("page-lined", "page-paper", "page-blank");
  $("editorCard").classList.add(`page-${state.pageStyle}`);
  $("fontSelect").value = state.font;
  document.querySelectorAll(".page-style").forEach((button) => {
    button.classList.toggle("active", button.dataset.pageStyle === state.pageStyle);
  });
  $("linesToggle").checked = state.pageStyle === "lined";
}

function setAuthMode(mode) {
  state.authMode = mode;
  const registering = mode === "register";
  $("authTitle").textContent = registering ? "Start your diary" : "Welcome back";
  $("authSubtitle").textContent = registering ? "Create an account and make space for your thoughts." : "Sign in to continue your story.";
  $("nameField").hidden = !registering;
  $("nameInput").required = registering;
  $("authSubmitLabel").textContent = registering ? "Create account" : "Sign in";
  $("authSwitchPrompt").textContent = registering ? "Already have an account?" : "New here?";
  $("authSwitch").textContent = registering ? "Sign in instead" : "Create an account";
  $("passwordInput").autocomplete = registering ? "new-password" : "current-password";
  authError.textContent = "";
}

function showAuth() {
  authView.hidden = false;
  appView.hidden = true;
  setAuthMode(state.authMode);
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "TD";
}

function showApp() {
  authView.hidden = true;
  appView.hidden = false;
  $("profileInitials").textContent = initials(state.user.name);
  $("profileName").textContent = state.user.name;
  $("profileEmail").textContent = state.user.email;
  $("todayLabel").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  applyTheme();
  applyAppearance();
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function calculateStreak(entries) {
  if (!entries.length) return 0;
  const dates = new Set(entries.map((entry) => new Date(entry.createdAt).toLocaleDateString("en-CA")));
  const cursor = new Date();
  let streak = 0;
  while (dates.has(cursor.toLocaleDateString("en-CA"))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function renderStats() {
  const totalWords = state.entries.reduce((sum, entry) => sum + entry.words, 0);
  const bestWpm = state.entries.reduce((best, entry) => Math.max(best, entry.wpm), 0);
  $("streakStat").textContent = calculateStreak(state.entries);
  $("bestWpmStat").textContent = bestWpm;
  $("totalWordsStat").textContent = totalWords.toLocaleString();
  $("entriesStat").textContent = state.entries.length;
  $("entryCountLabel").textContent = state.entries.length;
}

function renderEntries() {
  const search = $("entrySearch").value.trim().toLowerCase();
  const entries = state.entries.filter((entry) => `${entry.title} ${entry.content} ${entry.mood}`.toLowerCase().includes(search));
  if (!entries.length) {
    $("entriesList").innerHTML = `<div class="empty-state"><strong>${search ? "No entries found" : "Your archive is waiting"}</strong><p>${search ? "Try a different word or phrase." : "Save your first entry above and it will appear here."}</p></div>`;
    return;
  }
  $("entriesList").innerHTML = entries.map((entry, index) => `
    <article class="entry-item">
      <div class="entry-day">${String(state.entries.length - index).padStart(2, "0")}</div>
      <div class="entry-content">
        <h3>${escapeHtml(entry.title)}</h3>
        <p>${escapeHtml(entry.content)}</p>
        <div class="entry-meta">${formatDate(entry.createdAt)} ${entry.mood ? `· ${escapeHtml(entry.mood)}` : ""} · ${entry.words} words ${entry.wpm ? `· ${entry.wpm} WPM` : ""}</div>
      </div>
      <div class="entry-actions">
        <button class="entry-action" data-action="edit" data-id="${entry.id}" type="button">Edit</button>
        <button class="entry-action delete" data-action="delete" data-id="${entry.id}" type="button">Delete</button>
      </div>
    </article>
  `).join("");
}

async function loadEntries() {
  const data = await request("/api/entries");
  state.entries = data.entries || [];
  renderStats();
  renderEntries();
  resetEditor(false);
}

function updateTypingMetrics() {
  const text = editor.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  const wpm = state.seconds ? Math.round(words / (state.seconds / 60)) : 0;
  $("wordCount").textContent = words;
  $("wpmCount").textContent = wpm;
}

function updateTimer() {
  const minutes = Math.floor(state.seconds / 60);
  const seconds = state.seconds % 60;
  $("timer").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  updateTypingMetrics();
}

function startTimer() {
  if (state.timerId || !editor.value.trim()) return;
  state.timerId = window.setInterval(() => {
    state.seconds += 1;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
}

function setMood(mood) {
  state.mood = mood;
  document.querySelectorAll(".mood-button").forEach((button) => button.classList.toggle("active", button.dataset.mood === mood));
}

function resetEditor(showMessage = true) {
  stopTimer();
  state.editingId = null;
  state.mood = "";
  state.seconds = 0;
  titleInput.value = "";
  editor.value = "";
  $("dayNumber").textContent = String(state.entries.length + 1).padStart(2, "0");
  $("entryDate").textContent = "Today";
  $("saveDot").style.background = "var(--green)";
  saveStatus.textContent = "Ready to write";
  setMood("");
  updateTimer();
  if (showMessage) {
    titleInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function editEntry(entry) {
  stopTimer();
  state.editingId = entry.id;
  state.mood = entry.mood;
  state.seconds = entry.seconds;
  titleInput.value = entry.title;
  editor.value = entry.content;
  $("dayNumber").textContent = String(state.entries.findIndex((candidate) => candidate.id === entry.id) + 1).padStart(2, "0");
  $("entryDate").textContent = formatDate(entry.createdAt);
  saveStatus.textContent = "Editing saved entry";
  setMood(entry.mood);
  updateTimer();
  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveEntry() {
  if (!titleInput.value.trim() || !editor.value.trim()) {
    showToast("Add a title and a few words before saving.", "error");
    (!titleInput.value.trim() ? titleInput : editor).focus();
    return;
  }
  const payload = { title: titleInput.value, content: editor.value, mood: state.mood, seconds: state.seconds };
  const method = state.editingId ? "PUT" : "POST";
  const url = state.editingId ? `/api/entries/${state.editingId}` : "/api/entries";
  try {
    $("saveButton").disabled = true;
    saveStatus.textContent = "Saving...";
    const data = await request(url, { method, body: JSON.stringify(payload) });
    if (state.editingId) {
      state.entries = state.entries.map((entry) => entry.id === state.editingId ? data.entry : entry);
    } else {
      state.entries = [data.entry, ...state.entries];
    }
    renderStats();
    renderEntries();
    const wasEditing = Boolean(state.editingId);
    resetEditor(false);
    showToast(wasEditing ? "Entry updated." : "Entry saved.");
  } catch (error) {
    showToast(error.message, "error");
    saveStatus.textContent = "Could not save";
  } finally {
    $("saveButton").disabled = false;
  }
}

async function deleteEntry(id) {
  const entry = state.entries.find((candidate) => candidate.id === id);
  if (!entry || !window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) return;
  try {
    await request(`/api/entries/${id}`, { method: "DELETE" });
    state.entries = state.entries.filter((candidate) => candidate.id !== id);
    renderStats();
    renderEntries();
    if (state.editingId === id) resetEditor(false);
    showToast("Entry deleted.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleAuth(event) {
  event.preventDefault();
  authError.textContent = "";
  const payload = { email: $("emailInput").value, password: $("passwordInput").value };
  if (state.authMode === "register") payload.name = $("nameInput").value;
  try {
    const data = await request(`/api/auth/${state.authMode}`, { method: "POST", body: JSON.stringify(payload) });
    state.user = data.user;
    showApp();
    await loadEntries();
  } catch (error) {
    authError.textContent = error.message;
  }
}

function bindEvents() {
  authForm.addEventListener("submit", handleAuth);
  $("authSwitch").addEventListener("click", () => setAuthMode(state.authMode === "login" ? "register" : "login"));
  $("passwordToggle").addEventListener("click", () => {
    const input = $("passwordInput");
    input.type = input.type === "password" ? "text" : "password";
    $("passwordToggle").textContent = input.type === "password" ? "Show" : "Hide";
  });
  $("themeButton").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });
  $("newEntryButton").addEventListener("click", () => resetEditor(true));
  $("resetEntryButton").addEventListener("click", () => resetEditor(true));
  $("saveButton").addEventListener("click", saveEntry);
  editor.addEventListener("input", () => {
    startTimer();
    updateTypingMetrics();
    saveStatus.textContent = state.editingId ? "Unsaved changes" : "Writing...";
    $("saveDot").style.background = "var(--accent)";
  });
  document.querySelectorAll(".mood-button").forEach((button) => button.addEventListener("click", () => setMood(button.dataset.mood)));
  $("entrySearch").addEventListener("input", renderEntries);
  $("entriesList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const entry = state.entries.find((candidate) => candidate.id === button.dataset.id);
    if (button.dataset.action === "edit" && entry) editEntry(entry);
    if (button.dataset.action === "delete") deleteEntry(button.dataset.id);
  });
  $("profileButton").addEventListener("click", () => { $("profileMenu").hidden = !$("profileMenu").hidden; });
  $("logoutButton").addEventListener("click", async () => {
    await request("/api/auth/logout", { method: "POST" });
    state.user = null;
    showAuth();
  });
  $("customizeButton").addEventListener("click", () => { $("customizeModal").hidden = false; });
  $("closeCustomize").addEventListener("click", () => { $("customizeModal").hidden = true; });
  $("customizeModal").addEventListener("click", (event) => { if (event.target === $("customizeModal")) $("customizeModal").hidden = true; });
  $("fontSelect").addEventListener("change", (event) => { state.font = event.target.value; localStorage.setItem("typingDiaryFont", state.font); applyAppearance(); });
  document.querySelectorAll(".page-style").forEach((button) => button.addEventListener("click", () => { state.pageStyle = button.dataset.pageStyle; localStorage.setItem("typingDiaryPageStyle", state.pageStyle); applyAppearance(); }));
  $("linesToggle").addEventListener("change", (event) => { state.pageStyle = event.target.checked ? "lined" : "blank"; localStorage.setItem("typingDiaryPageStyle", state.pageStyle); applyAppearance(); });
  $("resetSettings").addEventListener("click", () => { state.font = "dm"; state.pageStyle = "lined"; localStorage.removeItem("typingDiaryFont"); localStorage.removeItem("typingDiaryPageStyle"); applyAppearance(); });
  $("newPromptButton").addEventListener("click", () => { const current = $("promptText").textContent; const options = prompts.filter((prompt) => prompt !== current); $("promptText").textContent = options[Math.floor(Math.random() * options.length)]; });
}

async function boot() {
  bindEvents();
  applyTheme();
  applyAppearance();
  try {
    const data = await request("/api/auth/me");
    state.user = data.user;
    showApp();
    await loadEntries();
  } catch {
    showAuth();
  }
}

boot();