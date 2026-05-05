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
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
            TF
          </div>
          <div>
            <div className="text-sm font-semibold text-sidebar-foreground leading-none">TalentFlow</div>
            <div className="text-[11px] text-muted-foreground mt-1">Recruiting Workspace</div>
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
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  item.highlight && !active && "text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="m-3 rounded-lg border border-sidebar-border bg-card p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-success" />
            AGG-Compliance aktiv
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            Alle generierten Fragen werden auf rechtlich kritische Inhalte geprüft.
          </p>
        </div>

        <div className="border-t border-sidebar-border p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">
            AV
          </div>
          <div className="text-xs">
            <div className="font-medium text-sidebar-foreground">Anna Vollmer</div>
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
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-border bg-card/40 px-6 py-6 md:px-10">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
