import { cn } from "@/utils/cn";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_8px_22px_-10px_rgba(16,185,129,0.9)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-950" fill="none" aria-hidden="true">
          <path
            d="M6 17V7.8c0-.9.7-1.6 1.6-1.6H17M6 12.2h8.4"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx="17.5" cy="10.5" r="1.6" fill="currentColor" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-indigo-400 ring-2 ring-surface" />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="font-display text-[17px] font-semibold leading-none tracking-tight text-ink">
            Finora<span className="text-emerald-500">.</span>
          </p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-faint">Personal finance</p>
        </div>
      ) : null}
    </div>
  );
}
