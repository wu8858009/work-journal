/* 工作週誌：常用範本、設備維修履歷與 QR Code、項目修改歷程、語音輸入、週五提醒、資料備份。
 * 跟 app.js 共用全域函式（state、render、openItemModal…），在 app.js 之後載入。 */

// ---------------- 每間餐廳一份的清單：常用範本、設備 ----------------

const deptLists = { templates: new Map(), equipment: new Map() };
const DEPT_LIST_API = {
  templates: {
    get: (d) => Store.getItemTemplates(d).then((r) => r.templates || []),
    save: (d, list) => Store.saveItemTemplates(d, list).then((r) => r.templates || []),
  },
  equipment: {
    get: (d) => Store.getEquipment(d).then((r) => r.equipment || []),
    save: (d, list) => Store.saveEquipment(d, list).then((r) => r.equipment || []),
  },
};

function cachedDeptList(kind, dept) {
  return deptLists[kind].get(dept) || null;
}

async function loadDeptList(kind, dept, force) {
  if (!dept) return [];
  if (!force && deptLists[kind].has(dept)) return deptLists[kind].get(dept);
  const list = await DEPT_LIST_API[kind].get(dept);
  deptLists[kind].set(dept, list);
  return list;
}

// 先抓最新的清單再改：別台裝置剛加的項目才不會被蓋掉。
async function updateDeptList(kind, dept, change) {
  const fresh = (await loadDeptList(kind, dept, true)).map((x) => ({ ...x }));
  const saved = await DEPT_LIST_API[kind].save(dept, change(fresh));
  deptLists[kind].set(dept, saved);
  return saved;
}

function equipmentName(dept, id) {
  const eq = (cachedDeptList("equipment", dept) || []).find((e) => e.id === id);
  return eq ? eq.name : "";
}

// ---------------- 項目視窗：範本、設備、修改紀錄 ----------------

let itemModalContext = null; // { dept, isNew, editable, historyKey }

function setupItemModalExtras(j, it, isNew, editable) {
  const dept = j.department;
  itemModalContext = { dept, isNew, editable, historyKey: it.originId || it.id };

  const templateRow = document.getElementById("item-template-row");
  templateRow.classList.toggle("hidden", !editable);
  document.getElementById("item-field-template").value = "";

  const eqSelect = document.getElementById("item-field-equipment");
  eqSelect.disabled = !editable;
  eqSelect.dataset.value = it.equipmentId || "";
  fillEquipmentSelect(dept, it.equipmentId || "");

  const history = document.getElementById("item-history");
  history.classList.toggle("hidden", isNew);
  document.getElementById("item-history-list").innerHTML = "";
  document.getElementById("item-history-list").classList.add("hidden");
  document.getElementById("item-history-btn").textContent = "查看修改紀錄";

  document.querySelectorAll("#modal-item [data-voice-for]").forEach((b) => b.classList.toggle("hidden", !SpeechRec || !editable));

  if (editable) loadDeptList("templates", dept).then(() => fillTemplateSelect(dept)).catch(() => {});
  loadDeptList("equipment", dept).then(() => fillEquipmentSelect(dept, eqSelect.dataset.value)).catch(() => {});
  fillTemplateSelect(dept);
}

function fillTemplateSelect(dept) {
  const select = document.getElementById("item-field-template");
  const list = cachedDeptList("templates", dept) || [];
  select.innerHTML = `<option value="">${list.length ? "從常用範本帶入…" : "還沒有範本（填好後按「存成範本」）"}</option>` +
    list.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.item)}${t.assignee ? `（${escapeHtml(t.assignee)}）` : ""}</option>`).join("");
}

function fillEquipmentSelect(dept, value) {
  const select = document.getElementById("item-field-equipment");
  const list = cachedDeptList("equipment", dept) || [];
  const known = !value || list.some((e) => e.id === value);
  select.innerHTML = `<option value="">不指定</option>` +
    list.map((e) => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.name)}${e.location ? ` · ${escapeHtml(e.location)}` : ""}</option>`).join("") +
    (known ? "" : `<option value="${escapeHtml(value)}">（已刪除的設備）</option>`) +
    (select.disabled ? "" : `<option value="__new__">＋ 新增設備…</option>`);
  select.value = value || "";
  select.dataset.value = value || "";
  document.getElementById("item-equipment-link").classList.toggle("hidden", !value || !known);
}

