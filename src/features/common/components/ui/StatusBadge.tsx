import { Spinner } from "./Spinner";

type JobStatus = "pending" | "processing" | "completed" | "failed";

type StatusBadgeProps = {
  status: JobStatus;
};

const CONFIG: Record<
  JobStatus,
  { label: string; classes: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Ожидает",
    classes: "bg-slate-100 text-slate-600 ring-slate-200",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  processing: {
    label: "Выполняется",
    classes: "bg-blue-50 text-blue-700 ring-blue-100",
    icon: <Spinner size="sm" className="text-blue-500" />,
  },
  completed: {
    label: "Выполнено",
    classes: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  failed: {
    label: "Ошибка",
    classes: "bg-rose-50 text-rose-700 ring-rose-100",
    icon: (
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes, icon } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${classes}`}
    >
      {icon}
      {label}
    </span>
  );
}
