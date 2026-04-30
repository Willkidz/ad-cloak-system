/**
 * 訪問記錄頁面 v10.0 — unified_logs 版
 * 後端已將 cloak_logs + decisions + interaction_events 合併為 unified_logs
 * 7 Tab 設計：全部日誌、安全頁、推廣頁、安全頁按鈕、推廣頁按鈕、全部跳轉、已歸因
 *
 * API 欄位對照（unified_logs 統一欄位）：
 * - visit-logs?tab=all              → unified_logs UNION clicks; visit_time(=created_at), ip, country, device(=ua), status(=verdict), log_detail(=reason), domain, source_url(=referer), visitor_id, language, campaign_id, log_source(=event_type)
 * - visit-logs?tab=safe_page        → unified_logs WHERE verdict IN ('blocked','verified_bot'); created_at, ip, country, ua, verdict, reason, domain, visitor_id, language, campaign_id, event_type as log_source
 * - visit-logs?tab=money_page       → unified_logs WHERE verdict='allowed'; same fields
 * - visit-logs?tab=money_page_button → unified_logs WHERE event_type='money_page_button'; created_at, ip, ua, country, domain, visitor_id, event_type, event_data, result, campaign_id
 * - visit-logs?tab=safe_page_button  → unified_logs WHERE event_type IN ('safe_page_button','fp_check',...); same fields
 * - clicks?matched=all/1             → clicks table unchanged
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ScrollText,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar,
  RotateCcw,
  Layers,
  MousePointerClick,
  UserCheck,
  Zap,
  MousePointer,
} from "lucide-react";
import { toast } from "sonner";
import { fetchClicks, fetchCampaignList, fetchGroups, fetchVisitLogs } from "@/lib/api";
import { formatCountry } from "@/lib/countryMap";

/* ═══════════════════════════════════════════════════
 * Type definitions
 * ═══════════════════════════════════════════════════ */

// Generic record type - we use `any` to handle different API shapes per tab
type AnyRecord = Record<string, any>;

interface CampaignOption {
  id: string;
  name: string;
  theme: string;
  group_name?: string;
}

type TabType = "all_logs" | "safe_page" | "promo_page" | "promo_button" | "safe_button" | "all_jumps" | "attributed";

const TAB_OPTIONS: { value: TabType; label: string; icon: any }[] = [
  { value: "all_logs", label: "全部日誌", icon: ScrollText },
  { value: "safe_page", label: "安全頁", icon: Zap },
  { value: "safe_button", label: "安全頁按鈕", icon: MousePointer },
  { value: "promo_page", label: "推廣頁", icon: Zap },
  { value: "promo_button", label: "推廣頁按鈕", icon: MousePointer },
  { value: "all_jumps", label: "全部跳轉", icon: MousePointerClick },
  { value: "attributed", label: "已歸因", icon: UserCheck },
];

// Frontend tab → Backend API tab parameter
const TAB_API_MAP: Record<string, string> = {
  all_logs: "all",
  safe_page: "safe_page",
  promo_page: "money_page",
  promo_button: "money_page_button",
  safe_button: "safe_page_button",
};

const TIME_RANGES = [
  { value: "all", label: "全部時間" },
  { value: "today", label: "今天" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
];

function getDateRange(range: string): { start_date?: string; end_date?: string } {
  if (range === "all") return {};
  const now = new Date();
  const end = now.toISOString();
  let start: Date;
  switch (range) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {};
  }
  return { start_date: start.toISOString(), end_date: end };
}

/* ═══════════════════════════════════════════════════
 * Helper: get a field from a record, trying multiple possible key names
 * ═══════════════════════════════════════════════════ */
function getField(row: AnyRecord, ...keys: string[]): string {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== "") return String(row[k]);
  }
  return "";
}

function formatTime(row: AnyRecord): string {
  const raw = getField(row, "visit_time", "timestamp", "created_at");
  if (!raw) return "-";
  try {
    return new Date(raw).toLocaleString("zh-TW");
  } catch {
    return raw;
  }
}

/* ═══════════════════════════════════════════════════
 * TruncatedCell — 截斷文字元件
 * ═══════════════════════════════════════════════════ */
