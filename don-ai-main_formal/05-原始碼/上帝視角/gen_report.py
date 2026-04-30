import json

rows = json.load(open("/tmp/link_rows.json"))

lines = ["# 上帝視角 - 所有子域名跳轉完整對照表", "",
         f"共 {len(rows)} 條鏈結", ""]

# 按產品分組
groups = {}
for r in rows:
    g = r["product"].split("（")[0] if "（" in r["product"] else r["product"]
    groups.setdefault(g, []).append(r)

for gname, items in groups.items():
    pname = items[0]["product"]
    lines.append(f"## {pname}")
    lines.append("")
    lines.append("| TAG | 名稱 | LINE ID | 負責人 | 入口網址 | 到達鏈結 | 預設訊息 | Pixel ID | LINE Destination |")
    lines.append("|-----|------|---------|--------|----------|----------|----------|----------|------------------|")
    for r in items:
        redirect_short = r["redirect_url"]
        if len(redirect_short) > 60:
            redirect_short = redirect_short[:57] + "..."
        pixel_short = r["pixel"][:15] + "..." if len(r["pixel"]) > 15 else r["pixel"]
        dest_short = r["dest"][:20] + "..." if len(r["dest"]) > 20 else r["dest"]
        lines.append(f"| {r['tag']} | {r['name']} | {r['line_id']} | {r['who']} | {r['entry_url']} | {redirect_short} | {r['msg']} | {pixel_short} | {dest_short} |")
    lines.append("")

# 完整到達鏈結列表（不截斷）
lines.append("## 完整到達鏈結")
lines.append("")
for r in rows:
    lines.append(f"**{r['tag']}** ({r['name']})")
    lines.append(f"- 入口：`{r['entry_url']}`")
    lines.append(f"- 跳轉：`{r['redirect_url']}`")
    lines.append("")

with open("/home/ubuntu/link_report.md", "w") as f:
    f.write("\n".join(lines))
print("Done")
