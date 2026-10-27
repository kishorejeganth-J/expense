import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import type { Toast } from "@/types";
import { useApp } from "@/lib/store";
import { cn } from "@/utils/cn";

const toneMeta: Record<Toast["tone"], { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: "text-emerald-500" },
  info: { icon: Info, classes: "text-indigo-500 text-indigo-400" },
  warning: { icon: AlertTriangle, classes: "text-amber-500" },
  danger: { icon: XCircle, classes: "text-rose-500" },
};

export function Toaster() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-[90] flex flex-col items-stretch gap-2 sm:left-auto sm:right-5 sm:bottom-5 sm:w-[360px]">
      {toasts.map((toast) => {
        const meta = toneMeta[toast.tone];
        const Icon = meta.icon;
        return (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto flex animate-pop items-start gap-3 rounded-xl border border-line bg-surface/95 p-3.5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
          >
            <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", meta.classes)} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{toast.description}</p>
              ) : null}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 rounded-lg p-1 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
