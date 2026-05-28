"use client";

const moods = ["Vui", "Yêu", "Mệt", "Nhớ"] as const;

type MoodSelectorProps = {
  selectedMood: string;
  onMoodChange: (mood: string) => void;
};

export function MoodSelector({
  selectedMood,
  onMoodChange,
}: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {moods.map((mood) => (
        <button
          className={[
            "rounded-2xl border px-4 py-2 text-sm font-bold transition active:scale-[0.98]",
            selectedMood === mood
              ? "border-[var(--color-accent)] bg-[var(--color-soft-strong)] text-[var(--color-primary)]"
              : "border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-accent)] hover:bg-[var(--color-soft)]",
          ].join(" ")}
          key={mood}
          onClick={() => onMoodChange(mood)}
          type="button"
        >
          {mood}
        </button>
      ))}
    </div>
  );
}