function itemModalEquipmentId() {
  const v = document.getElementById("item-field-equipment").value;
  return v === "__new__" ? "" : v;
}

function applyTemplate(id) {
  const ctx = itemModalContext;
  const t = (cachedDeptList("templates", ctx.dept) || []).find((x) => x.id === id);
  if (!t) return;
  const set = (fieldId, v) => { if (v) document.getElementById(fieldId).value = v; };
  set("item-field-name", t.item);
  set("item-field-assignee", t.assignee);
  set("item-field-progress", t.progress);
  autoGrowTextarea(document.getElementById("item-field-progress"));
  if (t.equipmentId) fillEquipmentSelect(ctx.dept, t.equipmentId);
}

async function saveCurrentAsTemplate() {
  const ctx = itemModalContext;
  const tpl = {
    item: document.getElementById("item-field-name").value.trim(),
    assignee: document.getElementById("item-field-assignee").value.trim(),
    progress: document.getElementById("item-field-progress").value.trim(),
    equipmentId: itemModalEquipmentId(),
  };
  if (!tpl.item) {
    alert("請先輸入工作項目名稱，再存成範本");
    return;
  }
  const btn = document.getElementById("item-save-template-btn");
  btn.disabled = true;
  try {
    await updateDeptList("templates", ctx.dept, (list) => {
      const same = list.find((x) => x.item === tpl.item);
      if (same) Object.assign(same, tpl);
      else list.push({ id: uid(), ...tpl });
      return list;
    });
    fillTemplateSelect(ctx.dept);
    alert(`已存成範本「${tpl.item}」，之後新增項目時可以直接帶入。`);
  } catch (err) {
    alert("存成範本失敗：" + err.message);
  } finally {
    btn.disabled = false;
  }
}

async function promptNewEquipment(dept) {
  const name = (prompt("設備名稱（例如：1號冷氣、洗區熱水器）") || "").trim();
  if (!name) return null;
  const location = (prompt("位置（選填，例如：大廳、廚房）") || "").trim();
  const id = uid();
  await updateDeptList("equipment", dept, (list) => list.concat([{ id, name, location, createdAt: new Date().toISOString() }]));
  return id;
}

async function onEquipmentSelectChange(select) {
  const ctx = itemModalContext;
  if (select.value !== "__new__") {
    select.dataset.value = select.value;
    document.getElementById("item-equipment-link").classList.toggle("hidden", !select.value);
    return;
  }
  try {
    const id = await promptNewEquipment(ctx.dept);
    fillEquipmentSelect(ctx.dept, id || select.dataset.value || "");
  } catch (err) {
    alert("新增設備失敗：" + err.message);
    fillEquipmentSelect(ctx.dept, select.dataset.value || "");
  }
}

const HISTORY_LABELS = {
  item: "工作項目", assignee: "負責人", progress: "進度說明", expectedDate: "預計完成",
  percent: "完成度", isPriority: "優先處理", equipmentId: "設備", category: "類別", photos: "照片",
};

