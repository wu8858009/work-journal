/* 工作週誌 App — 應用邏輯 (vanilla JS, 無框架) */

const Theme = {
  KEY: "wj_theme",

  get() {
    const attr = document.documentElement.dataset.theme;
    if (attr === "dark" || attr === "light") return attr;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  },

  set(theme) {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(this.KEY, theme); } catch (e) {}
  },

  toggle() {
    this.set(this.get() === "dark" ? "light" : "dark");
  },
};

const ICONS = {
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke-linejoin="round"/><path d="M14 3v4h4M9 12h6M9 16h6M9 8h2"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a7.97 7.97 0 0 0 0-3l1.7-1.3-2-3.4-2 .6a8 8 0 0 0-2.6-1.5L14 2h-4l-.5 2.9a8 8 0 0 0-2.6 1.5l-2-.6-2 3.4L4.6 10.5a7.97 7.97 0 0 0 0 3L2.9 14.8l2 3.4 2-.6a8 8 0 0 0 2.6 1.5L10 22h4l.5-2.9a8 8 0 0 0 2.6-1.5l2 .6 2-3.4Z" stroke-linejoin="round"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0-.8 12.1a1 1 0 0 1-1 1H8.8a1 1 0 0 1-1-1L7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16.5 3.5a2 2 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linejoin="round"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18" stroke-linecap="round"/></svg>`,
  print: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z" stroke-linejoin="round"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15V5a1.5 1.5 0 0 1 1.5-1.5H15"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="15" r="3.2"/><path d="M10.3 12.7 18 5l2 2-1.5 1.5L20 10l-2 2-1.5-1.5L15 12" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  store: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9V5h16v4M4 9l1-4M20 9l-1-4M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9M9 20v-5h6v5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke-linecap="round"/><path d="M16 4.5a3.2 3.2 0 0 1 0 6.4M18.5 19a5 5 0 0 0-3.8-6.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke-linejoin="round"/><circle cx="12" cy="12" r="3"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 21V4a1 1 0 0 1 1-1h11l-2.5 4.5L19 12H6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  timer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="13" r="8.5"/><path d="M12 9v4l2.8 1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 1.5h6" stroke-linecap="round"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4" stroke-linecap="round"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2Z" stroke-linejoin="round"/></svg>`,
};

const state = {
  onlineUsers: [],
  settings: null,
  journals: [],
  currentId: null,
  view: "editor",
  openCategoryIds: new Set(),
  users: [],
  passwordResetRequests: [],
  auditLogs: [],
  departments: [],
  auditLogDepartmentFilter: "",
  lightTimer: { department: "", rows: [] },
  maintenanceSchedule: { department: "", tasks: [] },
  maintenanceReminderShown: false,
  // 總覽頁（管理員）：各餐廳的保養排程要另外抓，null = 還沒載入。
  overviewMaintenance: null,
  overviewMaintenanceLoading: false,
  overviewExport: null,
};

const AUDIT_ACTION_LABELS = {
  Signup: "自行註冊",
  ApproveUser: "核准帳號",
  CreateUser: "新增帳號",
  DeleteUser: "刪除帳號",
  ChangeRole: "變更角色",
  ResetPassword: "重設密碼",
  ForgotPassword: "忘記密碼申請",
  ApprovePasswordReset: "核准忘記密碼申請",
  RejectPasswordReset: "駁回忘記密碼申請",
};

