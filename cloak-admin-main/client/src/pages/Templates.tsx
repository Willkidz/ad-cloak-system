/**
 * 素材中心頁面 - v2 修復版
 * Bug 修復：
 * - Bug1: 前端 client-side type 過濾（防止後端未正確篩選）
 * - Bug2: 縮略圖改用 fetch+blobURL（帶 API key 認證）
 * - Bug3: 源碼編輯改用 fetchTemplate（帶 API key），增強錯誤處理
 * 項目 C: 源碼檢查改為 3 個獨立按鈕
 * 項目 D: 介面文字修正（主題/安全頁、開啟/關閉、主題名稱備注、所屬國家、提交主題）
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Eye,
  Pencil,
  Trash2,
  Copy,
  Plus,
  Search,
  Download,
  Code,
  Loader2,
  Upload,
  Layout,
  Maximize2,
  Minimize2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchTemplates,
  fetchTemplate,
  fetchTemplatePreviewHtml,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  scrapeTemplate,
  fetchSystemTemplates,
  toggleTemplateStatus,
  uploadZipTemplate,
  batchDeleteTemplates,
  API_BASE,
  API_KEY,
} from "@/lib/api";
import { formatCountry, COUNTRY_OPTIONS } from "@/lib/countryMap";

// Lazy load heavy editors
import RichEditor from "@/components/RichEditor";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";



interface Template {
  id: string;
  type: string;
  country: string;
  name: string;
  identifier: string;
  status: string;
  content: string;
  thumbnail: string;
  created_at: string;
  updated_at: string;
}

interface SystemTheme {
  id: string;
  name: string;
  type: string;
  country: string;
  description: string;
  thumbnail: string;
  identifier: string;
}

// ==================== Bug2 修復: Thumbnail Preview 使用 fetch + blob URL ====================
function ThumbnailPreview({ templateId, name }: { templateId: string; name: string }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    fetchTemplatePreviewHtml(templateId)
      .then((htmlContent) => {
        if (cancelled) return;
        const blob = new Blob([htmlContent], { type: "text/html" });
        setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [inView, templateId]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (error) {
    return (
      <div className="w-[120px] h-[80px] bg-muted rounded flex items-center justify-center flex-shrink-0">
        <Layout className="h-6 w-6 text-muted-foreground/40" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-[120px] h-[80px] rounded overflow-hidden border bg-white flex-shrink-0 relative">
      {!blobUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <Layout className="h-5 w-5 text-muted-foreground/30" />
        </div>
      )}
      {blobUrl && (
        <iframe
          src={blobUrl}
          title={name}
          className="w-[600px] h-[400px] border-0 pointer-events-none"
          style={{
            transform: "scale(0.2)",
            transformOrigin: "top left",
          }}
          sandbox="allow-same-origin"
          loading="lazy"
        />
      )}
    </div>
  );
}

// ==================== 素材列表子元件 ====================
function TemplateList({
  type,
  searchName,
  refreshKey,
}: {
  type: string;
  searchName: string;
  refreshKey: number;
}) {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // 編輯彈窗 (富文本)
  const [editOpen, setEditOpen] = useState(false);
  const [editFullscreen, setEditFullscreen] = useState(false);
  const [editItem, setEditItem] = useState<Template | null>(null);
  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editType, setEditType] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editHtmlWrapper, setEditHtmlWrapper] = useState<{ head: string; isFullDoc: boolean } | null>(null);
  const [editExtractedStyles, setEditExtractedStyles] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // 刪除確認
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 批量刪除
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // 源碼編輯彈窗 (CodeMirror)
  const [codeOpen, setCodeOpen] = useState(false);
  const [codeFullscreen, setCodeFullscreen] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeId, setCodeId] = useState<string | null>(null);
  const [codeSaving, setCodeSaving] = useState(false);

  // 項目 C: 源碼檢查結果 - 3 個獨立結果
  const [check1Result, setCheck1Result] = useState<{ pass: boolean; message: string } | null>(null);
  const [check2Result, setCheck2Result] = useState<{ pass: boolean; message: string } | null>(null);
  const [check3Result, setCheck3Result] = useState<{ pass: boolean; message: string } | null>(null);

  // 預覽彈窗
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  // Bug1 修復: loadData 加入 client-side type 過濾
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTemplates({ type, name: searchName, page, limit });
      if (res.success) {
        // Client-side type filter as safety net (in case backend doesn't filter)
        const allItems: Template[] = res.data?.items || [];
        const filtered = allItems.filter((item) => item.type === type);
        setItems(filtered);
        // If backend returned unfiltered data, adjust total count
        if (filtered.length < allItems.length) {
          setTotal(filtered.length);
        } else {
          setTotal(res.data?.total || 0);
        }
      }
    } catch {
      toast.error("載入素材列表失敗");
    } finally {
      setLoading(false);
    }
  }, [type, searchName, page, refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [type, searchName]);

  // Bug2 修復: 預覽功能 - 使用 fetch + blob URL
  const handlePreview = async (item: Template) => {
    setPreviewFullscreen(false);
    setPreviewOpen(true);
    try {
      const htmlContent = await fetchTemplatePreviewHtml(item.id);
      const blob = new Blob([htmlContent], { type: "text/html" });
      setPreviewBlobUrl(URL.createObjectURL(blob));
    } catch {
      toast.error("載入預覽失敗");
    }
  };

  // 編輯功能
  const handleEdit = async (item: Template) => {
    setEditItem(item);
    setEditName(item.name);
    setEditCountry(item.country || "TW");
    setEditType(item.type || "safe_page");
    setEditFullscreen(false);
    setEditHtmlWrapper(null);
    setEditExtractedStyles('');
    try {
      const res = await fetchTemplate(item.id);
      if (res.success) {
        const rawContent = res.data?.content || "";
        // 檢測是否為完整 HTML 文檔，如果是則保存 head 結構以便保存時重新組合
        if (rawContent.match(/<!DOCTYPE\s+html|<html[\s>]/i)) {
          const headMatch = rawContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
          const headContent = headMatch ? headMatch[1] : '';
          // 提取所有 style 標籤的純 CSS 內容，用於注入 TinyMCE iframe
          const styleContents: string[] = [];
          headContent.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_match: string, css: string) => {
            styleContents.push(css);
            return '';
          });
          // 也從 body 中提取 inline style 標籤
          const bodyMatch = rawContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          if (bodyMatch) {
            bodyMatch[1].replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_match: string, css: string) => {
              styleContents.push(css);
              return '';
            });
          }
          setEditExtractedStyles(styleContents.join('\n'));
          // 從 head 中移除 style 標籤，保留其他 head 內容（meta, link 等）
          const headWithoutStyle = headContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim();
          setEditHtmlWrapper({ head: headWithoutStyle, isFullDoc: true });
        }
        setEditContent(rawContent);
      } else {
        setEditContent(item.content || "");
        toast.error("載入完整內容失敗，使用快取版本");
      }
    } catch {
      setEditContent(item.content || "");
    }
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editItem) return;
    if (!editName.trim()) {
      toast.error("請輸入名稱");
      return;
    }
    setEditSaving(true);
    try {
      // 如果原始內容是完整 HTML 文檔，重新組合 HTML 結構
      let saveContent = editContent;
      if (editHtmlWrapper?.isFullDoc) {
        // 從 TinyMCE 輸出的內容中提取 <style> 標籤（如果有的話）
        const styleMatches: string[] = [];
        const bodyOnly = saveContent.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match: string) => {
          styleMatches.push(match);
          return '';
        }).trim();
        // 重新組合：優先使用 extractedStyles（原始 CSS），再加上 TinyMCE 中新增的 style 標籤
        const originalStyles = editExtractedStyles ? `<style>\n${editExtractedStyles}\n</style>` : '';
        const newStyles = styleMatches.join('\n');
        const allStyles = [originalStyles, newStyles].filter(Boolean).join('\n');
        const headContent = (editHtmlWrapper.head ? editHtmlWrapper.head + '\n' : '') + allStyles;
        saveContent = `<!DOCTYPE html>\n<html><head>\n${headContent}\n</head><body>\n${bodyOnly}\n</body></html>`;
      }
      await updateTemplate(editItem.id, {
        name: editName,
        country: editCountry,
        type: editType,
        content: saveContent,
      });
      toast.success("儲存成功");
      setEditOpen(false);
      loadData();
    } catch {
      toast.error("儲存失敗");
    } finally {
      setEditSaving(false);
    }
  };

  // Bug3 修復: 源碼編輯 - 增強錯誤處理
  const handleEditCode = async (item: Template) => {
    setCodeId(item.id);
    setCodeFullscreen(false);
    setCheck1Result(null);
    setCheck2Result(null);
    setCheck3Result(null);
    try {
      const res = await fetchTemplate(item.id);
      if (res.success && res.data?.content) {
        setCodeContent(res.data.content);
      } else {
        // API returned error or no content - use item.content as fallback
        setCodeContent(item.content || "");
        if (!res.success) {
          toast.error("API 載入失敗，使用快取版本");
        }
      }
    } catch {
      setCodeContent(item.content || "");
      toast.error("載入源碼失敗，使用快取版本");
    }
    setCodeOpen(true);
  };

  // 項目 C: 3 個獨立檢查按鈕（含自動修正）
  const handleCheck1 = () => {
    const hasConftp = codeContent.includes("[conftp]");
    if (hasConftp) {
      setCheck1Result({ pass: true, message: "已正確引入 [conftp] 全局配置，無需修正" });
    } else {
      // 自動在 </head> 前插入 [conftp]，若無 </head> 則插在最前面
      let fixed: string;
      if (/<\/head>/i.test(codeContent)) {
        fixed = codeContent.replace(/<\/head>/i, "[conftp]\n</head>");
      } else {
        fixed = "[conftp]\n" + codeContent;
      }
      setCodeContent(fixed);
      setCheck1Result({ pass: true, message: "已自動在 </head> 前插入 [conftp]，請記得儲存源碼" });
    }
  };

  const handleCheck2 = () => {
    const hasFbPixel = /connect\.facebook\.net|fbevents\.js|fbq\s*\(/i.test(codeContent);
    const hasGooglePixel = /googletagmanager\.com|gtag\s*\(|google-analytics\.com|ga\s*\(\s*['"]create/i.test(codeContent);
    const hasThirdPartyPixel = hasFbPixel || hasGooglePixel;
    if (!hasThirdPartyPixel) {
      setCheck2Result({ pass: true, message: "未檢測到第三方像素代碼，符合規範" });
    } else {
      // 自動移除第三方像素代碼（整段 <script>...</script> 包含追蹤碼的區塊）
      let fixed = codeContent;
      // 移除包含 fbevents.js / connect.facebook.net / fbq( 的整個 <script> 區塊
      fixed = fixed.replace(/<script[^>]*>[\s\S]*?(?:connect\.facebook\.net|fbevents\.js|fbq\s*\()[\s\S]*?<\/script>/gi, "");
      // 移除包含 googletagmanager / gtag( / google-analytics 的整個 <script> 區塊
      fixed = fixed.replace(/<script[^>]*>[\s\S]*?(?:googletagmanager\.com|gtag\s*\(|google-analytics\.com)[\s\S]*?<\/script>/gi, "");
      // 移除 <script src="...googletagmanager..."> 外部引用標籤
      fixed = fixed.replace(/<script[^>]*src=["'][^"']*(?:googletagmanager|google-analytics)[^"']*["'][^>]*>\s*<\/script>/gi, "");
      // 移除 <noscript> 中的 FB pixel img 標籤
      fixed = fixed.replace(/<noscript>[\s\S]*?facebook\.com\/tr[\s\S]*?<\/noscript>/gi, "");
      // 清理多餘空行
      fixed = fixed.replace(/\n{3,}/g, "\n\n");
      setCodeContent(fixed);
      const removed: string[] = [];
      if (hasFbPixel) removed.push("Facebook");
      if (hasGooglePixel) removed.push("Google");
      setCheck2Result({ pass: true, message: `已自動移除 ${removed.join("、")} 第三方像素代碼，請記得儲存源碼` });
    }
  };

  const handleCheck3 = () => {
    let fixed = codeContent;
    let changeCount = 0;

    // 1. 移除自定義跳轉函數的 <script> 區塊
    //    匹配包含 window.open / openLineLink / location.href 等自定義跳轉的 <script>
    const beforeScript = fixed;
    fixed = fixed.replace(
      /<script[^>]*>[\s\S]*?(?:function\s+openLineLink|function\s+open[A-Z][a-zA-Z]+Link|window\.open\s*\()[\s\S]*?<\/script>/gi,
      ''
    );
    if (fixed !== beforeScript) changeCount++;

    // 2. 將 onclick="openLineLink(...)" 或 onclick="window.open(...)" 改為 onclick="gotolink()"
    fixed = fixed.replace(
      /onclick="(?:openLineLink|open[A-Z][a-zA-Z]+Link|window\.open)[^"]*"/gi,
      () => { changeCount++; return 'onclick="gotolink()"'; }
    );

    // 3. 將 href="javascript:openLineLink(...)" 等自定義跳轉改為 gotolink
    fixed = fixed.replace(
      /href="javascript:(?:openLineLink|open[A-Z][a-zA-Z]+Link|window\.open)[^"]*"/gi,
      () => { changeCount++; return 'href="javascript:gotolink();"'; }
    );

    // 4. 將 href="https://line.me/..." 或 href="https://liff.line.me/..." 直接改為 gotolink
    fixed = fixed.replace(
      /href="https?:\/\/(?:line\.me|liff\.line\.me)[^"]*"/gi,
      () => { changeCount++; return 'href="javascript:gotolink();"'; }
    );

    // 5. 將 href="#" / href="" / href="javascript:void(0)" / href="javascript:;" 改為 gotolink
    //    僅針對 <a> 標籤內的 href，避免誤改其他元素
    fixed = fixed.replace(
      /(<a\b[^>]*?)href="(?:#|javascript:void\(0\)|javascript:;?)"([^>]*>)/gi,
      (_match: string, before: string, after: string) => {
        changeCount++;
        return `${before}href="javascript:gotolink();"${after}`;
      }
    );

    // 6. 清理殘留的 onclick：當 <a> 已有 href="javascript:gotolink();" 時，移除多餘的 onclick
    //    處理 onclick 在 href 之前的情況
    fixed = fixed.replace(
      /(<a\b[^>]*?)onclick="[^"]*"([^>]*href="javascript:gotolink\(\);")/gi,
      '$1$2'
    );
    //    處理 onclick 在 href 之後的情況
    fixed = fixed.replace(
      /(<a\b[^>]*href="javascript:gotolink\(\);"[^>]*?)onclick="[^"]*"([^>]*>)/gi,
      '$1$2'
    );

    // 7. 清理多餘空行
    fixed = fixed.replace(/\n{3,}/g, "\n\n");

    if (changeCount === 0) {
      // 沒有任何需要修正的項目
      setCheck3Result({ pass: true, message: "已使用 gotolink 跳轉方法，無需修正" });
    } else {
      setCodeContent(fixed);
      setCheck3Result({ pass: true, message: `已自動修正 ${changeCount} 處跳轉為 gotolink()，請記得儲存源碼` });
    }
  };

  const handleCodeSave = async () => {
    if (!codeId) return;
    setCodeSaving(true);
    try {
      await updateTemplate(codeId, { content: codeContent });
      toast.success("源碼已儲存");
      setCodeOpen(false);
      loadData();
    } catch {
      toast.error("儲存失敗");
    } finally {
      setCodeSaving(false);
    }
  };

  // 複製
  const handleCopy = async (item: Template) => {
    try {
      const res = await fetchTemplate(item.id);
      const content = res.success ? res.data?.content : item.content;
      await createTemplate({
        name: `${item.name} (複製)`,
        type: item.type,
        country: item.country,
        identifier: `copy-${Date.now()}`,
        status: "active",
        content: content || "",
      });
      toast.success("複製成功");
      loadData();
    } catch {
      toast.error("複製失敗");
    }
  };

  // 項目 D: 狀態切換文字修正
  const handleToggleStatus = async (item: Template) => {
    try {
      await toggleTemplateStatus(item.id);
      toast.success(item.status === "active" ? "已關閉" : "已開啟");
      loadData();
    } catch {
      toast.error("狀態切換失敗");
    }
  };

  // 刪除
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteTemplate(deleteId);
      toast.success("已刪除");
      setDeleteOpen(false);
      setDeleteId(null);
      loadData();
    } catch {
      toast.error("刪除失敗");
    } finally {
      setDeleting(false);
    }
  };

  // 批量選擇
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((i) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectTemplate = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  // 批量刪除
  const handleBatchDelete = async () => {
    setBatchDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      try {
        const res = await batchDeleteTemplates(ids);
        if (res.success) {
          toast.success(`已刪除 ${selectedIds.size} 筆素材`);
        } else {
          throw new Error("batch API failed");
        }
      } catch {
        await Promise.all(ids.map((id) => deleteTemplate(id)));
        toast.success(`已刪除 ${selectedIds.size} 筆素材`);
      }
      setSelectedIds(new Set());
      setBatchDeleteOpen(false);
      loadData();
    } catch {
      toast.error("批量刪除失敗");
    } finally {
      setBatchDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">載入中...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Layout className="h-12 w-12 mb-3 opacity-30" />
        <p>暫無素材</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* 批量操作列 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg px-4 py-2 mb-4">
          <span className="text-sm text-violet-700">
            已選擇 {selectedIds.size} 筆素材
          </span>
          <div className="flex items-center gap-2">
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

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedIds.size === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[140px]">縮略圖</TableHead>
              <TableHead className="w-[200px]">名稱</TableHead>
              <TableHead className="w-[80px]">類型</TableHead>
              <TableHead className="w-[100px]">國家</TableHead>
              <TableHead className="w-[80px]">狀態</TableHead>
              <TableHead className="w-[160px]">建立時間</TableHead>
              <TableHead className="w-[260px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-purple-50/50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(checked) => handleSelectTemplate(item.id, !!checked)}
                  />
                </TableCell>
                <TableCell>
                  <ThumbnailPreview templateId={item.id} name={item.name} />
                </TableCell>
                <TableCell className="font-medium max-w-[200px]">
                  <div className="truncate" title={item.name}>{item.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate" title={item.id}>
                    ID: {item.id.substring(0, 8)}...
                  </div>
                </TableCell>
                <TableCell>
                  {/* 項目 D: 類型文字修正 */}
                  <Badge
                    variant={item.type === "safe_page" ? "secondary" : "default"}
                    className={
                      item.type === "safe_page"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        : "bg-violet-100 text-violet-700 hover:bg-violet-100"
                    }
                  >
                    {item.type === "safe_page" ? "安全頁" : "主題"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatCountry(item.country)}
                </TableCell>
                <TableCell>
                  {/* 項目 D: 狀態文字修正 */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.status === "active"}
                      onCheckedChange={() => handleToggleStatus(item)}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <span className={`text-xs ${item.status === 'active' ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {item.status === "active" ? "開啟" : "關閉"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {item.created_at ? new Date(item.created_at).toLocaleString("zh-TW") : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePreview(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>預覽</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>編輯</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCode(item)}>
                          <Code className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>編輯源碼</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(item)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>複製</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeleteId(item.id);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>刪除</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 分頁 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            共 {total} 筆，第 {page}/{totalPages} 頁
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              上一頁
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              下一頁
            </Button>
          </div>
        </div>
      )}

      {/* ===== 預覽彈窗 - Bug2 修復: 使用 blob URL ===== */}
      <Dialog open={previewOpen} onOpenChange={(open) => {
        setPreviewOpen(open);
        if (!open) {
          setPreviewFullscreen(false);
          if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
          }
        }
      }}>
        <DialogContent
          className={
            previewFullscreen
              ? "fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen rounded-none flex flex-col p-0"
              : "max-w-5xl h-[85vh] flex flex-col p-0"
          }
          showCloseButton={false}
        >
          <DialogHeader className="px-6 pt-4 pb-2 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                頁面預覽
              </DialogTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPreviewFullscreen(!previewFullscreen)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                  title={previewFullscreen ? "退出全螢幕" : "全螢幕"}
                >
                  {previewFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setPreviewOpen(false)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 p-0">
            {previewBlobUrl ? (
              <iframe
                src={previewBlobUrl}
                className="w-full h-full border-0"
                title="Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">載入中...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== 編輯彈窗 (富文本 + 預覽) ===== */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditFullscreen(false); }}>
        <DialogContent
          className={
            editFullscreen
              ? "fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen rounded-none flex flex-col"
              : "max-w-6xl w-full h-[90vh] flex flex-col"
          }
          showCloseButton={false}
          onPointerDownOutside={(e) => {
            // Allow TinyMCE sub-dialogs (Insert Image, Insert Link, etc.) to receive clicks
            const target = e.target as HTMLElement;
            if (target?.closest('.tox-dialog-wrap, .tox-dialog, .tox-tinymce-aux, .tox-menu, .tox-collection')) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            // Allow TinyMCE sub-dialogs to receive focus
            const target = e.target as HTMLElement;
            if (target?.closest('.tox-dialog-wrap, .tox-dialog, .tox-tinymce-aux, .tox-menu, .tox-collection')) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            // Allow all TinyMCE sub-dialog interactions
            const target = e.target as HTMLElement;
            if (target?.closest('.tox-dialog-wrap, .tox-dialog, .tox-tinymce-aux, .tox-menu, .tox-collection')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                編輯素材
              </DialogTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditFullscreen(!editFullscreen)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                  title={editFullscreen ? "退出全螢幕" : "全螢幕"}
                >
                  {editFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditOpen(false)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium"><span className="text-destructive">*</span> 主題名稱備注</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="輸入主題名稱備注" />
              </div>
              <div className="space-y-1.5">
                {/* 項目 D: 類型文字修正 */}
                <Label className="text-sm font-medium">類型</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe_page">安全頁</SelectItem>
                    <SelectItem value="money_page">主題</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                {/* 項目 D: 欄位標籤修正 */}
                <Label className="text-sm font-medium">所屬國家</Label>
                <Select value={editCountry} onValueChange={setEditCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇國家" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 富文本編輯器 - TinyMCE */}
            <div>
              <Label className="text-sm font-medium mb-2 block">內容編輯</Label>
              <RichEditor
                value={editContent}
                onChange={setEditContent}
                placeholder="在此編輯內容..."
                height={700}
                extractedStyles={editExtractedStyles}
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 源碼編輯彈窗 - 項目 C: 3 個獨立檢查按鈕 ===== */}
      <Dialog open={codeOpen} onOpenChange={(open) => {
        setCodeOpen(open);
        if (!open) {
          setCodeFullscreen(false);
          setCheck1Result(null);
          setCheck2Result(null);
          setCheck3Result(null);
        }
      }}>
        <DialogContent
          className={
            codeFullscreen
              ? "fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen rounded-none flex flex-col p-0"
              : "max-w-5xl h-[85vh] flex flex-col p-0"
          }
          showCloseButton={false}
        >
          <DialogHeader className="px-6 pt-4 pb-2 border-b shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                編輯源碼
                <Badge variant="secondary" className="text-[10px] ml-2">HTML</Badge>
              </DialogTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCodeFullscreen(!codeFullscreen)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                  title={codeFullscreen ? "退出全螢幕" : "全螢幕"}
                >
                  {codeFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setCodeOpen(false)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeMirror
              value={codeContent}
              onChange={(val) => setCodeContent(val)}
              extensions={[html()]}
              theme={oneDark}
              height="100%"
              style={{ height: "100%", fontSize: "13px" }}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                autocompletion: true,
                bracketMatching: true,
              }}
            />
          </div>

          {/* 項目 C: 編輯規範說明 + 3 個獨立檢查按鈕 */}
          <div className="px-6 py-3 border-t bg-muted/20 shrink-0 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Info className="h-4 w-4" />
              主要編輯點和檢查點（其它懂編程的隨意編輯）
            </div>

            {/* 檢查 1 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex items-start gap-2 bg-background rounded-md p-2 border flex-1 text-xs text-muted-foreground">
                  <span className="font-bold text-primary shrink-0">1.</span>
                  <span>頭部需引入 <code className="bg-muted px-1 rounded text-[11px]">[conftp]</code> 全局配置文件</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleCheck1} className="shrink-0">
                  檢查並修正
                </Button>
              </div>
              {check1Result && (
                <div className={`flex items-start gap-2 text-xs rounded-md p-2 border ${
                  check1Result.pass ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {check1Result.pass ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <span>{check1Result.message}</span>
                </div>
              )}
            </div>

            {/* 檢查 2 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex items-start gap-2 bg-background rounded-md p-2 border flex-1 text-xs text-muted-foreground">
                  <span className="font-bold text-primary shrink-0">2.</span>
                  <span>需移除原有的第三方像素代碼（Facebook、Google 等追蹤碼）</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleCheck2} className="shrink-0">
                  檢查並清除
                </Button>
              </div>
              {check2Result && (
                <div className={`flex items-start gap-2 text-xs rounded-md p-2 border ${
                  check2Result.pass ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {check2Result.pass ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <span>{check2Result.message}</span>
                </div>
              )}
            </div>

            {/* 檢查 3 */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex items-start gap-2 bg-background rounded-md p-2 border flex-1 text-xs text-muted-foreground">
                  <span className="font-bold text-primary shrink-0">3.</span>
                  <span>點擊按鈕需使用 <code className="bg-muted px-1 rounded text-[11px]">gotolink()</code> 方法跳轉</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleCheck3} className="shrink-0">
                  檢查並修正
                </Button>
              </div>
              {check3Result && (
                <div className={`flex items-start gap-2 text-xs rounded-md p-2 border ${
                  check3Result.pass ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {check3Result.pass ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <span>{check3Result.message}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-3 border-t shrink-0">
            <div className="flex items-center justify-end w-full gap-2">
              <Button variant="outline" onClick={() => setCodeOpen(false)}>取消</Button>
              <Button onClick={handleCodeSave} disabled={codeSaving}>
                {codeSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                儲存源碼
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認彈窗 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此素材嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原，刪除後素材將永久移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量刪除確認彈窗 */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要批量刪除 {selectedIds.size} 筆素材嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原，所有選中的素材將永久移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={batchDeleting}
            >
              {batchDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ==================== 新增素材彈窗元件 (4 tabs) ====================
function AddTemplateModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState("crawl");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 採集新增
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlName, setCrawlName] = useState("");
  const [crawlType, setCrawlType] = useState("safe_page");
  const [crawlCountry, setCrawlCountry] = useState("TW");
  const [crawlStatus, setCrawlStatus] = useState("active");
  const [crawling, setCrawling] = useState(false);

  // 自定義新增 (富文本)
  const [customName, setCustomName] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [customType, setCustomType] = useState("safe_page");
  const [customCountry, setCustomCountry] = useState("TW");
  const [customStatus, setCustomStatus] = useState("active");
  const [customContent, setCustomContent] = useState("");
  const [customSaving, setCustomSaving] = useState(false);

  // ZIP 上傳
  const [zipName, setZipName] = useState("");
  const [zipType, setZipType] = useState("money_page");
  const [zipCountry, setZipCountry] = useState("TW");
  const [zipStatus, setZipStatus] = useState("active");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipUploading, setZipUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 系統主題
  const [themes, setThemes] = useState<SystemTheme[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [useTheme, setUseTheme] = useState<SystemTheme | null>(null);
  const [useName, setUseName] = useState("");
  const [useSaving, setUseSaving] = useState(false);

  // 系統主題搜索與篩選
  const [themeSearch, setThemeSearch] = useState("");
  const [themeTypeFilter, setThemeTypeFilter] = useState("all");
  const [themeCountryFilter, setThemeCountryFilter] = useState("all");

  useEffect(() => {
    if (tab === "system" && open) {
      loadThemes();
    }
  }, [tab, open]);

  const loadThemes = async () => {
    setThemesLoading(true);
    try {
      const res = await fetchSystemTemplates();
      if (res.success) {
        setThemes(res.data || []);
      }
    } catch {
      setThemes([
        {
          id: "sys-line",
          name: "LINE 主題推廣頁",
          type: "money_page",
          country: "TW",
          description: "LINE 綠色背景，引導用戶開啟 LINE 加入好友",
          thumbnail: "",
          identifier: "sys-line",
        },
        {
          id: "sys-bf",
          name: "BF 低調推廣頁",
          type: "money_page",
          country: "TW",
          description: "金色深色質感，適合活動推廣使用",
          thumbnail: "",
          identifier: "sys-bf",
        },
        {
          id: "sys-skyai",
          name: "SKY AI 天盈科技",
          type: "money_page",
          country: "TW",
          description: "深色科技風，適合科技類推廣",
          thumbnail: "",
          identifier: "sys-skyai",
        },
      ]);
    } finally {
      setThemesLoading(false);
    }
  };

  const filteredThemes = themes.filter((t) => {
    if (themeSearch && !t.name.toLowerCase().includes(themeSearch.toLowerCase()) && !t.description.toLowerCase().includes(themeSearch.toLowerCase())) return false;
    if (themeTypeFilter !== "all" && t.type !== themeTypeFilter) return false;
    if (themeCountryFilter !== "all" && t.country !== themeCountryFilter) return false;
    return true;
  });

  // 採集新增
  const handleCrawl = async () => {
    if (!crawlName.trim()) {
      toast.error("請輸入主題名稱備注");
      return;
    }
    if (!crawlUrl.trim()) {
      toast.error("請輸入 URL");
      return;
    }
    setCrawling(true);
    try {
      const res = await scrapeTemplate({
        url: crawlUrl,
        name: crawlName,
        type: crawlType,
        country: crawlCountry,
        status: crawlStatus,
      });
      if (res.success) {
        toast.success("採集並新增成功");
        setCrawlUrl("");
        setCrawlName("");
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "採集失敗");
      }
    } catch {
      toast.error("採集失敗，請確認 URL 是否正確");
    } finally {
      setCrawling(false);
    }
  };

  // 自定義新增
  const handleCustomSave = async () => {
    if (!customName.trim()) {
      toast.error("請輸入主題名稱備注");
      return;
    }
    if (!customContent.trim()) {
      toast.error("請輸入內容");
      return;
    }
    setCustomSaving(true);
    try {
      await createTemplate({
        name: customName,
        type: customType,
        country: customCountry,
        identifier: `custom-${Date.now()}`,
        status: customStatus,
        content: customContent,
      });
      toast.success("新增成功");
      setCustomName("");
      setCustomNote("");
      setCustomContent("");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("新增失敗");
    } finally {
      setCustomSaving(false);
    }
  };

  // ZIP 上傳
  const handleZipUpload = async () => {
    if (!zipName.trim()) {
      toast.error("請輸入主題名稱備注");
      return;
    }
    if (!zipFile) {
      toast.error("請選擇 ZIP 檔案");
      return;
    }
    if (!zipFile.name.toLowerCase().endsWith(".zip")) {
      toast.error("請上傳 .zip 格式的檔案");
      return;
    }
    if (zipFile.size > 10 * 1024 * 1024) {
      toast.error("ZIP 檔案不能超過 10MB");
      return;
    }
    setZipUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", zipFile);
      formData.append("name", zipName);
      formData.append("type", zipType);
      formData.append("country", zipCountry);
      formData.append("status", zipStatus);
      const res = await uploadZipTemplate(formData);
      if (res.success) {
        toast.success("ZIP 上傳並新增成功");
        setZipName("");
        setZipFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(res.error || "上傳失敗");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "ZIP 上傳失敗");
    } finally {
      setZipUploading(false);
    }
  };

  // 使用系統主題
  const handleUseTheme = async () => {
    if (!useTheme) return;
    if (!useName.trim()) {
      toast.error("請輸入主題名稱備注");
      return;
    }
    setUseSaving(true);
    try {
      const templateContent = getSystemTemplateContent(useTheme.identifier);
      await createTemplate({
        name: useName,
        type: useTheme.type,
        country: useTheme.country,
        identifier: useTheme.identifier,
        status: "active",
        content: templateContent,
      });
      toast.success("已新增到素材庫");
      setUseOpen(false);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("新增失敗");
    } finally {
      setUseSaving(false);
    }
  };

  const handleConfirm = () => {
    switch (tab) {
      case "crawl":
        handleCrawl();
        break;
      case "zip":
        handleZipUpload();
        break;
      case "custom":
        handleCustomSave();
        break;
      default:
        break;
    }
  };

  const isSubmitting = crawling || zipUploading || customSaving;

  return (
    <>
      {/* 項目 D: 彈窗標題改為「新增主題」 */}
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setIsFullscreen(false); }}>
        <DialogContent
          className={
            isFullscreen
              ? "fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 max-w-none w-screen h-screen rounded-none flex flex-col"
              : "max-w-5xl w-full h-[90vh] flex flex-col"
          }
          showCloseButton={false}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target?.closest('.tox-dialog-wrap, .tox-dialog, .tox-tinymce-aux, .tox-menu, .tox-collection')) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target?.closest('.tox-dialog-wrap, .tox-dialog, .tox-tinymce-aux, .tox-menu, .tox-collection')) {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target?.closest('.tox-dialog-wrap, .tox-dialog, .tox-tinymce-aux, .tox-menu, .tox-collection')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新增主題
              </DialogTitle>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                  title={isFullscreen ? "退出全螢幕" : "全螢幕"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 p-1"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4 grid grid-cols-4 w-full">
                <TabsTrigger value="crawl" className="text-xs sm:text-sm">
                  <Download className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  採集新增
                </TabsTrigger>
                <TabsTrigger value="zip" className="text-xs sm:text-sm">
                  <Upload className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  ZIP 上傳
                </TabsTrigger>
                <TabsTrigger value="custom" className="text-xs sm:text-sm">
                  <Pencil className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  自定義新增
                </TabsTrigger>
                <TabsTrigger value="system" className="text-xs sm:text-sm">
                  <Layout className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
                  系統主題
                </TabsTrigger>
              </TabsList>

              {/* ===== 採集新增 ===== */}
              <TabsContent value="crawl" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium"><span className="text-destructive">*</span> 主題名稱備注</Label>
                    <Input
                      value={crawlName}
                      onChange={(e) => setCrawlName(e.target.value)}
                      placeholder="輸入主題名稱備注"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium"><span className="text-destructive">*</span> URL</Label>
                    <Textarea
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="min-h-[60px] resize-y"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">類型</Label>
                      <RadioGroup value={crawlType} onValueChange={setCrawlType} className="flex items-center gap-4 h-10">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="money_page" id="crawl-money" />
                          <Label htmlFor="crawl-money" className="text-sm cursor-pointer">主題</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="safe_page" id="crawl-safe" />
                          <Label htmlFor="crawl-safe" className="text-sm cursor-pointer">安全頁</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">所屬國家</Label>
                      <Select value={crawlCountry} onValueChange={setCrawlCountry}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">狀態</Label>
                      <RadioGroup value={crawlStatus} onValueChange={setCrawlStatus} className="flex items-center gap-4 h-10">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="active" id="crawl-active" />
                          <Label htmlFor="crawl-active" className="text-sm cursor-pointer">開啟</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="inactive" id="crawl-inactive" />
                          <Label htmlFor="crawl-inactive" className="text-sm cursor-pointer">關閉</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ===== ZIP 上傳 ===== */}
              <TabsContent value="zip" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium"><span className="text-destructive">*</span> 主題名稱備注</Label>
                    <Input value={zipName} onChange={(e) => setZipName(e.target.value)} placeholder="輸入主題名稱備注" className="h-10" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">類型</Label>
                      <RadioGroup value={zipType} onValueChange={setZipType} className="flex items-center gap-4 h-10">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="money_page" id="zip-money" />
                          <Label htmlFor="zip-money" className="text-sm cursor-pointer">主題</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="safe_page" id="zip-safe" />
                          <Label htmlFor="zip-safe" className="text-sm cursor-pointer">安全頁</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">所屬國家</Label>
                      <Select value={zipCountry} onValueChange={setZipCountry}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">狀態</Label>
                      <RadioGroup value={zipStatus} onValueChange={setZipStatus} className="flex items-center gap-4 h-10">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="active" id="zip-active" />
                          <Label htmlFor="zip-active" className="text-sm cursor-pointer">開啟</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="inactive" id="zip-inactive" />
                          <Label htmlFor="zip-inactive" className="text-sm cursor-pointer">關閉</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.name.toLowerCase().endsWith(".zip")) {
                        setZipFile(file);
                      } else {
                        toast.error("請拖拽 .zip 格式的檔案");
                      }
                    }}
                  >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    {zipFile ? (
                      <div>
                        <p className="font-medium">{zipFile.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(zipFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">點擊或拖拽 ZIP 檔案</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          ZIP 必須包含 index.html，檔案大小不超過 10MB
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setZipFile(file);
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ===== 自定義新增 (富文本) ===== */}
              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium"><span className="text-destructive">*</span> 主題名稱備注</Label>
                      <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="輸入主題名稱備注" className="h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">備註</Label>
                      <Input value={customNote} onChange={(e) => setCustomNote(e.target.value)} placeholder="選填備註說明" className="h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">類型</Label>
                      <RadioGroup value={customType} onValueChange={setCustomType} className="flex items-center gap-4 h-10">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="money_page" id="custom-money" />
                          <Label htmlFor="custom-money" className="text-sm cursor-pointer">主題</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="safe_page" id="custom-safe" />
                          <Label htmlFor="custom-safe" className="text-sm cursor-pointer">安全頁</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">所屬國家</Label>
                      <Select value={customCountry} onValueChange={setCustomCountry}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {COUNTRY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">狀態</Label>
                      <RadioGroup value={customStatus} onValueChange={setCustomStatus} className="flex items-center gap-4 h-10">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="active" id="custom-active" />
                          <Label htmlFor="custom-active" className="text-sm cursor-pointer">開啟</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="inactive" id="custom-inactive" />
                          <Label htmlFor="custom-inactive" className="text-sm cursor-pointer">關閉</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                  <div className="w-full">
                    <Label className="text-sm font-medium mb-2 block"><span className="text-destructive">*</span> 內容</Label>
                    <RichEditor
                      value={customContent}
                      onChange={setCustomContent}
                      placeholder="在此編輯內容..."
                      height={600}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* ===== 系統主題 ===== */}
              <TabsContent value="system">
                <div className="flex flex-wrap items-end gap-3 mb-4">
                  <div className="flex-1 min-w-[160px]">
                    <Input
                      value={themeSearch}
                      onChange={(e) => setThemeSearch(e.target.value)}
                      placeholder="搜索主題名稱..."
                      className="h-9"
                    />
                  </div>
                  <Select value={themeTypeFilter} onValueChange={setThemeTypeFilter}>
                    <SelectTrigger className="w-[120px] h-9">
                      <SelectValue placeholder="類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部類型</SelectItem>
                      <SelectItem value="safe_page">安全頁</SelectItem>
                      <SelectItem value="money_page">主題</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={themeCountryFilter} onValueChange={setThemeCountryFilter}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="國家" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部國家</SelectItem>
                      {COUNTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => { setThemeSearch(""); setThemeTypeFilter("all"); setThemeCountryFilter("all"); }}
                  >
                    重置
                  </Button>
                </div>

                {themesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredThemes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Layout className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">沒有符合條件的主題</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredThemes.map((theme) => (
                      <Card key={theme.id} className="border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="h-32 overflow-hidden relative">
                          {theme.thumbnail ? (
                            <img
                              src={theme.thumbnail}
                              alt={theme.name}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${
                              theme.identifier === "sys-line" ? "bg-[#06C755]" :
                              theme.identifier === "sys-bf" ? "bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" :
                              theme.identifier === "sys-skyai" ? "bg-gradient-to-br from-[#0a0e27] to-[#1a1a3e]" :
                              "bg-gradient-to-br from-violet-50 to-purple-100"
                            }`}>
                              {theme.identifier === "sys-line" && (
                                <div className="text-center text-white">
                                  <div className="text-3xl mb-1">LINE</div>
                                  <div className="text-xs font-bold tracking-wide">加入好友</div>
                                </div>
                              )}
                              {theme.identifier === "sys-bf" && (
                                <div className="text-center">
                                  <div className="text-3xl mb-1 text-amber-400">BF</div>
                                  <div className="text-xs font-bold text-amber-400">限時活動</div>
                                </div>
                              )}
                              {theme.identifier === "sys-skyai" && (
                                <div className="text-center">
                                  <div className="text-3xl mb-1 text-cyan-400">AI</div>
                                  <div className="text-xs font-bold text-cyan-400">SKY AI</div>
                                </div>
                              )}
                              {!["sys-line", "sys-bf", "sys-skyai"].includes(theme.identifier) && (
                                <Layout className="h-10 w-10 text-violet-300" />
                              )}
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3 space-y-1.5">
                          <h3 className="font-semibold text-sm">{theme.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {theme.type === "safe_page" ? "安全頁" : "主題"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">
                              {formatCountry(theme.country)}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            className="w-full mt-1"
                            onClick={() => {
                              setUseTheme(theme);
                              setUseName(theme.name);
                              setUseOpen(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            使用此主題
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* 項目 D: 確認按鈕修正 */}
          {tab !== "system" && (
            <DialogFooter className="shrink-0 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
              <Button onClick={handleConfirm} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {tab === "crawl" && (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    提交主題
                  </>
                )}
                {tab === "zip" && (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    提交主題
                  </>
                )}
                {tab === "custom" && (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    提交主題
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* 使用系統主題彈窗 */}
      <Dialog open={useOpen} onOpenChange={setUseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>使用系統主題</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              將「{useTheme?.name}」加入到您的素材庫中。
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium"><span className="text-destructive">*</span> 主題名稱備注</Label>
              <Input
                value={useName}
                onChange={(e) => setUseName(e.target.value)}
                placeholder="例如：LINE 推廣頁-01"
              />
              <p className="text-[11px] text-muted-foreground">
                建議包含推廣地區與活動編號，便於後續管理。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUseOpen(false)}>取消</Button>
            <Button onClick={handleUseTheme} disabled={useSaving}>
              {useSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              提交主題
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== 系統主題 HTML 內容 ====================
function getSystemTemplateContent(identifier: string): string {
  const templates: Record<string, string> = {
    "sys-line": `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
[conftp]
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>LINE</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#06C755;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.c{text-align:center;padding:40px 30px;max-width:360px}
.logo{width:80px;height:80px;background:#fff;border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px;font-weight:800;color:#06C755}
.title{color:#fff;font-size:28px;font-weight:800;margin-bottom:8px}
.desc{color:rgba(255,255,255,0.85);font-size:14px;margin-bottom:24px;line-height:1.6}
.btn{display:inline-block;background:#fff;color:#06C755;font-size:16px;font-weight:700;padding:14px 48px;border-radius:28px;text-decoration:none;transition:transform 0.2s}
.btn:hover{transform:scale(1.05)}
</style>
</head><body>
<div class="c">
<div class="logo">LINE</div>
<h1 class="title">LINE 好友</h1>
<p class="desc">點擊下方按鈕，立即加入好友獲取最新資訊</p>
<a class="btn" href="javascript:gotolink();">加入好友</a>
</div>
</body></html>`,
    "sys-bf": `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
[conftp]
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1a1a2e,#16213e);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.c{text-align:center;padding:40px 30px;max-width:400px}
.badge{display:inline-block;background:linear-gradient(135deg,#f5af19,#f12711);color:#fff;font-size:11px;font-weight:700;padding:4px 16px;border-radius:20px;margin-bottom:16px;letter-spacing:2px}
.title{color:#f5af19;font-size:32px;font-weight:800;margin-bottom:8px;text-shadow:0 0 20px rgba(245,175,25,0.3)}
.desc{color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:28px;line-height:1.6}
.btn{display:inline-block;background:linear-gradient(135deg,#f5af19,#f12711);color:#fff;font-size:16px;font-weight:700;padding:14px 48px;border-radius:28px;text-decoration:none;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 20px rgba(245,175,25,0.3)}
.btn:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(245,175,25,0.4)}
</style>
</head><body>
<div class="c">
<div class="badge">限時活動</div>
<h1 class="title">BF 專屬優惠</h1>
<p class="desc">把握限時機會，享受專屬優惠</p>
<a class="btn" href="javascript:gotolink();">立即參加</a>
</div>
</body></html>`,
    "sys-skyai": `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
[conftp]
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0e27;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;overflow:hidden}
.bg{position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(ellipse at 50% 0%,rgba(0,229,255,0.08) 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,rgba(99,102,241,0.06) 0%,transparent 50%)}
.c{position:relative;z-index:1;text-align:center;padding:40px 30px;max-width:400px}
.logo{width:80px;height:80px;background:linear-gradient(135deg,#00e5ff,#6366f1);border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:28px;font-weight:800;color:#fff;box-shadow:0 0 40px rgba(0,229,255,0.2)}
.title{color:#fff;font-size:32px;font-weight:800;margin-bottom:4px;letter-spacing:2px}
.subtitle{color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:8px;letter-spacing:4px}
.desc{color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:32px;line-height:1.6}
.btn{display:inline-block;background:linear-gradient(135deg,#00e5ff,#6366f1);color:#fff;font-size:16px;font-weight:600;padding:14px 48px;border-radius:28px;text-decoration:none;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 20px rgba(0,229,255,0.3)}
.btn:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(0,229,255,0.4)}
.dots{display:flex;justify-content:center;gap:6px;margin-top:24px}
.dot{width:6px;height:6px;border-radius:50%;background:rgba(0,229,255,0.3)}
.dot.active{background:#00e5ff}
</style>
</head><body>
<div class="bg"></div>
<div class="c">
<div class="logo">AI</div>
<p class="title">SKY AI</p>
<p class="subtitle">天盈科技</p>
<p class="desc">智能科技，引領未來</p>
<a class="btn" href="javascript:gotolink();">點我前往</a>
<div class="dots"><div class="dot active"></div><div class="dot"></div><div class="dot"></div></div>
</div>
</body></html>`,
  };

  return templates[identifier] || `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">[conftp]</head><body><h1>系統主題</h1><a href="javascript:gotolink();">前往</a></body></html>`;
}

// ==================== 主頁面 ====================
export default function Templates() {
  const [mainTab, setMainTab] = useState("safe_page");
  const [searchName, setSearchName] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSearch = () => {
    setAppliedSearch(searchName);
  };

  const handleReset = () => {
    setSearchName("");
    setAppliedSearch("");
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">素材中心</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新增主題
        </Button>
      </div>

      <AddTemplateModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleRefresh}
      />

      {/* 主列表 tabs - 項目 D: Tab 名稱保持不變 */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="safe_page">安全頁管理</TabsTrigger>
          <TabsTrigger value="money_page">主題管理</TabsTrigger>
        </TabsList>

        {/* 搜索區域 */}
        <Card className="mt-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs text-muted-foreground mb-1 block">名稱搜索</Label>
                <Input
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="輸入素材名稱..."
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
              <Button variant="outline" onClick={handleReset}>
                重置
              </Button>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="safe_page">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <TemplateList
                key={`safe-${refreshKey}-${appliedSearch}`}
                type="safe_page"
                searchName={appliedSearch}
                refreshKey={refreshKey}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="money_page">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <TemplateList
                key={`money-${refreshKey}-${appliedSearch}`}
                type="money_page"
                searchName={appliedSearch}
                refreshKey={refreshKey}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
