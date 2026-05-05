import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  Users,
  FileText,
  Sparkles,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Übersicht", icon: LayoutGrid },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/workspace", label: "Interview Workspace", icon: Sparkles, highlight: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground relative overflow-hidden">
        {/* spectral accent line */}
        <div className="absolute left-0 top-0 h-full w-[3px] bg-spectral" />

        <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-spectral text-[#1f004c] font-bold text-sm shadow-[var(--shadow-glow)]">
            tf
          </div>
          <div>
            <div className="text-sm font-semibold leading-none tracking-tight">TalentFlow</div>
            <div className="text-[11px] text-sidebar-foreground/60 mt-1">Recruiting Workspace</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] bg-spectral rounded-r" />}
                <Icon className={cn("h-4 w-4", item.highlight && "text-[#00f0c5]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <ShieldCheck className="h-4 w-4 text-[#64e100]" />
            AGG-Compliance aktiv
          </div>
          <p className="mt-1 text-[11px] text-sidebar-foreground/60 leading-relaxed">
            Alle generierten Fragen werden auf rechtlich kritische Inhalte geprüft.
          </p>
        </div>

        <div className="border-t border-sidebar-border p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-spectral text-[#1f004c] flex items-center justify-center text-xs font-bold">
            AV
          </div>
          <div className="text-xs">
            <div className="font-medium">Anna Vollmer</div>
            <div className="text-sidebar-foreground/60">Hiring Manager</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-border bg-card/40 px-6 py-6 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
