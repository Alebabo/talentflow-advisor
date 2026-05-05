type UploadProgressPopupProps = {
  error?: string | null;
  isVisible: boolean;
  progress: number;
  statusLabel: string;
  title: string;
};

export function UploadProgressPopup({
  error,
  isVisible,
  progress,
  statusLabel,
  title,
}: UploadProgressPopupProps) {
  if (!isVisible && !error) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)]">
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_18px_60px_rgba(31,0,76,0.22)] ring-1 ring-[#1f004c]/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">{title}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {error || statusLabel}
            </div>
          </div>
          <div className="rounded-full bg-[#1f004c]/8 px-2 py-1 text-xs font-medium text-[#1f004c]">{Math.round(progress)}%</div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[#1f004c] transition-[width] duration-300 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
