import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { ArrowDownRight, ArrowUpRight, ChevronDown, X } from "lucide-react";
import { cn } from "@/utils/cn";

/* ---------------------------------- Card ---------------------------------- */

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface/85 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_18px_40px_-32px_rgba(2,6,23,0.5)] backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeading({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* --------------------------------- Button --------------------------------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "subtle";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-500 text-emerald-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.65)] hover:bg-emerald-400 active:bg-emerald-500 font-semibold",
  secondary:
    "bg-surface-2 text-ink border border-line hover:bg-surface-3 hover:border-line-strong",
  subtle: "bg-surface-3/70 text-ink hover:bg-surface-3",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  outline: "border border-line-strong text-ink hover:bg-surface-2 hover:border-emerald-500/40",
  danger: "bg-rose-500/10 text-rose-600 ring-1 ring-inset ring-rose-500/25 hover:bg-rose-500/15 dark:text-rose-400",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-2.5 text-xs",
  md: "h-10 gap-2 rounded-xl px-3.5 text-sm",
  lg: "h-11 gap-2 rounded-xl px-4 text-sm",
  icon: "h-9 w-9 rounded-lg",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2/60 text-muted transition-all hover:border-line-strong hover:bg-surface-3 hover:text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* --------------------------------- Badges --------------------------------- */

type Tone = "emerald" | "rose" | "amber" | "indigo" | "slate" | "sky" | "violet";

const toneClasses: Record<Tone, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  indigo: "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20 dark:text-indigo-400",
  slate: "bg-slate-500/10 text-muted ring-slate-500/20",
  sky: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function DeltaBadge({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) return <Badge tone="slate">—</Badge>;
  const up = value >= 0;
  const favorable = invert ? !up : up;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <Badge tone={value === 0 ? "slate" : favorable ? "emerald" : "rose"} className="tnum">
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {Math.abs(value)}%
    </Badge>
  );
}

/* -------------------------------- Progress -------------------------------- */

const progressTones = {
  emerald: "from-emerald-500 to-emerald-400",
  amber: "from-amber-500 to-amber-400",
  rose: "from-rose-500 to-rose-400",
  indigo: "from-indigo-500 to-violet-400",
  sky: "from-sky-500 to-cyan-400",
} as const;

export function Progress({
  value,
  tone = "emerald",
  className,
  height = "h-1.5",
  animate = true,
}: {
  value: number;
  tone?: keyof typeof progressTones;
  className?: string;
  height?: string;
  animate?: boolean;
}) {
  const width = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-full bg-surface-3", height, className)}
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out",
          progressTones[tone],
          animate && "animate-fade"
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

/* --------------------------------- Inputs --------------------------------- */

export const inputClass =
  "h-10 w-full rounded-xl border border-line bg-surface-2/70 px-3 text-sm text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-emerald-500/60 focus:bg-surface-2 focus:outline-none";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(inputClass, "h-auto min-h-[76px] resize-none py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(inputClass, "cursor-pointer appearance-none pr-9", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-medium text-muted">
          {label}
        </label>
        {hint ? <span className="text-[11px] text-faint">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="text-[11px] font-medium text-rose-500">{error}</p> : null}
    </div>
  );
}

/* ------------------------------- Segmented -------------------------------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label?: ReactNode; icon?: ReactNode; title?: string }>;
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-line bg-surface-2/70 p-0.5",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[9px] font-medium transition-all duration-200",
              size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs",
              active
                ? "bg-surface text-ink shadow-[0_1px_2px_rgba(2,6,23,0.12)] ring-1 ring-line"
                : "text-muted hover:text-ink"
            )}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "max-w-lg",
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  icon?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Dialog"}
        className={cn(
          "relative flex max-h-[92dvh] w-full animate-pop flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-2xl",
          width
        )}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          {icon ? (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
              {icon}
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
          </div>
          <IconButton label="Close dialog" onClick={onClose} className="-mr-1 border-transparent bg-transparent">
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line bg-surface-2/40 px-5 py-3.5">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

/* -------------------------------- Empty ---------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-faint">
        {icon}
      </div>
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ------------------------------- Page head -------------------------------- */

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} />;
}
