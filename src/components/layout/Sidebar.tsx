import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  CalendarRange,
  Megaphone,
  Users,
  SearchCheck,
  Target,
  Palette,
  Image,
  PenLine,
  Video,
  MessageSquare,
  FileText,
  Settings,
  Plug,
  LogOut,
  ChevronLeft,
  Zap,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { cn } from '@/lib/utils';
import { CreditUsageMini } from '@/components/shared/CreditUsage';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/roadmap', label: 'Roadmap', icon: Map },
    ],
  },
  {
    label: 'Execution',
    items: [
      { to: '/content-calendar', label: 'Content Calendar', icon: CalendarRange },
      { to: '/campaigns', label: 'Campaign Planner', icon: Megaphone },
      { to: '/leads', label: 'Leads', icon: Users },
    ],
  },
  {
    label: 'SEO',
    items: [
      { to: '/seo/analyzer', label: 'SEO Analyzer', icon: SearchCheck },
      { to: '/seo/report', label: 'SEO Report', icon: FileText },
      { to: '/seo-plan', label: 'SEO Plan', icon: Target },
    ],
  },
  {
    label: 'Strategy',
    items: [
      { to: '/campaign-strategy', label: 'Campaign Strategy', icon: Target },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Assets',
    items: [
      { to: '/branding', label: 'Branding Vault', icon: Palette },
      { to: '/creative-library', label: 'Creative Library', icon: Image },
    ],
  },
  {
    label: 'AI Tools',
    items: [
      { to: '/ai/ad-copy', label: 'Ad Copy', icon: PenLine },
      { to: '/ai/video-scripts', label: 'Video Scripts', icon: Video },
      { to: '/ai/social-captions', label: 'Social Captions', icon: MessageSquare },
      { to: '/ai/blog-planner', label: 'Blog Planner', icon: FileText },
      { to: '/skills', label: 'All AI Skills', icon: Sparkles },
    ],
  },
];

const bottomItems = [
  { to: '/integrations', label: 'Integrations', icon: Plug },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { logout } = useAuth();
  const { currentOrg } = useOrg();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] transition-all duration-200',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
              Syntra OS
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-[hsl(var(--sidebar-hover))] hover:text-foreground transition-colors"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Organization */}
      {currentOrg && !collapsed && (
        <div className="border-b border-[hsl(var(--sidebar-border))] px-4 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">Organization</p>
          <p className="truncate text-xs font-medium text-foreground/80 mt-0.5">{currentOrg.name}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-foreground'
                    )
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Credit usage mini bar */}
      {!collapsed && (
        <div className="border-t border-[hsl(var(--sidebar-border))]">
          <CreditUsageMini />
        </div>
      )}

      {/* Bottom links */}
      <div className="border-t border-[hsl(var(--sidebar-border))] px-2 pt-2 pb-1 space-y-0.5">
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-hover))] hover:text-foreground'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        <button
          onClick={() => { logout().catch(() => {}); }}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-[hsl(var(--sidebar-foreground))] transition-colors hover:bg-[hsl(var(--sidebar-hover))] hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