function isoDate(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDefaultWeekRange(base = new Date()) {
  const d = new Date(base);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { start: isoDate(monday), end: isoDate(friday) };
}

function toROC(isoStr, style = "slash") {
  if (!isoStr) return "—";
  const d = new Date(isoStr + "T00:00:00");
  const y = d.getFullYear() - 1911;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return style === "full" ? `${y}年${m}月${dd}日` : `${y}/${m}/${dd}`;
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function dateUrgency(expectedDate, percent) {
  if (!expectedDate || (Number(percent) || 0) >= 100) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(expectedDate + "T00:00:00");
  const diffDays = Math.round((due - today) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "none";
}

// 依目前月份判斷套用哪一欄季節時段：6/7/8 月為夏季、12/1/2 月為冬季，其餘為春秋季節。
function getCurrentSeasonKey(now = new Date()) {
  const month = now.getMonth() + 1;
  if (month === 6 || month === 7 || month === 8) return "summer";
  if (month === 12 || month === 1 || month === 2) return "winter";
  return "springAutumn";
}

// 定時器的開始/結束時間是自由格式文字（例如 "18.5"、"24"），不是標準時間格式。
// 解析成小時數（可含小數，例如 18.5 代表 18:30）；無法解析時回傳 null。
function parseHourString(str) {
  if (typeof str !== "string" || !str.trim()) return null;
  const n = Number(str.trim());
  if (Number.isNaN(n) || n < 0 || n > 24) return null;
  return n;
}

// 依目前時間判斷這個時段現在是否應該運作中：true=開、false=關、null=時間格式無法判斷（保守不猜測）。
function isSeasonActiveNow(startStr, endStr, now = new Date()) {
  const start = parseHourString(startStr);
  const end = parseHourString(endStr);
  if (start === null || end === null) return null;
  const currentHour = now.getHours() + now.getMinutes() / 60;
  if (start <= end) return currentHour >= start && currentHour < end;
  return currentHour >= start || currentHour < end; // 跨午夜的時段，例如 18.5 ～ 05
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  const y = d.getFullYear() - 1911;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${dd} ${hh}:${mm}`;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function newCategory(name, isCompletedSection = false) {
  return { id: uid(), name, isCompletedSection, items: [] };
}

function newItem() {
  return { id: uid(), item: "", assignee: "", progress: "", expectedDate: "", percent: 0, homeCategoryId: "", isPriority: false, photos: [] };
}

// 讀取使用者選的照片檔案，縮小到最長邊 maxDim 並轉成 JPEG data URL，避免整份週誌（存成
// 單一 Mongo 文件）因為塞進太多原圖而爆掉。優先用 createImageBitmap 讀取，讓瀏覽器依照
// EXIF 方向自動轉正手機拍的照片；不支援的環境退回用 <img> 讀取。
async function fileToResizedDataUrl(file, maxDim = 1280, quality = 0.78) {
  let source;
  let width;
  let height;
  if (window.createImageBitmap) {
    try {
      source = await createImageBitmap(file, { imageOrientation: "from-image" });
      width = source.width;
      height = source.height;
    } catch (e) {
      source = null;
    }
  }
  if (!source) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    source = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
    width = source.naturalWidth;
    height = source.naturalHeight;
  }

  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(source, 0, 0, width, height);
  if (source.close) source.close();
  return canvas.toDataURL("image/jpeg", quality);
}

function defaultCategories() {
  return [
    newCategory("已完成事項", true),
    newCategory("商店街(工務)"),
    newCategory("委外廠商維修"),
  ];
}

// 新週誌預設要放進哪個部門：優先用「目前餐廳」，若那間不可編輯則改用第一個可編輯的餐廳。
function resolveDefaultDepartment() {
  const editableDepts = getEditableDepartmentNames();
  return editableDepts.includes(Auth.getCurrentDepartment())
    ? Auth.getCurrentDepartment()
    : editableDepts[0] || state.settings.defaultDepartment;
}

function buildNewJournal(overrides = {}) {
  const range = getDefaultWeekRange();
  return {
    id: uid(),
    department: resolveDefaultDepartment(),
    periodStart: range.start,
    periodEnd: range.end,
    categories: defaultCategories(),
    ...overrides,
  };
}

function getCurrentJournal() {
  return state.journals.find((j) => j.id === state.currentId) || null;
}

function canEditJournal(j) {
  if (!j) return false;
  return Auth.canEditDepartment(j.department);
}

// 「切換餐廳」下拉選單可列出的餐廳：一律以帳號的餐廳權限為準（包含管理員自己）。
// 勾了「全部餐廳」時後端會回傳全部餐廳；只勾部分餐廳就只列那幾間。管理員若完全沒指派
// 任何餐廳，才退回列出全部，避免登入後選單是空的。
function getSwitchableDepartmentNames() {
  const assigned = Auth.getMyDepartments().map((d) => d.departmentName).filter(Boolean);
  if (assigned.length === 0 && Auth.isAdmin()) return state.departments.map((d) => d.name);
  return assigned;
}

// 目前帳號可以「編輯」的餐廳名稱清單：管理員看全部餐廳，一般使用者只看自己被指派且可編輯的餐廳。
function getEditableDepartmentNames() {
  if (Auth.isAdmin()) return state.departments.map((d) => d.name);
  return Auth.getMyDepartments().filter((d) => d.canEdit).map((d) => d.departmentName);
}

// 是否至少有一間可編輯的餐廳（管理員一律可以；一般使用者需至少一間 CanEdit=true 的指派）。
function canCreateNewJournal() {
  return Auth.isAdmin() || Auth.getMyDepartments().some((d) => d.canEdit);
}

function categoryPercent(cat) {
  if (!cat.items.length) return 0;
  return Math.round(cat.items.reduce((s, i) => s + (Number(i.percent) || 0), 0) / cat.items.length);
}

function journalPercent(journal) {
  const allItems = journal.categories.flatMap((c) => c.items);
  if (!allItems.length) return 0;
  return Math.round(allItems.reduce((s, i) => s + (Number(i.percent) || 0), 0) / allItems.length);
}

function percentClass(p) {
  if (p >= 100) return "pct-done";
  if (p > 0) return "pct-progress";
  return "pct-none";
}

async function persistCurrent() {
  const j = getCurrentJournal();
  if (!j) return;
  await saveJournal(j);
}

// ---------------- Render ----------------

// 標題列顯示「目前是誰登入」：顯示名稱 + 角色/目前餐廳，讓多人共用裝置時一眼看得出來。
function renderHeaderUser() {
  const box = document.getElementById("header-user");
  const user = Auth.getUser();
  if (!user) {
    box.classList.add("hidden");
    return;
  }
  const dept = Auth.getCurrentDepartment();
  const role = user.role === "Admin" ? "系統管理員" : "";
  document.getElementById("header-user-name").textContent = user.displayName || user.username;
  document.getElementById("header-user-sub").textContent = [role, dept].filter(Boolean).join(" · ");
  box.classList.remove("hidden");
}

function render() {
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === state.view));
  const root = document.getElementById("view-root");
  const headerSub = document.getElementById("header-sub");
  const printable = state.view === "editor" || state.view === "timers" || state.view === "maintenance";
  document.getElementById("export-btn").classList.toggle("hidden", !printable || isIosStandalone());
  const canShare = canSharePdfFiles || isIosStandalone();
  document.getElementById("share-btn").classList.toggle("hidden", !printable || !canShare);
  document.getElementById("download-btn").classList.toggle("hidden", !printable || canShare);
  document.getElementById("fab-add-item").classList.toggle("hidden", state.view !== "editor" || !canEditJournal(getCurrentJournal()));
  document.getElementById("header-title").textContent = state.settings.companyName;
  renderHeaderUser();

  // 「總覽」只有管理員看得到；底部按鈕上的紅色數字是所有餐廳的逾期項目數。
  const isAdmin = Auth.isAdmin();
  if (state.view === "overview" && !isAdmin) state.view = "editor";
  const overviewNav = document.getElementById("nav-overview");
  overviewNav.classList.toggle("hidden", !isAdmin);
  const overdueCount = isAdmin ? collectOverdueItems().length : 0;
  const navBadge = overviewNav.querySelector(".nav-badge");
  navBadge.textContent = overdueCount > 99 ? "99+" : String(overdueCount);
  navBadge.classList.toggle("hidden", !overdueCount);

  if (state.view === "overview") {
    headerSub.textContent = "總覽";
    root.innerHTML = renderOverview();
    if (!state.overviewMaintenance) loadOverviewMaintenance();
  } else if (state.view === "editor") {
    headerSub.textContent = "工作週誌";
    root.innerHTML = renderEditor();
  } else if (state.view === "history") {
    headerSub.textContent = "歷史紀錄";
    root.innerHTML = renderHistory();
  } else if (state.view === "timers") {
    headerSub.textContent = "定時器";
    root.innerHTML = renderTimers();
  } else if (state.view === "maintenance") {
    headerSub.textContent = "保養排程";
    root.innerHTML = renderMaintenance();
  } else {
    headerSub.textContent = "設定";
    root.innerHTML = renderSettings();
  }
}

function renderEditor() {
  const j = getCurrentJournal();
  if (!j) {
    return `<div class="empty-state">
      <p>目前沒有週誌資料</p>
      ${canCreateNewJournal() ? `<button class="btn btn-primary" data-action="new-journal">${ICONS.plus}<span>建立本週週誌</span></button>` : ""}
    </div>`;
  }

  const editable = canEditJournal(j);
  const overall = journalPercent(j);

  const catsHtml = j.categories.map((cat) => {
    const pct = categoryPercent(cat);
    // 標記「優先」的項目排到同一類別的最前面；同樣是否優先的項目之間，維持原本的順序。
    const sortedItems = [...cat.items].sort((a, b) => (b.isPriority ? 1 : 0) - (a.isPriority ? 1 : 0));
    const itemsHtml = sortedItems.length
      ? sortedItems.map((it, idx) => itemRowHtml(cat, it, idx)).join("")
      : `<div class="cat-empty">尚無項目</div>`;
    return `
    <section class="card category-card" data-cat-id="${cat.id}">
      <header class="cat-header">
        <div class="cat-title">
          <span class="cat-name">${escapeHtml(cat.name)}</span>
          ${cat.isCompletedSection ? '<span class="badge badge-soft">完成區</span>' : ""}
        </div>
        <div class="cat-header-right">
          <span class="pct-chip ${percentClass(pct)}">${pct}%</span>
          ${editable ? `
          <button class="icon-btn" data-action="rename-category" data-cat="${cat.id}" title="重新命名">${ICONS.edit}</button>
          <button class="icon-btn icon-btn-danger" data-action="delete-category" data-cat="${cat.id}" title="刪除類別">${ICONS.trash}</button>` : ""}
        </div>
      </header>
      <div class="cat-items">${itemsHtml}</div>
    </section>`;
  }).join("");

  // 這個下拉選單是「切換目前餐廳」的捷徑（跟設定頁的「目前餐廳」是同一組邏輯/同一個
  // data-action），選別的餐廳會直接換去看那間餐廳自己的週誌，不是把這份週誌改歸屬到別的餐廳。
  const myDepartmentNames = getSwitchableDepartmentNames();
  const departmentOptions = Array.from(new Set([j.department, ...myDepartmentNames].filter(Boolean)));

  return `
  ${!editable ? `<p class="settings-note">此餐廳僅開放查看，無法編輯。</p>` : ""}
  <div class="journal-meta card">
    <div class="meta-row">
      <label class="meta-label">部門</label>
      <select class="meta-input field-select" data-action="switch-department" id="editor-department-select">
        ${departmentOptions.map((name) => `<option value="${escapeHtml(name)}" ${name === j.department ? "selected" : ""}>${escapeHtml(name)}</option>`).join("")}
      </select>
    </div>
    <div class="meta-row meta-row-dates">
      <label class="meta-label">期間</label>
      <input class="meta-input" type="date" value="${j.periodStart}" data-field="periodStart" ${editable ? "" : "disabled"} />
      <span class="meta-sep">～</span>
      <input class="meta-input" type="date" value="${j.periodEnd}" data-field="periodEnd" ${editable ? "" : "disabled"} />
    </div>
    <div class="meta-roc">${toROC(j.periodStart)} ～ ${toROC(j.periodEnd)}（民國）</div>
    <div class="overall-row">
      <div class="overall-bar"><div class="overall-bar-fill" style="width:${overall}%"></div></div>
      <span class="overall-label">整體完成度 ${overall}%</span>
    </div>
  </div>
  ${catsHtml}
  ${editable ? `<button class="add-category-btn" data-action="add-category">${ICONS.plus}<span>新增類別</span></button>` : ""}
  `;
}

function itemRowHtml(cat, it, idx) {
  const pct = Number(it.percent) || 0;
  const urgency = dateUrgency(it.expectedDate, pct);
  const urgencyClass = urgency === "overdue" ? "urgent-overdue" : urgency === "soon" ? "urgent-soon" : "";
  const urgencyLabel = urgency === "overdue" ? "（逾期）" : urgency === "soon" ? "（即將到期）" : "";
  return `
  <div class="item-row ${it.isPriority ? "item-priority" : ""}" data-action="edit-item" data-cat="${cat.id}" data-item="${it.id}">
    <div class="item-seq">${idx + 1}</div>
    <div class="item-main">
      <div class="item-title">${it.isPriority ? '<span class="badge badge-priority">優先</span>' : ""}${escapeHtml(it.item) || "（未命名項目）"}</div>
      ${it.progress ? `<div class="item-progress">${escapeHtml(it.progress)}</div>` : ""}
      <div class="item-meta">
        ${it.assignee ? `<span class="item-assignee">負責人：${escapeHtml(it.assignee)}</span>` : ""}
        ${it.expectedDate ? `<span class="item-date ${urgencyClass}">預計 ${toROC(it.expectedDate)}${urgencyLabel}</span>` : ""}
      </div>
    </div>
    <div class="item-right">
      ${it.photos && it.photos.length ? `
      <div class="item-photo-strip" data-action="view-photos" data-cat="${cat.id}" data-item="${it.id}" title="共 ${it.photos.length} 張照片，點擊放大">
        <img src="${it.photos[0].dataUrl}" class="item-photo-thumb" alt="" />
        ${it.photos.length > 1 ? `<span class="item-photo-count">+${it.photos.length - 1}</span>` : ""}
      </div>` : ""}
      <button class="icon-btn priority-toggle-btn ${it.isPriority ? "priority-toggle-active" : ""}" data-action="toggle-item-priority" data-cat="${cat.id}" data-item="${it.id}" title="${it.isPriority ? "取消優先處理" : "標記為優先處理"}">${ICONS.flag}</button>
      <span class="pct-chip ${percentClass(pct)}">${pct}%</span>
      ${ICONS.chevron}
    </div>
  </div>`;
}

// 依「目前餐廳」篩選卡片顯示的資料；沒有選定餐廳（例如管理員略過）時顯示全部。
function getJournalsForCurrentDepartment() {
  const current = Auth.getCurrentDepartment();
  return current ? state.journals.filter((j) => j.department === current) : state.journals;
}

function renderHistory() {
  const journals = getJournalsForCurrentDepartment();
  if (!journals.length) {
    return `<div class="empty-state"><p>${Auth.getCurrentDepartment() ? "此餐廳尚無歷史紀錄" : "尚無歷史紀錄"}</p></div>`;
  }
  const cards = journals.map((j) => {
    const pct = journalPercent(j);
    const active = j.id === state.currentId ? "history-active" : "";
    const editable = canEditJournal(j);
    return `
    <div class="card history-card ${active}">
      <div class="history-main" data-action="open-journal" data-id="${j.id}">
        <div class="history-top">
          <span class="history-dept">${escapeHtml(j.department)}${editable ? "" : ' <span class="badge badge-soft">僅查看</span>'}</span>
          <span class="pct-chip ${percentClass(pct)}">${pct}%</span>
        </div>
        <div class="history-period">${toROC(j.periodStart)} ～ ${toROC(j.periodEnd)}</div>
      </div>
      ${editable ? `
      <div class="history-actions">
        <button class="icon-btn" data-action="duplicate-journal" data-id="${j.id}" title="建立下週(複製未完成)">${ICONS.copy}</button>
        <button class="icon-btn icon-btn-danger" data-action="delete-journal" data-id="${j.id}" title="刪除">${ICONS.trash}</button>
      </div>` : ""}
    </div>`;
  }).join("");
  return `
  ${canCreateNewJournal() ? `<button class="add-category-btn" data-action="new-journal">${ICONS.plus}<span>新增本週週誌</span></button>` : ""}
  ${cards}`;
}

function renderTimers() {
  const dept = Auth.getCurrentDepartment();
  if (!dept) {
    return `<div class="empty-state"><p>請先選擇餐廳</p></div>`;
  }

  const canManage = Auth.canEditDepartment(dept);
  const rows = state.lightTimer.rows || [];
  const now = new Date();
  const currentSeasonKey = getCurrentSeasonKey(now);

  const seasons = [
    { key: "summer", label: "夏季", pillClass: "timer-pill-summer", start: "summerStart", end: "summerEnd" },
    { key: "springAutumn", label: "春秋季節", pillClass: "timer-pill-spring", start: "springAutumnStart", end: "springAutumnEnd" },
    { key: "winter", label: "冬季節", pillClass: "timer-pill-winter", start: "winterStart", end: "winterEnd" },
  ];

  const cards = rows.map((r) => {
    const current = seasons.find((s) => s.key === currentSeasonKey);
    const isOn = isSeasonActiveNow(r[current.start], r[current.end], now);
    const cardStateClass = isOn === true ? "timer-card-on" : isOn === false ? "timer-card-off" : "";
    const statusBadge = isOn === true
      ? `<span class="badge timer-status-badge timer-status-on"><span class="timer-status-dot"></span>運作中</span>`
      : isOn === false
      ? `<span class="badge timer-status-badge timer-status-off"><span class="timer-status-dot"></span>已關閉</span>`
      : "";

    const seasonsHtml = seasons.map((s) => `
      <div class="timer-season-row ${s.key === currentSeasonKey ? "timer-season-row-current" : ""}">
        <span class="timer-season-pill ${s.pillClass}">${s.label}</span>
        <span class="timer-season-range">${escapeHtml(r[s.start])} ～ ${escapeHtml(r[s.end])}</span>
      </div>`).join("");

    return `
    <div class="card timer-card ${cardStateClass}">
      <div class="timer-card-header">
        <div class="timer-card-title">
          <span class="timer-status-icon">${ICONS.bulb}</span>
          <span class="timer-location-name">${escapeHtml(r.location) || "（未命名地點）"}</span>
        </div>
        <div class="cat-header-right">
          ${statusBadge}
          ${canManage ? `
          <button class="icon-btn" data-action="edit-timer" data-id="${r.id}" title="編輯">${ICONS.edit}</button>
          <button class="icon-btn icon-btn-danger" data-action="delete-timer" data-id="${r.id}" title="刪除">${ICONS.trash}</button>` : ""}
        </div>
      </div>
      <div class="timer-seasons-list">${seasonsHtml}</div>
      ${r.note ? `<div class="timer-note">備註：${escapeHtml(r.note)}</div>` : ""}
    </div>`;
  }).join("");

  return `
  ${!canManage ? `<p class="settings-note">此餐廳僅開放查看，無法編輯。</p>` : ""}
  <p class="settings-note timer-legend">目前季節：${escapeHtml(seasons.find((s) => s.key === currentSeasonKey).label)}（6/7/8 月為夏季、12/1/2 月為冬季，其餘為春秋季節）；運作狀態依此欄位的時間自動判斷，時間格式無法辨識時不顯示狀態。</p>
  ${canManage ? `<button class="add-category-btn" data-action="add-timer">${ICONS.plus}<span>新增地點</span></button>` : ""}
  ${rows.length ? cards : `<div class="empty-state"><p>尚無定時器資料</p></div>`}`;
}

// ---------------- Modal: Light timer (Admin only) ----------------

function openTimerModal(id) {
  const rows = state.lightTimer.rows || [];
  const isNew = !id;
  const r = isNew
    ? { id: "", location: "", summerStart: "", summerEnd: "", springAutumnStart: "", springAutumnEnd: "", winterStart: "", winterEnd: "", note: "" }
    : rows.find((x) => x.id === id);
  if (!r) return;

  const modal = document.getElementById("modal-timer");
  modal.dataset.id = isNew ? "" : id;
  modal.querySelector("#timer-modal-title").textContent = isNew ? "新增地點" : "編輯地點";
  modal.querySelector("#timer-field-location").value = r.location;
  modal.querySelector("#timer-field-summer-start").value = r.summerStart;
  modal.querySelector("#timer-field-summer-end").value = r.summerEnd;
  modal.querySelector("#timer-field-spring-start").value = r.springAutumnStart;
  modal.querySelector("#timer-field-spring-end").value = r.springAutumnEnd;
  modal.querySelector("#timer-field-winter-start").value = r.winterStart;
  modal.querySelector("#timer-field-winter-end").value = r.winterEnd;
  modal.querySelector("#timer-field-note").value = r.note;
  showModal(modal);
  requestAnimationFrame(() => modal.querySelector("#timer-field-location").focus());
}

async function saveTimerModal() {
  const modal = document.getElementById("modal-timer");
  const id = modal.dataset.id;
  const isNew = !id;

  const location = modal.querySelector("#timer-field-location").value.trim();
  if (!location) {
    alert("請輸入地點名稱");
    return;
  }

  const data = {
    id: isNew ? uid() : id,
    location,
    summerStart: modal.querySelector("#timer-field-summer-start").value.trim(),
    summerEnd: modal.querySelector("#timer-field-summer-end").value.trim(),
    springAutumnStart: modal.querySelector("#timer-field-spring-start").value.trim(),
    springAutumnEnd: modal.querySelector("#timer-field-spring-end").value.trim(),
    winterStart: modal.querySelector("#timer-field-winter-start").value.trim(),
    winterEnd: modal.querySelector("#timer-field-winter-end").value.trim(),
    note: modal.querySelector("#timer-field-note").value.trim(),
  };

  const rows = state.lightTimer.rows || [];
  if (isNew) {
    rows.push(data);
  } else {
    const idx = rows.findIndex((r) => r.id === id);
    if (idx >= 0) rows[idx] = data;
  }
  state.lightTimer.rows = rows;
  await persistLightTimer();
  closeModal(modal);
  render();
}

async function handleDeleteTimer(id) {
  if (!confirm("確定要刪除這個地點的定時器設定嗎？")) return;
  state.lightTimer.rows = (state.lightTimer.rows || []).filter((r) => r.id !== id);
  await persistLightTimer();
  render();
}

async function persistLightTimer() {
  const dept = Auth.getCurrentDepartment();
  if (!dept) return;
  await Store.saveLightTimer(dept, { department: dept, rows: state.lightTimer.rows || [] });
}

function renderMaintenance() {
  const dept = Auth.getCurrentDepartment();
  if (!dept) {
    return `<div class="empty-state"><p>請先選擇餐廳</p></div>`;
  }

  const canManage = Auth.canEditDepartment(dept);
  const tasks = state.maintenanceSchedule.tasks || [];
  const currentMonth = new Date().getMonth() + 1;
  const dueThisMonth = tasks.filter((t) => (t.activeMonths || []).includes(currentMonth)).length;

  const cards = tasks.map((t, idx) => {
    const activeMonths = new Set(t.activeMonths || []);
    const isDueThisMonth = activeMonths.has(currentMonth);

    const monthPills = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const active = activeMonths.has(m);
      const cls = ["maintenance-month-pill"];
      if (active) cls.push("maintenance-month-pill-active");
      if (m === currentMonth) cls.push("maintenance-month-pill-current");
      return `<span class="${cls.join(" ")}">${m}</span>`;
    }).join("");

    return `
    <div class="card maintenance-card">
      <div class="maintenance-card-header">
        <div class="maintenance-card-title">
          <span class="maintenance-seq">${idx + 1}</span>
          <span class="maintenance-name">${escapeHtml(t.name) || "（未命名項目）"}</span>
        </div>
        <div class="cat-header-right">
          ${isDueThisMonth ? `<span class="badge timer-status-badge timer-status-on"><span class="timer-status-dot"></span>本月執行</span>` : ""}
          ${canManage ? `
          <button class="icon-btn" data-action="edit-maintenance" data-id="${t.id}" title="編輯">${ICONS.edit}</button>
          <button class="icon-btn icon-btn-danger" data-action="delete-maintenance" data-id="${t.id}" title="刪除">${ICONS.trash}</button>` : ""}
        </div>
      </div>
      <div class="maintenance-meta-row">
        ${t.frequencyLabel ? `<span class="timer-season-pill maintenance-freq-pill">${escapeHtml(t.frequencyLabel)}</span>` : ""}
        ${t.timesPerYear ? `<span class="maintenance-times">${escapeHtml(t.timesPerYear)}</span>` : ""}
        ${t.monthsText ? `<span class="maintenance-months-text">${escapeHtml(t.monthsText)}</span>` : ""}
      </div>
      <div class="maintenance-month-pills">${monthPills}</div>
    </div>`;
  }).join("");

  return `
  ${!canManage ? `<p class="settings-note">此餐廳僅開放查看，無法編輯。</p>` : ""}
  <p class="settings-note timer-legend">目前月份：${currentMonth} 月・共 ${tasks.length} 項保養作業，本月應執行 ${dueThisMonth} 項</p>
  ${canManage ? `<button class="add-category-btn" data-action="add-maintenance">${ICONS.plus}<span>新增保養項目</span></button>` : ""}
  ${tasks.length ? cards : `<div class="empty-state"><p>尚無保養排程資料</p></div>`}`;
}

// ---------------- Modal: Maintenance schedule (Admin only) ----------------

function renderMonthToggleGrid(container, activeMonths) {
  const active = new Set(activeMonths || []);
  container.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return `<button type="button" class="month-toggle-btn ${active.has(m) ? "active" : ""}" data-month="${m}">${m}</button>`;
  }).join("");
  container.querySelectorAll(".month-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });
}

function readMonthToggleGrid(container) {
  return Array.from(container.querySelectorAll(".month-toggle-btn.active"))
    .map((btn) => Number(btn.dataset.month))
    .sort((a, b) => a - b);
}

function openMaintenanceModal(id) {
  const tasks = state.maintenanceSchedule.tasks || [];
  const isNew = !id;
  const t = isNew
    ? { id: "", name: "", frequencyLabel: "", timesPerYear: "", monthsText: "", activeMonths: [] }
    : tasks.find((x) => x.id === id);
  if (!t) return;

  const modal = document.getElementById("modal-maintenance");
  modal.dataset.id = isNew ? "" : id;
  modal.querySelector("#maintenance-modal-title").textContent = isNew ? "新增保養項目" : "編輯保養項目";
  modal.querySelector("#maintenance-field-name").value = t.name;
  modal.querySelector("#maintenance-field-frequency").value = t.frequencyLabel;
  modal.querySelector("#maintenance-field-times").value = t.timesPerYear;
  modal.querySelector("#maintenance-field-months-text").value = t.monthsText;
  renderMonthToggleGrid(modal.querySelector("#maintenance-field-active-months"), t.activeMonths);
  showModal(modal);
  requestAnimationFrame(() => modal.querySelector("#maintenance-field-name").focus());
}

async function saveMaintenanceModal() {
  const modal = document.getElementById("modal-maintenance");
  const id = modal.dataset.id;
  const isNew = !id;

  const name = modal.querySelector("#maintenance-field-name").value.trim();
  if (!name) {
    alert("請輸入項目名稱");
    return;
  }

  const activeMonths = readMonthToggleGrid(modal.querySelector("#maintenance-field-active-months"));
  const monthsTextInput = modal.querySelector("#maintenance-field-months-text").value.trim();

  const data = {
    id: isNew ? uid() : id,
    name,
    frequencyLabel: modal.querySelector("#maintenance-field-frequency").value.trim(),
    timesPerYear: modal.querySelector("#maintenance-field-times").value.trim(),
    monthsText: monthsTextInput || (activeMonths.length ? `${activeMonths.join("、")}月` : ""),
    activeMonths,
  };

  const tasks = state.maintenanceSchedule.tasks || [];
  if (isNew) {
    tasks.push(data);
  } else {
    const idx = tasks.findIndex((x) => x.id === id);
    if (idx >= 0) tasks[idx] = data;
  }
  state.maintenanceSchedule.tasks = tasks;
  await persistMaintenanceSchedule();
  closeModal(modal);
  render();
}

async function handleDeleteMaintenance(id) {
  if (!confirm("確定要刪除這個保養項目嗎？")) return;
  state.maintenanceSchedule.tasks = (state.maintenanceSchedule.tasks || []).filter((t) => t.id !== id);
  await persistMaintenanceSchedule();
  render();
}

async function persistMaintenanceSchedule() {
  const dept = Auth.getCurrentDepartment();
  if (!dept) return;
  await Store.saveMaintenanceSchedule(dept, { department: dept, tasks: state.maintenanceSchedule.tasks || [] });
}

// 每次切換到「保養排程」頁面（同一次登入內只跳一次），跳出提醒視窗列出本月需執行的項目。
function maybeShowMaintenanceReminder() {
  if (state.maintenanceReminderShown) return;
  state.maintenanceReminderShown = true;

  const currentMonth = new Date().getMonth() + 1;
  const dueTasks = (state.maintenanceSchedule.tasks || []).filter((t) => (t.activeMonths || []).includes(currentMonth));
  if (!dueTasks.length) return;

  const modal = document.getElementById("modal-maintenance-reminder");
  modal.querySelector("#maintenance-reminder-title").textContent = `${currentMonth} 月保養提醒`;
  modal.querySelector("#maintenance-reminder-intro").textContent = `以下 ${dueTasks.length} 項本月需要執行保養：`;
  modal.querySelector("#maintenance-reminder-list").innerHTML = dueTasks.map((t) => `<li>${escapeHtml(t.name) || "（未命名項目）"}</li>`).join("");
  showModal(modal);
}

function renderSettings() {
  const s = state.settings;
  const user = Auth.getUser();

  const usersHtml = Auth.isAdmin() ? `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.users}帳號與權限管理</span>
        <p class="settings-section-subtitle">設定角色，以及每個帳號可存取哪些餐廳、能否編輯</p>
      </div>
      <button class="icon-btn" data-action="add-user" title="新增帳號">${ICONS.plus}</button>
    </div>
    ${state.users.map((u) => `
      <div class="user-row">
        <div class="user-row-main">
          <div class="user-row-name">${escapeHtml(u.displayName)}<span class="badge ${u.role === "Admin" ? "badge-role-admin" : "badge-role-user"}">${u.role === "Admin" ? "管理員" : "一般使用者"}</span>${!u.isApproved ? '<span class="badge badge-warning">待審核</span>' : ""}</div>
          <div class="user-row-username">帳號：${escapeHtml(u.username)}</div>
          <div class="dept-permission-chips">
            ${u.allDepartments
              ? `<span class="dept-permission-chip dept-permission-chip-all ${u.allDepartmentsCanEdit ? "" : "dept-permission-chip-view"}">${u.allDepartmentsCanEdit ? ICONS.edit : ICONS.eye}全部餐廳</span>`
              : u.departments && u.departments.length
              ? u.departments.map((d) => `<span class="dept-permission-chip ${d.canEdit ? "" : "dept-permission-chip-view"}">${d.canEdit ? ICONS.edit : ICONS.eye}${escapeHtml(d.departmentName)}</span>`).join("")
              : `<span class="dept-permission-chip dept-permission-chip-empty">尚未指派餐廳</span>`}
          </div>
        </div>
        <div class="user-row-actions">
          ${!u.isApproved ? `<button class="btn btn-primary user-approve-btn" data-action="approve-user" data-id="${u.id}">核准</button>` : ""}
          <select class="field-input field-select user-role-select" data-action="change-role" data-id="${u.id}">
            <option value="User" ${u.role === "User" ? "selected" : ""}>一般使用者</option>
            <option value="Admin" ${u.role === "Admin" ? "selected" : ""}>管理員</option>
          </select>
          <button class="icon-btn" data-action="rename-user" data-id="${u.id}" title="更改名稱">${ICONS.edit}</button>
          <button class="icon-btn" data-action="manage-user-departments" data-id="${u.id}" title="餐廳權限">${ICONS.store}</button>
          <button class="icon-btn" data-action="reset-password" data-id="${u.id}" title="重設密碼">${ICONS.key}</button>
          <button class="icon-btn icon-btn-danger" data-action="delete-user" data-id="${u.id}" title="刪除">${ICONS.trash}</button>
        </div>
      </div>`).join("")}
  </div>` : "";

  const departmentsHtml = Auth.isAdmin() ? `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.store}餐廳管理</span>
        <p class="settings-section-subtitle">維護可供登入畫面選擇的餐廳清單</p>
      </div>
      <button class="icon-btn" data-action="add-department" title="新增餐廳">${ICONS.plus}</button>
    </div>
    ${state.departments.map((d) => `
      <div class="user-row">
        <div class="user-row-main"><div class="user-row-name">${escapeHtml(d.name)}</div></div>
        <div class="user-row-actions">
          <button class="icon-btn" data-action="rename-department" data-id="${d.id}" data-name="${escapeHtml(d.name)}" title="重新命名">${ICONS.edit}</button>
          <button class="icon-btn icon-btn-danger" data-action="delete-department" data-id="${d.id}" title="刪除">${ICONS.trash}</button>
        </div>
      </div>`).join("") || `<p class="cat-empty">尚無餐廳，請先新增</p>`}
  </div>` : "";

  // 系統管理員不受餐廳綁定限制，切換選單顯示全部餐廳；一般使用者僅顯示自己被指派的餐廳。
  const myDepartmentNames = getSwitchableDepartmentNames();
  const currentDepartmentHtml = myDepartmentNames.length > 1 ? `
    <div class="meta-row">
      <label class="meta-label">目前餐廳</label>
      <select class="field-input field-select" data-action="switch-department" id="current-department-select">
        ${myDepartmentNames.map((d) => `<option value="${escapeHtml(d)}" ${d === Auth.getCurrentDepartment() ? "selected" : ""}>${escapeHtml(d)}</option>`).join("")}
      </select>
    </div>` : "";

  const resetRequestsHtml = Auth.isAdmin() && state.passwordResetRequests.length ? `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.key}忘記密碼申請</span>
        <p class="settings-section-subtitle">待處理的使用者忘記密碼申請</p>
      </div>
    </div>
    ${state.passwordResetRequests.map((r) => `
      <div class="user-row">
        <div class="user-row-main">
          <div class="user-row-name">${escapeHtml(r.displayName)}</div>
          <div class="user-row-username">帳號：${escapeHtml(r.username)}</div>
        </div>
        <div class="user-row-actions">
          <button class="btn btn-primary user-approve-btn" data-action="approve-reset-request" data-id="${r.id}">設定新密碼</button>
          <button class="icon-btn icon-btn-danger" data-action="reject-reset-request" data-id="${r.id}" title="駁回">${ICONS.trash}</button>
        </div>
      </div>`).join("")}
  </div>` : "";

  const auditDeptFilter = state.auditLogDepartmentFilter;
  const filteredAuditLogs = auditDeptFilter
    ? state.auditLogs.filter((l) => l.department && l.department.split("、").includes(auditDeptFilter))
    : state.auditLogs;

  const auditHtml = Auth.isAdmin() ? `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.clock}操作紀錄</span>
        <p class="settings-section-subtitle">系統帳號與權限相關異動的歷史紀錄</p>
      </div>
      <select class="field-input field-select audit-dept-filter" data-action="filter-audit-department">
        <option value="">全部餐廳</option>
        ${state.departments.map((d) => `<option value="${escapeHtml(d.name)}" ${d.name === auditDeptFilter ? "selected" : ""}>${escapeHtml(d.name)}</option>`).join("")}
      </select>
    </div>
    <div class="audit-log-list">
      ${filteredAuditLogs.length ? filteredAuditLogs.map((l) => `
        <div class="audit-log-row">
          <div class="audit-log-main">
            <span class="audit-log-action">${escapeHtml(AUDIT_ACTION_LABELS[l.action] || l.action)}</span>
            ${l.targetDescription ? `<span class="audit-log-target">${escapeHtml(l.targetDescription)}</span>` : ""}
            ${l.department ? `<span class="badge badge-soft">${escapeHtml(l.department)}</span>` : ""}
          </div>
          <div class="audit-log-meta">
            <span>${escapeHtml(l.actorUsername || "系統")}</span>
            <span>${formatDateTime(l.createdAt)}</span>
          </div>
        </div>`).join("") : `<p class="cat-empty">${auditDeptFilter ? "此餐廳尚無相關紀錄" : "尚無紀錄"}</p>`}
    </div>
  </div>` : "";

  const companySettingsHtml = Auth.isAdmin() ? `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.gear}系統設定</span>
        <p class="settings-section-subtitle">套用於整個系統的基本資訊</p>
      </div>
    </div>
    <div class="meta-row">
      <label class="meta-label">公司名稱</label>
      <input class="meta-input" type="text" value="${escapeHtml(s.companyName)}" data-setting="companyName" />
    </div>
    <div class="meta-row">
      <label class="meta-label">預設部門</label>
      <input class="meta-input" type="text" value="${escapeHtml(s.defaultDepartment)}" data-setting="defaultDepartment" />
    </div>
  </div>` : "";

  const onlineUsersHtml = Auth.isAdmin() ? `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title"><span class="online-dot"></span>目前在線 <span class="badge badge-soft" id="online-users-count">${state.onlineUsers.length} 人</span></span>
        <p class="settings-section-subtitle">有開著軟體的帳號，約每 5 秒自動更新</p>
      </div>
    </div>
    <div id="online-users-list">${renderOnlineUsersRows()}</div>
  </div>` : "";

  const pendingUserCount = state.users.filter((u) => !u.isApproved).length;
  const adminPanelHtml = Auth.isAdmin() ? `
  <div class="admin-panel">
    <div class="admin-panel-header">
      ${ICONS.shield}
      <div>
        <div class="admin-panel-title">系統管理員</div>
        <div class="admin-panel-subtitle">帳號、權限與系統紀錄的集中管理</div>
      </div>
    </div>
    <div class="admin-stats-grid">
      <div class="admin-stat-tile"><span class="admin-stat-value">${state.users.length}</span><span class="admin-stat-label">帳號總數</span></div>
      <div class="admin-stat-tile ${pendingUserCount ? "admin-stat-tile-warning" : ""}"><span class="admin-stat-value">${pendingUserCount}</span><span class="admin-stat-label">待審核帳號</span></div>
      <div class="admin-stat-tile"><span class="admin-stat-value" id="online-users-tile">${state.onlineUsers.length}</span><span class="admin-stat-label">目前在線</span></div>
      <div class="admin-stat-tile"><span class="admin-stat-value">${state.departments.length}</span><span class="admin-stat-label">餐廳數</span></div>
      <div class="admin-stat-tile ${state.passwordResetRequests.length ? "admin-stat-tile-warning" : ""}"><span class="admin-stat-value">${state.passwordResetRequests.length}</span><span class="admin-stat-label">待處理密碼申請</span></div>
    </div>
    ${onlineUsersHtml}
    ${companySettingsHtml}
    ${usersHtml}
    ${departmentsHtml}
    ${resetRequestsHtml}
    ${auditHtml}
  </div>` : "";

  return `
  <div class="card settings-card">
    <div class="meta-row">
      <label class="meta-label">登入帳號</label>
      <span class="meta-input">${escapeHtml(user ? (user.displayName || user.username) : "—")}</span>
    </div>
    ${currentDepartmentHtml}
    <button class="btn btn-ghost logout-btn" data-action="logout">登出</button>
  </div>
  ${adminPanelHtml}
  <p class="settings-note">資料儲存於公司後端資料庫，登入後可跨裝置同步。</p>
  `;
}

// ---------------- Modal: Item ----------------

// 項目照片是編輯中的暫存狀態：開啟項目視窗時從該項目複製一份到這裡，使用者拍照/新增/
// 編輯/刪除都只改這份暫存陣列，按「儲存」才會寫回項目物件並隨整份週誌一起送出。
let itemModalPhotos = [];

function renderItemModalPhotos(editable) {
  const grid = document.getElementById("item-field-photos");
  grid.innerHTML = itemModalPhotos.map((p) => `
    <div class="photo-thumb" data-photo="${p.id}">
      <img src="${p.dataUrl}" alt="照片" ${editable ? `data-action="edit-photo" data-photo="${p.id}"` : ""} />
      ${editable ? `<button type="button" class="photo-thumb-delete" data-action="delete-photo" data-photo="${p.id}" title="刪除照片">${ICONS.close}</button>` : ""}
    </div>`).join("") || `<p class="cat-empty photo-grid-empty">尚無照片</p>`;
}

// 「目前進度說明」常常有好幾行，固定高度的輸入框在手機上只露出兩三行、要在框裡面捲動
// 才看得到後面。改成依內容自動長高，整段都看得到；外層的視窗本身會捲動。
// 必須在視窗顯示之後呼叫，隱藏時量不到 scrollHeight。
function autoGrowTextarea(el) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
}

function openItemModal(catId, itemId) {
  const j = getCurrentJournal();
  if (!j.categories.length) {
    alert("請先新增類別，才能新增項目");
    return;
  }
  const resolvedCatId = catId || j.categories[0].id;
  const cat = j.categories.find((c) => c.id === resolvedCatId);
  const isNew = !itemId;
  const it = isNew ? newItem() : cat.items.find((i) => i.id === itemId);

  const modal = document.getElementById("modal-item");
  modal.dataset.cat = resolvedCatId;
  modal.dataset.item = isNew ? "" : itemId;
  modal.dataset.home = it.homeCategoryId || resolvedCatId;

  const catSelect = modal.querySelector("#item-field-category");
  catSelect.innerHTML = j.categories
    .map((c) => `<option value="${c.id}" data-completed="${c.isCompletedSection ? "1" : "0"}">${escapeHtml(c.name)}</option>`)
    .join("");
  catSelect.value = resolvedCatId;

  modal.querySelector("#item-field-name").value = it.item;
  modal.querySelector("#item-field-assignee").value = it.assignee || "";
  modal.querySelector("#item-field-progress").value = it.progress;
  modal.querySelector("#item-field-date").value = it.expectedDate;
  modal.querySelector("#item-field-percent").value = String(Math.round((Number(it.percent) || 0) / 10) * 10);
  modal.querySelector("#item-field-priority").checked = !!it.isPriority;

  itemModalPhotos = (it.photos || []).map((p) => ({ ...p }));

  const editable = canEditJournal(j);
  modal.querySelector("#item-modal-title").textContent = (isNew ? "新增項目" : "編輯項目") + (editable ? "" : "（唯讀）");
  ["item-field-category", "item-field-name", "item-field-assignee", "item-field-progress", "item-field-date", "item-field-percent", "item-field-priority"]
    .forEach((fieldId) => { modal.querySelector(`#${fieldId}`).disabled = !editable; });
  modal.querySelector("#item-delete-btn").classList.toggle("hidden", isNew || !editable);
  modal.querySelector("#item-save-btn").classList.toggle("hidden", !editable);
  modal.querySelector(".photo-add-row").classList.toggle("hidden", !editable);
  renderItemModalPhotos(editable);
  applyPercentCategoryLock(modal);
  if (!editable) modal.querySelector("#item-field-category").disabled = true;
  showModal(modal);
  autoGrowTextarea(modal.querySelector("#item-field-progress"));
  if (editable) {
    requestAnimationFrame(() => modal.querySelector("#item-field-name").focus());
  }
}

