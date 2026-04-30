import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  ExternalLink,
  Info,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createLineConfig,
  createLineGroup,
  deleteLineConfig,
  deleteLineGroup,
  fetchLineConfigs,
  fetchLineGroups,
  updateLineConfig,
  updateLineGroup,
} from "@/lib/api";

/**
 * Design note for this file:
 * 延續現有企業後台風格，不改視覺語言；本次只重構資料與互動邏輯，
 * 讓主列表完整顯示 line_config 欄位、可直接編輯，並修復新增分組對話框操作問題。
 */

type EditableField =
  | "who"
  | "tag"
  | "name"
  | "line"
  | "group_name"
  | "msg"
  | "destination"
  | "routing_strategy"
  | "liff_id"
  | "channel_id"
  | "channel_token";

type SortKey =
  | "id"
  | EditableField
  | "createdAt"
  | "updatedAt";

type SortDirection = "asc" | "desc";

type LineConfigDraft = Partial<Record<EditableField, string>>;

interface LineConfig {
  id: number;
  tag: string;
  line: string;
  name: string;
  who: string;
  msg: string;
  destination: string;
  routing_strategy: string;
  liff_id: string;
  channel_id: string;
  channel_token: string;
  group_name: string;
  createdAt: string;
  updatedAt: string;
}

