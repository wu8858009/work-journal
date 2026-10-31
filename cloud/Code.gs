/** @OnlyCurrentDoc */
/**
 * 工作週誌 雲端後端（Google Apps Script ＋ Google 試算表）
 *
 * 取代原本的 Render 伺服器＋MongoDB：網頁（GitHub Pages）把每個 API 請求包成
 *   POST { m: "GET"|"POST"|"PUT"|"DELETE", p: "/journals/…", t: 登入權杖, b: 內容 }
 * 送到這個「網頁應用程式」，這裡照原本後端的規則處理後回傳 { s: HTTP 狀態碼, b: 內容 }。
 * 路徑、欄位、權限、錯誤訊息都跟原本的 ASP.NET 後端一樣，前端只換了傳送方式。
 *
 * 部署：執行身分＝我、誰可以存取＝所有人。資料都存在這份試算表裡，請勿手動修改各工作表內容。
 */

const APP_VERSION = 1;
const TOKEN_MINUTES = 480;            // 跟原本 Jwt:ExpireMinutes 一樣
const PRESENCE_WINDOW_MS = 75 * 1000; // 多久沒回報就視為離線
const AUDIT_KEEP = 1000;              // 稽核紀錄最多保留幾筆（畫面只顯示最新 100 筆）
const CHUNK = 45000;                  // 每格上限 5 萬字，大型 JSON 分段存在同一列的多個欄位
const PBKDF2_ITERATIONS = 100000;     // 跟原本 PasswordHasher 相同，舊密碼可以直接沿用

const DEFAULT_COMPANY = "水灣企業股份有限公司";
const DEFAULT_DEPARTMENT = "碧潭工程";
// 密碼 Admin@2026Init（跟原本 MongoSeeder 一樣）；只有在完全沒有帳號時才會建立。
const DEFAULT_ADMIN_HASH = "100000.nzwYm05lGw0GjuRSmo/fTQ==.Du+TEbYJR+tfCLtiS2oXqPcd9t+PGuMVioCu7+9Ips0=";

// ---------------------------------------------------------------- 進入點

function doGet() {
  return out_({ s: 200, b: { ok: true, app: "WorkJournal", ver: APP_VERSION } });
}

