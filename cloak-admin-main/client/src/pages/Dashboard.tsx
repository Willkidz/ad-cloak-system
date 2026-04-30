/**
 * 儀表板頁面 — TAB 佈局
 *
 * TAB 1: 歸因比對（7 天矩陣大表格）
 * TAB 2: 廣告排行（按分組，可排序，日期範圍選擇）
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Loader2, AlertCircle, CalendarIcon, Trophy, Users, GitCompareArrows,
  ArrowUpDown, ArrowUp, ArrowDown, BarChart3, FlaskConical,
} from "lucide-react";
import { useLocation } from "wouter";
import { fetchOAComparison, fetchAdRanking, fetchTemplateStats } from "@/lib/api";

/* ── Types ── */
interface OADailyCell {
  attributed: number;
  line_new: number | null;
}

interface OAGroupRow {
  group_name: string;
  daily: Record<string, OADailyCell>;
  total_attributed: number;
  total_line_new: number | null;
  coverage: number | null;
}

interface OAComparisonData {
  dates: string[];
  complete_dates: string[];
  today: string;
  groups: OAGroupRow[];
}

interface AdItem {
  ad_code: string;
  raw_codes: string[];
  group_name: string;
  clicks: number;
  unique_clicks: number;
  unique_visitors: number;
  adds: number;
  attr_rate: number;
}

interface AdRankingData {
  date: string;
  start_date: string;
  end_date: string;
  ads: AdItem[];
  groupedAds: Record<string, AdItem[]>;
}

type SortKey = "unique_visitors" | "unique_clicks" | "clicks" | "adds" | "attr_rate";
type SortDir = "asc" | "desc" | null;

/* ── Helpers ── */
function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || n === 0) return "-";
  return n.toLocaleString();
}

function getToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr || dateStr.includes("~")) return dateStr;
  const d = new Date(dateStr + "T00:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const w = weekdays[d.getDay()];
  return `${m}/${day}（${w}）`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/* ── Date Range Picker Component ── */
function DateRangePicker({ startDate, endDate, onApply }: {
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<{ from?: Date; to?: Date }>({
    from: startDate ? new Date(startDate + "T00:00:00") : undefined,
    to: endDate ? new Date(endDate + "T00:00:00") : undefined,
  });

  const fmtD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 font-normal">
          <CalendarIcon className="h-4 w-4" />
          {startDate && endDate
            ? startDate === endDate
              ? formatDisplayDate(startDate)
              : `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`
            : "選擇日期"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="end">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r: any) => setRange(r || {})}
          disabled={(date) => date > new Date()}
          numberOfMonths={1}
        />
        <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>取消</Button>
          <Button size="sm" onClick={() => {
            if (range.from) {
              const s = fmtD(range.from);
              const e = range.to ? fmtD(range.to) : s;
              onApply(s, e);
            }
            setOpen(false);
          }}>套用</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ══════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════ */
export default function Dashboard() {
  const [, navigate] = useLocation();

  /* ── OA Comparison State ── */
  const [oaLoading, setOaLoading] = useState(false);
  const [oaData, setOaData] = useState<OAComparisonData | null>(null);
  const [oaError, setOaError] = useState<string | null>(null);

  /* ── Ad Ranking State ── */
  const [adStartDate, setAdStartDate] = useState(getToday());
  const [adEndDate, setAdEndDate] = useState(getToday());
  const [adLoading, setAdLoading] = useState(false);
  const [adData, setAdData] = useState<AdRankingData | null>(null);
  const [adError, setAdError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>("today");

  /* ── Sort State ── */
  const [sortKey, setSortKey] = useState<SortKey>("attr_rate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "desc") setSortDir("asc");
      else if (sortDir === "asc") { setSortKey("attr_rate"); setSortDir("desc"); }
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortDir === "asc") return <ArrowUp className="h-3 w-3 ml-1 text-[#7C3AED]" />;
    return <ArrowDown className="h-3 w-3 ml-1 text-[#7C3AED]" />;
  };

  /* ── Load OA Comparison ── */
  const loadOAComparison = useCallback(() => {
    setOaLoading(true);
    setOaError(null);
    fetchOAComparison()
      .then((res) => {
        if (res.success && res.data) setOaData(res.data);
        else setOaError(res.error || "載入失敗");
      })
      .catch((err) => setOaError(err.message || "網路錯誤"))
      .finally(() => setOaLoading(false));
  }, []);

  /* ── Load Ad Ranking ── */
  const loadAdRanking = useCallback((start: string, end: string) => {
    setAdLoading(true);
    setAdError(null);
    fetchAdRanking({ start_date: start, end_date: end })
      .then((res) => {
        if (res.success && res.data) setAdData(res.data);
        else setAdError(res.error || "載入失敗");
      })
      .catch((err) => setAdError(err.message || "網路錯誤"))
      .finally(() => setAdLoading(false));
  }, []);

  /* ── Preset handlers ── */
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    let start: string, end: string;
    switch (preset) {
      case "today":
        start = end = getToday();
        break;
      case "yesterday":
        start = end = getDateOffset(-1);
        break;
      case "3days":
        start = getDateOffset(-2);
        end = getToday();
        break;
      case "7days":
        start = getDateOffset(-6);
        end = getToday();
        break;
      default:
        return;
    }
    setAdStartDate(start);
    setAdEndDate(end);
    loadAdRanking(start, end);
  };

  /* ── Load on mount ── */
  useEffect(() => {
    loadOAComparison();
    loadAdRanking(adStartDate, adEndDate);
  }, []);

  /* ── Sorted grouped ads ── */
  const sortedGroupedAds = useMemo(() => {
    if (!adData) return {};
    const result: Record<string, AdItem[]> = {};
    for (const [groupName, ads] of Object.entries(adData.groupedAds)) {
      const sorted = [...ads].sort((a, b) => {
        const aVal = a[sortKey] ?? 0;
        const bVal = b[sortKey] ?? 0;
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
      result[groupName] = sorted;
    }
    return result;
  }, [adData, sortKey, sortDir]);

  /* ══════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════ */
  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">儀表板</h1>
          <p className="text-sm text-muted-foreground mt-1">
            歸因比對與廣告排行
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/campaigns")}>
            廣告管理
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="ranking" className="w-full">
        <TabsList>
          <TabsTrigger value="comparison" className="gap-1.5">
            <GitCompareArrows className="h-4 w-4" />
            歸因比對
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            廣告排行
          </TabsTrigger>
          <TabsTrigger value="template-stats" className="gap-1.5">
            <FlaskConical className="h-4 w-4" />
            模板效果
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════
            TAB 1: 歸因比對（7 天矩陣）
            ══════════════════════════════════════════════ */}
        <TabsContent value="comparison">
          <section className="space-y-3 mt-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-[#7C3AED]" />
                <div>
                  <h2 className="text-base font-semibold">歸因 vs LINE OA 新增好友比對</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    最近 7 天分組數據。每格：<span className="font-medium text-foreground">歸因數 / LINE 新增</span>。
                    今日 LINE 數據需明天才能同步。
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadOAComparison} disabled={oaLoading}>
                {oaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "重新載入"}
              </Button>
            </div>

            {oaLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
              </div>
            ) : oaError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{oaError}</p>
                </CardContent>
              </Card>
            ) : oaData && oaData.dates.length > 0 ? (
              <Card className="border shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableHead className="pl-5 min-w-[100px] sticky left-0 bg-muted/10 z-10">分組</TableHead>
                          {oaData.dates.map((d) => {
                            const isToday = d === oaData.today;
                            return (
                              <TableHead key={d} className={`text-center min-w-[100px] ${isToday ? "bg-violet-50" : ""}`}>
                                <div className="flex flex-col items-center">
                                  <span className={isToday ? "text-[#7C3AED] font-semibold" : ""}>{formatDisplayDate(d)}</span>
                                  {isToday && <span className="text-[10px] text-amber-500 font-normal">今天（僅歸因）</span>}
                                </div>
                              </TableHead>
                            );
                          })}
                          <TableHead className="text-center min-w-[80px] bg-muted/20">
                            <div className="flex flex-col items-center">
                              <span>總歸因</span>
                              <span className="text-[10px] font-normal text-muted-foreground">7天</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center min-w-[80px] bg-muted/20">
                            <div className="flex flex-col items-center">
                              <span>總 LINE</span>
                              <span className="text-[10px] font-normal text-muted-foreground">7天</span>
                            </div>
                          </TableHead>
                          <TableHead className="text-center min-w-[80px] bg-muted/20 pr-5">
                            <div className="flex flex-col items-center">
                              <span>覆蓋率</span>
                              <span className="text-[10px] font-normal text-muted-foreground">7天</span>
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {oaData.groups.map((g) => (
                          <TableRow key={g.group_name} className="hover:bg-muted/30">
                            <TableCell className="pl-5 sticky left-0 bg-white z-10">
                              <span className="font-semibold text-sm text-[#7C3AED]">{g.group_name}</span>
                            </TableCell>
                            {oaData.dates.map((d) => {
                              const cell = g.daily[d];
                              const isToday = d === oaData.today;
                              if (!cell) return <TableCell key={d} className="text-center text-muted-foreground text-sm">-</TableCell>;
                              const attrStr = cell.attributed > 0 ? cell.attributed.toLocaleString() : "0";
                              const lineStr = isToday ? "—" : (cell.line_new !== null ? cell.line_new.toLocaleString() : "—");
                              return (
                                <TableCell key={d} className={`text-center text-sm tabular-nums ${isToday ? "bg-violet-50/50" : ""}`}>
                                  <span className="text-emerald-600 font-medium">{attrStr}</span>
                                  <span className="text-muted-foreground mx-0.5">/</span>
                                  <span className={cell.line_new !== null && !isToday ? "text-blue-600 font-medium" : "text-muted-foreground"}>{lineStr}</span>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center tabular-nums text-sm text-emerald-600 font-semibold bg-muted/10">
                              {fmt(g.total_attributed)}
                            </TableCell>
                            <TableCell className="text-center tabular-nums text-sm text-blue-600 font-semibold bg-muted/10">
                              {g.total_line_new !== null ? fmt(g.total_line_new) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className={`text-center tabular-nums text-sm font-bold bg-muted/10 pr-5 ${
                              g.coverage !== null
                                ? g.coverage >= 80 ? "text-emerald-600" : g.coverage >= 50 ? "text-amber-600" : "text-red-500"
                                : "text-muted-foreground"
                            }`}>
                              {g.coverage !== null ? `${g.coverage}%` : "-"}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Total Row */}
                        {oaData.groups.length > 1 && (() => {
                          const totals: Record<string, { attr: number; line: number | null }> = {};
                          for (const d of oaData.dates) {
                            let attr = 0;
                            let line: number | null = null;
                            for (const g of oaData.groups) {
                              const cell = g.daily[d];
                              if (cell) {
                                attr += cell.attributed;
                                if (cell.line_new !== null) {
                                  if (line === null) line = 0;
                                  line += cell.line_new;
                                }
                              }
                            }
                            totals[d] = { attr, line };
                          }
                          const grandAttr = oaData.groups.reduce((s, g) => s + g.total_attributed, 0);
                          const grandLine = oaData.groups.reduce((s, g) => s + (g.total_line_new ?? 0), 0);
                          const anyLine = oaData.groups.some((g) => g.total_line_new !== null);
                          const grandCov = anyLine && grandLine > 0 ? Math.round((grandAttr / grandLine) * 10000) / 100 : null;
                          return (
                            <TableRow className="bg-muted/20 font-semibold hover:bg-muted/30">
                              <TableCell className="pl-5 text-sm sticky left-0 bg-muted/20 z-10">合計</TableCell>
                              {oaData.dates.map((d) => {
                                const t = totals[d];
                                const isToday = d === oaData.today;
                                const attrStr = t.attr > 0 ? t.attr.toLocaleString() : "0";
                                const lineStr = isToday ? "—" : (t.line !== null ? t.line.toLocaleString() : "—");
                                return (
                                  <TableCell key={d} className={`text-center text-sm tabular-nums ${isToday ? "bg-violet-50/50" : ""}`}>
                                    <span className="text-emerald-600">{attrStr}</span>
                                    <span className="text-muted-foreground mx-0.5">/</span>
                                    <span className={t.line !== null && !isToday ? "text-blue-600" : "text-muted-foreground"}>{lineStr}</span>
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center tabular-nums text-sm text-emerald-600 bg-muted/20">{fmt(grandAttr)}</TableCell>
                              <TableCell className="text-center tabular-nums text-sm text-blue-600 bg-muted/20">
                                {anyLine ? fmt(grandLine) : <span className="text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell className={`text-center tabular-nums text-sm font-bold bg-muted/20 pr-5 ${
                                grandCov !== null
                                  ? grandCov >= 80 ? "text-emerald-600" : grandCov >= 50 ? "text-amber-600" : "text-red-500"
                                  : "text-muted-foreground"
                              }`}>
                                {grandCov !== null ? `${grandCov}%` : "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : oaData ? (
              <Card className="border shadow-sm">
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="font-medium">尚未設定 OA</p>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </TabsContent>

        {/* ══════════════════════════════════════════════
            TAB 2: 廣告排行
            ══════════════════════════════════════════════ */}
        <TabsContent value="ranking">
          <section className="space-y-4 mt-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-semibold">廣告排行</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {adData?.date
                      ? `統計期間：${adData.date}`
                      : "載入中..."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Quick presets */}
                {[
                  { key: "today", label: "今天" },
                  { key: "yesterday", label: "昨天" },
                  { key: "3days", label: "3天" },
                  { key: "7days", label: "7天" },
                ].map((p) => (
                  <Button
                    key={p.key}
                    variant={activePreset === p.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyPreset(p.key)}
                    disabled={adLoading}
                    className="text-xs"
                  >
                    {p.label}
                  </Button>
                ))}
                {/* Custom date range */}
                <DateRangePicker
                  startDate={adStartDate}
                  endDate={adEndDate}
                  onApply={(s, e) => {
                    setActivePreset("custom");
                    setAdStartDate(s);
                    setAdEndDate(e);
                    loadAdRanking(s, e);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAdRanking(adStartDate, adEndDate)}
                  disabled={adLoading}
                >
                  {adLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "重新載入"}
                </Button>
              </div>
            </div>

            {/* Ad Ranking Tables */}
            {adLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
              </div>
            ) : adError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6 text-center text-red-600">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>{adError}</p>
                </CardContent>
              </Card>
            ) : adData ? (
              <>
                {Object.entries(sortedGroupedAds).map(([groupName, ads]) => {
                  const totalVisitors = ads.reduce((s, a) => s + (a.unique_visitors || 0), 0);
                  const totalUniqueClicks = ads.reduce((s, a) => s + (a.unique_clicks || 0), 0);
                  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
                  const totalAdds = ads.reduce((s, a) => s + a.adds, 0);
                  const totalRate = totalClicks > 0 ? Math.round((totalAdds / totalClicks) * 10000) / 100 : 0;

                  return (
                    <Card key={groupName} className="border shadow-sm overflow-hidden">
                      <CardHeader className="pb-3 border-b bg-muted/20">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <CardTitle className="text-base font-semibold">{groupName}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {ads.length} 個廣告
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex flex-col items-center">
                              <span className="text-muted-foreground">進入推廣頁</span>
                              <span className="font-semibold text-slate-700 text-sm">{fmt(totalVisitors)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-muted-foreground">不重複點擊</span>
                              <span className="font-semibold text-indigo-600 text-sm">{fmt(totalUniqueClicks)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-muted-foreground">總點擊</span>
                              <span className="font-semibold text-blue-600 text-sm">{fmt(totalClicks)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-muted-foreground">歸因</span>
                              <span className="font-semibold text-emerald-600 text-sm">{fmt(totalAdds)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-muted-foreground">歸因率</span>
                              <span className={`font-bold text-sm ${
                                totalRate >= 50 ? "text-emerald-600" : totalRate >= 30 ? "text-amber-600" : "text-red-500"
                              }`}>{totalRate}%</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/10 hover:bg-muted/10">
                                <TableHead className="pl-5 w-[50px]">#</TableHead>
                                <TableHead className="w-[100px]">廣告編號</TableHead>
                                <TableHead className="min-w-[120px]">原始 TAG</TableHead>
                                <TableHead className="text-right w-[110px] cursor-pointer select-none" onClick={() => toggleSort("unique_visitors")}>
                                  <div className="flex items-center justify-end">
                                    推廣頁UV{renderSortIcon("unique_visitors")}
                                  </div>
                                </TableHead>
                                <TableHead className="text-right w-[110px] cursor-pointer select-none" onClick={() => toggleSort("unique_clicks")}>
                                  <div className="flex items-center justify-end">
                                    不重複點擊{renderSortIcon("unique_clicks")}
                                  </div>
                                </TableHead>
                                <TableHead className="text-right w-[100px] cursor-pointer select-none" onClick={() => toggleSort("clicks")}>
                                  <div className="flex items-center justify-end">
                                    總點擊{renderSortIcon("clicks")}
                                  </div>
                                </TableHead>
                                <TableHead className="text-right w-[80px] cursor-pointer select-none" onClick={() => toggleSort("adds")}>
                                  <div className="flex items-center justify-end">
                                    歸因{renderSortIcon("adds")}
                                  </div>
                                </TableHead>
                                <TableHead className="text-right w-[90px] pr-5 cursor-pointer select-none" onClick={() => toggleSort("attr_rate")}>
                                  <div className="flex items-center justify-end">
                                    歸因率{renderSortIcon("attr_rate")}
                                  </div>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ads.map((ad, idx) => (
                                <TableRow key={ad.ad_code} className="hover:bg-muted/30">
                                  <TableCell className="pl-5 text-sm">
                                    {idx < 3 ? (
                                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                                        idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-gray-400" : "bg-amber-700"
                                      }`}>
                                        {idx + 1}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">{idx + 1}</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm font-semibold text-[#7C3AED]">{ad.ad_code}</TableCell>
                                  <TableCell className="text-sm">
                                    <div className="flex gap-1 flex-wrap">
                                      {ad.raw_codes.map((rc) => (
                                        <Badge key={rc} variant="secondary" className="text-xs font-mono">{rc}</Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums text-sm text-slate-600 font-medium">{fmt(ad.unique_visitors)}</TableCell>
                                  <TableCell className="text-right tabular-nums text-sm text-indigo-600 font-medium">{fmt(ad.unique_clicks)}</TableCell>
                                  <TableCell className="text-right tabular-nums text-sm text-blue-600 font-medium">{fmt(ad.clicks)}</TableCell>
                                  <TableCell className="text-right tabular-nums text-sm text-emerald-600 font-medium">{fmt(ad.adds)}</TableCell>
                                  <TableCell className={`text-right tabular-nums text-sm font-bold pr-5 ${
                                    ad.attr_rate >= 50 ? "text-emerald-600" : ad.attr_rate >= 30 ? "text-amber-600" : "text-red-500"
                                  }`}>
                                    {ad.attr_rate}%
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {Object.keys(adData.groupedAds).length === 0 && (
                  <Card className="border shadow-sm">
                    <CardContent className="p-12 text-center text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium">該期間暫無廣告點擊數據</p>
                      <p className="text-xs mt-1">請選擇其他日期查看</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </section>
        </TabsContent>
        {/* ══════════════════════════════════════════════
            TAB 3: 模板效果
            ══════════════════════════════════════════════ */}
        <TabsContent value="template-stats">
          <TemplateStatsTab />
        </TabsContent>

      </Tabs>

    </div>
  );
}

/* ══════════════════════════════════════════════════
   Template Stats Tab Component
   ══════════════════════════════════════════════════ */
function TemplateStatsTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [days, setDays] = useState(7);
  const [activePreset, setActivePreset] = useState("7days");

  const loadStats = useCallback((d: number) => {
    setLoading(true);
    setError(null);
    fetchTemplateStats(d)
      .then((res) => {
        if (res.success && res.data) setStats(res.data);
        else setError(res.error || "載入失敗");
      })
      .catch((err) => setError(err.message || "網路錯誤"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStats(days);
  }, []);

  const applyPreset = (preset: string, d: number) => {
    setActivePreset(preset);
    setDays(d);
    loadStats(d);
  };

  return (
    <section className="space-y-3 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-[#7C3AED]" />
          <h2 className="text-lg font-semibold">模板效果排行</h2>
        </div>
        <div className="flex items-center gap-2">
          {[{ label: "7天", key: "7days", d: 7 }, { label: "14天", key: "14days", d: 14 }, { label: "30天", key: "30days", d: 30 }].map(({ label, key, d }) => (
            <Button
              key={key}
              variant={activePreset === key ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset(key, d)}
              className={activePreset === key ? "bg-[#7C3AED] hover:bg-[#6D28D9]" : ""}
            >
              {label}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={() => loadStats(days)}>
            重新整理
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
        </div>
      )}

      {error && (
        <Card className="border-destructive/50">
          <CardContent className="p-4 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {!loading && !error && stats.length > 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">#</TableHead>
                    <TableHead className="font-semibold">模板名稱</TableHead>
                    <TableHead className="font-semibold text-right">曝光 UV</TableHead>
                    <TableHead className="font-semibold text-right">點擊 UV</TableHead>
                    <TableHead className="font-semibold text-right">CTR%</TableHead>
                    <TableHead className="font-semibold text-right">歸因數</TableHead>
                    <TableHead className="font-semibold text-right">歸因率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((row: any, idx: number) => (
                    <TableRow key={row.template_id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.template_name || "未命名"}</TableCell>
                      <TableCell className="text-right">{fmt(row.uv)}</TableCell>
                      <TableCell className="text-right">{fmt(row.clicks)}</TableCell>
                      <TableCell className="text-right">
                        {row.ctr !== null && row.ctr !== undefined ? (
                          <Badge variant={parseFloat(row.ctr) >= 20 ? "default" : parseFloat(row.ctr) >= 10 ? "secondary" : "outline"}
                            className={parseFloat(row.ctr) >= 20 ? "bg-green-600" : ""}>
                            {row.ctr}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">{fmt(row.attributed)}</TableCell>
                      <TableCell className="text-right">
                        {row.attr_rate !== null && row.attr_rate !== undefined ? (
                          <Badge variant={parseFloat(row.attr_rate) >= 10 ? "default" : parseFloat(row.attr_rate) >= 5 ? "secondary" : "outline"}
                            className={parseFloat(row.attr_rate) >= 10 ? "bg-green-600" : ""}>
                            {row.attr_rate}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && stats.length === 0 && (
        <Card className="border shadow-sm">
          <CardContent className="p-12 text-center text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">暫無模板效果數據</p>
            <p className="text-xs mt-1">請確認有推廣頁流量後再查看</p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
