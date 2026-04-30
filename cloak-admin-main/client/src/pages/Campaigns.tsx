/**
 * 廣告列表頁面 - 還原設計稿版本
 * 設計稿風格：淺色主題、Tab 篩選、設計稿表格、批量操作
 * 注意：只改 UI 樣式，不修改功能邏輯
 */
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Pencil, Trash2, Search, Loader2, Megaphone, Copy,
  ListPlus, Monitor, Smartphone, Shield, Link as LinkIcon,
  ArrowUp, ArrowDown, X, Info, ChevronRight, Globe, Eye,
  Languages, Laptop, MapPin, ExternalLink, Ban,
  Filter, Pause, Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCampaigns, fetchCampaign, createCampaign, updateCampaign, updateCampaignApprovedAt,
  deleteCampaign, fetchTemplates, fetchDomains,
  fetchCampaignMetrics, fetchLiffOptions,
  fetchLineGroups, fetchLineConfigs, fetchLineConfigsByGroup, fetchPixelGroups,
  createDetails, updateDetails,
  fetchCampaignVariants, createVariant, deleteVariant, resetVariants, resetSingleVariant,
} from "@/lib/api";
import { formatCountry, COUNTRY_MAP, COUNTRY_OPTIONS } from "@/lib/countryMap";
import {
  LANGUAGE_OPTIONS, OS_OPTIONS, TRAFFIC_SOURCE_OPTIONS,
} from "@/lib/cloakConstants";
import { MultiSelect } from "@/components/ui/multi-select";
import RichEditor from "@/components/RichEditor";

// ==================== Cloak Multi-Select Options ====================
const CLOAK_COUNTRY_OPTIONS = [
  { value: "TW", label: "TW - 台灣" },
  { value: "JP", label: "JP - 日本" },
  { value: "US", label: "US - 美國" },
  { value: "KR", label: "KR - 韓國" },
  { value: "HK", label: "HK - 香港" },
  { value: "SG", label: "SG - 新加坡" },
  { value: "MY", label: "MY - 馬來西亞" },
  { value: "TH", label: "TH - 泰國" },
  { value: "VN", label: "VN - 越南" },
  { value: "ID", label: "ID - 印尼" },
  { value: "PH", label: "PH - 菲律賓" },
  { value: "AU", label: "AU - 澳洲" },
  { value: "GB", label: "GB - 英國" },
  { value: "CA", label: "CA - 加拿大" },
  { value: "DE", label: "DE - 德國" },
  { value: "FR", label: "FR - 法國" },
];

const CLOAK_LANG_OPTIONS = [
  { value: "zh-TW", label: "zh-TW - 繁體中文" },
  { value: "zh-CN", label: "zh-CN - 簡體中文" },
  { value: "ja", label: "ja - 日文" },
  { value: "ko", label: "ko - 韓文" },
  { value: "en", label: "en - 英文" },
  { value: "th", label: "th - 泰文" },
  { value: "vi", label: "vi - 越南文" },
  { value: "id", label: "id - 印尼文" },
];

const CLOAK_OS_OPTIONS = [
  { value: "Android", label: "Android" },
  { value: "iOS", label: "iOS" },
  { value: "Windows", label: "Windows" },
  { value: "macOS", label: "macOS" },
  { value: "Linux", label: "Linux" },
];

const CLOAK_OS_VERSION_OPTIONS = [
  { value: "Windows 10", label: "Windows 10" },
  { value: "Windows 11", label: "Windows 11" },
  { value: "macOS 14", label: "macOS 14" },
  { value: "macOS 15", label: "macOS 15" },
  { value: "Android 13", label: "Android 13" },
  { value: "Android 14", label: "Android 14" },
  { value: "iOS 16", label: "iOS 16" },
  { value: "iOS 17", label: "iOS 17" },
  { value: "iOS 18", label: "iOS 18" },
];

const CLOAK_TRAFFIC_OPTIONS = [
  { value: "facebook.com", label: "Facebook (facebook.com)" },
  { value: "instagram.com", label: "Instagram (instagram.com)" },
  { value: "tiktok.com", label: "TikTok (tiktok.com)" },
  { value: "google.com", label: "Google (google.com)" },
  { value: "youtube.com", label: "YouTube (youtube.com)" },
  { value: "line.me", label: "LINE (line.me)" },
  { value: "twitter.com", label: "Twitter/X (twitter.com)" },
  { value: "whatsapp.com", label: "WhatsApp (whatsapp.com)" },
  { value: "direct", label: "直接訪問 (direct)" },
];

// Helper: comma-separated string <-> string[]
function csvToArr(val: string | null | undefined): string[] {
  if (!val || !val.trim()) return [];
  return val.split(",").map(s => s.trim()).filter(Boolean);
}
function csvToArrWithAlias(...values: Array<string | null | undefined>): string[] {
  for (const value of values) {
    const parsed = csvToArr(value);
    if (parsed.length) return parsed;
  }
  return [];
}
function arrToCsv(arr: string[]): string {
  return arr.filter(Boolean).join(",");
}

// ==================== Types ====================
interface Campaign {
  id: string;
  name: string;
  title: string;
  link: string;
  country: string;
  template_id: string;
  status: string;
  line_links: string[];
  whatsapp_links: string[];
  other_links: string[];
  link_strategy: string;
  allow_desktop: number;
  allow_mobile: number;
  residential_only: number;
  require_residential: number;
  customer_links: string[];
  routing_strategy: string;
  pixel_tk: string;
  pixel_fb: string;
  pixel_ga: string;
  pixel_google_ad: string;
  pixel_google_conv: string;
  safe_page_id: string;
  money_page_id: string;
  safe_page_type: string;
  safe_page_action: string;
  safe_page_content: string;
  cloak_country: string;
  cloak_lang: string;
  cloak_os: string;
  cloak_os_version: string;
  cloak_region: string;
  cloak_traffic_source: string;
  blacklist_rules: any[];
  require_fbclid?: boolean;
  ad_pixels?: {pixel_id: string; token: string; name?: string}[];
  bc_pixels?: {pixel_id: string; token: string; name?: string}[];
  created_at: string;
  updated_at: string;
  short_codes?: string[];
  // Metrics fields (from /api/v1/campaigns/metrics)
  impressions?: number | null;
  clicks?: number | null;
  attributed?: number | null;
  ctr?: number | null;
  cvr?: number | null;
  // Legacy fields (kept for backward compat)
  conversions?: number;
  cloak_rate?: number;
  conversion_rate?: number;
  theme?: string;
  liff_links?: string[];
  liff_id?: string;
  line_oa_id?: string;
  ad_code?: string;
  group_name?: string;
  page_test_strategy?: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  country: string;
  status: string;
}

interface DomainInfo {
  id: number;
  domain: string;
  status: string;
  campaign_id?: string;
  bindedCampaignId?: string | null;
}

function parseArr(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

// ==================== Metrics Helpers ====================
// 分組前綴展開規則由 /line-groups API 動態提供，避免前端 hardcode。
function normalizeGroupPrefixes(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item || '').trim().toUpperCase())
      .filter(Boolean);
  }

  if (typeof input === 'string') {
    const raw = input.trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item || '').trim().toUpperCase())
          .filter(Boolean);
      }
    } catch {
      return raw
        .split(',')
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
    }
  }

  return [];
}

function expandShortCode(sc: string, groupPrefixMap: Record<string, string[]>): string[] {
  const m = sc.match(/^([A-Za-z]+)(\d+)$/);
  if (!m) return [sc];
  const prefix = m[1].toUpperCase();
  const num = m[2];
  const mappedPrefixes = groupPrefixMap[prefix];
  if (Array.isArray(mappedPrefixes) && mappedPrefixes.length > 0) {
    return mappedPrefixes.map((p) => `${String(p).toUpperCase()}${num}`);
  }
  return [`${prefix}${num}`];
}

// 展開所有 short_codes 為具體 ad_code 列表
function getAdCodes(shortCodes: string[], groupPrefixMap: Record<string, string[]>): string[] {
  if (!shortCodes || shortCodes.length === 0) return [];
  const result: string[] = [];
  for (const sc of shortCodes) {
    result.push(...expandShortCode(sc, groupPrefixMap));
  }
  return result;
}

// 數字千分位格式
function formatNum(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  return val.toLocaleString('zh-TW');
}

// 百分比格式
function formatPct(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  return `${val.toFixed(1)}%`;
}

// ==================== Status Helpers ====================
type StatusFilter = "all" | "active" | "paused" | "stopped";

