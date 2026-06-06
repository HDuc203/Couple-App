"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  emoji?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Select button trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-soft)]/50 px-3 py-2.5 text-xs font-bold outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition text-[var(--color-text)] cursor-pointer"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <>
              {selectedOption.emoji && <span className="text-sm shrink-0">{selectedOption.emoji}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-[var(--color-faint)] font-semibold">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--color-faint)] shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180 text-[var(--color-primary)]" : ""
          }`}
        />
      </button>

      {/* Options Panel Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-[60] mt-1.5 max-h-60 overflow-y-auto rounded-2xl border border-[var(--color-border)]/65 bg-[var(--color-card)]/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-0.5">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-[var(--color-primary-soft)]/45 text-[var(--color-primary)] font-black border border-[var(--color-primary)]/20"
                      : "text-[var(--color-text)] hover:bg-[var(--color-soft)]"
                  }`}
                >
                  {option.emoji && <span className="text-sm shrink-0">{option.emoji}</span>}
                  <span className="truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
