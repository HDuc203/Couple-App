export default function OnboardingProfileLoading() {
  return (
    <main className="min-h-screen bg-[var(--app-gradient)] px-4 py-8 text-[var(--color-text)]">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-[var(--app-shadow)]">
        <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--color-soft-strong)]" />
        <div className="mt-5 h-10 w-3/4 animate-pulse rounded-full bg-[var(--color-soft)]" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-14 animate-pulse rounded-2xl bg-[var(--color-soft)]"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
