import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell, PageHeader } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  applicationFromCvFile,
  MAX_CV_FILE_SIZE,
  saveLastUploadedApplicationId,
  useApplications,
  type UploadedApplication,
} from "@/lib/application-storage";
import { toast } from "sonner";
import { Plus, Upload, Search, Mail, MapPin, FileText, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "Applications – TalentFlow" },
      { name: "description", content: "Verwaltung aller Bewerbungen, getrennt von Jobs." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { applications, uploadedApplications, setUploadedApplications } = useApplications();
  const uploadedById = new Set(uploadedApplications.map((application) => application.id));

  const handleCvFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    try {
      const accepted: UploadedApplication[] = [];

      for (const file of Array.from(files)) {
        if (file.size > MAX_CV_FILE_SIZE) {
          toast.error(`${file.name}: max. 5 MB erlaubt`);
          continue;
        }

        accepted.push(await applicationFromCvFile(file));
      }

      if (accepted.length > 0) {
        setUploadedApplications([...accepted, ...uploadedApplications]);
        saveLastUploadedApplicationId(accepted[0].id);
        toast.success(`${accepted.length} CV${accepted.length === 1 ? "" : "s"} hochgeladen`);
      }
    } catch (error) {
      console.error(error);
      toast.error("CV konnte nicht gelesen werden.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeUploadedApplication = (applicationId: string) => {
    const application = uploadedApplications.find((item) => item.id === applicationId);
    setUploadedApplications(uploadedApplications.filter((item) => item.id !== applicationId));
    if (application) toast.success(`${application.name} entfernt`);
  };

  return (
    <AppShell>
      <PageHeader
        title="Applications"
        
        actions={
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              multiple
              onChange={(event) => handleCvFiles(event.target.files)}
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              CV hochladen
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Neue Bewerbung
            </Button>
          </>
        }
      />

      <div className="px-6 md:px-10 py-8 space-y-6">
        {uploadedApplications.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Hochgeladene CVs</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lokal gespeichert und im Interview Workspace auswaehlbar.
                </p>
              </div>
              <StatusPill tone="primary">{uploadedApplications.length} lokal</StatusPill>
            </div>
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Bewerbungen durchsuchen…" className="pl-9 bg-card" />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">Kandidat:in</th>
                <th className="text-left font-medium px-5 py-3 hidden md:table-cell">Standort</th>
                <th className="text-left font-medium px-5 py-3 hidden lg:table-cell">Kurzprofil</th>
                <th className="text-left font-medium px-5 py-3">Skills</th>
                <th className="text-right font-medium px-5 py-3">Erfahrung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">
                        {a.name.split(" ").map((p) => p[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground">{a.name}</div>
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {a.email}
                        </div>
                        {uploadedById.has(a.id) && (
                          <div className="mt-1 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {(a as UploadedApplication).sourceFileName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {a.location}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell text-muted-foreground max-w-md">
                    <p className="line-clamp-2">{a.shortProfile}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {a.skills.slice(0, 3).map((s) => (
                        <StatusPill key={s} tone="info">{s}</StatusPill>
                      ))}
                      {a.skills.length > 3 && <StatusPill>+{a.skills.length - 3}</StatusPill>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-foreground font-medium whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <span>{a.yearsExperience || "?"} J.</span>
                      {uploadedById.has(a.id) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUploadedApplication(a.id)}
                          aria-label={`${a.name} entfernen`}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
