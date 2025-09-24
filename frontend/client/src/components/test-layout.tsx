import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";

export function TestLayout({
  isCollapsible = false,
  palette,
  children,
}: {
  isCollapsible?: boolean;
  palette: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppHeader isCollapsible={isCollapsible} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar>
          <SidebarHeader>
            <h4 className="font-semibold text-foreground">Question Palette</h4>
          </SidebarHeader>
          <SidebarContent>{palette}</SidebarContent>
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
