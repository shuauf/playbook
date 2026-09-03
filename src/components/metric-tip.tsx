export function MetricTip({ label, children }: { label: string; children: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        className="ml-1 size-4 rounded-full border border-border text-[10px] leading-none text-muted-foreground"
        aria-label={`${label} definition`}
      >
        ?
      </button>
      <span className="pointer-events-none absolute top-5 left-1/2 z-20 hidden w-56 -translate-x-1/2 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground shadow-sm group-hover:block group-focus-within:block">
        {children}
      </span>
    </span>
  )
}