interface LineGroup {
  id: number;
  name: string;
  code: string;
  tags: string;
  ad_prefixes: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface GroupFormState {
  id?: number;
  name: string;
  code: string;
  adPrefixesText: string;
  description: string;
  selectedOAs: Record<number, LineConfig>;
}

const EMPTY_CONFIG_FORM: Omit<LineConfig, "id" | "createdAt" | "updatedAt"> = {
  tag: "",
  line: "",
  name: "",
  who: "",
  msg: "",
  destination: "",
  routing_strategy: "random",
  liff_id: "",
  channel_id: "",
  channel_token: "",
  group_name: "",
};

const EMPTY_GROUP_FORM: GroupFormState = {
  name: "",
  code: "",
  adPrefixesText: "",
  description: "",
  selectedOAs: {},
};

const EDITABLE_FIELDS: EditableField[] = [
  "who",
  "tag",
  "name",
  "line",
  "group_name",
  "msg",
  "destination",
  "routing_strategy",
  "liff_id",
  "channel_id",
  "channel_token",
];

const MAIN_COLUMNS: Array<{
  key: SortKey;
  label: string;
  width: string;
  editable?: boolean;
  mono?: boolean;
  select?: boolean;
  copyable?: boolean;
  readOnly?: boolean;
  required?: boolean;
}> = [
  { key: "id",              label: "id",              width: "w-[70px]",   readOnly: true },
  { key: "tag",             label: "tag",             width: "w-[118px]",  editable: true, mono: true },
  { key: "name",            label: "name",            width: "w-[200px]",  editable: true },
  { key: "line",            label: "line_oa",         width: "w-[160px]",  editable: true, mono: true },
  { key: "group_name",      label: "group_name",      width: "w-[160px]",  editable: true, select: true },
  { key: "msg",             label: "default_message", width: "w-[200px]",  editable: true },
  { key: "destination",     label: "destination",     width: "w-[250px]",  editable: true, mono: true, copyable: true },
  { key: "liff_id",         label: "liff_id",         width: "w-[170px]",  editable: true, mono: true },
  { key: "channel_id",      label: "channel_id",      width: "w-[170px]",  editable: true, mono: true },
  { key: "channel_token",   label: "channel_token",   width: "w-[270px]",  editable: true, mono: true },
  { key: "routing_strategy",label: "routing",         width: "w-[130px]",  editable: true, mono: true },
  { key: "who",             label: "owner",           width: "w-[120px]",  editable: true },
  { key: "createdAt",       label: "created_at",      width: "w-[175px]",  readOnly: true },
  { key: "updatedAt",       label: "updated_at",      width: "w-[175px]",  readOnly: true },
];

const GROUP_DIALOG_COLUMNS: Array<{
  key: Exclude<EditableField, "group_name">;
  label: string;
  width: string;
  mono?: boolean;
}> = [
  { key: "who", label: "負責人", width: "w-[90px]" },
  { key: "tag", label: "TAG", width: "w-[110px]", mono: true },
  { key: "name", label: "名稱", width: "w-[190px]" },
  { key: "line", label: "LINE OA ID", width: "w-[150px]", mono: true },
  { key: "msg", label: "預設訊息", width: "w-[170px]" },
  { key: "destination", label: "Destination", width: "w-[220px]", mono: true },
  { key: "routing_strategy", label: "Routing", width: "w-[130px]", mono: true },
  { key: "liff_id", label: "LIFF ID", width: "w-[150px]", mono: true },
  { key: "channel_id", label: "Channel ID", width: "w-[150px]", mono: true },
  { key: "channel_token", label: "Channel Token", width: "w-[240px]", mono: true },
];

function normalizeConfig(value: any): LineConfig {
  return {
    id: Number(value?.id || 0),
    tag: String(value?.tag || ""),
    line: String(value?.line || ""),
    name: String(value?.name || ""),
    who: String(value?.who || ""),
    msg: String(value?.msg || ""),
    destination: String(value?.destination || ""),
    routing_strategy: String(value?.routing_strategy || "random"),
    liff_id: String(value?.liff_id || ""),
    channel_id: String(value?.channel_id || ""),
    channel_token: String(value?.channel_token || ""),
    group_name: String(value?.group_name || ""),
    createdAt: String(value?.createdAt || ""),
    updatedAt: String(value?.updatedAt || ""),
  };
}

function normalizeGroup(value: any): LineGroup {
  let adPrefixes: string[] = [];

  if (Array.isArray(value?.ad_prefixes)) {
    adPrefixes = value.ad_prefixes.map((item: unknown) => String(item || "")).filter(Boolean);
  } else if (typeof value?.ad_prefixes === "string") {
    try {
      const parsed = JSON.parse(value.ad_prefixes);
      if (Array.isArray(parsed)) {
        adPrefixes = parsed.map((item) => String(item || "")).filter(Boolean);
      } else if (value.ad_prefixes.trim()) {
        adPrefixes = value.ad_prefixes
          .split(",")
          .map((item: string) => item.trim())
          .filter(Boolean);
      }
    } catch {
      adPrefixes = value.ad_prefixes
        .split(",")
        .map((item: string) => item.trim())
        .filter(Boolean);
    }
  }

  return {
    id: Number(value?.id || 0),
    name: String(value?.name || ""),
    code: String(value?.code || ""),
    tags: String(value?.tags || ""),
    ad_prefixes: adPrefixes,
    description: String(value?.description || ""),
    createdAt: String(value?.createdAt || ""),
    updatedAt: String(value?.updatedAt || ""),
  };
}

function toConfigPayload(config: Partial<LineConfig>) {
  return {
    tag: String(config.tag || "").trim(),
    line: String(config.line || "").trim(),
    name: String(config.name || "").trim(),
    who: String(config.who || "").trim(),
    msg: String(config.msg || "").trim(),
    destination: String(config.destination || "").trim(),
    routing_strategy: String(config.routing_strategy || "random").trim() || "random",
    liff_id: String(config.liff_id || "").trim(),
    channel_id: String(config.channel_id || "").trim(),
    channel_token: String(config.channel_token || "").trim(),
    group_name: String(config.group_name || "").trim(),
  };
}

function parsePrefixes(input: string) {
  return input
    .split(/[\n,]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function formatPrefixes(prefixes: string[]) {
  return prefixes.join(", ");
}

function formatTimestamp(value: string) {
  if (!value) return "—";
  return value.replace("T", " ").replace("Z", "");
}

function generateTagSeed(who: string, code: string) {
  const prefix = String(who || "").trim().charAt(0).toUpperCase() || "N";
  const suffix = String(code || "").trim().toUpperCase();
  return suffix ? `${prefix}${suffix}` : "";
}

async function copyText(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast.success("已複製到剪貼簿");
  } catch {
    toast.error("複製失敗，請手動複製");
  }
}

export default function LineManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);

