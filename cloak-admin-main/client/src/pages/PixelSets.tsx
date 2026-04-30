/**
 * 像素庫管理頁面
 * 管理像素組（一組 = 一個 BM / CAPI Token + 一個 BC 像素 + 多個 AD 像素）
 * 每個 AD 像素對應一個 tag（廣告代碼如 AS、BF、AB 等）
 * 一個廣告（tag）會綁定所有組別，連動抓數據
 */
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Pencil, Trash2, Search, Loader2, Copy, Eye, EyeOff, Layers, X,
  ChevronDown, ChevronRight, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchPixelGroups, createPixelGroup, updatePixelGroup, deletePixelGroup, patchPixelGroupStatus,
  fetchLineGroups,
} from "@/lib/api";

interface AdPixel {
  id?: number;
  group_id?: number;
  tag: string;
  pixel_id: string;
  pixel_name: string;
  created_at?: string;
}

interface PixelGroupItem {
  id: number;
  bm_id: string | null;
  bm_name: string | null;
  capi_token: string;
  bc_pixel_id: string | null;
  bc_pixel_name: string | null;
  note: string | null;
  status: string | null;
  created_at: string;
  ad_pixels: AdPixel[];
}

export default function PixelSets() {
  const [groups, setGroups] = useState<PixelGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PixelGroupItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<PixelGroupItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formBmId, setFormBmId] = useState("");
  const [formBmName, setFormBmName] = useState("");
  const [formCapiToken, setFormCapiToken] = useState("");
  const [formBcPixelId, setFormBcPixelId] = useState("");
  const [formBcPixelName, setFormBcPixelName] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formAdPixels, setFormAdPixels] = useState<Array<{ tag: string; pixel_id: string; pixel_name: string }>>([]);

  // Quick add AD pixel inline
  const [quickAddGroupId, setQuickAddGroupId] = useState<number | null>(null);
  const [quickAddTag, setQuickAddTag] = useState("");
  const [quickAddPixelId, setQuickAddPixelId] = useState("");
  const [quickAddPixelName, setQuickAddPixelName] = useState("");
  const [quickAddSaving, setQuickAddSaving] = useState(false);

  // All available tags from line_groups (for datalist suggestions)
  const [lineGroupTags, setLineGroupTags] = useState<string[]>([]);

  // Token visibility
  const [visibleTokens, setVisibleTokens] = useState<Set<number>>(new Set());

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Copied state for visual feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pixelRes, groupRes] = await Promise.all([
        fetchPixelGroups(),
        fetchLineGroups(),
      ]);
      if (pixelRes.success) {
        setGroups(pixelRes.data || []);
      }
      // Extract all tags from line_groups: code itself + all entries in tags field
      if (groupRes.success) {
        const tagSet = new Set<string>();
        for (const lg of groupRes.data || []) {
          if (lg.code) tagSet.add(lg.code.toUpperCase());
          if (lg.tags) {
            for (const t of lg.tags.split(',')) {
              const trimmed = t.trim().toUpperCase();
              if (trimmed) tagSet.add(trimmed);
            }
          }
        }
        setLineGroupTags(Array.from(tagSet).sort());
      }
    } catch (err) {
      toast.error("載入像素庫失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredGroups = groups.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (g.bm_name || "").toLowerCase().includes(q) ||
      (g.bm_id || "").includes(q) ||
      (g.bc_pixel_id || "").includes(q) ||
      (g.note || "").toLowerCase().includes(q) ||
      g.ad_pixels.some(
        (ad) =>
          ad.pixel_id.includes(q) ||
          (ad.pixel_name || "").toLowerCase().includes(q) ||
          ad.tag.toLowerCase().includes(q)
      )
    );
  });

  // Collect all unique tags: merge tags already in use + all tags defined in line_groups
  const allTags = Array.from(
    new Set([
      ...lineGroupTags,
      ...groups.flatMap((g) => g.ad_pixels.map((ad) => ad.tag)).filter(Boolean),
    ])
  ).sort();

  const openCreate = () => {
    setEditingGroup(null);
    setFormBmId("");
    setFormBmName("");
    setFormCapiToken("");
    setFormBcPixelId("");
    setFormBcPixelName("");
    setFormNote("");
    setFormAdPixels([]);
    setDialogOpen(true);
  };

  const openEdit = (group: PixelGroupItem) => {
    setEditingGroup(group);
    setFormBmId(group.bm_id || "");
    setFormBmName(group.bm_name || "");
    setFormCapiToken(group.capi_token);
    setFormBcPixelId(group.bc_pixel_id || "");
    setFormBcPixelName(group.bc_pixel_name || "");
    setFormNote(group.note || "");
    setFormAdPixels(
      group.ad_pixels.length > 0
        ? group.ad_pixels.map((ad) => ({ tag: ad.tag, pixel_id: ad.pixel_id, pixel_name: ad.pixel_name || "" }))
        : []
    );
    setDialogOpen(true);
  };

  const addAdPixelRow = () => {
    setFormAdPixels([...formAdPixels, { tag: "", pixel_id: "", pixel_name: "" }]);
  };

  const removeAdPixelRow = (index: number) => {
    setFormAdPixels(formAdPixels.filter((_, i) => i !== index));
  };

  const updateAdPixelRow = (index: number, field: "tag" | "pixel_id" | "pixel_name", value: string) => {
    const updated = [...formAdPixels];
    updated[index] = { ...updated[index], [field]: value };
    setFormAdPixels(updated);
  };

  const handleSave = async () => {
    if (!formCapiToken.trim()) {
      toast.error("請填入 CAPI Token");
      return;
    }

    const validAdPixels = formAdPixels.filter((ad) => ad.tag.trim() && ad.pixel_id.trim());

    setSaving(true);
    try {
      const payload = {
        bm_id: formBmId.trim() || null,
        bm_name: formBmName.trim() || null,
        capi_token: formCapiToken.trim(),
        bc_pixel_id: formBcPixelId.trim() || null,
        bc_pixel_name: formBcPixelName.trim() || null,
        note: formNote.trim() || null,
        ad_pixels: validAdPixels,
      };

      if (editingGroup) {
        const res = await updatePixelGroup(editingGroup.id, payload);
        if (res.success) {
          toast.success("像素組已更新");
          setDialogOpen(false);
          await loadData();
        }
      } else {
        const res = await createPixelGroup(payload);
        if (res.success) {
          toast.success("像素組已新增");
          setDialogOpen(false);
          await loadData();
        }
      }
    } catch (err) {
      toast.error("操作失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    try {
      const res = await deletePixelGroup(deletingGroup.id);
      if (res.success) {
        toast.success("像素組已刪除");
        setDeleteDialogOpen(false);
        await loadData();
      }
    } catch (err) {
      toast.error("刪除失敗");
    }
  };

  const handleToggleStatus = async (group: PixelGroupItem) => {
    const currentStatus = group.status || 'active';
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await patchPixelGroupStatus(group.id, newStatus);
      if (res.success) {
        toast.success(newStatus === 'active' ? '已啟用' : '已停用');
        await loadData();
      }
    } catch (err) {
      toast.error("切換狀態失敗");
    }
  };

  const handleQuickAddPixel = async (group: PixelGroupItem) => {
    if (!quickAddTag.trim() || !quickAddPixelId.trim()) {
      toast.error("Tag 和 Pixel ID 為必填");
      return;
    }
    setQuickAddSaving(true);
    try {
      // Use update API: send existing pixels + new one
      const existingPixels = group.ad_pixels.map((ad) => ({
        tag: ad.tag,
        pixel_id: ad.pixel_id,
        pixel_name: ad.pixel_name || "",
      }));
      const newPixels = [...existingPixels, {
        tag: quickAddTag.trim().toUpperCase(),
        pixel_id: quickAddPixelId.trim(),
        pixel_name: quickAddPixelName.trim(),
      }];
      const res = await updatePixelGroup(group.id, {
        bm_id: group.bm_id,
        bm_name: group.bm_name,
        capi_token: group.capi_token,
        bc_pixel_id: group.bc_pixel_id,
        bc_pixel_name: group.bc_pixel_name,
        note: group.note,
        ad_pixels: newPixels,
      });
      if (res.success) {
        toast.success(`已新增 AD 像素 ${quickAddTag.trim().toUpperCase()}`);
        setQuickAddGroupId(null);
        setQuickAddTag("");
        setQuickAddPixelId("");
        setQuickAddPixelName("");
        await loadData();
      }
    } catch (err) {
      toast.error("新增失敗");
    } finally {
      setQuickAddSaving(false);
    }
  };

  const toggleTokenVisibility = (id: number) => {
    const newSet = new Set(visibleTokens);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setVisibleTokens(newSet);
  };

  const toggleExpanded = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setExpandedRows(newSet);
  };

  const maskToken = (token: string) => {
    if (!token) return "-";
    return token.slice(0, 5) + "****" + token.slice(-4);
  };

  const isGroupActive = (group: PixelGroupItem) => {
    return group.status === 'active' || group.status === null || group.status === undefined;
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`已複製 ${label}`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Stats
  const totalAdPixels = groups.reduce((sum, g) => sum + g.ad_pixels.length, 0);
  const activeGroups = groups.filter((g) => isGroupActive(g)).length;
  const bcCount = groups.filter((g) => g.bc_pixel_id).length;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">像素庫</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            一組 = CAPI Token + BC 像素 + 多個 AD 像素，同 Tag 跨組連動
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          新增像素組
        </Button>
      </div>

      {/* Stats - compact row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "BM 組數", value: groups.length, color: "" },
          { label: "啟用中", value: activeGroups, color: "text-green-600" },
          { label: "Tag 數", value: allTags.length, color: "text-purple-600" },
          { label: "AD 像素", value: totalAdPixels, color: "text-blue-600" },
          { label: "BC 像素", value: bcCount, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Tag filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜尋 BM、像素 ID、Tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((t) => (
              <Badge
                key={t}
                variant={search === t ? "default" : "outline"}
                className="cursor-pointer font-mono text-xs hover:bg-primary/10"
                onClick={() => setSearch(search === t ? "" : t)}
              >
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Groups - Card-based layout */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Layers className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">尚無像素組</p>
            <Button variant="link" size="sm" onClick={openCreate} className="mt-1">
              <Plus className="h-3 w-3 mr-1" /> 新增
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map((group) => {
            const active = isGroupActive(group);
            const isExpanded = expandedRows.has(group.id);
            return (
              <Card key={group.id} className={`overflow-hidden transition-all ${!active ? 'opacity-60 bg-muted/10' : ''}`}>
                {/* Group header row */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => toggleExpanded(group.id)}
                >
                  {/* Expand icon */}
                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Status switch */}
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={active}
                      onCheckedChange={() => handleToggleStatus(group)}
                      className="scale-90"
                    />
                  </div>

                  {/* BM Name + ID */}
                  <div className="min-w-[120px] max-w-[180px]">
                    <div className="font-semibold text-sm truncate">{group.bm_name || "未命名"}</div>
                    {group.bm_id && (
                      <div className="text-[11px] font-mono text-muted-foreground truncate">{group.bm_id}</div>
                    )}
                  </div>

                  {/* Token */}
                  <div className="flex items-center gap-1 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                    <span className="font-mono text-xs text-muted-foreground truncate">
                      {visibleTokens.has(group.id) ? group.capi_token : maskToken(group.capi_token)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                      onClick={() => toggleTokenVisibility(group.id)}>
                      {visibleTokens.has(group.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                      onClick={() => handleCopy(group.capi_token, "Token")}>
                      {copiedId === group.capi_token ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>

                  {/* Tags summary */}
                  <div className="flex flex-wrap gap-1 shrink-0 max-w-[200px]">
                    {Array.from(new Set(group.ad_pixels.map((ad) => ad.tag))).sort().slice(0, 6).map((t) => (
                      <Badge key={t} variant="outline" className="font-mono text-[10px] px-1.5 py-0">{t}</Badge>
                    ))}
                    {group.ad_pixels.length > 6 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{group.ad_pixels.length - 6}</Badge>
                    )}
                  </div>

                  {/* AD count + BC indicator */}
                  <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                    <span>AD:{group.ad_pixels.length}</span>
                    {group.bc_pixel_id && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px] px-1.5 py-0">BC</Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(group)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => { setDeletingGroup(group); setDeleteDialogOpen(true); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-muted/20 px-5 py-3 space-y-3">
                    {/* BC Pixel */}
                    {group.bc_pixel_id && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs shrink-0">BC</Badge>
                        <span className="font-mono text-sm text-green-800">{group.bc_pixel_id}</span>
                        {group.bc_pixel_name && (
                          <span className="text-xs text-muted-foreground">({group.bc_pixel_name})</span>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6"
                          onClick={() => handleCopy(group.bc_pixel_id!, "BC Pixel ID")}>
                          {copiedId === group.bc_pixel_id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    )}

                    {/* AD Pixels */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          AD 像素（{group.ad_pixels.length} 個）
                        </span>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setQuickAddGroupId(quickAddGroupId === group.id ? null : group.id);
                            setQuickAddTag("");
                            setQuickAddPixelId("");
                            setQuickAddPixelName("");
                          }}>
                          <Plus className="h-3 w-3" />
                          快速新增
                        </Button>
                      </div>

                      {group.ad_pixels.length > 0 ? (
                        <div className="grid gap-1">
                          {group.ad_pixels.map((ad, i) => (
                            <div key={i} className="flex items-center gap-2 bg-background rounded px-3 py-1.5 border text-sm">
                              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs font-mono shrink-0 min-w-[36px] justify-center">
                                {ad.tag}
                              </Badge>
                              <span className="font-mono text-blue-700">{ad.pixel_id}</span>
                              {ad.pixel_name && (
                                <span className="text-muted-foreground text-xs">({ad.pixel_name})</span>
                              )}
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto shrink-0"
                                onClick={() => handleCopy(ad.pixel_id, ad.tag)}>
                                {copiedId === ad.pixel_id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">尚無 AD 像素，點「快速新增」添加</p>
                      )}

                      {/* Quick add inline form */}
                      {quickAddGroupId === group.id && (
                        <div className="mt-2 flex items-end gap-2 bg-background rounded-lg border p-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Tag</Label>
                            <Input
                              value={quickAddTag}
                              onChange={(e) => setQuickAddTag(e.target.value.toUpperCase())}
                              placeholder="AS"
                              className="w-[70px] font-mono text-sm h-8"
                              list="tag-suggestions-quick"
                            />
                          </div>
                          <div className="space-y-1 flex-1">
                            <Label className="text-xs">Pixel ID</Label>
                            <Input
                              value={quickAddPixelId}
                              onChange={(e) => setQuickAddPixelId(e.target.value)}
                              placeholder="像素 ID"
                              className="font-mono text-sm h-8"
                            />
                          </div>
                          <div className="space-y-1 flex-1">
                            <Label className="text-xs">名稱</Label>
                            <Input
                              value={quickAddPixelName}
                              onChange={(e) => setQuickAddPixelName(e.target.value)}
                              placeholder="選填"
                              className="text-sm h-8"
                            />
                          </div>
                          <Button size="sm" className="h-8 gap-1" disabled={quickAddSaving}
                            onClick={() => handleQuickAddPixel(group)}>
                            {quickAddSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                            新增
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8"
                            onClick={() => setQuickAddGroupId(null)}>
                            取消
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Note */}
                    {group.note && (
                      <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
                        備註：{group.note}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Tag suggestions datalist for quick add */}
      <datalist id="tag-suggestions-quick">
        {allTags.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "編輯像素組" : "新增像素組"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* BM Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">BM 名稱</Label>
                <Input value={formBmName} onChange={(e) => setFormBmName(e.target.value)}
                  placeholder="例：BM-A 主力" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">BM ID</Label>
                <Input value={formBmId} onChange={(e) => setFormBmId(e.target.value)}
                  placeholder="例：123456789" className="font-mono" />
              </div>
            </div>

            {/* CAPI Token */}
            <div className="space-y-1">
              <Label className="text-xs">CAPI Token <span className="text-destructive">*</span></Label>
              <Input value={formCapiToken} onChange={(e) => setFormCapiToken(e.target.value)}
                placeholder="EAABabcd1234..." className="font-mono text-xs" />
            </div>

            {/* BC Pixel */}
            <div className="border rounded-lg p-3 space-y-2">
              <Label className="text-xs font-semibold">BC 像素</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input value={formBcPixelId} onChange={(e) => setFormBcPixelId(e.target.value)}
                  placeholder="Pixel ID" className="font-mono text-sm" />
                <Input value={formBcPixelName} onChange={(e) => setFormBcPixelName(e.target.value)}
                  placeholder="名稱（選填）" className="text-sm" />
              </div>
            </div>

            {/* AD Pixels */}
            <div className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">AD 像素</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addAdPixelRow}>
                  <Plus className="h-3 w-3 mr-1" /> 新增一行
                </Button>
              </div>
              {formAdPixels.length > 0 ? (
                <div className="space-y-1.5">
                  {formAdPixels.map((ad, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <Input value={ad.tag}
                        onChange={(e) => updateAdPixelRow(index, "tag", e.target.value.toUpperCase())}
                        placeholder="Tag" className="w-[70px] font-mono text-sm" list="tag-suggestions" />
                      <Input value={ad.pixel_id}
                        onChange={(e) => updateAdPixelRow(index, "pixel_id", e.target.value)}
                        placeholder="Pixel ID" className="flex-1 font-mono text-sm" />
                      <Input value={ad.pixel_name}
                        onChange={(e) => updateAdPixelRow(index, "pixel_name", e.target.value)}
                        placeholder="名稱" className="flex-1 text-sm" />
                      <Button type="button" variant="ghost" size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAdPixelRow(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  點「新增一行」添加 AD 像素，或先建組後用「快速新增」
                </p>
              )}
              <datalist id="tag-suggestions">
                {allTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              <p className="text-[11px] text-muted-foreground">
                同 Tag 跨組連動：Worker 會對所有含該 Tag 的組發送 CAPI 事件
              </p>
            </div>

            {/* Note */}
            <div className="space-y-1">
              <Label className="text-xs">備註</Label>
              <Textarea value={formNote} onChange={(e) => setFormNote(e.target.value)}
                placeholder="選填" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {editingGroup ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              刪除「{deletingGroup?.bm_name || `ID: ${deletingGroup?.id}`}」及其所有 AD 像素？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
