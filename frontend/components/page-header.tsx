export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wide text-brand">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-bold text-ink md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