function doPost(e) {
  let req = {};
  try { req = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (x) {}
  let res;
  try {
    res = route_(String(req.m || "GET").toUpperCase(), String(req.p || ""), req.b == null ? {} : req.b, String(req.t || ""));
  } catch (err) {
    res = err && err.httpStatus ? { s: err.httpStatus, b: { message: err.message } }
      : { s: 500, b: { message: "雲端發生錯誤：" + (err && err.message ? err.message : err) } };
  } finally {
    releaseLock_();
  }
  return out_(res);
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(status, message) {
  const e = new Error(message);
  e.httpStatus = status;
  throw e;
}

const ok_ = (b) => ({ s: 200, b: b });
const noContent_ = () => ({ s: 204, b: null });

// ---------------------------------------------------------------- 路由

// [方法, 路徑, 權限("public"|"user"|"admin"), 處理函式]
const ROUTES = [
  ["POST", /^\/auth\/login$/, "public", (c) => login_(c.body)],
  ["POST", /^\/auth\/register$/, "public", (c) => register_(c.body)],
  ["POST", /^\/auth\/signup$/, "public", (c) => signup_(c.body)],
  ["POST", /^\/auth\/forgot-password$/, "public", (c) => forgotPassword_(c.body)],
  ["POST", /^\/setup\/import$/, "public", (c) => importAll_(c)],

  ["GET", /^\/departments$/, "public", () => ok_(departmentsSorted_().map((d) => ({ id: d.id, name: d.name })))],
  ["POST", /^\/departments$/, "admin", (c) => createDepartment_(c)],
  ["PUT", /^\/departments\/(\d+)$/, "admin", (c) => renameDepartment_(c, +c.args[0])],
  ["DELETE", /^\/departments\/(\d+)$/, "admin", (c) => deleteDepartment_(c, +c.args[0])],

  ["GET", /^\/journals$/, "user", (c) => getJournals_(c)],
  ["GET", /^\/journals\/versions$/, "user", (c) => getJournalVersions_(c)],
  ["GET", /^\/journals\/([^/]+)$/, "user", (c) => getJournal_(c, c.args[0])],
  ["PUT", /^\/journals\/([^/]+)$/, "user", (c) => upsertJournal_(c, c.args[0])],
  ["DELETE", /^\/journals\/([^/]+)$/, "user", (c) => deleteJournal_(c, c.args[0])],

  ["GET", /^\/settings$/, "user", () => ok_(getSettings_())],
  ["PUT", /^\/settings$/, "admin", (c) => saveSettings_(c)],

  ["GET", /^\/users$/, "admin", () => getUsers_()],
  ["POST", /^\/users$/, "admin", (c) => createUser_(c)],
  ["PUT", /^\/users\/(\d+)\/departments$/, "admin", (c) => setUserDepartments_(c, +c.args[0])],
  ["PUT", /^\/users\/(\d+)\/approve$/, "admin", (c) => approveUser_(c, +c.args[0])],
  ["PUT", /^\/users\/(\d+)\/password$/, "admin", (c) => resetUserPassword_(c, +c.args[0])],
  ["PUT", /^\/users\/(\d+)\/role$/, "admin", (c) => changeRole_(c, +c.args[0])],
  ["PUT", /^\/users\/(\d+)\/display-name$/, "admin", (c) => renameUser_(c, +c.args[0])],
  ["DELETE", /^\/users\/(\d+)$/, "admin", (c) => deleteUser_(c, +c.args[0])],

  ["GET", /^\/password-reset-requests$/, "admin", () => getResetRequests_()],
  ["PUT", /^\/password-reset-requests\/(\d+)\/approve$/, "admin", (c) => approveReset_(c, +c.args[0])],
  ["DELETE", /^\/password-reset-requests\/(\d+)$/, "admin", (c) => rejectReset_(c, +c.args[0])],

  ["POST", /^\/presence\/heartbeat$/, "user", (c) => heartbeat_(c)],
  ["DELETE", /^\/presence$/, "user", (c) => signOff_(c)],
  ["GET", /^\/presence$/, "admin", (c) => ok_(onlineUsers_(c))],

  ["GET", /^\/audit-logs$/, "admin", () => getAuditLogs_()],

  ["GET", /^\/light-timers\/(.+)$/, "user", (c) => getDeptTable_(c, "LightTimers", "rows", c.args[0])],
  ["PUT", /^\/light-timers\/(.+)$/, "user", (c) => saveDeptTable_(c, "LightTimers", "rows", c.args[0])],
  ["GET", /^\/maintenance-schedules\/(.+)$/, "user", (c) => getDeptTable_(c, "Maintenance", "tasks", c.args[0])],
  ["PUT", /^\/maintenance-schedules\/(.+)$/, "user", (c) => saveDeptTable_(c, "Maintenance", "tasks", c.args[0])],
];

function route_(method, path, body, token) {
  path = path.split("?")[0].replace(/^\/api(?=\/)/, "");
  for (const [m, re, level, handler] of ROUTES) {
    if (m !== method) continue;
    const match = re.exec(path);
    if (!match) continue;
    if (!(m === "POST" && path === "/setup/import")) ensureSeeded_();
    const ctx = { body: body, args: match.slice(1).map(decodeURIComponent), user: null, token: token };
    if (level !== "public") {
      ctx.user = authenticate_(token);
      if (level === "admin" && ctx.user.role !== "Admin") fail_(403, "您沒有權限執行這個動作");
    }
    return handler(ctx);
  }
  fail_(404, "找不到這個功能");
}

// ---------------------------------------------------------------- 試算表儲存層
// 每種資料一張工作表，一筆一列：A 欄＝鍵、B 欄＝小型索引資料（JSON）、C 欄之後＝內容 JSON 分段。
// 每格都加 ~ 前綴並設成純文字，避免數字、日期或 = 開頭的內容被試算表自動轉換。

let ss_ = null;
const memo_ = {};

function book_() {
  return ss_ || (ss_ = SpreadsheetApp.getActive());
}

function sheet_(name) {
  const b = book_();
  return b.getSheetByName(name) || b.insertSheet(name);
}

function cellIn_(v) { return "~" + v; }
function cellOut_(v) { return v === "" || v == null ? "" : String(v).slice(1); }

// 讀出整張表：[{ key, meta, data }]；metaOnly 只讀 A、B 欄（例如只要版本號時，不必把照片都讀出來）
function readAll_(name, metaOnly) {
  const cacheKey = name + (metaOnly ? ":m" : "");
  if (memo_[cacheKey]) return memo_[cacheKey];
  const s = sheet_(name), n = s.getLastRow();
  const list = [];
  if (n > 0) {
    const cols = metaOnly ? 2 : Math.max(2, s.getLastColumn());
    const values = s.getRange(1, 1, n, cols).getValues();
    for (let i = 0; i < values.length; i++) {
      const r = values[i];
      const key = cellOut_(r[0]);
      if (!key) continue;
      const metaTxt = cellOut_(r[1]);
      const rec = { key: key, row: i + 1, meta: metaTxt ? JSON.parse(metaTxt) : {} };
      if (!metaOnly) rec.data = parseChunks_(r);
      list.push(rec);
    }
  }
  memo_[cacheKey] = list;
  return list;
}

function parseChunks_(r) {
  let txt = "";
  for (let c = 2; c < r.length; c++) txt += cellOut_(r[c]);
  return txt ? JSON.parse(txt) : null;
}

// 新工作表只有 1000 列 × 26 欄，寫到外面會出錯：不夠就先加大
function ensureSize_(s, rows, cols) {
  const maxR = s.getMaxRows(), maxC = s.getMaxColumns();
  if (rows > maxR) s.insertRowsAfter(maxR, rows - maxR + 100);
  if (cols > maxC) s.insertColumnsAfter(maxC, cols - maxC);
}

function dataOf_(name) {
  return readAll_(name).map((r) => r.data);
}

function findRec_(name, key) {
  return readAll_(name).find((r) => r.key === String(key)) || null;
}

function put_(name, key, data, meta) {
  const s = sheet_(name);
  const txt = JSON.stringify(data);
  const row = [cellIn_(String(key)), cellIn_(JSON.stringify(meta || {}))];
  for (let i = 0; i < txt.length; i += CHUNK) row.push(cellIn_(txt.slice(i, i + CHUNK)));
  const existing = (memo_[name] || memo_[name + ":m"] || readAll_(name, true)).find((r) => r.key === String(key));
  let rowIndex;
  if (existing) {
    rowIndex = existing.row;
    const width = Math.max(row.length, s.getLastColumn());
    while (row.length < width) row.push("");
  } else {
    rowIndex = s.getLastRow() + 1;
  }
  ensureSize_(s, rowIndex, row.length);
  const range = s.getRange(rowIndex, 1, 1, row.length);
  range.setNumberFormat("@");
  range.setValues([row]);
  invalidate_(name);
}

function remove_(name, key) {
  const rec = readAll_(name, true).find((r) => r.key === String(key));
  if (!rec) return false;
  sheet_(name).deleteRow(rec.row);
  invalidate_(name);
  return true;
}

// 一次刪掉多筆（由下往上刪，列號才不會跑掉）
function removeMany_(name, keys) {
  const want = {};
  keys.forEach((k) => { want[String(k)] = 1; });
  const rows = readAll_(name, true).filter((r) => want[r.key]).map((r) => r.row).sort((a, b) => b - a);
  const s = sheet_(name);
  rows.forEach((r) => s.deleteRow(r));
  if (rows.length) invalidate_(name);
}

function invalidate_(name) {
  delete memo_[name];
  delete memo_[name + ":m"];
}

// ---------------------------------------------------------------- 鎖、編號、時間

let lock = null;

// 會寫入資料的動作一律先上鎖，避免兩台裝置同時存檔互相蓋掉。
function lock_() {
  if (lock) return;
  const l = LockService.getScriptLock();
  if (!l.tryLock(30000)) fail_(503, "雲端忙碌中，請稍後再試");
  lock = l;
  for (const k in memo_) delete memo_[k]; // 等鎖期間別人可能改過，重新讀
}

function releaseLock_() {
  if (!lock) return;
  const l = lock;
  lock = null;
  l.releaseLock();
}

function nextId_(counter) {
  const props = PropertiesService.getScriptProperties();
  const n = (parseInt(props.getProperty("seq_" + counter), 10) || 0) + 1;
  props.setProperty("seq_" + counter, String(n));
  return n;
}

function nowIso_() {
  return new Date().toISOString();
}

// ---------------------------------------------------------------- 初始資料

function ensureSeeded_() {
  if (readAll_("Users", true).length) return;
  lock_();
  if (readAll_("Users", true).length) return;
  if (!findRec_("Settings", "1")) put_("Settings", "1", { companyName: DEFAULT_COMPANY, defaultDepartment: DEFAULT_DEPARTMENT });
  let dept = departmentsSorted_().find((d) => d.name === DEFAULT_DEPARTMENT);
  if (!dept) {
    dept = { id: nextId_("departments"), name: DEFAULT_DEPARTMENT };
    put_("Departments", dept.id, dept);
  }
  const id = nextId_("users");
  put_("Users", id, {
    id: id, username: "admin", passwordHash: DEFAULT_ADMIN_HASH, displayName: "系統管理員", role: "Admin",
    isApproved: true, tokenVersion: 1, createdAt: nowIso_(),
    departments: [{ departmentId: dept.id, canEdit: true }], allDepartments: false, allDepartmentsCanEdit: false,
  });
}

// 一次性搬家：把原本 MongoDB 匯出的全部資料寫進來。只有在還沒有任何帳號時才允許
// （或由管理員帶 replaceAll: true 覆蓋全部）。
function importAll_(c) {
  lock_();
  const b = c.body || {};
  if (readAll_("Users", true).length) {
    let admin = null;
    try { admin = authenticate_(c.token || ""); } catch (x) {}
    if (!(admin && admin.role === "Admin" && b.replaceAll === true)) fail_(403, "雲端已經有資料，不能再匯入");
  }
  const tables = { Users: b.users, Departments: b.departments, LightTimers: b.lightTimers, Maintenance: b.maintenanceSchedules,
    AuditLogs: b.auditLogs, PasswordResets: b.passwordResetRequests, Settings: b.settings ? [b.settings] : [] };
  ["Users", "Departments", "Journals", "Photos", "LightTimers", "Maintenance", "AuditLogs", "PasswordResets", "Settings"].forEach((n) => {
    sheet_(n).clear();
    invalidate_(n);
  });
  (tables.Users || []).forEach((u) => put_("Users", u.id, u));
  (tables.Departments || []).forEach((d) => put_("Departments", d.id, d));
  (tables.LightTimers || []).forEach((t) => put_("LightTimers", t.department, t));
  (tables.Maintenance || []).forEach((t) => put_("Maintenance", t.department, t));
  (tables.PasswordResets || []).forEach((r) => put_("PasswordResets", r.id, r));
  (tables.Settings || []).forEach((st) => put_("Settings", "1", st));
  writeAuditRows_(tables.AuditLogs || []);
  (b.journals || []).forEach((j) => writeJournal_(j, j.version || 1, j.createdAt || nowIso_(), j.updatedAt || nowIso_()));
  const props = PropertiesService.getScriptProperties();
  Object.keys(b.counters || {}).forEach((k) => props.setProperty("seq_" + k, String(b.counters[k])));
  return ok_({ message: "匯入完成", users: (tables.Users || []).length, journals: (b.journals || []).length });
}

// ---------------------------------------------------------------- 密碼（PBKDF2-SHA256，與原本格式相同）

const K256_ = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
const IV256_ = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];

// 對 W 的前 16 個字（一個 64 位元組區塊）做一次壓縮，結果寫回 H
function compress_(H, W) {
  for (let i = 16; i < 64; i++) {
    const a = W[i - 15], b = W[i - 2];
    const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
    const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
    W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
  }
  let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
  for (let i = 0; i < 64; i++) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K256_[i] + W[i]) | 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
    h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
  }
  H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
  H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
}

