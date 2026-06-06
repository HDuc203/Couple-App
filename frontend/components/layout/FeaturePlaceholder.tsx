import type { LucideIcon } from "lucide-react";

type FeaturePlaceholderProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeaturePlaceholder({
  title,
  description,
  icon: Icon,
}: FeaturePlaceholderProps) {
  return (
    <section className="mx-auto max-w-5xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-[var(--app-shadow)]">
      <div className="grid size-14 place-items-center rounded-3xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Icon className="size-7" />
      </div>
      <p className="mt-7 text-sm font-bold uppercase tracking-[0.18em] text-[var(--color-faint)]">
        Couple App
      </p>
      <h1 className="mt-3 text-3xl font-black md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-[var(--color-muted)]">
        {description}
      </p>
    </section>
  );
}
