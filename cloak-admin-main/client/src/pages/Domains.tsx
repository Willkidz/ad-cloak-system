import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Plus, Loader2, RefreshCw, CheckCircle2, Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchDomains, resolveDomain, checkZone, deleteDomain
} from "@/lib/api";

interface Domain {
  id: number;
  domain: string;
  zone_id: string;
  status: string;
  note: string; 
  created_at: string;
  updated_at: string;
}

function DomainResolver() {
  const [domainInput, setDomainInput] = useState("");
  const [resolving, setResolving] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchDomains();
      if (res.success) setDomains(res.data?.domains || []);
    } catch {
      toast.error("載入域名列表失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDomains(); }, [loadDomains]);

  const handleResolve = async () => {
    const d = domainInput.trim();
    if (!d) { toast.error("請輸入域名"); return; }
    setResolving(true);
    try {
      const res = await resolveDomain(d);
      if (res.success) {
        toast.success("域名解析成功，請按照指引設置 DNS");
        setDomainInput("");
        loadDomains();
      } else {
        toast.error(res.error || "解析失敗");
      }
    } catch (e: any) {
      toast.error("解析出錯: " + e.message);
    } finally {
      setResolving(false);
    }
  };

  const handleCheckStatus = async (zoneId: string) => {
    setCheckingId(zoneId);
    try {
      const res = await checkZone(zoneId);
      if (res.success) {
        if (res.data.status === 'active') {
          toast.success("DNS 已生效！");
        } else {
          toast.info("DNS 尚未生效，請稍後再試");
        }
        loadDomains();
      }
    } catch {
      toast.error("檢查失敗");
    } finally {
      setCheckingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除此域名記錄嗎？")) return;
    try {
      const res = await deleteDomain(id);
      if (res.success) {
        toast.success("已刪除");
        loadDomains();
      }
    } catch {
      toast.error("刪除失敗");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>解析新域名</CardTitle>
          <CardDescription>輸入您在 GoDaddy 購買的域名，系統將自動在 Cloudflare 建立解析</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 max-w-md">
            <div className="flex-1">
              <Input
                placeholder="例如: example.com"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleResolve()}
              />
            </div>
            <Button onClick={handleResolve} disabled={resolving}>
              {resolving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              解析域名
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>域名解析列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">序號</TableHead>
                <TableHead>域名</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead className="w-[450px]">描述</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : domains.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暫無解析記錄</TableCell></TableRow>
              ) : (
                domains.map((d, index) => (
                  <TableRow key={d.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{d.domain}</TableCell>
                    <TableCell>
                      {d.status === "active" ? (
                        <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> 已生效</Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50"><RefreshCw className="h-3 w-3 mr-1" /> 未生效</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {d.status === "active" ? (
                        <span className="text-green-600 flex items-center text-sm"><CheckCircle2 className="h-4 w-4 mr-1.5" /> DNS 解析正常</span>
                      ) : (
                        <div className="text-sm space-y-1">
                          <p className="text-orange-600 font-medium">當前域名未設置正確的 DNS 服務器，解析未生效。</p>
                          <p className="text-muted-foreground">請前往域名註冊商 (如 GoDaddy) 設置 DNS 服務器：</p>
                          <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-xs flex gap-4">
                            {d.note ? d.note.split(',').map(ns => <span key={ns} className="text-blue-600">{ns}</span>) : "獲取中..."}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCheckStatus(d.zone_id)}
                        disabled={checkingId === d.zone_id}
                      >
                        {checkingId === d.zone_id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                        檢查狀態
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Domains() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">域名解析管理</h1>
      </div>
      <DomainResolver />
    </div>
  );
}