function applyPercentCategoryLock(modal) {
  const percentSelect = modal.querySelector("#item-field-percent");
  const catSelect = modal.querySelector("#item-field-category");
  const options = Array.from(catSelect.options);
  const completedOption = options.find((o) => o.dataset.completed === "1");
  if (Number(percentSelect.value) >= 100 && completedOption) {
    catSelect.value = completedOption.value;
    catSelect.disabled = true;
  } else {
    catSelect.disabled = false;
    // Only auto-jump back when the select is currently sitting on the completed
    // category (i.e. percent just dropped below 100) — don't clobber a category
    // the user deliberately picked while editing a non-completed item.
    if (completedOption && catSelect.value === completedOption.value) {
      const homeId = modal.dataset.home;
      const homeOption = options.find((o) => o.value === homeId && o.dataset.completed !== "1");
      const fallbackOption = options.find((o) => o.dataset.completed !== "1");
      if (homeOption) catSelect.value = homeOption.value;
      else if (fallbackOption) catSelect.value = fallbackOption.value;
    }
  }
}

function closeModal(modal) {
  modal.classList.remove("open");
}
function showModal(modal) {
  modal.classList.add("open");
}

async function saveItemModal() {
  const modal = document.getElementById("modal-item");
  const originalCatId = modal.dataset.cat;
  const itemId = modal.dataset.item;
  let targetCatId = modal.querySelector("#item-field-category").value;
  const j = getCurrentJournal();
  if (!canEditJournal(j)) return;
  const originalCat = j.categories.find((c) => c.id === originalCatId);

  const data = {
    item: modal.querySelector("#item-field-name").value.trim(),
    assignee: modal.querySelector("#item-field-assignee").value.trim(),
    progress: modal.querySelector("#item-field-progress").value.trim(),
    expectedDate: modal.querySelector("#item-field-date").value,
    percent: Math.max(0, Math.min(100, Number(modal.querySelector("#item-field-percent").value) || 0)),
    isPriority: modal.querySelector("#item-field-priority").checked,
    photos: itemModalPhotos,
  };

  if (!data.item) {
    alert("請輸入工作項目名稱");
    return;
  }

  if (data.percent < 100) {
    data.homeCategoryId = targetCatId;
  } else {
    const completedCat = j.categories.find((c) => c.isCompletedSection);
    if (completedCat) targetCatId = completedCat.id;
    if (!itemId) {
      const fallback = j.categories.find((c) => !c.isCompletedSection);
      data.homeCategoryId = fallback ? fallback.id : targetCatId;
    }
  }
  const targetCat = j.categories.find((c) => c.id === targetCatId);

  if (itemId) {
    const it = originalCat.items.find((i) => i.id === itemId);
    Object.assign(it, data);
    if (targetCatId !== originalCatId) {
      originalCat.items = originalCat.items.filter((i) => i.id !== itemId);
      targetCat.items.push(it);
    }
  } else {
    targetCat.items.push({ id: uid(), ...data });
  }

  await persistCurrent();
  closeModal(modal);
  render();
}

async function deleteItemModal() {
  const modal = document.getElementById("modal-item");
  const catId = modal.dataset.cat;
  const itemId = modal.dataset.item;
  if (!itemId) return;
  const j = getCurrentJournal();
  if (!canEditJournal(j)) return;
  const cat = j.categories.find((c) => c.id === catId);
  cat.items = cat.items.filter((i) => i.id !== itemId);
  await persistCurrent();
  closeModal(modal);
  render();
}

// ---------------- Photo editor (draw / add text on a photo) ----------------
//
// 已存的照片其實是「拍照時的畫面 + 上次畫的線條文字」已經合併成一張圖，重新開啟編輯
// 只是把那張合成好的圖當成新的底圖，在上面繼續加線條/文字；復原(undo)只能復原這次在
// 編輯器裡新增的筆畫，沒辦法回到更早以前已經存檔、疊進圖片裡的標記。這樣設計是因為
// 週誌本身存成單一 Mongo 文件，不需要另外為每張照片保存一份可回溯的向量圖層歷史。
let photoEditorState = null;