// 從狀態 H（之前已處理 prefixLen 位元組）繼續雜湊 bytes 並補齊結尾，回傳新的 8 個字
function sha256From_(H0, bytes, prefixLen) {
  const H = Int32Array.from(H0), W = new Int32Array(64);
  const total = prefixLen + bytes.length;
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const bits = total * 8;
  padded[padded.length - 4] = (bits >>> 24) & 255; padded[padded.length - 3] = (bits >>> 16) & 255;
  padded[padded.length - 2] = (bits >>> 8) & 255; padded[padded.length - 1] = bits & 255;
  padded[padded.length - 5] = Math.floor(bits / 0x100000000) & 255;
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) {
      const p = off + i * 4;
      W[i] = (padded[p] << 24) | (padded[p + 1] << 16) | (padded[p + 2] << 8) | padded[p + 3];
    }
    compress_(H, W);
  }
  return H;
}

function wordsToBytes_(H, len) {
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = (H[i >> 2] >>> (24 - (i % 4) * 8)) & 255;
  return out;
}

function sha256_(bytes) {
  return wordsToBytes_(sha256From_(IV256_, bytes, 0), 32);
}

function hmacStates_(keyBytes) {
  let key = keyBytes.length > 64 ? sha256_(keyBytes) : keyBytes;
  const k = new Uint8Array(64);
  k.set(key);
  const W = new Int32Array(64);
  const state = (pad) => {
    for (let i = 0; i < 16; i++) {
      W[i] = ((k[i * 4] ^ pad) << 24) | ((k[i * 4 + 1] ^ pad) << 16) | ((k[i * 4 + 2] ^ pad) << 8) | (k[i * 4 + 3] ^ pad);
    }
    const H = Int32Array.from(IV256_);
    compress_(H, W);
    return H;
  };
  return { inner: state(0x36), outer: state(0x5c) };
}

