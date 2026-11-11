/* 工作週誌：沒網路也能編輯週誌。
 * 每次同步或存檔後，把週誌（含「上次同步時的樣子」）存在這台裝置的 IndexedDB。
 * 沒網路時存檔先記成「待上傳」，恢復網路後依序上傳，伺服器上已被別人改過時沿用一般的三方合併。
 * 沒網路時打開 App，直接用上次存在裝置上的資料。定時器、保養排程等其他資料仍需要網路才能修改。 */

const OfflineDB = {
  _db: null,
  open() {
    if (!this._db) {
      this._db = new Promise((resolve, reject) => {
        const req = indexedDB.open("wj-offline", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("kv");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this._db;
  },
  async run(mode, fn) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("kv", mode);
      const req = fn(tx.objectStore("kv"));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },
  get(key) { return this.run("readonly", (s) => s.get(key)); },
  set(key, value) { return this.run("readwrite", (s) => s.put(value, key)); },
  del(key) { return this.run("readwrite", (s) => s.delete(key)); },
};

const offline = { pending: new Set(), active: false };

function isOfflineError(err) {
  return !!(err && err.offline);
}

function offlineKey() {
  const u = Auth.getUser();
  return u ? "state:" + u.username : null;
}

let offlinePersistTimer = null;
function persistOffline() {
  clearTimeout(offlinePersistTimer);
  offlinePersistTimer = setTimeout(writeOfflineSnapshot, 400);
}

async function writeOfflineSnapshot() {
  const key = offlineKey();
  if (!key || !state.settings) return;
  try {
    await OfflineDB.set(key, {
      savedAt: Date.now(),
      settings: state.settings,
      journals: state.journals,
      bases: [...journalBases.values()],
      pending: [...offline.pending],
      lightTimer: state.lightTimer,
      maintenanceSchedule: state.maintenanceSchedule,
    });
  } catch (e) {
    // 私密瀏覽等情況不能用 IndexedDB：只是少了離線功能
  }
}

async function readOfflineSnapshot() {
  const key = offlineKey();
  if (!key) return null;
  try {
    return (await OfflineDB.get(key)) || null;
  } catch (e) {
    return null;
  }
}

async function clearOfflineSnapshot() {
  const key = offlineKey();
  offline.pending.clear();
  setOfflineActive(false);
  if (!key) return;
  try { await OfflineDB.del(key); } catch (e) {}
}

function setOfflineActive(on) {
  offline.active = on;
  renderOfflineBanner();
}

function renderOfflineBanner() {
  const el = document.getElementById("offline-banner");
  if (!el) return;
  const n = offline.pending.size;
  el.classList.toggle("hidden", !offline.active && !n);
  el.classList.toggle("offline-banner-uploading", !offline.active && n > 0);
  el.textContent = offline.active
    ? (n ? `目前沒有網路：${n} 份週誌的修改先存在這台裝置，恢復網路後會自動上傳` : "目前沒有網路：顯示的是上次同步的資料，修改會先存在這台裝置")
    : `正在上傳 ${n} 份週誌的修改…`;
}

// saveJournalNow 遇到沒網路時呼叫：記成待上傳，畫面照常繼續。
function markPendingSave(id) {
  offline.pending.add(id);
  setOfflineActive(true);
  persistOffline();
}

// 存檔成功：這份不用再等了。
function markSaved(id) {
  const had = offline.pending.delete(id);
  if (offline.active || had) setOfflineActive(false);
  persistOffline();
}

let offlineFlushing = null;

// 依序上傳待上傳的週誌；還是沒網路就停下來，下次再試。回傳 true = 全部上傳完了。
function flushPendingSaves() {
  if (offlineFlushing) return offlineFlushing;
  if (!offline.pending.size) return Promise.resolve(true);
  offlineFlushing = (async () => {
    renderOfflineBanner();
    for (const id of [...offline.pending]) {
      const j = state.journals.find((x) => x.id === id);
      if (!j) {
        offline.pending.delete(id);
        continue;
      }
      try {
        if ((await saveJournal(j)) === "queued") return false;
      } catch (err) {
        // 不是網路問題（例如權限被取消）：不再重試，告訴使用者
        offline.pending.delete(id);
        alert(`週誌（${toROC(j.periodStart)} 那週）上傳失敗：${err.message}`);
      }
    }
    persistOffline();
    renderOfflineBanner();
    return true;
  })().finally(() => { offlineFlushing = null; });
  return offlineFlushing;
}

// 打開 App 時：伺服器的資料已經放進 state，把上次沒上傳完的修改疊回去再上傳。
function restorePendingFromSnapshot(snap) {
  if (!snap || !(snap.pending || []).length) return false;
  const bases = new Map((snap.bases || []).map((b) => [b.id, b]));
  snap.pending.forEach((id) => {
    const local = (snap.journals || []).find((j) => j.id === id);
    if (!local) return;
    const i = state.journals.findIndex((j) => j.id === id);
    if (i >= 0) state.journals[i] = local;
    else state.journals.push(local);
    if (bases.has(id)) journalBases.set(id, bases.get(id));
    else journalBases.delete(id);
    offline.pending.add(id);
  });
  state.journals.sort((a, b) => b.periodStart.localeCompare(a.periodStart));
  return offline.pending.size > 0;
}

// 沒網路打開 App：整份改用裝置上的資料。
function loadFromSnapshot(snap) {
  state.journals = snap.journals || [];
  journalBases.clear();
  (snap.bases || []).forEach((b) => journalBases.set(b.id, b));
  offline.pending = new Set(snap.pending || []);
  setOfflineActive(true);
}

window.addEventListener("online", () => {
  if (Auth.isLoggedIn()) flushPendingSaves().then((done) => { if (done) syncFromServer(); });
});
window.addEventListener("offline", () => {
  if (Auth.isLoggedIn()) setOfflineActive(true);
});
