import clsx from "clsx";

interface Props {
  /** 0..1 completion fraction. */
  rate: number;
  done: number;
  total: number;
  label: string;
  size?: number;
}

/** Large circular progress indicator for the day's completion rate. */
export function ProgressRing({ rate, done, total, label, size = 84 }: Props) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - rate);
  const pct = Math.round(rate * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-slate-200 dark:stroke-slate-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={clsx(
              "transition-all duration-500",
              pct >= 100 ? "stroke-emerald-500" : "stroke-brand-500",
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-slate-800 dark:text-slate-100" style={{ fontSize: Math.max(16, size * 0.22) }}>
            {pct}%
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {done} / {total}
        </span>
      </div>
    </div>
  );
}
