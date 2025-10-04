'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  KeyRound,
  Shield,
  Settings,
  LogOut,
  Lock,
  FolderKey
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggleButton, useThemeTransition } from '@/components/ui/theme-toggle-button';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '../ui/button';

const navItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Generate Password',
    url: '/generate',
    icon: KeyRound,
  },
  {
    title: 'Settings',
    url: '/settings',
    icon: Settings,
  },
];

const vaultCategories = [
  {
    title: 'All Items',
    url: '/vault',
    icon: FolderKey,
  },
  {
    title: 'Work',
    url: '/vault?category=work',
    icon: Lock,
  },
  {
    title: 'Personal',
    url: '/vault?category=personal',
    icon: Shield,
  },
  {
    title: 'Banking',
    url: '/vault?category=banking',
    icon: Lock,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const { startTransition } = useThemeTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Signed out successfully');
      router.push('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    startTransition(() => {
      setTheme(newTheme);
    });
  };

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isVaultCategoryActive = (url: string) => {
    if (pathname !== '/vault') return false;

    const category = searchParams.get('category');

    if (url === '/vault' && !category) return true;

    if (url.includes('category=') && category) {
      return url.includes(`category=${category}`);
    }

    return false;
  };

  const currentTheme = (theme === 'system' ? 'light' : theme) as 'light' | 'dark';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <KeyRound className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">PassManager</span>
                  <span className="text-xs">Secure Vault</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Vaults</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vaultCategories.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isVaultCategoryActive(item.url)}
                    tooltip={item.title}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {status === 'loading' ? (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {getUserInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {session?.user?.name || 'User'}
                  </span>
                </div>
                {mounted && (
                  <ThemeToggleButton
                    theme={currentTheme}
                    onClick={handleThemeToggle}
                    variant="circle"
                    start="bottom-left"
                  />
                )}
                <Button
                  onClick={handleSignOut}
                  className='text-red-600 bg-red-200 hover:bg-red-300'
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
