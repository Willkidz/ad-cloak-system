import requests, json, urllib.parse

cfg = requests.get("https://godview.app.n8n.cloud/webhook/get-config",
    headers={"User-Agent": "CloudflareWorker/1.0"}, timeout=10).json()

LINE_MAP = cfg.get("LINE_MAP", {})
MASTER_PIXEL_MAP = cfg.get("MASTER_PIXEL_MAP", {})

GROUPS = {
    "js": "AS（爆分王）", "cs": "AS（爆分王）", "ms": "AS（爆分王）", "ls": "AS（爆分王）",
    "jb": "AB（莊家剋星）", "cb": "AB（莊家剋星）", "mb": "AB（莊家剋星）", "lb": "AB（莊家剋星）",
    "jx": "AX（獨角仙）", "cx": "AX（獨角仙）", "mx": "AX（獨角仙）", "lx": "AX（獨角仙）",
    "bf": "BF（博富）", "jd": "BF（博富）",
    "n14": "N14", "n15": "N15", "n16": "N16", "n17": "N17",
    "n18": "N18", "n19": "N19", "n20": "N20", "n21": "N21", "n22": "N22",
}

ORDER = ["js","cs","ms","ls","jb","cb","mb","lb","jx","cx","mx","lx","bf","jd",
         "n14","n15","n16","n17","n18","n19","n20","n21","n22"]

rows = []
for tag in ORDER:
    info = LINE_MAP.get(tag, {})
    line_id = info.get("line", "?")
    name = info.get("name", "?")
    who = info.get("who", "-")
    msg = info.get("msg", "")
    dest = info.get("destination", "")
    product = GROUPS.get(tag, "?")
    mp = MASTER_PIXEL_MAP.get(tag, {})
    pixel = mp.get("pixel", "") if mp else ""

    entry_url = f"https://{tag}.freshpathlab.com/"

    # 實際跳轉
    try:
        r = requests.get(entry_url, allow_redirects=False, timeout=10)
        if r.status_code == 302:
            redirect_url = r.headers.get("Location", "")
        elif r.status_code == 200:
            redirect_url = "(LIFF HTML 頁面)"
        else:
            redirect_url = f"HTTP {r.status_code}"
    except Exception as e:
        redirect_url = f"ERROR: {e}"

    rows.append({
        "tag": tag, "name": name, "line_id": line_id, "who": who,
        "product": product, "msg": msg, "dest": dest,
        "pixel": pixel, "entry_url": entry_url, "redirect_url": redirect_url
    })

json.dump(rows, open("/tmp/link_rows.json","w"), ensure_ascii=False, indent=2)
print(f"Done: {len(rows)} rows")
