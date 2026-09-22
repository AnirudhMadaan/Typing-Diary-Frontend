const state = {
  user: null,
  entries: [],
  editingId: null,
  mood: "",
  seconds: 0,
  timerId: null,
  authMode: "login",
  theme: localStorage.getItem("typingDiaryTheme") || "dark",
  font: localStorage.getItem("typingDiaryFont") || "lora",
  pageStyle: localStorage.getItem("typingDiaryPageStyle") || "lined",
  palette: localStorage.getItem("typingDiaryPalette") || "forest",
  fontSize: Number(localStorage.getItem("typingDiaryFontSize") || 16),
  lineHeight: Number(localStorage.getItem("typingDiaryLineHeight") || 1.9),
  editorWidth: Number(localStorage.getItem("typingDiaryEditorWidth") || 720),
  texture: localStorage.getItem("typingDiaryTexture") !== "false",
  focus: localStorage.getItem("typingDiaryFocus") === "true",
  icon: localStorage.getItem("typingDiaryIcon") || "✦",
  accent: localStorage.getItem("typingDiaryAccent") || "",
  align: localStorage.getItem("typingDiaryAlign") || "left",
  textColor: localStorage.getItem("typingDiaryTextColor") || "",
  wordGoal: Number(localStorage.getItem("typingDiaryWordGoal") || 500),
  compact: localStorage.getItem("typingDiaryCompact") === "true",
  settingsTab: "page",
  settingsSyncTimer: null,
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
  document.body.dataset.toast = type || "ok";
  const toast = document.createElement("div");
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  toast.setAttribute("role", "status");
  $("toastRegion").append(toast);
  window.setTimeout(() => { toast.remove(); if (!document.querySelector(".toast")) delete document.body.dataset.toast; }, 3200);
}

async function request(url, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${url}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
  } catch {
    throw new Error("Unable to reach the diary server. Please check your connection and try again.");
  }

  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function getPaletteColor(name) {
  return ({ forest:"#176b4d", ink:"#b7772d", ocean:"#287b91", rose:"#a55267", lavender:"#715e9d", sunset:"#a65d35" })[name] || "#176b4d";
}
function getPaletteColorName(name) { return ({forest:"Forest", ink:"Ink", ocean:"Ocean", rose:"Rose", lavender:"Lavender", sunset:"Sunset"})[name] || "Forest"; }

function applyPreset(name) {
  const presets = {
    writer:{palette:"forest",font:"lora",pageStyle:"lined",accent:"",align:"left",texture:true,compact:false},
    journal:{palette:"rose",font:"caveat",pageStyle:"dots",accent:"",align:"left",texture:true,compact:false},
    study:{palette:"ocean",font:"dm",pageStyle:"grid",accent:"",align:"left",texture:false,compact:true},
    night:{palette:"ink",font:"mono",pageStyle:"paper",accent:"",align:"left",texture:true,compact:true}
  };
  Object.assign(state, presets[name] || {});
  persistAppearance(); applyAppearance(); showToast(`${name.replace(/(^|\s)\S/g,m=>m.toUpperCase())} preset applied.`);
}

function getPageProfiles() {
  try { return JSON.parse(localStorage.getItem("typingDiaryPageProfiles") || "{}"); } catch { return {}; }
}

function getPageProfile() {
  return { font: state.font, pageStyle: state.pageStyle, fontSize: state.fontSize, lineHeight: state.lineHeight, editorWidth: state.editorWidth, align: state.align, textColor: state.textColor };
}
function getGlobalProfile() { return { palette: state.palette, accent: state.accent, texture: state.texture, icon: state.icon, compact: state.compact }; }

function savePageProfile(entryId, serverEntry = null) {
  if (!entryId) return;
  const profiles = getPageProfiles();
  profiles[String(entryId)] = { ...getPageProfile(), global: getGlobalProfile(), savedAt: new Date().toISOString() };
  localStorage.setItem("typingDiaryPageProfiles", JSON.stringify(profiles));
  if (serverEntry) serverEntry.pageProfile = profiles[String(entryId)];
}