function hmacSha256_(keyBytes, msgBytes) {
  const st = hmacStates_(keyBytes);
  const inner = wordsToBytes_(sha256From_(st.inner, msgBytes, 64), 32);
  return wordsToBytes_(sha256From_(st.outer, inner, 64), 32);
}

function pbkdf2_(passwordBytes, salt, iterations, dkLen) {
  const st = hmacStates_(passwordBytes);
  const out = new Uint8Array(dkLen);
  const W = new Int32Array(64);
  for (let block = 1, done = 0; done < dkLen; block++) {
    const msg = new Uint8Array(salt.length + 4);
    msg.set(salt);
    msg[salt.length] = block >>> 24; msg[salt.length + 1] = (block >>> 16) & 255;
    msg[salt.length + 2] = (block >>> 8) & 255; msg[salt.length + 3] = block & 255;
    let U = sha256From_(st.outer, wordsToBytes_(sha256From_(st.inner, msg, 64), 32), 64);
    const T = Int32Array.from(U);
    // 之後每一輪的輸入固定 32 位元組：內外層各只要壓縮一個區塊
    for (let it = 1; it < iterations; it++) {
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < 8; i++) W[i] = U[i];
        W[8] = 0x80000000;
        for (let i = 9; i < 15; i++) W[i] = 0;
        W[15] = (64 + 32) * 8;
        const H = Int32Array.from(pass === 0 ? st.inner : st.outer);
        compress_(H, W);
        U = H;
      }
      for (let i = 0; i < 8; i++) T[i] ^= U[i];
    }
    const bytes = wordsToBytes_(T, 32);
    for (let i = 0; i < 32 && done < dkLen; i++) out[done++] = bytes[i];
  }
  return out;
}

function utf8_(s) {
  const bin = unescape(encodeURIComponent(s));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const B64_ = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function b64Encode_(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    s += B64_[n >> 18] + B64_[(n >> 12) & 63] + (i + 1 < bytes.length ? B64_[(n >> 6) & 63] : "=") + (i + 2 < bytes.length ? B64_[n & 63] : "=");
  }
  return s;
}

function b64Decode_(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/").replace(/[^A-Za-z0-9+/]/g, "");
  const out = [];
  for (let i = 0; i < s.length; i += 4) {
    const n = (B64_.indexOf(s[i]) << 18) | (B64_.indexOf(s[i + 1]) << 12) | ((B64_.indexOf(s[i + 2]) & 63) << 6) | (B64_.indexOf(s[i + 3]) & 63);
    out.push(n >> 16 & 255);
    if (i + 2 < s.length) out.push(n >> 8 & 255);
    if (i + 3 < s.length) out.push(n & 255);
  }
  return Uint8Array.from(out);
}

