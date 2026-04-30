/**
 * RichEditor - TinyMCE 富文本編輯器元件
 * 功能：
 * 1. 完整的中文菜單列（文件/編輯/查看/插入/格式/工具/表格）
 * 2. 完整的三行工具列（仿火鳥設計）
 * 3. 自定義「+ 按鈕」：在編輯器中插入帶樣式的 CTA 按鈕
 * 4. 自定義「編輯按鈕」：列出並管理所有已建立的按鈕
 * 5. 自定義「素材庫」：從 R2 選擇圖片插入（需後端 R2 配置）
 * 6. 中文語言包（zh_TW）
 */
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Editor } from "@tinymce/tinymce-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ==================== Types ====================
interface CtaButton {
  id: string;
  content: string;
  width: string;
  height: string;
  fontSize: string;
  borderRadius: string;
  bgColor: string;
  textColor: string;
  bottomPosition: string;
  animation: boolean;
}

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  /** CSS extracted from full HTML document's <head> <style> tags, injected into TinyMCE iframe */
  extractedStyles?: string;
}

// ==================== CTA Button HTML Generator ====================
function generateCtaButtonHtml(btn: CtaButton): string {
  const animationCss = btn.animation
    ? `animation: ctaPulse 2s ease-in-out infinite;`
    : "";
  const animationKeyframes = btn.animation
    ? `<style>@keyframes ctaPulse{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.05)}}</style>`
    : "";

  return `${animationKeyframes}<div data-cta-button-id="${btn.id}" contenteditable="false" style="position:relative;margin:16px auto;width:${btn.width};text-align:center;${animationCss}" data-fixed-bottom="${btn.bottomPosition}"><a href="javascript:gotolink();" style="display:inline-block;width:100%;height:${btn.height};line-height:${btn.height};background:${btn.bgColor};color:${btn.textColor};font-size:${btn.fontSize};border-radius:${btn.borderRadius};text-decoration:none;font-weight:bold;cursor:pointer;">${btn.content}</a></div>`;
}

// ==================== Random CTA Texts ====================
const CTA_TEXTS = [
  "立即前往", "馬上領取", "點擊查看", "立即加入", "免費體驗",
  "了解更多", "立即開始", "搶先體驗", "馬上加入", "點擊領取",
  "立即參加", "免費加入", "馬上查看", "立即體驗", "點擊前往",
  "搶先加入", "立即領取", "馬上開始", "點擊加入", "立即查看",
];
const randomCta = () => CTA_TEXTS[Math.floor(Math.random() * CTA_TEXTS.length)];

