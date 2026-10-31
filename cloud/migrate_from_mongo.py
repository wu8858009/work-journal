"""
把原本 MongoDB（Render 後端用的資料庫）的全部資料搬到 Google 試算表雲端後端。

用法：
  python migrate_from_mongo.py <appsettings.json> <資料庫名稱> <Apps Script 網址(…/exec)>
  python migrate_from_mongo.py <appsettings.json> <資料庫名稱> --dry-run 匯出.json

只會「讀」MongoDB；雲端那邊只有在還沒有任何帳號時才接受匯入。密碼雜湊原封不動搬過去，
所有人可以繼續用原本的帳號密碼登入。
"""
import datetime as dt
import json
import sys
import urllib.request

import pymongo


def camel(name):
    if name == "_id":
        return "id"
    return name[:1].lower() + name[1:]


def iso(v):
    if v.tzinfo is None:
        v = v.replace(tzinfo=dt.timezone.utc)
    return v.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f") + "0Z"  # 跟 .NET 的 "o" 格式一樣（7 位小數）


def plain(v):
    if isinstance(v, dict):
        return {camel(k): plain(x) for k, x in v.items()}
    if isinstance(v, list):
        return [plain(x) for x in v]
    if isinstance(v, dt.datetime):
        return iso(v)
    if hasattr(v, "binary"):  # ObjectId 等
        return str(v)
    return v


def export(db):
    users = [plain(u) for u in db.Users.find({})]
    for u in users:
        u.setdefault("departments", [])
        u.setdefault("allDepartments", False)
        u.setdefault("allDepartmentsCanEdit", False)

    journals = []
    for j in db.Journals.find({}):
        j = plain(j)
        j["version"] = j.get("version") or 0
        journals.append(j)

    timers = [{"department": t.get("department") or t["id"], "rows": t.get("rows") or []}
              for t in (plain(x) for x in db.LightTimers.find({}))]
    schedules = [{"department": t.get("department") or t["id"], "tasks": t.get("tasks") or []}
                 for t in (plain(x) for x in db.MaintenanceSchedules.find({}))]
    settings = plain(db.AppSettings.find_one({"_id": 1}) or {})
    settings.pop("id", None)

    return {
        "users": users,
        "departments": [plain(d) for d in db.Departments.find({})],
        "journals": journals,
        "lightTimers": timers,
        "maintenanceSchedules": schedules,
        "auditLogs": [plain(a) for a in db.AuditLogs.find({}).sort("_id", 1)],
        "passwordResetRequests": [plain(r) for r in db.PasswordResetRequests.find({})],
        "settings": settings or None,
        "counters": {c["_id"]: c["Seq"] for c in db.Counters.find({})},
    }


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(1)
    cfg = json.load(open(sys.argv[1], encoding="utf-8"))["Mongo"]
    db = pymongo.MongoClient(cfg["ConnectionString"], serverSelectionTimeoutMS=20000)[sys.argv[2]]
    data = export(db)
    print(f"讀到：帳號 {len(data['users'])}、餐廳 {len(data['departments'])}、週誌 {len(data['journals'])}、"
          f"燈光定時 {len(data['lightTimers'])}、保養排程 {len(data['maintenanceSchedules'])}、稽核紀錄 {len(data['auditLogs'])}")

    if sys.argv[3] == "--dry-run":
        out = sys.argv[4] if len(sys.argv) > 4 else "export.json"
        json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("已寫到", out)
        return

    body = json.dumps({"m": "POST", "p": "/setup/import", "t": "", "b": data}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(sys.argv[3], data=body, headers={"Content-Type": "text/plain;charset=utf-8"})
    with urllib.request.urlopen(req, timeout=300) as res:
        reply = json.loads(res.read().decode("utf-8"))
    print("雲端回應：", reply.get("s"), reply.get("b"))
    if reply.get("s") != 200:
        sys.exit(2)


if __name__ == "__main__":
    main()
