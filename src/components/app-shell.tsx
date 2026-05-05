import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  Users,
  FileText,
  Sparkles,
  LayoutGrid,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import metafinanzLogo from "@/assets/metafinanz-logo.jpg";

const nav = [
  { to: "/", label: "Ubersicht", icon: LayoutGrid },
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
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/10 bg-[#1f004c] text-white md:flex">
        <div className="absolute left-0 top-0 h-full w-[3px] bg-spectral" />

        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <img src={metafinanzLogo} alt="metafinanz" className="h-11 w-11 rounded-full object-contain" />
          <div>
            <div className="text-sm font-semibold leading-none tracking-tight text-white">TalentFlow</div>
            <div className="mt-1.5 text-[11px] text-white/70">by metafinanz</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "bg-white/12 font-medium text-white" : "text-white/75 hover:bg-white/8 hover:text-white",
                )}
              >
                {active && (
                  <span className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-spectral" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-[#f5d46b]" : "text-current/70",
                    item.highlight && !active && "text-[#f5d46b]",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative m-3 overflow-hidden rounded-lg border border-white/10 bg-white/8 p-3">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-spectral" />
          <div className="flex items-center gap-2 text-xs font-medium text-white">
            <ShieldCheck className="h-4 w-4 text-[#0a8e76]" />
            AGG-Compliance aktiv
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-white/70">
            Alle generierten Fragen werden auf rechtlich kritische Inhalte gepruft.
          </p>
        </div>

        <div className="flex items-center gap-3 border-t border-white/10 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-spectral text-xs font-bold text-[#1f004c]">
            AV
          </div>
          <div className="text-xs">
            <div className="font-medium text-white">Anna Vollmer</div>
            <div className="text-white/70">Hiring Manager</div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 md:ml-64">{children}</main>
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
    <div className="relative flex flex-col gap-3 bg-card px-6 py-7 md:flex-row md:items-end md:justify-between md:px-10">
      <div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-spectral opacity-80" />
    </div>
  );
}