function openPhotoEditor(dataUrl, onSave) {
  const modal = document.getElementById("modal-photo-editor");
  const canvas = modal.querySelector("#photo-editor-canvas");
  const img = new Image();
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    photoEditorState = {
      img,
      canvas,
      ctx: canvas.getContext("2d"),
      ops: [],
      tool: "pen",
      color: modal.querySelector("#photo-color-picker").value,
      strokeWidth: Number(modal.querySelector("#photo-stroke-width").value),
      drawing: false,
      currentStroke: null,
      onSave,
    };
    modal.querySelectorAll(".photo-tool-btn").forEach((b) => b.classList.toggle("active", b.dataset.tool === "pen"));
    redrawPhotoEditor();
    showModal(modal);
  };
  img.src = dataUrl;
}

function redrawPhotoEditor() {
  const st = photoEditorState;
  if (!st) return;
  st.ctx.clearRect(0, 0, st.canvas.width, st.canvas.height);
  st.ctx.drawImage(st.img, 0, 0, st.canvas.width, st.canvas.height);
  st.ops.forEach((op) => drawPhotoOp(st.ctx, op));
}

function drawPhotoOp(ctx, op) {
  if (op.type === "stroke") {
    if (op.points.length < 2) return;
    ctx.strokeStyle = op.color;
    ctx.lineWidth = op.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(op.points[0].x, op.points[0].y);
    for (let i = 1; i < op.points.length; i++) ctx.lineTo(op.points[i].x, op.points[i].y);
    ctx.stroke();
  } else if (op.type === "text") {
    ctx.fillStyle = op.color;
    ctx.font = `bold ${op.size}px "PingFang TC", "Microsoft JhengHei", sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText(op.text, op.x, op.y);
  }
}

function photoCanvasPoint(e) {
  const st = photoEditorState;
  const rect = st.canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * st.canvas.width,
    y: ((e.clientY - rect.top) / rect.height) * st.canvas.height,
  };
}

function openPhotoTextInput(canvasPt, clientX, clientY) {
  const wrap = document.getElementById("photo-editor-canvas-wrap");
  wrap.querySelector(".photo-text-input")?.remove();
  const input = document.createElement("input");
  input.type = "text";
  input.className = "photo-text-input";
  const wrapRect = wrap.getBoundingClientRect();
  input.style.left = `${clientX - wrapRect.left}px`;
  input.style.top = `${clientY - wrapRect.top}px`;
  input.style.color = photoEditorState.color;
  wrap.appendChild(input);
  input.focus();

  let done = false;
  const commit = () => {
    if (done) return;
    done = true;
    const text = input.value.trim();
    input.remove();
    if (text) {
      const st = photoEditorState;
      st.ops.push({ type: "text", text, color: st.color, size: Math.max(20, st.strokeWidth * 5), x: canvasPt.x, y: canvasPt.y });
      redrawPhotoEditor();
    }
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); input.blur(); }
    else if (e.key === "Escape") { done = true; input.remove(); }
  });
  input.addEventListener("blur", commit);
}

function endPhotoStroke() {
  const st = photoEditorState;
  if (!st || !st.drawing) return;
  st.drawing = false;
  if (st.currentStroke && st.currentStroke.points.length > 1) st.ops.push(st.currentStroke);
  st.currentStroke = null;
}

function undoPhotoEditor() {
  const st = photoEditorState;
  if (!st || !st.ops.length) return;
  st.ops.pop();
  redrawPhotoEditor();
}

function clearPhotoEditor() {
  const st = photoEditorState;
  if (!st || !st.ops.length) return;
  st.ops = [];
  redrawPhotoEditor();
}

function savePhotoEditor() {
  const st = photoEditorState;
  if (!st) return;
  const dataUrl = st.canvas.toDataURL("image/jpeg", 0.85);
  const onSave = st.onSave;
  closeModal(document.getElementById("modal-photo-editor"));
  photoEditorState = null;
  onSave(dataUrl);
}

function cancelPhotoEditor() {
  closeModal(document.getElementById("modal-photo-editor"));
  photoEditorState = null;
}

// ---------------- Photo viewer (tap a card's photo to view full-size + zoom) ----------------

let photoViewerState = null;

function openPhotoViewer(photos, startIndex) {
  photoViewerState = {
    photos,
    index: startIndex || 0,
    scale: 1,
    tx: 0,
    ty: 0,
    pointers: new Map(),
    pinchStartDist: 0,
    pinchStartScale: 1,
    panStart: null,
  };
  document.getElementById("modal-photo-viewer").classList.add("open");
  updatePhotoViewerImage();
}

function closePhotoViewer() {
  document.getElementById("modal-photo-viewer").classList.remove("open");
  photoViewerState = null;
}

function updatePhotoViewerImage() {
  const s = photoViewerState;
  if (!s) return;
  s.scale = 1;
  s.tx = 0;
  s.ty = 0;
  document.getElementById("photo-viewer-img").src = s.photos[s.index].dataUrl;
  applyPhotoViewerTransform();
  document.getElementById("photo-viewer-count").textContent = s.photos.length > 1 ? `${s.index + 1} / ${s.photos.length}` : "";
  document.getElementById("photo-viewer-prev-btn").classList.toggle("hidden", s.photos.length <= 1);
  document.getElementById("photo-viewer-next-btn").classList.toggle("hidden", s.photos.length <= 1);
}

function applyPhotoViewerTransform() {
  const s = photoViewerState;
  if (!s) return;
  document.getElementById("photo-viewer-img").style.transform = `translate(${s.tx}px, ${s.ty}px) scale(${s.scale})`;
}

function photoViewerPrev() {
  const s = photoViewerState;
  if (!s || s.photos.length <= 1) return;
  s.index = (s.index - 1 + s.photos.length) % s.photos.length;
  updatePhotoViewerImage();
}

function photoViewerNext() {
  const s = photoViewerState;
  if (!s || s.photos.length <= 1) return;
  s.index = (s.index + 1) % s.photos.length;
  updatePhotoViewerImage();
}

// 縮放/拖曳都用 Pointer Events 統一處理滑鼠與觸控：兩指縮放依兩點距離變化換算比例，
// 單指只有在已經放大時才拖曳平移；縮放跟拖曳外，滾輪(桌面)、雙擊/雙點也能切換縮放。
function wirePhotoViewerEvents() {
  const modal = document.getElementById("modal-photo-viewer");
  const stage = document.getElementById("photo-viewer-stage");
  const img = document.getElementById("photo-viewer-img");
  const MAX_SCALE = 5;

  document.getElementById("photo-viewer-close-btn").addEventListener("click", closePhotoViewer);
  document.getElementById("photo-viewer-prev-btn").addEventListener("click", photoViewerPrev);
  document.getElementById("photo-viewer-next-btn").addEventListener("click", photoViewerNext);

  stage.addEventListener("click", (e) => {
    if (e.target === stage && photoViewerState && photoViewerState.scale <= 1) closePhotoViewer();
  });

  stage.addEventListener("wheel", (e) => {
    if (!photoViewerState) return;
    e.preventDefault();
    const s = photoViewerState;
    const delta = -e.deltaY * 0.0015;
    s.scale = Math.min(MAX_SCALE, Math.max(1, s.scale + s.scale * delta));
    if (s.scale === 1) { s.tx = 0; s.ty = 0; }
    applyPhotoViewerTransform();
  }, { passive: false });

  img.addEventListener("dblclick", () => {
    if (!photoViewerState) return;
    const s = photoViewerState;
    s.scale = s.scale > 1 ? 1 : 2.5;
    s.tx = 0;
    s.ty = 0;
    applyPhotoViewerTransform();
  });

  stage.addEventListener("pointerdown", (e) => {
    const s = photoViewerState;
    if (!s) return;
    stage.setPointerCapture(e.pointerId);
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pointers.size === 2) {
      const pts = [...s.pointers.values()];
      s.pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      s.pinchStartScale = s.scale;
    } else if (s.pointers.size === 1) {
      s.panStart = { x: e.clientX, y: e.clientY, tx: s.tx, ty: s.ty };
    }
  });

  stage.addEventListener("pointermove", (e) => {
    const s = photoViewerState;
    if (!s || !s.pointers.has(e.pointerId)) return;
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pointers.size === 2) {
      const pts = [...s.pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (s.pinchStartDist > 0) {
        s.scale = Math.min(MAX_SCALE, Math.max(1, s.pinchStartScale * (dist / s.pinchStartDist)));
        applyPhotoViewerTransform();
      }
    } else if (s.pointers.size === 1 && s.scale > 1 && s.panStart) {
      s.tx = s.panStart.tx + (e.clientX - s.panStart.x);
      s.ty = s.panStart.ty + (e.clientY - s.panStart.y);
      applyPhotoViewerTransform();
    }
  });

  const endPointer = (e) => {
    const s = photoViewerState;
    if (!s) return;
    s.pointers.delete(e.pointerId);
    if (s.pointers.size < 2) s.pinchStartDist = 0;
    if (s.pointers.size === 0) s.panStart = null;
    if (s.scale <= 1) {
      s.scale = 1;
      s.tx = 0;
      s.ty = 0;
      applyPhotoViewerTransform();
    }
  };
  stage.addEventListener("pointerup", endPointer);
  stage.addEventListener("pointercancel", endPointer);

  document.addEventListener("keydown", (e) => {
    if (!modal.classList.contains("open")) return;
    if (e.key === "Escape") closePhotoViewer();
    else if (e.key === "ArrowLeft") photoViewerPrev();
    else if (e.key === "ArrowRight") photoViewerNext();
  });
}

// ---------------- Modal: Category ----------------

function openCategoryModal(existingId) {
  if (!canEditJournal(getCurrentJournal())) return;
  const modal = document.getElementById("modal-category");
  modal.dataset.cat = existingId || "";
  let name = "";
  if (existingId) {
    const j = getCurrentJournal();
    name = j.categories.find((c) => c.id === existingId).name;
    modal.querySelector("#category-modal-title").textContent = "重新命名類別";
  } else {
    modal.querySelector("#category-modal-title").textContent = "新增類別";
  }
  modal.querySelector("#category-field-name").value = name;
  showModal(modal);
}

async function saveCategoryModal() {
  const modal = document.getElementById("modal-category");
  const name = modal.querySelector("#category-field-name").value.trim();
  if (!name) {
    alert("請輸入類別名稱");
    return;
  }
  const j = getCurrentJournal();
  const existingId = modal.dataset.cat;
  if (existingId) {
    j.categories.find((c) => c.id === existingId).name = name;
  } else {
    j.categories.push(newCategory(name));
  }
  await persistCurrent();
  closeModal(modal);
  render();
}

// ---------------- Modal: User (Admin only) ----------------

// existingAccess: [{ departmentId, canEdit }, ...] — 已勾選的餐廳；新帳號傳空陣列即可（預設全部不勾）。
// allDepartments/allDepartmentsCanEdit：這個帳號是否開了「全部餐廳」特殊選項——開了就不看
// 個別勾選，一律套用到現有及日後新增的每一間餐廳。
function renderDepartmentChecklist(container, existingAccess, allDepartments, allDepartmentsCanEdit) {
  const listHtml = state.departments.length
    ? state.departments.map((d) => {
        const existing = existingAccess.find((x) => x.departmentId === d.id);
        const checked = !!existing;
        const canEdit = existing ? existing.canEdit : true;
        return `
      <label class="checkbox-row">
        <input type="checkbox" value="${d.id}" data-dept-checkbox ${checked ? "checked" : ""} />
        <span>${escapeHtml(d.name)}</span>
        <select class="field-input field-select dept-access-select" data-dept-access="${d.id}" ${checked ? "" : "disabled hidden"}>
          <option value="edit" ${canEdit ? "selected" : ""}>可編輯</option>
          <option value="view" ${!canEdit ? "selected" : ""}>僅查看</option>
        </select>
      </label>`;
      }).join("")
    : `<p class="cat-empty">尚無餐廳，請先在「餐廳管理」新增</p>`;

  container.innerHTML = `
    <label class="checkbox-row dept-all-row">
      <input type="checkbox" class="dept-all-checkbox" ${allDepartments ? "checked" : ""} />
      <span>全部餐廳（含日後新增的餐廳）</span>
      <select class="field-input field-select dept-access-select dept-all-select" ${allDepartments ? "" : "disabled hidden"}>
        <option value="edit" ${allDepartmentsCanEdit ? "selected" : ""}>可編輯</option>
        <option value="view" ${!allDepartmentsCanEdit ? "selected" : ""}>僅查看</option>
      </select>
    </label>
    <div class="dept-individual-list ${allDepartments ? "dept-individual-list-disabled" : ""}">${listHtml}</div>`;

  const allCheckbox = container.querySelector(".dept-all-checkbox");
  const allSelect = container.querySelector(".dept-all-select");
  const individualList = container.querySelector(".dept-individual-list");
  allCheckbox.addEventListener("change", () => {
    allSelect.disabled = !allCheckbox.checked;
    allSelect.hidden = !allCheckbox.checked;
    individualList.classList.toggle("dept-individual-list-disabled", allCheckbox.checked);
  });

  container.querySelectorAll("[data-dept-checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const select = container.querySelector(`[data-dept-access="${cb.value}"]`);
      select.disabled = !cb.checked;
      select.hidden = !cb.checked;
    });
  });
}

function readDepartmentChecklist(container) {
  return Array.from(container.querySelectorAll("[data-dept-checkbox]:checked")).map((cb) => ({
    departmentId: Number(cb.value),
    canEdit: container.querySelector(`[data-dept-access="${cb.value}"]`).value === "edit",
  }));
}

function readAllDepartmentsToggle(container) {
  return {
    allDepartments: container.querySelector(".dept-all-checkbox").checked,
    allDepartmentsCanEdit: container.querySelector(".dept-all-select").value === "edit",
  };
}

function openUserModal() {
  const modal = document.getElementById("modal-user");
  modal.querySelector("#user-field-username").value = "";
  modal.querySelector("#user-field-displayname").value = "";
  modal.querySelector("#user-field-password").value = "";
  modal.querySelector("#user-field-role").value = "User";
  renderDepartmentChecklist(modal.querySelector("#user-field-departments-list"), [], false, false);
  showModal(modal);
}

async function saveUserModal() {
  const modal = document.getElementById("modal-user");
  const username = modal.querySelector("#user-field-username").value.trim();
  const password = modal.querySelector("#user-field-password").value;
  const displayName = modal.querySelector("#user-field-displayname").value.trim();
  const role = modal.querySelector("#user-field-role").value;
  const departmentsListEl = modal.querySelector("#user-field-departments-list");
  const departments = readDepartmentChecklist(departmentsListEl);
  const { allDepartments, allDepartmentsCanEdit } = readAllDepartmentsToggle(departmentsListEl);

  if (!username || !password) {
    alert("請輸入帳號與密碼");
    return;
  }

  try {
    await Store.createUser({ username, password, displayName, role, departments, allDepartments, allDepartmentsCanEdit });
    state.users = await Store.getUsers();
    state.auditLogs = await Store.getAuditLogs();
    closeModal(modal);
    render();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteUser(id) {
  if (!confirm("確定要刪除此帳號嗎？")) return;
  try {
    await Store.deleteUser(id);
    state.users = await Store.getUsers();
    state.auditLogs = await Store.getAuditLogs();
    render();
  } catch (err) {
    alert(err.message);
  }
}

function openResetPasswordModal(userId) {
  const modal = document.getElementById("modal-reset-password");
  modal.dataset.mode = "user";
  modal.dataset.userId = userId;
  modal.querySelector("#reset-password-field").value = "";
  showModal(modal);
}

function openApprovePasswordResetModal(requestId) {
  const modal = document.getElementById("modal-reset-password");
  modal.dataset.mode = "request";
  modal.dataset.requestId = requestId;
  modal.querySelector("#reset-password-field").value = "";
  showModal(modal);
}

async function saveResetPasswordModal() {
  const modal = document.getElementById("modal-reset-password");
  const password = modal.querySelector("#reset-password-field").value;
  if (!password) {
    alert("請輸入新密碼");
    return;
  }
  try {
    if (modal.dataset.mode === "request") {
      await Store.approvePasswordReset(modal.dataset.requestId, password);
      state.passwordResetRequests = await Store.getPasswordResetRequests();
    } else {
      await Store.resetUserPassword(modal.dataset.userId, password);
    }
    state.auditLogs = await Store.getAuditLogs();
    closeModal(modal);
    render();
  } catch (err) {
    alert(err.message);
  }
}

async function handleRejectPasswordReset(id) {
  if (!confirm("確定要駁回此忘記密碼申請嗎？")) return;
  try {
    await Store.rejectPasswordReset(id);
    state.passwordResetRequests = await Store.getPasswordResetRequests();
    state.auditLogs = await Store.getAuditLogs();
    render();
  } catch (err) {
    alert(err.message);
  }
}

async function handleChangeRole(id, role) {
  try {
    await Store.changeUserRole(id, role);
    state.users = await Store.getUsers();
    state.auditLogs = await Store.getAuditLogs();
  } catch (err) {
    alert(err.message);
  }
  render();
}

async function handleApproveUser(id) {
  try {
    await Store.approveUser(id);
    state.users = await Store.getUsers();
    state.auditLogs = await Store.getAuditLogs();
    render();
  } catch (err) {
    alert(err.message);
  }
}

// ---------------- Modal: User departments / 餐廳權限 (Admin only) ----------------

function openUserDepartmentsModal(userId) {
  const modal = document.getElementById("modal-user-departments");
  const target = state.users.find((u) => String(u.id) === String(userId));
  if (!target) return;
  modal.dataset.userId = userId;
  renderDepartmentChecklist(modal.querySelector("#user-departments-list"), target.departments, target.allDepartments, target.allDepartmentsCanEdit);
  showModal(modal);
}

async function saveUserDepartmentsModal() {
  const modal = document.getElementById("modal-user-departments");
  const userId = modal.dataset.userId;
  const departmentsListEl = modal.querySelector("#user-departments-list");
  const departments = readDepartmentChecklist(departmentsListEl);
  const { allDepartments, allDepartmentsCanEdit } = readAllDepartmentsToggle(departmentsListEl);
  try {
    await Store.setUserDepartments(userId, departments, allDepartments, allDepartmentsCanEdit);
    state.users = await Store.getUsers();
    state.auditLogs = await Store.getAuditLogs();
    closeModal(modal);

    // 改的是自己這個帳號時，登入當下快取的餐廳權限就過期了，要同步更新，
    // 「部門」「目前餐廳」下拉選單才會馬上反映新的勾選結果。
    const me = Auth.getUser();
    const self = me && state.users.find((u) => u.username === me.username);
    if (self) {
      Auth.setMyDepartments(self.departments);
      const names = getSwitchableDepartmentNames();
      if (names.length && !names.includes(Auth.getCurrentDepartment())) {
        await handleSwitchDepartment(names[0]);
        return;
      }
    }
    render();
  } catch (err) {
    alert(err.message);
  }
}

// ---------------- Departments / 餐廳管理 (Admin only) ----------------

async function handleRenameUser(id) {
  const u = state.users.find((x) => String(x.id) === String(id));
  if (!u) return;
  const name = prompt(`更改「${u.username}」的顯示名稱`, u.displayName);
  if (name === null) return;
  const trimmed = name.trim();
  if (!trimmed || trimmed === u.displayName) return;
  try {
    await Store.renameUser(u.id, trimmed);
    state.users = await Store.getUsers();
    state.auditLogs = await Store.getAuditLogs();
    // 改的是自己：標題列、設定頁的「登入帳號」是讀登入時存的名稱，要一併更新。
    const me = Auth.getUser();
    if (me && me.username === u.username) Auth.setUser({ ...me, displayName: trimmed });
    render();
  } catch (err) {
    alert(err.message);
  }
}

async function handleAddDepartment() {
  const name = prompt("請輸入餐廳名稱");
  if (!name || !name.trim()) return;
  try {
    await Store.createDepartment(name.trim());
    state.departments = await Store.getDepartments();
    render();
  } catch (err) {
    alert(err.message);
  }
}

async function handleRenameDepartment(id, currentName) {
  const name = prompt("餐廳名稱", currentName);
  if (!name || !name.trim() || name.trim() === currentName) return;
  try {
    await Store.renameDepartment(id, name.trim());
    state.departments = await Store.getDepartments();
    state.users = await Store.getUsers();
    render();
  } catch (err) {
    alert(err.message);
  }
}

async function handleDeleteDepartment(id) {
  if (!confirm("確定要刪除此餐廳嗎？已指派此餐廳的帳號也會一併移除該權限。")) return;
  try {
    await Store.deleteDepartment(id);
    state.departments = await Store.getDepartments();
    state.users = await Store.getUsers();
    render();
  } catch (err) {
    alert(err.message);
  }
}

// ---------------- Actions ----------------

async function handleNewJournal() {
  if (!canCreateNewJournal()) return;
  const j = buildNewJournal();
  state.journals.unshift(j);
  state.currentId = j.id;
  await saveJournal(j);
  state.view = "editor";
  render();
}

async function handleDuplicateJournal(id) {
  const src = state.journals.find((j) => j.id === id);
  if (!canEditJournal(src)) return;
  const newStart = new Date(src.periodStart + "T00:00:00");
  newStart.setDate(newStart.getDate() + 7);
  const newEnd = new Date(src.periodEnd + "T00:00:00");
  newEnd.setDate(newEnd.getDate() + 7);

  const categories = src.categories.map((cat) => {
    const newCatId = uid();
    return {
      id: newCatId,
      name: cat.name,
      isCompletedSection: cat.isCompletedSection,
      items: cat.isCompletedSection
        ? []
        : cat.items.filter((i) => (Number(i.percent) || 0) < 100).map((i) => ({ ...i, id: uid(), homeCategoryId: newCatId })),
    };
  });

  const j = buildNewJournal({
    department: src.department,
    periodStart: isoDate(newStart),
    periodEnd: isoDate(newEnd),
    categories,
  });
  state.journals.unshift(j);
  state.currentId = j.id;
  await saveJournal(j);
  state.view = "editor";
  render();
}

async function handleDeleteJournal(id) {
  const target = state.journals.find((j) => j.id === id);
  if (!canEditJournal(target)) return;
  if (!confirm("確定要刪除這份週誌嗎？此動作無法復原。")) return;
  await Store.deleteJournal(id);
  journalBases.delete(id);
  state.journals = state.journals.filter((j) => j.id !== id);
  if (state.currentId === id) {
    state.currentId = state.journals[0] ? state.journals[0].id : null;
  }
  render();
}

async function handleDeleteCategory(catId) {
  const j = getCurrentJournal();
  if (!canEditJournal(j)) return;
  if (!confirm("確定要刪除此類別及其所有項目嗎？")) return;
  j.categories = j.categories.filter((c) => c.id !== catId);
  await persistCurrent();
  render();
}

async function handleToggleItemPriority(catId, itemId) {
  const j = getCurrentJournal();
  if (!canEditJournal(j)) return;
  const cat = j.categories.find((c) => c.id === catId);
  const it = cat && cat.items.find((i) => i.id === itemId);
  if (!it) return;
  it.isPriority = !it.isPriority;
  await persistCurrent();
  render();
}

async function handleMetaChange(field, value) {
  const j = getCurrentJournal();
  if (!canEditJournal(j)) return;
  j[field] = value;
  await persistCurrent();
  render();
}

async function handleSettingChange(field, value) {
  state.settings[field] = value;
  await Store.saveSettings(state.settings);
}

// 切換「目前餐廳」：重新從資料庫讀取週誌，並把畫面上的卡片切到對應這間餐廳的資料。
async function handleSwitchDepartment(name) {
  Auth.setCurrentDepartment(name);
  setJournals(await Store.getAllJournals());
  const match = state.journals.find((j) => j.department === name);
  state.currentId = match ? match.id : null;
  state.lightTimer = name ? await Store.getLightTimer(name) : { department: "", rows: [] };
  state.maintenanceSchedule = name ? await Store.getMaintenanceSchedule(name) : { department: "", tasks: [] };
  state.maintenanceReminderShown = false;
  render();
}

// ---------------- Overview (Admin) ----------------

// 每間餐廳「最新一份」週誌。週誌每週會把上週未完成的項目複製過來，所以逾期、負責人
// 工作量這類「目前狀態」只看最新一份，才不會把同一個項目重複算好幾次。
function latestJournalByDepartment() {
  const map = new Map();
  for (const j of state.journals) {
    const cur = map.get(j.department);
    if (!cur || j.periodStart > cur.periodStart) map.set(j.department, j);
  }
  return map;
}

function overviewDepartmentNames() {
  const names = new Set(state.departments.map((d) => d.name));
  state.journals.forEach((j) => { if (j.department) names.add(j.department); });
  return [...names].sort((a, b) => a.localeCompare(b, "zh-Hant"));
}

// 還沒完成的項目（完成區裡的、或已經 100% 的不算），附上所屬類別。
function openItemsOf(journal) {
  return journal.categories
    .filter((c) => !c.isCompletedSection)
    .flatMap((c) => c.items.filter((it) => (Number(it.percent) || 0) < 100).map((it) => ({ cat: c, it })));
}

function daysOverdue(expectedDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today - new Date(expectedDate + "T00:00:00")) / 86400000);
}

// 所有餐廳最新週誌裡，已經過了預計完成日期、還沒做完的項目，逾期最久的排最前面。
function collectOverdueItems() {
  const list = [];
  for (const j of latestJournalByDepartment().values()) {
    for (const { cat, it } of openItemsOf(j)) {
      if (dateUrgency(it.expectedDate, it.percent) === "overdue") list.push({ j, cat, it, days: daysOverdue(it.expectedDate) });
    }
  }
  return list.sort((a, b) => b.days - a.days);
}

// 一週以週一為代表日期。
function mondayOf(iso) {
  return getDefaultWeekRange(new Date(iso + "T00:00:00")).start;
}

async function loadOverviewMaintenance() {
  if (state.overviewMaintenanceLoading) return;
  state.overviewMaintenanceLoading = true;
  const result = {};
  await Promise.all(overviewDepartmentNames().map(async (name) => {
    try {
      result[name] = (await Store.getMaintenanceSchedule(name)).tasks || [];
    } catch {
      result[name] = [];
    }
  }));
  state.overviewMaintenance = result;
  state.overviewMaintenanceLoading = false;
  if (state.view === "overview") render();
}

function overviewMaintenanceThisMonth() {
  if (!state.overviewMaintenance) return null;
  const month = new Date().getMonth() + 1;
  return Object.entries(state.overviewMaintenance)
    .flatMap(([dept, tasks]) => tasks.filter((t) => (t.activeMonths || []).includes(month)).map((t) => ({ dept, t })))
    .sort((a, b) => a.dept.localeCompare(b.dept, "zh-Hant"));
}

function overviewExportOptions() {
  if (!state.overviewExport) {
    const now = new Date();
    state.overviewExport = { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDate(now), dept: "" };
  }
  return state.overviewExport;
}

// 水平長條圖（單一數列，不需要圖例；數值直接標在長條旁，滑鼠移上去有提示）。
function barListHtml(rows, emptyText) {
  if (!rows.length) return `<p class="settings-note">${emptyText}</p>`;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return `<div class="ov-bars">${rows.map((r) => `
    <div class="ov-bar-row" title="${escapeHtml(r.tip)}">
      <span class="ov-bar-label">${escapeHtml(r.label)}</span>
      <span class="ov-bar-track"><span class="ov-bar-fill" style="width:${Math.max((r.value / max) * 100, 2)}%"></span></span>
      <span class="ov-bar-value">${r.value}${r.extra ? `<span class="ov-bar-extra">${escapeHtml(r.extra)}</span>` : ""}</span>
    </div>`).join("")}</div>`;
}

function renderOverview() {
  const names = overviewDepartmentNames();
  const latest = latestJournalByDepartment();
  const thisMonday = getDefaultWeekRange().start;
  const overdue = collectOverdueItems();
  const maintenance = overviewMaintenanceThisMonth();
  const filledThisWeek = names.filter((n) => latest.get(n) && latest.get(n).periodEnd >= thisMonday).length;
  const openCount = [...latest.values()].reduce((s, j) => s + openItemsOf(j).length, 0);

  const kpis = `
  <div class="ov-kpis">
    <div class="ov-kpi"><span class="ov-kpi-label">本週已填週誌</span><span class="ov-kpi-value">${filledThisWeek}<small> / ${names.length}</small></span></div>
    <div class="ov-kpi ${overdue.length ? "ov-kpi-danger" : ""}"><span class="ov-kpi-label">逾期項目</span><span class="ov-kpi-value">${overdue.length}</span></div>
    <div class="ov-kpi"><span class="ov-kpi-label">進行中項目</span><span class="ov-kpi-value">${openCount}</span></div>
    <div class="ov-kpi"><span class="ov-kpi-label">本月保養</span><span class="ov-kpi-value">${maintenance ? maintenance.length : "…"}</span></div>
  </div>`;

  const deptRows = names.map((name) => {
    const j = latest.get(name);
    if (!j) {
      return `<div class="ov-dept-row ov-dept-empty">
        <span class="ov-dept-name">${escapeHtml(name)}</span>
        <span class="badge badge-warning">尚無週誌</span>
      </div>`;
    }
    const pct = journalPercent(j);
    const items = openItemsOf(j);
    const od = items.filter(({ it }) => dateUrgency(it.expectedDate, it.percent) === "overdue").length;
    const pri = items.filter(({ it }) => it.isPriority).length;
    const filled = j.periodEnd >= thisMonday;
    return `<div class="ov-dept-row" data-action="ov-open-journal" data-id="${j.id}" title="開啟 ${escapeHtml(name)} 的週誌">
      <span class="ov-dept-name">${escapeHtml(name)}</span>
      <span class="badge ${filled ? "badge-success" : "badge-warning"}">${filled ? "本週已填" : "本週未填"}</span>
      <span class="ov-dept-period">${toROC(j.periodStart)} ～ ${toROC(j.periodEnd)}</span>
      <span class="ov-dept-progress"><span class="overall-bar"><span class="overall-bar-fill" style="width:${pct}%"></span></span><span class="ov-dept-pct">${pct}%</span></span>
      <span class="ov-dept-stats">進行中 <b>${items.length}</b> · 逾期 <b class="${od ? "ov-text-danger" : ""}">${od}</b> · 優先 <b>${pri}</b></span>
    </div>`;
  }).join("");

  const overdueHtml = overdue.length ? overdue.map(({ j, cat, it, days }) => `
    <div class="ov-list-row" data-action="ov-open-item" data-id="${j.id}" data-cat="${cat.id}" data-item="${it.id}">
      <div class="ov-list-main">
        <div class="ov-list-title">${it.isPriority ? '<span class="badge badge-priority">優先</span>' : ""}${escapeHtml(it.item) || "（未命名項目）"}</div>
        <div class="ov-list-meta"><span class="badge badge-soft">${escapeHtml(j.department)}</span>${escapeHtml(cat.name)}${it.assignee ? ` · 負責人：${escapeHtml(it.assignee)}` : ""} · 預計 ${toROC(it.expectedDate)}</div>
      </div>
      <span class="ov-overdue-days">逾期 ${days} 天</span>
      <span class="pct-chip ${percentClass(Number(it.percent) || 0)}">${Number(it.percent) || 0}%</span>
    </div>`).join("") : `<p class="settings-note">目前沒有逾期項目 👍</p>`;

  const maintenanceHtml = !maintenance
    ? `<p class="settings-note">載入中…</p>`
    : maintenance.length
      ? maintenance.map(({ dept, t }) => `
        <div class="ov-list-row ov-list-row-static">
          <div class="ov-list-main">
            <div class="ov-list-title">${escapeHtml(t.name)}</div>
            <div class="ov-list-meta"><span class="badge badge-soft">${escapeHtml(dept)}</span>${escapeHtml(t.frequencyLabel || "")}${t.monthsText ? ` · ${escapeHtml(t.monthsText)}` : ""}</div>
          </div>
        </div>`).join("")
      : `<p class="settings-note">這個月沒有排定的保養項目</p>`;

  // 完成率走勢：最近 8 週 × 各餐廳的熱度表（同一色系，越深完成度越高；格子裡直接寫數字）。
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(thisMonday + "T00:00:00");
    d.setDate(d.getDate() - i * 7);
    weeks.push(isoDate(d));
  }
  const pctByDeptWeek = new Map();
  for (const j of state.journals) {
    const key = `${j.department}|${mondayOf(j.periodStart)}`;
    pctByDeptWeek.set(key, journalPercent(j));
  }
  const heatHtml = `
  <div class="ov-heat-wrap">
    <table class="ov-heat">
      <thead><tr><th>餐廳</th>${weeks.map((w) => `<th>${toROC(w).slice(4)}</th>`).join("")}</tr></thead>
      <tbody>${names.map((name) => `<tr><th>${escapeHtml(name)}</th>${weeks.map((w) => {
        const p = pctByDeptWeek.get(`${name}|${w}`);
        if (p === undefined) return `<td class="ov-heat-none" title="${escapeHtml(name)}｜${toROC(w)} 這週：沒有週誌">—</td>`;
        return `<td class="${p >= 70 ? "ov-heat-strong" : ""}" style="--heat:${Math.round(12 + p * 0.88)}%" title="${escapeHtml(name)}｜${toROC(w)} 這週：完成度 ${p}%">${p}</td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table>
  </div>`;

  const byCategory = new Map();
  const byAssignee = new Map();
  for (const j of latest.values()) {
    for (const { cat, it } of openItemsOf(j)) {
      const isOd = dateUrgency(it.expectedDate, it.percent) === "overdue";
      const c = byCategory.get(cat.name) || { value: 0, od: 0 };
      c.value++; if (isOd) c.od++;
      byCategory.set(cat.name, c);
      const who = (it.assignee || "").trim() || "（未指定）";
      const a = byAssignee.get(who) || { value: 0, od: 0 };
      a.value++; if (isOd) a.od++;
      byAssignee.set(who, a);
    }
  }
  const toBarRows = (map) => [...map.entries()]
    .sort((a, b) => b[1].value - a[1].value)
    .slice(0, 8)
    .map(([label, v]) => ({ label, value: v.value, extra: v.od ? `逾期 ${v.od}` : "", tip: `${label}：進行中 ${v.value} 項${v.od ? `，其中逾期 ${v.od} 項` : ""}` }));

  const ex = overviewExportOptions();
  const exportHtml = `
  <div class="ov-export">
    <label class="ov-export-field"><span class="field-label">週誌開始日期 從</span><input type="date" class="field-input" data-action="ov-export-field" data-key="from" value="${ex.from}" /></label>
    <label class="ov-export-field"><span class="field-label">到</span><input type="date" class="field-input" data-action="ov-export-field" data-key="to" value="${ex.to}" /></label>
    <label class="ov-export-field"><span class="field-label">餐廳</span>
      <select class="field-input field-select" data-action="ov-export-field" data-key="dept">
        <option value="">全部餐廳</option>
        ${names.map((n) => `<option value="${escapeHtml(n)}" ${n === ex.dept ? "selected" : ""}>${escapeHtml(n)}</option>`).join("")}
      </select>
    </label>
    <button class="btn btn-primary ov-export-btn" data-action="ov-export-excel" id="ov-export-btn">匯出 Excel</button>
  </div>`;

  const section = (icon, title, subtitle, body) => `
  <section class="card">
    <div class="settings-section-header"><div class="settings-section-heading">
      <span class="settings-section-title">${icon}${title}</span>
      ${subtitle ? `<p class="settings-section-subtitle">${subtitle}</p>` : ""}
    </div></div>
    ${body}
  </section>`;

  return `
  ${kpis}
  ${section(ICONS.store, "各餐廳本週狀態", "依各餐廳最新一份週誌；點一下可以直接開啟", `<div class="ov-dept-list">${deptRows || '<p class="settings-note">尚無餐廳</p>'}</div>`)}
  <div class="ov-grid-2">
    ${section(ICONS.flag, `逾期項目 <span class="badge ${overdue.length ? "badge-danger" : "badge-soft"}">${overdue.length}</span>`, "已過預計完成日期、還沒到 100% 的項目；點一下可以直接編輯", `<div class="ov-list">${overdueHtml}</div>`)}
    ${section(ICONS.timer, `本月保養（${new Date().getMonth() + 1} 月）`, "各餐廳保養排程中，排在這個月的項目", `<div class="ov-list">${maintenanceHtml}</div>`)}
  </div>
  ${section(ICONS.clock, "完成率走勢", "最近 8 週各餐廳週誌的整體完成度（%），顏色越深完成度越高", heatHtml)}
  <div class="ov-grid-2">
    ${section(ICONS.doc, "各類別進行中項目", "最多顯示 8 個類別", barListHtml(toBarRows(byCategory), "目前沒有進行中的項目"))}
    ${section(ICONS.users, "負責人工作量", "每個人手上還沒完成的項目數", barListHtml(toBarRows(byAssignee), "目前沒有進行中的項目"))}
  </div>
  ${section(ICONS.print, "匯出 Excel 報表", "依週誌開始日期篩選，匯出明細與各餐廳摘要兩個工作表；「逾期」以各週週誌的結束日為準", exportHtml)}
  `;
}

async function openJournalFromOverview(journalId, catId, itemId) {
  const j = state.journals.find((x) => x.id === journalId);
  if (!j) return;
  await handleSwitchDepartment(j.department);
  state.currentId = j.id;
  state.view = "editor";
  render();
  if (catId && itemId) openItemModal(catId, itemId);
}

const XLSX_LIB = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";

async function exportOverviewExcel() {
  const ex = overviewExportOptions();
  const journals = state.journals
    .filter((j) => (!ex.dept || j.department === ex.dept) && (!ex.from || j.periodStart >= ex.from) && (!ex.to || j.periodStart <= ex.to))
    .sort((a, b) => a.department.localeCompare(b.department, "zh-Hant") || a.periodStart.localeCompare(b.periodStart));
  if (!journals.length) {
    alert("這個日期範圍內沒有週誌");
    return;
  }

  const btn = document.getElementById("ov-export-btn");
  btn.disabled = true;
  try {
    await loadScriptOnce(XLSX_LIB);
  } catch {
    alert("Excel 產生失敗，請確認網路連線後再試一次");
    return;
  } finally {
    btn.disabled = false;
  }

  const detail = [["餐廳", "期間開始", "期間結束", "類別", "序", "工作項目", "目前進度說明", "預計完成日期", "負責人", "完成度%", "優先", "狀態"]];
  const summary = [["餐廳", "週誌份數", "平均完成度%", "項目數", "已完成", "逾期"]];
  const byDept = new Map();
  const todayIsoStr = isoDate(new Date());
  for (const j of journals) {
    // 報表看的是「那一週當時」是否逾期：以那份週誌的結束日（還沒到就用今天）為準，
    // 不然舊週誌裡後來才做完的項目，用今天去比會全部變成逾期。
    const asOf = j.periodEnd && j.periodEnd < todayIsoStr ? j.periodEnd : todayIsoStr;
    const s = byDept.get(j.department) || { count: 0, pctSum: 0, items: 0, done: 0, overdue: 0 };
    s.count++;
    s.pctSum += journalPercent(j);
    for (const cat of j.categories) {
      cat.items.forEach((it, idx) => {
        const pct = Number(it.percent) || 0;
        const isDone = pct >= 100 || cat.isCompletedSection;
        const isOd = !isDone && !!it.expectedDate && it.expectedDate < asOf;
        s.items++;
        if (isDone) s.done++;
        if (isOd) s.overdue++;
        detail.push([j.department, toROC(j.periodStart), toROC(j.periodEnd), cat.name, idx + 1, it.item, it.progress, it.expectedDate ? toROC(it.expectedDate) : "", it.assignee, pct, it.isPriority ? "是" : "", isDone ? "已完成" : isOd ? "逾期" : "進行中"]);
      });
    }
    byDept.set(j.department, s);
  }
  for (const [dept, s] of byDept) summary.push([dept, s.count, Math.round(s.pctSum / s.count), s.items, s.done, s.overdue]);

  const wb = XLSX.utils.book_new();
  const detailSheet = XLSX.utils.aoa_to_sheet(detail);
  detailSheet["!cols"] = [12, 11, 11, 16, 5, 30, 45, 13, 10, 8, 6, 8].map((wch) => ({ wch }));
  const summarySheet = XLSX.utils.aoa_to_sheet(summary);
  summarySheet["!cols"] = [14, 10, 13, 8, 8, 8].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, summarySheet, "各餐廳摘要");
  XLSX.utils.book_append_sheet(wb, detailSheet, "週誌明細");
  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const fileName = `工作週誌報表_${ex.dept || "全部餐廳"}_${ex.from}_${ex.to}.xlsx`;
  const file = new File([data], fileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  await deliverFile(file);
}

// ---------------- Print / Export ----------------

function buildPrintHtml(j) {
  const rows = (cat, startIdx) => cat.items.map((it, i) => `
    <tr>
      <td class="p-idx">${startIdx + i + 1}</td>
      <td class="p-item">${escapeHtml(it.item)}</td>
      <td class="p-progress">${escapeHtml(it.progress).replace(/\n/g, "<br/>")}</td>
      <td class="p-date">${it.expectedDate ? toROC(it.expectedDate, "full") : ""}</td>
      <td class="p-assignee">${escapeHtml(it.assignee)}</td>
      <td class="p-pct">${Number(it.percent) || 0}%</td>
    </tr>`).join("");

  const sections = j.categories.map((cat, ci) => `
    <tr class="p-section"><td colspan="6">${escapeHtml(cat.name)}</td></tr>
    ${cat.items.length ? rows(cat, 0) : `<tr><td colspan="6" class="p-empty">（無項目）</td></tr>`}
  `).join("");

  return `
  <div class="print-sheet">
    <h1 class="p-company">${escapeHtml(state.settings.companyName)}</h1>
    <h2 class="p-title">工作週誌</h2>
    <div class="p-info">部門：${escapeHtml(j.department)}</div>
    <div class="p-info p-info-row">
      <span>期間：${toROC(j.periodStart, "full")} ～ ${toROC(j.periodEnd, "full")}</span>
      <span>製表日期：${toROC(todayIso(), "full")}</span>
    </div>
    <table class="p-table">
      <thead>
        <tr>
          <th class="p-idx">序</th>
          <th class="p-item">工作項目</th>
          <th class="p-progress">目前進度說明</th>
          <th class="p-date">預計完成日期</th>
          <th class="p-assignee">負責人</th>
          <th class="p-pct">完成度%</th>
        </tr>
      </thead>
      <tbody>${sections}</tbody>
    </table>
    <div class="p-signature">
      <span class="p-signature-label">主管簽名：</span>
      <span class="p-signature-line"></span>
    </div>
  </div>`;
}

// CSS 沒辦法可靠地強制瀏覽器的列印方向（iOS Safari、桌面版 Edge/WebView2 都不一定會採用
// @page 的 landscape 設定），使用者本身反而會自己在列印對話框裡手動把「配置」切成橫向
// （尤其定時器/保養排程這種欄位多的表格）。這個變數只是「這次匯出，預期使用者比較可能
// 選哪個方向」的猜測值，讓算可用寬度時跟使用者實際會選的方向對得上，不是真的能控制瀏覽器。
let printIsLandscape = false;

function fitPrintSheetToOnePage() {
  const area = document.getElementById("print-area");
  const sheet = area.querySelector(".print-sheet");
  if (!sheet) return;

  sheet.style.transform = "none";
  area.style.height = "";
  area.style.overflow = "";
  area.style.width = "";

  const mmToPx = 96 / 25.4;
  const marginMm = 5; // 對應 @page 的 margin: 5mm — 兩邊要一致，否則算出來的可用寬度會跟印表機/PDF 引擎實際可印的範圍對不上
  const pageWidthMm = printIsLandscape ? 297 : 210;
  const pageHeightMm = printIsLandscape ? 210 : 297;
  const usableWidthPx = (pageWidthMm - marginMm * 2) * mmToPx;
  const usableHeightPx = (pageHeightMm - marginMm * 2) * mmToPx;

  // #print-area is display:none outside of @media print, and measuring it at whatever
  // width the current device's viewport happens to be (especially a narrow phone in
  // portrait) makes a wide table wrap its cell text onto extra lines — inflating the
  // measured height far beyond what it actually needs at true A4 print width, and
  // throwing off the scale below. Pin the width to the real A4 usable width during
  // measurement so the result is the same on every device, then restore afterwards —
  // this never becomes visible on screen.
  const restoreDisplay = area.style.display;
  const restoreVisibility = area.style.visibility;
  area.style.display = "block";
  area.style.visibility = "hidden";
  area.style.width = `${usableWidthPx}px`;

  const contentHeight = sheet.scrollHeight;

  area.style.display = restoreDisplay;
  area.style.visibility = restoreVisibility;
  area.style.width = "";

  if (!contentHeight) return;

  // 量測時寬度已經固定成 A4 可用寬度，所以只需要用高度來決定縮放比例；只會縮小，
  // 不會放大到超過 100% —— 放大雖然能填滿高度方向的空白，但寬度也會跟著等比例
  // 放大而超出紙張範圍，兩害相權，寧可保留些微空白也不要讓內容被裁掉或多印一頁。
  const scale = Math.min(usableHeightPx / contentHeight, 1);
  sheet.style.width = `${usableWidthPx}px`;
  sheet.style.transformOrigin = "top left";
  sheet.style.transform = `scale(${scale})`;
  // 縮放只影響畫面呈現，不會改變版面配置佔用的高度；改設定容器實際高度，
  // 瀏覽器計算分頁時才會依縮小後的高度判斷，不會誤判成需要第二頁。
  area.style.height = `${contentHeight * scale}px`;
  area.style.overflow = "hidden";
}

window.addEventListener("beforeprint", fitPrintSheetToOnePage);
window.addEventListener("afterprint", () => {
  const area = document.getElementById("print-area");
  const sheet = area.querySelector(".print-sheet");
  if (sheet) sheet.style.transform = "";
  area.style.height = "";
  area.style.overflow = "";
});

// 「分享 PDF」按鈕：把 #print-area 截圖做成 PDF，再用系統的分享選單讓使用者傳 LINE 或存檔。
// iPhone「加入主畫面」的 App（standalone 模式）裡，iOS 會直接忽略 window.print()，列印按鈕
// 按了完全沒反應，所以那裡只顯示分享按鈕。navigator.standalone 只有 iOS 有，且只在主畫面 App 裡才是 true。
function isIosStandalone() {
  return window.navigator.standalone === true;
}

// 裝置能不能用系統分享選單分享檔案（iPhone/iPad、Android、部分桌面瀏覽器）。
const canSharePdfFiles = (() => {
  try {
    return !!navigator.canShare && navigator.canShare({ files: [new File([""], "test.pdf", { type: "application/pdf" })] });
  } catch {
    return false;
  }
})();

const PDF_LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
];
const loadedScripts = {};

function loadScriptOnce(src) {
  if (!loadedScripts[src]) {
    loadedScripts[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => { delete loadedScripts[src]; reject(new Error("無法載入 " + src)); };
      document.head.appendChild(s);
    });
  }
  return loadedScripts[src];
}

// 把目前 #print-area 的內容做成一頁 A4 PDF（方向依 printIsLandscape）。#print-area 平常是
// display:none，截圖時暫時移到畫面外顯示，並拿掉 fitPrintSheetToOnePage() 的縮放——
// 縮放改由下面放進 PDF 頁面時等比例處理。
async function buildPdfFile(fileName) {
  await Promise.all(PDF_LIBS.map(loadScriptOnce));
  const area = document.getElementById("print-area");
  const sheet = area.querySelector(".print-sheet");
  const restoreArea = area.getAttribute("style") || "";
  const restoreSheet = sheet.getAttribute("style") || "";
  area.setAttribute("style", "display:block;position:fixed;left:-10000px;top:0;");
  sheet.style.transform = "none";
  try {
    const canvas = await window.html2canvas(sheet, { scale: 2, backgroundColor: "#ffffff" });
    const pdf = new window.jspdf.jsPDF({ orientation: printIsLandscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
    const marginMm = 5;
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min((pageW - marginMm * 2) / canvas.width, (pageH - marginMm * 2) / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", (pageW - w) / 2, marginMm, w, h);
    return new File([pdf.output("blob")], fileName, { type: "application/pdf" });
  } finally {
    area.setAttribute("style", restoreArea);
    sheet.setAttribute("style", restoreSheet);
  }
}

// 回傳 false 代表 iOS 不讓這次直接開分享選單（離使用者點按鈕太久），需要使用者再點一次。
async function sharePdfFile(file) {
  try {
    await navigator.share({ files: [file] });
  } catch (err) {
    if (err.name === "NotAllowedError") return false;
    if (err.name !== "AbortError") throw err; // AbortError = 使用者自己關掉分享選單
  }
  return true;
}

let pendingPdfFile = null;

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// 把產生好的檔案交給使用者：能用系統分享選單（手機）就開分享選單，方便傳 LINE；
// 電腦版沒有分享選單，直接下載，再自己拖進電腦版 LINE 或寄出去。
async function deliverFile(file) {
  if (!(canSharePdfFiles || isIosStandalone())) {
    downloadFile(file);
    return;
  }
  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    // 這個檔案類型不能分享（或很舊的 iOS）：PDF 直接開來看，其他檔案改用下載。
    if (file.type === "application/pdf") window.open(URL.createObjectURL(file), "_blank");
    else downloadFile(file);
    return;
  }
  try {
    if (await sharePdfFile(file)) return;
  } catch (err) {
    alert("分享失敗：" + err.message);
    return;
  }
  // 產生檔案需要一點時間，iOS 會認為已經不是「使用者剛點的」而拒絕開分享選單，
  // 所以改跳一個視窗，讓使用者再點一次「儲存／分享」。
  pendingPdfFile = file;
  const modal = document.getElementById("modal-pdf-share");
  modal.querySelector("#pdf-share-name").textContent = file.name;
  showModal(modal);
}

// 分享按鈕與下載 PDF 按鈕共用：產生 PDF 的期間先停用按下的那顆按鈕，避免重複點。
async function exportPdf(fileName, btn) {
  btn.disabled = true;
  let file;
  try {
    file = await buildPdfFile(fileName);
  } catch (err) {
    alert("PDF 產生失敗，請確認網路連線後再試一次");
    return;
  } finally {
    btn.disabled = false;
  }
  await deliverFile(file);
}

// 依目前頁面把要列印／分享的內容放進 #print-area 並縮成一頁，回傳 PDF 檔名；沒有內容可輸出時回傳 null。
// 列印按鈕跟分享 PDF 按鈕共用這份 #print-area。
function preparePrintArea() {
  if (state.view === "timers") return prepareTimersPrint();
  if (state.view === "maintenance") return prepareMaintenancePrint();
  return prepareJournalPrint();
}

function prepareJournalPrint() {
  const j = getCurrentJournal();
  if (!j) return null;
  printIsLandscape = false;
  const container = document.getElementById("print-area");
  container.innerHTML = buildPrintHtml(j);
  fitPrintSheetToOnePage();
  return `工作週誌_${j.department}_${j.periodStart}.pdf`;
}

function buildTimerPrintHtml() {
  const dept = Auth.getCurrentDepartment();
  const rows = state.lightTimer.rows || [];

  const bodyRows = rows.map((r) => `
    <tr>
      <td class="pt-location">${escapeHtml(r.location)}</td>
      <td>${escapeHtml(r.summerStart)}</td>
      <td class="pt-sep">～</td>
      <td>${escapeHtml(r.summerEnd)}</td>
      <td>${escapeHtml(r.springAutumnStart)}</td>
      <td class="pt-sep">～</td>
      <td>${escapeHtml(r.springAutumnEnd)}</td>
      <td>${escapeHtml(r.winterStart)}</td>
      <td class="pt-sep">～</td>
      <td>${escapeHtml(r.winterEnd)}</td>
      <td class="pt-note">${escapeHtml(r.note)}</td>
    </tr>`).join("");

  return `
  <div class="print-sheet print-sheet-wide">
    <h1 class="p-company">${escapeHtml(state.settings.companyName)}</h1>
    <h2 class="p-title">${escapeHtml(dept)}燈光定時器</h2>
    <table class="p-table pt-table">
      <thead>
        <tr>
          <th rowspan="2" class="pt-location">地點</th>
          <th colspan="3">夏季</th>
          <th colspan="3">春秋季節</th>
          <th colspan="3">冬季節</th>
          <th rowspan="2">備註</th>
        </tr>
        <tr>
          <th>開始時間</th><th>至</th><th>結束時間</th>
          <th>開始時間</th><th>至</th><th>結束時間</th>
          <th>開始時間</th><th>至</th><th>結束時間</th>
        </tr>
      </thead>
      <tbody>${rows.length ? bodyRows : `<tr><td colspan="11" class="p-empty">（無資料）</td></tr>`}</tbody>
    </table>
    <div class="p-info" style="margin-top:12px;">製表日期：${toROC(todayIso(), "full")}</div>
  </div>`;
}

function prepareTimersPrint() {
  printIsLandscape = true;
  const container = document.getElementById("print-area");
  container.innerHTML = buildTimerPrintHtml();
  fitPrintSheetToOnePage();
  return `${Auth.getCurrentDepartment()}燈光定時器.pdf`;
}

function buildMaintenancePrintHtml() {
  const dept = Auth.getCurrentDepartment();
  const tasks = state.maintenanceSchedule.tasks || [];

  const bodyRows = tasks.map((t, idx) => {
    const activeMonths = new Set(t.activeMonths || []);
    const cells = Array.from({ length: 12 }, (_, i) => `<td>${activeMonths.has(i + 1) ? "●" : ""}</td>`).join("");
    return `
    <tr>
      <td>${idx + 1}</td>
      <td class="mnt-print-name">${escapeHtml(t.name)}</td>
      <td>${escapeHtml(t.frequencyLabel)}<br/>${escapeHtml(t.timesPerYear)}</td>
      <td class="mnt-print-months">${escapeHtml(t.monthsText)}</td>
      ${cells}
    </tr>`;
  }).join("");

  const monthHeaders = Array.from({ length: 12 }, (_, i) => `<th>${i + 1}</th>`).join("");

  return `
  <div class="print-sheet print-sheet-wide">
    <h1 class="p-company">${escapeHtml(state.settings.companyName)}</h1>
    <h2 class="p-title">${escapeHtml(dept)}保養排程</h2>
    <table class="p-table mnt-print-table">
      <thead>
        <tr>
          <th>項次</th><th>項目</th><th>頻率</th><th>月份</th>${monthHeaders}
        </tr>
      </thead>
      <tbody>${tasks.length ? bodyRows : `<tr><td colspan="16" class="p-empty">（無資料）</td></tr>`}</tbody>
    </table>
    <div class="p-info" style="margin-top:12px;">製表日期：${toROC(todayIso(), "full")}</div>
  </div>`;
}

function prepareMaintenancePrint() {
  printIsLandscape = true;
  const container = document.getElementById("print-area");
  container.innerHTML = buildMaintenancePrintHtml();
  fitPrintSheetToOnePage();
  return `${Auth.getCurrentDepartment()}保養排程.pdf`;
}

// ---------------- Event wiring ----------------

function wireEvents() {
  wirePhotoViewerEvents();

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      if (state.view === "overview") state.overviewMaintenance = null; // 每次進總覽重新抓，保養排程可能剛被改過
      render();
      if (state.view === "maintenance") maybeShowMaintenanceReminder();
    });
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    if (!preparePrintArea()) return;
    // iOS Safari 在某些情況下，window.print() 若跟前面的樣式異動排在同一輪事件迴圈裡，
    // 抓到的畫面快照可能還是異動前的樣子（縮放沒套用），像是 print 用的是稍舊的一份
    // 渲染結果。多等一個 tick 讓瀏覽器先把上面的樣式異動真正跑完、畫出來，再觸發列印。
    setTimeout(() => window.print(), 50);
  });
  ["share-btn", "download-btn"].forEach((id) => {
    const btn = document.getElementById(id);
    btn.addEventListener("click", () => {
      const fileName = preparePrintArea();
      if (fileName) exportPdf(fileName, btn);
    });
  });
  const pdfShareModal = document.getElementById("modal-pdf-share");
  const closePdfShareModal = () => { pendingPdfFile = null; closeModal(pdfShareModal); };
  document.getElementById("pdf-share-btn").addEventListener("click", async () => {
    if (!pendingPdfFile) return;
    try {
      await sharePdfFile(pendingPdfFile);
    } catch (err) {
      alert("分享 PDF 失敗：" + err.message);
    }
    closePdfShareModal();
  });
  document.getElementById("pdf-share-cancel-btn").addEventListener("click", closePdfShareModal);
  document.getElementById("pdf-share-cancel-footer-btn").addEventListener("click", closePdfShareModal);
  document.getElementById("fab-add-item").addEventListener("click", () => openItemModal(null, null));
  document.getElementById("item-field-progress").addEventListener("input", (e) => autoGrowTextarea(e.target));
  document.getElementById("theme-toggle-app").addEventListener("click", () => Theme.toggle());

  document.getElementById("view-root").addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action === "new-journal") handleNewJournal();
    else if (action === "add-category") openCategoryModal(null);
    else if (action === "rename-category") openCategoryModal(el.dataset.cat);
    else if (action === "delete-category") handleDeleteCategory(el.dataset.cat);
    else if (action === "edit-item") openItemModal(el.dataset.cat, el.dataset.item);
    else if (action === "toggle-item-priority") handleToggleItemPriority(el.dataset.cat, el.dataset.item);
    else if (action === "view-photos") {
      const j = getCurrentJournal();
      const cat = j && j.categories.find((c) => c.id === el.dataset.cat);
      const it = cat && cat.items.find((i) => i.id === el.dataset.item);
      if (it && it.photos && it.photos.length) openPhotoViewer(it.photos, 0);
    }
    else if (action === "open-journal") {
      state.currentId = el.dataset.id;
      state.view = "editor";
      render();
    } else if (action === "duplicate-journal") handleDuplicateJournal(el.dataset.id);
    else if (action === "delete-journal") handleDeleteJournal(el.dataset.id);
    else if (action === "logout") handleLogout();
    else if (action === "add-user") openUserModal();
    else if (action === "delete-user") handleDeleteUser(el.dataset.id);
    else if (action === "rename-user") handleRenameUser(el.dataset.id);
    else if (action === "reset-password") openResetPasswordModal(el.dataset.id);
    else if (action === "approve-user") handleApproveUser(el.dataset.id);
    else if (action === "approve-reset-request") openApprovePasswordResetModal(el.dataset.id);
    else if (action === "reject-reset-request") handleRejectPasswordReset(el.dataset.id);
    else if (action === "manage-user-departments") openUserDepartmentsModal(el.dataset.id);
    else if (action === "add-department") handleAddDepartment();
    else if (action === "rename-department") handleRenameDepartment(el.dataset.id, el.dataset.name);
    else if (action === "delete-department") handleDeleteDepartment(el.dataset.id);
    else if (action === "add-timer") openTimerModal(null);
    else if (action === "edit-timer") openTimerModal(el.dataset.id);
    else if (action === "delete-timer") handleDeleteTimer(el.dataset.id);
    else if (action === "add-maintenance") openMaintenanceModal(null);
    else if (action === "edit-maintenance") openMaintenanceModal(el.dataset.id);
    else if (action === "delete-maintenance") handleDeleteMaintenance(el.dataset.id);
    else if (action === "ov-open-journal") openJournalFromOverview(el.dataset.id);
    else if (action === "ov-open-item") openJournalFromOverview(el.dataset.id, el.dataset.cat, el.dataset.item);
    else if (action === "ov-export-excel") exportOverviewExcel();
  });

  document.getElementById("view-root").addEventListener("change", (e) => {
    const field = e.target.dataset.field;
    const setting = e.target.dataset.setting;
    if (field) handleMetaChange(field, e.target.value);
    if (setting) handleSettingChange(setting, e.target.value);
    if (e.target.dataset.action === "change-role") handleChangeRole(e.target.dataset.id, e.target.value);
    if (e.target.dataset.action === "switch-department") handleSwitchDepartment(e.target.value);
    if (e.target.dataset.action === "ov-export-field") overviewExportOptions()[e.target.dataset.key] = e.target.value;
    if (e.target.dataset.action === "filter-audit-department") {
      state.auditLogDepartmentFilter = e.target.value;
      render();
    }
  });

  // Item modal
  const itemModal = document.getElementById("modal-item");
  itemModal.querySelector("#item-save-btn").addEventListener("click", saveItemModal);
  itemModal.querySelector("#item-delete-btn").addEventListener("click", deleteItemModal);
  itemModal.querySelector("#item-cancel-btn").addEventListener("click", () => closeModal(itemModal));
  itemModal.querySelector("#item-cancel-footer-btn").addEventListener("click", () => closeModal(itemModal));
  itemModal.querySelector("#item-field-percent").addEventListener("change", () => applyPercentCategoryLock(itemModal));
  itemModal.querySelector("#item-field-category").addEventListener("change", (e) => {
    if (!e.target.disabled) itemModal.dataset.home = e.target.value;
  });

  // Item modal — photos
  const cameraInput = document.getElementById("item-photo-camera-input");
  const galleryInput = document.getElementById("item-photo-gallery-input");
  document.getElementById("item-photo-camera-btn").addEventListener("click", () => cameraInput.click());
  document.getElementById("item-photo-gallery-btn").addEventListener("click", () => galleryInput.click());

  cameraInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await fileToResizedDataUrl(file);
    openPhotoEditor(dataUrl, (finalDataUrl) => {
      itemModalPhotos.push({ id: uid(), dataUrl: finalDataUrl, createdAt: new Date().toISOString() });
      renderItemModalPhotos(true);
    });
  });

  galleryInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const file of files) {
      const dataUrl = await fileToResizedDataUrl(file);
      itemModalPhotos.push({ id: uid(), dataUrl, createdAt: new Date().toISOString() });
    }
    renderItemModalPhotos(true);
  });

  document.getElementById("item-field-photos").addEventListener("click", (e) => {
    const deleteBtn = e.target.closest('[data-action="delete-photo"]');
    if (deleteBtn) {
      itemModalPhotos = itemModalPhotos.filter((p) => p.id !== deleteBtn.dataset.photo);
      renderItemModalPhotos(true);
      return;
    }
    const editTarget = e.target.closest('[data-action="edit-photo"]');
    if (editTarget) {
      const p = itemModalPhotos.find((x) => x.id === editTarget.dataset.photo);
      if (p) openPhotoEditor(p.dataUrl, (newDataUrl) => { p.dataUrl = newDataUrl; renderItemModalPhotos(true); });
    }
  });

  // Photo editor modal
  const photoEditorModal = document.getElementById("modal-photo-editor");
  const photoCanvas = document.getElementById("photo-editor-canvas");
  photoEditorModal.querySelectorAll(".photo-tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!photoEditorState) return;
      photoEditorState.tool = btn.dataset.tool;
      photoEditorModal.querySelectorAll(".photo-tool-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
  });
  photoEditorModal.querySelector("#photo-color-picker").addEventListener("input", (e) => {
    if (photoEditorState) photoEditorState.color = e.target.value;
  });
  photoEditorModal.querySelector("#photo-stroke-width").addEventListener("input", (e) => {
    if (photoEditorState) photoEditorState.strokeWidth = Number(e.target.value);
  });
  photoEditorModal.querySelector("#photo-undo-btn").addEventListener("click", undoPhotoEditor);
  photoEditorModal.querySelector("#photo-clear-btn").addEventListener("click", clearPhotoEditor);
  photoEditorModal.querySelector("#photo-editor-save-btn").addEventListener("click", savePhotoEditor);
  photoEditorModal.querySelector("#photo-editor-cancel-btn").addEventListener("click", cancelPhotoEditor);
  photoEditorModal.querySelector("#photo-editor-close-btn").addEventListener("click", cancelPhotoEditor);

  photoCanvas.style.touchAction = "none";
  photoCanvas.addEventListener("pointerdown", (e) => {
    const st = photoEditorState;
    if (!st) return;
    photoCanvas.setPointerCapture(e.pointerId);
    const pt = photoCanvasPoint(e);
    if (st.tool === "pen") {
      st.drawing = true;
      st.currentStroke = { type: "stroke", color: st.color, width: st.strokeWidth, points: [pt] };
    } else if (st.tool === "text") {
      openPhotoTextInput(pt, e.clientX, e.clientY);
    }
  });
  photoCanvas.addEventListener("pointermove", (e) => {
    const st = photoEditorState;
    if (!st || !st.drawing) return;
    const pt = photoCanvasPoint(e);
    const last = st.currentStroke.points[st.currentStroke.points.length - 1];
    st.currentStroke.points.push(pt);
    st.ctx.strokeStyle = st.color;
    st.ctx.lineWidth = st.strokeWidth;
    st.ctx.lineCap = "round";
    st.ctx.lineJoin = "round";
    st.ctx.beginPath();
    st.ctx.moveTo(last.x, last.y);
    st.ctx.lineTo(pt.x, pt.y);
    st.ctx.stroke();
  });
  photoCanvas.addEventListener("pointerup", endPhotoStroke);
  photoCanvas.addEventListener("pointercancel", endPhotoStroke);
  photoCanvas.addEventListener("pointerleave", () => { if (photoEditorState?.drawing) endPhotoStroke(); });

  // Category modal
  const catModal = document.getElementById("modal-category");
  catModal.querySelector("#category-save-btn").addEventListener("click", saveCategoryModal);
  catModal.querySelector("#category-cancel-btn").addEventListener("click", () => closeModal(catModal));
  catModal.querySelector("#category-cancel-footer-btn").addEventListener("click", () => closeModal(catModal));

  // Light timer modal
  const timerModal = document.getElementById("modal-timer");
  timerModal.querySelector("#timer-save-btn").addEventListener("click", saveTimerModal);
  timerModal.querySelector("#timer-cancel-btn").addEventListener("click", () => closeModal(timerModal));
  timerModal.querySelector("#timer-cancel-footer-btn").addEventListener("click", () => closeModal(timerModal));

  // Maintenance schedule modal
  const maintenanceModal = document.getElementById("modal-maintenance");
  maintenanceModal.querySelector("#maintenance-save-btn").addEventListener("click", saveMaintenanceModal);
  maintenanceModal.querySelector("#maintenance-cancel-btn").addEventListener("click", () => closeModal(maintenanceModal));
  maintenanceModal.querySelector("#maintenance-cancel-footer-btn").addEventListener("click", () => closeModal(maintenanceModal));

  // Maintenance reminder popup
  const maintenanceReminderModal = document.getElementById("modal-maintenance-reminder");
  maintenanceReminderModal.querySelector("#maintenance-reminder-close-btn").addEventListener("click", () => closeModal(maintenanceReminderModal));
  maintenanceReminderModal.querySelector("#maintenance-reminder-ok-btn").addEventListener("click", () => closeModal(maintenanceReminderModal));

  // User modal
  const userModal = document.getElementById("modal-user");
  userModal.querySelector("#user-save-btn").addEventListener("click", saveUserModal);
  userModal.querySelector("#user-cancel-btn").addEventListener("click", () => closeModal(userModal));
  userModal.querySelector("#user-cancel-footer-btn").addEventListener("click", () => closeModal(userModal));

  // Reset password modal
  const resetPwModal = document.getElementById("modal-reset-password");
  resetPwModal.querySelector("#reset-password-save-btn").addEventListener("click", saveResetPasswordModal);
  resetPwModal.querySelector("#reset-password-cancel-btn").addEventListener("click", () => closeModal(resetPwModal));
  resetPwModal.querySelector("#reset-password-cancel-footer-btn").addEventListener("click", () => closeModal(resetPwModal));

  // User departments modal
  const userDeptModal = document.getElementById("modal-user-departments");
  userDeptModal.querySelector("#user-departments-save-btn").addEventListener("click", saveUserDepartmentsModal);
  userDeptModal.querySelector("#user-departments-cancel-btn").addEventListener("click", () => closeModal(userDeptModal));
  userDeptModal.querySelector("#user-departments-cancel-footer-btn").addEventListener("click", () => closeModal(userDeptModal));

  document.querySelectorAll(".modal-backdrop").forEach((bd) => {
    bd.addEventListener("click", (e) => {
      if (e.target === bd) closeModal(bd);
    });
  });
}

// ---------------- Auth / Login ----------------

function showLogin(message, notice) {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("signup-form").classList.add("hidden");
  document.getElementById("forgot-form").classList.add("hidden");
  document.getElementById("login-form").classList.remove("hidden");
  document.getElementById("login-password").value = "";
  loadLoginDepartments();
  const err = document.getElementById("login-error");
  if (message) {
    err.textContent = message;
    err.classList.remove("hidden");
  } else {
    err.classList.add("hidden");
  }
  const noticeEl = document.getElementById("login-notice");
  if (notice) {
    noticeEl.textContent = notice;
    noticeEl.classList.remove("hidden");
  } else {
    noticeEl.classList.add("hidden");
  }
}

async function startApp() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  state.settings = await Store.getSettings();
  setJournals(await Store.getAllJournals());
  if (Auth.isAdmin()) {
    state.users = await Store.getUsers();
    state.passwordResetRequests = await Store.getPasswordResetRequests();
    state.auditLogs = await Store.getAuditLogs();
    state.departments = await Store.getDepartments();
  } else {
    state.users = [];
    state.passwordResetRequests = [];
    state.auditLogs = [];
    state.departments = [];
  }

  const targetDept = resolveDefaultDepartment();
  const hasJournalForTarget = state.journals.some((j) => j.department === targetDept);
  if (!hasJournalForTarget && canCreateNewJournal()) {
    const j = buildNewJournal();
    state.journals.push(j);
    await saveJournal(j);
  }
  const currentDeptJournal = state.journals.find((j) => j.department === Auth.getCurrentDepartment());
  state.currentId = currentDeptJournal ? currentDeptJournal.id : (state.journals.length ? state.journals[0].id : null);

  state.lightTimer = Auth.getCurrentDepartment() ? await Store.getLightTimer(Auth.getCurrentDepartment()) : { department: "", rows: [] };
  state.maintenanceSchedule = Auth.getCurrentDepartment() ? await Store.getMaintenanceSchedule(Auth.getCurrentDepartment()) : { department: "", tasks: [] };

  render();
  startPresence();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

// ---------------- Sync (多台裝置同步) ----------------
//
// 手機、電腦、其他同事可能同時開著同一份週誌。做法：
// 1. 每份週誌記住「最後一次跟伺服器同步時的樣子」（journalBases，含版本號 version）。
// 2. 存檔時告訴伺服器「我是根據哪一版改的」；伺服器發現已經被別人改過會回 409 + 最新資料，
//    這時用 mergeJournal() 把「我改的」疊到「最新的」上面再存——不同項目的修改兩邊都保留，
//    同一個項目兩邊都改了，以這台裝置剛存的為準。
// 3. 每 15 秒（以及切回 App、網路恢復時）問伺服器各週誌的版本號，有變的才抓完整內容更新畫面。

const journalBases = new Map();
const SYNC_INTERVAL_MS = 15000;
let savingCount = 0;
let syncBusy = false;
let syncRenderPending = false;
const saveChains = new Map();

function cloneJson(o) {
  return JSON.parse(JSON.stringify(o));
}

function rememberBase(j) {
  journalBases.set(j.id, cloneJson(j));
}

function setJournals(list) {
  state.journals = list;
  journalBases.clear();
  list.forEach(rememberBase);
}

// 換掉物件內容但保留同一個參考，畫面上其他地方拿著的 j 也會跟著是最新的。
function replaceContents(target, src) {
  Object.keys(target).forEach((k) => delete target[k]);
  Object.assign(target, cloneJson(src));
}

// 三方合併：base = 我上次同步到的版本、local = 我現在的、server = 伺服器上最新的。
function mergeJournal(base, local, server) {
  if (!base) return cloneJson(local);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const result = cloneJson(server);
  for (const f of ["department", "periodStart", "periodEnd"]) {
    if (local[f] !== base[f]) result[f] = local[f];
  }

  const catFields = (c) => ({ name: c.name, isCompletedSection: !!c.isCompletedSection });
  const byId = (j) => new Map(j.categories.map((c) => [c.id, c]));
  const baseCats = byId(base), localCats = byId(local), serverCats = byId(server);
  const catIds = server.categories.map((c) => c.id);
  local.categories.forEach((c) => { if (!baseCats.has(c.id) && !serverCats.has(c.id)) catIds.push(c.id); });
  const finalCats = [];
  for (const id of catIds) {
    const b = baseCats.get(id), l = localCats.get(id), s = serverCats.get(id);
    if (b && !l) continue; // 這台裝置刪掉了
    const localChanged = l && (!b || !same(catFields(l), catFields(b)));
    if (b && !s && !localChanged) continue; // 別台刪掉了，這台沒動過
    finalCats.push({ id, ...catFields(localChanged ? l : (s || l)), items: [] });
  }

  const itemIndex = (j) => {
    const m = new Map();
    j.categories.forEach((c) => c.items.forEach((it, i) => m.set(it.id, { catId: c.id, it, i })));
    return m;
  };
  const B = itemIndex(base), L = itemIndex(local), S = itemIndex(server);
  const placed = [];
  for (const id of new Set([...S.keys(), ...L.keys()])) {
    const b = B.get(id), l = L.get(id), s = S.get(id);
    if (b && !l) continue;
    const localChanged = l && (!b || b.catId !== l.catId || !same(b.it, l.it));
    if (b && !s && !localChanged) continue;
    const pick = localChanged ? l : (s || l);
    placed.push({ ...pick, order: pick.i + (pick === l && !s ? 0.5 : 0) });
  }
  const catMap = new Map(finalCats.map((c) => [c.id, c]));
  placed.sort((a, b) => a.order - b.order).forEach((p) => {
    const cat = catMap.get(p.catId) || finalCats.find((c) => !c.isCompletedSection) || finalCats[0];
    if (cat) cat.items.push(cloneJson(p.it));
  });
  result.categories = finalCats;
  return result;
}

// 存檔一律走這裡（不要直接呼叫 Store.saveJournal）。同一份週誌的存檔排隊依序送出，
// 避免前一次還沒回來、下一次就帶著舊版本號送出去。
function saveJournal(j) {
  const id = j.id;
  const next = (saveChains.get(id) || Promise.resolve()).catch(() => {}).then(() => saveJournalNow(id));
  saveChains.set(id, next);
  return next;
}

async function saveJournalNow(id) {
  savingCount++;
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      const local = state.journals.find((x) => x.id === id);
      if (!local) return;
      const base = journalBases.get(id);
      try {
        const saved = await Store.saveJournal(local, base ? base.version || 0 : 0);
        local.version = saved.version;
        rememberBase(saved);
        return;
      } catch (err) {
        if (err.status !== 409 || !err.body || !err.body.current) throw err;
        const server = err.body.current;
        replaceContents(local, mergeJournal(base, local, server));
        local.version = server.version;
        rememberBase(server);
        syncRenderPending = true; // 合併進來的別人的修改，存完後要顯示出來
      }
    }
    throw new Error("這份週誌一直被其他裝置修改，請稍後再試一次");
  } finally {
    savingCount--;
    if (syncRenderPending && savingCount === 0) renderAfterSync();
  }
}

// 使用者正在畫面上的欄位打字（例如期間日期）時先不要重畫，離開欄位後再更新。
function renderAfterSync() {
  const active = document.activeElement;
  const root = document.getElementById("view-root");
  if (active && root.contains(active) && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)) {
    syncRenderPending = true;
    active.addEventListener("blur", () => setTimeout(renderAfterSync, 0), { once: true });
    return;
  }
  syncRenderPending = false;
  if (!document.getElementById("app").classList.contains("hidden")) render();
}

async function syncFromServer() {
  if (syncBusy || savingCount > 0 || !Auth.isLoggedIn() || document.hidden) return;
  syncBusy = true;
  try {
    const versions = await Store.getJournalVersions();
    const remote = new Map(versions.map((v) => [v.id, v]));
    let changed = false;

    // 別台裝置刪掉的週誌（還沒存上去過的新週誌沒有 base，不算）
    const kept = state.journals.filter((j) => remote.has(j.id) || !journalBases.has(j.id));
    if (kept.length !== state.journals.length) {
      state.journals.filter((j) => !kept.includes(j)).forEach((j) => journalBases.delete(j.id));
      state.journals = kept;
      changed = true;
    }

    for (const v of versions) {
      const base = journalBases.get(v.id);
      if (base && (base.version || 0) === v.version) continue;
      if (savingCount > 0) break; // 這台正在存檔，下一輪再同步
      const fresh = await Store.getJournal(v.id);
      if (savingCount > 0) break;
      const existing = state.journals.find((j) => j.id === v.id);
      if (existing) replaceContents(existing, fresh);
      else state.journals.push(fresh);
      rememberBase(fresh);
      changed = true;
    }

    if (changed) {
      state.journals.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
      if (!state.journals.some((j) => j.id === state.currentId)) {
        const dept = Auth.getCurrentDepartment();
        const fallback = state.journals.find((j) => !dept || j.department === dept);
        state.currentId = fallback ? fallback.id : null;
      }
      renderAfterSync();
    }
  } catch {
    // 沒網路或伺服器在睡覺：下一輪再試
  } finally {
    syncBusy = false;
  }
}

// ---------------- Presence (誰在線上) ----------------

let presenceTimers = [];

function stopPresence() {
  presenceTimers.forEach(clearInterval);
  presenceTimers = [];
  state.onlineUsers = [];
}

// 每 10 秒回報一次「我還在線上」；關掉頁面/App 時立刻通知下線；管理員每 5 秒更新一次名單，
// 所以上線、下線大約幾秒內就會反映在名單上。資料在 Google 雲端時每次請求比較慢、也有同時執行上限：
// 改成每 20 秒回報一次，管理員的名單直接從回報的回應拿，不另外輪詢。
let presenceUnloadWired = false;

function startPresence() {
  stopPresence();
  const beat = () => {
    if (!Auth.isLoggedIn()) return;
    Store.presenceHeartbeat(Auth.getCurrentDepartment())
      .then((online) => {
        if (!Array.isArray(online) || !Auth.isAdmin()) return;
        state.onlineUsers = online;
        updateOnlineUsersUi();
      })
      .catch(() => {});
  };
  beat();
  presenceTimers.push(setInterval(beat, Store.usesCloud ? 20000 : 10000));
  presenceTimers.push(setInterval(syncFromServer, SYNC_INTERVAL_MS));
  if (Auth.isAdmin() && !Store.usesCloud) {
    refreshOnlineUsers();
    presenceTimers.push(setInterval(refreshOnlineUsers, 5000));
  }

  if (presenceUnloadWired) return;
  presenceUnloadWired = true;
  // 分頁被瀏覽器降速後切回來，馬上補報一次並更新名單，不用等下一個計時。
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible" || !Auth.isLoggedIn()) return;
    beat();
    if (!Store.usesCloud) refreshOnlineUsers();
    syncFromServer();
  });
  window.addEventListener("online", () => syncFromServer());
  // 關閉分頁/視窗：用 sendBeacon / keepalive 讓請求在頁面卸載後仍能送出（一般 fetch 會被中斷）。
  window.addEventListener("pagehide", () => Store.presenceSignOffOnUnload());
}

async function refreshOnlineUsers() {
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) return;
  try {
    state.onlineUsers = await Store.getOnlineUsers();
  } catch (e) {
    return;
  }
  updateOnlineUsersUi();
}

// 只更新線上名單那一塊，不重畫整個設定頁，避免蓋掉正在輸入的欄位。
function updateOnlineUsersUi() {
  const list = document.getElementById("online-users-list");
  const count = document.getElementById("online-users-count");
  const tile = document.getElementById("online-users-tile");
  if (tile) tile.textContent = state.onlineUsers.length;
  if (count) count.textContent = `${state.onlineUsers.length} 人`;
  if (list) list.innerHTML = renderOnlineUsersRows();
}

function renderOnlineUsersRows() {
  if (!state.onlineUsers.length) return `<p class="cat-empty">目前沒有人在線上</p>`;
  return state.onlineUsers.map((u) => {
    const secs = Math.max(0, Math.round((Date.now() - new Date(u.lastSeenAt).getTime()) / 1000));
    const ago = secs < 60 ? "剛剛" : `${Math.floor(secs / 60)} 分鐘前`;
    const meta = [u.role === "Admin" ? "系統管理員" : "", u.department].filter(Boolean).join(" · ");
    return `
    <div class="online-user-row">
      <span class="online-dot"></span>
      <div class="online-user-info">
        <div class="online-user-name">${escapeHtml(u.displayName || u.username)}${u.isSelf ? `<span class="online-user-self">（你）</span>` : ""}</div>
        ${meta ? `<div class="online-user-meta">${escapeHtml(meta)}</div>` : ""}
      </div>
      <span class="online-user-ago">${ago}</span>
    </div>`;
  }).join("");
}

function handleLogout() {
  // 先通知伺服器「我下線了」（需要還帶著 token，所以要在 Auth.logout() 之前），失敗也沒關係。
  Store.presenceSignOff().catch(() => {});
  stopPresence();
  Auth.logout();
  state.settings = null;
  setJournals([]);
  state.currentId = null;
  state.users = [];
  state.passwordResetRequests = [];
  state.auditLogs = [];
  state.lightTimer = { department: "", rows: [] };
  state.maintenanceSchedule = { department: "", tasks: [] };
  state.maintenanceReminderShown = false;
  showLogin();
}

async function loadLoginDepartments() {
  const select = document.getElementById("login-department");
  if (!select) return;
  try {
    const departments = await Store.getDepartments();
    const options = departments.map((d) => `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`).join("");
    select.innerHTML = `<option value="">（系統管理員可略過）</option>${options}`;
  } catch (e) {
    select.innerHTML = `<option value="">（系統管理員可略過）</option>`;
  }
}

function wirePasswordToggle(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;
  toggle.addEventListener("click", () => {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    toggle.querySelector(".pw-eye-open").classList.toggle("hidden", !showing);
    toggle.querySelector(".pw-eye-closed").classList.toggle("hidden", showing);
    toggle.title = showing ? "顯示密碼" : "隱藏密碼";
    toggle.setAttribute("aria-label", showing ? "顯示密碼" : "隱藏密碼");
  });
}

function wireLoginEvents() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const forgotForm = document.getElementById("forgot-form");

  document.getElementById("theme-toggle-login").addEventListener("click", () => Theme.toggle());

  wirePasswordToggle("login-password", "login-password-toggle");
  wirePasswordToggle("signup-password", "signup-password-toggle");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const selectedDepartment = document.getElementById("login-department").value;
    const remember = document.getElementById("login-remember").checked;
    if (!username || !password) return;
    const btn = document.getElementById("login-submit-btn");
    const noticeEl = document.getElementById("login-notice");
    const errEl = document.getElementById("login-error");
    btn.disabled = true;
    errEl.classList.add("hidden");
    try {
      const data = await Auth.login(username, password, selectedDepartment, remember, () => {
        noticeEl.textContent = "伺服器正在啟動中，請稍候片刻（免費方案閒置後需要重新喚醒，最多約 1 分鐘）...";
        noticeEl.classList.remove("hidden");
      });
      await startApp();
      if (data.departmentMismatch && data.currentDepartment) {
        alert(`已自動切換至帳號所屬餐廳：${data.currentDepartment}`);
      }
    } catch (err) {
      showLogin(err.message);
    } finally {
      btn.disabled = false;
    }
  });

  document.getElementById("show-login-link").addEventListener("click", (e) => {
    e.preventDefault();
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });

  document.getElementById("show-forgot-link").addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    forgotForm.classList.remove("hidden");
  });

  document.getElementById("show-login-from-forgot-link").addEventListener("click", (e) => {
    e.preventDefault();
    forgotForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value;
    const displayName = document.getElementById("signup-displayname").value.trim();
    if (!username || !password) return;
    const btn = document.getElementById("signup-submit-btn");
    const err = document.getElementById("signup-error");
    btn.disabled = true;
    err.classList.add("hidden");
    try {
      await Auth.signup(username, password, displayName);
      signupForm.reset();
      showLogin(null, "註冊成功，請等待管理員審核通過後即可登入");
    } catch (signupErr) {
      err.textContent = signupErr.message;
      err.classList.remove("hidden");
    } finally {
      btn.disabled = false;
    }
  });

  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("forgot-username").value.trim();
    if (!username) return;
    const btn = document.getElementById("forgot-submit-btn");
    const err = document.getElementById("forgot-error");
    btn.disabled = true;
    err.classList.add("hidden");
    try {
      await Auth.forgotPassword(username);
      forgotForm.reset();
      showLogin(null, "已送出重設密碼申請，請等待管理員處理");
    } catch (forgotErr) {
      err.textContent = forgotErr.message;
      err.classList.remove("hidden");
    } finally {
      btn.disabled = false;
    }
  });

  window.addEventListener("wj:unauthorized", () => {
    stopPresence();
    showLogin("登入已過期，請重新登入");
  });
}

// ---------------- Init ----------------

async function init() {
  wireLoginEvents();
  wireEvents();

  if (Auth.isLoggedIn()) {
    try {
      await startApp();
    } catch (err) {
      showLogin(err.message);
    }
  } else {
    showLogin();
  }
}

document.addEventListener("DOMContentLoaded", init);
