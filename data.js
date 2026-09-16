/*
 * 資料存取層 (Data Store)
 * 串接後端 ASP.NET Core Web API（MSSQL）。所有方法皆為 async。
 * 若 API 與前端不同網域，請修改下方 API_BASE 為完整網址，例如：
 *   const API_BASE = "https://intranet.example.com/api";
 */

const API_BASE = "/api";

function uid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

const Auth = {
  TOKEN_KEY: "wj_token",
  USER_KEY: "wj_user",
  DEPARTMENT_KEY: "wj_department",
  MY_DEPARTMENTS_KEY: "wj_my_departments",

  // 「記住我」勾選時，登入資訊寫進 localStorage（關閉瀏覽器/App 也不會消失，直到登出）；
  // 沒勾選則沿用原本的 sessionStorage（分頁/App 關掉就清掉）。以 localStorage 有沒有
  // token 來判斷這次是用哪一種，讓其餘方法都能自動存取到同一份。
  _storage() {
    try {
      if (localStorage.getItem(this.TOKEN_KEY)) return localStorage;
    } catch (e) {
      // 部分瀏覽器的私密模式可能會擋 localStorage 存取，改用 sessionStorage 即可。
    }
    return sessionStorage;
  },

  getToken() {
    return this._storage().getItem(this.TOKEN_KEY);
  },

  getUser() {
    try {
      const raw = this._storage().getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const u = this.getUser();
    return !!u && u.role === "Admin";
  },

  getCurrentDepartment() {
    return this._storage().getItem(this.DEPARTMENT_KEY) || "";
  },

  setCurrentDepartment(name) {
    this._storage().setItem(this.DEPARTMENT_KEY, name || "");
  },

  // 回傳帳號被指派的餐廳清單，每筆為 { departmentId, departmentName, canEdit }。
  getMyDepartments() {
    try {
      const raw = this._storage().getItem(this.MY_DEPARTMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  // 系統管理員不受餐廳綁定限制，一律視為可編輯。一般使用者依 UserDepartments 的 CanEdit 判斷；
  // 未被指派的餐廳（理論上不會出現在畫面上，因為後端已依權限篩選）視為不可編輯。
  canEditDepartment(name) {
    if (this.isAdmin()) return true;
    const dept = this.getMyDepartments().find((d) => d.departmentName === name);
    return !!dept && dept.canEdit;
  },

  // 登入時選的餐廳僅供帶入方便，真正可用的餐廳以帳號實際被指派的清單為準。
  // 若選擇的餐廳不在帳號權限內（或沒選），自動改用帳號實際所屬餐廳的第一筆。
  // remember=true 時登入狀態會保留到手動登出為止；false 則只在這次瀏覽器/App 開啟期間有效。
  // onRetry(attempt, maxAttempts), if given, is called each time a request fails in a way
  // that looks like the free-tier host waking up from sleep (network error, or 5xx) rather
  // than a definitive answer, so the UI can show a "server is starting up" message instead
  // of failing immediately — cold starts on Render's free tier can take 50+ seconds.
  async login(username, password, selectedDepartment, remember, onRetry) {
    const maxAttempts = 10;
    const retryDelayMs = 6000;

    let res = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
      } catch (e) {
        res = null;
      }

      // A real answer from the app (success, or a definitive rejection like wrong
      // password / not approved) — stop here. Only network failures and 5xx (server
      // still booting) are worth retrying.
      if (res && res.status < 500) break;

      if (attempt < maxAttempts) {
        onRetry?.(attempt, maxAttempts);
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }

    if (!res) throw new Error("伺服器目前無法連線，請稍後再試");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `請求失敗 (${res.status})`);
    }
    const data = await res.json();

    // 先把兩邊都清乾淨，確保同一時間只有一種儲存方式在生效，不會有舊資料殘留搞混。
    [localStorage, sessionStorage].forEach((s) => {
      try {
        s.removeItem(this.TOKEN_KEY);
        s.removeItem(this.USER_KEY);
        s.removeItem(this.DEPARTMENT_KEY);
        s.removeItem(this.MY_DEPARTMENTS_KEY);
      } catch (e) {}
    });

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(this.TOKEN_KEY, data.token);
    storage.setItem(this.USER_KEY, JSON.stringify({ username: data.username, displayName: data.displayName, role: data.role }));

    const departments = data.departments || [];
    const departmentNames = departments.map((d) => d.departmentName);
    storage.setItem(this.MY_DEPARTMENTS_KEY, JSON.stringify(departments));

    // 系統管理員不受餐廳綁定限制，不需挑選也不會被導向/擋下：直接採用登入畫面選的餐廳（可留空）。
    if (data.role === "Admin") {
      this.setCurrentDepartment(selectedDepartment || departmentNames[0] || "");
      data.currentDepartment = selectedDepartment || departmentNames[0] || "";
      data.departmentMismatch = false;
      return data;
    }

    const matched = departmentNames.includes(selectedDepartment) ? selectedDepartment : departmentNames[0] || "";
    this.setCurrentDepartment(matched);
    data.currentDepartment = matched;
    data.departmentMismatch = !!selectedDepartment && matched !== selectedDepartment;
    return data;
  },

  logout() {
    [localStorage, sessionStorage].forEach((s) => {
      try {
        s.removeItem(this.TOKEN_KEY);
        s.removeItem(this.USER_KEY);
        s.removeItem(this.DEPARTMENT_KEY);
        s.removeItem(this.MY_DEPARTMENTS_KEY);
      } catch (e) {}
    });
  },

  async signup(username, password, displayName) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "註冊失敗");
    }
    return res.json();
  },

  async forgotPassword(username) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "申請失敗");
    }
    return res.json();
  },
};