function TruncatedCell({ text, maxWidth = 120 }: { text: string; maxWidth?: number }) {
  if (!text || text === "-") return <span className="text-muted-foreground">-</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="block truncate cursor-default" style={{ maxWidth }}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[400px] break-all">
        <p className="text-xs font-mono">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* ═══════════════════════════════════════════════════
 * 中文映射
 * ═══════════════════════════════════════════════════ */
function formatReason(reason: string): string {
  if (!reason) return "-";
  const map: Record<string, string> = {
    country_blocked: "國家封鎖",
    bot_blocked: "機器人攔截",
    bot_detected: "Bot 偵測",
    vpn_detected: "VPN 偵測",
    vpn_blocked: "VPN 封鎖",
    desktop_blocked: "桌面端封鎖",
    mobile_blocked: "行動端封鎖",
    linux_blocked: "Linux 封鎖",
    fingerprint_failed: "指紋驗證失敗",
    no_interaction: "無互動",
    no_fbclid: "缺少 fbclid",
    passed_all_checks: "通過所有檢查",
    language_mismatch: "瀏覽器語言不允許",
    isp_blocked: "ISP 封鎖",
    datacenter_ip: "資料中心 IP",
    proxy_detected: "代理偵測",
    tor_detected: "Tor 偵測",
    empty_ua: "空 User-Agent",
    suspicious_ua: "可疑 User-Agent",
    headless_browser: "無頭瀏覽器",
    automated_browser: "自動化瀏覽器",
    webdriver_detected: "WebDriver 偵測",
    js_challenge_failed: "JS 挑戰失敗",
    rate_limited: "頻率限制",
    ip_reputation: "IP 信譽不佳",
    referer_blocked: "來源封鎖",
    allowed: "允許通過",
    money_page_served: "推廣頁已送達",
    money_page_served_cached: "推廣頁已送達(快取)",
    safe_page_served: "安全頁已送達",
    redirect_to_link: "跳轉到連結",
    jwt_passed: "JWT 通過",
    jwt_expired_reissue: "JWT 過期重簽",
    jwt_replay_reissue: "JWT 重放重簽",
    cloak_block: "斗篷攔截",
    verified_bot: "已驗證機器人",
    fp_check: "指紋檢查",
    fp_blocked_bot_detected: "指紋檢測到 Bot",
    fp_duplicate_passed: "指紋重複通過",
    action_verify_blocked_bot_detected: "行為驗證攔截(Bot)",
    campaign_not_found: "廣告未找到",
    expired: "已過期",
    invalid_request: "無效請求",
    invalid_signature: "無效簽名",
    malformed: "格式錯誤",
    parse_error: "解析錯誤",
    os_mismatch: "作業系統不符",
    os_version_mismatch: "作業系統版本不符",
    allowed_devices_desktop_only: "僅允許桌面端",
    allowed_devices_mobile_only: "僅允許行動端",
    province_blocked: "省份封鎖",
    region_blocked: "區域封鎖",
    // 已驗證機器人來源
    verified_bot_source: "已驗證機器人來源",
    verified_bot_ua: "已驗證機器人(UA)",
    verified_bot_ip: "已驗證機器人(IP)",
    verified_bot_asn: "已驗證機器人(ASN)",
    verified_bot_rdns: "已驗證機器人(rDNS)",
    verified_bot_header: "已驗證機器人(Header)",
    // 流量來源
    source_blocked: "流量來源封鎖",
    traffic_source_blocked: "流量來源封鎖",
    utm_source_blocked: "UTM 來源封鎖",
    referrer_blocked: "Referrer 封鎖",
    direct_traffic: "直接流量",
    organic_traffic: "自然流量",
    // IP / 網路類型
    datacenter_blocked: "資料中心封鎖",
    hosting_ip: "主機 IP",
    hosting_blocked: "主機 IP 封鎖",
    cloud_ip: "雲端 IP",
    cloud_blocked: "雲端 IP 封鎖",
    residential_ip: "住宅 IP",
    mobile_ip: "行動網路 IP",
    satellite_ip: "衛星網路 IP",
    tor_blocked: "Tor 封鎖",
    proxy_blocked: "代理封鎖",
    // 裝置 / 作業系統
    device_blocked: "裝置封鎖",
    os_blocked: "作業系統封鎖",
    browser_blocked: "瀏覽器封鎖",
    windows_blocked: "Windows 封鎖",
    mac_blocked: "Mac 封鎖",
    android_blocked: "Android 封鎖",
    ios_blocked: "iOS 封鎖",
    // 語言 / 地區
    language_blocked: "語言封鎖",
    timezone_mismatch: "時區不符",
    timezone_blocked: "時區封鎖",
    geo_blocked: "地理位置封鎖",
    city_blocked: "城市封鎖",
    state_blocked: "州/省封鎖",
    // 指紋 / 行為
    fp_score_low: "指紋分數過低",
    fp_blocked: "指紋封鎖",
    fp_mismatch: "指紋不符",
    interaction_failed: "互動驗證失敗",
    interaction_timeout: "互動逾時",
    interaction_blocked: "互動封鎖",
    cta_not_clicked: "未點擊 CTA",
    // JWT / Token
    jwt_invalid: "JWT 無效",
    jwt_missing: "JWT 缺失",
    jwt_blocked: "JWT 封鎖",
    token_invalid: "Token 無效",
    token_expired: "Token 過期",
    token_missing: "Token 缺失",
    // 廣告 / 活動
    campaign_disabled: "廣告已停用",
    campaign_expired: "廣告已過期",
    campaign_paused: "廣告已暫停",
    campaign_limit_reached: "廣告達到上限",
    domain_blocked: "域名封鎖",
    domain_disabled: "域名已停用",
    // 安全頁
    safe_page_redirect: "安全頁跳轉",
    safe_page_blocked: "安全頁封鎖",
    safe_link_served: "安全連結已送達",
    // 其他
    duplicate_visit: "重複訪問",
    ip_blocked: "IP 封鎖",
    ip_allowlisted: "IP 白名單",
    ip_denylisted: "IP 黑名單",
    allowlisted: "白名單通過",
    denylisted: "黑名單封鎖",
    blacklisted: "黑名單封鎖",
    whitelisted: "白名單通過",
    frequency_capped: "頻率上限",
    click_fraud: "點擊詐欺",
    invalid_click: "無效點擊",
    test_mode: "測試模式",
    debug_mode: "除錯模式",
    internal_error: "內部錯誤",
    timeout: "逾時",
    unknown: "未知原因",
  };
  if (map[reason]) return map[reason];
  if (reason.startsWith("geo_filter_")) return `地區過濾: ${reason.replace("geo_filter_", "")}`;
  if (reason.startsWith("blocked_asn_")) return `ASN 封鎖: ${reason.replace("blocked_asn_", "")}`;
  if (reason.startsWith("blocked_country_")) return `國家封鎖: ${reason.replace("blocked_country_", "")}`;
  if (reason.startsWith("blocked_isp_")) return `ISP 封鎖: ${reason.replace("blocked_isp_", "")}`;
  if (reason.startsWith("verified_bot_")) return `已驗證機器人(${reason.replace("verified_bot_", "")})`;
  if (reason.startsWith("action_verify_passed_")) {
    const actionMap: Record<string, string> = {
      cta_click: "CTA點擊",
      liff_redirect: "LIFF跳轉",
    };
    const action = reason.replace("action_verify_passed_", "");
    return `行為驗證通過(${actionMap[action] || action})`;
  }
  if (reason === "action_verify_passed") return "行為驗證通過";
  if (reason.startsWith("action_verify_blocked_")) {
    const sub = reason.replace("action_verify_blocked_", "");
    return `行為驗證攔截(${sub})`;
  }
  if (reason.startsWith("residential_")) return `住宅IP: ${reason.replace("residential_", "")}`;
  if (reason.startsWith("blocked_ua_")) return `UA 封鎖: ${reason.replace("blocked_ua_", "")}`;
  if (reason.startsWith("blocked_ip_")) return `IP 封鎖: ${reason.replace("blocked_ip_", "")}`;
  if (reason.startsWith("blocked_lang_")) return `語言封鎖: ${reason.replace("blocked_lang_", "")}`;
  if (reason.startsWith("blocked_os_")) return `OS 封鎖: ${reason.replace("blocked_os_", "")}`;
  if (reason.startsWith("blocked_browser_")) return `瀏覽器封鎖: ${reason.replace("blocked_browser_", "")}`;
  if (reason.startsWith("allowed_")) return `允許(${reason.replace("allowed_", "")})`;
  if (reason.startsWith("passed_")) return `通過(${reason.replace("passed_", "")})`;
  return reason;
}

function formatVerdict(row: AnyRecord): { label: string; blocked: boolean } {
  const v = getField(row, "status", "verdict");
  if (!v) return { label: "-", blocked: false };
  if (v === "blocked" || v === "safe") return { label: "放截", blocked: true };
  if (v === "verified_bot") return { label: "機器人", blocked: true };
  if (v === "allowed" || v === "money" || v === "money_page") return { label: "放行", blocked: false };
  return { label: v, blocked: false };
}

function formatEventType(eventType: string): string {
  const map: Record<string, string> = {
    cta_click: "按鈕點擊",
    fp_check: "指紋檢查",
    interaction_detect: "互動偵測",
    form_submit: "表單提交",
    no_interaction: "無互動",
    money_page_button: "推廣頁按鈕",
    safe_page_button: "安全頁按鈕",
    bot_blocked: "機器人攔截",
    bot_detected: "Bot 偵測",
    country_blocked: "國家封鎖",
    cloak_block: "斗篷攔截",
    verified_bot: "已驗證機器人",
    jwt_passed: "JWT 通過",
    jwt_expired: "JWT 過期",
    redirect_to_link: "跳轉連結",
    money_page_served: "推廣頁已送達",
    visit: "訪問",
  };
  return map[eventType] || eventType;
}

function formatResult(result: string): { label: string; color: string } {
  if (result === "passed" || result === "allowed") return { label: "通過", color: "bg-emerald-100 text-emerald-700" };
  if (result === "blocked") return { label: "攔截", color: "bg-red-100 text-red-700" };
  return { label: result || "-", color: "" };
}

function parseEventData(eventData: string): string {
  try {
    if (!eventData) return "-";
    const data = JSON.parse(eventData);
    const parts: string[] = [];
    if (data.fp_score !== undefined) parts.push(`指紋: ${data.fp_score}`);
    if (data.score !== undefined) parts.push(`分數: ${data.score}`);
    if (data.fingerprint_score !== undefined) parts.push(`指紋分數: ${data.fingerprint_score}`);
    if (data.interaction_count !== undefined) parts.push(`互動: ${data.interaction_count}`);
    if (data.stay_time !== undefined) parts.push(`停留: ${data.stay_time}ms`);
    if (data.action) {
      const actionMap: Record<string, string> = {
        cta_click: "按鈕點擊",
      };
      parts.push(`動作: ${actionMap[data.action] || data.action}`);
    }
    if (data.target_url) parts.push(`目標: ${data.target_url}`);
    return parts.length > 0 ? parts.join(" | ") : JSON.stringify(data).slice(0, 80);
  } catch {
    return String(eventData).slice(0, 80);
  }
}

/* ═══════════════════════════════════════════════════
 * Main Component
 * ═══════════════════════════════════════════════════ */
export default function Logs() {
  const [activeTab, setActiveTab] = useState<TabType>("all_logs");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [timeRange, setTimeRange] = useState("all");

  // Data items (generic)
  const [items, setItems] = useState<AnyRecord[]>([]);

  // Filters
  const [groupFilter, setGroupFilter] = useState("all");
  const [campaignId, setCampaignId] = useState("all");
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [groups, setGroups] = useState<{ prefix: string; name: string; label: string }[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

  // 載入廣告列表和分組列表
  useEffect(() => {
    const loadMeta = async () => {
      setCampaignsLoading(true);
      try {
        const [campaignRes, groupRes] = await Promise.allSettled([
          fetchCampaignList(),
          fetchGroups(),
        ]);
        if (campaignRes.status === "fulfilled" && campaignRes.value.success) {
          setCampaigns(campaignRes.value.data || []);
        }
        if (groupRes.status === "fulfilled" && groupRes.value.success) {
          const rawGroups = groupRes.value.data || [];
          const normalized = rawGroups.map((g: any) => {
            if (typeof g === "string") return { prefix: g, name: g, label: g };
            return g;
          });
          setGroups(normalized);
        }
      } catch {
        console.error("Failed to fetch campaigns/groups");
      } finally {
        setCampaignsLoading(false);
      }
    };
    loadMeta();
  }, []);

  // 根據分組篩選廣告選項
  const filteredCampaignOptions = useMemo(() => {
    if (groupFilter === "all") return campaigns;
    const matchGroup = groups.find(
      (g) => g.prefix === groupFilter || g.label === groupFilter || g.name === groupFilter
    );
    return campaigns.filter((c) => {
      const gn = c.group_name || "";
      if (!gn) return false;
      if (matchGroup)
        return gn === matchGroup.prefix || gn === matchGroup.name || gn === matchGroup.label;
      return gn === groupFilter;
    });
  }, [campaigns, groupFilter, groups]);

  const handleGroupChange = (val: string) => {
    setGroupFilter(val);
    setPage(1);
    if (val !== "all" && campaignId !== "all") {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (campaign) {
        const matchGroup = groups.find(
          (g) => g.prefix === val || g.label === val || g.name === val
        );
        const gn = campaign.group_name || "";
        const inGroup = matchGroup
          ? gn === matchGroup.prefix || gn === matchGroup.name || gn === matchGroup.label
          : gn === val;
        if (!inGroup) setCampaignId("all");
      }
    }
  };

  /* ─── Data loading ─── */
  const isCloak = ["all_logs", "safe_page", "promo_page"].includes(activeTab);
  const isInteraction = ["promo_button", "safe_button"].includes(activeTab);
  const isClicks = ["all_jumps", "attributed"].includes(activeTab);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dateRange = getDateRange(timeRange);

      if (isCloak || isInteraction) {
        // Use visit-logs endpoint
        const apiTab = TAB_API_MAP[activeTab];
        const params: Record<string, string | number> = { page, limit, tab: apiTab };
        if (appliedSearch) params.search = appliedSearch;
        if (dateRange.start_date) params.start_date = dateRange.start_date;
        if (dateRange.end_date) params.end_date = dateRange.end_date;

        // Campaign filter (only for cloak tabs)
        if (isCloak) {
          if (campaignId !== "all") {
            params.campaign_id = campaignId;
          } else if (groupFilter !== "all") {
            const matchGroup = groups.find(
              (g) => g.prefix === groupFilter || g.label === groupFilter || g.name === groupFilter
            );
            const groupCampaignIds = campaigns
              .filter((c) => {
                const gn = c.group_name || "";
                if (!gn) return false;
                if (matchGroup)
                  return gn === matchGroup.prefix || gn === matchGroup.name || gn === matchGroup.label;
                return gn === groupFilter;
              })
              .map((c) => c.id);
            if (groupCampaignIds.length > 0) {
              params.campaign_ids = groupCampaignIds.join(",");
            }
          }
        }

        const res = await fetchVisitLogs(params);
        if (res.success) {
          setItems(res.data?.items || []);
          setTotal(res.data?.total || 0);
        }
      } else if (isClicks) {
        // Use clicks endpoint
        const params: Record<string, string | number> = { page, limit };
        if (activeTab === "attributed") params.matched = 1;
        else params.matched = "all" as any;
        if (appliedSearch) params.search = appliedSearch;
        if (dateRange.start_date) params.start_date = dateRange.start_date;
        if (dateRange.end_date) params.end_date = dateRange.end_date;

        const res = await fetchClicks(params);
        if (res.success) {
          setItems(res.data?.items || []);
          setTotal(res.data?.total || 0);
        }
      }
    } catch {
      toast.error("載入資料失敗");
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, appliedSearch, campaignId, groupFilter, timeRange, campaigns, groups, isCloak, isInteraction, isClicks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setAppliedSearch(searchText);
    setPage(1);
  };

  const handleReset = () => {
    setSearchText("");
    setAppliedSearch("");
    setGroupFilter("all");
    setCampaignId("all");
    setTimeRange("all");
    setPage(1);
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val as TabType);
    setPage(1);
    setItems([]);
    setTotal(0);
  };

  const totalPages = Math.ceil(total / limit);
  const showCampaignCol = campaignId === "all" && isCloak;
  // 推廣頁和推廣頁按鈕 tab 額外顯示廣告編號欄位
  const showAdCodeCol = activeTab === "promo_page" || activeTab === "promo_button";

  /* ═══════════════════════════════════════════════════
   * Render
   * ═══════════════════════════════════════════════════ */
  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            訪問記錄
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            整合斗篷過濾日誌與點擊追蹤記錄
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RotateCcw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* 主 Tab 篩選 */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex w-full">
          {TAB_OPTIONS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center justify-center gap-2 text-sm font-medium py-2 flex-1 min-w-0">
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline truncate">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* 篩選區域 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 分組篩選 (only for cloak_logs tabs) */}
            {isCloak && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  <Layers className="h-3 w-3 inline mr-1" />
                  分組篩選
                </Label>
                <Select
                  value={groupFilter}
                  onValueChange={handleGroupChange}
                  disabled={campaignsLoading}
                  onOpenChange={(open) => {
                    if (!open) setGroupSearch("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選擇分組" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[200px]" position="popper">
                    <div className="px-2 py-1.5 border-b">
                      <input
                        className="w-full text-sm px-2 py-1 rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        placeholder="搜尋分組..."
                        value={groupSearch}
                        onChange={(e) => setGroupSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        autoComplete="off"
                      />
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: "260px" }}>
                      {!groupSearch && <SelectItem value="all">全部分組</SelectItem>}
                      {!groupSearch && <SelectSeparator />}
                      {(() => {
                        const mainGroups = groups.filter(
                          (g) =>
                            !g.prefix.startsWith("N") &&
                            (!groupSearch ||
                              g.label.toLowerCase().includes(groupSearch.toLowerCase()) ||
                              g.prefix.toLowerCase().includes(groupSearch.toLowerCase()))
                        );
                        return mainGroups.length > 0 ? (
                          <SelectGroup>
                            <SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
                              主要分組
                            </SelectLabel>
                            {mainGroups.map((g) => (
                              <SelectItem key={g.prefix} value={g.prefix}>
                                {g.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ) : null;
                      })()}
                      {(() => {
                        const nGroups = groups.filter(
                          (g) =>
                            g.prefix.startsWith("N") &&
                            (!groupSearch ||
                              g.label.toLowerCase().includes(groupSearch.toLowerCase()) ||
                              g.prefix.toLowerCase().includes(groupSearch.toLowerCase()))
                        );
                        return nGroups.length > 0 ? (
                          <>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
                                N 系列
                              </SelectLabel>
                              {nGroups.map((g) => (
                                <SelectItem key={g.prefix} value={g.prefix}>
                                  {g.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 廣告篩選 (only for cloak_logs tabs) */}
            {isCloak && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  <Filter className="h-3 w-3 inline mr-1" />
                  廣告篩選
                </Label>
                <Select
                  value={campaignId}
                  onValueChange={(val) => {
                    setCampaignId(val);
                    setPage(1);
                  }}
                  disabled={campaignsLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選擇廣告" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {groupFilter !== "all"
                        ? `${groups.find((g) => g.prefix === groupFilter || g.label === groupFilter)?.label || groupFilter} 全部廣告`
                        : "全部廣告"}
                    </SelectItem>
                    {filteredCampaignOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.theme ? ` (${c.theme})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 時間範圍 */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                <Calendar className="h-3 w-3 inline mr-1" />
                時間範圍
              </Label>
              <Select
                value={timeRange}
                onValueChange={(val) => {
                  setTimeRange(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇時間範圍" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 搜索 */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                <Search className="h-3 w-3 inline mr-1" />
                搜索
              </Label>
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={
                  isCloak
                    ? "IP / 域名 / 原因..."
                    : isInteraction
                      ? "IP / 域名 / 訪客ID..."
                      : "visitor_id / fbclid / tag..."
                }
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Search className="h-4 w-4 mr-1" />
                搜索
              </Button>
              <Button variant="outline" onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>

          {/* 已套用的篩選提示 */}
          {(appliedSearch || campaignId !== "all" || groupFilter !== "all" || timeRange !== "all") && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">已套用篩選：</span>
              {groupFilter !== "all" && isCloak && (
                <Badge variant="secondary" className="text-xs">
                  分組：
                  {groups.find((g) => g.prefix === groupFilter || g.label === groupFilter)?.label ||
                    groupFilter}
                </Badge>
              )}
              {campaignId !== "all" && isCloak && (
                <Badge variant="secondary" className="text-xs">
                  廣告：{campaigns.find((c) => c.id === campaignId)?.name || "未知"}
                </Badge>
              )}
              {timeRange !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  時間：{TIME_RANGES.find((t) => t.value === timeRange)?.label}
                </Badge>
              )}
              {appliedSearch && (
                <Badge variant="secondary" className="text-xs">
                  搜索：{appliedSearch}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════ 表格 ═══════ */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暫無數據</p>
            </div>
          ) : isCloak ? (
            /* ═══════ Cloak Logs Table ═══════ */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[155px]">時間</TableHead>
                    <TableHead className="w-[90px]">ASN</TableHead>
                    <TableHead className="w-[120px]">IP</TableHead>
                    <TableHead className="w-[70px]">國家</TableHead>
                    <TableHead className="w-[70px]">判定</TableHead>
                    <TableHead className="w-[120px]">原因</TableHead>
                    <TableHead className="w-[200px]">域名/路徑</TableHead>
                    {showCampaignCol && <TableHead className="w-[110px]">廣告編號</TableHead>}
                    {showAdCodeCol && <TableHead className="w-[100px]">Ad Code</TableHead>}
                    {showAdCodeCol && <TableHead className="w-[80px]">TAG</TableHead>}
                    <TableHead className="w-[70px]">語言</TableHead>
                    <TableHead className="w-[90px]">訪客ID</TableHead>
                    <TableHead className="w-[130px]">設備(UA)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row, idx) => {
                    const vd = formatVerdict(row);
                    return (
                      <TableRow key={row.id || idx}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatTime(row)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <TruncatedCell text={getField(row, "asn") || "-"} maxWidth={90} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <TruncatedCell text={getField(row, "ip") || "unknown"} maxWidth={120} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCountry(getField(row, "country"))}
                        </TableCell>
                        <TableCell>
                          {vd.label !== "-" ? (
                            <Badge
                              variant={vd.blocked ? "destructive" : "secondary"}
                              className={
                                vd.blocked
                                  ? ""
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              }
                            >
                              {vd.label}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <TruncatedCell
                            text={formatReason(getField(row, "log_detail", "reason"))}
                            maxWidth={120}
                          />
                        </TableCell>
                        <TableCell>
                          <TruncatedCell
                            text={(() => {
                              const domain = getField(row, "domain") || "";
                              const path = getField(row, "path", "source_url") || "";
                              if (!domain) return "-";
                              const fullUrl = path && path !== "/" ? `${domain}${path}` : domain;
                              return fullUrl;
                            })()}
                            maxWidth={200}
                          />
                        </TableCell>
                        {showCampaignCol && (
                          <TableCell>
                            <TruncatedCell
                              text={
                                row.campaign_id
                                  ? campaigns.find((c) => c.id === row.campaign_id)?.name || "-"
                                  : "-"
                              }
                              maxWidth={110}
                            />
                          </TableCell>
                        )}
                        {showAdCodeCol && (
                          <TableCell className="font-mono text-xs">
                            <TruncatedCell text={getField(row, "ad_code") || "-"} maxWidth={100} />
                          </TableCell>
                        )}
                        {showAdCodeCol && (
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {getField(row, "tag")?.toUpperCase() || "-"}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-xs">
                          {getField(row, "language") || "-"}
                        </TableCell>
                        <TableCell>
                          <TruncatedCell text={getField(row, "visitor_id") || "-"} maxWidth={90} />
                        </TableCell>
                        <TableCell>
                          <TruncatedCell text={getField(row, "device", "ua") || "-"} maxWidth={130} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : isInteraction ? (
            /* ═══════ Interaction Events Table ═══════ */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[155px]">時間</TableHead>
                    <TableHead className="w-[90px]">ASN</TableHead>
                    <TableHead className="w-[110px]">域名</TableHead>
                    {showAdCodeCol && <TableHead className="w-[100px]">Ad Code</TableHead>}
                    {showAdCodeCol && <TableHead className="w-[80px]">TAG</TableHead>}
                    <TableHead className="w-[120px]">IP</TableHead>
                    <TableHead className="w-[70px]">國家</TableHead>
                    <TableHead className="w-[90px]">訪客ID</TableHead>
                    <TableHead className="w-[90px]">事件類型</TableHead>
                    <TableHead className="w-[70px]">結果</TableHead>
                    <TableHead className="w-[200px]">事件數據</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row, idx) => {
                    const r = formatResult(getField(row, "result"));
                    return (
                      <TableRow key={row.id || idx}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {formatTime(row)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <TruncatedCell text={getField(row, "asn") || "-"} maxWidth={90} />
                        </TableCell>
                        <TableCell>
                          <TruncatedCell text={getField(row, "domain") || "-"} maxWidth={110} />
                        </TableCell>
                        {showAdCodeCol && (
                          <TableCell className="font-mono text-xs">
                            <TruncatedCell text={getField(row, "ad_code") || "-"} maxWidth={100} />
                          </TableCell>
                        )}
                        {showAdCodeCol && (
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {getField(row, "tag")?.toUpperCase() || "-"}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-xs">
                          <TruncatedCell text={getField(row, "ip") || "-"} maxWidth={120} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatCountry(getField(row, "country"))}
                        </TableCell>
                        <TableCell>
                          <TruncatedCell text={getField(row, "visitor_id") || "-"} maxWidth={90} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatEventType(getField(row, "event_type"))}
                        </TableCell>
                        <TableCell>
                          {r.color ? (
                            <Badge variant="outline" className={`text-xs ${r.color}`}>
                              {r.label}
                            </Badge>
                          ) : (
                            <span className="text-xs">{r.label}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <TruncatedCell
                            text={parseEventData(getField(row, "event_data"))}
                            maxWidth={200}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* ═══════ Clicks Table ═══════ */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[155px]">F點擊</TableHead>
                    <TableHead className="w-[155px]">加入好友</TableHead>
                    <TableHead className="w-[155px]">歸因時間</TableHead>
                    <TableHead className="w-[70px]">TAG</TableHead>
                    <TableHead className="w-[80px]">Ad Code</TableHead>
                    <TableHead className="w-[100px]">Visitor ID</TableHead>
                    <TableHead className="w-[120px]">fbclid</TableHead>
                    <TableHead className="w-[100px]">Event ID</TableHead>
                    <TableHead className="w-[100px]">Destination</TableHead>
                    <TableHead className="w-[70px]">歸因</TableHead>
                    <TableHead className="w-[100px]">歸因用戶</TableHead>
                    <TableHead className="w-[70px]">國家</TableHead>
                    <TableHead className="w-[70px]">系統</TableHead>
                    <TableHead className="w-[90px]">來源</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row, idx) => (
                    <TableRow key={row.click_id || idx}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatTime(row)}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {row.follow_time ? new Date(row.follow_time).toLocaleString("zh-TW") : "-"}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {row.matched_at ? new Date(row.matched_at).toLocaleString("zh-TW") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {getField(row, "tag")?.toUpperCase() || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {getField(row, "ad_code") || "-"}
                      </TableCell>
                      <TableCell>
                        <TruncatedCell text={getField(row, "visitor_id") || "-"} maxWidth={100} />
                      </TableCell>
                      <TableCell>
                        <TruncatedCell text={getField(row, "fbclid") || "-"} maxWidth={120} />
                      </TableCell>
                      <TableCell>
                        <TruncatedCell text={getField(row, "event_id") || "-"} maxWidth={100} />
                      </TableCell>
                      <TableCell>
                        <TruncatedCell text={getField(row, "destination") || "-"} maxWidth={100} />
                      </TableCell>
                      <TableCell>
                        {row.matched === 1 ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                            已歸因
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            未歸因
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <TruncatedCell text={getField(row, "matched_user_id") || "-"} maxWidth={100} />
                      </TableCell>
                      <TableCell className="text-xs">
                        {getField(row, "ip_country") ? formatCountry(getField(row, "ip_country")) : "-"}
                      </TableCell>
                      <TableCell className="text-xs">{getField(row, "os") || "-"}</TableCell>
                      <TableCell>
                        {getField(row, "source") ? (
                          <Badge
                            variant="outline"
                            className={
                              row.source === "firebird"
                                ? "bg-orange-100 text-orange-700 border-orange-300 text-xs"
                                : "bg-sky-100 text-sky-700 border-sky-300 text-xs"
                            }
                          >
                            {row.source === "firebird" ? "火鳥" : row.source}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分頁 */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              共 {total} 筆，第 {page}/{totalPages} 頁
            </p>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[100px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 筆/頁</SelectItem>
                <SelectItem value="50">50 筆/頁</SelectItem>
                <SelectItem value="100">100 筆/頁</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一頁
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
