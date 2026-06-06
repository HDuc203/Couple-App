"use client";

import React, { useEffect } from "react";
import { Trash2, HeartHandshake, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  isDangerous = true,
}: ConfirmModalProps) {
  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with elegant glassmorphism */}
      <div 
        className="absolute inset-0 bg-black/25 backdrop-blur-[5px] transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card container */}
      <div className="relative w-full max-w-sm transform overflow-hidden rounded-[2.2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 animate-in scale-in-95 ease-out duration-300">
        
        {/* Accent strip */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
          isDangerous 
            ? "from-red-300 via-rose-400 to-orange-300" 
            : "from-pink-300 via-rose-400 to-purple-300"
        }`} />

        {/* Close Button */}
        <button 
          onClick={onClose}
          type="button"
          className="absolute top-4.5 right-4.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-soft)] text-[var(--color-faint)] hover:bg-[var(--color-soft)] hover:text-[var(--color-primary)] transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Floating Icon */}
        <div className={`mx-auto mb-4 mt-3 flex h-14 w-14 items-center justify-center rounded-full animate-bounce ${
          isDangerous 
            ? "bg-red-50 dark:bg-red-950/20 text-red-500" 
            : "bg-pink-50 dark:bg-pink-950/20 text-pink-500"
        }`}>
          {isDangerous ? (
            <Trash2 className="h-6 w-6" />
          ) : (
            <HeartHandshake className="h-6 w-6" />
          )}
        </div>

        {/* Content */}
        <h3 className="text-base font-black text-[var(--color-text)] tracking-tight">
          {title}
        </h3>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-[var(--color-muted)] px-1">
          {message}
        </p>

        {/* Actions grid */}
        <div className="mt-6.5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-xs font-black text-[var(--color-muted)] hover:bg-[var(--color-soft)] active:scale-95 transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex h-11 items-center justify-center rounded-2xl text-xs font-black text-white shadow-md active:scale-95 transition-all cursor-pointer ${
              isDangerous 
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/10" 
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-[var(--color-primary-soft)]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
