type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_MAP = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <span
      aria-label="Загрузка..."
      role="status"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${SIZE_MAP[size]} ${className}`}
    />
  );
}