function b64Url_(bytes) {
  return b64Encode_(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBytes_(n) {
  const out = new Uint8Array(n);
  let hex = "";
  while (hex.length < n * 2) hex += Utilities.getUuid().replace(/-/g, "");
  for (let i = 0; i < n; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

function hashPassword_(password) {
  const salt = randomBytes_(16);
  const key = pbkdf2_(utf8_(password), salt, PBKDF2_ITERATIONS, 32);
  return PBKDF2_ITERATIONS + "." + b64Encode_(salt) + "." + b64Encode_(key);
}

function verifyPassword_(password, stored) {
  const parts = String(stored || "").split(".");
  if (parts.length !== 3) return false;
  const iterations = parseInt(parts[0], 10);
  if (!iterations) return false;
  const expected = b64Decode_(parts[2]);
  const actual = pbkdf2_(utf8_(password), b64Decode_(parts[1]), iterations, expected.length);
  let diff = expected.length ^ actual.length;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
  return diff === 0;
}

// ---------------------------------------------------------------- 登入權杖（HMAC-SHA256 簽章）

function tokenSecret_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty("tokenSecret");
  if (!s) {
    s = b64Encode_(randomBytes_(32));
    props.setProperty("tokenSecret", s);
  }
  return utf8_(s);
}

function createToken_(user) {
  const payload = b64Url_(utf8_(JSON.stringify({ u: user.id, v: user.tokenVersion, e: Date.now() + TOKEN_MINUTES * 60000 })));
  return payload + "." + b64Url_(hmacSha256_(tokenSecret_(), utf8_(payload)));
}

// 每次請求都重新對照帳號：改角色、重設密碼、取消核准後，舊的登入立刻失效（跟原本後端一樣）
function authenticate_(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2) fail_(401, "請先登入");
  if (b64Url_(hmacSha256_(tokenSecret_(), utf8_(parts[0]))) !== parts[1]) fail_(401, "登入已失效，請重新登入");
  let p;
  try { p = JSON.parse(decodeURIComponent(escape(String.fromCharCode.apply(null, b64Decode_(parts[0]))))); } catch (x) { fail_(401, "登入已失效，請重新登入"); }
  if (!p.e || Date.now() > p.e) fail_(401, "登入已過期，請重新登入");
  const user = userById_(p.u);
  if (!user) fail_(401, "帳號不存在");
  if (user.tokenVersion !== p.v || !user.isApproved) fail_(401, "登入已失效，請重新登入");
  return user;
}

// ---------------------------------------------------------------- 帳號與餐廳權限

function users_() { return dataOf_("Users"); }
function userById_(id) { const r = findRec_("Users", id); return r ? r.data : null; }
function userByName_(username) { return users_().find((u) => u.username === username) || null; }
function saveUser_(u) { put_("Users", u.id, u); }

function departmentsSorted_() {
  return dataOf_("Departments").slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

// 非管理員：回傳 { 餐廳名稱: 可否編輯 }；管理員或「全部餐廳＋可編輯」回傳 null（不必篩選）
function accessOf_(user) {
  if (user.role === "Admin") return null;
  if (user.allDepartments) {
    if (user.allDepartmentsCanEdit) return null;
    const all = {};
    departmentsSorted_().forEach((d) => { all[d.name] = false; });
    return all;
  }
  const nameById = {};
  departmentsSorted_().forEach((d) => { nameById[d.id] = d.name; });
  const access = {};
  (user.departments || []).forEach((ud) => { if (nameById[ud.departmentId] != null) access[nameById[ud.departmentId]] = ud.canEdit; });
  return access;
}

function canSee_(access, dept) { return access === null || Object.prototype.hasOwnProperty.call(access, dept); }
function canEdit_(access, dept) { return access === null || access[dept] === true; }

function resolveDepartments_(user) {
  const depts = departmentsSorted_();
  if (user.allDepartments) {
    return depts.map((d) => ({ departmentId: d.id, departmentName: d.name, canEdit: !!user.allDepartmentsCanEdit }));
  }
  const nameById = {};
  depts.forEach((d) => { nameById[d.id] = d.name; });
  return (user.departments || [])
    .map((ud) => ({ departmentId: ud.departmentId, departmentName: nameById[ud.departmentId] || "", canEdit: !!ud.canEdit }))
    .sort((a, b) => (a.departmentName < b.departmentName ? -1 : a.departmentName > b.departmentName ? 1 : 0));
}

function validDeptAccess_(list) {
  const valid = {};
  dataOf_("Departments").forEach((d) => { valid[d.id] = 1; });
  const seen = {};
  return (list || []).filter((a) => {
    const id = +a.departmentId;
    if (!valid[id] || seen[id]) return false;
    seen[id] = 1;
    return true;
  }).map((a) => ({ departmentId: +a.departmentId, canEdit: a.canEdit !== false }));
}

function deptNamesByIds_(ids) {
  const want = {};
  (ids || []).forEach((id) => { want[+id] = 1; });
  const names = departmentsSorted_().filter((d) => want[d.id]).map((d) => d.name);
  return names.length ? names.join("、") : null;
}

function deptNamesOfUser_(userId) {
  const u = userById_(userId);
  if (!u || !(u.departments || []).length) return null;
  return deptNamesByIds_(u.departments.map((d) => d.departmentId));
}

function blank_(s) { return s == null || String(s).trim() === ""; }

// ---------------------------------------------------------------- /auth

function login_(b) {
  if (blank_(b.username) || blank_(b.password)) fail_(400, "請輸入帳號密碼");
  const user = userByName_(b.username);
  if (!user || !verifyPassword_(b.password, user.passwordHash)) fail_(401, "帳號或密碼錯誤");
  if (!user.isApproved) fail_(403, "帳號尚待管理員審核，請等待核准後再登入");
  return ok_({ token: createToken_(user), username: user.username, displayName: user.displayName, role: user.role, departments: resolveDepartments_(user) });
}

function register_(b) {
  if (blank_(b.username) || blank_(b.password)) fail_(400, "請輸入帳號密碼");
  fail_(403, "已存在帳號，請改用已登入的管理員帳號新增使用者");
}

function signup_(b) {
  if (blank_(b.username) || blank_(b.password)) fail_(400, "請輸入帳號密碼");
  const hash = hashPassword_(b.password);
  lock_();
  if (userByName_(b.username)) fail_(409, "此帳號已存在");
  const id = nextId_("users");
  saveUser_({ id: id, username: b.username, passwordHash: hash, displayName: blank_(b.displayName) ? b.username : b.displayName,
    role: "User", isApproved: false, tokenVersion: 1, createdAt: nowIso_(), departments: [], allDepartments: false, allDepartmentsCanEdit: false });
  audit_(b.username, "Signup", "自行註冊帳號 " + b.username);
  return ok_({ message: "註冊成功，請等待管理員審核通過後再登入" });
}

function forgotPassword_(b) {
  if (blank_(b.username)) fail_(400, "請輸入帳號");
  lock_();
  const user = userByName_(b.username);
  if (user) {
    const pending = dataOf_("PasswordResets").some((r) => r.userId === user.id && r.status === "Pending");
    if (!pending) {
      const id = nextId_("passwordresetrequests");
      put_("PasswordResets", id, { id: id, userId: user.id, status: "Pending", createdAt: nowIso_(), resolvedAt: null });
    }
    audit_(b.username, "ForgotPassword", b.username + " 提出忘記密碼申請");
  }
  return ok_({ message: "已送出重設密碼申請，請等待管理員處理" });
}

// ---------------------------------------------------------------- /departments

function createDepartment_(c) {
  if (blank_(c.body.name)) fail_(400, "請輸入餐廳名稱");
  const name = String(c.body.name).trim();
  lock_();
  if (dataOf_("Departments").some((d) => d.name === name)) fail_(409, "此餐廳已存在");
  const id = nextId_("departments");
  put_("Departments", id, { id: id, name: name });
  audit_(c.user.username, "CreateDepartment", "新增餐廳 " + name, name);
  return ok_({ id: id, name: name });
}

function renameDepartment_(c, id) {
  if (blank_(c.body.name)) fail_(400, "請輸入餐廳名稱");
  const name = String(c.body.name).trim();
  lock_();
  const rec = findRec_("Departments", id);
  if (dataOf_("Departments").some((d) => d.name === name && d.id !== id)) fail_(409, "此餐廳已存在");
  if (!rec) fail_(404, "找不到這間餐廳");
  put_("Departments", id, { id: id, name: name });
  audit_(c.user.username, "RenameDepartment", "餐廳 #" + id + " 更名為 " + name, name);
  return ok_({ id: id, name: name });
}

function deleteDepartment_(c, id) {
  lock_();
  const rec = findRec_("Departments", id);
  if (!rec) fail_(404, "找不到這間餐廳");
  remove_("Departments", id);
  users_().forEach((u) => {
    const kept = (u.departments || []).filter((d) => d.departmentId !== id);
    if (kept.length !== (u.departments || []).length) { u.departments = kept; saveUser_(u); }
  });
  audit_(c.user.username, "DeleteDepartment", "刪除餐廳 " + rec.data.name, rec.data.name);
  return noContent_();
}

// ---------------------------------------------------------------- /journals
// 週誌內容（不含照片）存在 Journals；照片另外一張一列存在 Photos（鍵＝週誌Id:照片Id），
// 存檔時只寫入新增或改過的照片，不必每次都重寫所有照片。

function photoKey_(journalId, photoId) { return journalId + ":" + photoId; }

function eachPhoto_(journal, fn) {
  (journal.categories || []).forEach((cat) => (cat.items || []).forEach((it) => (it.photos || []).forEach((p) => fn(p))));
}

function inflate_(rec, photoData) {
  const j = rec.data;
  j.version = rec.meta.version || 0;
  eachPhoto_(j, (p) => {
    const d = photoData[photoKey_(j.id, p.id)];
    if (d != null) p.dataUrl = d;
  });
  return j;
}

// journalIds 不給＝全部照片；給了就只讀那幾份週誌的照片所在的列（同一份週誌的照片通常相鄰）
function photoMap_(journalIds) {
  const map = {};
  if (!journalIds) {
    readAll_("Photos").forEach((r) => { map[r.key] = r.data; });
    return map;
  }
  const want = {};
  journalIds.forEach((id) => { want[id] = 1; });
  const rows = readAll_("Photos", true).filter((r) => want[r.meta.j]);
  if (!rows.length) return map;
  const first = Math.min.apply(null, rows.map((r) => r.row)), last = Math.max.apply(null, rows.map((r) => r.row));
  const s = sheet_("Photos");
  const values = s.getRange(first, 1, last - first + 1, Math.max(2, s.getLastColumn())).getValues();
  rows.forEach((r) => { map[r.key] = parseChunks_(values[r.row - first]); });
  return map;
}

function getJournals_(c) {
  const access = accessOf_(c.user);
  const recs = readAll_("Journals").filter((r) => canSee_(access, r.meta.department));
  const photos = photoMap_(null);
  return ok_(recs.map((r) => inflate_(r, photos))
    .sort((a, b) => (a.periodStart < b.periodStart ? 1 : a.periodStart > b.periodStart ? -1 : 0)));
}

function getJournalVersions_(c) {
  const access = accessOf_(c.user);
  return ok_(readAll_("Journals", true).filter((r) => canSee_(access, r.meta.department))
    .map((r) => ({ id: r.key, department: r.meta.department, version: r.meta.version || 0 })));
}

function normalizeGuid_(id) {
  const m = /^\{?([0-9a-fA-F]{8})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{4})-?([0-9a-fA-F]{12})\}?$/.exec(String(id));
  return m ? (m[1] + "-" + m[2] + "-" + m[3] + "-" + m[4] + "-" + m[5]).toLowerCase() : null;
}

function getJournal_(c, rawId) {
  const id = normalizeGuid_(rawId);
  if (!id) fail_(400, "無效的週誌 Id");
  const rec = findRec_("Journals", id);
  if (!rec) fail_(404, "找不到這份週誌");
  if (!canSee_(accessOf_(c.user), rec.meta.department)) fail_(403, "您沒有這個餐廳的權限");
  return ok_(inflate_(rec, photoMap_([id])));
}

function validDate_(s) { return /^\d{4}-\d{2}-\d{2}/.test(String(s || "")) && !isNaN(Date.parse(String(s).slice(0, 10))); }

function writeJournal_(j, version, createdAt, updatedAt) {
  const id = j.id;
  const existingPhotos = {};
  readAll_("Photos", true).forEach((r) => { if (r.meta.j === id) existingPhotos[r.key] = r.meta.h; });
  const keep = {};
  const stored = JSON.parse(JSON.stringify(j));
  delete stored.baseVersion;
  delete stored.version;
  stored.createdAt = createdAt;
  stored.updatedAt = updatedAt;
  eachPhoto_(stored, (p) => {
    const key = photoKey_(id, p.id);
    keep[key] = 1;
    if (typeof p.dataUrl === "string" && p.dataUrl) {
      const h = b64Url_(sha256_(utf8_(p.dataUrl))).slice(0, 22);
      if (existingPhotos[key] !== h) put_("Photos", key, p.dataUrl, { j: id, h: h });
    }
    delete p.dataUrl;
  });
  put_("Journals", id, stored, { department: stored.department, version: version });
  removeMany_("Photos", Object.keys(existingPhotos).filter((k) => !keep[k]));
}

function upsertJournal_(c, rawId) {
  const id = normalizeGuid_(rawId);
  if (!id) fail_(400, "無效的週誌 Id");
  const dto = c.body || {};
  if (!validDate_(dto.periodStart) || !validDate_(dto.periodEnd)) fail_(400, "期間日期格式錯誤");
  const department = dto.department || "";

  lock_();
  const access = accessOf_(c.user);
  if (access !== null && !canEdit_(access, department)) fail_(403, "您沒有這個餐廳的編輯權限");
  const rec = findRec_("Journals", id);
  if (rec && access !== null && !canEdit_(access, rec.meta.department)) fail_(403, "您沒有這個餐廳的編輯權限");

  const current = rec ? (rec.meta.version || 0) : null;
  // 有帶 baseVersion：雲端上已經是別的版本（被其他裝置改過）就回 409＋最新資料，讓前端合併後再存
  if (dto.baseVersion != null && rec && current !== Number(dto.baseVersion)) {
    return { s: 409, b: { message: "這份週誌剛被其他裝置修改過", current: inflate_(rec, photoMap_([id])) } };
  }
  const now = nowIso_();
  const journal = { id: id, department: department, periodStart: dto.periodStart, periodEnd: dto.periodEnd, categories: dto.categories || [] };
  writeJournal_(journal, (current || 0) + 1, rec ? rec.data.createdAt : now, now);
  return ok_(inflate_(findRec_("Journals", id), photoMap_([id])));
}

function deleteJournal_(c, rawId) {
  const id = normalizeGuid_(rawId);
  if (!id) fail_(400, "無效的週誌 Id");
  lock_();
  const rec = findRec_("Journals", id);
  const access = accessOf_(c.user);
  if (rec && access !== null && !canEdit_(access, rec.meta.department)) fail_(403, "您沒有這個餐廳的編輯權限");
  if (rec) {
    remove_("Journals", id);
    removeMany_("Photos", readAll_("Photos", true).filter((r) => r.meta.j === id).map((r) => r.key));
  }
  return noContent_();
}

// ---------------------------------------------------------------- /settings

function getSettings_() {
  const r = findRec_("Settings", "1");
  return r ? { companyName: r.data.companyName || "", defaultDepartment: r.data.defaultDepartment || "" } : { companyName: "", defaultDepartment: "" };
}

function saveSettings_(c) {
  const s = { companyName: c.body.companyName || "", defaultDepartment: c.body.defaultDepartment || "" };
  lock_();
  put_("Settings", "1", s);
  return ok_(s);
}

// ---------------------------------------------------------------- /users

function getUsers_() {
  return ok_(users_().slice().sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id - b.id)).map((u) => ({
    id: u.id, username: u.username, displayName: u.displayName, role: u.role, isApproved: !!u.isApproved, createdAt: u.createdAt,
    departments: resolveDepartments_(u), allDepartments: !!u.allDepartments, allDepartmentsCanEdit: !!u.allDepartmentsCanEdit,
  })));
}

