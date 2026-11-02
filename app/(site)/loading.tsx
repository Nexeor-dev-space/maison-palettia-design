export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading Maison Palettia"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-sage transition-opacity duration-300"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated brand paint pulse */}
        <div className="relative flex size-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="size-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
        </div>
        <p className="mt-4 text-label font-medium uppercase tracking-eyebrow text-text/80">
          Loading...
        </p>
      </div>
    </div>
  );
}

