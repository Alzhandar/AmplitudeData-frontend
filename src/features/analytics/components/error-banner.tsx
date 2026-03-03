type ErrorBannerProps = {
  message: string;
};

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
      role="alert"
    >
      Ошибка загрузки данных: {message}
    </div>
  );
}
