"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Site de Casamento — minimalista (mood Casar.com, mas mais moderno)
 *
 * ✅ Next.js App Router (page.tsx)
 * ✅ Sem next/font/google
 * ✅ Mobile-first, limpo, com carrossel e menu burger decente
 */

// ====== FONTS (Google Fonts via CSS) ======
// Nota: mantive os nomes das classes para não partir nada, mas mudei o “body font” para ficar mais moderno.
const SERIF_CLASS = "fontBody"; // body (moderna)
const QUOTE_CLASS = "fontQuote"; // citações/versículo (serif)
const SCRIPT_CLASS = "fontScript"; // títulos (script)

// ====== CONFIG ======
const WEDDING_DATETIME_LOCAL = "2026-09-18T15:00:00"; // Europe/Lisbon

// Webhooks (opcional): Make.com / Zapier / etc.
const RSVP_ENDPOINT = "/api/rsvp";
const GUESTBOOK_ENDPOINT = "/api/guestbook"; // agora vai para Airtable


// Assets (coloca em /public)
const LOGO_URL = "/logo.png";
const HERO_IMAGE_URL = "/hero.jpeg";
const PHOTO_JUSSARA = "/jussara.png";
const PHOTO_AFONSO = "/afonso.JPG";
const FOOTER_IMAGE_URL = "/footer.jpeg";

// (Opcional) ajustar enquadramento dos rostos nas fotos redondas
const PHOTO_POS_JUSSARA = "50% 20%";
const PHOTO_POS_AFONSO = "50% 20%";

// Galeria (coloca as fotos em /public e ajusta os nomes aqui)
const GALLERY_PHOTOS: string[] = [
  "/gallery/01.jpeg",
  "/gallery/02.jpeg",
  "/gallery/03.jpeg",
];
const GALLERY_MEDIA: MediaItem[] = [
  { type: "image", src: "/gallery/01.jpeg" },
  { type: "image", src: "/gallery/02.jpeg" },
  { type: "image", src: "/gallery/03.jpeg" },
  { type: "video", src: "/gallery/video-AJ.mp4", poster: "/gallery/poster-video.png" },
];
const MUSIC_URL = "/music.mp3"; // música de fundo (opcional)

// Cores
const COLORS = {
  sage: "#AEB7A2",
  sageDark: "#8E987F",
  ink: "#1F2937",
  muted: "#64748B",
  paper: "#FFFFFF",
  line: "#E7E7E7",
  beige: "#F3EEE4",
beigeLine: "#E8DDCC",
navy: "#1F2B3B",
  navy2: "#233246",
};

// (Mantido só para testes/consistência)
const BRAND = {
  google: "#4285F4",
  apple: "#111827",
  waze: "#2AA7E0",
};

const NAV_ICONS = {
  google: "/nav/google-maps.png",
  apple: "/nav/apple-maps.png",
  waze: "/nav/waze.png",
};


const CEREMONY = {
  title: "Cerimónia",
  datetimeLabel: "18 de setembro de 2026 • 15:00",
  place: "Igreja Baptista de Coimbra",
  address: "Av. Emídio Navarro 54-55, 3000-150 Coimbra",
  hero: "/cerimonia.jpeg",
  heroFit: "cover" as const,
  introText:
    "Convidamos-te para a nossa cerimónia, um momento abençoado por Deus, onde assumimos o nosso compromisso diante do Senhor e nos tornamos um só, com Deus no centro.",

  // ✅ novo (para o layout)
  day: "18",
  month: "Setembro",
  year: "2026",
  time: "15:00",
  timeHint: "da tarde",
  venueLabel: "IGREJA", // opcional (se não quiseres, mete "")
};

const RECEPTION = {
  title: "Receção",
  datetimeLabel: "18 de setembro de 2026 • 17:00",
  place: "Valle de Canas — Centro de Eventos",
  address: "R. Combatentes da Grande Guerra 110, 3030-124 Coimbra",
  hero: "/rececao.jpeg",
  heroFit: "cover" as const,
  introText:
    "Família e amigos, é com muita alegria que vos convidamos para a nossa receção. Vai ser aquele momento nosso — boa energia, festa e sorrisos. Não faltes, queremos-te lá connosco.",

  // ✅ novo (para o layout)
  day: "18",
  month: "Setembro",
  year: "2026",
  time: "17:00",
  timeHint: "", // opcional
  venueLabel: "CENTRO DE EVENTOS",
};


const BIBLE_VERSE =
  "Coloca-me como um selo no teu coração, como um selo no teu braço. Porque o amor é forte como a morte: muitas águas não o apagam, nem os rios o levam. Mesmo que alguém desse todos os bens da sua casa por este amor, seria desprezado. — Cânticos 8:6–7";

// Dados REAIS
const PAYMENT = {
  holders: "AFONSO HENRIQUE PENA PEDROSO SILVA",
  iban: "PT50 0035 0185 00693489330 08",
  bic: "CGDIPTPL",
  mbway: "+351 935 163 201",
  note: "Se te fizer sentido contribuir para a nossa lua de mel (ou ajudar com algum detalhe do casamento), agradecemos de coração. Sem pressão 💚",
};

// ✅ ícones já existentes em /public/nav
const PAYMENT_METHOD_ICONS = [
  { src: "/nav/apple-pay.png", label: "Apple Pay" },
  { src: "/nav/google-pay.png", label: "Google Pay" },
  { src: "/nav/mb-way.png", label: "MB WAY" },
  { src: "/nav/visa.png", label: "Visa" },
];
// UI tokens
const RADIUS = "5px"; // máximo 5px como pediste

// ====== HELPERS ======
function CopyPillWithIcon(props: { label: string; value: string; iconSrc: string; iconAlt?: string }): React.JSX.Element {
  return (
    <div
      className="border px-4 py-3 flex items-start justify-between gap-3"
      style={{ borderColor: COLORS.line, borderRadius: RADIUS }}
    >
      <div className="min-w-0 flex items-start gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center overflow-hidden"
          style={{ borderRadius: 999, background: "white", border: `1px solid ${COLORS.line}` }}
          aria-hidden="true"
        >
          <img
            src={props.iconSrc}
            alt={props.iconAlt || props.label}
            className="h-6 w-6 object-contain"
            draggable={false}
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        </span>

        <div className="min-w-0">
          <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: COLORS.muted }}>
            {props.label}
          </div>
          <div className="mt-1 font-medium break-words" style={{ color: COLORS.ink }}>
            {props.value}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => copyToClipboard(props.value)}
        className="border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition hover:bg-black/5"
        style={{ borderColor: COLORS.line, color: COLORS.muted, borderRadius: 999, flex: "0 0 auto" }}
      >
        Copiar
      </button>
    </div>
  );
}

function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function formatPtPhone(v: string): string {
  const d = onlyDigits(v).slice(0, 9); // máximo 9
  const a = d.slice(0, 3);
  const b = d.slice(3, 6);
  const c = d.slice(6, 9);
  if (d.length <= 3) return a;
  if (d.length <= 6) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}

function countDigits(v: string): number {
  return onlyDigits(v).length;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function buildEmbedMapUrl(address: string): string {
  const q = encodeURIComponent(address);
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

function buildMapsLink(destination: string): string {
  const d = encodeURIComponent(destination);
  return `https://www.google.com/maps/dir/?api=1&destination=${d}`;
}

function buildAppleMapsLink(destination: string): string {
  const d = encodeURIComponent(destination);
  return `https://maps.apple.com/?daddr=${d}&dirflg=d`;
}

function buildWazeLink(destination: string): string {
  const d = encodeURIComponent(destination);
  return `https://waze.com/ul?q=${d}&navigate=yes`;
}


function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

type CountdownValue = { isPast: boolean; days: number; hours: number; minutes: number; seconds: number };

function useCountdown(targetISO: string): CountdownValue {
  const target = useMemo(() => new Date(targetISO), [targetISO]);
const [now, setNow] = useState<Date>(() => new Date(0)); // determinístico no SSR


useEffect(() => {
  const id = window.setInterval(() => setNow(new Date()), 1000);
  return () => window.clearInterval(id);
}, []);



  const diffMs = target.getTime() - now.getTime();
  const isPast = diffMs <= 0;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { isPast, days, hours, minutes, seconds };
}

function cn(...xs: Array<string | false | undefined | null>): string {
  return xs.filter(Boolean).join(" ");
}

function runSelfTests(): void {
  const g = globalThis as unknown as { __WEDDING_SITE_TESTED__?: boolean };
  if (g.__WEDDING_SITE_TESTED__) return;
  g.__WEDDING_SITE_TESTED__ = true;

  const u = buildEmbedMapUrl("Av. Emídio Navarro 54-55, Coimbra");
  console.assert(u.includes("output=embed"), "[TEST] embed url must contain output=embed");
  console.assert(pad2(0) === "00", "[TEST] pad2 zero");
  console.assert(pad2(3) === "03", "[TEST] pad2 small");
  console.assert(pad2(12) === "12", "[TEST] pad2 >= 10");
  console.assert(buildMapsLink("Rua X").includes("destination="), "[TEST] maps link includes destination");
  console.assert(
    buildMapsLink("Rua X").includes("Rua%20X") || buildMapsLink("Rua X").includes("Rua+X"),
    "[TEST] maps link encodes spaces"
  );
  console.assert(buildWazeLink("Rua X").includes("waze"), "[TEST] waze link contains waze domain");
  console.assert(buildAppleMapsLink("Rua X").includes("maps.apple.com"), "[TEST] apple maps link domain");
  console.assert(safeJsonParse<{ a: number }>("{\"a\":1}", { a: 0 }).a === 1, "[TEST] safeJsonParse ok");
  console.assert(Array.isArray(safeJsonParse("nope", [] as unknown[])), "[TEST] safeJsonParse fallback");
  console.assert(cn("a", false, "b") === "a b", "[TEST] cn join");
  console.assert(cn("a", undefined, null, "b") === "a b", "[TEST] cn join ignores nullish");
  console.assert(BRAND.google.startsWith("#"), "[TEST] brand color format");
  console.assert(PAYMENT.iban.startsWith("PT"), "[TEST] IBAN starts with PT");
}

// ====== UI ======
function GlobalFonts(): React.JSX.Element {
  return (
    <style jsx global>{`
     @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cormorant+Garamond:wght@400;500;600&family=Birthstone+Bounce:wght@400;500&display=swap');

      :root {
        --font-body: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, 'Noto Sans', 'Liberation Sans', sans-serif;
        --font-quote: 'Inter', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
        --font-script: 'Birthstone Bounce', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
      }

      .${SERIF_CLASS} { font-family: var(--font-body); }
      .${QUOTE_CLASS} { font-family: var(--font-quote); }
      .${SCRIPT_CLASS} { font-family: var(--font-script); }

      html { scroll-behavior: smooth; }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .fadeIn { animation: fadeIn 420ms ease both; }

      @keyframes menuIn {
        from { opacity: 0; transform: translateY(-6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .menuAnim { animation: menuIn 180ms ease both; }

      .noSelect { user-select: none; -webkit-user-select: none; }

      /* ✅ para o scrollIntoView não ficar escondido atrás do header fixo */
section[id] { scroll-margin-top: 88px; }


/* ✅ quando o menu abre, esconde o botão da música */
html[data-menu-open="1"] .musicBtn {
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
}

    `}</style>
  );
}

function Ornament(): React.JSX.Element {
  return (
    <svg width="110" height="20" viewBox="0 0 110 20" fill="none" aria-hidden="true">
      <path
        d="M4 10c10-8 22-8 32 0 10 8 22 8 32 0 10-8 22-8 32 0"
        stroke={COLORS.sageDark}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <circle cx="55" cy="10" r="2" fill={COLORS.sageDark} />
    </svg>
  );
}

function SectionHeader(props: { title: string; subtitle?: string }): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="flex justify-center">
        <Ornament />
      </div>
      <h2 className={cn("mt-3 text-4xl sm:text-5xl", SCRIPT_CLASS)} style={{ color: COLORS.sageDark }}>
        {props.title}
      </h2>
      {props.subtitle ? (
        <p className="mt-5 text-[16px] leading-7" style={{ color: COLORS.muted }}>
          {props.subtitle}
        </p>
      ) : null}
    </div>
  );
}

