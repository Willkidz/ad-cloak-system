/**
 * Design: 淺色側邊欄 + 淺色內容區
 * 主色: #7c3aed (purple-600)
 * 設計稿風格：白色/淺灰側邊欄，紫色高亮活動項
 */
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Globe,
  ScrollText,
  Settings,
  Bell,
  MessageCircle,
  Layers,
} from "lucide-react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { name: "首頁", path: "/", icon: LayoutDashboard },
  { name: "廣告管理", path: "/campaigns", icon: Megaphone },
  { name: "LINE 管理中心", path: "/line", icon: MessageCircle },
  { name: "素材中心", path: "/templates", icon: FileText },
  { name: "域名／短鏈", path: "/domains", icon: Globe },
  { name: "訪問日誌", path: "/logs", icon: ScrollText },
  { name: "像素庫", path: "/pixel-sets", icon: Layers },
  // LIFF 管理已整合進 LINE 管理中心的「LIFF 總覽」Tab
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  // Get current page title for breadcrumb
  const currentNav = NAV_ITEMS.find((item) => isActive(item.path));
  const pageTitle = currentNav?.name || "";

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="bg-sidebar p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C3AED] text-white font-bold text-sm">
              斗
            </div>
            <span className="text-foreground font-semibold text-base tracking-wide">
              斗篷管理系統
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-sidebar px-2 pt-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.name}
                      className="h-10"
                    >
                      <Link to={item.path}>
                        <item.icon className="!h-[18px] !w-[18px]" />
                        <span className="text-[14px]">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="bg-sidebar px-2 pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="系統設定"
                className="h-10 text-muted-foreground"
              >
                <Link to="/settings">
                  <Settings className="!h-[18px] !w-[18px]" />
                  <span className="text-[14px]">系統設定</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SidebarTrigger className="md:hidden -ml-1 mr-1" />
            <span className="font-medium text-foreground hidden sm:inline">Bexnua Ads</span>
            {pageTitle && (
              <>
                <span className="text-muted-foreground/50 hidden sm:inline">›</span>
                <span className="font-medium sm:font-normal">{pageTitle}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                A
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