function getEntryProfile(entryId) {
  const entry = state.entries.find((candidate) => candidate.id === entryId);
  if (entry?.pageProfile) return { ...entry.pageProfile, global: entry.globalProfile || null };
  return getPageProfiles()[String(entryId)] || null;
}
function getEntryGlobalProfile(entryId) {
  const entry = state.entries.find((candidate) => candidate.id === entryId);
  return entry?.globalProfile || getEntryProfile(entryId)?.global || null;
}

function restorePageProfile(entryId) {
  const profile = getEntryProfile(entryId);
  if (!profile) return false;
  const global = profile.global || getEntryGlobalProfile(entryId);
  Object.assign(state, {
    font: profile.font || state.font, pageStyle: profile.pageStyle || state.pageStyle,
    fontSize: Number(profile.fontSize || state.fontSize), lineHeight: Number(profile.lineHeight || state.lineHeight),
    editorWidth: Number(profile.editorWidth || state.editorWidth), align: profile.align || state.align, textColor: profile.textColor || state.textColor
  });
  if (global) Object.assign(state, { palette: global.palette || state.palette, accent: global.accent || state.accent, texture: global.texture !== false, icon: global.icon || state.icon, compact: global.compact === true });
  persistAppearance(); applyTheme(); applyAppearance();
  return true;
}

async function syncGlobalSettings() {
  if (!state.user) return;
  try { await request("/api/settings", { method: "PUT", body: JSON.stringify({ page: getPageProfile(), global: getGlobalProfile() }) }); }
  catch (error) { console.warn("Typing Diary: settings sync failed", error); }
}

function queueSettingsSync() {
  window.clearTimeout(state.settingsSyncTimer);
  state.settingsSyncTimer = window.setTimeout(syncGlobalSettings, 350);
}

async function loadRemoteSettings() {
  if (!state.user) return;
  try {
    const data = await request("/api/settings");
    if (data.settings?.global) Object.assign(state, data.settings.global);
    if (data.settings?.page) Object.assign(state, data.settings.page);
    persistAppearance(); applyTheme(); applyAppearance();
  } catch (error) {
    console.warn("Typing Diary: settings could not be loaded", error);
  }
}

async function migrateLocalDesigns() {
  const profiles = getPageProfiles();
  const jobs = state.entries.filter((entry) => !entry.pageProfile && profiles[String(entry.id)]).slice(0, 20).map(async (entry) => {
    const profile = profiles[String(entry.id)];
    try {
      const data = await request(`/api/entries/${entry.id}/design`, { method: "PATCH", body: JSON.stringify({ pageProfile: profile, globalProfile: profile.global || getGlobalProfile() }) });
      if (data.entry) {
        entry.pageProfile = data.entry.pageProfile;
        entry.globalProfile = data.entry.globalProfile;
      }
    } catch (error) { console.warn("Typing Diary: design migration failed", error); }
  });
  if (jobs.length) await Promise.all(jobs);
}

function pageProfileLabel(profile) {
  if (!profile) return "Current page style";
  const fontNames = { dm:"DM Sans", lora:"Lora", fraunces:"Fraunces", caveat:"Caveat", patrick:"Patrick Hand", kalam:"Kalam", mono:"Space Mono" };
  return `${profile.pageStyle || "blank"} · ${fontNames[profile.font] || profile.font || "font"}`;
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  document.body.classList.toggle("light", state.theme === "light");
  $("themeButton").textContent = state.theme === "light" ? "☼" : "◐";
  $("themeButton").title = state.theme === "light" ? "Use evening paper" : "Use daylight paper";
  localStorage.setItem("typingDiaryTheme", state.theme);
}

