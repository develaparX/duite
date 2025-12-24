import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  PieChart,
  TrendingUp,
  CreditCard,
  BarChart3,
  User,
  Search,
  ChevronsUpDown,
  Settings,
  ArrowRightLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAppNavigation,
  getNavigationItems,
  getBreadcrumbs,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigationItems = getNavigationItems();

export function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Sidebar Component for reuse
  const SidebarContent = ({
    mobile = false,
    onItemClick,
  }: {
    mobile?: boolean;
    onItemClick?: () => void;
  }) => (
    <div className="flex h-full flex-col gap-4">
      {/* Sidebar Header / Team Switcher */}
      <div
        className={cn(
          "flex h-14 items-center border-b px-4 lg:h-[60px]",
          isCollapsed && !mobile ? "justify-center px-2" : "px-6"
        )}
      >
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 font-semibold",
            isCollapsed && !mobile && "justify-center"
          )}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <PieChart className="h-4 w-4" />
          </div>
          {(!isCollapsed || mobile) && <span className="">Duite</span>}
        </Link>
        {(!isCollapsed || mobile) && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8"
            onClick={() => !mobile && setIsCollapsed(!isCollapsed)}
          >
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2 text-sm font-medium">
          {(!isCollapsed || mobile) && (
            <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Platform
            </div>
          )}
          {navigationItems.map((item) => {
            const IconComponent = getIconComponent(item.icon);
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive ? "bg-muted text-primary" : "text-muted-foreground",
                  isCollapsed && !mobile && "justify-center px-2"
                )}
                title={isCollapsed && !mobile ? item.title : undefined}
              >
                <IconComponent className="h-4 w-4" />
                {(!isCollapsed || mobile) && item.title}
              </Link>
            );
          })}

          {(!isCollapsed || mobile) && (
            <div className="mt-6 px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settings
            </div>
          )}
          <Link
            to={"/profile" as any}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isCollapsed && !mobile && "justify-center px-2"
            )}
            title={isCollapsed && !mobile ? "Profile" : undefined}
          >
            <User className="h-4 w-4" />
            {(!isCollapsed || mobile) && "Profile"}
          </Link>
          <Link
            to={"/settings" as any}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isCollapsed && !mobile && "justify-center px-2"
            )}
            title={isCollapsed && !mobile ? "Settings" : undefined}
          >
            <Settings className="h-4 w-4" />
            {(!isCollapsed || mobile) && "Settings"}
          </Link>
        </nav>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "grid min-h-screen w-full transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:grid-cols-[60px_1fr]" : "lg:grid-cols-[280px_1fr]"
      )}
    >
      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <div className="hidden border-r bg-muted/40 lg:block relative group">
        <SidebarContent />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden lg:flex items-center justify-center",
            isCollapsed && "rotate-180"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronsUpDown className="h-3 w-3 rotate-90" />
        </Button>
      </div>

      {/* Main Column */}
      <div className="flex flex-col overflow-hidden pb-16 lg:pb-0">
        {/* Top Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 justify-between lg:justify-start">
          {/* Mobile Brand - Visible only on mobile/tablet */}
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold lg:hidden"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PieChart className="h-4 w-4" />
            </div>
            <span>Duite</span>
          </Link>

          {/* Breadcrumbs - Hidden on mobile/tablet */}
          <div className="hidden lg:flex w-full flex-1">
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={item.href}>
                    <BreadcrumbItem>
                      {index < breadcrumbs.length - 1 ? (
                        <BreadcrumbLink asChild>
                          <Link to={item.href}>{item.title}</Link>
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage className="font-semibold">
                          {item.title}
                        </BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-4">
            {/* Search - Icon only on mobile maybe? Or kept standard but collapsible if needed. Keeping standard for now but checking width */}
            <form className="ml-auto flex-1 sm:flex-initial hidden sm:block">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-80"
                />
              </div>
            </form>
            {/* Mobile Search Trigger could be added here if we hide form on mobile, but for now just hiding form on very small screens to save space for Logo */}

            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile/Tablet Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden block">
        <nav className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => {
            const IconComponent = getIconComponent(item.icon);
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <IconComponent className="h-6 w-6" />
                {/* Icon only as requested */}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user } = useAuth();
  const { navigateAfterLogout } = useAppNavigation();

  const handleLogout = () => {
    navigateAfterLogout();
  };

  if (!user) {
    return null;
  }

  const initials = user.fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Support</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to get icon components
function getIconComponent(iconName: string) {
  const icons = {
    PieChart,
    TrendingUp,
    CreditCard,
    BarChart3,
    ArrowRightLeft,
  };
  return icons[iconName as keyof typeof icons] || PieChart;
}
