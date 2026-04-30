# shadow-cloak 效能排查中間筆記

## 2026-04-10 production 實測

### curl 總體耗時

| 目標 | Run | DNS | TCP | TLS | TTFB | Total |
|---|---:|---:|---:|---:|---:|---:|
| z1k4h.xyz | 1 | 0.009750s | 0.010345s | 1.382738s | 4.802329s | 4.982882s |
| z1k4h.xyz | 2 | 0.001082s | 0.001586s | 1.207969s | 3.093538s | 3.288479s |
| z1k4h.xyz | 3 | 0.001086s | 0.001499s | 1.268511s | 3.103454s | 3.280286s |
| safe-page.laoqin1689.workers.dev | 1 | 0.013920s | 0.014414s | 1.446570s | 1.942476s | 2.202155s |
| safe-page.laoqin1689.workers.dev | 2 | 0.001079s | 0.001524s | 1.436088s | 1.932046s | 2.152586s |
| safe-page.laoqin1689.workers.dev | 3 | 0.001006s | 0.001334s | 1.396067s | 1.907352s | 2.168304s |

### z1k4h.xyz Server-Timing

| Run | entry_campaign_lookup | entry_resolve_routing | entry_load_feature_flags | entry_check_verified_bot | entry_is_bot | safe_select_variant | safe_worker_fetch | safe_worker_read_body | x-worker-timing-total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 171ms | 507ms | 0ms | 226ms | 1302ms | 173ms | 101ms | 0ms | 2879ms |
| 2 | 170ms | 503ms | 0ms | 2ms | 32ms | 178ms | 14ms | 0ms | 1311ms |

### 初步觀察

1. **safe-page Worker 本身沒有 shadow-cloak 同等級的內部計時，但其 TTFB 長期約 1.9s，且其中 TLS 約 1.4s，表示即便程式很輕，從目前 sandbox 到 Cloudflare 邊緣的連線本身就有高固定成本。**
2. **z1k4h.xyz 在 warm run 下的 x-worker-timing-total 約 1.3s，顯示 Worker 程式碼本身確實偏慢，不只是網路問題。**
3. **首個 cold-ish run 額外增加的主要步驟是 `entry_is_bot`（1302ms）與 `entry_check_verified_bot`（226ms），warm run 分別降到 32ms 與 2ms，極像 KV 讀取與初始化/快取未命中的冷啟動成本。**
4. **`entry_resolve_routing` 穩定約 503-507ms，`entry_campaign_lookup` 穩定約 170ms，兩者即使 warm 仍慢，屬於持續性 D1 路徑成本。**
5. **在 z1k4h.xyz TTFB 3.09s 的 warm run 中，Worker 內部總計 1.311s，TLS 已單獨占 1.208s，剩餘約 0.57s 是其他 Cloudflare 邊緣/傳輸成本。**
