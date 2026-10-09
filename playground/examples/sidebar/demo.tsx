import { CalendarIcon, HomeIcon, InboxIcon, SearchIcon, SettingsIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "leastui";

const items = [
  { title: "Home", icon: HomeIcon, active: true },
  { title: "Inbox", icon: InboxIcon, badge: 24 },
  { title: "Calendar", icon: CalendarIcon },
  { title: "Search", icon: SearchIcon },
];

export default function SidebarDemo() {
  return (
    // In an app, SidebarProvider wraps the whole layout and Sidebar is fixed to the viewport.
    // Here it is contained in a box so it can be previewed.
    <SidebarProvider className="h-80 min-h-0 w-full max-w-lg overflow-hidden rounded-lg border">
      <Sidebar collapsible="none" className="border-r">
        <SidebarHeader className="px-4 py-3 font-semibold">Acme Inc.</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton isActive={item.active}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <SettingsIcon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        Page content
      </div>
    </SidebarProvider>
  );
}
