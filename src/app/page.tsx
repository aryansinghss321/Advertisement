'use client';

import React, { useMemo, useRef, useState } from 'react';

type StageStatus = 'idle' | 'running' | 'done' | 'error';

interface Stage {
  id: number;
  title: string;
  status: StageStatus;
  output: string | null;
}

interface ImageResult {
  key: string;
  label: string;
  prompt: string;
  imageData: string;
}

const INITIAL_STAGES: Stage[] = [
  { id: 1, title: 'Competitor Research', status: 'idle', output: null },
  { id: 2, title: 'Pattern Extraction', status: 'idle', output: null },
  { id: 3, title: 'Visual Strategy Creation', status: 'idle', output: null },
  { id: 4, title: 'Concept Generation', status: 'idle', output: null },
  { id: 5, title: 'Prompt Engineering', status: 'idle', output: null },
  { id: 6, title: 'Image Generation (3)', status: 'idle', output: null },
  { id: 7, title: 'Evaluation Scorecard', status: 'idle', output: null },
];

const PRODUCT_CATEGORIES = [
  'Apparel & Clothing',
  'Footwear',
  'Skincare & Beauty',
  'Hair Care',
  'Electronics & Gadgets',
  'Home & Living',
  'Food & Beverage',
  'Fitness & Sports',
  'Bags & Accessories',
  'Jewellery & Watches',
  'Other',
];

const PRICE_POSITIONS = [
  'Budget (₹0–500)',
  'Mid-range (₹500–2000)',
  'Premium (₹2000–6000)',
  'Luxury (₹6000+)',
];

const PLATFORMS = [
  'Website Hero Section',
  'Amazon Listing',
  'Instagram Ad',
  'Meta / Facebook Ad',
  'Google Display Ad',
  'Product Detail Page',
];

const MOOD_OPTIONS = [
  'Minimalist',
  'Bold & Loud',
  'Dark & Moody',
  'Raw / Editorial',
  'Clean & Bright',
  'Warm & Natural',
  'Futuristic / Tech',
  'Playful & Fun',
  'Luxury & Refined',
];

// ─────────────────────────────────────────────────────────────────────────────
// Small UI primitives (redesigned)
// ─────────────────────────────────────────────────────────────────────────────

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'good' | 'warn' | 'bad';
}) {
  const map: Record<string, string> = {
    neutral: 'bg-white/5 text-gray-300 border-white/10',
    brand: 'bg-amber-500/15 text-amber-200 border-amber-500/25',
    good: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25',
    warn: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/25',
    bad: 'bg-red-500/15 text-red-200 border-red-500/25',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs', map[tone])}>
      {children}
    </span>
  );
}

