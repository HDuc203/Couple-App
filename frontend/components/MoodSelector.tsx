"use client";

const moods = [
  { key: "Vui", emoji: "😄", label: "Vui" },
  { key: "Yêu", emoji: "🥰", label: "Yêu" },
  { key: "Mệt", emoji: "😴", label: "Mệt" },
  { key: "Nhớ", emoji: "🥺", label: "Nhớ" },
] as const;

type MoodSelectorProps = {
  selectedMood: string;
  onMoodChange: (mood: string) => void;
};

export function MoodSelector({
  selectedMood,
  onMoodChange,
}: MoodSelectorProps) {
  return (
    <div className="mood-pills">
      {moods.map(({ key, emoji, label }) => (
        <button
          className={`mood-pill ${selectedMood === key ? "mood-pill-active" : "mood-pill-idle"}`}
          key={key}
          onClick={() => onMoodChange(key)}
          type="button"
        >
          <span className="mood-pill-emoji">{emoji}</span>
          <span className="mood-pill-label">{label}</span>
          {selectedMood === key && <div className="mood-pill-glow" />}
        </button>
      ))}
    </div>
  );
}