function setUserDepartments_(c, id) {
  lock_();
  const u = userById_(id);
  if (!u) fail_(404, "找不到這個帳號");
  u.departments = validDeptAccess_(c.body.departments);
  u.allDepartments = !!c.body.allDepartments;
  u.allDepartmentsCanEdit = !!c.body.allDepartmentsCanEdit;
  saveUser_(u);
  audit_(c.user.username, "SetUserDepartments", "更新帳號 #" + id + " 的餐廳權限",
    u.allDepartments ? "全部餐廳" : deptNamesByIds_((c.body.departments || []).map((a) => a.departmentId)));
  return ok_({ message: "餐廳權限已更新" });
}

function approveUser_(c, id) {
  lock_();
  const u = userById_(id);
  if (!u) fail_(404, "找不到這個帳號");
  u.isApproved = true;
  saveUser_(u);
  audit_(c.user.username, "ApproveUser", "核准帳號 " + u.username, deptNamesOfUser_(id));
  return ok_({ message: "已核准" });
}

function createUser_(c) {
  const b = c.body;
  if (blank_(b.username) || blank_(b.password)) fail_(400, "請輸入帳號密碼");
  const role = b.role === "Admin" ? "Admin" : "User";
  const hash = hashPassword_(b.password);
  lock_();
  if (userByName_(b.username)) fail_(409, "此帳號已存在");
  const id = nextId_("users");
  saveUser_({ id: id, username: b.username, passwordHash: hash, displayName: blank_(b.displayName) ? b.username : b.displayName,
    role: role, isApproved: true, tokenVersion: 1, createdAt: nowIso_(), departments: validDeptAccess_(b.departments),
    allDepartments: !!b.allDepartments, allDepartmentsCanEdit: !!b.allDepartmentsCanEdit });
  audit_(c.user.username, "CreateUser", "建立帳號 " + b.username + "（角色：" + role + "）",
    b.allDepartments ? "全部餐廳" : deptNamesByIds_((b.departments || []).map((a) => a.departmentId)));
  return ok_({ message: "帳號已建立", id: id });
}

