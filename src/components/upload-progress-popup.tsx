type UploadProgressPopupProps = {
  error?: string | null;
  isIndeterminate?: boolean;
  isVisible: boolean;
  progress: number;
  statusLabel: string;
  title: string;
};

export function UploadProgressPopup({
  error,
  isIndeterminate = false,
  isVisible,
  progress,
  statusLabel,
  title,
}: UploadProgressPopupProps) {
  if (!isVisible && !error) {
    return null;
  }

  const clampedProgress = Math.max(0, Math.min(100, progress));
  const shouldAnimate = isIndeterminate && !error && clampedProgress < 100;

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
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          {shouldAnimate ? (
            <div className="relative h-full w-full overflow-hidden rounded-full">
              <div className="absolute inset-y-0 left-[-35%] w-[35%] rounded-full bg-[#1f004c] animate-[upload-slide_1.15s_ease-in-out_infinite]" />
            </div>
          ) : (
            <div
              className="h-full rounded-full bg-[#1f004c] transition-[width] duration-300 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
