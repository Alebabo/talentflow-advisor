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
import metafinanzLogo from "@/assets/metafinanz-logo.jpg";

import { BookOpen } from "lucide-react";

const nav = [
  { to: "/", label: "Übersicht", icon: LayoutGrid },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/teams", label: "Teams", icon: Users },
  { to: "/workspace", label: "Interview Workspace", icon: Sparkles, highlight: true },
  { to: "/leitfaden", label: "Interview-Leitfaden", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground relative border-r border-sidebar-border">
        {/* spectral accent line */}
        <div className="absolute left-0 top-0 h-full w-[3px] bg-spectral" />

        <div className="flex h-20 items-center gap-3 px-5 border-b border-sidebar-border">
          <img
            src={metafinanzLogo}
            alt="metafinanz"
            className="h-11 w-11 rounded-full object-contain"
          />
          <div>
            <div className="text-sm font-semibold leading-none tracking-tight text-foreground">TalentFlow</div>
            <div className="text-[11px] text-muted-foreground mt-1.5">by metafinanz</div>
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
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                {active && <span className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-[3px] bg-spectral rounded-r" />}
                <Icon className={cn("h-4 w-4", active ? "text-[#854bff]" : "text-current/70", item.highlight && !active && "text-[#854bff]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral" />
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-[#0a8e76]" />
            AGG-Compliance aktiv
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            Alle generierten Fragen werden auf rechtlich kritische Inhalte geprüft.
          </p>
        </div>

        <div className="border-t border-sidebar-border p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-spectral text-[#1f004c] flex items-center justify-center text-xs font-bold">
            AV
          </div>
          <div className="text-xs">
            <div className="font-medium text-foreground">Anna Vollmer</div>
            <div className="text-muted-foreground">Hiring Manager</div>
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
    <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between bg-card px-6 py-7 md:px-10">
      <div>
        <h1 className="text-[28px] font-semibold text-foreground tracking-tight leading-tight">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-spectral opacity-80" />
    </div>
  );
}