function applyAppearance() {
  document.documentElement.dataset.palette = state.palette;
  document.documentElement.style.setProperty("--accent", state.accent || getPaletteColor(state.palette));
  document.documentElement.style.setProperty("--accent-strong", state.accent || getPaletteColor(state.palette));
  document.documentElement.style.setProperty("--custom-accent", state.accent || "");
  document.documentElement.style.setProperty("--editor-font-size", `${state.fontSize}px`);
  document.documentElement.style.setProperty("--editor-line-height", state.lineHeight);
  document.documentElement.style.setProperty("--editor-width", `${state.editorWidth}px`);
  document.body.classList.toggle("texture-off", !state.texture);
  document.body.classList.toggle("focus-mode", state.focus);
  editor.className = `editor-textarea font-${state.font === "dm" ? "dm-sans" : state.font}`;
  editor.style.textAlign = state.align;
  editor.style.color = state.textColor || "";
  document.body.classList.toggle("compact-writing", state.compact);
  $("editorCard").classList.remove("page-lined", "page-paper", "page-blank", "page-grid", "page-dots");
  $("editorCard").classList.add(`page-${state.pageStyle}`);
  document.querySelectorAll(".page-style").forEach((button) => {
    button.classList.toggle("active", button.dataset.pageStyle === state.pageStyle);
  });
  document.querySelectorAll(".font-choice").forEach((button) => button.classList.toggle("active", button.dataset.font === state.font));
  document.querySelectorAll(".palette-card").forEach((button) => button.classList.toggle("active", button.dataset.palette === state.palette));
  document.querySelectorAll(".icon-choice").forEach((button) => button.classList.toggle("active", button.dataset.icon === state.icon));
  const paletteNames = { forest: "Forest", ink: "Ink", ocean: "Ocean", rose: "Rose", lavender: "Lavender", sunset: "Sunset" };
  $("activePaletteLabel").textContent = paletteNames[state.palette] || "Forest";
  $("fontSizeRange").value = state.fontSize; $("fontSizeValue").textContent = `${state.fontSize}px`;
  $("lineHeightRange").value = state.lineHeight; $("lineHeightValue").textContent = Number(state.lineHeight).toFixed(2);
  $("editorWidthRange").value = state.editorWidth; $("editorWidthValue").textContent = `${state.editorWidth}px`;
  $("textureToggle").checked = state.texture; $("linesToggle").checked = state.pageStyle !== "blank"; $("focusToggle").checked = state.focus;
  $("compactToggle").checked = state.compact;
  $("wordGoalRange").value = state.wordGoal; $("wordGoalValue").textContent = state.wordGoal;
  $("accentColorPicker").value = state.accent || getPaletteColor(state.palette);
  $("textColorPicker").value = state.textColor || (state.theme === "light" ? "#26322b" : "#e7eee8");
  $("textColorSwatch").style.background = $("textColorPicker").value;
  document.querySelectorAll(".align-choice").forEach((button) => button.classList.toggle("active", button.dataset.align === state.align));
  document.querySelectorAll(".brand-mark").forEach((el) => el.textContent = state.icon);
  document.documentElement.dataset.icon = state.icon;
  document.querySelectorAll("[data-settings-scope]").forEach((section) => { section.hidden = section.dataset.settingsScope !== state.settingsTab; });
}

