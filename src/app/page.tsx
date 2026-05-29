'use client';

import React, { useMemo, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

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

type TabId = 'product' | 'audience' | 'visual' | 'constraints';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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

const TABS: { id: TabId; label: string }[] = [
  { id: 'product', label: 'Product' },
  { id: 'audience', label: 'Audience' },
  { id: 'visual', label: 'Visual' },
  { id: 'constraints', label: 'Constraints' },
];

// ─────────────────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────────────────

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function IconSpark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'good' | 'warn' | 'bad';
}) {
  const map: Record<string, string> = {
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',
    brand: 'bg-amber-100 text-amber-700 border-amber-200',
    good: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warn: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    bad: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium', map[tone])}>
      {children}
    </span>
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
          : 'bg-gray-300';
  return <span className={cn('h-2 w-2 rounded-full', cls)} />;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
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
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-gray-700">{label}</label>
        {required && <span className="text-[10px] font-semibold text-amber-600">Required</span>}
      </div>
      {tip && <p className="text-[11px] text-gray-400">{tip}</p>}
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
        'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900',
        'placeholder:text-gray-400 outline-none',
        'focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50',
        'disabled:bg-gray-50 disabled:text-gray-400'
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
        'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900',
        'placeholder:text-gray-400 outline-none resize-none',
        'focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50',
        'disabled:bg-gray-50 disabled:text-gray-400'
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
          'w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-10 text-sm text-gray-900',
          'outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50',
          'disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer'
        )}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
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
              'rounded-full border px-3 py-1 text-xs transition',
              active
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:border-gray-300',
              disabled && 'opacity-50'
            )}
          >
            {mood}
          </button>
        );
      })}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Image Overlay
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
    <div className="relative group aspect-square overflow-hidden rounded-xl">
      <img src={imageData} alt="Feature breakdown" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none" />

      {featureList.map((feat, idx) => {
        const key = Object.keys(iconMap).find((k) => feat.toLowerCase().includes(k)) || 'default';
        const icon = iconMap[key];
        const pos = positions[idx % positions.length];

        return (
          <div key={idx} className="absolute" style={pos as React.CSSProperties}>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-md',
                'bg-white/90 border border-gray-200 text-gray-800 backdrop-blur-sm'
              )}
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <span className="w-4 h-4 text-amber-600">{icon}</span>
              <span className="truncate max-w-[120px]">{feat}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation Section
// ─────────────────────────────────────────────────────────────────────────────

function EvalSection({ title, text, color }: { title: string; text: string; color: string }) {
  const lines = text.split('\n').filter(Boolean);
  const scores: { label: string; score: number; reason: string }[] = [];
  lines.forEach((line) => {
    const m = line.match(/^(.+?):\s*(\d+)\/10\s*[—–-]\s*(.+)$/);
    if (m) scores.push({ label: m[1], score: parseInt(m[2]), reason: m[3] });
  });
  if (!scores.length) return <p className="text-gray-600 text-xs">{text}</p>;

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-emerald-500';
    if (score >= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-2">
      <div className={cn('text-[11px] font-bold uppercase tracking-wide text-gray-700')}>
        {title}
      </div>
      {scores.map(({ label, score, reason }) => (
        <div key={label} className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-600">{label}</span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full text-white', getScoreColor(score))}>
              {score}/10
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-700', getScoreColor(score))} style={{ width: `${score * 10}%` }} />
          </div>
          <p className="text-[11px] text-gray-400">{reason}</p>
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
    return <p className="text-gray-600 text-xs whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <EvalSection title="Hero / Premium" text={heroBlock} color="from-amber-600 to-amber-700" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <EvalSection title="Lifestyle" text={lifestyleBlock} color="from-cyan-600 to-blue-700" />
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <EvalSection title="Feature" text={featureBlock} color="from-purple-600 to-pink-700" />
        </div>
      </div>

      {overall && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">{overall}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App Component – Redesigned Layout
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  // State
  const [activeTab, setActiveTab] = useState<TabId>('product');

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

  // Check if all required fields in each tab are filled
  const tabReady = {
    product: Boolean(productVisualAnchor.trim()),
    audience: Boolean(targetAudience.trim() && pricePositioning.trim()),
    visual: Boolean(brandColors.trim() && brandTone.trim() && visualMood.length > 0),
    constraints: Boolean(platform.trim()),
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-gray-900 flex items-center justify-center">
                <IconSpark />
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-base md:text-lg font-semibold text-gray-900">Intent Farm</h1>
                <Pill tone={pipelineState.tone}>{pipelineState.label}</Pill>
                <Pill tone="neutral">{platform}</Pill>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
                <span className="text-[11px] text-gray-400">Progress</span>
                <ProgressBar value={progressPct} />
                <span className="text-[11px] text-gray-400 tabular-nums">{completedCount}/{stages.length}</span>
              </div>

              <button
                onClick={handleRun}
                disabled={!canRun}
                className={cn(
                  'rounded-xl px-5 py-2.5 text-sm font-semibold',
                  'bg-gradient-to-r from-amber-400 to-yellow-500 text-gray-900',
                  'hover:from-amber-300 hover:to-yellow-400 transition shadow-sm',
                  (!canRun) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isRunning ? 'Running…' : 'Run Pipeline'}
              </button>

              {isRunning && (
                <button
                  onClick={stop}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          {/* Mobile progress bar */}
          <div className="sm:hidden mt-3 flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Progress</span>
            <ProgressBar value={progressPct} />
            <span className="text-[11px] text-gray-400">{completedCount}/{stages.length}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="relative mx-auto max-w-[1600px] px-4 md:px-6 py-6">

        {/* Brand Brief - Tabbed Horizontal Strip */}
        <Card className="mb-6">
          {/* Tab Headers */}
          <div className="border-b border-gray-100">
            <div className="flex items-center gap-1 px-4 pt-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors',
                    activeTab === tab.id
                      ? 'text-amber-700 bg-amber-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <span className="flex items-center gap-2">
                    {tab.label}
                    {tabReady[tab.id] && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Product Tab */}
            {activeTab === 'product' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel label="Product Name" />
                    <TextInput value={productName} onChange={setProductName} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Category" tip="Helps target competitors" />
                    <SelectInput value={productCategory} onChange={setProductCategory} options={PRODUCT_CATEGORIES} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Key Features" tip="Fabric, fit, material" />
                    <TextInput value={keyFeatures} onChange={setKeyFeatures} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Core USP" tip="What makes it different?" />
                    <TextInput value={coreUSP} onChange={setCoreUSP} disabled={isRunning} />
                  </div>
                </div>

                {/* Product Visual Description - highlighted */}
                <div className={cn(
                  'rounded-xl border-2 p-4 space-y-3',
                  productVisualAnchor.trim() ? 'border-amber-300 bg-amber-50/30' : 'border-yellow-300 bg-yellow-50/30'
                )}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-gray-700">Product Visual Description</label>
                        <span className="text-[10px] font-semibold text-amber-600">Required</span>
                      </div>
                      <p className="text-[11px] text-gray-400">Locked into every prompt — biggest driver of consistency.</p>
                    </div>
                    <Pill tone={productVisualAnchor.trim() ? 'good' : 'warn'}>
                      {productVisualAnchor.trim() ? 'Ready' : 'Missing'}
                    </Pill>
                  </div>
                  <TextareaInput value={productVisualAnchor} onChange={setProductVisualAnchor} disabled={isRunning} rows={2} />
                  <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <p className="text-[11px] font-semibold text-amber-700">Tip</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Be literal: color, print, fit, collar, sleeves, texture. The scene can change — the product shouldn't.</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Example: <span className="italic text-gray-600">"Black oversized crew-neck tee with large distressed yellow chest graphic, dropped shoulders, ribbed collar"</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Audience Tab */}
            {activeTab === 'audience' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel label="Target Audience" />
                  <TextInput value={targetAudience} onChange={setTargetAudience} disabled={isRunning} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Price Positioning" tip="Biggest style driver" />
                  <SelectInput value={pricePositioning} onChange={setPricePositioning} options={PRICE_POSITIONS} disabled={isRunning} />
                </div>
              </div>
            )}

            {/* Visual Tab */}
            {activeTab === 'visual' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel label="Brand Colors" />
                    <TextInput value={brandColors} onChange={setBrandColors} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Brand Tone" />
                    <TextInput value={brandTone} onChange={setBrandTone} disabled={isRunning} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Visual Mood" tip="Select all that apply" />
                  <MoodPicker selected={visualMood} onChange={setVisualMood} disabled={isRunning} />
                </div>
              </div>
            )}

            {/* Constraints Tab */}
            {activeTab === 'constraints' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel label="Known Competitors" tip="Real brand names = better research" />
                    <TextInput value={competitorBrands} onChange={setCompetitorBrands} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="What to AVOID" tip="Colors, styles to never use" />
                    <TextInput value={avoidElements} onChange={setAvoidElements} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Platform" tip="Changes crop + composition rules" />
                    <SelectInput value={platform} onChange={setPlatform} options={PLATFORMS} disabled={isRunning} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Three-Column Results Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Column 1: Pipeline Timeline */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Pipeline Timeline</p>
                  <p className="text-xs text-gray-400 mt-0.5">Click completed stages to expand output.</p>
                </div>
                <Pill tone="neutral">{completedCount}/{stages.length} done</Pill>
              </div>

              <div className="mt-4 space-y-2">
                {stages.map((stage) => {
                  const expanded = expandedStage === stage.id && stage.status === 'done';
                  const isEval = stage.id === 7;

                  return (
                    <div
                      key={stage.id}
                      className={cn(
                        'rounded-xl border p-3 transition cursor-pointer',
                        stage.status === 'running' && 'border-amber-300 bg-amber-50',
                        stage.status === 'done' && 'border-gray-200 bg-gray-50 hover:bg-gray-100',
                        stage.status === 'idle' && 'border-gray-100 bg-white',
                        stage.status === 'error' && 'border-red-200 bg-red-50'
                      )}
                      onClick={() => {
                        if (stage.status !== 'done') return;
                        setExpandedStage(expanded ? null : stage.id);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 w-[56px]">
                          <StageStatusDot status={stage.status} />
                          <span className="text-xs text-gray-400 tabular-nums font-mono">{String(stage.id).padStart(2, '0')}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', stage.status === 'idle' ? 'text-gray-400' : 'text-gray-700')}>
                            {stage.title}
                          </p>
                          {stage.status === 'running' && <p className="text-xs text-amber-600 mt-0.5">Processing…</p>}
                          {stage.status === 'error' && <p className="text-xs text-red-600 mt-0.5">Failed</p>}
                          {stage.status === 'done' && <p className="text-xs text-gray-400 mt-0.5">Click to view output</p>}
                        </div>

                        {stage.status === 'done' && (
                          <span className="text-gray-400 text-xs">{expanded ? 'Hide' : 'View'}</span>
                        )}
                      </div>

                      {expanded && stage.output && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          {isEval ? (
                            <EvaluationCard text={stage.output} />
                          ) : (
                            <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{stage.output}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Inline Evaluation Scorecard */}
            {stage7 && (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Evaluation Scorecard</p>
                    <p className="text-xs text-gray-400 mt-0.5">Final QA view of all 3 images.</p>
                  </div>
                  <Pill tone="good">Done</Pill>
                </div>
                <div className="mt-4">
                  <EvaluationCard text={stage7} />
                </div>
              </Card>
            )}
          </div>

          {/* Column 2: Generated Images */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Generated Output</p>
                  <p className="text-xs text-gray-400 mt-0.5">Hero · Lifestyle · Feature</p>
                </div>
                <Pill tone={images.length ? 'good' : 'neutral'}>{images.length ? '3 Images' : 'Empty'}</Pill>
              </div>

              <div className="mt-4">
                {images.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
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
                    <p className="text-sm text-gray-500 mt-3">No images yet</p>
                    <p className="text-xs text-gray-400 mt-1">Run the pipeline to generate your 3 strategic images.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {images.map((img) => (
                      <div key={img.key} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500" />
                            <p className="text-sm font-semibold text-gray-800 truncate">{img.label}</p>
                          </div>
                          <Pill tone="neutral">{img.key}</Pill>
                        </div>

                        <div className="p-3">
                          {img.key === 'feature' ? (
                            <FeatureImageOverlay imageData={img.imageData} features={keyFeatures} />
                          ) : (
                            <img src={img.imageData} alt={img.label} className="w-full aspect-square object-cover rounded-lg" />
                          )}

                          <details className="mt-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                            <summary className="cursor-pointer text-xs text-gray-600 font-semibold">
                              View prompt
                            </summary>
                            <p className="mt-2 text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">
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

            {/* Quick QA Checklist */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">Quick QA Checklist</p>
              <ul className="mt-3 space-y-2 text-xs text-gray-500">
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span> Product looks identical across all 3 images
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span> Hero: premium studio (dark, centered)
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span> Lifestyle: real audience vibe (candid)
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500">•</span> Feature: macro detail with clean negative space
                </li>
              </ul>
            </Card>
          </div>

          {/* Column 3: Additional Stats / Context */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                  <IconSpark />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Intent Farm</p>
                  <p className="text-xs text-gray-400">Brand Visual Pipeline</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Product</span>
                  <span className="text-xs font-medium text-gray-700">{productName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Category</span>
                  <span className="text-xs font-medium text-gray-700">{productCategory}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Price Point</span>
                  <span className="text-xs font-medium text-gray-700">{pricePositioning}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-xs text-gray-500">Platform</span>
                  <span className="text-xs font-medium text-gray-700">{platform}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-gray-500">Visual Moods</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {visualMood.slice(0, 3).map((mood) => (
                      <span key={mood} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{mood}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {errorMessage && (
              <Card className="p-4 border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
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
                    <p className="text-sm font-semibold text-red-700">Pipeline error</p>
                    <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Instructions */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900">How it works</p>
              <ol className="mt-3 space-y-2 text-xs text-gray-500">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">1</span>
                  Fill in the brand brief (Product tab is required)
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">2</span>
                  Click "Run Pipeline" to start generation
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">3</span>
                  Review outputs in the results columns
                </li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}