function NavLinkButton(props: { label: string; active: boolean; solid: boolean; onClick: () => void }): React.JSX.Element {
  const base = props.solid ? "text-slate-700 hover:text-slate-950" : "text-white/90 hover:text-white";
  const active = props.active ? "after:scale-x-100" : "after:scale-x-0";

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cn(
        "relative text-[12px] tracking-[0.25em] uppercase transition",
        "after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-full after:bg-current after:origin-left after:transition-transform after:duration-200",
        "hover:after:scale-x-100",
        base,
        active
      )}
      style={props.active && props.solid ? { color: COLORS.sageDark } : undefined}
    >
      {props.label}
    </button>
  );
}

// --- Drawer fora do header (Portal) ---
function MobileDrawer(props: {
  open: boolean;
  items: Array<{ id: string; label: string }>;
  activeId: string;
  onClose: () => void;
  onGo: (id: string) => void;
}): React.JSX.Element {
  const { open, items, activeId, onClose, onGo } = props;

  return (
    <div
      className={cn(
        "md:hidden fixed inset-0 z-[1100] transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        style={{ background: "rgba(0,0,0,0.62)" }}
        onClick={onClose}
      />

      {/* Drawer (esquerda) */}
      <aside
        className={cn(
          "absolute left-0 top-0 h-[100dvh] w-[82vw] max-w-[340px] border-r shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: COLORS.paper, borderColor: COLORS.line }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: COLORS.line }}>
            <div className="flex items-center gap-3">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="h-8 w-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div>
                <div
                  className="text-[11px] tracking-[0.28em] uppercase"
                  style={{ color: COLORS.muted, fontWeight: 700 }}
                >
                  Menu
                </div>
                <div className={cn("text-[22px] leading-6", SCRIPT_CLASS)} style={{ color: COLORS.sageDark }}>
                  Afonso & Jussara
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Fechar"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center transition hover:bg-black/5"
              style={{ borderRadius: 999, color: COLORS.muted }}
            >
              ✕
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {items.map((it, idx) => {
              const active = activeId === it.id;
              const last = idx === items.length - 1;

              return (
                <div key={it.id} className="relative">
                  {active ? (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px]"
                      style={{ background: COLORS.sageDark, borderRadius: 999 }}
                      aria-hidden="true"
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onGo(it.id)}
                    className="w-full flex items-center justify-between px-4 py-4 text-left text-[12px] tracking-[0.25em] uppercase transition hover:bg-black/5"
                    style={{
                      borderRadius: RADIUS,
                      color: active ? COLORS.sageDark : COLORS.ink,
                      background: active ? "rgba(174,183,162,0.10)" : "transparent",
                    }}
                  >
                    <span>{it.label}</span>
                    <span style={{ color: COLORS.muted, opacity: active ? 0.85 : 0.45 }}>›</span>
                  </button>

                  {!last ? <div className="mx-3 border-b" style={{ borderColor: COLORS.line }} /> : null}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-4" style={{ borderColor: COLORS.line }}>
            <div className="text-[11px] tracking-[0.25em] uppercase" style={{ color: COLORS.muted }}>
              18 | 09 | 2026
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function TopNav(props: {
  items: Array<{ id: string; label: string }>;
  activeId: string;
  onNav: (id: string) => void;
}): React.JSX.Element {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ✅ para o Portal (SSR safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Só controla "solid"
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ marca no <html> quando o menu está aberto
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.menuOpen = open ? "1" : "0";
    return () => {
      document.documentElement.dataset.menuOpen = "0";
    };
  }, [open]);

  // ✅ ESC + lock scroll
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function go(id: string): void {
    props.onNav(id);
    setOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-[1000] w-full transition",
          solid ? "bg-white/90 backdrop-blur border-b" : "bg-transparent"
        )}
        style={{ borderColor: solid ? COLORS.line : "transparent" }}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src={LOGO_URL}
              alt="Logo"
              className={cn("h-9 w-auto", solid ? "opacity-100" : "opacity-90")}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          {/* DESKTOP */}
          <div className="hidden md:flex flex-wrap items-center justify-center gap-6">
            {props.items.map((it) => (
              <NavLinkButton
                key={it.id}
                label={it.label}
                active={props.activeId === it.id}
                solid={solid}
                onClick={() => go(it.id)}
              />
            ))}
          </div>

          {/* MOBILE BURGER */}
          <div className="md:hidden">
            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center border transition",
                solid ? "border-slate-200 bg-white" : "border-white/30 bg-black/45"
              )}
              style={{ borderRadius: RADIUS }}
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12" stroke={solid ? COLORS.ink : "white"} strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 6L6 18" stroke={solid ? COLORS.ink : "white"} strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16" stroke={solid ? COLORS.ink : "white"} strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 12h16" stroke={solid ? COLORS.ink : "white"} strokeWidth="2" strokeLinecap="round" />
                  <path d="M4 17h16" stroke={solid ? COLORS.ink : "white"} strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* ✅ Drawer FORA do header (isto resolve o bug do "só aparece no home") */}
      {mounted
        ? createPortal(
            <MobileDrawer
              open={open}
              items={props.items}
              activeId={props.activeId}
              onClose={() => setOpen(false)}
              onGo={(id) => go(id)}
            />,
            document.body
          )
        : null}
    </>
  );
}


function MusicPlayer(): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  async function tryPlay(): Promise<void> {
    const a = audioRef.current;
    if (!a) return;

    a.loop = true;
    a.volume = 0.35;

    try {
      await a.play();
      setPlaying(true);
      setNeedsTap(false);
      localStorage.setItem("wedding_music", "on");
    } catch {
      // autoplay bloqueado
      setPlaying(false);
      setNeedsTap(true);
    }
  }

  function stop(): void {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    setPlaying(false);
    setNeedsTap(false);
    localStorage.setItem("wedding_music", "off");
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pref = localStorage.getItem("wedding_music");
    if (pref === "off") return;

    // tenta tocar ao abrir
    void tryPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <audio ref={audioRef} src={MUSIC_URL} preload="auto" />

    <div className="musicBtn fixed bottom-4 right-4 z-[900]">
        {needsTap ? (
          <button
            type="button"
            onClick={() => void tryPlay()}
            className="border px-4 py-3 text-[11px] tracking-[0.22em] uppercase transition hover:bg-black/5"
         style={{
  borderColor: COLORS.beigeLine,
  borderRadius: 999,
  background: playing ? COLORS.sageDark : COLORS.beige,
  color: playing ? "white" : COLORS.sageDark,
  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
}}


          >
            Tocar música ♪
          </button>
        ) : (
          <button
  type="button"
  onClick={() => (playing ? stop() : void tryPlay())}
  className="inline-flex h-12 w-12 items-center justify-center border transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2"
  style={{
    // ✅ cores dinâmicas
    borderColor: playing ? COLORS.sageDark : COLORS.beigeLine,
    background: playing ? COLORS.sageDark : COLORS.paper,
    borderRadius: 999,
    color: playing ? "white" : COLORS.sageDark,

    // ✅ ring (troca o laranja do browser pela tua cor)
    // nota: focus-visible:ring-2 já cria ring; aqui ajustas a cor
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    // ringColor via inline (Tailwind não tem a tua cor dinâmica)
    // truque: “simula” ring com outline
    outline: "none",
  }}
  aria-label={playing ? "Parar música" : "Tocar música"}
  title={playing ? "Parar música" : "Tocar música"}
>
<span className="inline-flex" style={{ lineHeight: 1 }}>
  {playing ? <IconPause /> : <IconPlay />}
</span>

</button>

        )}
      </div>
    </>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}): React.JSX.Element {
  return (
    <label className="block">
      <div className="text-[13px] font-medium" style={{ color: COLORS.muted }}>
        {props.label}
      </div>
      <input
        type={props.type || "text"}
        required={props.required}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-2 w-full border bg-white px-4 py-3 text-sm outline-none"
        style={{ borderColor: "#CBD5E1", color: COLORS.ink, borderRadius: RADIUS }}
      />
    </label>
  );
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
// ====== PHONE CONFIG (máscaras por país) ======
type DialCfg = {
  dial: string;
  label: string;
  digits: number; // dígitos depois do indicativo
  placeholder: string;
  format: (raw: string) => string; // raw contém só dígitos
};


function formatByGroups(digits: string, groups: number[], sep = "-"): string {
  let i = 0;
  const out: string[] = [];
  for (const g of groups) {
    const part = digits.slice(i, i + g);
    if (!part) break;
    out.push(part);
    i += g;
  }
  return out.join(sep);
}

const DIALS: DialCfg[] = [
  {
    dial: "+351",
    label: "+351 (Portugal)",
    digits: 9,
    placeholder: "912-345-678",
    format: (raw) => formatByGroups(raw.slice(0, 9), [3, 3, 3], "-"),
  },
  {
    dial: "+244",
    label: "+244 (Angola)",
    digits: 9,
    placeholder: "923-456-789",
    format: (raw) => formatByGroups(raw.slice(0, 9), [3, 3, 3], "-"),
  },
  {
    dial: "+55",
    label: "+55 (Brasil)",
    digits: 11, // padrão móvel: DDD(2) + 9 + 4 = 11
    placeholder: "(11) 91234-5678",
    format: (raw) => {
      const d = raw.slice(0, 11);
      const a = d.slice(0, 2);
      const b = d.slice(2, 7);
      const c = d.slice(7, 11);
      if (d.length <= 2) return a ? `(${a}` : "";
      if (d.length <= 7) return `(${a}) ${b}`;
      return `(${a}) ${b}-${c}`;
    },
  },
  {
    dial: "+41",
    label: "+41 (Suíça)",
    digits: 9, // ex: 79 123 45 67 => sem indicativo: 9 dígitos (inclui prefixo)
    placeholder: "79 123 45 67",
    format: (raw) => {
      const d = raw.slice(0, 9);
      // 2 3 2 2 com espaços (parece “premium”)
      const a = d.slice(0, 2);
      const b = d.slice(2, 5);
      const c = d.slice(5, 7);
      const e = d.slice(7, 9);
      if (d.length <= 2) return a;
      if (d.length <= 5) return `${a} ${b}`;
      if (d.length <= 7) return `${a} ${b} ${c}`;
      return `${a} ${b} ${c} ${e}`;
    },
  },

  // se quiseres manter:
  {
    dial: "+34",
    label: "+34 (Espanha)",
    digits: 9,
    placeholder: "612-345-678",
    format: (raw) => formatByGroups(raw.slice(0, 9), [3, 3, 3], "-"),
  },
  {
    dial: "+33",
    label: "+33 (França)",
    digits: 9,
    placeholder: "6 12 34 56 78",
    format: (raw) => {
      const d = raw.slice(0, 9);
      // 1 + 2 2 2 2 (ex: 6 12 34 56 78)
      const a = d.slice(0, 1);
      const b = d.slice(1, 3);
      const c = d.slice(3, 5);
      const e = d.slice(5, 7);
      const f = d.slice(7, 9);
      if (d.length <= 1) return a;
      if (d.length <= 3) return `${a} ${b}`;
      if (d.length <= 5) return `${a} ${b} ${c}`;
      if (d.length <= 7) return `${a} ${b} ${c} ${e}`;
      return `${a} ${b} ${c} ${e} ${f}`;
    },
  },
];

function getDialCfg(dial: string): DialCfg {
  return DIALS.find((d) => d.dial === dial) ?? DIALS[0]!;
}



function Hero(): React.JSX.Element {
  return (
    <section id="home" className="relative min-h-[92vh]">
      <div className="absolute inset-0">
        <img src={HERO_IMAGE_URL} alt="Afonso e Jussara" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center">
        <div className="flex flex-col items-center gap-5">
          {/* QUADRADO DO LOGO — aqui é o “bloco azul” do teu print */}
          <div className="relative h-48 w-48 sm:h-52 sm:w-52">
            <div className="absolute inset-0 " style={{ borderRadius: RADIUS }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={LOGO_URL}
                alt="Logo"
                className=" w-auto opacity-95"
                style={{ filter: "brightness(0) invert(1)" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>

          <div className={cn("text-5xl sm:text-6xl text-white", SCRIPT_CLASS)}>Afonso e Jussara</div>
          <div className="text-[12px] sm:text-[13px] tracking-[0.55em] font-medium text-white/90">18 | 09 | 2026</div>
        </div>

        <div className="mt-12 text-white/80 text-xs tracking-[0.25em] uppercase">Scroll</div>
        <div className="mt-2 h-10 w-px bg-white/40" />
      </div>
    </section>
  );
}

function Welcome(): React.JSX.Element {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[16px] leading-7" style={{ color: COLORS.muted }}>
            Olá! Criámos este site para partilhar convosco os detalhes do nosso casamento. Aqui encontram horários, locais
            e a confirmação de presença — tudo num só sítio.
          </p>
        </div>
      </div>
    </section>
  );
}

function Countdown(): React.JSX.Element {
  const { isPast, days, hours, minutes, seconds } = useCountdown(WEDDING_DATETIME_LOCAL);

  return (
    <section id="contagem" className="py-20" style={{ background: COLORS.sage }}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <div className={cn("text-5xl sm:text-6xl", SCRIPT_CLASS)} style={{ color: "white" }}>
            Contagem Regressiva
          </div>
        </div>

        {!isPast ? (
          <div className="mx-auto mt-12 grid grid-cols-4 gap-2 sm:gap-4" style={{ maxWidth: 720 }}>
            {[
              { label: "DIAS", value: days },
              { label: "HORAS", value: hours },
              { label: "MINUTOS", value: minutes },
              { label: "SEGUNDOS", value: seconds },
            ].map((x) => (
              <div
                key={x.label}
                className="bg-white/95 px-2 py-4 sm:px-3 sm:py-5 text-center"
                style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.06)", borderRadius: RADIUS }}
              >
                <div
                  className={cn("tabular-nums", QUOTE_CLASS)}
                  style={{
                    color: COLORS.sageDark,
                    fontSize: "clamp(24px, 5.5vw, 40px)",
                    fontWeight: 600,
                    lineHeight: 1.05,
                  }}
                >
                  {pad2(x.value)}
                </div>
                <div
                  className="mt-1 text-[10px] sm:text-[11px] tracking-[0.22em]"
                  style={{ color: COLORS.sageDark, fontWeight: 600 }}
                >
                  {x.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center text-white/90">Já chegou o grande dia 💍</div>
        )}
      </div>
    </section>
  );
}

type MediaItem =
  | { type: "image"; src: string; alt?: string }
  | { type: "video"; src: string; poster?: string };

function Carousel(props: {
  photos?: string[];
  items?: MediaItem[];
  intervalMs?: number;
  fadeMs?: number;
}): React.JSX.Element {
  const intervalMs = props.intervalMs ?? 5200;
  const fadeMs = props.fadeMs ?? 1400;

  // ✅ compatível com o teu array antigo (photos)
  const media: MediaItem[] = useMemo(() => {
    if (props.items?.length) return props.items;
    return (props.photos || []).map((src) => ({ type: "image", src }));
  }, [props.items, props.photos]);

  const len = media.length;

  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [fadeOn, setFadeOn] = useState(false);
  const [paused, setPaused] = useState(false);

  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);

  function isInteractiveTarget(t: EventTarget | null): boolean {
    const el = t as HTMLElement | null;
    if (!el) return false;
    return Boolean(el.closest("button,a,input,textarea,select,label,video"));
  }

  function goTo(next: number): void {
    if (len < 2) return;
    if (next === idx) return;

    setPrevIdx(idx);
    setIdx(next);
    setFadeOn(false);

    requestAnimationFrame(() => setFadeOn(true));

    window.setTimeout(() => {
      setPrevIdx(null);
      setFadeOn(false);
    }, fadeMs + 60);
  }

  function prev(): void {
    goTo((idx - 1 + len) % len);
  }

  function next(): void {
    goTo((idx + 1) % len);
  }

  const current = media[idx];
  const prevItem = prevIdx != null ? media[prevIdx] : null;

  // ✅ autoplay: pausa em vídeo (faz mais sentido)
  useEffect(() => {
    if (len < 2) return;
    if (paused) return;


    const id = window.setInterval(() => {
      next();
    }, intervalMs);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [len, paused, intervalMs, idx, current?.type]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    // ✅ se clicares num botão/thumb/link, não inicia drag
    if (isInteractiveTarget(e.target)) return;

    startX.current = e.clientX;
    deltaX.current = 0;
    setPaused(true);

    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>): void {
    if (startX.current == null) return;
    deltaX.current = e.clientX - startX.current;
  }

  function onPointerUp(): void {
    if (startX.current == null) return;

    const dx = deltaX.current;
    startX.current = null;
    deltaX.current = 0;

    if (dx > 55) prev();
    else if (dx < -55) next();

    setPaused(false);
  }

  function renderMedia(item: MediaItem, extraStyle?: React.CSSProperties): React.JSX.Element {
    if (item.type === "video") {
  return (
    <video
      src={item.src}
      poster={item.poster}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      controls={false}
      disablePictureInPicture
      controlsList="nodownload noplaybackrate noremoteplayback noremoteplayback"
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 h-full w-full"
      style={{
        objectFit: "contain",
        pointerEvents: "none", // ✅ impede clique/pausa
        ...extraStyle,
      }}
    />
  );
}


    return (
      <img
        src={item.src}
        alt={item.alt || ""}
        draggable={false}
        className="absolute inset-0 h-full w-full"
        style={{ objectFit: "initial", ...extraStyle }}
        onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
      />
    );
  }

  if (!len) return <></>;

  return (
    <div className="mx-auto mt-10 max-w-5xl">
      <div
        className={cn("relative overflow-hidden border noSelect", len > 1 ? "cursor-grab active:cursor-grabbing" : "")}
        style={{
          borderColor: COLORS.line,
          borderRadius: RADIUS,
          touchAction: "pan-y",
          background: COLORS.paper, // ✅ para o contain não ficar “feio”
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* ✅ frame com aspect ratio (evita cortes e fica consistente) */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/9]">
          {/* anterior (layer) */}
          {prevItem ? (
            <div
              className="absolute inset-0"
              style={{ opacity: fadeOn ? 0 : 1, transition: `opacity ${fadeMs}ms ease-in-out` }}
            >
              {renderMedia(prevItem)}
            </div>
          ) : null}

          {/* atual (layer) */}
          <div
            className="absolute inset-0"
            style={{
              opacity: prevItem ? (fadeOn ? 1 : 0) : 1,
              transition: prevItem ? `opacity ${fadeMs}ms ease-in-out` : undefined,
            }}
          >
            {renderMedia(current)}
          </div>

          {/* setas (só símbolo, sem bolha) */}
          {len > 1 ? (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-2 text-5xl leading-none text-white/95 transition hover:scale-105"
                style={{ textShadow: "0 8px 18px rgba(0,0,0,0.55)" }}
              >
                ‹
              </button>

              <button
                type="button"
                aria-label="Seguinte"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-2 text-5xl leading-none text-white/95 transition hover:scale-105"
                style={{ textShadow: "0 8px 18px rgba(0,0,0,0.55)" }}
              >
                ›
              </button>

              {/* thumbs (SEM fundo, só imagens) */}
              <div className="absolute bottom-3 left-1/2 z-50 -translate-x-1/2">
                <div className="flex items-center gap-2 overflow-x-auto px-1 py-1">
                  {media.map((m, i) => {
                    const active = i === idx;

                    const thumb = m.type === "video" ? (
                      <div className="relative h-full w-full">
                        {m.poster ? (
                          <img src={m.poster} alt="" className="h-full w-full object-cover" draggable={false} />
                        ) : (
                          <div className="h-full w-full" style={{ background: "rgba(0,0,0,0.20)" }} />
                        )}
                        <div
                          className="absolute inset-0 flex items-center justify-center text-white"
                          style={{ textShadow: "0 6px 12px rgba(0,0,0,0.6)" }}
                          aria-hidden="true"
                        >
                          ▶
                        </div>
                      </div>
                    ) : (
                      <img src={m.src} alt="" className="h-full w-full object-cover" draggable={false} />
                    );

                    return (
                      <button
                        key={`${m.type}-${m.src}-${i}`}
                        type="button"
                        aria-label={`Ir para item ${i + 1}`}
                        onClick={() => goTo(i)}
                        className="relative overflow-hidden transition"
                        style={{
                          width: active ? 46 : 42,
                          height: active ? 46 : 42,
                          borderRadius: 10,
                          border: active ? "2px solid rgba(255,255,255,0.95)" : "1px solid rgba(255,255,255,0.25)",
                          opacity: active ? 1 : 0.8,
                          flex: "0 0 auto",
                          boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
                        }}
                      >
                        {thumb}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}



function Couple(): React.JSX.Element {
  return (
    <section id="casal" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader
          title="O Casal"
          subtitle="Dois melhores amigos, um só caminho. Obrigado por fazeres parte deste momento."
        />

        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-6 md:gap-10">
          <div className="text-center">
            <img
              src={PHOTO_JUSSARA}
              alt="Jussara"
              className="mx-auto h-44 w-44 sm:h-52 sm:w-52 rounded-full object-cover"
              style={{ objectPosition: PHOTO_POS_JUSSARA }}
            />
            <div className="mt-5 text-xs sm:text-sm tracking-[0.22em] uppercase" style={{ color: COLORS.muted }}>
              Jussara Martins
            </div>
            <p
              className="mx-auto mt-3 max-w-md text-[14px] sm:text-[15px] italic leading-6 sm:leading-7"
              style={{ color: COLORS.muted }}
            >
              Vejo no Afonso um amor tranquilo e um abraço que cala o mundo. Com ele, o tempo abranda e tudo fica mais
              simples.
            </p>
          </div>

          <div className="text-center">
            <img
              src={PHOTO_AFONSO}
              alt="Afonso"
              className="mx-auto h-44 w-44 sm:h-52 sm:w-52 rounded-full object-cover"
              style={{ objectPosition: PHOTO_POS_AFONSO }}
            />
            <div className="mt-5 text-xs sm:text-sm tracking-[0.22em] uppercase" style={{ color: COLORS.muted }}>
              Afonso da Silva
            </div>
            <p
              className="mx-auto mt-3 max-w-md text-[14px] sm:text-[15px] italic leading-6 sm:leading-7"
              style={{ color: COLORS.muted }}
            >
              Vejo a Jussara como uma mulher resiliente e inteira. Com ela, sinto-me seguro e motivado: é amor que me
              levanta e me faz ir mais longe.
            </p>
          </div>
        </div>

        {/*<Carousel photos={GALLERY_PHOTOS} intervalMs={5200} fadeMs={1400} />*/}
<Carousel items={GALLERY_MEDIA} intervalMs={5200} fadeMs={1400} />
      </div>
    </section>
  );
}

function InfoCard(props: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="border px-4 py-3" style={{ borderColor: COLORS.line, borderRadius: RADIUS }}>
      <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: COLORS.muted }}>
        {props.label}
      </div>
      <div className="mt-1 text-[14px]" style={{ color: COLORS.ink }}>
        {props.value}
      </div>
    </div>
  );
}

function LinkButton(props: { href: string; label: string }): React.JSX.Element {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noreferrer"
      className="border px-4 py-2 text-[11px] tracking-[0.22em] uppercase transition hover:bg-black/5 whitespace-nowrap"
      style={{ borderColor: COLORS.line, color: COLORS.muted, borderRadius: 999 }}
    >
      {props.label}
    </a>
  );
}
function IconPin(): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z"
        stroke={COLORS.sageDark}
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.3" stroke={COLORS.sageDark} strokeWidth="1.8" />
    </svg>
  );
}

function IconHome(): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.5Z"
        stroke={COLORS.sageDark}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M10 21v-6h4v6" stroke={COLORS.sageDark} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconClock(): React.JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke={COLORS.sageDark} strokeWidth="1.8" />
      <path d="M12 7v5l3 2" stroke={COLORS.sageDark} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IconPlay(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 7v10l9-5-9-5Z" fill="currentColor" />
    </svg>
  );
}

function IconPause(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7h4v10H7V7Zm6 0h4v10h-4V7Z" fill="currentColor" />
    </svg>
  );
}

function TravelButtons(props: { destination: string }): React.JSX.Element {
  const maps = buildMapsLink(props.destination);
  const apple = buildAppleMapsLink(props.destination);
  const waze = buildWazeLink(props.destination);

  return (
    <div className="flex flex-col items-end">
      <div
        className="text-[11px] tracking-[0.28em] uppercase"
        style={{ color: COLORS.muted, fontWeight: 700 }}
      >
        INICIAR VIAGEM
      </div>

      <div className="mt-3 flex items-center gap-3">
        {[
          { href: maps, src: NAV_ICONS.google, label: "Google Maps" },
          { href: apple, src: NAV_ICONS.apple, label: "Apple Maps" },
          { href: waze, src: NAV_ICONS.waze, label: "Waze" },
        ].map((it) => (
          <a
            key={it.label}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={it.label}
            title={it.label}
            className="inline-flex h-11 w-11 items-center justify-center transition hover:scale-[1.03]"
            style={{
              borderRadius: 999,
              background: "rgba(31,41,55,0.04)",
            }}
          >
            <span
              className="inline-flex h-9 w-9 items-center justify-center overflow-hidden"
              style={{ borderRadius: 999, background: "white" }}
            >
              <img src={it.src} alt="" className="h-9 w-9 object-cover" draggable={false} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}


function LocationBlock(props: {
  title: string;

  day: string;
  month: string;
  year: string;
  time: string;
  timeHint?: string;
  venueLabel?: string;

  place: string;
  address: string;

  hero?: string;
  heroFit?: "cover" | "contain";

  introText: string; // (vem do objeto, mas aqui não renderizamos — vai no SectionHeader)
  icon?: "home" | "pin"; // ✅ novo
}): React.JSX.Element {
  const full = `${props.place}, ${props.address}`;
  const embed = buildEmbedMapUrl(full);

  const [showMap, setShowMap] = useState(false);

  return (
    <div className="mx-auto mt-14 max-w-5xl">
      {/* ✅ FOTO EM CIMA (como tinhas) */}
      {props.hero ? (
        <div className="overflow-hidden border" style={{ borderColor: COLORS.line, borderRadius: RADIUS }}>
          <img
            src={props.hero}
            alt={props.title}
            className={cn(
              "w-full",
              props.heroFit === "contain"
                ? "h-[360px] sm:h-[520px] object-contain bg-black/5"
                : "h-[360px] sm:h-[520px] object-cover"
            )}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : null}

      {/* ✅ CARD (layout igual ao print) */}
      <div className="mt-10 border bg-white" style={{ borderColor: COLORS.line, borderRadius: RADIUS, overflow: "hidden" }}>
       {/* DATA + HORA (sempre lado a lado, até no mobile) */}
<div className="px-7 py-7 sm:px-8 sm:py-8">
  <div
    className="grid items-center gap-4"
    style={{
      gridTemplateColumns: "1fr 1fr", // ✅ sempre 2 colunas
    }}
  >
    {/* ESQUERDA: DATA */}
    <div className="flex items-center gap-4">
      <div
        className="flex h-16 w-16 items-center justify-center sm:h-20 sm:w-20"
        style={{ background: COLORS.sage, borderRadius: RADIUS }}
      >
        <div className={cn("text-3xl sm:text-4xl", QUOTE_CLASS)} style={{ color: "white", fontWeight: 600 }}>
          {props.day}
        </div>
      </div>

      <div className="min-w-0">
        <div className={cn("text-xl sm:text-2xl truncate", QUOTE_CLASS)} style={{ color: COLORS.ink }}>
          {props.month}
        </div>
        <div className="mt-1 text-[11px] sm:text-[12px] tracking-[0.28em] uppercase" style={{ color: COLORS.muted }}>
          {props.year}
        </div>
      </div>
    </div>

    {/* DIREITA: HORÁRIO */}
    <div className="flex items-center justify-end gap-3">
      <div
        className="inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center"
        style={{ background: "rgba(174,183,162,0.18)", borderRadius: 999 }}
      >
        <IconClock />
      </div>

      <div className="text-right">
        <div className="text-[11px] tracking-[0.28em] uppercase" style={{ color: COLORS.muted, fontWeight: 700 }}>
          HORÁRIO
        </div>
        <div className={cn("mt-1 text-[16px] sm:text-[18px]", QUOTE_CLASS)} style={{ color: COLORS.ink }}>
          {props.time}
        </div>
        {props.timeHint ? (
          <div className="text-[12px]" style={{ color: COLORS.muted }}>
            {props.timeHint}
          </div>
        ) : null}
      </div>
    </div>
  </div>
</div>


        {/* LOCAL + INICIAR VIAGEM (igual ao print) */}
        <div className="border-t px-7 py-7 sm:px-8" style={{ borderColor: COLORS.line, background: "rgba(243,238,228,0.22)" }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center" style={{ background: "rgba(174,183,162,0.22)", borderRadius: RADIUS }}>
                {props.icon === "pin" ? <IconPin /> : <IconHome />}
              </div>

              <div>
                <div className={cn("text-[16px]", QUOTE_CLASS)} style={{ color: COLORS.ink }}>
                  {props.place}
                </div>

                {props.venueLabel ? (
                  <div className="mt-1 text-[11px] tracking-[0.28em] uppercase" style={{ color: COLORS.muted }}>
                    {props.venueLabel}
                  </div>
                ) : null}

                <div className="mt-3 text-[13px] leading-6" style={{ color: COLORS.muted }}>
                  {props.address}
                </div>
              </div>
            </div>

            {/* ✅ usa o teu TravelButtons existente */}
            <TravelButtons destination={full} />
          </div>
        </div>

        {/* MAPA (mantém, oculto por defeito) */}
        <div className="border-t px-7 py-6 sm:px-8" style={{ borderColor: COLORS.line }}>
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowMap((v) => !v)}
              className="border px-6 py-2 text-[11px] tracking-[0.22em] uppercase transition hover:bg-black/5"
              style={{ borderColor: COLORS.line, color: COLORS.muted, borderRadius: 999 }}
            >
              {showMap ? "Ocultar mapa" : "Mostrar mapa"}
            </button>
          </div>
        </div>
      </div>

      {showMap ? (
        <div className="mx-auto mt-10 max-w-5xl overflow-hidden" style={{ border: `1px solid ${COLORS.line}`, borderRadius: RADIUS }}>
          <iframe
            title={`Mapa ${props.title}`}
            src={embed}
            className="h-[280px] w-full sm:h-[360px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  );
}



function Ceremony(): React.JSX.Element {
  return (
    <section id="cerimonia" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader title="Cerimónia" subtitle={CEREMONY.introText} />
        <LocationBlock {...CEREMONY} icon="pin" />
      </div>
    </section>
  );
}

function Reception(): React.JSX.Element {
  return (
    <section id="rececao" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader title="Receção" subtitle={RECEPTION.introText} />
        <LocationBlock {...RECEPTION} icon="home" />
      </div>
    </section>
  );
}





// ====== Presence (Grupo / Associados + Atualizar por Código de Família) ======
type RsvpMember = {
  guestId: string;
  name: string;
  attendance: "yes" | "no";
  role?: string;
  isChild?: boolean;
};

type RsvpApiResponse =
  | {
      ok: true;
      mode: "group";
      group: { id: string; name: string; code?: string };
      members: Array<{ guestId: string; name: string; role?: string; isChild?: boolean }>;
    }
  | {
      ok: true;
      mode: "family";
      group: { id: string; name: string; code: string };
      members: Array<{ guestId: string; name: string; role?: string; isChild?: boolean; attendance: "yes" | "no" }>;
    }
  | {
      ok: true;
      mode: "done";
      bucket: "open" | "group";
      action?: "created" | "updated";
      familyCode?: string;
    }
  | { ok: false; error: string };

function Presence(): React.JSX.Element {
  const [flow, setFlow] = useState<"normal" | "family">("normal");

  // normal
  const [attendance, setAttendance] = useState<"yes" | "no">("yes");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dial, setDial] = useState("+351");
  const [phone, setPhone] = useState("");

  // family update
  const [familyCode, setFamilyCode] = useState("");

  // stages
  const [stage, setStage] = useState<"form" | "group" | "familyForm" | "family">("form");
  const [group, setGroup] = useState<{ id: string; name: string; code?: string } | null>(null);
  const [members, setMembers] = useState<RsvpMember[]>([]);

  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalText, setModalText] = useState("");
  const [modalFamilyCode, setModalFamilyCode] = useState<string | null>(null);

  const cfg = getDialCfg(dial);
  const emailOk = isValidEmail(email);
  const phoneDigits = countDigits(phone);
  const phoneOk = phoneDigits === cfg.digits;

  const canSubmitForm = name.trim().length > 1 && emailOk && phoneOk;
  const canSubmitGroup = emailOk && phoneOk && members.length > 0 && Boolean(group?.name);
  const codeOk = familyCode.trim().length >= 3;

  const canSubmit =
    flow === "family"
      ? stage === "familyForm"
        ? codeOk
        : stage === "family"
          ? codeOk && members.length > 0
          : false
      : stage === "group"
        ? canSubmitGroup
        : canSubmitForm;

  function resetNormal(): void {
    setAttendance("yes");
    setName("");
    setEmail("");
    setDial("+351");
    setPhone("");

    setStage("form");
    setGroup(null);
    setMembers([]);

    setStatus("idle");
    setStatusMsg("");
  }

  function resetFamily(keepCode = true): void {
    setAttendance("yes");
    setGroup(null);
    setMembers([]);
    setStage("familyForm");
    setStatus("idle");
    setStatusMsg("");
    if (!keepCode) setFamilyCode("");
  }

  function switchFlow(next: "normal" | "family"): void {
    setFlow(next);
    setStatus("idle");
    setStatusMsg("");
    setGroup(null);
    setMembers([]);
    if (next === "family") setStage("familyForm");
    else setStage("form");
  }

  function kickBackToFormIfEditing(): void {
    if (flow !== "normal") return;
    if (stage === "group") {
      setStage("form");
      setGroup(null);
      setMembers([]);
    }
  }

  function onDialChange(newDial: string): void {
    kickBackToFormIfEditing();
    setDial(newDial);
    const digits = onlyDigits(phone);
    setPhone(getDialCfg(newDial).format(digits));
  }

  function onPhoneChange(v: string): void {
    kickBackToFormIfEditing();
    const digits = onlyDigits(v);
    setPhone(cfg.format(digits));
  }

  function setAttendanceSmart(v: "yes" | "no"): void {
    setAttendance(v);
    // aplica a todos quando estás a editar uma lista
    if (stage === "group" || stage === "family") {
      setMembers((prev) => prev.map((m) => ({ ...m, attendance: v })));
    }
  }

  function setMemberAttendance(guestId: string, v: "yes" | "no"): void {
    setMembers((prev) => prev.map((m) => (m.guestId === guestId ? { ...m, attendance: v } : m)));
  }

  function normalizeFamilyCode(v: string): string {
    return v.trim().toUpperCase();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatusMsg("");

    if (!canSubmit) {
      setStatus("error");
      setStatusMsg(
        flow === "family"
          ? "Insere um Código de Família válido."
          : "Preenche Nome, Email válido e Telemóvel corretamente."
      );
      return;
    }

    setStatus("sending");

    const payload =
      flow === "family"
        ? stage === "family"
          ? {
              step: "family_submit",
              familyCode: normalizeFamilyCode(familyCode),
              members: members.map((m) => ({ guestId: m.guestId, attendance: m.attendance })),
            }
          : {
              step: "family_lookup",
              familyCode: normalizeFamilyCode(familyCode),
            }
        : stage === "group"
          ? {
              step: "submit",
              attendance,
              name: name.trim(),
              email: email.trim(),
              dial,
              phoneDigits: onlyDigits(phone),
              phone: `${dial} ${onlyDigits(phone)}`.trim(),
              groupId: group?.id,
              groupName: group?.name,
              members: members.map((m) => ({ guestId: m.guestId, name: m.name, attendance: m.attendance })),
            }
          : {
              step: "lookup",
              attendance,
              name: name.trim(),
              email: email.trim(),
              dial,
              phoneDigits: onlyDigits(phone),
              phone: `${dial} ${onlyDigits(phone)}`.trim(),
            };

    try {
      const res = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({ ok: false, error: `Falhou (${res.status}).` }))) as RsvpApiResponse;

      if (!res.ok || data.ok === false) throw new Error((data as any).error || `Falhou (${res.status}).`);

      // ===== 1) GROUP (fluxo normal)
      if (data.ok && data.mode === "group") {
        setGroup(data.group);
        setMembers(
          (data.members || []).map((m) => ({
            guestId: m.guestId,
            name: m.name,
            role: m.role,
            isChild: m.isChild,
            attendance,
          }))
        );
        setStage("group");
        setStatus("idle");
        return;
      }

      // ===== 2) FAMILY (update por código)
      if (data.ok && data.mode === "family") {
        setGroup({ id: data.group.id, name: data.group.name, code: data.group.code });
        setMembers(
          (data.members || []).map((m) => ({
            guestId: m.guestId,
            name: m.name,
            role: m.role,
            isChild: m.isChild,
            attendance: m.attendance,
          }))
        );
        setStage("family");
        setStatus("idle");
        return;
      }

      // ===== 3) DONE
      if (data.ok && data.mode === "done") {
        const isUpdate = data.action === "updated";

        const code = (data.familyCode || group?.code || "").trim();
        setModalFamilyCode(code ? code : null);

        if (flow === "family") {
          setModalTitle(isUpdate ? "Atualizado! ✅" : "Feito! ✅");
          setModalText(
            isUpdate
              ? "Atualizámos as confirmações do grupo pelo código."
              : "Registámos as confirmações do grupo pelo código."
          );
          resetFamily(true);
          setModalOpen(true);
          return;
        }

        const title =
          attendance === "yes"
            ? isUpdate
              ? "Atualizado! ✅"
              : "Obrigado! 🙌"
            : isUpdate
              ? "Atualizado 💚"
              : "Tudo certo 💚";

        const text =
          attendance === "yes"
            ? isUpdate
              ? "Atualizámos a tua confirmação. Vemo-nos no grande dia 💚"
              : "A tua presença foi registada com sucesso. Vemo-nos no grande dia 💚"
            : isUpdate
              ? "Atualizámos a tua resposta. Obrigado por avisares."
              : "Sem problemas — obrigado por avisares. Se mudares de ideias, podes voltar aqui e atualizar.";

        resetNormal();
        setModalTitle(title);
        setModalText(text);
        setModalOpen(true);
        return;
      }

      throw new Error("Resposta inesperada da API.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro.";
      setStatus("error");
      setStatusMsg(msg);
    } finally {
      setStatus((prev) => (prev === "sending" ? "idle" : prev));
    }
  }

  return (
    <section id="presenca" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader title="Presença" subtitle="Confirma para conseguirmos organizar tudo direitinho." />

        <div
          className="mx-auto mt-14 max-w-2xl border bg-white p-7 sm:p-8"
          style={{ borderColor: COLORS.line, borderRadius: RADIUS }}
        >
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 gap-2">
            {(
              [
                { k: "normal", l: "Confirmar presença" },
                { k: "family", l: "Atualizar por código" },
              ] as const
            ).map((x) => {
              const active = flow === x.k;
              return (
                <button
                  key={x.k}
                  type="button"
                  onClick={() => switchFlow(x.k)}
                  className="border px-4 py-3 text-[11px] tracking-[0.22em] uppercase transition"
                  style={{
                    borderRadius: RADIUS,
                    borderColor: active ? COLORS.sageDark : COLORS.line,
                    color: active ? COLORS.sageDark : COLORS.muted,
                    background: active ? "rgba(174,183,162,0.12)" : "white",
                  }}
                >
                  {x.l}
                </button>
              );
            })}
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* ========== FLOW NORMAL ========= */}
            {flow === "normal" ? (
              <>
                {/* Botões Sim/Não */}
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { v: "yes", l: "Sim" },
                      { v: "no", l: "Não" },
                    ] as const
                  ).map((x) => {
                    const active = attendance === x.v;
                    return (
                      <button
                        key={x.v}
                        type="button"
                        onClick={() => setAttendanceSmart(x.v)}
                        className="border px-4 py-3 text-xs tracking-[0.25em] uppercase transition"
                        style={{
                          borderRadius: RADIUS,
                          borderColor: active ? COLORS.sageDark : COLORS.line,
                          color: active ? COLORS.sageDark : COLORS.muted,
                          background: active ? "rgba(174,183,162,0.12)" : "white",
                          transform: active ? "translateY(-1px)" : "translateY(0)",
                          boxShadow: active ? "0 10px 22px rgba(0,0,0,0.06)" : "none",
                        }}
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          {active ? <span aria-hidden="true">✓</span> : null}
                          <span>{x.l}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Nome */}
                <label className="block">
                  <div className="text-[13px] font-medium" style={{ color: COLORS.muted }}>
                    Nome
                  </div>
                  <input
                    value={name}
                    onChange={(e) => {
                      kickBackToFormIfEditing();
                      setName(e.target.value);
                    }}
                    required
                    placeholder="O teu nome"
                    className="mt-2 w-full border bg-white px-4 py-3 text-sm outline-none"
                    style={{ borderColor: "#CBD5E1", color: COLORS.ink, borderRadius: RADIUS }}
                  />
                </label>

                {/* Email */}
                <label className="block">
                  <div className="text-[13px] font-medium" style={{ color: COLORS.muted }}>
                    Email
                  </div>
                  <input
                    value={email}
                    onChange={(e) => {
                      kickBackToFormIfEditing();
                      setEmail(e.target.value);
                    }}
                    required
                    type="email"
                    placeholder="teu@email.com"
                    className="mt-2 w-full border bg-white px-4 py-3 text-sm outline-none"
                    style={{ borderColor: "#CBD5E1", color: COLORS.ink, borderRadius: RADIUS }}
                  />
                </label>

                {!emailOk && email.trim().length > 0 ? (
                  <div className="text-[12px]" style={{ color: "#b91c1c" }}>
                    Email inválido.
                  </div>
                ) : null}

                {/* Telemóvel */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block sm:col-span-1">
                    <div className="text-[13px] font-medium" style={{ color: COLORS.muted }}>
                      Indicativo
                    </div>

                    <select
                      value={dial}
                      onChange={(e) => onDialChange(e.target.value)}
                      className="mt-2 w-full border bg-white px-4 py-3 text-sm outline-none"
                      style={{ borderColor: "#CBD5E1", color: COLORS.ink, borderRadius: RADIUS }}
                    >
                      {DIALS.map((d) => (
                        <option key={d.dial} value={d.dial}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="sm:col-span-2">
                    <label className="block">
                      <div className="text-[13px] font-medium" style={{ color: COLORS.muted }}>
                        Telemóvel
                      </div>

                      <input
                        value={phone}
                        onChange={(e) => onPhoneChange(e.target.value)}
                        inputMode="numeric"
                        autoComplete="tel"
                        required
                        placeholder={cfg.placeholder}
                        className="mt-2 w-full border bg-white px-4 py-3 text-sm outline-none"
                        style={{ borderColor: "#CBD5E1", color: COLORS.ink, borderRadius: RADIUS }}
                      />

                      {phone.length > 0 && !phoneOk ? (
                        <div className="mt-2 text-[12px]" style={{ color: "#b91c1c" }}>
                          Este país exige {cfg.digits} dígitos após o indicativo.
                        </div>
                      ) : null}
                    </label>
                  </div>
                </div>

                {/* BLOCO DO GRUPO / ASSOCIADOS */}
                {stage === "group" && group ? (
                  <div
                    className="border p-4"
                    style={{ borderColor: COLORS.line, borderRadius: RADIUS, background: "rgba(243,238,228,0.18)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: COLORS.muted }}>
                          Grupo
                        </div>
                        <div className={cn("mt-1 text-[18px]", QUOTE_CLASS)} style={{ color: COLORS.ink }}>
                          {group.name}
                        </div>
                        <div className="mt-1 text-[12px]" style={{ color: COLORS.muted }}>
                          Marca “Sim/Não” para cada pessoa. (O botão de cima aplica a todos.)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setStage("form");
                          setGroup(null);
                          setMembers([]);
                        }}
                        className="border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition hover:bg-black/5"
                        style={{ borderColor: COLORS.line, color: COLORS.muted, borderRadius: 999, flex: "0 0 auto" }}
                        title="Voltar e alterar dados"
                      >
                        Voltar
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {members.map((m) => (
                        <div
                          key={m.guestId}
                          className="flex items-center justify-between gap-3 border bg-white p-3"
                          style={{ borderColor: COLORS.line, borderRadius: RADIUS }}
                        >
                          <div className="min-w-0">
                            <div className="text-[14px]" style={{ color: COLORS.ink }}>
                              {m.name}
                            </div>

                            {m.role || m.isChild ? (
                              <div className="mt-1 text-[12px]" style={{ color: COLORS.muted }}>
                                {m.role ? m.role : null}
                                {m.role && m.isChild ? " • " : null}
                                {m.isChild ? "Criança" : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex gap-2">
                            {(["yes", "no"] as const).map((v) => {
                              const active = m.attendance === v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setMemberAttendance(m.guestId, v)}
                                  className="border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition"
                                  style={{
                                    borderRadius: 999,
                                    borderColor: active ? COLORS.sageDark : COLORS.line,
                                    color: active ? COLORS.sageDark : COLORS.muted,
                                    background: active ? "rgba(174,183,162,0.12)" : "white",
                                  }}
                                >
                                  {v === "yes" ? "Sim" : "Não"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "sending" || !canSubmit}
                  className="w-full border px-6 py-3 text-xs tracking-[0.25em] uppercase transition"
                  style={{
                    borderRadius: RADIUS,
                    borderColor: COLORS.sageDark,
                    color: "white",
                    background: COLORS.sageDark,
                    opacity: status === "sending" || !canSubmit ? 0.6 : 1,
                  }}
                >
                  {status === "sending" ? "A enviar..." : stage === "group" ? "Confirmar grupo" : "Confirmar"}
                </button>
              </>
            ) : (
              // ========== FLOW FAMILY ==========
              <>
                <label className="block">
                  <div className="text-[13px] font-medium" style={{ color: COLORS.muted }}>
                    Código de família
                  </div>
                  <input
                    value={familyCode}
                    onChange={(e) => setFamilyCode(normalizeFamilyCode(e.target.value))}
                    placeholder="Ex: A1B2C3"
                    className="mt-2 w-full border bg-white px-4 py-3 text-sm outline-none"
                    style={{ borderColor: "#CBD5E1", color: COLORS.ink, borderRadius: RADIUS }}
                  />
                  <div className="mt-2 text-[12px]" style={{ color: COLORS.muted }}>
                    Este modo serve para atualizar confirmações do grupo sem precisar de email/telemóvel.
                  </div>
                </label>

                {(stage === "family" || stage === "familyForm") && group && stage === "family" ? (
                  <div
                    className="border p-4"
                    style={{ borderColor: COLORS.line, borderRadius: RADIUS, background: "rgba(243,238,228,0.18)" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: COLORS.muted }}>
                          Grupo
                        </div>
                        <div className={cn("mt-1 text-[18px]", QUOTE_CLASS)} style={{ color: COLORS.ink }}>
                          {group.name}
                        </div>
                        {group.code ? (
                          <div className="mt-1 text-[12px]" style={{ color: COLORS.muted }}>
                            Código: <span style={{ color: COLORS.ink, fontWeight: 600 }}>{group.code}</span>
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => resetFamily(true)}
                        className="border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition hover:bg-black/5"
                        style={{ borderColor: COLORS.line, color: COLORS.muted, borderRadius: 999, flex: "0 0 auto" }}
                        title="Trocar código / voltar"
                      >
                        Voltar
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {members.map((m) => (
                        <div
                          key={m.guestId}
                          className="flex items-center justify-between gap-3 border bg-white p-3"
                          style={{ borderColor: COLORS.line, borderRadius: RADIUS }}
                        >
                          <div className="min-w-0">
                            <div className="text-[14px]" style={{ color: COLORS.ink }}>
                              {m.name}
                            </div>

                            {m.role || m.isChild ? (
                              <div className="mt-1 text-[12px]" style={{ color: COLORS.muted }}>
                                {m.role ? m.role : null}
                                {m.role && m.isChild ? " • " : null}
                                {m.isChild ? "Criança" : null}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex gap-2">
                            {(["yes", "no"] as const).map((v) => {
                              const active = m.attendance === v;
                              return (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setMemberAttendance(m.guestId, v)}
                                  className="border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition"
                                  style={{
                                    borderRadius: 999,
                                    borderColor: active ? COLORS.sageDark : COLORS.line,
                                    color: active ? COLORS.sageDark : COLORS.muted,
                                    background: active ? "rgba(174,183,162,0.12)" : "white",
                                  }}
                                >
                                  {v === "yes" ? "Sim" : "Não"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* aplicar a todos (só quando já carregou membros) */}
                {stage === "family" && members.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { v: "yes", l: "Aplicar SIM a todos" },
                        { v: "no", l: "Aplicar NÃO a todos" },
                      ] as const
                    ).map((x) => (
                      <button
                        key={x.v}
                        type="button"
                        onClick={() => setAttendanceSmart(x.v)}
                        className="border px-4 py-3 text-[11px] tracking-[0.22em] uppercase transition"
                        style={{
                          borderRadius: RADIUS,
                          borderColor: COLORS.line,
                          color: COLORS.muted,
                          background: "white",
                        }}
                      >
                        {x.l}
                      </button>
                    ))}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={status === "sending" || !canSubmit}
                  className="w-full border px-6 py-3 text-xs tracking-[0.25em] uppercase transition"
                  style={{
                    borderRadius: RADIUS,
                    borderColor: COLORS.sageDark,
                    color: "white",
                    background: COLORS.sageDark,
                    opacity: status === "sending" || !canSubmit ? 0.6 : 1,
                  }}
                >
                  {status === "sending"
                    ? "A enviar..."
                    : stage === "family"
                      ? "Atualizar confirmações"
                      : "Carregar grupo"}
                </button>
              </>
            )}

            {status === "error" ? (
              <div className="text-sm" style={{ color: "#b91c1c" }}>
                {statusMsg}
              </div>
            ) : null}
          </form>
        </div>

        {/* MODAL */}
        {modalOpen ? (
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.55)" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="w-full max-w-md border bg-white p-6" style={{ borderColor: COLORS.line, borderRadius: RADIUS }}>
              <div className={cn("text-3xl", SCRIPT_CLASS)} style={{ color: COLORS.sageDark }}>
                {modalTitle}
              </div>

              <div className="mt-3 text-[15px] leading-7" style={{ color: COLORS.muted }}>
                {modalText}
              </div>

              {modalFamilyCode ? (
                <div className="mt-4">
                  <CopyPill label="Código de família" value={modalFamilyCode} />
                  <div className="mt-2 text-[12px]" style={{ color: COLORS.muted }}>
                    Guarda este código para atualizar a confirmação do grupo mais tarde.
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setModalFamilyCode(null);
                  }}
                  className="border px-5 py-2 text-[11px] tracking-[0.22em] uppercase transition hover:bg-black/5"
                  style={{ borderColor: COLORS.line, color: COLORS.muted, borderRadius: 999 }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}


function TextArea(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}): React.JSX.Element {
  return (
    <label className="block">
      <div className="text-[13px] font-medium" style={{ color: COLORS.muted }}>
        {props.label}
      </div>

      <textarea
        value={props.value}
        rows={props.rows || 5}
        placeholder={props.placeholder}
        required={props.required}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-2 w-full border bg-white px-4 py-3 text-sm outline-none"
        style={{ borderColor: "#CBD5E1", color: COLORS.ink, borderRadius: RADIUS }}
      />
    </label>
  );
}


function Guestbook(): React.JSX.Element {
  const MAX_ITEMS = 50;
  const MAX_MESSAGE_CHARS = 400;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [items, setItems] = useState<Array<{ name: string; message: string; createdAt: string }>>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const canSubmit = name.trim().length > 1 && message.trim().length > 2;

  // ✅ scroll interno (a lista não estica a página)
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [items.length]);

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const res = await fetch(GUESTBOOK_ENDPOINT, { method: "GET" });
        const data = (await res.json()) as { ok: boolean; items?: typeof items; error?: string };
        if (!res.ok || !data.ok) throw new Error(data.error || "Falha ao carregar recados.");

        const normalized = (data.items || [])
          .slice(0, MAX_ITEMS)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        setItems(normalized);
      } catch {
        setItems([]);
      }
    }
    void load();
  }, []);

  async function onSend(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatusMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMsg = message.trim();

    if (cleanName.length < 2) {
      setStatus("error");
      setStatusMsg("Nome é obrigatório.");
      return;
    }

    if (cleanMsg.length < 3) {
      setStatus("error");
      setStatusMsg("Mensagem é obrigatória.");
      return;
    }

    if (cleanMsg.length > MAX_MESSAGE_CHARS) {
      setStatus("error");
      setStatusMsg(`Máximo ${MAX_MESSAGE_CHARS} caracteres.`);
      return;
    }

    setStatus("sending");

    const payload = {
      name: cleanName,
      email: cleanEmail,
      message: cleanMsg,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(GUESTBOOK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        ok: boolean;
        item?: { name: string; message: string; createdAt: string };
        error?: string;
      };

      if (!res.ok || !data.ok || !data.item) throw new Error(data.error || `Falhou (${res.status}).`);

      setItems((prev) => [...prev, data.item!].slice(-MAX_ITEMS));

      setStatus("ok");
      setStatusMsg("Recado enviado. Obrigado! 💬");

      setName("");
      setEmail("");
      setMessage("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ocorreu um erro.";
      setStatus("error");
      setStatusMsg(msg);
    } finally {
      setStatus((prev) => (prev === "sending" ? "idle" : prev));
    }
  }

  return (
    <section id="recados" style={{ background: COLORS.beige }}>
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader title="Livro de Recados" subtitle="Deixa aqui uma mensagem — vai ficar guardada para sempre." />

        <div className="mx-auto mt-14 max-w-5xl">
          {/* FORM */}
          <div className="border bg-white" style={{ borderColor: COLORS.beigeLine, borderRadius: RADIUS }}>
            <form onSubmit={onSend} className="p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <div
                    className="text-[11px] tracking-[0.28em] uppercase"
                    style={{ color: COLORS.muted, fontWeight: 700 }}
                  >
                    NOME
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-3 w-full border bg-white px-4 py-3 text-sm outline-none"
                    style={{ borderColor: COLORS.line, borderRadius: 2, color: COLORS.ink }}
                    placeholder=""
                  />
                </label>

                <label className="block">
                  <div
                    className="text-[11px] tracking-[0.28em] uppercase"
                    style={{ color: COLORS.muted, fontWeight: 700 }}
                  >
                    EMAIL (OPCIONAL)
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="mt-3 w-full border bg-white px-4 py-3 text-sm outline-none"
                    style={{ borderColor: COLORS.line, borderRadius: 2, color: COLORS.ink }}
                    placeholder=""
                  />
                </label>
              </div>

              <label className="block">
                <div
                  className="text-[11px] tracking-[0.28em] uppercase"
                  style={{ color: COLORS.muted, fontWeight: 700 }}
                >
                  MENSAGEM
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  maxLength={MAX_MESSAGE_CHARS}
                  className="mt-3 w-full border bg-white px-4 py-3 text-sm outline-none"
                  style={{ borderColor: COLORS.line, borderRadius: 2, color: COLORS.ink }}
                  placeholder="Escreve aqui o teu recado..."
                />

                <div className="mt-2 flex items-center justify-between text-[12px]" style={{ color: COLORS.muted }}>
                  <span>{message.trim().length > 0 ? "Escreve algo curto e bonito 😄" : ""}</span>
                  <span>
                    {Math.min(message.length, MAX_MESSAGE_CHARS)}/{MAX_MESSAGE_CHARS}
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-start">
                <button
                  type="submit"
                  disabled={status === "sending" || !canSubmit}
                  className="px-8 py-3 text-[11px] tracking-[0.28em] uppercase transition"
                  style={{
                    background: COLORS.sage,
                    color: "white",
                    borderRadius: 2,
                    opacity: status === "sending" || !canSubmit ? 0.65 : 1,
                  }}
                >
                  {status === "sending" ? "A enviar..." : "ENVIAR RECADO"}
                </button>
              </div>

              {status !== "idle" ? (
                <div className="text-sm" style={{ color: status === "ok" ? COLORS.sageDark : "#b91c1c" }}>
                  {statusMsg}
                </div>
              ) : null}
            </form>
          </div>

          {/* LISTA (com scroll + fade topo/fundo) */}
          <div className="relative mt-10">
            {/* fade topo */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-10 z-10"
              style={{
                background: "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0))",
                borderTopLeftRadius: RADIUS,
                borderTopRightRadius: RADIUS,
              }}
              aria-hidden="true"
            />

            {/* fade fundo */}
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-10 z-10"
              style={{
                background: "linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0))",
                borderBottomLeftRadius: RADIUS,
                borderBottomRightRadius: RADIUS,
              }}
              aria-hidden="true"
            />

            <div
              ref={listRef}
              className="space-y-5 border bg-white p-4"
              style={{
                borderColor: COLORS.beigeLine,
                borderRadius: RADIUS,
                maxHeight: 520, // ✅ ajusta como quiseres
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {items.length === 0 ? (
                <div className="p-2" style={{ color: COLORS.muted }}>
                  Ainda não há recados.
                </div>
              ) : (
                items.map((it, idx) => (
                  <div
                    key={idx}
                    className="border bg-white"
                    style={{ borderColor: COLORS.beigeLine, borderRadius: RADIUS }}
                  >
                    <div className="flex gap-4 p-6">
                      <div
                        className="w-1"
                        style={{ background: "rgba(174,183,162,0.55)", borderRadius: 999 }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className={cn("text-[15px]", QUOTE_CLASS)} style={{ color: COLORS.ink }}>
                            {it.name}
                          </div>
                          <div className="text-[12px]" style={{ color: COLORS.muted }}>
                            {new Date(it.createdAt).toLocaleDateString("pt-PT")}
                          </div>
                        </div>

                        <div className="mt-3 text-[14px] leading-7" style={{ color: COLORS.muted }}>
                          {it.message}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback (alguns browsers / contexts)
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}


function CopyPill(props: { label: string; value: string; iconAfterSrc?: string; iconAfterAlt?: string; iconAfterHeight?: number; }): React.JSX.Element {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function onCopy(): Promise<void> {
    const ok = await copyToClipboard(props.value);
    setState(ok ? "copied" : "error");
    window.setTimeout(() => setState("idle"), 1200);
  }

  return (
    <div
      className="border px-4 py-3 flex items-start justify-between gap-3"
      style={{ borderColor: COLORS.line, borderRadius: RADIUS }}
    >
      <div className="min-w-0">
        <div className="text-[10px] tracking-[0.25em] uppercase" style={{ color: COLORS.muted }}>
          {props.label}
        </div>

        {/* ✅ valor + logo DEPOIS (sem bolinha) */}
        <div className="mt-1 font-medium break-words flex items-center gap-2" style={{ color: COLORS.ink }}>
          <span className="break-words">{props.value}</span>

          {props.iconAfterSrc ? (
            <img
              src={props.iconAfterSrc}
              alt={props.iconAfterAlt || props.label}
              className="w-auto"
              style={{ height: props.iconAfterHeight ?? 16, opacity: 0.9 }} // ✅ default 16px
              draggable={false}
              onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
            />

          ) : null}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void onCopy()}
        className="border px-3 py-2 text-[10px] tracking-[0.22em] uppercase transition hover:bg-black/5"
        style={{
          borderColor: state === "copied" ? COLORS.sageDark : COLORS.line,
          color: state === "copied" ? COLORS.sageDark : state === "error" ? "#b91c1c" : COLORS.muted,
          borderRadius: 999,
          flex: "0 0 auto",
          background: state === "copied" ? "rgba(174,183,162,0.12)" : "transparent",
        }}
      >
        {state === "copied" ? "Copiado ✓" : state === "error" ? "Falhou" : "Copiar"}
      </button>
    </div>
  );
}

function IconLock(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 11V8.5a5 5 0 0 1 10 0V11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M7.5 11h9A2.5 2.5 0 0 1 19 13.5v5A2.5 2.5 0 0 1 16.5 21h-9A2.5 2.5 0 0 1 5 18.5v-5A2.5 2.5 0 0 1 7.5 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PayBadge(props: { label: string; src?: string }): React.JSX.Element {
  const [ok, setOk] = useState(true);

  return (
    <span
      className="inline-flex items-center gap-2 border px-3 py-2"
      style={{
        borderColor: COLORS.beigeLine,
        borderRadius: 999,
        background: "white",
        color: COLORS.muted,
      }}
    >
      {props.src && ok ? (
        <img
          src={props.src}
          alt={props.label}
          className="h-4 w-auto"
          onError={() => setOk(false)}
          draggable={false}
        />
      ) : (
        <span className="text-[10px] tracking-[0.18em] uppercase">{props.label}</span>
      )}
    </span>
  );
}

function GiftFund(): React.JSX.Element {
  const STRIPE_URL = "https://buy.stripe.com/fZu4gy5d63Zl4vi4iq9AA00";

  return (
    <section id="fundo" className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeader title="Apoio" subtitle="Se quiseres contribuir, aqui vai a forma mais simples." />

        <div
          className="mx-auto mt-14 max-w-4xl border bg-white p-7 sm:p-8"
          style={{ borderColor: COLORS.line, borderRadius: RADIUS }}
        >
          <div className="text-[12px] tracking-[0.25em] uppercase" style={{ color: COLORS.muted }}>
            Dados para contribuição
          </div>

          {/* ✅ Mantém a mensagem principal só UMA vez (sem redundância) */}
          <div className="mt-4 text-[16px] leading-7" style={{ color: COLORS.ink }}>
            {PAYMENT.note}
          </div>

          <div className="mt-7 grid gap-4">
            <CopyPill label="Titular" value={PAYMENT.holders} />
            <CopyPill label="IBAN" value={PAYMENT.iban} />
            
               {/* ✅ MB WAY abaixo do IBAN, logo depois do número */}
          <CopyPill
  label="MB WAY"
  value={PAYMENT.mbway}
  iconAfterSrc="/nav/mb-way.png"
  iconAfterAlt="MB WAY"
  iconAfterHeight={36} // ✅ experimenta 22, 24, 26
/>


            {/* ✅ CTA moderno (layout planeado) */}
            <div
              className="relative border p-5 sm:p-6"
              style={{
                borderColor: COLORS.line,
                borderRadius: RADIUS,
                background: "rgba(243,238,228,0.22)",
              }}
            >
              {/* ✅ Logo no canto superior direito (fora do botão) */}
              <div className="absolute right-4 top-4">
                <div
                  className="inline-flex h-16 w-16 items-center justify-center border bg-white"
                  style={{
                    borderColor: "rgba(231,231,231,0.95)",
                    borderRadius: 999,
                    boxShadow: "0 10px 22px rgba(0,0,0,0.06)",
                  }}
                  aria-hidden="true"
                >
                  <img
                    src={LOGO_URL}
                    alt=""
                    className="h-16 w-16"
                    style={{ opacity: 0.95 }}
                    onError={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = "none")}
                    draggable={false}
                  />
                </div>
              </div>

              {/* ✅ Texto do bloco (curto, não redundante) */}
              <div className="pr-14 sm:pr-16">
                <div className={cn("text-[22px] sm:text-[24px]", QUOTE_CLASS)} style={{ color: COLORS.ink }}>
                  Um gesto de carinho
                </div>

                <div className="mt-2 text-[14px] leading-6" style={{ color: COLORS.muted }}>
            Uma forma simples e rápida de contribuir.
                </div>
              </div>

              {/* ✅ Botão mantém exatamente a tua cor */}
              <a
                href={STRIPE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-3 px-6 py-4 text-[12px] tracking-[0.25em] uppercase transition"
                style={{
                  background: COLORS.sageDark, // ✅ não mexer
                  color: "white",
                  borderRadius: RADIUS,
                  boxShadow: "0 10px 24px rgba(0,0,0,0.10)",
                  transform: "translateY(0)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
                }}
              >
                <span aria-hidden="true" style={{ opacity: 0.95 }}>
                  🔒
                </span>
                <span>Deixar contribuição</span>
                <span aria-hidden="true" style={{ opacity: 0.9 }}>
                  →
                </span>
              </a>

              {/* ✅ Linha de confiança (sem repetir a ideia do note) */}
              <div className="mt-3 text-center text-[12px]" style={{ color: COLORS.muted }}>
                Cartão / Apple Pay / Google Pay (consoante o dispositivo).
              </div>

              {/* ✅ Ícones menos redondos (quadradinhos) */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {PAYMENT_METHOD_ICONS.map((m) => (
                  <span
                    key={m.label}
                    className="inline-flex items-center justify-center border bg-white px-3 py-2"
                    style={{
                      borderColor: "rgba(231,231,231,0.95)",
                      borderRadius: 8, // ✅ menos redondo
                      boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
                    }}
                    title={m.label}
                    aria-label={m.label}
                  >
                    <img
                      src={m.src}
                      alt={m.label}
                      className="h-[18px] w-auto"
                      style={{ opacity: 0.92 }}
                      onError={(ev) => ((ev.currentTarget as HTMLImageElement).style.display = "none")}
                      draggable={false}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



function Footer(): React.JSX.Element {
  return (
    <footer>
      {/* MOBILE */}
      <div className="md:hidden relative" style={{ height: 560 }}>
        <img
          src={FOOTER_IMAGE_URL}
          alt=""
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col items-center justify-between px-4 py-14 text-center">
          <div className="mx-auto max-w-md">
            <div
              className="border border-white/15 bg-black/25 px-6 py-6 backdrop-blur"
              style={{ borderRadius: RADIUS }}
            >
              <p
                className={cn("text-[15px] italic leading-7", QUOTE_CLASS)}
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                “{BIBLE_VERSE}”
              </p>
            </div>
          </div>

          <div>
            <div className={cn("text-5xl", SCRIPT_CLASS)} style={{ color: "white" }}>
              Afonso e Jussara
            </div>
            <div className="mt-3 text-[12px] tracking-[0.55em]" style={{ color: "rgba(255,255,255,0.85)" }}>
              18 | 09 | 2026
            </div>
          </div>

          {/* Créditos (1 linha, sem fundo) */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <span
              className="text-[11px] tracking-[0.22em] uppercase"
              style={{ fontWeight: 700, color: "rgba(255,255,255,0.86)" }}
            >
              Desenvolvido por{" "}
              <span style={{ color: "rgba(255,255,255,0.98)" }}>Afonso da Silva</span>
            </span>

            <span aria-hidden="true" style={{ opacity: 0.45, color: "rgba(255,255,255,0.85)" }}>
              •
            </span>

            <span
              className="text-[9.5px] tracking-[0.20em] uppercase"
              style={{ fontWeight: 600, color: "rgba(255,255,255,0.62)" }}
            >
              Aprovado por Jussara Martins
            </span>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className={cn("text-[18px] italic leading-8", QUOTE_CLASS)} style={{ color: COLORS.sageDark }}>
              “{BIBLE_VERSE}”
            </p>

            <div className="mx-auto mt-10 overflow-hidden border" style={{ borderColor: COLORS.line, borderRadius: RADIUS }}>
              <img
                src={FOOTER_IMAGE_URL}
                alt=""
                className="w-full object-cover"
                style={{ height: 420 }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            <div className={cn("mt-12 text-6xl", SCRIPT_CLASS)} style={{ color: COLORS.ink }}>
              Afonso e Jussara
            </div>
            <div className="mt-3 text-[12px] tracking-[0.55em]" style={{ color: COLORS.muted }}>
              18 | 09 | 2026
            </div>

            {/* Créditos (1 linha, sem fundo) */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <span
                className="text-[11px] tracking-[0.22em] uppercase"
                style={{ fontWeight: 700, color: COLORS.muted }}
              >
                Desenvolvido por{" "}
                <span style={{ color: COLORS.ink }}>Afonso da Silva</span>
              </span>

              <span aria-hidden="true" style={{ opacity: 0.55, color: COLORS.muted }}>
                •
              </span>

              <span
                className="text-[9.5px] tracking-[0.20em] uppercase"
                style={{ fontWeight: 600, color: "rgba(100,116,139,0.75)" }}
              >
                Aprovado por Jussara Martins
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


export default function WeddingSite(): React.JSX.Element {
  const items = useMemo(
    () => [
      { id: "home", label: "HOME" },
      { id: "casal", label: "O CASAL" },
      { id: "cerimonia", label: "CERIMÓNIA" },
      { id: "rececao", label: "RECEPÇÃO" },
      { id: "presenca", label: "PRESENÇA" },
      { id: "recados", label: "RECADOS" },
      { id: "fundo", label: "APOIO" },
    ],
    []
  );

  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    runSelfTests();
  }, []);

  useEffect(() => {
    const els = items.map((x) => document.getElementById(x.id)).filter((x): x is HTMLElement => Boolean(x));
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0));
        const id = visible[0]?.target?.id;
        if (id) setActiveId(id);
      },
      { threshold: [0.25, 0.45, 0.6] }
    );

    els.forEach((el) => obs.observe(el));
    return () => {
      try {
        els.forEach((el) => obs.unobserve(el));
        obs.disconnect();
      } catch {
        // ignore
      }
    };
  }, [items]);

  function scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={cn("min-h-screen", SERIF_CLASS)} style={{ background: COLORS.paper, color: COLORS.ink }}>
      <GlobalFonts />
      <TopNav items={items} activeId={activeId} onNav={scrollTo} />

      <main>
        <Hero />
        <Welcome />
        <Countdown />
        <Couple />
        <Ceremony />
        <Reception />
        <Presence />
        <Guestbook />
        <GiftFund />
      </main>
      <MusicPlayer />
      <Footer />
    </div>
  );
}
