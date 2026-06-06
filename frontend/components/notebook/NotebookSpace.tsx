"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";
import type { Profile } from "@/lib/profile";
import type { CurrentCouple, PartnerProfile } from "@/lib/couple";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteCategory = "like" | "dislike" | "food" | "gift" | "habit" | "remember" | "note";
type PartnerNote = Tables<"partner_notes">;
type ThemeKey = "pink" | "gold" | "lotus-white" | "lotus-mint" | "lotus-dark";

interface NotebookSpaceProps {
  profile: Profile;
  currentCouple: CurrentCouple | null;
  partnerProfile: PartnerProfile | null;
  initialNotes: PartnerNote[];
}

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES: { id: NoteCategory; label: string; emoji: string; color: string }[] = [
  { id: "like",     label: "Thích",         emoji: "❤️", color: "var(--nb-cat-like)"     },
  { id: "dislike",  label: "Không thích",   emoji: "😖", color: "var(--nb-cat-dislike)"  },
  { id: "food",     label: "Món ăn",        emoji: "🍜", color: "var(--nb-cat-food)"     },
  { id: "gift",     label: "Quà muốn nhận", emoji: "🎁", color: "var(--nb-cat-gift)"     },
  { id: "habit",    label: "Thói quen",     emoji: "☕", color: "var(--nb-cat-habit)"    },
  { id: "remember", label: "Điều cần nhớ",  emoji: "🌙", color: "var(--nb-cat-remember)" },
  { id: "note",     label: "Ghi chú nhỏ",  emoji: "✨", color: "var(--nb-cat-note)"     },
];

// ─── Theme-aware sparkle palette ──────────────────────────────────────────────

const THEME_PALETTE: Record<ThemeKey, { sparkle: string[]; petal: string[] }> = {
  pink: {
    sparkle: ["#e8a0b8", "#f5c8d8", "#c76788", "#ffffff", "#ffd6e8", "#f09eb8"],
    petal:   ["#f5c8d8", "#f9dde8", "#fce4ee", "#f0b8cc", "#ffe8f5"],
  },
  gold: {
    sparkle: ["#d4a017", "#e0b86a", "#f2ce85", "#fffbe6", "#c8a84b", "#ffd060"],
    petal:   ["#f5e8c8", "#fdf0d4", "#f8e4a8", "#fff8e0", "#f0d898"],
  },
  "lotus-white": {
    sparkle: ["#d4b459", "#e8d080", "#b3974b", "#fffdf0", "#c4a040", "#f0e0a0"],
    petal:   ["#f8f0e0", "#f5ead0", "#fff8f0", "#f0e8d8", "#fdf5e6"],
  },
  "lotus-mint": {
    sparkle: ["#c4a15a", "#a8d4b8", "#7ab898", "#d4e8d8", "#e0c880"],
    petal:   ["#c8e8d8", "#d8f0e8", "#b8d8c8", "#e8f4ee", "#d0e8e0"],
  },
  "lotus-dark": {
    sparkle: ["#e0b86a", "#f2ce85", "#fffbe6", "#c8a84b", "#d4a017", "#ffd878"],
    petal:   ["#f5e8c8", "#fdf0d4", "#e8d898", "#fff0d0", "#f0dea0"],
  },
};

// ─── Canvas: sparkles + lotus petals ─────────────────────────────────────────

function NotebookCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read current theme
    const rawTheme = document.documentElement.getAttribute("data-theme") ?? "pink";
    const themeKey = (Object.keys(THEME_PALETTE).includes(rawTheme)
      ? rawTheme : "pink") as ThemeKey;
    const { sparkle: sparkleColors, petal: petalColors } = THEME_PALETTE[themeKey];

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      alpha: number; dalpha: number; size: number;
      type: "sparkle" | "petal";
      rot: number; drot: number; color: string;
    };

    const particles: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      const isPetal = Math.random() < 0.35;
      particles.push({
        x:      Math.random() * (canvas.width  || 600),
        y:      Math.random() * (canvas.height || 480),
        vx:     (Math.random() - 0.5) * 0.32,
        vy:     -(Math.random() * 0.4 + 0.1),
        alpha:  Math.random() * 0.55 + 0.1,
        dalpha: (Math.random() * 0.003 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        size:   isPetal ? Math.random() * 7 + 4 : Math.random() * 2.5 + 1,
        type:   isPetal ? "petal" : "sparkle",
        rot:    Math.random() * Math.PI * 2,
        drot:   (Math.random() - 0.5) * 0.015,
        color:  isPetal
          ? petalColors[Math.floor(Math.random() * petalColors.length)]
          : sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
      });
    }

    function drawSparkle(x: number, y: number, size: number, color: string, alpha: number) {
      ctx!.save();
      ctx!.globalAlpha = alpha;
      ctx!.fillStyle   = color;
      ctx!.shadowBlur  = 7;
      ctx!.shadowColor = color;
      ctx!.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? size : size * 0.3;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        i === 0 ? ctx!.moveTo(px, py) : ctx!.lineTo(px, py);
      }
      ctx!.closePath();
      ctx!.fill();
      ctx!.restore();
    }

    function drawPetal(x: number, y: number, size: number, color: string, alpha: number, rot: number) {
      ctx!.save();
      ctx!.globalAlpha = alpha * 0.5;
      ctx!.translate(x, y);
      ctx!.rotate(rot);
      ctx!.fillStyle   = color;
      ctx!.shadowBlur  = 3;
      ctx!.shadowColor = color;
      ctx!.beginPath();
      ctx!.ellipse(0, -size * 0.5, size * 0.38, size, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();
    }

    function tick() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.alpha += p.dalpha; p.rot += p.drot;
        if (p.alpha <= 0.05) p.dalpha =  Math.abs(p.dalpha);
        if (p.alpha >= 0.75) p.dalpha = -Math.abs(p.dalpha);
        if (p.y < -20)              { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -20)              p.x = canvas.width  + 10;
        if (p.x > canvas.width + 20) p.x = -10;
        if (p.type === "sparkle") drawSparkle(p.x, p.y, p.size, p.color, p.alpha);
        else                       drawPetal(p.x, p.y, p.size, p.color, p.alpha, p.rot);
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ opacity: 0.65 }}
      aria-hidden
    />
  );
}

// ─── Home card ────────────────────────────────────────────────────────────────