function historyValue(field, v, dept) {
  if (v === "" || v == null) return "（空白）";
  if (field === "percent") return `${v}%`;
  if (field === "expectedDate") return toROC(String(v));
  if (field === "isPriority") return v === true || v === "true" ? "是" : "否";
  if (field === "equipmentId") return equipmentName(dept, v) || "（已刪除的設備）";
  if (field === "photos") return `${v} 張`;
  const s = String(v);
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

function historyChangeText(change, dept) {
  const [field, from, to] = change;
  if (field === "created") return `新增到「${to}」`;
  if (field === "deleted") return `從「${from}」刪除`;
  return `${HISTORY_LABELS[field] || field}：${escapeHtml(historyValue(field, from, dept))} → ${escapeHtml(historyValue(field, to, dept))}`;
}

async function toggleItemHistory() {
  const ctx = itemModalContext;
  const list = document.getElementById("item-history-list");
  const btn = document.getElementById("item-history-btn");
  if (!list.classList.contains("hidden")) {
    list.classList.add("hidden");
    btn.textContent = "查看修改紀錄";
    return;
  }
  list.classList.remove("hidden");
  btn.textContent = "收起修改紀錄";
  list.innerHTML = `<p class="cat-empty">載入中…</p>`;
  try {
    const { entries } = await Store.getItemHistory(ctx.historyKey);
    if (itemModalContext !== ctx) return;
    list.innerHTML = entries.length ? entries.map((e) => `
      <div class="history-entry">
        <div class="history-entry-meta"><span>${formatDateTime(e.at)}</span><span>${escapeHtml(e.by || "")}</span><span>${toROC(e.period)} 那週</span></div>
        ${(e.changes || []).map((c) => `<div class="history-entry-change">${historyChangeText(c, ctx.dept)}</div>`).join("")}
      </div>`).join("") : `<p class="cat-empty">還沒有修改紀錄（這個功能上線之後的修改才會記錄）</p>`;
  } catch (err) {
    list.innerHTML = `<p class="cat-empty">讀取失敗：${escapeHtml(err.message)}</p>`;
  }
}

// ---------------- 語音輸入 ----------------

const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let activeSpeech = null;

function toggleVoiceInput(btn) {
  if (activeSpeech) {
    const wasSame = activeSpeech.btn === btn;
    activeSpeech.rec.stop();
    if (wasSame) return;
  }
  const field = document.getElementById(btn.dataset.voiceFor);
  const rec = new SpeechRec();
  rec.lang = "zh-TW";
  rec.interimResults = false;
  rec.continuous = false;
  const session = { rec, btn };
  activeSpeech = session;
  btn.classList.add("mic-listening");
  rec.onresult = (e) => {
    const text = Array.from(e.results).map((r) => r[0].transcript).join("");
    if (!text) return;
    field.value = field.value ? `${field.value}${field.tagName === "TEXTAREA" ? "\n" : ""}${text}` : text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  };
  rec.onerror = (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") alert("沒有麥克風權限，請到系統設定允許這個 App 使用麥克風。");
  };
  rec.onend = () => {
    btn.classList.remove("mic-listening");
    if (activeSpeech === session) activeSpeech = null;
  };
  try {
    rec.start();
  } catch (err) {
    rec.onend();
  }
}

// ---------------- 設備清單與維修履歷 ----------------

const QR_LIB = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";

// QR Code 一律指向公開網址；桌面版 exe 是在本機開的，網址別人的手機打不開。
function appPublicUrl() {
  if (location.protocol === "https:") return location.origin + location.pathname.replace(/index\.html$/, "");
  return "https://wu8858009.github.io/work-journal/";
}

function equipmentQrUrl(dept, id) {
  return `${appPublicUrl()}?equip=${encodeURIComponent(id)}&dept=${encodeURIComponent(dept)}`;
}

// 同一個維修項目每週都會被複製到新的一週，履歷只列每個項目最新的那一筆。
function equipmentRecords(dept, equipmentId) {
  const latest = new Map();
  state.journals.filter((j) => j.department === dept).forEach((j) => {
    j.categories.forEach((cat) => cat.items.forEach((it) => {
      if (it.equipmentId !== equipmentId) return;
      const key = it.originId || it.id;
      const cur = latest.get(key);
      if (!cur || j.periodStart > cur.j.periodStart) latest.set(key, { j, cat, it });
    }));
  });
  return [...latest.values()].sort((a, b) => (a.j.periodStart < b.j.periodStart ? 1 : -1));
}

function renderEquipment() {
  const dept = Auth.getCurrentDepartment();
  if (!dept) return `<div class="empty-state"><p>請先在「設定」選擇目前餐廳</p></div>`;
  const list = cachedDeptList("equipment", dept);
  if (!list) {
    loadDeptList("equipment", dept).then(() => { if (state.view === "equipment") render(); })
      .catch((err) => { if (state.view === "equipment") document.getElementById("view-root").innerHTML = `<div class="empty-state"><p>讀取設備清單失敗：${escapeHtml(err.message)}</p></div>`; });
    return `<div class="empty-state"><p>載入中…</p></div>`;
  }
  const editable = Auth.canEditDepartment(dept);
  const detail = state.equipmentDetailId && list.find((e) => e.id === state.equipmentDetailId);
  if (state.equipmentDetailId && !detail) {
    return `<div class="card settings-card">
      <button class="btn btn-ghost" data-action="equipment-list">← 設備清單</button>
      <p class="cat-empty">找不到這台設備，可能已經被刪除，或屬於其他餐廳。</p></div>`;
  }
  if (detail) return renderEquipmentDetail(dept, detail, editable);

  return `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.gear}設備清單</span>
        <p class="settings-section-subtitle">${escapeHtml(dept)}・每台設備的維修履歷和 QR Code</p>
      </div>
      ${editable ? `<button class="icon-btn" data-action="equipment-add" title="新增設備">${ICONS.plus}</button>` : ""}
    </div>
    ${list.length ? list.map((e) => {
      const count = equipmentRecords(dept, e.id).length;
      return `
      <div class="user-row equipment-row" data-action="equipment-open" data-id="${escapeHtml(e.id)}">
        <div class="user-row-main">
          <div class="user-row-name">${escapeHtml(e.name)}</div>
          <div class="user-row-username">${e.location ? escapeHtml(e.location) + "・" : ""}${count ? `${count} 筆維修紀錄` : "尚無維修紀錄"}</div>
        </div>
        <div class="user-row-actions">${ICONS.chevron}</div>
      </div>`;
    }).join("") : `<p class="cat-empty">還沒有設備。${editable ? "按右上角「＋」新增，或在編輯項目時選「新增設備」。" : ""}</p>`}
  </div>
  <button class="btn btn-ghost" data-action="equipment-close">← 返回設定</button>`;
}

function renderEquipmentDetail(dept, e, editable) {
  const records = equipmentRecords(dept, e.id);
  const current = getCurrentJournal();
  const canAdd = editable && current && current.department === dept;
  return `
  <div class="card settings-card">
    <button class="btn btn-ghost equipment-back" data-action="equipment-list">← 設備清單</button>
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.gear}${escapeHtml(e.name)}</span>
        <p class="settings-section-subtitle">${e.location ? escapeHtml(e.location) + "・" : ""}${escapeHtml(dept)}</p>
      </div>
      <div class="user-row-actions">
        <button class="icon-btn" data-action="equipment-qr" data-id="${escapeHtml(e.id)}" title="QR Code">${ICONS.qr}</button>
        ${editable ? `<button class="icon-btn" data-action="equipment-edit" data-id="${escapeHtml(e.id)}" title="修改名稱、位置">${ICONS.edit}</button>
        <button class="icon-btn icon-btn-danger" data-action="equipment-delete" data-id="${escapeHtml(e.id)}" title="刪除設備">${ICONS.trash}</button>` : ""}
      </div>
    </div>
    ${canAdd ? `<button class="btn btn-primary equipment-add-item" data-action="equipment-add-item" data-id="${escapeHtml(e.id)}">${ICONS.plus}<span>新增這台設備的維修項目</span></button>` : ""}
  </div>
  <div class="card settings-card">
    <div class="settings-section-heading"><span class="settings-section-title">${ICONS.clock}維修履歷（${records.length} 筆）</span></div>
    ${records.length ? records.map(({ j, cat, it }) => {
      const pct = Number(it.percent) || 0;
      return `
      <div class="equipment-record" data-action="equipment-open-item" data-journal="${j.id}" data-cat="${cat.id}" data-item="${it.id}">
        <div class="equipment-record-head">
          <span class="equipment-record-week">${toROC(j.periodStart)} ～ ${toROC(j.periodEnd)}</span>
          <span class="pct-chip ${percentClass(pct)}">${pct}%</span>
        </div>
        <div class="item-title">${escapeHtml(it.item) || "（未命名項目）"}</div>
        ${it.progress ? `<div class="item-progress">${escapeHtml(it.progress)}</div>` : ""}
        ${it.assignee ? `<div class="item-meta"><span class="item-assignee">負責人：${escapeHtml(it.assignee)}</span></div>` : ""}
        ${it.photos && it.photos.length ? `<div class="equipment-record-photos">${it.photos.map((p) => `<img data-photo-src="${p.id}" data-journal="${j.id}"${photoSrc(p) ? ` src="${photoSrc(p)}"` : ""} class="item-photo-thumb" alt="" />`).join("")}</div>` : ""}
      </div>`;
    }).join("") : `<p class="cat-empty">還沒有維修紀錄。編輯週誌項目時在「設備」選這台，就會出現在這裡。</p>`}
  </div>`;
}

function openEquipmentView(id) {
  state.view = "equipment";
  state.equipmentDetailId = id || null;
  render();
  window.scrollTo(0, 0);
}

async function handleEquipmentAction(action, el) {
  const dept = Auth.getCurrentDepartment();
  try {
    if (action === "equipment-open") openEquipmentView(el.dataset.id);
    else if (action === "equipment-list") openEquipmentView(null);
    else if (action === "equipment-close") { state.view = "settings"; state.equipmentDetailId = null; render(); }
    else if (action === "equipment-add") {
      const id = await promptNewEquipment(dept);
      if (id) openEquipmentView(id);
    } else if (action === "equipment-edit") {
      const e = (cachedDeptList("equipment", dept) || []).find((x) => x.id === el.dataset.id);
      if (!e) return;
      const name = prompt("設備名稱", e.name);
      if (name === null || !name.trim()) return;
      const location = prompt("位置（選填）", e.location || "");
      if (location === null) return;
      await updateDeptList("equipment", dept, (list) => list.map((x) => (x.id === e.id ? { ...x, name: name.trim(), location: location.trim() } : x)));
      render();
    } else if (action === "equipment-delete") {
      const e = (cachedDeptList("equipment", dept) || []).find((x) => x.id === el.dataset.id);
      if (!e || !confirm(`確定要刪除設備「${e.name}」嗎？\n週誌裡的維修項目不會被刪除，只是不再連到這台設備。`)) return;
      await updateDeptList("equipment", dept, (list) => list.filter((x) => x.id !== e.id));
      openEquipmentView(null);
    } else if (action === "equipment-qr") showEquipmentQr(dept, el.dataset.id);
    else if (action === "equipment-add-item") {
      state.view = "editor";
      render();
      openItemModal(null, null);
      fillEquipmentSelect(dept, el.dataset.id);
    } else if (action === "equipment-open-item") {
      await openJournalFromOverview(el.dataset.journal, el.dataset.cat, el.dataset.item);
    }
  } catch (err) {
    alert(err.message);
  }
}

async function showEquipmentQr(dept, id) {
  const e = (cachedDeptList("equipment", dept) || []).find((x) => x.id === id);
  if (!e) return;
  const modal = document.getElementById("modal-qr");
  const box = document.getElementById("qr-box");
  document.getElementById("qr-title").textContent = e.name;
  document.getElementById("qr-sub").textContent = [e.location, dept].filter(Boolean).join("・");
  box.innerHTML = `<p class="cat-empty">產生中…</p>`;
  showModal(modal);
  try {
    await loadScriptOnce(QR_LIB);
    const qr = window.qrcode(0, "M");
    qr.addData(equipmentQrUrl(dept, id));
    qr.make();
    box.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    modal.dataset.equipment = id;
    modal.dataset.dept = dept;
  } catch (err) {
    box.innerHTML = `<p class="cat-empty">QR Code 產生失敗，請確認網路連線後再試一次。</p>`;
  }
}

// 把 QR Code 加上設備名稱畫成一張圖：手機用分享選單（可存到相簿、傳 LINE），電腦直接下載後列印。
async function saveEquipmentQrImage() {
  const modal = document.getElementById("modal-qr");
  const svg = modal.querySelector("#qr-box svg");
  if (!svg) return;
  const title = document.getElementById("qr-title").textContent;
  const sub = document.getElementById("qr-sub").textContent;
  const img = new Image();
  const svgText = new XMLSerializer().serializeToString(svg);
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);
  await img.decode();
  const W = 720, Q = 560;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = 820;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.drawImage(img, (W - Q) / 2, 40, Q, Q);
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.font = `700 44px -apple-system, "PingFang TC", "Microsoft JhengHei", sans-serif`;
  ctx.fillText(title, W / 2, 660, W - 40);
  ctx.font = `28px -apple-system, "PingFang TC", "Microsoft JhengHei", sans-serif`;
  ctx.fillStyle = "#555";
  ctx.fillText(sub, W / 2, 710, W - 40);
  ctx.fillText("掃描查看維修履歷", W / 2, 770, W - 40);
  const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
  const file = new File([blob], `設備QR_${title}.png`, { type: "image/png" });
  if (isMobileDevice && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      if (err.name !== "AbortError") alert("分享失敗：" + err.message);
    }
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// 掃 QR Code 開啟：網址帶 ?equip=設備Id&dept=餐廳，登入後直接打開那台設備的履歷。
async function openDeepLinkIfAny() {
  const params = new URLSearchParams(location.search);
  const equip = params.get("equip");
  if (!equip) return;
  const dept = params.get("dept") || "";
  history.replaceState(null, "", location.pathname);
  try {
    if (dept && dept !== Auth.getCurrentDepartment()) {
      if (!getSwitchableDepartmentNames().includes(dept)) {
        alert(`這台設備屬於「${dept}」，您的帳號沒有這間餐廳的權限。`);
        return;
      }
      await handleSwitchDepartment(dept);
    }
    openEquipmentView(equip);
  } catch (err) {
    alert(err.message);
  }
}

// ---------------- 設定頁：設備、範本、備份 ----------------

function renderSettingsExtras() {
  const dept = Auth.getCurrentDepartment();
  if (!dept) return "";
  const editable = Auth.canEditDepartment(dept);
  const templates = cachedDeptList("templates", dept);
  if (!templates) loadDeptList("templates", dept).then(() => { if (state.view === "settings") render(); }).catch(() => {});
  return `
  <div class="card settings-card">
    <div class="user-row equipment-row" data-action="equipment-list">
      <div class="user-row-main">
        <div class="user-row-name">${ICONS.gear}設備清單與維修履歷</div>
        <div class="user-row-username">${escapeHtml(dept)}・每台設備的維修紀錄、照片和 QR Code</div>
      </div>
      <div class="user-row-actions">${ICONS.chevron}</div>
    </div>
  </div>
  <div class="card settings-card">
    <div class="settings-section-heading">
      <span class="settings-section-title">${ICONS.copy}常用項目範本</span>
      <p class="settings-section-subtitle">${escapeHtml(dept)}・新增項目時可以一鍵帶入；在項目視窗按「存成範本」新增</p>
    </div>
    ${!templates ? `<p class="cat-empty">載入中…</p>` : templates.length ? templates.map((t) => `
      <div class="user-row">
        <div class="user-row-main">
          <div class="user-row-name">${escapeHtml(t.item)}</div>
          <div class="user-row-username">${[t.assignee && "負責人：" + escapeHtml(t.assignee), t.progress && escapeHtml(t.progress)].filter(Boolean).join("・") || "&nbsp;"}</div>
        </div>
        ${editable ? `<div class="user-row-actions"><button class="icon-btn icon-btn-danger" data-action="template-delete" data-id="${escapeHtml(t.id)}" title="刪除範本">${ICONS.trash}</button></div>` : ""}
      </div>`).join("") : `<p class="cat-empty">還沒有範本</p>`}
  </div>`;
}

async function deleteTemplate(id) {
  const dept = Auth.getCurrentDepartment();
  const t = (cachedDeptList("templates", dept) || []).find((x) => x.id === id);
  if (!t || !confirm(`確定要刪除範本「${t.item}」嗎？`)) return;
  try {
    await updateDeptList("templates", dept, (list) => list.filter((x) => x.id !== id));
    render();
  } catch (err) {
    alert("刪除失敗：" + err.message);
  }
}

function renderBackupCard() {
  if (!Auth.isAdmin() || !Store.usesCloud) return "";
  const s = state.backupStatus;
  if (s === undefined) {
    state.backupStatus = null;
    Store.getBackupStatus().then((r) => { state.backupStatus = r; if (state.view === "settings") render(); })
      .catch((err) => { state.backupStatus = { error: err.message }; if (state.view === "settings") render(); });
  }
  const last = s && s.last;
  const schedule = !s || s.error ? "" : s.scheduled === true ? `每天凌晨 3 點自動備份，保留最新 ${s.keep} 份`
    : `<span class="backup-warn">還沒啟用每天自動備份：請在 Apps Script 編輯器執行一次 installDailyBackup</span>`;
  return `
  <div class="card settings-card">
    <div class="settings-section-header">
      <div class="settings-section-heading">
        <span class="settings-section-title">${ICONS.shield}資料備份</span>
        <p class="settings-section-subtitle">整份資料存成檔案放在雲端硬碟「工作週誌 備份」資料夾</p>
      </div>
      <button class="btn btn-ghost" data-action="backup-now" id="backup-now-btn">立即備份</button>
    </div>
    ${!s ? `<p class="cat-empty">載入中…</p>` : s.error ? `<p class="cat-empty">讀取失敗：${escapeHtml(s.error)}</p>` : `
    <div class="meta-row"><label class="meta-label">上次備份</label><span class="meta-input">${last ? formatDateTime(last.at) : "還沒有備份"}</span></div>
    ${last ? `<div class="meta-row"><label class="meta-label">檔案</label><span class="meta-input backup-file">${escapeHtml(last.name)}<br><small>Id：${escapeHtml(last.fileId)}</small></span></div>` : ""}
    <p class="settings-note">${schedule}</p>`}
  </div>`;
}

async function handleBackupNow() {
  const btn = document.getElementById("backup-now-btn");
  if (btn) { btn.disabled = true; btn.textContent = "備份中…"; }
  try {
    const info = await Store.backupNow();
    state.backupStatus = { ...(state.backupStatus || {}), last: info };
    alert(`已備份：${info.name}`);
  } catch (err) {
    alert("備份失敗：" + err.message);
  }
  state.backupStatus = undefined; // 重新讀取排程狀態
  render();
}

// ---------------- 週五提醒填週誌 ----------------

// 週五到週日：這間餐廳本週的週誌還沒建立，或本週還沒更新過，就在週誌頁最上面提醒。
function weeklyReminderHtml() {
  const dept = Auth.getCurrentDepartment();
  if (!dept || !Auth.canEditDepartment(dept)) return "";
  const today = new Date();
  const day = today.getDay();
  if (day !== 5 && day !== 6 && day !== 0) return "";
  const week = getDefaultWeekRange(today);
  const mine = state.journals.filter((j) => j.department === dept);
  const thisWeek = mine.find((j) => j.periodStart <= week.end && j.periodEnd >= week.start);
  if (!thisWeek) {
    const latest = mine.slice().sort((a, b) => (a.periodStart < b.periodStart ? 1 : -1))[0];
    return `<div class="weekly-reminder">
      <span>${ICONS.bulb}本週（${toROC(week.start)} 起）的週誌還沒建立，記得在週末前填好。</span>
      ${latest ? `<button class="btn btn-primary" data-action="duplicate-journal" data-id="${latest.id}">${ICONS.copy}<span>從上週複製建立</span></button>`
        : `<button class="btn btn-primary" data-action="new-journal">${ICONS.plus}<span>建立本週週誌</span></button>`}
    </div>`;
  }
  const monday = new Date(week.start + "T00:00:00");
  const updated = thisWeek.updatedAt ? new Date(thisWeek.updatedAt) : null;
  if (updated && updated >= monday) return "";
  return `<div class="weekly-reminder"><span>${ICONS.bulb}本週週誌還沒有更新，記得在週末前把進度填好。</span>
    ${thisWeek.id !== state.currentId ? `<button class="btn btn-primary" data-action="open-journal" data-id="${thisWeek.id}">打開本週週誌</button>` : ""}</div>`;
}

// ---------------- 事件 ----------------

function wireFeatureEvents() {
  document.getElementById("item-field-template").addEventListener("change", (e) => {
    if (e.target.value) applyTemplate(e.target.value);
    e.target.value = "";
  });
  document.getElementById("item-save-template-btn").addEventListener("click", saveCurrentAsTemplate);
  document.getElementById("item-field-equipment").addEventListener("change", (e) => onEquipmentSelectChange(e.target));
  document.getElementById("item-equipment-link").addEventListener("click", (e) => {
    e.preventDefault();
    const id = itemModalEquipmentId();
    if (!id) return;
    closeModal(document.getElementById("modal-item"));
    openEquipmentView(id);
  });
  document.getElementById("item-history-btn").addEventListener("click", toggleItemHistory);
  document.querySelectorAll("[data-voice-for]").forEach((btn) => btn.addEventListener("click", () => toggleVoiceInput(btn)));

  const qrModal = document.getElementById("modal-qr");
  const closeQr = () => closeModal(qrModal);
  document.getElementById("qr-close-btn").addEventListener("click", closeQr);
  document.getElementById("qr-close-footer-btn").addEventListener("click", closeQr);
  document.getElementById("qr-save-btn").addEventListener("click", () => saveEquipmentQrImage().catch((err) => alert(err.message)));

  document.getElementById("view-root").addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    if (action.startsWith("equipment-")) handleEquipmentAction(action, el);
    else if (action === "template-delete") deleteTemplate(el.dataset.id);
    else if (action === "backup-now") handleBackupNow();
  });
}
