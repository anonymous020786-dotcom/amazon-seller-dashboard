export function SectionCard({
  title,
  action,
  error,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        {action}
      </div>
      {error ? (
        <p className="mt-4 rounded-md bg-[var(--status-critical)]/10 px-3 py-2 text-sm text-[var(--status-critical)]">
          Couldn&apos;t load: {error}
        </p>
      ) : (
        <div className="mt-4">{children}</div>
      )}
    </section>
  );
}