async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Only GETs are safe to silently retry (no risk of double-applying a write). This matters
  // most right after login: the app immediately fires a burst of GETs to load the dashboard,
  // and on Render's free tier the server can still be finishing its wake-up from sleep at that
  // exact moment — without this, one flaky call in that burst would bounce the user straight
  // back to the login screen seconds after a successful login.
  const method = (options.method || "GET").toUpperCase();
  const isRetryable = method === "GET";
  const maxAttempts = isRetryable ? 5 : 1;
  const retryDelayMs = 3000;

  let res = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch (e) {
      res = null;
    }
    if (res && res.status < 500) break;
    if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, retryDelayMs));
  }
  if (!res) throw new Error("伺服器目前無法連線，請稍後再試");

  if (res.status === 401) {
    Auth.logout();
    window.dispatchEvent(new CustomEvent("wj:unauthorized"));
    throw new Error("登入已過期，請重新登入");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `請求失敗 (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

const Store = {
  // ---- Journals ----
  async getAllJournals() {
    return apiFetch("/journals");
  },

  async getJournal(id) {
    return apiFetch(`/journals/${id}`);
  },

  async saveJournal(journal) {
    return apiFetch(`/journals/${journal.id}`, {
      method: "PUT",
      body: JSON.stringify(journal),
    });
  },

  async deleteJournal(id) {
    await apiFetch(`/journals/${id}`, { method: "DELETE" });
  },

  // ---- Settings ----
  async getSettings() {
    return apiFetch("/settings");
  },

  async saveSettings(settings) {
    return apiFetch("/settings", { method: "PUT", body: JSON.stringify(settings) });
  },

  // ---- Users (Admin only) ----
  async getUsers() {
    return apiFetch("/users");
  },

  async createUser(payload) {
    return apiFetch("/users", { method: "POST", body: JSON.stringify(payload) });
  },

  async deleteUser(id) {
    await apiFetch(`/users/${id}`, { method: "DELETE" });
  },

  async resetUserPassword(id, password) {
    return apiFetch(`/users/${id}/password`, { method: "PUT", body: JSON.stringify({ password }) });
  },

  async changeUserRole(id, role) {
    return apiFetch(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) });
  },

  async approveUser(id) {
    return apiFetch(`/users/${id}/approve`, { method: "PUT" });
  },

  // departments: [{ departmentId, canEdit }, ...]
  async setUserDepartments(id, departments, allDepartments, allDepartmentsCanEdit) {
    return apiFetch(`/users/${id}/departments`, {
      method: "PUT",
      body: JSON.stringify({ departments, allDepartments: !!allDepartments, allDepartmentsCanEdit: !!allDepartmentsCanEdit }),
    });
  },

  // ---- Departments / 餐廳 ----
  async getDepartments() {
    return apiFetch("/departments");
  },

  async createDepartment(name) {
    return apiFetch("/departments", { method: "POST", body: JSON.stringify({ name }) });
  },

  async renameDepartment(id, name) {
    return apiFetch(`/departments/${id}`, { method: "PUT", body: JSON.stringify({ name }) });
  },

  async deleteDepartment(id) {
    await apiFetch(`/departments/${id}`, { method: "DELETE" });
  },

  // ---- Password reset requests (Admin only) ----
  async getPasswordResetRequests() {
    return apiFetch("/password-reset-requests");
  },

  async approvePasswordReset(id, password) {
    return apiFetch(`/password-reset-requests/${id}/approve`, { method: "PUT", body: JSON.stringify({ password }) });
  },

  async rejectPasswordReset(id) {
    await apiFetch(`/password-reset-requests/${id}`, { method: "DELETE" });
  },

  // ---- Audit log (Admin only) ----
  async getAuditLogs() {
    return apiFetch("/audit-logs");
  },

  // ---- Light timers (per department) ----
  async getLightTimer(department) {
    return apiFetch(`/light-timers/${encodeURIComponent(department)}`);
  },

  async saveLightTimer(department, table) {
    return apiFetch(`/light-timers/${encodeURIComponent(department)}`, {
      method: "PUT",
      body: JSON.stringify(table),
    });
  },

  // ---- Maintenance schedule (per department) ----
  async getMaintenanceSchedule(department) {
    return apiFetch(`/maintenance-schedules/${encodeURIComponent(department)}`);
  },

  async saveMaintenanceSchedule(department, schedule) {
    return apiFetch(`/maintenance-schedules/${encodeURIComponent(department)}`, {
      method: "PUT",
      body: JSON.stringify(schedule),
    });
  },
};

window.Store = Store;
window.Auth = Auth;
window.uid = uid;