function persistAppearance() {
  localStorage.setItem("typingDiaryPalette", state.palette);
  localStorage.setItem("typingDiaryFont", state.font);
  localStorage.setItem("typingDiaryPageStyle", state.pageStyle);
  localStorage.setItem("typingDiaryFontSize", state.fontSize);
  localStorage.setItem("typingDiaryLineHeight", state.lineHeight);
  localStorage.setItem("typingDiaryEditorWidth", state.editorWidth);
  localStorage.setItem("typingDiaryTexture", state.texture);
  localStorage.setItem("typingDiaryFocus", state.focus);
  localStorage.setItem("typingDiaryIcon", state.icon);
  localStorage.setItem("typingDiaryAccent", state.accent);
  localStorage.setItem("typingDiaryAlign", state.align);
  localStorage.setItem("typingDiaryTextColor", state.textColor);
  localStorage.setItem("typingDiaryWordGoal", state.wordGoal);
  localStorage.setItem("typingDiaryCompact", state.compact);
  queueSettingsSync();
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
        ${(() => { const profile=getEntryProfile(entry.id)||{}; const global=getEntryGlobalProfile(entry.id)||{}; const page=profile.pageStyle||"blank"; const font=profile.font||"lora"; const ink=profile.textColor || "#26322b"; const palette=global.palette||state.palette; const previewText=(entry.content||"A quiet note from this day.").slice(0,72); return `<div class="history-design"><div class="history-preview page-${escapeHtml(page)} font-${font === "dm" ? "dm-sans" : font}" style="--history-ink:${escapeHtml(ink)}"><span>${escapeHtml(previewText)}</span></div><div class="history-design-meta"><span class="style-label">PAGE</span><span class="style-chip">${escapeHtml(page)}</span><span class="style-chip">${escapeHtml(font)}</span><span class="ink-dot" style="background:${escapeHtml(ink)}" title="Text color ${escapeHtml(ink)}"></span><span class="style-label global">GLOBAL</span><span class="mood-dot" style="background:${escapeHtml((global.accent || getPaletteColor(palette)))}" title="${escapeHtml(getPaletteColorName(palette))}"></span><span class="style-chip global-chip">${escapeHtml(getPaletteColorName(palette))}</span><span class="style-chip global-chip">${escapeHtml(global.icon||state.icon)}</span></div></div>`; })()}
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
  await migrateLocalDesigns();
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
  restorePageProfile(entry.id);
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
  const payload = { title: titleInput.value, content: editor.value, mood: state.mood, seconds: state.seconds, pageProfile: getPageProfile(), globalProfile: getGlobalProfile() };
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
    savePageProfile(data.entry.id, data.entry);
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

async function deleteAccount() {
  if (!window.confirm("Are you sure you want to delete your account? All your diary entries will be permanently erased.")) {
    return;
  }
  try {
    await request("/api/auth/me", { method: "DELETE" });
    state.user = null;
    showAuth();
    showToast("Account deleted successfully.");
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleAuth(event) {
  event.preventDefault();
  authError.textContent = "";

  const submitButton = authForm.querySelector('button[type="submit"]');
  const submitLabel = $("authSubmitLabel");
  const originalLabel = state.authMode === "register" ? "Create account" : "Sign in";
  const payload = { email: $("emailInput").value.trim(), password: $("passwordInput").value };
  if (state.authMode === "register") payload.name = $("nameInput").value.trim();

  submitButton.disabled = true;
  submitLabel.textContent = state.authMode === "register" ? "Creating…" : "Signing in…";

  try {
    const data = await request(`/api/auth/${state.authMode}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Authentication succeeded. Switch views immediately instead of allowing a
    // secondary archive request to make a successful login look like a failure.
    state.user = data.user;
    await loadRemoteSettings();
    showApp();

    try {
      await loadEntries();
    } catch (error) {
      state.entries = [];
      renderStats();
      renderEntries();
      resetEditor(false);
      showToast("Signed in. Your archive could not be loaded yet.", "error");
      console.error("Typing Diary: failed to load entries after authentication", error);
    }
  } catch (error) {
    authError.textContent = error.message;
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = originalLabel;
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
  if ($("deleteAccountBtn")) $("deleteAccountBtn").addEventListener("click", deleteAccount);
  $("customizeButton").addEventListener("click", () => {
    $("customizeModal").hidden = false;
    const tab = document.querySelector(`.settings-tab[data-settings-tab="${state.settingsTab}"]`) || document.querySelector('.settings-tab[data-settings-tab="page"]');
    tab.click();
  });
  $("closeCustomize").addEventListener("click", () => { $("customizeModal").hidden = true; });
  $("customizeModal").addEventListener("click", (event) => { if (event.target === $("customizeModal")) $("customizeModal").hidden = true; });
  document.querySelectorAll(".settings-tab").forEach((button) => button.addEventListener("click", () => {
    state.settingsTab = button.dataset.settingsTab;
    document.querySelectorAll(".settings-tab").forEach((tab) => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", active ? "true" : "false"); });
    document.querySelectorAll("[data-settings-scope]").forEach((section) => { section.hidden = section.dataset.settingsScope !== state.settingsTab; });
  }));
  document.querySelectorAll(".font-choice").forEach((button) => button.addEventListener("click", () => { state.font = button.dataset.font; persistAppearance(); applyAppearance(); }));
  document.querySelectorAll(".palette-card").forEach((button) => button.addEventListener("click", () => { state.palette = button.dataset.palette; persistAppearance(); applyAppearance(); }));
  document.querySelectorAll(".preset-card").forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.preset)));
  $("accentColorPicker").addEventListener("input", (event) => { state.accent = event.target.value; persistAppearance(); applyAppearance(); });
  $("textColorPicker").addEventListener("input", (event) => { state.textColor = event.target.value; persistAppearance(); applyAppearance(); });
  $("randomizeStyle").addEventListener("click", () => { const palettes=["forest","ink","ocean","rose","lavender","sunset"]; const fonts=["dm","lora","fraunces","caveat","patrick","kalam","mono"]; const pages=["lined","grid","dots","paper","blank"]; state.palette=palettes[Math.floor(Math.random()*palettes.length)]; state.font=fonts[Math.floor(Math.random()*fonts.length)]; state.pageStyle=pages[Math.floor(Math.random()*pages.length)]; state.accent=""; persistAppearance(); applyAppearance(); showToast("A new writing mood is ready."); });
  document.querySelectorAll(".page-style").forEach((button) => button.addEventListener("click", () => { state.pageStyle = button.dataset.pageStyle; persistAppearance(); applyAppearance(); }));
  document.querySelectorAll(".icon-choice").forEach((button) => button.addEventListener("click", () => { state.icon = button.dataset.icon; persistAppearance(); applyAppearance(); }));
  $("fontSizeRange").addEventListener("input", (event) => { state.fontSize = Number(event.target.value); persistAppearance(); applyAppearance(); });
  $("lineHeightRange").addEventListener("input", (event) => { state.lineHeight = Number(event.target.value); persistAppearance(); applyAppearance(); });
  $("editorWidthRange").addEventListener("input", (event) => { state.editorWidth = Number(event.target.value); persistAppearance(); applyAppearance(); });
  $("wordGoalRange").addEventListener("input", (event) => { state.wordGoal = Number(event.target.value); persistAppearance(); applyAppearance(); });
  document.querySelectorAll(".align-choice").forEach((button) => button.addEventListener("click", () => { state.align = button.dataset.align; persistAppearance(); applyAppearance(); }));
  $("textureToggle").addEventListener("change", (event) => { state.texture = event.target.checked; persistAppearance(); applyAppearance(); });
  $("linesToggle").addEventListener("change", (event) => { if (!event.target.checked) state.pageStyle = "blank"; else if (state.pageStyle === "blank") state.pageStyle = "lined"; persistAppearance(); applyAppearance(); });
  $("focusToggle").addEventListener("change", (event) => { state.focus = event.target.checked; persistAppearance(); applyAppearance(); });
  $("compactToggle").addEventListener("change", (event) => { state.compact = event.target.checked; persistAppearance(); applyAppearance(); });
  $("resetSettings").addEventListener("click", () => {
    Object.assign(state, { theme: "dark", font: "lora", pageStyle: "lined", palette: "forest", fontSize: 16, lineHeight: 1.9, editorWidth: 720, texture: true, focus: false, icon: "✦", accent: "", align: "left", wordGoal: 500, compact: false, textColor: "" });
    persistAppearance(); applyTheme(); applyAppearance(); showToast("Appearance reset.");
  });
  $("newPromptButton").addEventListener("click", () => { const current = $("promptText").textContent; const options = prompts.filter((prompt) => prompt !== current); $("promptText").textContent = options[Math.floor(Math.random() * options.length)]; });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      $("customizeModal").hidden = true;
      $("profileMenu").hidden = true;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !authView.hidden) {
      event.preventDefault();
      if (titleInput && !titleInput.closest("[hidden]")) saveEntry();
    }
  });
  document.addEventListener("click", (event) => {
    if (!$("profileMenu").hidden && !event.target.closest("#profileButton, #profileMenu")) {
      $("profileMenu").hidden = true;
    }
  });
}

async function boot() {
  bindEvents();
  applyTheme();
  applyAppearance();
  try {
    const data = await request("/api/auth/me");
    state.user = data.user;
    await loadRemoteSettings();
    showApp();
    await loadEntries();
  } catch {
    showAuth();
  }
}

boot();