  const [configs, setConfigs] = useState<LineConfig[]>([]);
  const [groups, setGroups] = useState<LineGroup[]>([]);
  const [drafts, setDrafts] = useState<Record<number, LineConfigDraft>>({});

  const [searchText, setSearchText] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [newConfig, setNewConfig] = useState(EMPTY_CONFIG_FORM);
  const [deleteConfigTarget, setDeleteConfigTarget] = useState<LineConfig | null>(null);

  const [groupManagerOpen, setGroupManagerOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupDeleteTarget, setGroupDeleteTarget] = useState<LineGroup | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(EMPTY_GROUP_FORM);


  async function loadData() {
    setLoading(true);
    try {
      const [configResult, groupResult] = await Promise.all([fetchLineConfigs(), fetchLineGroups()]);

      if (!configResult.success) {
        throw new Error(configResult.error || "LINE 設定載入失敗");
      }
      if (!groupResult.success) {
        throw new Error(groupResult.error || "分組資料載入失敗");
      }

      setConfigs((configResult.data || []).map(normalizeConfig));
      setGroups((groupResult.data || []).map(normalizeGroup));
      setDrafts({});
    } catch (error: any) {
      toast.error(error.message || "資料載入失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const groupStats = useMemo(() => {
    const stats: Record<string, number> = {};
    configs.forEach((config) => {
      const key = config.group_name || "未分組";
      stats[key] = (stats[key] || 0) + 1;
    });
    return stats;
  }, [configs]);

  const groupTabs = useMemo(() => {
    const namedGroups = groups.map((group) => ({ name: group.name, count: groupStats[group.name] || 0 }));
    const hasUngrouped = Boolean(groupStats["未分組"]);
    return hasUngrouped
      ? [...namedGroups, { name: "未分組", count: groupStats["未分組"] }]
      : namedGroups;
  }, [groups, groupStats]);

  const filteredConfigs = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    let next = configs.filter((config) => {
      if (activeGroup === "all") return true;
      if (activeGroup === "未分組") return !config.group_name;
      return config.group_name === activeGroup;
    });

    if (query) {
      next = next.filter((config) =>
        MAIN_COLUMNS.some((column) => {
          const value = String(config[column.key] ?? "").toLowerCase();
          return value.includes(query);
        })
      );
    }

    if (sortKey) {
      next.sort((a, b) => {
        const aValue = String(a[sortKey] ?? "").toLowerCase();
        const bValue = String(b[sortKey] ?? "").toLowerCase();
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return next;
  }, [configs, activeGroup, searchText, sortKey, sortDirection]);

  const availableGroupConfigs = useMemo(() => {
    const currentGroupName = groupForm.name.trim();
    return configs.filter((config) => {
      if (groupForm.selectedOAs[config.id]) return true;
      if (!config.group_name) return true;
      return currentGroupName ? config.group_name === currentGroupName : false;
    });
  }, [configs, groupForm.name, groupForm.selectedOAs]);

  const selectedVisibleCount = useMemo(() => {
    return availableGroupConfigs.filter((config) => groupForm.selectedOAs[config.id]).length;
  }, [availableGroupConfigs, groupForm.selectedOAs]);

  const allVisibleChecked =
    availableGroupConfigs.length > 0 && selectedVisibleCount === availableGroupConfigs.length;
  const someVisibleChecked = selectedVisibleCount > 0 && !allVisibleChecked;

  function toggleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    setSortKey(null);
    setSortDirection("asc");
  }

  function renderSortIcon(key: SortKey) {
    if (sortKey !== key) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  }

  function getMergedConfig(config: LineConfig): LineConfig {
    return {
      ...config,
      ...(drafts[config.id] || {}),
    };
  }

  function isDirty(config: LineConfig) {
    const draft = drafts[config.id];
    if (!draft) return false;

    return EDITABLE_FIELDS.some((field) => String(draft[field] ?? config[field]) !== String(config[field]));
  }

  function updateDraft(id: number, field: EditableField, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  }

  function resetDraft(id: number) {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveRow(config: LineConfig) {
    const merged = getMergedConfig(config);
    if (!merged.tag.trim()) {
      toast.error("TAG 為必填欄位");
      return;
    }

    setSavingRowId(config.id);
    try {
      const result = await updateLineConfig(config.id, toConfigPayload(merged));
      if (!result.success) throw new Error(result.error || "儲存失敗");
      toast.success(`已儲存 ${merged.tag}`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "儲存失敗");
    } finally {
      setSavingRowId(null);
    }
  }

  function updateNewConfig(field: EditableField, value: string) {
    setNewConfig((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreateConfig() {
    if (!newConfig.tag.trim()) {
      toast.error("TAG 為必填欄位");
      return;
    }

    setSaving(true);
    try {
      const result = await createLineConfig(toConfigPayload(newConfig));
      if (!result.success) throw new Error(result.error || "新增失敗");
      toast.success("LINE 帳號已新增");
      setConfigDialogOpen(false);
      setNewConfig(EMPTY_CONFIG_FORM);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "新增失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfig() {
    if (!deleteConfigTarget) return;

    try {
      const result = await deleteLineConfig(deleteConfigTarget.id);
      if (!result.success) throw new Error(result.error || "刪除失敗");
      toast.success("LINE 帳號已刪除");
      setDeleteConfigTarget(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "刪除失敗");
    }
  }

  function openNewGroupDialog() {
    setGroupForm(EMPTY_GROUP_FORM);
    setGroupDialogOpen(true);
  }

  function openEditGroupDialog(group: LineGroup) {
    const selectedOAs = configs
      .filter((config) => config.group_name === group.name)
      .reduce<Record<number, LineConfig>>((acc, config) => {
        acc[config.id] = { ...config };
        return acc;
      }, {});

    setGroupForm({
      id: group.id,
      name: group.name,
      code: group.code,
      adPrefixesText: formatPrefixes(group.ad_prefixes),
      description: group.description,
      selectedOAs,
    });
    setGroupDialogOpen(true);
  }

  function updateGroupForm<K extends keyof GroupFormState>(key: K, value: GroupFormState[K]) {
    setGroupForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleGroupOA(config: LineConfig, checked: boolean) {
    setGroupForm((prev) => {
      const nextSelected = { ...prev.selectedOAs };

      if (checked) {
        nextSelected[config.id] = nextSelected[config.id] || {
          ...config,
          tag: config.tag || generateTagSeed(config.who, prev.code),
        };
      } else {
        delete nextSelected[config.id];
      }

      return { ...prev, selectedOAs: nextSelected };
    });
  }

  function toggleAllVisibleOAs(checked: boolean) {
    setGroupForm((prev) => {
      const nextSelected = { ...prev.selectedOAs };

      if (checked) {
        availableGroupConfigs.forEach((config) => {
          nextSelected[config.id] = nextSelected[config.id] || {
            ...config,
            tag: config.tag || generateTagSeed(config.who, prev.code),
          };
        });
      } else {
        availableGroupConfigs.forEach((config) => {
          delete nextSelected[config.id];
        });
      }

      return { ...prev, selectedOAs: nextSelected };
    });
  }

  function updateSelectedOA(id: number, field: Exclude<EditableField, "group_name">, value: string) {
    setGroupForm((prev) => ({
      ...prev,
      selectedOAs: {
        ...prev.selectedOAs,
        [id]: {
          ...prev.selectedOAs[id],
          [field]: value,
        },
      },
    }));
  }

  async function handleSaveGroup() {
    if (!groupForm.name.trim()) {
      toast.error("分組名稱為必填");
      return;
    }
    if (!groupForm.code.trim()) {
      toast.error("分組代號為必填");
      return;
    }

    setSaving(true);
    try {
      const oaUpdates = Object.values(groupForm.selectedOAs).map((config) => ({
        id: config.id,
        tag: config.tag,
        line: config.line,
        name: config.name,
        who: config.who,
        msg: config.msg,
        destination: config.destination,
        routing_strategy: config.routing_strategy,
        liff_id: config.liff_id,
        channel_id: config.channel_id,
        channel_token: config.channel_token,
      }));

      const payload = {
        name: groupForm.name.trim(),
        code: groupForm.code.trim().toUpperCase(),
        tags: oaUpdates.map((item) => item.tag).filter(Boolean).join(","),
        ad_prefixes: parsePrefixes(groupForm.adPrefixesText),
        description: groupForm.description.trim(),
        oa_updates: oaUpdates,
      };

      const result = groupForm.id
        ? await updateLineGroup(groupForm.id, payload)
        : await createLineGroup(payload);

      if (!result.success) {
        throw new Error(result.error || (groupForm.id ? "更新分組失敗" : "新增分組失敗"));
      }

      toast.success(groupForm.id ? "分組已更新" : "分組已新增");
      setGroupDialogOpen(false);
      setGroupForm(EMPTY_GROUP_FORM);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "儲存分組失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGroup() {
    if (!groupDeleteTarget) return;

    try {
      const result = await deleteLineGroup(groupDeleteTarget.id);
      if (!result.success) throw new Error(result.error || "刪除分組失敗");
      toast.success("分組已刪除");
      setGroupDeleteTarget(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "刪除分組失敗");
    }
  }

  function renderMainCell(config: LineConfig, column: (typeof MAIN_COLUMNS)[number]) {
    const merged = getMergedConfig(config);
    const value = String(merged[column.key] ?? "");

    if (column.key === "id") {
      return (
        <Badge variant="outline" className="font-mono">
          {config.id}
        </Badge>
      );
    }

    if (column.key === "createdAt" || column.key === "updatedAt") {
      return <span className="whitespace-nowrap text-[11px] text-muted-foreground">{formatTimestamp(value)}</span>;
    }

    if (column.key === "group_name") {
      return (
        <Select
          value={value || "__none__"}
          onValueChange={(next) => updateDraft(config.id, "group_name", next === "__none__" ? "" : next)}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="選擇分組" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— 未分組 —</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.name}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    const field = column.key as EditableField;

    if (column.key === "destination") {
      return (
        <div className="flex items-center gap-1">
          <Input
            className={`h-8 text-xs ${column.mono ? "font-mono" : ""}`}
            value={value}
            onChange={(event) => updateDraft(config.id, field, event.target.value)}
          />
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => copyText(value)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      );
    }

    return (
      <Input
        className={`h-8 text-xs ${column.mono ? "font-mono" : ""}`}
        value={value}
        onChange={(event) => updateDraft(config.id, field, event.target.value)}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-x-hidden max-w-full p-3 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">LINE 管理中心</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {configs.length} 個帳號 · {groups.length} 個分組 · 主列表已補齊 line_config 欄位
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setGroupManagerOpen(true)}>
            <Settings2 className="mr-1 h-4 w-4" /> 分組管理
          </Button>
          <Button size="sm" onClick={() => setConfigDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> 新增帳號
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <button
          onClick={() => setActiveGroup("all")}
          className={
            activeGroup === "all"
              ? "font-bold text-foreground underline underline-offset-4"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          全部({configs.length})
        </button>
        {groupTabs.map((group) => (
          <button
            key={group.name}
            onClick={() => setActiveGroup(group.name)}
            className={
              activeGroup === group.name
                ? "font-bold text-foreground underline underline-offset-4"
                : "text-muted-foreground hover:text-foreground"
            }
          >
            {group.name}({group.count})
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="搜尋任一欄位內容..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            className="overflow-x-auto overflow-y-auto"
            style={{ height: "calc(100vh - 280px)", maxWidth: "100%" }}
          >
            <Table className="min-w-[2800px]">
              <TableHeader>
                <TableRow>
                  {MAIN_COLUMNS.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`${column.width} cursor-pointer select-none`}
                      onClick={() => toggleSort(column.key)}
                    >
                      <span className="flex items-center">
                        <span className={column.required ? "text-red-500" : ""}>{column.label}</span>
                        {renderSortIcon(column.key)}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="w-[160px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConfigs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={MAIN_COLUMNS.length + 1} className="py-8 text-center text-muted-foreground">
                      沒有符合條件的 LINE 帳號
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredConfigs.map((config, index) => {
                    const dirty = isDirty(config);
                    const rowSaving = savingRowId === config.id;

                    return (
                      <TableRow key={config.id} className={dirty ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                        {MAIN_COLUMNS.map((column) => (
                          <TableCell key={`${config.id}-${column.key}`} className="align-top">
                            {renderMainCell(config, column)}
                          </TableCell>
                        ))}
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant={dirty ? "default" : "outline"}
                              size="sm"
                              className={`h-8 px-2 text-xs gap-1 ${dirty ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                              disabled={rowSaving}
                              onClick={() => saveRow(config)}
                            >
                              {rowSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              {rowSaving ? "儲存中" : "儲存"}
                            </Button>
                            {dirty && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={rowSaving}
                                onClick={() => resetDraft(config.id)}
                                title="還原"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteConfigTarget(config)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增 LINE 帳號</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>
                  TAG <span className="text-destructive">*</span>
                </Label>
                <Input value={newConfig.tag} onChange={(event) => updateNewConfig("tag", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>LINE OA ID</Label>
                <Input value={newConfig.line} onChange={(event) => updateNewConfig("line", event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>名稱</Label>
                <Input value={newConfig.name} onChange={(event) => updateNewConfig("name", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>負責人</Label>
                <Input value={newConfig.who} onChange={(event) => updateNewConfig("who", event.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>分組</Label>
              <Select
                value={newConfig.group_name || "__none__"}
                onValueChange={(value) => updateNewConfig("group_name", value === "__none__" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇分組" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— 未分組 —</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>預設訊息</Label>
              <Input value={newConfig.msg} onChange={(event) => updateNewConfig("msg", event.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Input value={newConfig.destination} onChange={(event) => updateNewConfig("destination", event.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Routing Strategy</Label>
                <Input
                  value={newConfig.routing_strategy}
                  onChange={(event) => updateNewConfig("routing_strategy", event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>LIFF ID</Label>
                <Input value={newConfig.liff_id} onChange={(event) => updateNewConfig("liff_id", event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Channel ID</Label>
                <Input value={newConfig.channel_id} onChange={(event) => updateNewConfig("channel_id", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Channel Token</Label>
                <Input
                  value={newConfig.channel_token}
                  onChange={(event) => updateNewConfig("channel_token", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <div className="flex items-start gap-2 text-blue-700 dark:text-blue-400">
                <Info className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="text-sm font-medium">請在 LINE Developers Console 確認以下設定：</div>
              </div>
              <div className="space-y-2 pl-7">
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-500">① Webhook URL</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 break-all rounded border border-blue-200 bg-white p-1.5 text-[11px] font-mono dark:border-blue-800 dark:bg-black/40">
                      https://n8n.bexnua.store/webhook/line-follow
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 bg-white dark:bg-black/40"
                      onClick={() => copyText("https://n8n.bexnua.store/webhook/line-follow")}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-500">
                  <span>② 開啟 Use webhook</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateConfig} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              新增
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupManagerOpen} onOpenChange={setGroupManagerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分組管理</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {groups.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">尚無分組</p>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{group.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      代號：<span className="font-mono font-semibold">{group.code || "—"}</span> · 帳號數：{groupStats[group.name] || 0}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      廣告前綴：{formatPrefixes(group.ad_prefixes) || "（未設定）"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditGroupDialog(group)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => setGroupDeleteTarget(group)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGroupManagerOpen(false)}>
              關閉
            </Button>
            <Button onClick={openNewGroupDialog}>
              <Plus className="mr-1 h-4 w-4" /> 新增分組
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="flex max-h-[95vh] w-[95vw] max-w-[95vw] flex-col">
          <DialogHeader>
            <DialogTitle>{groupForm.id ? "編輯分組" : "新增分組"}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 space-y-4 overflow-y-auto py-2 pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  分組名稱 <span className="text-destructive">*</span>
                </Label>
                <Input value={groupForm.name} onChange={(event) => updateGroupForm("name", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>
                  分組代號 <span className="text-destructive">*</span>
                </Label>
                <Input
                  className="font-mono"
                  value={groupForm.code}
                  onChange={(event) => updateGroupForm("code", event.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>廣告前綴規則</Label>
                <Input
                  className="font-mono"
                  value={groupForm.adPrefixesText}
                  onChange={(event) => updateGroupForm("adPrefixesText", event.target.value)}
                  placeholder="例如：JS, CS, LS"
                />
                <p className="text-[10px] text-muted-foreground">可用逗號分隔多個前綴；留空時將以分組代號為主。</p>
              </div>
              <div className="space-y-1.5">
                <Label>說明</Label>
                <Input
                  value={groupForm.description}
                  onChange={(event) => updateGroupForm("description", event.target.value)}
                  placeholder="可選填，用於備註用途"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-semibold">選擇並編輯 LINE OA 帳號</Label>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    可勾選帳號後直接修改欄位；儲存分組時，所選帳號會同步更新到 line_config。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">可選 {availableGroupConfigs.length}</Badge>
                  <Badge variant="secondary">已選 {Object.keys(groupForm.selectedOAs).length}</Badge>
                </div>
              </div>

              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table className="min-w-[2350px]">
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[52px] text-center">
                          <Checkbox
                            checked={allVisibleChecked ? true : someVisibleChecked ? "indeterminate" : false}
                            onCheckedChange={(checked) => toggleAllVisibleOAs(checked === true)}
                            aria-label="全選 LINE OA"
                          />
                        </TableHead>
                        {GROUP_DIALOG_COLUMNS.map((column) => (
                          <TableHead key={column.key} className={column.width}>
                            {column.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableGroupConfigs.map((config) => {
                        const selected = Boolean(groupForm.selectedOAs[config.id]);
                        const row = groupForm.selectedOAs[config.id] || config;

                        return (
                          <TableRow key={config.id} className={selected ? "bg-primary/5" : ""}>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={(checked) => toggleGroupOA(config, checked === true)}
                                aria-label={`選擇 ${config.name || config.tag || config.id}`}
                              />
                            </TableCell>
                            {GROUP_DIALOG_COLUMNS.map((column) => (
                              <TableCell key={`${config.id}-${column.key}`} className="p-2">
                                <Input
                                  className={`h-8 text-[11px] ${column.mono ? "font-mono" : ""}`}
                                  value={String(row[column.key] ?? "")}
                                  onChange={(event) => updateSelectedOA(config.id, column.key, event.target.value)}
                                  disabled={!selected}
                                />
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t pt-2">
            <Button variant="outline" onClick={() => setGroupDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveGroup} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {groupForm.id ? "儲存" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteConfigTarget)} onOpenChange={(open) => !open && setDeleteConfigTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除 TAG「{deleteConfigTarget?.tag || ""}」的 LINE 帳號嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfig} className="bg-destructive text-destructive-foreground">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(groupDeleteTarget)} onOpenChange={(open) => !open && setGroupDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除分組</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除分組「{groupDeleteTarget?.name || ""}」嗎？關聯帳號會保留，但會被移回未分組。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