function getStatusLabel(status: string): string {
  switch (status) {
    case "active": return "運行中";
    case "paused": return "暫停";
    case "stopped": return "已停止";
    default: return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active": return "text-emerald-500";
    case "paused": return "text-orange-500";
    case "stopped": return "text-red-500";
    default: return "text-gray-500";
  }
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case "active": return "bg-emerald-500";
    case "paused": return "bg-orange-500";
    case "stopped": return "bg-red-500";
    default: return "bg-gray-500";
  }
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return "-";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "剛剛";
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  if (diffHour < 24) return `${diffHour} 小時前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  return date.toLocaleDateString("zh-TW");
}

// ==================== Step Navigation ====================
const FORM_STEPS = [
  { id: "basic", label: "基本資訊", icon: LinkIcon },
  { id: "landing", label: "落地頁", icon: Globe },
  { id: "redirect", label: "分流鏈結", icon: ExternalLink },
  { id: "client", label: "客戶端過濾", icon: Monitor },
  { id: "pixel", label: "像素追蹤", icon: Eye },
  { id: "cloak", label: "Cloak 過濾", icon: Shield },
  { id: "blacklist", label: "黑名單規則", icon: Ban },
];

// ==================== Multi-line Input Component ====================
function MultiLineInput({
  label,
  color,
  values,
  onChange,
  placeholder,
  onBatch,
}: {
  label: string;
  color: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  onBatch: () => void;
}) {
  const addLine = () => onChange([...values, ""]);
  const removeLine = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const updateLine = (i: number, v: string) => {
    const next = [...values];
    next[i] = v;
    onChange(next);
  };
  const moveUp = (i: number) => {
    if (i === 0) return;
    const next = [...values];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  };
  const moveDown = (i: number) => {
    if (i === values.length - 1) return;
    const next = [...values];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-sm font-semibold">
          <span className={`inline-block w-2 h-2 rounded-full ${color}`} />
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onBatch}>
            <ListPlus className="h-3 w-3" />
            批量
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addLine}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {values.length === 0 ? (
        <div
          className="border border-dashed rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:bg-accent/30 transition-colors"
          onClick={addLine}
        >
          點擊新增{label}
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {values.map((v, i) => (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5">
              <span className="text-xs text-muted-foreground w-5 text-center shrink-0 font-mono">{i + 1}</span>
              <Input
                value={v}
                onChange={(e) => updateLine(i, e.target.value)}
                placeholder={placeholder}
                className="font-mono text-sm flex-1 h-8 border-0 shadow-none bg-transparent px-1 focus-visible:ring-0"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => moveUp(i)} disabled={i === 0}>
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => moveDown(i)} disabled={i === values.length - 1}>
                <ArrowDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => removeLine(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== Multi Pixel Input ====================
function MultiPixelInput({
  label,
  tooltip,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  tooltip: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const addLine = () => onChange([...values, ""]);
  const removeLine = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const updateLine = (i: number, v: string) => {
    const next = [...values];
    next[i] = v;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label className="text-sm font-medium">{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      {values.length === 0 ? (
        <Button variant="outline" size="sm" className="w-full h-9 text-xs" onClick={addLine}>
          <Plus className="h-3 w-3 mr-1" />
          新增 {label}
        </Button>
      ) : (
        <div className="space-y-1.5">
          {values.map((v, i) => (
            <div key={i} className="flex items-center gap-1">
              <Input
                value={v}
                onChange={(e) => updateLine(i, e.target.value)}
                placeholder={placeholder}
                className="font-mono text-sm flex-1"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => removeLine(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={addLine}>
            <Plus className="h-3 w-3 mr-1" />
            新增
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== Blacklist Editor ====================
interface BlacklistRule {
  type: string;
  value: string;
  note: string;
}

function BlacklistEditor({
  rules,
  onChange,
}: {
  rules: BlacklistRule[];
  onChange: (rules: BlacklistRule[]) => void;
}) {
  const addRule = () => onChange([...rules, { type: "ip", value: "", note: "" }]);
  const removeRule = (i: number) => onChange(rules.filter((_, idx) => idx !== i));
  const updateRule = (i: number, field: keyof BlacklistRule, value: string) => {
    const next = [...rules];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className="border border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
          尚未新增黑名單規則
        </div>
      ) : (
        <>
          {rules.map((rule, i) => (
            <div key={i} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground mt-2 w-5 text-center">{i + 1}</span>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive mt-0"
                    onClick={() => removeRule(i)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <Select value={rule.type} onValueChange={(v) => updateRule(i, "type", v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip">IP 地址</SelectItem>
                    <SelectItem value="ip_range">IP 範圍 (CIDR)</SelectItem>
                    <SelectItem value="ua">UA 關鍵字</SelectItem>
                    <SelectItem value="country">國家代碼</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={rule.value}
                  onChange={(e) => updateRule(i, "value", e.target.value)}
                  placeholder={rule.type === "ip" ? "1.2.3.4" : rule.type === "ip_range" ? "1.2.3.0/24" : rule.type === "country" ? "US" : "bot"}
                  className="h-8 text-xs font-mono"
                />
                <Input
                  value={rule.note}
                  onChange={(e) => updateRule(i, "note", e.target.value)}
                  placeholder="備註（選填）"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={addRule}>
            <Plus className="h-3 w-3 mr-1" />
            新增規則
          </Button>
        </>
      )}
    </div>
  );
}

// ==================== Main Component ====================
export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pageLimit, setPageLimit] = useState<number>(50);

  // Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState("basic");

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);

  // Batch input
  const [batchType, setBatchType] = useState<"line" | "whatsapp" | "other" | null>(null);
  const [batchText, setBatchText] = useState("");

  // Group filter state
  const [groups, setGroups] = useState<{prefix: string; name: string; label: string}[]>([]);
  const [groupPrefixMap, setGroupPrefixMap] = useState<Record<string, string[]>>({});
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [formGroupName, setFormGroupName] = useState("");
  const [formTag, setFormTag] = useState(""); // 分組對應的 tag（如 AS、AB、AT）
  const [customGroupInput, setCustomGroupInput] = useState("");
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

  // Since datetime filter state
  const [sinceDatetime, setSinceDatetime] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // External data
  const [moneyTemplates, setMoneyTemplates] = useState<Template[]>([]);
  const [safeTemplates, setSafeTemplates] = useState<Template[]>([]);
  const [allDomains, setAllDomains] = useState<DomainInfo[]>([]);
  const [systemLinks, setSystemLinks] = useState<Array<{ label: string; value: string; bound?: boolean }>>([]);

  // ==================== Form Fields ====================
  // Basic
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formStatus, setFormStatus] = useState("active");

  // Landing page
  const [formCountry, setFormCountry] = useState("");
  const [formMoneyPageId, setFormMoneyPageId] = useState("");
  const [formSafePageType, setFormSafePageType] = useState("template");
  const [formSafePageId, setFormSafePageId] = useState("");
  const [formSafePageAction, setFormSafePageAction] = useState("show_content");
  const [formSafePageContent, setFormSafePageContent] = useState("");
  const [formSafeCountry, setFormSafeCountry] = useState("");
  const [formDetailsId, setFormDetailsId] = useState(""); // details page ID (returned by backend)
  const [formDetailsUrl, setFormDetailsUrl] = useState(""); // generated details page URL

  // Redirect links
  const [formLineLinks, setFormLineLinks] = useState<string[]>([]);
  const [formWhatsappLinks, setFormWhatsappLinks] = useState<string[]>([]);
  const [formOtherLinks, setFormOtherLinks] = useState<string[]>([]);

  // LINE link generator
  const [lineGroupsList, setLineGroupsList] = useState<{id: number; name: string; code: string; tags: string; ad_prefixes?: string[]}[]>([]);
  const [allLineConfigs, setAllLineConfigs] = useState<{id: number; tag: string; name: string; group_name: string}[]>([]);
  const [ungroupedOAs, setUngroupedOAs] = useState<{id: number; tag: string; name: string}[]>([]);
  const [selectedLineGroupId, setSelectedLineGroupId] = useState<string>("");
  const [lineAdNumber, setLineAdNumber] = useState("");
  const [generatedLineLinks, setGeneratedLineLinks] = useState<{tag: string; url: string}[]>([]);

  // Strategy
  const [formLinkStrategy, setFormLinkStrategy] = useState("round_robin_ip_sticky");
  const [formPageTestStrategy, setFormPageTestStrategy] = useState("none");
  const [formVariants, setFormVariants] = useState<any[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  // Client filtering
  const [formAllowDesktop, setFormAllowDesktop] = useState(true);
  const [formAllowMobile, setFormAllowMobile] = useState(true);
  const [formResidentialOnly, setFormResidentialOnly] = useState(true);

  // Pixel
  const [formPixelTk, setFormPixelTk] = useState<string[]>([]);
  const [formPixelFb, setFormPixelFb] = useState<string[]>([]);
  const [formPixelGa, setFormPixelGa] = useState<string[]>([]);
  const [formGoogleAd, setFormGoogleAd] = useState("");
  const [formGoogleConv, setFormGoogleConv] = useState("");

  // [REMOVED] allPixels / formAdPixelIds / formBcPixelIds — 像素已全面從 pixel_groups 動態讀取
  // CAPI 養像素：從 pixel_groups 按 tag 查詢的 BM 組資料
  const [capiPixelGroups, setCapiPixelGroups] = useState<any[]>([]);

  // Cloak filtering (multi-select arrays)
  const [formRequireFbclid, setFormRequireFbclid] = useState(false);
  const [formCloakCountry, setFormCloakCountry] = useState<string[]>([]);
  const [formCloakLang, setFormCloakLang] = useState<string[]>([]);
  const [formCloakOs, setFormCloakOs] = useState<string[]>([]);
  const [formCloakOsVersion, setFormCloakOsVersion] = useState<string[]>([]);
  const [formCloakRegion, setFormCloakRegion] = useState<string>("");
  const [formCloakTrafficSource, setFormCloakTrafficSource] = useState<string[]>([]);

  // Blacklist
  const [formBlacklistRules, setFormBlacklistRules] = useState<BlacklistRule[]>([]);

  // LIFF / LINE OA
  const [formLiffId, setFormLiffId] = useState("");
  const [formLineOaId, setFormLineOaId] = useState("");
  const [formAdCode, setFormAdCode] = useState("");
  const [formLiffLinks, setFormLiffLinks] = useState<string[]>([]);
  const [liffOptions, setLiffOptions] = useState<{id: string; tag: string; name: string; label: string; theme: string; liff_id: string; line_oa_id: string; group_name: string}[]>([]);

  // ==================== Load External Data ====================
  // 初始化時載入所有資料
  useEffect(() => {
    (async () => {
      try {
        const tplRes = await fetchTemplates({ limit: 200 });
        if (tplRes.success) {
          const items = tplRes.data?.items || tplRes.data || [];
          setMoneyTemplates(items.filter((t: any) => t.type === "money_page"));
          setSafeTemplates(items.filter((t: any) => t.type === "safe_page"));
        }
      } catch { /* ignore */ }
      try {
        const domRes = await fetchDomains();
        if (domRes.success) {
          const domains = domRes.data?.domains || domRes.data || [];
          setAllDomains(domains);
          // BUG-009 fix: 用 domains 資料生成 systemLinks，取代不存在的 /system/links API
          const links = domains
            .filter((d: DomainInfo) => d.status === 'active')
            .map((d: DomainInfo) => ({
              label: d.domain,
              value: d.domain,
              bound: !!(d.bindedCampaignId || d.campaign_id),
            }));
          setSystemLinks(links);
        }
      } catch { /* ignore */ }
      // [REMOVED] fetchPixels() — 像素已全面從 pixel_groups 動態讀取
      try {
        const liffRes = await fetchLiffOptions();
        if (liffRes.success) {
          setLiffOptions(liffRes.data || []);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  // [REMOVED] editOpen fetchPixels — 像素已全面從 pixel_groups 動態讀取

  // Domains: active ones, mark occupied
  const domainOptions = useMemo(() => {
    return allDomains
      .filter((d) => d.status === "active")
      .map((d) => ({
        domain: d.domain,
        occupied: d.campaign_id ? true : false,
        occupiedBySelf: editItem ? d.campaign_id === editItem.id : false,
      }));
  }, [allDomains, editItem]);

  // Group money_page templates by country
  const templatesByCountry = useMemo(() => {
    const map: Record<string, Template[]> = {};
    for (const t of moneyTemplates) {
      const c = t.country || "OTHER";
      if (!map[c]) map[c] = [];
      map[c].push(t);
    }
    return map;
  }, [moneyTemplates]);

  const availableCountries = useMemo(() => Object.keys(templatesByCountry), [templatesByCountry]);

  const filteredMoneyTemplates = useMemo(() => {
    if (!formCountry) return [];
    return templatesByCountry[formCountry] || [];
  }, [formCountry, templatesByCountry]);

  // LIFF links excluded from UI count (data preserved for API compatibility)
  const totalLinks = formLineLinks.filter(Boolean).length + formWhatsappLinks.filter(Boolean).length + formOtherLinks.filter(Boolean).length;

  // ==================== Status Counts ====================
  const statusCounts = useMemo(() => {
    const counts = { all: campaigns.length, active: 0, paused: 0, stopped: 0 };
    for (const c of campaigns) {
      if (c.status === "active") counts.active++;
      else if (c.status === "paused") counts.paused++;
      else if (c.status === "stopped") counts.stopped++;
    }
    return counts;
  }, [campaigns]);

  // ==================== Filtered Campaigns ====================
  const filteredCampaigns = useMemo(() => {
    if (statusFilter === "all") return campaigns;
    return campaigns.filter(c => c.status === statusFilter);
  }, [campaigns, statusFilter]);

  // ==================== Group Filtered Campaigns ====================
  const groupFilteredCampaigns = useMemo(() => {
    let result = [...filteredCampaigns];
    
    // Apply group filter: match by prefix, name, or label
    if (groupFilter) {
      const matchGroup = groups.find(g => g.prefix === groupFilter);
      result = result.filter(c => {
        const gn = (c as any).group_name || '';
        if (!gn) return false;
        if (matchGroup) {
          // Match if group_name equals prefix, name, or label
          return gn === matchGroup.prefix || gn === matchGroup.name || gn === matchGroup.label;
        }
        return gn === groupFilter;
      });
    }

    // Apply sorting
    result.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls
      if (valA === null || valA === undefined) valA = sortField === "status" ? "" : -Infinity;
      if (valB === null || valB === undefined) valB = sortField === "status" ? "" : -Infinity;

      // Status sort order: active > paused > stopped
      if (sortField === "status") {
        const order: Record<string, number> = { active: 0, paused: 1, stopped: 2 };
        const oA = order[valA] ?? 99;
        const oB = order[valB] ?? 99;
        return sortDir === "asc" ? oA - oB : oB - oA;
      }

      if (typeof valA === "string") {
        return sortDir === "asc" 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }
      
      return sortDir === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [filteredCampaigns, groupFilter, sortField, sortDir]);

  // ==================== Load Campaigns ====================
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 同時載入廣告列表和統計數據
      const sinceParam = sinceDatetime ? new Date(sinceDatetime).toISOString() : undefined;
      const [res, metricsRes] = await Promise.allSettled([
        fetchCampaigns({ search: appliedSearch || undefined, limit: pageLimit }),
        fetchCampaignMetrics(sinceParam),
      ]);

      if (res.status === 'fulfilled' && res.value.success) {
        const metricsMap = (metricsRes.status === 'fulfilled' && metricsRes.value.success)
          ? (metricsRes.value.data || {})
          : {};

        // Normalize all campaigns and merge metrics
        const normalized = (res.value.data || []).map((c: any) => {
          const m = metricsMap[c.id] || {};
          return {
            ...c,
            customer_links: parseArr(c.customer_links),
            line_links: parseArr(c.line_links),
            whatsapp_links: parseArr(c.whatsapp_links),
            other_links: parseArr(c.other_links),
            blacklist_rules: parseArr(c.blacklist_rules),
            short_codes: parseArr(c.short_codes),
            // Merge metrics (null = no data, 0 = zero)
            impressions: m.impressions ?? null,
            clicks: m.clicks ?? null,
            attributed: m.attributed ?? null,
            ctr: m.ctr ?? null,
            cvr: m.cvr ?? null,
          };
        });
        setCampaigns(normalized);
      }
    } catch {
      toast.error("載入廣告列表失敗");
    } finally {
      setLoading(false);
    }
  }, [appliedSearch, pageLimit, sinceDatetime]);

  // 只刷新統計數據，不重新載入廣告列表
  const refreshMetricsOnly = useCallback(async () => {
    try {
      const sinceParam = sinceDatetime ? new Date(sinceDatetime).toISOString() : undefined;
      const metricsRes = await fetchCampaignMetrics(sinceParam);
      if (metricsRes.success) {
        const metricsMap = metricsRes.data || {};
        setCampaigns(prev => prev.map(c => {
          const m = metricsMap[c.id] || {};
          return {
            ...c,
            impressions: m.impressions ?? null,
            clicks: m.clicks ?? null,
            attributed: m.attributed ?? null,
            ctr: m.ctr ?? null,
            cvr: m.cvr ?? null,
          };
        }));
      }
    } catch {
      // 靜默失敗，不影響用戶體驗
    }
  }, [sinceDatetime]);

  // Load groups directly from line_groups, keeping ad_prefixes in sync with LINE 管理中心
  const loadLineGroups = useCallback(async () => {
    try {
      const res = await fetchLineGroups();
      if (!res.success) return;

      const rawGroups = Array.isArray(res.data) ? res.data : [];
      const normalizedGroups = rawGroups.map((item: any) => {
        const code = String(item.code || item.group_prefix || item.name || '').trim().toUpperCase();
        const tags = String(item.tags || '').trim();
        const derivedFromTags = normalizeGroupPrefixes(tags);
        const adPrefixes = normalizeGroupPrefixes(item.ad_prefixes);

        return {
          id: Number(item.id),
          name: String(item.name || item.group_name || ''),
          code,
          tags,
          ad_prefixes: adPrefixes.length > 0
            ? adPrefixes
            : (derivedFromTags.length > 0 ? derivedFromTags : (code ? [code] : [])),
        };
      });

      setLineGroupsList(normalizedGroups);
      setGroups(normalizedGroups.map((group: {id: number; name: string; code: string; tags: string; ad_prefixes: string[]}) => ({
        prefix: group.code || group.name,
        name: group.name,
        label: group.name,
      })));

      const prefixMap: Record<string, string[]> = {};
      normalizedGroups.forEach((group: {id: number; name: string; code: string; tags: string; ad_prefixes: string[]}) => {
        const key = String(group.code || group.name || '').toUpperCase();
        if (!key) return;
        prefixMap[key] = group.ad_prefixes && group.ad_prefixes.length > 0
          ? group.ad_prefixes.map((prefix: string) => String(prefix).toUpperCase())
          : [key];
      });
      setGroupPrefixMap(prefixMap);
    } catch (err) {
      console.error('Failed to load line groups', err);
    }
  }, []);

  useEffect(() => { 
    loadData(); 
    loadLineGroups(); 
    // loadLiffOptions(); // Removed as per task 3 cleanup
    // loadPixelGroups(); // Removed as per task 3 cleanup
    refreshSystemLinks();
  }, [loadData, loadLineGroups]);

  // 每 30 秒自動刷新統計數據
  useEffect(() => {
    // 清除舊的 interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // 設定新的 interval
    intervalRef.current = setInterval(() => {
      refreshMetricsOnly();
    }, 30000);
    // cleanup: 頁面離開時清除
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshMetricsOnly]);

  // Load ungrouped OAs for LINE link generator
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLineConfigs();
        if (res.success) {
          const all = res.data || [];
          // Store all line_config records for dynamic LINE link generation
          setAllLineConfigs(all.map((oa: any) => ({ id: oa.id, tag: String(oa.tag || ''), name: String(oa.name || ''), group_name: String(oa.group_name || '') })));
          const ungrouped = all.filter((oa: any) => !oa.group_name || oa.group_name === 'N系列');
          setUngroupedOAs(ungrouped.map((oa: any) => ({ id: oa.id, tag: oa.tag, name: oa.name })));
        }
      } catch {}
    })();
  }, []);

  // Auto-generate LINE links when group/OA or ad number changes
  // Dynamically fetch OA tags from line_config API by group_name,
  // instead of relying on static group.tags / group.code / group.ad_prefixes.
  useEffect(() => {
    if (!selectedLineGroupId || !lineAdNumber.trim()) {
      setGeneratedLineLinks([]);
      return;
    }

    const num = lineAdNumber.trim().padStart(2, "0");

    // Helper: build links from tag list
    const buildLinks = (tags: string[]) => {
      const uniqueTags = Array.from(new Set(tags.map(t => t.trim()).filter(Boolean)));
      if (uniqueTags.length === 0) {
        setGeneratedLineLinks([]);
        return;
      }
      const links = uniqueTags.map(tag => {
        const tagLower = tag.toLowerCase();
        const tagUpper = tag.toUpperCase();
        return {
          tag: tagUpper,
          url: `https://${tagLower}.freshpathlab.com/${tagUpper}${num}`
        };
      });
      setGeneratedLineLinks(links);
      setFormLineLinks(links.map(l => l.url));
    };

    // Single OA (prefixed with "oa-")
    if (selectedLineGroupId.startsWith("oa-")) {
      const oaId = parseInt(selectedLineGroupId.replace("oa-", ""), 10);
      const oa = ungroupedOAs.find(o => o.id === oaId);
      if (oa && oa.tag) {
        buildLinks([oa.tag]);
      } else {
        setGeneratedLineLinks([]);
      }
      return;
    }

    // Group: dynamically query line_config API for OA tags in this group
    const gId = selectedLineGroupId.startsWith("group-") ? selectedLineGroupId.replace("group-", "") : selectedLineGroupId;
    const group = lineGroupsList.find(g => String(g.id) === gId);

    // Determine the group name to query:
    // - If found in lineGroupsList, use group.name
    // - If lineGroupsList not yet loaded (race condition), try allLineConfigs to derive group name
    // - Fallback: use the raw gId as group name (works when gId is the group name itself)
    let groupName: string | null = null;
    if (group) {
      groupName = group.name;
    } else if (allLineConfigs.length > 0) {
      // Try to find any line_config whose group_name matches gId (case-insensitive)
      const match = allLineConfigs.find(c => c.group_name && c.group_name.toUpperCase() === gId.toUpperCase());
      if (match) groupName = match.group_name;
    }
    // Final fallback: if gId looks like a group name (not a pure number), use it directly
    if (!groupName && isNaN(Number(gId))) {
      groupName = gId;
    }
    if (!groupName) {
      setGeneratedLineLinks([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetchLineConfigsByGroup(groupName!);
        if (cancelled) return;
        if (res.success) {
          const oaTags = (res.data || [])
            .map((oa: any) => String(oa.tag || '').trim())
            .filter(Boolean);
          buildLinks(oaTags);
        } else {
          setGeneratedLineLinks([]);
        }
      } catch {
        if (!cancelled) setGeneratedLineLinks([]);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedLineGroupId, lineAdNumber, lineGroupsList, ungroupedOAs, allLineConfigs]);

  // 每次 modal 開啟時重新查詢 systemLinks，確保「已綁定」狀態是最新的
  // BUG-009 fix: 改用 fetchDomains 取代不存在的 fetchSystemLinks
  const refreshSystemLinks = useCallback(async () => {
    try {
      const domRes = await fetchDomains();
      if (domRes.success) {
        const domains = domRes.data?.domains || domRes.data || [];
        setAllDomains(domains);
        const links = domains
          .filter((d: DomainInfo) => d.status === 'active')
          .map((d: DomainInfo) => ({
            label: d.domain,
            value: d.domain,
            bound: !!(d.bindedCampaignId || d.campaign_id),
          }));
        setSystemLinks(links);
      }
    } catch { /* ignore */ }
  }, []);

  // editOpen 從 false → true 時（每次開啟 Modal）都重新查詢
  useEffect(() => {
    if (editOpen) {
      refreshSystemLinks();
    }
  }, [editOpen, refreshSystemLinks]);

  const handleSearch = () => setAppliedSearch(searchText);
  const handleReset = () => { setSearchText(""); setAppliedSearch(""); };

  // ==================== Form Helpers ====================
  const resetForm = () => {
    setFormName(""); setFormTitle(""); setFormLink(""); setFormStatus("active");
    setFormCountry(""); setFormMoneyPageId("");
    setFormSafePageType("template"); setFormSafePageId("");
    setFormSafePageAction("show_content"); setFormSafePageContent("");
    setFormSafeCountry("");
    setFormDetailsId(""); setFormDetailsUrl("");
    setFormLineLinks([]); setFormWhatsappLinks([]); setFormOtherLinks([]);
    setSelectedLineGroupId(""); setLineAdNumber(""); setGeneratedLineLinks([]);
    setFormLinkStrategy("round_robin_ip_sticky");
    setFormPageTestStrategy("none"); setFormVariants([]);
    setFormAllowDesktop(true); setFormAllowMobile(true); setFormResidentialOnly(true);
    setFormPixelTk([]); setFormPixelFb([]); setFormPixelGa([]);
    setFormGoogleAd(""); setFormGoogleConv("");
    // [REMOVED] setFormAdPixelIds / setFormBcPixelIds
    setFormRequireFbclid(false);
    setFormCloakCountry([]); setFormCloakLang([]); setFormCloakOs([]); setFormCloakOsVersion([]); setFormCloakRegion(""); setFormCloakTrafficSource([]);
    setFormBlacklistRules([]);
    setFormGroupName("");
    setFormTag("");
    setCustomGroupInput("");
    setFormLiffId("");
    setFormLineOaId("");
    setFormAdCode("");
    setFormLiffLinks([]);
    setActiveStep("basic");
  };

  const handleAdd = () => {
    setEditItem(null);
    resetForm();
    setEditOpen(true);
  };

  const parsePixelStr = (val: string): string[] => {
    if (!val) return [];
    return val.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  };

  const handleEdit = async (campaign: Campaign) => {
    try {
      const res = await fetchCampaign(campaign.id);
      const d = res.success ? res.data : campaign;
      setEditItem(d);
      setFormName(d.name || "");
      setFormTitle(d.title || "");
      setFormLink(d.link || "");
      setFormStatus(d.status || "active");
      setFormCountry(d.country || "");
      setFormMoneyPageId(d.money_page_id || d.template_id || "");
      setFormSafePageType(d.safe_page_type || "template");
      setFormSafePageId(d.safe_page_id || "");
      if (d.safe_page_id) {
        const matchedTemplate = safeTemplates.find(t => t.id === d.safe_page_id);
        if (matchedTemplate && matchedTemplate.country) {
          setFormSafeCountry(matchedTemplate.country);
        } else {
          setFormSafeCountry("");
        }
      } else {
        setFormSafeCountry("");
      }
      setFormSafePageAction(d.safe_page_action || "");
      setFormSafePageContent(d.safe_page_content || "");
      setFormDetailsId(d.details_id || "");
      setFormDetailsUrl(d.details_url || "");
      setFormLineLinks(parseArr(d.line_links));
      setFormWhatsappLinks(parseArr(d.whatsapp_links));
      setFormOtherLinks(parseArr(d.other_links));
      // Hydrate LINE link generator if line_links exist
      setSelectedLineGroupId(""); setLineAdNumber("");
      const existingLineLinks = parseArr(d.line_links);
      if (existingLineLinks.length > 0) {
        // Try to parse tag and URL from existing links
        const parsed = existingLineLinks.map(url => {
          const m = url.match(/\/([A-Z][A-Z0-9]*?)(\d{2,3})$/);
          return { tag: m ? m[1] : '', url, num: m ? m[2] : '' };
        });
        setGeneratedLineLinks(parsed.map(p => ({ tag: p.tag, url: p.url })));
        // Try to find matching group and ad number
        if (parsed[0]?.tag && parsed[0]?.num) {
          const matchGroup = lineGroupsList.find(g => {
            const tags = g.tags.split(',').map(t => t.trim().toUpperCase());
            return tags.includes(parsed[0].tag);
          });
          if (matchGroup) {
            setSelectedLineGroupId(`group-${matchGroup.id}`);
            setLineAdNumber(parsed[0].num);
          } else {
            // Try matching ungrouped single OA
            const matchOA = ungroupedOAs.find(oa => oa.tag.toUpperCase() === parsed[0].tag);
            if (matchOA) {
              setSelectedLineGroupId(`oa-${matchOA.id}`);
              setLineAdNumber(parsed[0].num);
            }
          }
        }
      } else {
        setGeneratedLineLinks([]);
      }
      setFormLinkStrategy(d.link_strategy || d.routing_strategy || "random");
      setFormPageTestStrategy(d.page_test_strategy || "none");
      // Load variants if editing
      if (d.id) {
        setVariantsLoading(true);
        fetchCampaignVariants(d.id)
          .then(res => { if (res.success) setFormVariants(res.data || []); })
          .catch(() => {})
          .finally(() => setVariantsLoading(false));
      }
      setFormAllowDesktop(d.allow_desktop !== 0);
      setFormAllowMobile(d.allow_mobile !== 0);
      setFormResidentialOnly(!!d.residential_only || !!d.require_residential);
      setFormPixelTk(parsePixelStr(d.pixel_tk));
      setFormPixelFb(parsePixelStr(d.pixel_fb));
      setFormPixelGa(parsePixelStr(d.pixel_ga));
      setFormGoogleAd(d.pixel_google_ad || "");
      setFormGoogleConv(d.pixel_google_conv || "");
      // [REMOVED] ad_pixels / bc_pixels — 像素已全面從 pixel_groups 動態讀取
      setFormRequireFbclid(!!d.require_fbclid);
      setFormCloakCountry(csvToArrWithAlias(d.cloak_country));
      setFormCloakLang(csvToArrWithAlias(d.cloak_lang, d.cloak_language));
      setFormCloakOs(csvToArrWithAlias(d.cloak_os));
      setFormCloakOsVersion(csvToArrWithAlias(d.cloak_os_version));
      setFormCloakRegion((d.cloak_region || "").trim());
      setFormCloakTrafficSource(csvToArrWithAlias(d.cloak_traffic_source));
      setFormBlacklistRules(parseArr(d.blacklist_rules).map((r: any) =>
        typeof r === "object" ? r : { type: "ip", value: String(r), note: "" }
      ));
      setFormGroupName(d.group_name || "");
      // 設定 tag：優先用 d.tag，其次從 groups 中找到對應的 prefix
      setFormTag(d.tag || "");
      setCustomGroupInput("");
      setFormLiffId(d.liff_id || "");
      setFormLineOaId(d.line_oa_id || "");
      setFormAdCode(d.ad_code || "");
      setFormLiffLinks(parseArr(d.liff_links));
      setActiveStep("basic");
      setEditOpen(true);
    } catch {
      toast.error("載入廣告數據失敗");
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("請輸入廣告編號"); return; }
    if (!formLink) { toast.error("請選擇鏈接"); return; }
    setSaving(true);
    try {
      const filteredLiffLinks = formLiffLinks.filter(Boolean);
      const allRedirectLinks = [...filteredLiffLinks, ...formLineLinks.filter(Boolean), ...formWhatsappLinks.filter(Boolean), ...formOtherLinks.filter(Boolean)];
      const cloakPayload = {
        cloak_country: arrToCsv(formCloakCountry),
        cloak_lang: arrToCsv(formCloakLang),
        cloak_language: arrToCsv(formCloakLang),
        cloak_os: arrToCsv(formCloakOs),
        cloak_os_version: arrToCsv(formCloakOsVersion),
        cloak_region: formCloakRegion.trim(),
        cloak_traffic_source: arrToCsv(formCloakTrafficSource),
        require_fbclid: formRequireFbclid,
      };
      // 如果安全頁動作是「顯示內容」且有富文本內容，自動建立/更新 details 頁面
      let detailsId = formDetailsId;
      let detailsUrl = formDetailsUrl;
      if (formSafePageAction === 'show_content' && formSafePageContent) {
        try {
          if (detailsId) {
            // 更新已有的 details 頁面
            const res = await updateDetails(detailsId, {
              content: formSafePageContent,
              title: formTitle || '詳情頁面',
            });
            if (res.success && res.data?.url) {
              detailsUrl = res.data.url;
              setFormDetailsUrl(detailsUrl);
            }
          } else {
            // 建立新的 details 頁面
            const res = await createDetails({
              content: formSafePageContent,
              campaign_id: editItem?.id || '',
              title: formTitle || '詳情頁面',
            });
            if (res.success && res.data?.id) {
              detailsId = res.data.id;
              detailsUrl = res.data.url;
              setFormDetailsId(detailsId);
              setFormDetailsUrl(detailsUrl);
            }
          }
        } catch {
          // details 頁面建立失敗不阻止廣告保存
          console.warn('Failed to create/update details page');
        }
      }

      // 將 details URL 轉換為使用廣告域名（而非後端 API 域名）
      let finalDetailsUrl = detailsUrl || '';
      if (detailsId && formLink) {
        finalDetailsUrl = `https://${formLink}/details/${detailsId}`;
      }

      const payload: Record<string, unknown> = {
        name: formName,
        title: formTitle,
        link: formLink,
        country: formCountry,
        template_id: formMoneyPageId,
        money_page_id: formMoneyPageId,
        safe_page_id: formSafePageId,
        safe_page_type: formSafePageType,
        safe_page_action: formSafePageAction,
        safe_page_content: formSafePageContent,
        details_id: detailsId || undefined,
        details_url: finalDetailsUrl || undefined,
        status: formStatus,
        line_links: formLineLinks.filter(Boolean),
        whatsapp_links: formWhatsappLinks.filter(Boolean),
        other_links: formOtherLinks.filter(Boolean),
        customer_links: allRedirectLinks,
        link_strategy: formLinkStrategy,
        routing_strategy: formLinkStrategy,
        page_test_strategy: formPageTestStrategy,
        allow_desktop: formAllowDesktop,
        allow_mobile: formAllowMobile,
        residential_only: formResidentialOnly,
        require_residential: formResidentialOnly,
        pixel_tk: formPixelTk.filter(Boolean).join(","),
        pixel_fb: formPixelFb.filter(Boolean).join(","),
        pixel_ga: formPixelGa.filter(Boolean).join(","),
        pixel_google_ad: formGoogleAd,
        pixel_google_conv: formGoogleConv,
        // [REMOVED] ad_pixels / bc_pixels — 像素已全面從 pixel_groups 動態讀取
        ...cloakPayload,
        blacklist_rules: formBlacklistRules,
        group_name: formGroupName === "__custom__" ? customGroupInput : formGroupName,
        tag: formTag || undefined,
        liff_id: formLiffId,
        line_oa_id: formLineOaId,
        ad_code: formTitle.trim() || formAdCode,
        liff_links: filteredLiffLinks,
      };
      if (editItem) {
        await updateCampaign(editItem.id, payload);
        toast.success("廣告更新成功");
      } else {
        await createCampaign(payload);
        toast.success("廣告新增成功");
      }
      setEditOpen(false);
      loadData();
      loadLineGroups();
      // 儲存成功後立即刷新 systemLinks，確保下次開啟 Modal 時「已綁定」狀態是最新的
      refreshSystemLinks();
    } catch (err: unknown) {
      // 優先顯示後端回傳的錯誤訊息（如域名已被綁定），否則顯示通用提示
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const backendMsg = axiosErr?.response?.data?.error;
      toast.error(backendMsg || "儲存失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCampaign(deleteId);
      toast.success("廣告已刪除");
      setDeleteOpen(false);
      setDeleteId(null);
      loadData();
    } catch {
      toast.error("刪除失敗");
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === "active" ? "paused" : "active";
    try {
      await updateCampaign(campaign.id, { ...campaign, status: newStatus });
      toast.success(newStatus === "active" ? "廣告已啟用" : "廣告已停用");
      loadData();
    } catch {
      toast.error("狀態切換失敗");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(groupFilteredCampaigns.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectCampaign = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchDelete = async () => {
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await deleteCampaign(id);
      }
      toast.success(`已刪除 ${ids.length} 個廣告`);
      setBatchDeleteOpen(false);
      setSelectedIds(new Set());
      loadData();
    } catch {
      toast.error("批量刪除失敗");
    }
  };

  const handleBatchPause = async () => {
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        const campaign = campaigns.find(c => c.id === id);
        if (campaign && campaign.status === "active") {
          await updateCampaign(id, { ...campaign, status: "paused" });
        }
      }
      toast.success(`已暫停 ${ids.length} 個廣告`);
      setSelectedIds(new Set());
      loadData();
    } catch {
      toast.error("批量暫停失敗");
    }
  };

  // Batch helpers
  const openBatch = (type: "line" | "whatsapp" | "other") => {
    const current = type === "line" ? formLiffLinks : type === "whatsapp" ? formWhatsappLinks : formOtherLinks;
    setBatchText(current.join("\n"));
    setBatchType(type);
  };

  const confirmBatch = () => {
    const links = batchText.split(/[\n,]/).map(l => l.trim()).filter(Boolean);
    if (batchType === "line") setFormLiffLinks(links);
    else if (batchType === "whatsapp") setFormWhatsappLinks(links);
    else if (batchType === "other") setFormOtherLinks(links);
    setBatchType(null);
    setBatchText("");
  };

  // ==================== Tab Filter Items ====================
  const tabItems: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: statusCounts.all },
    { key: "active", label: "運行中", count: statusCounts.active },
    { key: "paused", label: "暫停", count: statusCounts.paused },
    { key: "stopped", label: "已停止", count: statusCounts.stopped },
  ];

  // ==================== Render ====================
  // Full-page edit/add mode
  if (editOpen) {
    return (
      <div className="min-h-screen bg-white">
        {/* ===== 頂部導航列 ===== */}
        <div className="sticky top-0 z-30 bg-background border-b">
          <div className="flex items-center justify-between px-3 sm:px-8 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setEditOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">{editItem ? "編輯廣告" : "新增廣告"}</h1>
              {editItem && (
                <span className="text-sm text-muted-foreground">#{editItem.title || editItem.name || editItem.id}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>取消</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editItem ? "更新" : "新增"}
              </Button>
            </div>
          </div>
        </div>

        {/* ===== 主體內容 ===== */}
        <div className="px-3 sm:px-8 py-4 sm:py-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16">
          {/* ===== 左欄 ===== */}
          <div className="space-y-6">

            {/* ── 基本資訊 ── */}
            <div className="space-y-4">

                <div className="space-y-1">
                  <Label className="text-sm font-medium">鏈接 <span className="text-destructive">*</span></Label>
                  <Select value={formLink} onValueChange={setFormLink}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="選擇推廣鏈結..." />
                    </SelectTrigger>
                    <SelectContent>
                      {systemLinks.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">暫無可用域名</div>
                      )}
                      {systemLinks.map((l) => {
                        const isBoundByOther = l.bound && l.value !== formLink;
                        const isBoundBySelf = l.bound && l.value === formLink;
                        return (
                          <SelectItem key={l.value} value={l.value} disabled={isBoundByOther} className={isBoundByOther ? "opacity-40 cursor-not-allowed" : ""}>
                            <span className="flex items-center gap-2">
                              {l.label}
                              {l.bound && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isBoundBySelf ? "text-blue-600 bg-blue-50" : "text-muted-foreground bg-muted"}`}>
                                  {isBoundBySelf ? "當前綁定" : "已綁定"}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">一個廣告只能綁定一條域名</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">廣告編號 <span className="text-destructive">*</span></Label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="例如 AS02、N2001" className="h-9 text-sm font-mono" />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">備註</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="例如：蘇主金、素材A女性25-35" className="h-9 text-sm" />
                </div>

                <div className="space-y-1">
                  <Label className="text-sm font-medium">分組</Label>
                  <Select
                    value={formGroupName || "__none__"}
                    onValueChange={(v) => {
                      if (v === "__custom__") { setFormGroupName("__custom__"); setFormTag(""); setCustomGroupInput(""); }
                      else if (v === "__none__") { setFormGroupName(""); setFormTag(""); setCustomGroupInput(""); }
                      else { setFormGroupName(v); const matched = groups.find(g => g.label === v || g.name === v || g.prefix === v); setFormTag(matched?.prefix || ""); setCustomGroupInput(""); }
                    }}
                    onOpenChange={(open) => { if (!open) setGroupSearch(""); }}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="選擇分組..." /></SelectTrigger>
                    <SelectContent className="min-w-[200px]" position="popper">
                      <div className="px-2 py-1.5 border-b">
                        <input className="w-full text-sm px-2 py-1 rounded border border-input bg-background outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground" placeholder="搜尋分組..." value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} onKeyDown={(e) => e.stopPropagation()} autoComplete="off" />
                      </div>
                      <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
                      {!groupSearch && <SelectItem value="__none__">無分組</SelectItem>}
                      {!groupSearch && <SelectSeparator />}
                      {(() => { const mainGroups = groups.filter(g => !g.prefix.startsWith('N') && (!groupSearch || g.label.toLowerCase().includes(groupSearch.toLowerCase()) || g.prefix.toLowerCase().includes(groupSearch.toLowerCase()))); return mainGroups.length > 0 ? (<SelectGroup><SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">主要分組</SelectLabel>{mainGroups.map((g) => (<SelectItem key={g.prefix} value={g.label}>{g.label}</SelectItem>))}</SelectGroup>) : null; })()}
                      {(() => { const nGroups = groups.filter(g => g.prefix.startsWith('N') && (!groupSearch || g.label.toLowerCase().includes(groupSearch.toLowerCase()) || g.prefix.toLowerCase().includes(groupSearch.toLowerCase()))); return nGroups.length > 0 ? (<><SelectSeparator /><SelectGroup><SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">N 系列</SelectLabel>{nGroups.map((g) => (<SelectItem key={g.prefix} value={g.label}>{g.label}</SelectItem>))}</SelectGroup></>) : null; })()}
                      {!groupSearch && <SelectSeparator />}
                      {!groupSearch && <SelectItem value="__custom__">新增分組...</SelectItem>}
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                {formGroupName === "__custom__" && (
                  <div className="space-y-1">
                    <Label className="text-sm">新分組名稱</Label>
                    <Input value={customGroupInput} onChange={(e) => setCustomGroupInput(e.target.value)} placeholder="輸入新的分組名稱" className="h-9 text-sm" />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  <Label className="text-sm font-medium">啟用狀態</Label>
                  <Switch checked={formStatus === "active"} onCheckedChange={(checked) => setFormStatus(checked ? "active" : "paused")} />
                  <span className="text-xs text-muted-foreground">{formStatus === "active" ? "啟用中" : "已停用"}</span>
                </div>
            </div>

            {/* ── 推廣頁設定 ── */}
            <div className="space-y-3">
                <div className="flex items-end gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">國家/地區</Label>
                    <Select
                      value={formCountry}
                      onValueChange={(v) => { setFormCountry(v); setFormMoneyPageId(""); }}
                    >
                      <SelectTrigger className="h-8 text-sm w-auto min-w-[140px] rounded-md px-3"><SelectValue placeholder="選擇國家..." /></SelectTrigger>
                      <SelectContent>
                        {availableCountries.length === 0 ? (
                          <SelectItem value="_none" disabled>尚無推廣頁模板</SelectItem>
                        ) : (
                          availableCountries.map((c) => (
                            <SelectItem key={c} value={c}>
                              {COUNTRY_MAP[c] || c} ({templatesByCountry[c].length} 個模板)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {formPageTestStrategy === "none" ? (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">推廣頁模板</Label>
                    <Select value={formMoneyPageId} onValueChange={setFormMoneyPageId} disabled={!formCountry}>
                      <SelectTrigger className="h-8 text-sm w-auto min-w-[120px] rounded-md px-3"><SelectValue placeholder={formCountry ? "選擇模板..." : "請先選擇國家"} /></SelectTrigger>
                      <SelectContent>
                        {filteredMoneyTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name || t.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  ) : (
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">推廣頁模板</Label>
                    <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">由下方測試模板決定（主模板作為備用）</p>
                  </div>
                  )}
                </div>
            </div>

            {/* ── 落地頁 A/B 測試 ── */}
            <div className="space-y-3">
              <Separator />
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500" />
                  落地頁測試策略
                </Label>
                <Select value={formPageTestStrategy} onValueChange={setFormPageTestStrategy}>
                  <SelectTrigger className="h-8 text-sm w-auto min-w-[200px] rounded-md px-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">關閉（使用主要模板）</SelectItem>
                    <SelectItem value="weight">權重分配（手動設定）</SelectItem>
                    <SelectItem value="thompson">自動優化（Thompson Sampling）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formPageTestStrategy === "none" && "使用上方選擇的主要推廣頁模板"}
                  {formPageTestStrategy === "weight" && "按權重比例分配流量到不同模板，手動查看數據決定"}
                  {formPageTestStrategy === "thompson" && "系統自動把更多流量分配給表現好的模板"}
                </p>
              </div>

              {formPageTestStrategy !== "none" && (
                <div className="space-y-2 border rounded-md p-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">測試模板列表</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value=""
                        onValueChange={async (templateId) => {
                          if (!editItem?.id) { toast.error("請先儲存廣告再設定測試"); return; }
                          if (formVariants.find(v => v.template_id === templateId)) {
                            toast.error("此模板已加入測試"); return;
                          }
                          try {
                            const res = await createVariant(editItem.id, { template_id: templateId });
                            if (res.success) {
                              const refreshRes = await fetchCampaignVariants(editItem.id);
                              if (refreshRes.success) setFormVariants(refreshRes.data || []);
                              toast.success("已加入測試");
                            } else {
                              toast.error(res.error || "加入失敗");
                            }
                          } catch { toast.error("加入失敗"); }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-auto min-w-[140px]">
                          <SelectValue placeholder="+ 加入模板" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredMoneyTemplates.map((t) => {
                            const alreadySelected = formVariants.some((v: any) => v.template_id === t.id);
                            return (
                              <SelectItem key={t.id} value={t.id} disabled={alreadySelected}>
                                {t.name || t.id}{alreadySelected ? " ✓ 已選" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {variantsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : formVariants.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      {editItem ? "尚未加入測試模板，請從上方選擇" : "請先儲存廣告，再設定測試模板"}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {formVariants.map((v: any) => (
                        <div key={v.id} className="flex items-center justify-between bg-background rounded px-2 py-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{v.template_name || v.variant_name || v.template_id}</span>
                            <Badge variant="outline" className="text-xs">
                              {v.impression_count || 0} 曝光 / {v.click_count || 0} 點擊
                            </Badge>
                            {v.impression_count > 0 && (
                              <Badge variant={Math.round((v.click_count || 0) / v.impression_count * 100) >= 20 ? "default" : "secondary"}
                                className={Math.round((v.click_count || 0) / v.impression_count * 100) >= 20 ? "bg-green-600 text-xs" : "text-xs"}>
                                CTR {Math.round((v.click_count || 0) / v.impression_count * 100)}%
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {((v.impression_count || 0) > 0 || (v.click_count || 0) > 0) && (
                              <Button
                                variant="ghost" size="sm" className="h-6 px-1.5 text-xs text-orange-500 hover:text-orange-600"
                                onClick={async () => {
                                  if (!editItem?.id) return;
                                  if (!confirm(`確定要重置「${v.template_name || v.template_id}」的計數器嗎？\n此操作不可逆！`)) return;
                                  try {
                                    const res = await resetSingleVariant(editItem.id, v.id);
                                    if (res.success) {
                                      const refreshRes = await fetchCampaignVariants(editItem.id);
                                      if (refreshRes.success) setFormVariants(refreshRes.data || []);
                                      toast.success("計數器已重置");
                                    } else {
                                      toast.error(res.error || "重置失敗");
                                    }
                                  } catch { toast.error("重置失敗"); }
                                }}
                              >
                                重置
                              </Button>
                            )}
                            <Button
                              variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={async () => {
                                if (!editItem?.id) return;
                                try {
                                  await deleteVariant(editItem.id, v.id);
                                  setFormVariants(prev => prev.filter(pv => pv.id !== v.id));
                                  toast.success("已移除");
                                } catch { toast.error("移除失敗"); }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* ── 分流鏈結 ── */}
            <div className="space-y-4">
                <Separator />

                {/* LINE 鏈結產生器 */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    LINE 鏈結
                    {generatedLineLinks.length > 0 && (
                      <span className="text-xs font-normal text-muted-foreground ml-1">{generatedLineLinks.length}</span>
                    )}
                  </Label>
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs text-muted-foreground">選擇分組</Label>
                      <Select value={selectedLineGroupId} onValueChange={setSelectedLineGroupId}>
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="選擇分組或 OA..." />
                        </SelectTrigger>
                        <SelectContent>
                          {lineGroupsList.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">分組</SelectLabel>
                              {lineGroupsList.map(g => (
                                <SelectItem key={`group-${g.id}`} value={`group-${g.id}`}>
                                  {g.name}（{g.code || '—'}）
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {ungroupedOAs.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">單一 OA（未分組 / N系列）</SelectLabel>
                              {ungroupedOAs.map(oa => (
                                <SelectItem key={`oa-${oa.id}`} value={`oa-${oa.id}`}>
                                  {oa.tag.toUpperCase()} / {oa.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-[80px] space-y-1">
                      <Label className="text-xs text-muted-foreground">廣告編號</Label>
                      <Input
                        value={lineAdNumber}
                        onChange={e => setLineAdNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="01"
                        className="font-mono h-9 text-sm"
                        maxLength={3}
                      />
                    </div>
                  </div>
                  {generatedLineLinks.length > 0 ? (
                    <div className="border rounded-lg divide-y bg-background">
                      {generatedLineLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2">
                          <span className="font-mono text-xs text-muted-foreground w-[32px] shrink-0 text-center">{link.tag}</span>
                          <Input
                            value={link.url}
                            onChange={e => {
                              const next = [...generatedLineLinks];
                              next[i] = { ...next[i], url: e.target.value };
                              setGeneratedLineLinks(next);
                              setFormLineLinks(next.map(l => l.url));
                            }}
                            className="font-mono text-sm flex-1 h-8 border-0 shadow-none bg-transparent px-2 focus-visible:ring-0"
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2 gap-1"
                              onClick={() => window.open(link.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                              測試開啟
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                navigator.clipboard.writeText(link.url);
                                toast.success(`已複製 ${link.tag} 連結`);
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground gap-1"
                          onClick={() => {
                            const all = generatedLineLinks.map(l => l.url).join('\n');
                            navigator.clipboard.writeText(all);
                            toast.success('已複製所有 LINE 連結');
                          }}
                        >
                          <Copy className="h-3 w-3" /> 複製全部
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed rounded-md p-3 text-center text-sm text-muted-foreground">
                      選擇分組並輸入廣告編號後自動產生 LINE 連結
                    </div>
                  )}
                </div>

                <Separator />

                <MultiLineInput
                  label="WhatsApp 鏈接"
                  color="bg-emerald-500"
                  values={formWhatsappLinks}
                  onChange={setFormWhatsappLinks}
                  placeholder="https://wa.me/886..."
                  onBatch={() => openBatch("whatsapp")}
                />

                <Separator />

                <MultiLineInput
                  label="其他鏈結"
                  color="bg-blue-500"
                  values={formOtherLinks}
                  onChange={setFormOtherLinks}
                  placeholder="https://t.me/... 或其他鏈結"
                  onBatch={() => openBatch("other")}
                />

                <Separator className="my-3" />

                {/* 分配策略 */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">分配策略</Label>
                  <div className="flex items-center gap-4 flex-wrap">
                    <RadioGroup value={formLinkStrategy.replace("_ip_ua_sticky", "").replace("_ip_sticky", "")} onValueChange={(v) => {
                      const suffix = formLinkStrategy.includes("ip_ua_sticky") ? "_ip_ua_sticky" : formLinkStrategy.includes("ip_sticky") ? "_ip_sticky" : "";
                      setFormLinkStrategy(suffix ? `${v}${suffix}` : v);
                    }} className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="random" id="strategy-random" />
                        <Label htmlFor="strategy-random" className="cursor-pointer text-sm">隨機打開</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="round_robin" id="strategy-rr" />
                        <Label htmlFor="strategy-rr" className="cursor-pointer text-sm">輪替打開</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RadioGroupItem value="group_round_robin" id="strategy-grr" />
                        <Label htmlFor="strategy-grr" className="cursor-pointer text-sm">分組輪替</Label>
                      </div>
                    </RadioGroup>
                    <div className="flex items-center gap-1.5 border-l pl-4">
                      <Checkbox id="strategy-ip" checked={formLinkStrategy.includes("ip_sticky") || formLinkStrategy.includes("ip_ua_sticky")} onCheckedChange={(checked) => { const base = formLinkStrategy.replace("_ip_ua_sticky", "").replace("_ip_sticky", "").replace("ip_ua_sticky", "").replace("ip_sticky", "") || "random"; setFormLinkStrategy(checked ? `${base}_ip_sticky` : base); }} />
                      <Label htmlFor="strategy-ip" className="cursor-pointer text-sm">固定分配</Label>
                    </div>
                    {(formLinkStrategy.includes("ip_sticky") || formLinkStrategy.includes("ip_ua_sticky")) && (
                      <div className="flex items-center gap-1.5">
                        <select className="text-sm border rounded px-2 py-1" value={formLinkStrategy.includes("ip_ua_sticky") ? "ip_ua_sticky" : "ip_sticky"} onChange={(e) => { const base = formLinkStrategy.replace("_ip_ua_sticky", "").replace("_ip_sticky", "").replace("ip_ua_sticky", "").replace("ip_sticky", "") || "random"; setFormLinkStrategy(`${base}_${e.target.value}`); }}>
                          <option value="ip_sticky">IP 固定</option>
                          <option value="ip_ua_sticky">IP+UA 固定</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
            </div>



            {/* ── 像素追蹤 ── */}
            <div className="space-y-4">




                {/* CAPI 養像素提示區塊（預設收合） */}
                {(() => {
                  const effectiveGroupName = formGroupName === "__custom__" ? customGroupInput : formGroupName;
                  const matchedGroup = groups.find(g => g.label === effectiveGroupName || g.prefix === effectiveGroupName || g.name === effectiveGroupName);
                  const currentTag = matchedGroup?.prefix || '';
                  if (!currentTag) return null;
                  return (
                    <details className="rounded-lg border bg-amber-50/60 border-amber-200 group">
                      <summary className="flex items-center gap-2 p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                        <ChevronRight className="h-4 w-4 text-amber-600 transition-transform group-open:rotate-90" />
                        <Info className="h-4 w-4 text-amber-600" />
                        <h4 className="font-semibold text-sm text-amber-800">
                          CAPI 養像素（自動連動）
                        </h4>
                        <Badge variant="outline" className="ml-1 text-xs font-mono bg-amber-100 border-amber-300">{currentTag}</Badge>
                      </summary>
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-xs text-amber-700">
                          根據此廣告的 Tag <Badge variant="outline" className="mx-1 text-xs font-mono bg-amber-100 border-amber-300">{currentTag}</Badge>，系統會自動對以下 BM 組發送 CAPI 事件：
                        </p>
                        <CapiPixelGroupsHint tag={currentTag} />
                        <p className="text-[11px] text-amber-600 italic">
                          ↑ 以上像素由系統自動從「像素庫」讀取，無需手動設定。
                        </p>
                      </div>
                    </details>
                  );
                })()}

                <Separator />

                {/* 舊版像素欄位（向下相容） */}
                <details className="group">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                    <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                    進階：手動輸入像素（TK / FB / GA / Google）
                  </summary>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MultiPixelInput
                      label="TK 像素 ID"
                      tooltip="TikTok Pixel ID，用於追蹤 TikTok 廣告轉化。可新增多個。"
                      values={formPixelTk}
                      onChange={setFormPixelTk}
                      placeholder="XXXXXXXXXXXXXXX"
                    />

                    <MultiPixelInput
                      label="FB 像素 ID"
                      tooltip="Facebook Pixel ID，用於追蹤 Facebook 廣告轉化。可新增多個。"
                      values={formPixelFb}
                      onChange={setFormPixelFb}
                      placeholder="XXXXXXXXXXXXXXX"
                    />

                    <MultiPixelInput
                      label="GA 追蹤 ID"
                      tooltip="Google Analytics 追蹤 ID，用於網站流量分析。可新增多個。"
                      values={formPixelGa}
                      onChange={setFormPixelGa}
                      placeholder="G-XXXXXXXXXX"
                    />

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-sm font-medium">Google 廣告 ID</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">Google Ads 帳戶 ID，格式為 AW-XXXXXXXXX</TooltipContent>
                          </Tooltip>
                        </div>
                        <Input value={formGoogleAd} onChange={(e) => setFormGoogleAd(e.target.value)} placeholder="AW-XXXXXXXXX" className="font-mono text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-sm font-medium">Google 轉化 ID</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">Google Ads 轉化追蹤 ID</TooltipContent>
                          </Tooltip>
                        </div>
                        <Input value={formGoogleConv} onChange={(e) => setFormGoogleConv(e.target.value)} placeholder="轉化 ID" className="font-mono text-sm" />
                      </div>
                    </div>
                  </div>
                </details>
            </div>

            {/* ── 黑名單規則 ── */}
            <div className="space-y-3">

                <p className="text-xs text-muted-foreground">命中規則的訪客看安全頁（支援 IP、UA、國家代碼）</p>
                <BlacklistEditor rules={formBlacklistRules} onChange={setFormBlacklistRules} />
            </div>
          </div>

          {/* ===== 右欄 ===== */}
          <div className="space-y-5">

            {/* ── Cloak 過濾 ── */}
            <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-semibold">客戶群</Label>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Checkbox id="allow-desktop" checked={formAllowDesktop} onCheckedChange={(v) => setFormAllowDesktop(!!v)} />
                      <Label htmlFor="allow-desktop" className="cursor-pointer text-sm flex items-center gap-1">
                        <Monitor className="h-3.5 w-3.5" />電腦端
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox id="allow-mobile" checked={formAllowMobile} onCheckedChange={(v) => setFormAllowMobile(!!v)} />
                      <Label htmlFor="allow-mobile" className="cursor-pointer text-sm flex items-center gap-1">
                        <Smartphone className="h-3.5 w-3.5" />移動端
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox id="residential-only" checked={formResidentialOnly} onCheckedChange={(v) => setFormResidentialOnly(!!v)} />
                      <Label htmlFor="residential-only" className="cursor-pointer text-sm flex items-center gap-1 text-amber-700">
                        <Shield className="h-3.5 w-3.5" />僅住宅 IP
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground">留空 = 不限制，不符合條件的訪客看安全頁</p>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">允許瀏覽器語言</Label>
                    <MultiSelect
                      options={CLOAK_LANG_OPTIONS}
                      selected={formCloakLang}
                      onChange={setFormCloakLang}
                      placeholder="留空則不限制語言"
                      searchPlaceholder="搜尋語言..."
                      maxDisplay={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">允許作業系統</Label>
                    <MultiSelect
                      options={CLOAK_OS_OPTIONS}
                      selected={formCloakOs}
                      onChange={setFormCloakOs}
                      placeholder="留空則不限制系統"
                      searchPlaceholder="搜尋 OS..."
                      maxDisplay={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">允許作業系統版本</Label>
                    <MultiSelect
                      options={CLOAK_OS_VERSION_OPTIONS}
                      selected={formCloakOsVersion}
                      onChange={setFormCloakOsVersion}
                      placeholder="留空則不限制版本"
                      searchPlaceholder="搜尋 OS 版本..."
                      maxDisplay={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">允許國家</Label>
                    <MultiSelect
                      options={CLOAK_COUNTRY_OPTIONS}
                      selected={formCloakCountry}
                      onChange={setFormCloakCountry}
                      placeholder="留空則不限制國家"
                      searchPlaceholder="搜尋國家..."
                      maxDisplay={3}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">允許省州</Label>
                    <Input
                      value={formCloakRegion}
                      onChange={(e) => setFormCloakRegion(e.target.value)}
                      placeholder="先選擇國家，留空則不限制省州"
                      className="font-mono text-sm h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-sm font-medium">允許流量來源</Label>
                    <MultiSelect
                      options={CLOAK_TRAFFIC_OPTIONS}
                      selected={formCloakTrafficSource}
                      onChange={setFormCloakTrafficSource}
                      placeholder="留空則不限制來源"
                      searchPlaceholder="搜尋流量來源..."
                      maxDisplay={3}
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <Label htmlFor="require-fbclid" className="cursor-pointer text-sm font-medium">強制要求 fbclid</Label>
                    <Switch
                      id="require-fbclid"
                      checked={formRequireFbclid}
                      onCheckedChange={(checked) => setFormRequireFbclid(checked)}
                    />
                  </div>
            </div>

            {/* ── 安全頁設定 ── */}
            <div className="space-y-4">
                <Separator />

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">安全頁類型</Label>
                      <RadioGroup value={formSafePageType} onValueChange={setFormSafePageType} className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="template" id="sp-template" />
                          <Label htmlFor="sp-template" className="cursor-pointer text-sm">落地頁模板</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="redirect" id="sp-redirect" />
                          <Label htmlFor="sp-redirect" className="cursor-pointer text-sm">安全頁鏈接</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* 安全落地頁模板選擇 */}
                    {formSafePageType === "template" && (
                      <div className="flex items-end gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">國家/地區</Label>
                          <Select
                            value={formSafeCountry}
                            onValueChange={(v) => { setFormSafeCountry(v); }}
                          >
                            <SelectTrigger className="h-8 text-sm w-auto min-w-[140px] rounded-md px-3"><SelectValue placeholder="選擇國家..." /></SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const countries = Array.from(new Set(safeTemplates.map(t => t.country).filter(Boolean)));
                                return countries.length === 0 ? (
                                  <SelectItem value="_none" disabled>尚無安全頁模板</SelectItem>
                                ) : (
                                  countries.map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {COUNTRY_MAP[c] || c} ({safeTemplates.filter(t => t.country === c).length} 個模板)
                                    </SelectItem>
                                  ))
                                );
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">安全頁模板</Label>
                          <Select value={formSafePageId} onValueChange={setFormSafePageId} disabled={!formSafeCountry}>
                            <SelectTrigger className="h-8 text-sm w-auto min-w-[120px] rounded-md px-3"><SelectValue placeholder={formSafeCountry ? "選擇模板..." : "請先選擇國家"} /></SelectTrigger>
                            <SelectContent>
                              {safeTemplates
                                .filter(t => t.country === formSafeCountry)
                                .map((t) => (
                                  <SelectItem key={t.id} value={t.id}>{t.name || t.id}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {formSafePageType === "redirect" && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">安全頁鏈接 URL</Label>
                        <Textarea
                          value={formSafePageContent}
                          onChange={(e) => setFormSafePageContent(e.target.value)}
                          placeholder="https://example.com"
                          className="font-mono text-sm min-h-16"
                          rows={2}
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-1.5">
                      <Label className="text-sm font-semibold">安全頁點擊</Label>
                      <RadioGroup value={formSafePageAction} onValueChange={setFormSafePageAction} className="flex gap-4">
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="show_content" id="spa-content" />
                          <Label htmlFor="spa-content" className="cursor-pointer text-sm">顯示內容</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="safe_link" id="spa-link" />
                          <Label htmlFor="spa-link" className="cursor-pointer text-sm">安全鏈接</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {formSafePageAction === "show_content" && (
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">安全頁彈出內容</Label>
                        <p className="text-xs text-muted-foreground">
                          安全頁按鈕點擊後跳轉到生成的 LINK，顯示以下內容
                        </p>
                        <RichEditor
                          value={formSafePageContent}
                          onChange={setFormSafePageContent}
                          placeholder="在此編輯安全頁彈出內容..."
                          height={600}
                        />
                        {formDetailsUrl && (
                          <div className="mt-2 p-2 bg-muted/50 rounded-md border">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium">Details URL：</span>
                              <a
                                href={formDetailsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline font-mono flex-1 truncate"
                              >
                                {formDetailsUrl}
                              </a>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => { navigator.clipboard.writeText(formDetailsUrl); toast.success('已複製 URL'); }}
                              >
                                複製
                              </Button>
                            </div>
                          </div>
                        )}
                        {!formDetailsUrl && formSafePageContent && (
                          <p className="text-xs text-muted-foreground">儲存後自動生成 Details 頁面 URL</p>
                        )}
                      </div>
                    )}

                    {formSafePageAction === "safe_link" && (
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">安全鏈接 URL</Label>
                        <Input
                          value={formSafePageContent}
                          onChange={(e) => setFormSafePageContent(e.target.value)}
                          placeholder="https://example.com"
                          className="font-mono text-sm"
                        />
                      </div>
                    )}
            </div>
          </div>
        </div>
        </div>

        {/* ===== 底部固定操作列 ===== */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
          <div className="px-3 sm:px-8 py-3 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editItem ? "更新" : "新增"}
            </Button>
          </div>
        </div>

        {/* ==================== 批量輸入 Dialog ==================== */}
        <Dialog open={!!batchType} onOpenChange={(open) => { if (!open) setBatchType(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                批量輸入{batchType === "whatsapp" ? " WhatsApp" : "其他"}鏈接
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">每行一個鏈接（也支持逗號分隔），貼上後點擊確認</p>
              <Textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder={"https://wa.me/886xxx\nhttps://t.me/xxx"}
              />
              <p className="text-xs text-muted-foreground">
                目前 {batchText.split(/[\n,]/).filter(l => l.trim()).length} 個鏈接
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchType(null)}>取消</Button>
              <Button onClick={confirmBatch}>確認</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">廣告列表</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            管理所有廣告活動，共 {campaigns.length} 筆廣告
          </p>
        </div>
        <Button onClick={handleAdd} className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
          <Plus className="h-4 w-4 mr-2" />
          新建廣告
        </Button>
      </div>

      {/* Tab Filters */}
      <div className="flex items-center gap-1 border-b">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setStatusFilter(tab.key); setSelectedIds(new Set()); }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              statusFilter === tab.key
                ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
              statusFilter === tab.key
                ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                : "bg-muted text-muted-foreground"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + Active Group Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜尋廣告名稱或域名..."
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={statusFilter !== "all" ? "default" : "outline"}
              className={`gap-2 ${statusFilter !== "all" ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white" : ""}`}
            >
              <Filter className="h-4 w-4" />
              篩選
              {statusFilter !== "all" && <span className="ml-1 bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">1</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">篩選條件</h4>
                {statusFilter !== "all" && (
                  <button
                    onClick={() => { setStatusFilter("all"); setFilterPopoverOpen(false); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    清除
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">按狀態篩選</label>
                <div className="flex flex-col gap-1">
                  {([
                    { key: "all", label: "全部" },
                    { key: "active", label: "運行中" },
                    { key: "paused", label: "暫停" },
                    { key: "stopped", label: "已停止" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setStatusFilter(opt.key); setFilterPopoverOpen(false); }}
                      className={`text-left text-sm px-3 py-1.5 rounded-md transition-colors ${
                        statusFilter === opt.key ? "bg-[#7C3AED] text-white" : "hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {statusFilter !== "all" && (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-[#7C3AED] text-white">
            {statusFilter === "active" ? "運行中" : statusFilter === "paused" ? "暫停" : "已停止"}
            <button
              onClick={() => setStatusFilter("all")}
              className="ml-1 hover:opacity-70 transition-opacity"
              title="清除篩選"
            >
              ×
            </button>
          </span>
        )}
        {groupFilter && (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700">
            {groups.find(g => g.prefix === groupFilter)?.label || groupFilter}
            <button
              onClick={() => setGroupFilter("")}
              className="ml-1 hover:opacity-70 transition-opacity"
              title="清除分組篩選"
            >
              ×
            </button>
          </span>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="datetime-local"
            value={sinceDatetime}
            onChange={(e) => setSinceDatetime(e.target.value)}
            className="h-8 px-2 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            title="統計起始時間"
          />
          {sinceDatetime && (
            <button
              onClick={() => setSinceDatetime("")}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="清除時間篩選"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="text-muted-foreground mx-1">|</span>
          <span className="text-sm text-muted-foreground whitespace-nowrap">每頁顯示</span>
          <Select
            value={String(pageLimit)}
            onValueChange={(v) => setPageLimit(Number(v))}
          >
            <SelectTrigger className="w-20 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20 筆</SelectItem>
              <SelectItem value="50">50 筆</SelectItem>
              <SelectItem value="100">100 筆</SelectItem>
              <SelectItem value="200">200 筆</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-[#7C3AED]">
            已選擇 {selectedIds.size} 筆廣告
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
              onClick={handleBatchPause}
            >
              <Pause className="h-3.5 w-3.5 mr-1" />
              批量暫停
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setBatchDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              批量刪除
            </Button>
            <button
              className="text-sm text-muted-foreground hover:text-foreground ml-2"
              onClick={() => setSelectedIds(new Set())}
            >
              取消選擇
            </button>
          </div>
        </div>
      )}

      {/* Campaign Table */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : groupFilteredCampaigns.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暫無廣告，點擊「新建廣告」開始建立</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedIds.size > 0 && selectedIds.size === groupFilteredCampaigns.length}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      />
                    </TableHead>
                    <TableHead className="w-[100px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("group_name")}>
                      <div className="flex items-center gap-1">分組 {sortField === "group_name" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="min-w-[160px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("name")}>
                      <div className="flex items-center gap-1">廣告名稱 {sortField === "name" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="min-w-[150px]">上架時間</TableHead>
                    <TableHead className="min-w-[120px]">推廣頁</TableHead>
                    <TableHead className="min-w-[120px]">安全頁</TableHead>
                    <TableHead className="w-[80px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("status")}>
                      <div className="flex items-center gap-1">狀態 {sortField === "status" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="w-[100px] text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("impressions")}>
                      <div className="flex items-center justify-end gap-1">瀏覽 {sortField === "impressions" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="w-[100px] text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("clicks")}>
                      <div className="flex items-center justify-end gap-1">按鈕 {sortField === "clicks" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="w-[100px] text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("attributed")}>
                      <div className="flex items-center justify-end gap-1">歸因 {sortField === "attributed" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="w-[90px] text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("ctr")}>
                      <div className="flex items-center justify-end gap-1">按鈕率 {sortField === "ctr" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="w-[90px] text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort("cvr")}>
                      <div className="flex items-center justify-end gap-1">轉化率 {sortField === "cvr" && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</div>
                    </TableHead>
                    <TableHead className="w-[100px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupFilteredCampaigns.map((c) => {
                          const adCodes = getAdCodes(c.short_codes || [], groupPrefixMap);
                          const moneyPageName = moneyTemplates.find(t => t.id === c.money_page_id)?.name
                            || safeTemplates.find(t => t.id === c.money_page_id)?.name
                            || c.money_page_id || '-';
                          const safePageName = safeTemplates.find(t => t.id === c.safe_page_id)?.name
                            || c.safe_page_id || '-';
                          return (
                    <TableRow key={c.id} className={selectedIds.has(c.id) ? "bg-purple-50/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={(checked) => handleSelectCampaign(c.id, !!checked)}
                        />
                      </TableCell>
                      {/* 1. 分組（可點擊篩選） */}
                      <TableCell>
                        {(c as any).group_name ? (
                          <button
                            onClick={() => setGroupFilter((c as any).group_name)}
                            className="inline-block text-xs px-2 py-0.5 rounded-full border border-[#7C3AED]/40 text-[#7C3AED] bg-purple-50 hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
                            title={`篩選：${(c as any).group_name}`}
                          >
                            {(c as any).group_name}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {/* 2. 廣告名稱 */}
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground text-sm">{c.name || "-"}</p>
                          {(c.link || c.theme) ? (
                            <button
                              className="text-xs text-muted-foreground hover:text-[#7C3AED] transition-colors cursor-pointer text-left"
                              title="點擊複製網址"
                              onClick={() => {
                                const url = `https://${c.link || c.theme}`;
                                navigator.clipboard.writeText(url).then(() => {
                                  toast.success(`已複製：${url}`, { duration: 2000 });
                                }).catch(() => {
                                  toast.error("複製失敗，請手動複製");
                                });
                              }}
                            >
                              https://{c.link || c.theme}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      {/* 2. 過審時間 */}
                      <TableCell>
                        <div className="flex items-center gap-2 group">
                          <input
                            type="datetime-local"
                            value={c.approved_at ? new Date(new Date(c.approved_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                            onChange={async (e) => {
                              const newVal = e.target.value ? new Date(e.target.value).toISOString() : null;
                              try {
                                await updateCampaignApprovedAt(c.id, newVal);
                                toast.success("上架時間已更新");
                                // 重新取得數據以更新介面
                                const metricsRes = await fetchCampaignMetrics(sinceDatetime ? new Date(sinceDatetime).toISOString() : undefined);
                                if (metricsRes.success) {
                                  setCampaigns(prev => prev.map(item => {
                                    if (item.id === c.id) {
                                      const m = metricsRes.data[c.id] || { impressions: 0, clicks: 0, attributed: 0, ctr: 0, cvr: 0 };
                                      return { ...item, approved_at: newVal, ...m };
                                    }
                                    return item;
                                  }));
                                }
                              } catch (err) {
                                toast.error("更新失敗");
                              }
                            }}
                            className="bg-transparent border-none text-xs text-muted-foreground focus:ring-1 focus:ring-purple-400 rounded px-1 w-[140px] cursor-pointer hover:bg-muted/50"
                          />
                        </div>
                      </TableCell>
                      {/* 4. 推廣頁名稱 */}
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate" title={moneyPageName}>
                        {moneyPageName}
                      </TableCell>
                      {/* 5. 安全頁名稱 */}
                      <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate" title={safePageName}>
                        {safePageName}
                      </TableCell>
                      {/* 6. 狀態（可點擊切換） */}
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleToggleStatus(c)}
                              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/70 transition-colors cursor-pointer group"
                              title={c.status === 'active' ? '點擊暫停' : '點擊啟用'}
                            >
                              <span className={`inline-block w-2 h-2 rounded-full ${getStatusDotColor(c.status)}`} />
                              <span className={`text-xs ${getStatusColor(c.status)}`}>
                                {getStatusLabel(c.status)}
                              </span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">{c.status === 'active' ? '點擊切換為暫停' : '點擊切換為運行中'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      {/* 7. 瀏覽數 */}
                      <TableCell className="text-right font-medium tabular-nums text-sm">
                        {formatNum(c.impressions)}
                      </TableCell>
                      {/* 8. 按鈕點擊 */}
                      <TableCell className="text-right font-medium tabular-nums text-sm">
                        {formatNum(c.clicks)}
                      </TableCell>
                      {/* 9. 歸因數 */}
                      <TableCell className="text-right font-medium tabular-nums text-sm">
                        {formatNum(c.attributed)}
                      </TableCell>
                      {/* 10. 按鈕率 CTR */}
                      <TableCell className="text-right">
                        <span className="text-blue-600 font-medium tabular-nums text-sm">
                          {formatPct(c.ctr)}
                        </span>
                      </TableCell>
                      {/* 11. 轉化率 CVR */}
                      <TableCell className="text-right">
                        <span className="text-emerald-600 font-medium tabular-nums text-sm">
                          {formatPct(c.cvr)}
                        </span>
                      </TableCell>
                      {/* 12. 操作 */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(c)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>編輯</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                navigator.clipboard.writeText(c.link || "");
                                toast.success("鏈結已複製");
                              }}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>複製鏈結</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => { setDeleteId(c.id); setDeleteOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>刪除</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                          );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== 刪除確認 ==================== */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此廣告嗎？</AlertDialogTitle>
            <AlertDialogDescription>刪除後廣告配置將永久移除，相關的短鏈和日誌不受影響。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== 批量刪除確認 ==================== */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除 {selectedIds.size} 個廣告嗎？</AlertDialogTitle>
            <AlertDialogDescription>刪除後廣告配置將永久移除，相關的短鏈和日誌不受影響。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== CAPI 養像素提示元件 ====================
function CapiPixelGroupsHint({ tag }: { tag: string }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tag) { setGroups([]); return; }
    let cancelled = false;
    setLoading(true);
    fetchPixelGroups({ tag }).then(res => {
      if (cancelled) return;
      if (res.success) {
        // 過濾出含有該 tag AD 像素的組
        const matched = (res.data || []).filter((g: any) =>
          (g.ad_pixels || []).some((p: any) => p.tag?.toUpperCase() === tag.toUpperCase())
        );
        setGroups(matched);
      } else {
        setGroups([]);
      }
      setLoading(false);
    }).catch(() => { if (!cancelled) { setGroups([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tag]);

  if (loading) {
    return <div className="text-xs text-amber-600 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> 載入中...</div>;
  }

  if (groups.length === 0) {
    return <div className="text-xs text-amber-600">該 Tag 尚未在像素庫中配置任何 BM 組。</div>;
  }

  return (
    <div className="space-y-2">
      {groups.map((g: any) => {
        const tagAds = (g.ad_pixels || []).filter((p: any) => p.tag?.toUpperCase() === tag.toUpperCase());
        return (
          <div key={g.id} className="bg-white rounded-md border border-amber-200 px-3 py-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{g.bm_name || 'BM-' + g.id}</span>
              <Badge variant="outline" className="text-[10px] bg-amber-50">{g.bm_id || '-'}</Badge>
            </div>
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <div>CAPI Token: <code className="font-mono">{g.capi_token ? g.capi_token.substring(0, 12) + '...' : '-'}</code></div>
              {g.bc_pixel_id && <div>BC 像素: <code className="font-mono">{g.bc_pixel_id}</code> {g.bc_pixel_name && `(${g.bc_pixel_name})`}</div>}
              {tagAds.map((ad: any, i: number) => (
                <div key={i}>AD 像素: <code className="font-mono">{ad.pixel_id}</code> {ad.pixel_name && `(${ad.pixel_name})`}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