function resetUserPassword_(c, id) {
  if (blank_(c.body.password)) fail_(400, "請輸入新密碼");
  const hash = hashPassword_(c.body.password);
  lock_();
  const u = userById_(id);
  if (!u) fail_(404, "找不到這個帳號");
  u.passwordHash = hash;
  u.tokenVersion = (u.tokenVersion || 0) + 1;
  saveUser_(u);
  audit_(c.user.username, "ResetPassword", "重設 " + u.username + " 的密碼", deptNamesOfUser_(id));
  return ok_({ message: "密碼已更新" });
}

function changeRole_(c, id) {
  const role = c.body.role;
  if (role !== "Admin" && role !== "User") fail_(400, "角色必須是 Admin 或 User");
  lock_();
  const u = userById_(id);
  if (!u) fail_(404, "找不到這個帳號");
  if (u.role === "Admin" && role === "User" && users_().filter((x) => x.role === "Admin").length <= 1) fail_(400, "至少需保留一組管理員帳號");
  const before = u.role;
  u.role = role;
  u.tokenVersion = (u.tokenVersion || 0) + 1;
  saveUser_(u);
  audit_(c.user.username, "ChangeRole", "將 " + u.username + " 的角色從 " + before + " 改為 " + role, deptNamesOfUser_(id));
  return ok_({ message: "角色已更新" });
}

function renameUser_(c, id) {
  const name = String(c.body.displayName || "").trim();
  if (!name) fail_(400, "請輸入名稱");
  if (name.length > 50) fail_(400, "名稱最多 50 個字");
  lock_();
  const u = userById_(id);
  if (!u) fail_(404, "找不到這個帳號");
  const before = u.displayName;
  u.displayName = name;
  saveUser_(u);
  audit_(c.user.username, "RenameUser", "將帳號 " + u.username + " 的名稱從「" + before + "」改為「" + name + "」", deptNamesOfUser_(id));
  return ok_({ message: "名稱已更新", displayName: name });
}