// ==================== Add/Edit CTA Button Dialog ====================
function CtaButtonDialog({
  open,
  onOpenChange,
  initialData,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CtaButton | null;
  onConfirm: (btn: CtaButton) => void;
}) {
  const [content, setContent] = useState(randomCta);
  const [width, setWidth] = useState("50");
  const [height, setHeight] = useState("45");
  const [fontSize, setFontSize] = useState("24");
  const [borderRadius, setBorderRadius] = useState("12");
  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");
  const [bottomPosition, setBottomPosition] = useState("5");
  const [animation, setAnimation] = useState(false);

  useEffect(() => {
    if (initialData) {
      setContent(initialData.content);
      setWidth(initialData.width.replace("%", ""));
      setHeight(initialData.height.replace("px", ""));
      setFontSize(initialData.fontSize.replace("px", ""));
      setBorderRadius(initialData.borderRadius.replace("px", ""));
      setBgColor(initialData.bgColor);
      setTextColor(initialData.textColor);
      setBottomPosition(initialData.bottomPosition.replace("%", ""));
      setAnimation(initialData.animation);
    } else {
      setContent(randomCta());
      setWidth("50");
      setHeight("45");
      setFontSize("24");
      setBorderRadius("12");
      setBgColor("#000000");
      setTextColor("#ffffff");
      setBottomPosition("5");
      setAnimation(false);
    }
  }, [initialData, open]);

  const handleConfirm = () => {
    if (!content.trim()) {
      toast.error("請輸入按鈕內容");
      return;
    }
    onConfirm({
      id: initialData?.id || `cta-${Date.now()}`,
      content,
      width: `${width}%`,
      height: `${height}px`,
      fontSize: `${fontSize}px`,
      borderRadius: `${borderRadius}px`,
      bgColor,
      textColor,
      bottomPosition: `${bottomPosition}%`,
      animation,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "編輯按鈕" : "自定義按鈕"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              <span className="text-destructive">*</span> 內容
            </Label>
            <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="按鈕文字" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">寬度</Label>
              <div className="flex items-center gap-1">
                <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="flex-1" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">高度</Label>
              <div className="flex items-center gap-1">
                <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="flex-1" />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">字體大小</Label>
              <div className="flex items-center gap-1">
                <Input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="flex-1" />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">圓角</Label>
              <div className="flex items-center gap-1">
                <Input type="number" value={borderRadius} onChange={(e) => setBorderRadius(e.target.value)} className="flex-1" />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">背景顏色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">字體顏色</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded border cursor-pointer"
                />
                <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="flex-1" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">底部位置</Label>
            <div className="flex items-center gap-1">
              <Input type="number" value={bottomPosition} onChange={(e) => setBottomPosition(e.target.value)} className="flex-1" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">動畫</Label>
            <Switch checked={animation} onCheckedChange={setAnimation} />
          </div>

          {/* 預覽 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">預覽</Label>
            <div className="border rounded-lg p-4 bg-gray-100 flex items-center justify-center min-h-[80px] relative">
              <div
                style={{
                  width: `${width}%`,
                  height: `${height}px`,
                  lineHeight: `${height}px`,
                  background: bgColor,
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  borderRadius: `${borderRadius}px`,
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                {content || "按鈕文字"}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm}>確認</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Edit Buttons List Dialog ====================
function EditButtonsDialog({
  open,
  onOpenChange,
  buttons,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buttons: CtaButton[];
  onEdit: (btn: CtaButton) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>編輯按鈕列表</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {buttons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              尚未建立任何按鈕
            </div>
          ) : (
            buttons.map((btn) => (
              <div
                key={btn.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
                    style={{ background: btn.bgColor, color: btn.textColor }}
                  >
                    A
                  </div>
                  <div>
                    <div className="text-sm font-medium">{btn.content}</div>
                    <div className="text-xs text-muted-foreground">
                      {btn.width} × {btn.height} · 底部 {btn.bottomPosition}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(btn)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(btn.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>關閉</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Media Library Dialog ====================
function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}) {
  const [images, setImages] = useState<Array<{ url: string; name: string; asset_key: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 從後端 API 載入素材列表
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    const apiBase = import.meta.env.VITE_API_URL ?? 'https://admin-api.bexnua.store/api/v1';
    const apiKey = import.meta.env.VITE_API_KEY ?? '';
    fetch(`${apiBase}/media/list`, {
      headers: { 'X-API-Key': apiKey },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.assets)) {
          setImages(
            data.assets.map((a: any) => ({
              url: a.url || a.public_url || `${apiBase}/media/file/${encodeURIComponent(a.asset_key)}`,
              name: a.filename || a.asset_key || 'unnamed',
              asset_key: a.asset_key || '',
            }))
          );
        } else {
          setImages([]);
        }
      })
      .catch((err) => {
        console.error('Failed to load media library:', err);
        setError('載入素材庫失敗，請稍後再試');
      })
      .finally(() => setLoading(false));
  }, [open]);

  // 上傳素材
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL ?? 'https://admin-api.bexnua.store/api/v1';
      const apiKey = import.meta.env.VITE_API_KEY ?? '';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'general');
      const res = await fetch(`${apiBase}/media/upload`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success('素材上傳成功');
        // 重新載入列表
        const listRes = await fetch(`${apiBase}/media/list`, {
          headers: { 'X-API-Key': apiKey },
        });
        const listData = await listRes.json();
        if (listData.success && Array.isArray(listData.assets)) {
          setImages(
            listData.assets.map((a: any) => ({
              url: a.url || a.public_url || `${apiBase}/media/file/${encodeURIComponent(a.asset_key)}`,
              name: a.filename || a.asset_key || 'unnamed',
              asset_key: a.asset_key || '',
            }))
          );
        }
      } else {
        toast.error('上傳失敗：' + (data.error || '未知錯誤'));
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('上傳失敗');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col" style={{ zIndex: 100000 }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>素材庫</DialogTitle>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? '上傳中...' : '上傳素材'}
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">載入中...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="text-sm font-medium">{error}</div>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-3">🖼️</div>
                <div className="text-sm font-medium">素材庫為空</div>
                <div className="text-xs mt-1">點擊「上傳素材」新增圖片</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 w-full p-1">
              {images.map((img) => (
                <div
                  key={img.asset_key || img.url}
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-colors ${
                    selectedUrl === img.url ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedUrl(img.url)}
                  onDoubleClick={() => {
                    onSelect(img.url);
                    onOpenChange(false);
                  }}
                >
                  <img src={img.url} alt={img.name} className="w-full h-24 object-cover bg-muted" />
                  <div className="p-1 text-xs text-center truncate">{img.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            disabled={!selectedUrl}
            onClick={() => {
              if (selectedUrl) {
                onSelect(selectedUrl);
                onOpenChange(false);
              }
            }}
          >
            確認
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Main RichEditor Component ====================
export default function RichEditor({ value, onChange, placeholder, height = 600, extractedStyles = '' }: RichEditorProps) {
  const editorRef = useRef<any>(null);

  // CTA Button state
  const [ctaButtons, setCtaButtons] = useState<CtaButton[]>([]);
  const [addBtnOpen, setAddBtnOpen] = useState(false);
  const [editBtnOpen, setEditBtnOpen] = useState(false);
  const [editingBtn, setEditingBtn] = useState<CtaButton | null>(null);
  const [editListOpen, setEditListOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  // Inject zh_TW translations as early as possible (before TinyMCE renders menus)
  useEffect(() => {
    const injectI18n = () => {
      const tmce = (window as any).tinymce;
      if (tmce && tmce.addI18n) {
        tmce.addI18n('zh_TW', {
          'File': '文件', 'Edit': '編輯', 'View': '查看', 'Insert': '插入',
          'Format': '格式', 'Tools': '工具', 'Table': '表格',
          'Undo': '復原', 'Redo': '取消復原',
          'Bold': '粗體', 'Italic': '斜體', 'Underline': '底線', 'Strikethrough': '刪除線',
          'Align left': '靠左對齊', 'Align center': '置中對齊',
          'Align right': '靠右對齊', 'Justify': '兩端對齊',
          'Bullet list': '項目符號清單', 'Numbered list': '編號清單',
          'Decrease indent': '減少縮排', 'Increase indent': '增加縮排',
          'Text color': '文字顏色', 'Background color': '背景顏色',
          'Clear formatting': '清除格式', 'Link': '連結', 'Image': '圖片',
          'Emoticons': '表情符號', 'Source code': '源碼',
          'Font sizes': '字型大小', 'Fonts': '字型', 'Paragraph': '段落',
          'New document': '新增文件', 'Print': '列印', 'Preview': '預覽',
          'Cut': '剪下', 'Copy': '複製', 'Paste': '貼上', 'Select all': '全選',
          'Find and replace': '尋找與取代', 'Fullscreen': '全螢幕',
          'Insert table': '插入表格', 'Table properties': '表格屬性',
          'Delete table': '刪除表格', 'Word count': '字數統計',
        });
      }
    };
    // Try immediately and also after a short delay (in case TinyMCE loads async)
    injectI18n();
    const timer = setTimeout(injectI18n, 500);
    return () => clearTimeout(timer);
  }, []);

  // Parse existing CTA buttons from content on mount
  useEffect(() => {
    if (value) {
      const regex = /data-cta-button-id="([^"]+)"/g;
      const ids: string[] = [];
      let match;
      while ((match = regex.exec(value)) !== null) {
        ids.push(match[1]);
      }
      if (ids.length > 0 && ctaButtons.length === 0) {
        const parsed: CtaButton[] = ids.map((id) => ({
          id,
          content: "按鈕",
          width: "50%",
          height: "45px",
          fontSize: "24px",
          borderRadius: "12px",
          bgColor: "#000000",
          textColor: "#ffffff",
          bottomPosition: "5%",
          animation: false,
        }));
        setCtaButtons(parsed);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle adding a new CTA button
  const handleAddCtaButton = useCallback(
    (btn: CtaButton) => {
      setCtaButtons((prev) => [...prev, btn]);
      const html = generateCtaButtonHtml(btn);
      if (editorRef.current) {
        editorRef.current.insertContent(html);
        const newValue = editorRef.current.getContent();
        onChange(newValue);
      }
    },
    [onChange]
  );

  // Handle editing an existing CTA button
  const handleEditCtaButton = useCallback(
    (btn: CtaButton) => {
      setCtaButtons((prev) => prev.map((b) => (b.id === btn.id ? btn : b)));
      if (editorRef.current) {
        const content = editorRef.current.getContent();
        const regex = new RegExp(
          `(<style>@keyframes ctaPulse\\{[^}]+\\}[^}]+\\}</style>)?<div data-cta-button-id="${btn.id}"[^>]*>.*?</div>`,
          "gs"
        );
        const newContent = content.replace(regex, generateCtaButtonHtml(btn));
        editorRef.current.setContent(newContent);
        onChange(newContent);
      }
      setEditingBtn(null);
      setEditBtnOpen(false);
    },
    [onChange]
  );

  // Handle deleting a CTA button
  const handleDeleteCtaButton = useCallback(
    (id: string) => {
      setCtaButtons((prev) => prev.filter((b) => b.id !== id));
      if (editorRef.current) {
        const content = editorRef.current.getContent();
        const regex = new RegExp(
          `(<style>@keyframes ctaPulse\\{[^}]+\\}[^}]+\\}</style>)?<div data-cta-button-id="${id}"[^>]*>.*?</div>`,
          "gs"
        );
        const newContent = content.replace(regex, "");
        editorRef.current.setContent(newContent);
        onChange(newContent);
      }
      toast.success("按鈕已刪除");
    },
    [onChange]
  );

  // Handle media library selection
  const handleMediaSelect = useCallback(
    (url: string) => {
      if (editorRef.current) {
        editorRef.current.insertContent(`<img src="${url}" alt="素材圖片" style="max-width:100%;" />`);
      }
      setMediaOpen(false);
    },
    []
  );

  const handleInit = useCallback((_evt: any, editor: any) => {
    editorRef.current = editor;
  }, []);

  const handleEditorChange = useCallback(
    (content: string) => {
      // Transform CTA buttons back to position:fixed for output/save
      // In editor they display as position:relative, but saved HTML needs position:fixed
      let output = content;
      output = output.replace(
        /<div data-cta-button-id="([^"]+)" contenteditable="false" style="position:relative;margin:16px auto;width:([^"]+);text-align:center;([^"]*)" data-fixed-bottom="([^"]+)">/g,
        '<div data-cta-button-id="$1" style="position:fixed;bottom:$4;left:50%;transform:translateX(-50%);z-index:9999;width:$2;text-align:center;$3">'
      );
      onChange(output);
    },
    [onChange]
  );

  // Transform incoming value: convert position:fixed CTA buttons to position:relative for editor display
  // For full HTML documents: extract only body content (styles are injected via extractedStyles prop)
  const editorValue = useMemo(() => {
    if (!value) return value;
    let processed = value;

    // If content is a full HTML document, extract only body content
    // Styles are handled separately via extractedStyles prop + content_style
    if (processed.match(/<!DOCTYPE\s+html|<html[\s>]/i)) {
      // Extract body content
      const bodyMatch = processed.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        processed = bodyMatch[1];
      } else {
        // Fallback: strip html/head/body tags
        processed = processed
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<\/?html[^>]*>/gi, '')
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
          .replace(/<\/?body[^>]*>/gi, '');
      }
    }

    // Convert position:fixed CTA buttons to position:relative for editor display
    processed = processed.replace(
      /<div data-cta-button-id="([^"]+)" style="position:fixed;bottom:([^"]+);left:50%;transform:translateX\(-50%\);z-index:9999;width:([^"]+);text-align:center;([^"]*?)">/g,
      '<div data-cta-button-id="$1" contenteditable="false" style="position:relative;margin:16px auto;width:$3;text-align:center;$4" data-fixed-bottom="$2">'
    );
    return processed;
  }, [value]);

  // Use a stable key based on extractedStyles to force TinyMCE remount when styles change
  // This ensures content_style is re-applied with the new extracted CSS
  const editorKey = useMemo(() => {
    if (!extractedStyles) return 'default';
    // Simple hash to create a stable key
    let hash = 0;
    for (let i = 0; i < extractedStyles.length; i++) {
      hash = ((hash << 5) - hash) + extractedStyles.charCodeAt(i);
      hash |= 0;
    }
    return `styles-${hash}`;
  }, [extractedStyles]);

  return (
    <div className="rich-editor-wrapper" style={{ width: '100%' }}>
      <Editor
        key={editorKey}
        licenseKey="gpl"
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        onInit={handleInit}
        value={editorValue}
        onEditorChange={handleEditorChange}
        init={{
          height,
          width: '100%',
          // ---- 語言設定 ----
          language: "zh_TW",
          language_url: "/tinymce/langs/zh_TW.js",

          // ---- 菜單列（中文） ----
          menubar: "file edit view insert format tools table",
          menu: {
            file: { title: "文件", items: "newdocument restoredraft | preview | export print | deleteallconversations" },
            edit: { title: "編輯", items: "undo redo | cut copy paste pastetext | selectall | searchreplace" },
            view: { title: "查看", items: "code revisionhistory | visualaid visualchars visualblocks | spellchecker | preview fullscreen | showcomments" },
            insert: { title: "插入", items: "image link media addcomment pageembed template codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor tableofcontents | insertdatetime" },
            format: { title: "格式", items: "bold italic underline strikethrough superscript subscript codeformat | styles blocks fontfamily fontsize align lineheight | forecolor backcolor | language | removeformat" },
            tools: { title: "工具", items: "spellchecker spellcheckerlanguage | a11ycheck code wordcount" },
            table: { title: "表格", items: "inserttable | cell row column | advtablesort | tableprops deletetable" },
          },

          // ---- 插件 ----
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "wordcount",
            "emoticons",
          ],

          // ---- 三行工具列（仿火鳥設計）----
          // 使用 toolbar1/toolbar2/toolbar3 實現真正的三行工具列
          toolbar1: "undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify",
          toolbar2: "bullist numlist | outdent indent | forecolor backcolor removeformat | link image emoticons code",
          toolbar3: "customMediaLibrary customAddButton customEditButton",

          // ---- 字體設定 ----
          font_family_formats:
            "微軟正黑體=Microsoft JhengHei,sans-serif;" +
            "蘋方=PingFang TC,sans-serif;" +
            "思源黑體=Noto Sans TC,sans-serif;" +
            "Arial=arial,helvetica,sans-serif;" +
            "Georgia=georgia,palatino;" +
            "Times New Roman=times new roman,times;" +
            "Verdana=verdana,geneva",
          font_size_formats: "8px 10px 12px 14px 16px 18px 20px 24px 28px 32px 36px 48px 72px",

          // ---- 段落格式 ----
          block_formats: "段落=p; 標題 1=h1; 標題 2=h2; 標題 3=h3; 標題 4=h4; 標題 5=h5; 標題 6=h6; 引用=blockquote; 程式碼=pre",

          // ---- 樣式設定 ----
          // Inject extracted styles from full HTML documents into TinyMCE iframe head
          content_style:
            (extractedStyles ? extractedStyles + '\n' : '') +
            "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Microsoft JhengHei', sans-serif; font-size: 16px; line-height: 1.6; padding: 8px 12px; } div[data-cta-button-id] { position:relative !important; margin:16px auto !important; border:2px dashed #7C3AED; border-radius:8px; padding:4px; cursor:default; } div[data-cta-button-id]::before { content:'CTA 按鈕 (編輯按鈕修改)'; display:block; font-size:11px; color:#7C3AED; text-align:center; margin-bottom:4px; }",
          placeholder: placeholder || "在此編輯內容...",
          branding: false,
          promotion: false,
          resize: true,
          statusbar: true,
          z_index: 99999,

          // ---- URL 處理：禁用自動轉換，避免跨域圖片破圖 ----
          convert_urls: false,
          relative_urls: false,
          remove_script_host: false,

          // ---- 允許所有 HTML 元素和屬性，避免 TinyMCE 剝離樣式 ----
          valid_elements: '*[*]',
          valid_children: '+body[style|link],+div[*],+a[div|p|span|img]',
          extended_valid_elements: 'style[*],link[*],meta[*],script[*],div[*],span[*],a[*],img[*],input[*],button[*],section[*],article[*],header[*],footer[*],nav[*],main[*],figure[*],figcaption[*]',
          custom_elements: '~style',
          verify_html: false,

          // ---- 皮膚 ----
          skin: "oxide",
          content_css: "default",

          // ---- 自定義按鈕 ----
          setup: (editor: any) => {
            // 內嵌中文翻譯，確保即使語言包檔案無法載入也顯示中文
            if (typeof (window as any).tinymce !== 'undefined') {
              (window as any).tinymce.addI18n('zh_TW', {
                'File': '文件', 'Edit': '編輯', 'View': '查看', 'Insert': '插入',
                'Format': '格式', 'Tools': '工具', 'Table': '表格',
                'Undo': '復原', 'Redo': '取消復原',
                'Bold': '粗體', 'Italic': '斜體', 'Underline': '底線', 'Strikethrough': '刪除線',
                'Align left': '靠左對齊', 'Align center': '置中對齊',
                'Align right': '靠右對齊', 'Justify': '兩端對齊',
                'Bullet list': '項目符號清單', 'Numbered list': '編號清單',
                'Decrease indent': '減少縮排', 'Increase indent': '增加縮排',
                'Text color': '文字顏色', 'Background color': '背景顏色',
                'Clear formatting': '清除格式', 'Link': '連結', 'Image': '圖片',
                'Emoticons': '表情符號', 'Source code': '源碼',
                'Font sizes': '字型大小', 'Fonts': '字型', 'Paragraph': '段落',
                'New document': '新增文件', 'Print': '列印', 'Preview': '預覽',
                'Cut': '剪下', 'Copy': '複製', 'Paste': '貼上', 'Select all': '全選',
                'Find and replace': '尋找與取代', 'Fullscreen': '全螢幕',
                'Insert table': '插入表格', 'Table properties': '表格屬性',
                'Delete table': '刪除表格', 'Word count': '字數統計',
              });
            }

            // 自定義按鈕：素材庫（source-image 圖標）
            editor.ui.registry.addButton("customMediaLibrary", {
              icon: "source-image",
              tooltip: "素材庫",
              text: "素材庫",
              onAction: () => {
                setMediaOpen(true);
              },
            });

            // 自定義按鈕：+ 按鈕（template-add 圖標）
            editor.ui.registry.addButton("customAddButton", {
              icon: "template-add",
              tooltip: "新增 CTA 按鈕",
              text: "+ 按鈕",
              onAction: () => {
                setEditingBtn(null);
                setAddBtnOpen(true);
              },
            });

            // 自定義按鈕：編輯按鈕（edit-block 圖標）
            editor.ui.registry.addButton("customEditButton", {
              icon: "edit-block",
              tooltip: "編輯已建立的按鈕",
              text: "編輯按鈕",
              onAction: () => {
                setEditListOpen(true);
              },
            });
          },
        }}
      />

      {/* 新增 CTA 按鈕彈窗 */}
      <CtaButtonDialog
        open={addBtnOpen}
        onOpenChange={setAddBtnOpen}
        initialData={null}
        onConfirm={handleAddCtaButton}
      />

      {/* 編輯 CTA 按鈕彈窗 */}
      <CtaButtonDialog
        open={editBtnOpen}
        onOpenChange={setEditBtnOpen}
        initialData={editingBtn}
        onConfirm={handleEditCtaButton}
      />

      {/* 編輯按鈕列表彈窗 */}
      <EditButtonsDialog
        open={editListOpen}
        onOpenChange={setEditListOpen}
        buttons={ctaButtons}
        onEdit={(btn) => {
          setEditingBtn(btn);
          setEditListOpen(false);
          setEditBtnOpen(true);
        }}
        onDelete={handleDeleteCtaButton}
      />

      {/* 素材庫彈窗 */}
      <MediaLibraryDialog
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={handleMediaSelect}
      />
    </div>
  );
}