function IconSpark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.2 5.1L18 8.5l-4.4 2.1L12 16l-1.6-5.4L6 8.5l4.8-1.4L12 2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M20 14l.7 2.7L23 17.4l-2.3 1.1L20 21l-.7-2.5L17 17.4l2.3-.7L20 14z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StageStatusDot({ status }: { status: StageStatus }) {
  const cls =
    status === 'running'
      ? 'bg-amber-400 animate-pulse'
      : status === 'done'
        ? 'bg-emerald-400'
        : status === 'error'
          ? 'bg-red-400'
          : 'bg-gray-600';
  return <span className={cn('h-2.5 w-2.5 rounded-full', cls)} />;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function FieldLabel({
  label,
  tip,
  required,
}: {
  label: string;
  tip?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
          {label}
        </label>
        {required && <span className="text-[11px] font-semibold text-amber-300">Required</span>}
      </div>
      {tip && <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white',
        'placeholder:text-gray-600 outline-none',
        'focus:ring-2 focus:ring-amber-400/35 focus:border-amber-400/30',
        'disabled:opacity-40'
      )}
    />
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={cn(
        'w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white',
        'placeholder:text-gray-600 outline-none resize-none',
        'focus:ring-2 focus:ring-amber-400/35 focus:border-amber-400/30',
        'disabled:opacity-40 leading-relaxed'
      )}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 pr-10 text-sm text-white',
          'outline-none focus:ring-2 focus:ring-amber-400/35 focus:border-amber-400/30',
          'disabled:opacity-40 cursor-pointer'
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function MoodPicker({
  selected,
  onChange,
  disabled,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (mood: string) => {
    if (disabled) return;
    onChange(selected.includes(mood) ? selected.filter((m) => m !== mood) : [...selected, mood]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_OPTIONS.map((mood) => {
        const active = selected.includes(mood);
        return (
          <button
            key={mood}
            type="button"
            onClick={() => toggle(mood)}
            disabled={disabled}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition',
              active
                ? 'border-amber-400/35 bg-amber-400/15 text-amber-100'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10',
              disabled && 'opacity-40'
            )}
          >
            {mood}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-amber-400/25 to-yellow-500/10 border border-amber-400/20 flex items-center justify-center text-amber-200">
          <IconSpark />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-gray-500">Fill the brief → run pipeline → review outputs</p>
        </div>
      </div>
      {right}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur',
        'shadow-[0_20px_80px_rgba(0,0,0,0.35)]',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Image Callouts (kept, just slightly improved visuals)
// ─────────────────────────────────────────────────────────────────────────────

const CottonWeightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const BreathableIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M4 12h16M4 12a4 4 0 014-4M20 12a4 4 0 01-4-4M4 12a4 4 0 004 4M20 12a4 4 0 00-4 4" />
  </svg>
);

const OversizedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M3 3h18v18H3V3zM8 3v18M16 3v18" />
  </svg>
);

const DroppedShoulderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M4 6l16 12M4 18L20 6" />
  </svg>
);

const RibbedCollarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M12 3v6M8 7l4-4 4 4" />
    <path d="M8 17v4h8v-4" />
  </svg>
);

const CottonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const iconMap: Record<string, React.ReactNode> = {
  '240 gsm': <CottonWeightIcon />,
  breathable: <BreathableIcon />,
  oversized: <OversizedIcon />,
  'dropped shoulders': <DroppedShoulderIcon />,
  'ribbed collar': <RibbedCollarIcon />,
  cotton: <CottonIcon />,
  default: <StarIcon />,
};

function FeatureImageOverlay({ imageData, features }: { imageData: string; features: string }) {
  const featureList = features.split(',').map((f) => f.trim()).filter(Boolean);

  const positions = [
    { top: '14%', left: '18%' },
    { top: '14%', right: '18%' },
    { bottom: '14%', left: '18%' },
    { bottom: '14%', right: '18%' },
    { top: '52%', left: '10%' },
    { top: '52%', right: '10%' },
  ];

  return (
    <div className="relative group aspect-square overflow-hidden rounded-2xl">
      <img src={imageData} alt="Feature breakdown" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

      {featureList.map((feat, idx) => {
        const key = Object.keys(iconMap).find((k) => feat.toLowerCase().includes(k)) || 'default';
        const icon = iconMap[key];
        const pos = positions[idx % positions.length];

        return (
          <div key={idx} className="absolute" style={pos as React.CSSProperties}>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg',
                'bg-black/70 border border-white/20 text-white backdrop-blur'
              )}
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <span className="w-4 h-4 text-yellow-300">{icon}</span>
              <span className="truncate max-w-[120px]">{feat}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation (kept functionally same)
// ─────────────────────────────────────────────────────────────────────────────

function EvalSection({ title, text, color }: { title: string; text: string; color: string }) {
  const lines = text.split('\n').filter(Boolean);
  const scores: { label: string; score: number; reason: string }[] = [];
  lines.forEach((line) => {
    const m = line.match(/^(.+?):\s*(\d+)\/10\s*[—–-]\s*(.+)$/);
    if (m) scores.push({ label: m[1], score: parseInt(m[2]), reason: m[3] });
  });
  if (!scores.length) return <p className="text-gray-300 text-xs">{text}</p>;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-emerald-400 to-emerald-500';
    if (score >= 6) return 'from-amber-400 to-amber-500';
    return 'from-red-400 to-red-500';
  };

  return (
    <div className="space-y-3">
      <div className={cn('text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r bg-clip-text text-transparent', color)}>
        {title}
      </div>

      {scores.map(({ label, score, reason }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-300">{label}</span>
            <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r text-gray-900', getScoreColor(score))}>
              {score}/10
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
            <div className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', getScoreColor(score))} style={{ width: `${score * 10}%` }} />
          </div>
          <p className="text-xs text-gray-500">{reason}</p>
        </div>
      ))}
    </div>
  );
}

function EvaluationCard({ text }: { text: string }) {
  const heroBlock = text.match(/HERO IMAGE:([\s\S]+?)(?=LIFESTYLE IMAGE:|FEATURE IMAGE:|OVERALL:|$)/i)?.[1] ?? '';
  const lifestyleBlock = text.match(/LIFESTYLE IMAGE:([\s\S]+?)(?=FEATURE IMAGE:|OVERALL:|$)/i)?.[1] ?? '';
  const featureBlock = text.match(/FEATURE IMAGE:([\s\S]+?)(?=OVERALL:|$)/i)?.[1] ?? '';
  const overall = text.match(/OVERALL:\s*(.+)/i)?.[1] ?? '';

  if (!heroBlock && !lifestyleBlock && !featureBlock) {
    return <p className="text-gray-300 text-xs whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <EvalSection title="Hero / Premium" text={heroBlock} color="from-amber-300 to-yellow-300" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <EvalSection title="Lifestyle" text={lifestyleBlock} color="from-cyan-300 to-blue-300" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <EvalSection title="Feature" text={featureBlock} color="from-purple-300 to-pink-300" />
        </div>
      </div>

      {overall && (
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-gray-400 italic leading-relaxed">{overall}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page (complete UI redesign; logic preserved)
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  // Product Identity
  const [productName, setProductName] = useState('Oversized Graphic T-Shirt');
  const [productCategory, setProductCategory] = useState('Apparel & Clothing');
  const [keyFeatures, setKeyFeatures] = useState('240 GSM cotton, Oversized fit, Breathable fabric');
  const [coreUSP, setCoreUSP] = useState('Only breathable oversized tee under ₹599');
  const [productVisualAnchor, setProductVisualAnchor] = useState(
    'Black oversized crew-neck tee with a large distressed yellow graphic print on the front chest, dropped shoulders, ribbed collar'
  );

  // Audience & Positioning
  const [targetAudience, setTargetAudience] = useState('Gen Z College Students (18–30)');
  const [pricePositioning, setPricePositioning] = useState('Budget (₹0–500)');

  // Visual Direction
  const [brandColors, setBrandColors] = useState('Black, White, Yellow');
  const [brandTone, setBrandTone] = useState('Humorous and Casual');
  const [visualMood, setVisualMood] = useState<string[]>(['Bold & Loud', 'Playful & Fun']);
  const [competitorBrands, setCompetitorBrands] = useState('Bewakoof, The Souled Store, Snitch');
  const [avoidElements, setAvoidElements] = useState('White backgrounds, formal styling, luxury aesthetics');
  const [platform, setPlatform] = useState('Website Hero Section');

  // Pipeline state
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [isRunning, setIsRunning] = useState(false);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setStages(INITIAL_STAGES.map((s) => ({ ...s, status: 'idle', output: null })));
    setImages([]);
    setErrorMessage(null);
    setExpandedStage(null);
  };

  const updateStage = (id: number, patch: Partial<Stage>) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const handleRun = async () => {
    reset();
    setIsRunning(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          productCategory,
          brandTone,
          targetAudience,
          brandColors,
          keyFeatures,
          coreUSP,
          pricePositioning,
          visualMood,
          competitorBrands,
          avoidElements,
          platform,
          productVisualAnchor,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Pipeline request failed.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.stage === 'complete') {
              setImages(msg.images ?? []);
            } else if (msg.stage === 'error') {
              setErrorMessage(msg.message);
            } else if (typeof msg.stage === 'number') {
              updateStage(msg.stage, { title: msg.title, status: msg.status, output: msg.output ?? null });
              if (msg.status === 'running') setExpandedStage(msg.stage);
            }
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setErrorMessage(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setIsRunning(false);
  };

  const completedCount = stages.filter((s) => s.status === 'done').length;
  const progressPct = (completedCount / stages.length) * 100;

  const stage7 = stages.find((s) => s.id === 7 && s.status === 'done')?.output || null;

  const canRun = Boolean(productVisualAnchor.trim()) && !isRunning;

  const pipelineState = useMemo(() => {
    if (isRunning) return { label: 'Running', tone: 'brand' as const };
    if (errorMessage) return { label: 'Error', tone: 'bad' as const };
    if (images.length) return { label: 'Complete', tone: 'good' as const };
    return { label: 'Idle', tone: 'neutral' as const };
  }, [isRunning, errorMessage, images.length]);

  return (
    <main className="min-h-screen bg-[#07080b] text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.12]" style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="absolute -top-40 left-1/3 h-[520px] w-[520px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-48 right-1/4 h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-gray-950 flex items-center justify-center shadow-[0_20px_60px_rgba(245,158,11,0.25)]">
                <IconSpark />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg md:text-xl font-semibold tracking-tight">Intent Farm</h1>
                  <Pill tone={pipelineState.tone}>{pipelineState.label}</Pill>
                  <Pill tone="neutral">{platform}</Pill>
                </div>
                <p className="text-xs text-gray-500">
                  7-stage creative pipeline · 3 strategic images · consistent product identity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block w-56">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-500">Progress</span>
                  <span className="text-[11px] text-gray-500">
                    {completedCount}/{stages.length}
                  </span>
                </div>
                <ProgressBar value={progressPct} />
              </div>

              <button
                onClick={handleRun}
                disabled={!canRun}
                className={cn(
                  'rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide',
                  'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-950',
                  'shadow-[0_18px_60px_rgba(245,158,11,0.18)]',
                  'hover:from-amber-300 hover:to-yellow-400 transition',
                  (!canRun) && 'opacity-40 cursor-not-allowed'
                )}
              >
                {isRunning ? 'Running…' : 'Run Pipeline'}
              </button>

              {isRunning && (
                <button
                  onClick={stop}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-sm font-semibold',
                    'border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 transition'
                  )}
                >
                  Stop
                </button>
              )}
            </div>

            <div className="md:hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">Progress</span>
                <span className="text-[11px] text-gray-500">
                  {completedCount}/{stages.length}
                </span>
              </div>
              <ProgressBar value={progressPct} />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Brief */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5">
              <SectionHeader
                title="Brand Brief"
                right={
                  <Pill tone={productVisualAnchor.trim() ? 'good' : 'warn'}>
                    Anchor {productVisualAnchor.trim() ? 'Ready' : 'Missing'}
                  </Pill>
                }
              />

              <div className="mt-5 space-y-5">
                {/* Product */}
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500">Product</p>

                  <div className="space-y-1.5">
                    <FieldLabel label="Product Name" />
                    <TextInput value={productName} onChange={setProductName} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="Category" tip="Helps target the right competitors" />
                    <SelectInput value={productCategory} onChange={setProductCategory} options={PRODUCT_CATEGORIES} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="Key Features" tip="Fabric, fit, material, tech specs" />
                    <TextInput value={keyFeatures} onChange={setKeyFeatures} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="Core USP" tip="What makes this product different?" />
                    <TextInput value={coreUSP} onChange={setCoreUSP} disabled={isRunning} />
                  </div>

                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3 space-y-2">
                    <FieldLabel
                      label="Product Visual Description"
                      required
                      tip="This is locked into every prompt — it’s the biggest driver of consistency across all 3 images."
                    />
                    <TextareaInput value={productVisualAnchor} onChange={setProductVisualAnchor} disabled={isRunning} rows={4} />
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-[11px] uppercase tracking-wider text-amber-200 font-semibold">Tip</p>
                      <p className="text-xs text-gray-400 leading-relaxed mt-1">
                        Be literal: color, print, fit, collar, sleeves, texture. The scene can change — the product shouldn’t.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Example: <span className="italic text-gray-300">“Black oversized crew-neck tee with large distressed yellow chest graphic, dropped shoulders, ribbed collar”</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audience */}
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500">Audience & Positioning</p>

                  <div className="space-y-1.5">
                    <FieldLabel label="Target Audience" />
                    <TextInput value={targetAudience} onChange={setTargetAudience} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="Price Positioning" tip="Biggest driver of visual style" />
                    <SelectInput value={pricePositioning} onChange={setPricePositioning} options={PRICE_POSITIONS} disabled={isRunning} />
                  </div>
                </div>

                {/* Visual */}
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500">Visual Direction</p>

                  <div className="space-y-1.5">
                    <FieldLabel label="Brand Colors" />
                    <TextInput value={brandColors} onChange={setBrandColors} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="Brand Tone" />
                    <TextInput value={brandTone} onChange={setBrandTone} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="Visual Mood" tip="Select all that apply" />
                    <MoodPicker selected={visualMood} onChange={setVisualMood} disabled={isRunning} />
                  </div>
                </div>

                {/* Constraints */}
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500">Constraints</p>

                  <div className="space-y-1.5">
                    <FieldLabel label="Known Competitors" tip="Real brand names = better research" />
                    <TextInput value={competitorBrands} onChange={setCompetitorBrands} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="What to AVOID" tip="Colors, styles, compositions to never use" />
                    <TextInput value={avoidElements} onChange={setAvoidElements} disabled={isRunning} />
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel label="Platform" tip="Changes crop + composition rules" />
                    <SelectInput value={platform} onChange={setPlatform} options={PLATFORMS} disabled={isRunning} />
                  </div>
                </div>

                {!productVisualAnchor.trim() && (
                  <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3">
                    <p className="text-xs text-amber-200 font-semibold">Fill the Product Visual Description to enable the pipeline.</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Everything else can be imperfect — this field should be precise.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {errorMessage && (
              <Card className="p-4 border-red-500/25">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-2xl bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-200">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <path
                        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-200">Pipeline error</p>
                    <p className="text-xs text-gray-400 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Middle: Pipeline timeline */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Pipeline Timeline</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Click completed stages to expand output (evaluation has a structured view).
                  </p>
                </div>
                <Pill tone="neutral">{completedCount}/{stages.length} done</Pill>
              </div>

              <div className="mt-5 space-y-2">
                {stages.map((stage) => {
                  const expanded = expandedStage === stage.id && stage.status === 'done';
                  const isEval = stage.id === 7;

                  return (
                    <div
                      key={stage.id}
                      className={cn(
                        'rounded-2xl border p-3 transition',
                        stage.status === 'running' && 'border-amber-500/25 bg-amber-400/5',
                        stage.status === 'done' && 'border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer',
                        stage.status === 'idle' && 'border-white/10 bg-white/[0.03]',
                        stage.status === 'error' && 'border-red-500/25 bg-red-500/5'
                      )}
                      onClick={() => {
                        if (stage.status !== 'done') return;
                        setExpandedStage(expanded ? null : stage.id);
                      }}
                      role={stage.status === 'done' ? 'button' : undefined}
                      tabIndex={stage.status === 'done' ? 0 : -1}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-[64px]">
                          <StageStatusDot status={stage.status} />
                          <span className="text-xs text-gray-500 tabular-nums">{String(stage.id).padStart(2, '0')}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', stage.status === 'idle' ? 'text-gray-500' : 'text-gray-100')}>
                            {stage.title}
                          </p>
                          {stage.status === 'running' && <p className="text-xs text-amber-200 mt-0.5">Processing…</p>}
                          {stage.status === 'error' && <p className="text-xs text-red-200 mt-0.5">Failed</p>}
                          {stage.status === 'done' && <p className="text-xs text-gray-500 mt-0.5">Click to view output</p>}
                        </div>

                        {stage.status === 'done' && (
                          <span className="text-gray-500 text-xs">{expanded ? 'Hide' : 'View'}</span>
                        )}
                      </div>

                      {expanded && stage.output && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          {isEval ? (
                            <EvaluationCard text={stage.output} />
                          ) : (
                            <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{stage.output}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {stage7 && (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Evaluation Scorecard</p>
                    <p className="text-xs text-gray-500 mt-0.5">The final QA view of all 3 images.</p>
                  </div>
                  <Pill tone="good">Done</Pill>
                </div>
                <div className="mt-4">
                  <EvaluationCard text={stage7} />
                </div>
              </Card>
            )}
          </div>

          {/* Right: Outputs */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Generated Output</p>
                  <p className="text-xs text-gray-500 mt-0.5">Hero · Lifestyle · Feature (same product, different scenes)</p>
                </div>
                <Pill tone={images.length ? 'good' : 'neutral'}>{images.length ? '3 Images' : 'Empty'}</Pill>
              </div>

              <div className="mt-5">
                {images.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-300 mt-3">No images yet</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Run the pipeline to generate your 3 strategic images.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {images.map((img) => (
                      <div key={img.key} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500" />
                            <p className="text-sm font-semibold truncate">{img.label}</p>
                          </div>
                          <Pill tone="neutral">{img.key}</Pill>
                        </div>

                        <div className="p-3">
                          {img.key === 'feature' ? (
                            <FeatureImageOverlay imageData={img.imageData} features={keyFeatures} />
                          ) : (
                            <img src={img.imageData} alt={img.label} className="w-full aspect-square object-cover rounded-2xl" />
                          )}

                          <details className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                            <summary className="cursor-pointer text-xs text-gray-300 font-semibold">
                              View prompt
                            </summary>
                            <p className="mt-2 text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                              {img.prompt}
                            </p>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold">Quick QA checklist</p>
              <ul className="mt-3 space-y-2 text-xs text-gray-400">
                <li className="flex gap-2">
                  <span className="text-amber-200">•</span> Product looks identical across all 3 images (color/print/fit)
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-200">•</span> Hero: premium studio (dark, centered, dramatic)
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-200">•</span> Lifestyle: real audience vibe (candid, urban/campus)
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-200">•</span> Feature: macro detail + clean negative space for callouts
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}