function deleteUser_(c, id) {
  if (id === c.user.id) fail_(400, "無法刪除目前登入中的帳號");
  lock_();
  const u = userById_(id);
  if (!u) fail_(404, "找不到這個帳號");
  if (u.role === "Admin" && users_().filter((x) => x.role === "Admin").length <= 1) fail_(400, "至少需保留一組管理員帳號");
  const deptNames = deptNamesOfUser_(id);
  removeMany_("PasswordResets", dataOf_("PasswordResets").filter((r) => r.userId === id).map((r) => r.id));
  remove_("Users", id);
  audit_(c.user.username, "DeleteUser", "刪除帳號 " + u.username, deptNames);
  return noContent_();
}

// ---------------------------------------------------------------- /password-reset-requests

function getResetRequests_() {
  const byId = {};
  users_().forEach((u) => { byId[u.id] = u; });
  return ok_(dataOf_("PasswordResets").filter((r) => r.status === "Pending")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((r) => ({ id: r.id, userId: r.userId, username: (byId[r.userId] || {}).username || "", displayName: (byId[r.userId] || {}).displayName || "", createdAt: r.createdAt })));
}

function approveReset_(c, id) {
  if (blank_(c.body.password)) fail_(400, "請輸入新密碼");
  const hash = hashPassword_(c.body.password);
  lock_();
  const rec = findRec_("PasswordResets", id);
  if (!rec || rec.data.status !== "Pending") fail_(404, "找不到這筆申請");
  const u = userById_(rec.data.userId);
  if (u) {
    u.passwordHash = hash;
    u.tokenVersion = (u.tokenVersion || 0) + 1;
    saveUser_(u);
  }
  rec.data.status = "Approved";
  rec.data.resolvedAt = nowIso_();
  put_("PasswordResets", id, rec.data);
  audit_(c.user.username, "ApprovePasswordReset", "核准 " + (u ? u.username : "") + " 的忘記密碼申請並設定新密碼");
  return ok_({ message: "已核准並更新密碼" });
}

function rejectReset_(c, id) {
  lock_();
  const rec = findRec_("PasswordResets", id);
  if (!rec || rec.data.status !== "Pending") fail_(404, "找不到這筆申請");
  rec.data.status = "Rejected";
  rec.data.resolvedAt = nowIso_();
  put_("PasswordResets", id, rec.data);
  audit_(c.user.username, "RejectPasswordReset", "駁回忘記密碼申請 #" + id);
  return noContent_();
}

// ---------------------------------------------------------------- /presence（誰在線上）
// 放在 Apps Script 快取裡（不寫進試算表），每人一個鍵，另外記一份帳號清單。

function presenceIndex_(cache) {
  try { return JSON.parse(cache.get("presence_index") || "[]"); } catch (x) { return []; }
}

function heartbeat_(c) {
  const cache = CacheService.getScriptCache();
  cache.put("presence:" + c.user.username, JSON.stringify({
    displayName: c.user.displayName || c.user.username, role: c.user.role, department: (c.body && c.body.department) || "", lastSeenAt: nowIso_(),
  }), 300);
  const index = presenceIndex_(cache);
  if (index.indexOf(c.user.username) < 0) {
    index.push(c.user.username);
    cache.put("presence_index", JSON.stringify(index), 21600);
  }
  // 管理員順便拿到在線名單，不必另外再查一次
  return c.user.role === "Admin" ? ok_(onlineUsers_(c)) : noContent_();
}

function signOff_(c) {
  CacheService.getScriptCache().remove("presence:" + c.user.username);
  return noContent_();
}

function onlineUsers_(c) {
  const cache = CacheService.getScriptCache();
  const index = presenceIndex_(cache);
  const got = index.length ? cache.getAll(index.map((u) => "presence:" + u)) : {};
  const cutoff = Date.now() - PRESENCE_WINDOW_MS;
  return index.map((u) => {
    const raw = got["presence:" + u];
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (Date.parse(p.lastSeenAt) < cutoff) return null;
    return { username: u, displayName: p.displayName, role: p.role, department: p.department, lastSeenAt: p.lastSeenAt, isSelf: u === c.user.username };
  }).filter((x) => x).sort((a, b) => (a.displayName < b.displayName ? -1 : a.displayName > b.displayName ? 1 : 0));
}

// ---------------------------------------------------------------- /audit-logs

function audit_(actor, action, target, department) {
  writeAuditRows_([{ id: nextId_("auditlogs"), actorUsername: actor || null, action: action, targetDescription: target || null,
    department: department || null, createdAt: nowIso_() }]);
}

function writeAuditRows_(rows) {
  rows.forEach((r) => put_("AuditLogs", r.id, r));
  const s = sheet_("AuditLogs"), n = s.getLastRow();
  if (n > AUDIT_KEEP + 100) {
    s.deleteRows(1, n - AUDIT_KEEP);
    invalidate_("AuditLogs");
  }
}

function getAuditLogs_() {
  return ok_(dataOf_("AuditLogs").slice().sort((a, b) => b.id - a.id).slice(0, 100));
}

// ---------------------------------------------------------------- /light-timers、/maintenance-schedules（每間餐廳一份）

function getDeptTable_(c, table, field, department) {
  if (!canSee_(accessOf_(c.user), department)) fail_(403, "您沒有這個餐廳的權限");
  const rec = findRec_(table, department);
  const out = { department: department };
  out[field] = rec ? rec.data[field] || [] : [];
  return ok_(out);
}

function saveDeptTable_(c, table, field, department) {
  if (!canEdit_(accessOf_(c.user), department)) fail_(403, "您沒有這個餐廳的編輯權限");
  const list = (c.body && c.body[field]) || [];
  list.forEach((x) => { if (blank_(x.id)) x.id = Utilities.getUuid(); });
  const doc = { department: department };
  doc[field] = list;
  lock_();
  put_(table, department, doc);
  return ok_(doc);
}
