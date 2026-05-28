"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText: string;
};

export function SubmitButton({ children, pendingText }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(136,65,95,0.22)] transition hover:bg-[var(--color-primary-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? pendingText : children}
    </button>
  );
}