export function NotebookCard({
  notes,
  partnerName,
  onOpen,
}: {
  notes: PartnerNote[];
  partnerName: string;
  onOpen: () => void;
}) {
  const preview = notes.slice(0, 3);
  return (
    <section className="notebook-home-card group" role="region" aria-label="Sổ tay người ấy">
      <div className="notebook-home-card-shimmer" aria-hidden />

      <div className="notebook-home-card-header">
        <div className="notebook-home-card-icon">
          <BookOpen className="size-5" />
        </div>
        <div>
          <h2 className="notebook-home-card-title">Sổ tay người ấy</h2>
          <p className="notebook-home-card-subtitle">
            Những điều nhỏ mình muốn nhớ về {partnerName}
          </p>
        </div>
      </div>

      <div className="notebook-home-card-preview">
        {preview.length > 0 ? (
          <ul className="space-y-2">
            {preview.map((note) => {
              const cat = CATEGORIES.find((c) => c.id === note.category);
              return (
                <li key={note.id} className="notebook-preview-item">
                  <span className="notebook-preview-emoji">{cat?.emoji ?? "✨"}</span>
                  <span className="notebook-preview-text">{note.content}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="notebook-home-empty">Chưa có ghi chú nào. Hãy bắt đầu viết nhé! 🌸</p>
        )}
      </div>

      <button
        id="btn-open-notebook"
        type="button"
        onClick={onOpen}
        className="notebook-home-cta"
      >
        <Sparkles className="size-3.5 shrink-0" />
        <span>Mở sổ tay</span>
        <ChevronRight className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotebookSpace({
  profile,
  currentCouple,
  partnerProfile,
  initialNotes,
}: NotebookSpaceProps) {
  const supabase = createClient();
  const coupleId = currentCouple?.couple?.id ?? null;

  // ── State ──────────────────────────────────────────────────────────────────
  const [isOpen,    setIsOpen]    = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [notes,     setNotes]     = useState<PartnerNote[]>(initialNotes);
  const [activeCategory, setActiveCategory] = useState<NoteCategory>("like");
  const [addingContent,  setAddingContent]  = useState("");
  const [isAdding,       setIsAdding]       = useState(false);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingId,     setDeletingId]     = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);

  const partnerName    = partnerProfile?.display_name ?? "Người ấy";
  const filteredNotes  = notes.filter((n) => n.category === activeCategory);

  // ── Open / close (FIXED: separate open vs close states) ───────────────────
  const openNotebook = useCallback(() => {
    setIsClosing(false);
    setIsOpen(true);
  }, []);

  const closeNotebook = useCallback(() => {
    if (isClosing) return;           // prevent double-close
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setIsAdding(false);
      setEditingId(null);
      setAddingContent("");
      setDeletingId(null);
    }, 430);                         // matches CSS close animation duration
  }, [isClosing]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!coupleId) return;
    const channel = supabase
      .channel(`partner_notes:${coupleId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "partner_notes" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const n = payload.new as PartnerNote;
          if (n.couple_id === coupleId)
            setNotes((prev) => prev.some((x) => x.id === n.id) ? prev : [n, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          const n = payload.new as PartnerNote;
          if (n.couple_id === coupleId)
            setNotes((prev) => prev.map((x) => (x.id === n.id ? n : x)));
        } else if (payload.eventType === "DELETE") {
          const d = payload.old as { id: string };
          setNotes((prev) => prev.filter((x) => x.id !== d.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coupleId, supabase]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAdd = useCallback(async () => {
    const content = addingContent.trim();
    if (!content || !coupleId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("partner_notes")
      .insert({ couple_id: coupleId, created_by: profile.id, category: activeCategory, content })
      .select().single();
    setSaving(false);
    if (!error && data) {
      setAddingContent(""); setIsAdding(false);
      setNotes((prev) => prev.some((n) => n.id === data.id) ? prev : [data as PartnerNote, ...prev]);
    }
  }, [addingContent, coupleId, profile.id, activeCategory, supabase]);

  const handleUpdate = useCallback(async (id: string) => {
    const content = editingContent.trim();
    if (!content) return;
    setSaving(true);
    const { data, error } = await supabase.from("partner_notes").update({ content }).eq("id", id).select().single();
    setSaving(false);
    if (!error && data) {
      setEditingId(null);
      setNotes((prev) => prev.map((n) => (n.id === id ? data as PartnerNote : n)));
    }
  }, [editingContent, supabase]);

  const handleDelete = useCallback(async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from("partner_notes").delete().eq("id", id);
    setSaving(false);
    if (!error) {
      setDeletingId(null);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  }, [supabase]);

  // ── Side effects ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAdding && addInputRef.current) addInputRef.current.focus();
  }, [isAdding]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeNotebook(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeNotebook]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <NotebookCard notes={notes} partnerName={partnerName} onOpen={openNotebook} />

      {isOpen && (
        <div
          id="notebook-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Sổ tay người ấy"
          className={`notebook-overlay ${isClosing ? "notebook-overlay-closing" : "notebook-overlay-opening"}`}
          onClick={(e) => { if (e.target === e.currentTarget) closeNotebook(); }}
        >
          {/* Book container — animation class drives entrance/exit */}
          <div className={`notebook-book ${isClosing ? "notebook-book-closing" : "notebook-book-opening"}`}>

            {/* ── Cover (left decorative panel) ── */}
            <div className="notebook-cover" aria-hidden>
              <div className="notebook-cover-inner">
                <div className="notebook-cover-lotus">🪷</div>
                <div className="notebook-cover-title">Sổ Tay</div>
                <div className="notebook-cover-subtitle">của chúng mình</div>
                <div className="notebook-cover-line" />
                <div className="notebook-cover-line notebook-cover-line-short" />
              </div>
              <div className="notebook-spine" />
            </div>

            {/* ── Pages (right content panel) ── */}
            <div className="notebook-pages">
              {/* Canvas sparkles — lives inside pages so it's clipped properly */}
              <div className="notebook-canvas-wrap" aria-hidden>
                <NotebookCanvas />
              </div>

              {/* Ruled lines */}
              <div className="notebook-ruled-lines" aria-hidden>
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} className="notebook-ruled-line" />
                ))}
              </div>

              {/* Header */}
              <div className="notebook-pages-header">
                <div className="notebook-pages-header-left">
                  <span className="notebook-pages-lotus">🪷</span>
                  <div>
                    <h2 className="notebook-pages-title">Sổ tay người ấy</h2>
                    <p className="notebook-pages-subtitle">
                      Những điều nhỏ mình muốn nhớ về {partnerName}
                    </p>
                  </div>
                </div>
                <button
                  id="btn-close-notebook"
                  type="button"
                  onClick={closeNotebook}
                  className="notebook-close-btn"
                  aria-label="Đóng sổ tay"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body */}
              <div className="notebook-pages-body">
                {/* Category sidebar */}
                <nav className="notebook-cat-sidebar" aria-label="Danh mục">
                  {CATEGORIES.map((cat) => {
                    const count    = notes.filter((n) => n.category === cat.id).length;
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setIsAdding(false);
                          setEditingId(null);
                        }}
                        className={`notebook-cat-btn${isActive ? " notebook-cat-btn-active" : ""}`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="notebook-cat-emoji">{cat.emoji}</span>
                        <span className="notebook-cat-label">{cat.label}</span>
                        {count > 0 && <span className="notebook-cat-count">{count}</span>}
                      </button>
                    );
                  })}
                </nav>

                {/* Note list */}
                <div className="notebook-note-list">
                  {/* Section header */}
                  {(() => {
                    const cat = CATEGORIES.find((c) => c.id === activeCategory)!;
                    return (
                      <div className="notebook-note-section-header">
                        <span className="text-xl">{cat.emoji}</span>
                        <div>
                          <h3 className="notebook-note-section-title" style={{ color: cat.color }}>
                            {cat.label}
                          </h3>
                          <p className="notebook-note-section-count">{filteredNotes.length} ghi chú</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Scrollable notes */}
                  <div className="notebook-notes-scroll">
                    {filteredNotes.length === 0 && !isAdding && (
                      <p className="notebook-notes-empty">
                        Chưa có ghi chú nào trong mục này.<br />
                        Hãy thêm điều đầu tiên về {partnerName} nhé ✨
                      </p>
                    )}

                    {filteredNotes.map((note) => {
                      const isOwn      = note.created_by === profile.id;
                      const isEditing  = editingId  === note.id;
                      const isDeleting = deletingId === note.id;

                      return (
                        <div
                          key={note.id}
                          className={`notebook-note-item${isEditing ? " notebook-note-item-editing" : ""}`}
                        >
                          <span className={`notebook-note-author ${isOwn ? "notebook-note-author-own" : "notebook-note-author-partner"}`}>
                            {isOwn ? "Của bạn" : `Của ${partnerName}`}
                          </span>

                          {isEditing ? (
                            <div className="notebook-note-edit-row">
                              <input
                                type="text"
                                className="notebook-note-edit-input"
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")  handleUpdate(note.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                autoFocus
                                maxLength={200}
                              />
                              <button type="button" className="notebook-note-action-btn notebook-note-save-btn"
                                onClick={() => handleUpdate(note.id)} disabled={saving} aria-label="Lưu">
                                <Check className="size-3.5" />
                              </button>
                              <button type="button" className="notebook-note-action-btn notebook-note-cancel-btn"
                                onClick={() => setEditingId(null)} aria-label="Hủy">
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <p className="notebook-note-content">{note.content}</p>
                          )}

                          {isDeleting && !isEditing && (
                            <div className="notebook-note-delete-row">
                              <span className="notebook-note-delete-confirm-text">Xóa ghi chú này?</span>
                              <button type="button" className="notebook-note-delete-yes"
                                onClick={() => handleDelete(note.id)} disabled={saving}>Xóa</button>
                              <button type="button" className="notebook-note-delete-no"
                                onClick={() => setDeletingId(null)}>Không</button>
                            </div>
                          )}

                          {isOwn && !isEditing && !isDeleting && (
                            <div className="notebook-note-actions">
                              <button type="button" className="notebook-note-action-btn"
                                onClick={() => { setEditingId(note.id); setEditingContent(note.content); setDeletingId(null); }}
                                aria-label="Sửa">
                                <Pencil className="size-3" />
                              </button>
                              <button type="button" className="notebook-note-action-btn notebook-note-del-btn"
                                onClick={() => setDeletingId(note.id)} aria-label="Xóa">
                                <Trash2 className="size-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add note */}
                    {isAdding ? (
                      <div className="notebook-add-row">
                        <span className="notebook-add-pen">✏️</span>
                        <input
                          ref={addInputRef}
                          type="text"
                          className="notebook-add-input"
                          placeholder="Viết điều gì đó về người ấy..."
                          value={addingContent}
                          onChange={(e) => setAddingContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")  handleAdd();
                            if (e.key === "Escape") { setIsAdding(false); setAddingContent(""); }
                          }}
                          maxLength={200}
                          disabled={saving}
                        />
                        <button type="button" className="notebook-add-save-btn"
                          onClick={handleAdd} disabled={saving || !addingContent.trim()} aria-label="Thêm">
                          <Check className="size-4" />
                        </button>
                        <button type="button" className="notebook-add-cancel-btn"
                          onClick={() => { setIsAdding(false); setAddingContent(""); }} aria-label="Hủy">
                          <X className="size-4" />
                        </button>
                      </div>
                    ) : coupleId ? (
                      <button id="btn-add-note" type="button" className="notebook-add-trigger"
                        onClick={() => setIsAdding(true)}>
                        <Plus className="size-4" />
                        <span>Thêm ghi chú</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="notebook-pages-footer">
                <span className="notebook-pages-footer-text">✦ với tất cả yêu thương ✦</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
