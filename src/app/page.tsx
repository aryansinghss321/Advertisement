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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────────────────

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

type PillTone = 'neutral' | 'brand' | 'good' | 'warn' | 'bad' | 'info';

function Pill({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: PillTone }) {
  const map: Record<PillTone, string> = {
    neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    brand:   'bg-amber-900/40 text-amber-300 border-amber-700',
    good:    'bg-green-900/40 text-green-300 border-green-700',
    warn:    'bg-yellow-900/40 text-yellow-300 border-yellow-700',
    bad:     'bg-red-900/40 text-red-300 border-red-700',
    info:    'bg-blue-900/40 text-blue-300 border-blue-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', map[tone])}>
      {children}
    </span>
  );
}

function StatusDot({ status }: { status: StageStatus }) {
  return (
    <span
      className={cn(
        'h-2 w-2 rounded-full flex-shrink-0',
        status === 'running' && 'bg-amber-400 animate-pulse',
        status === 'done'    && 'bg-green-500',
        status === 'error'   && 'bg-red-500',
        status === 'idle'    && 'bg-zinc-600',
      )}
    />
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700 border border-zinc-700">
      <div
        className="h-full rounded-full bg-amber-400 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function FieldLabel({ label, tip, required }: { label: string; tip?: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">{label}</label>
      {required && <span className="text-[10px] font-semibold text-amber-400 bg-amber-900/30 border border-amber-700 px-1.5 py-0.5 rounded-full">Required</span>}
      {tip && <span className="text-[11px] text-zinc-500">· {tip}</span>}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
        'placeholder:text-zinc-600 outline-none',
        'focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400',
        'disabled:opacity-40 transition',
      )}
    />
  );
}

function TextareaInput({
  value, onChange, placeholder, disabled, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={cn(
        'w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100',
        'placeholder:text-zinc-600 outline-none resize-none leading-relaxed',
        'focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400',
        'disabled:opacity-40 transition',
      )}
    />
  );
}

function SelectInput({
  value, onChange, options, disabled,
}: {
  value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full appearance-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 pr-9 text-sm text-zinc-100',
          'outline-none focus:ring-2 focus:ring-amber-300/50 focus:border-amber-400',
          'disabled:opacity-40 cursor-pointer transition',
        )}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-zinc-500">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function MoodPicker({ selected, onChange, disabled }: { selected: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const toggle = (mood: string) => {
    if (disabled) return;
    onChange(selected.includes(mood) ? selected.filter((m) => m !== mood) : [...selected, mood]);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {MOOD_OPTIONS.map((mood) => {
        const active = selected.includes(mood);
        return (
          <button
            key={mood}
            type="button"
            onClick={() => toggle(mood)}
            disabled={disabled}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition',
              active
                ? 'border-amber-600 bg-amber-900/40 text-amber-300'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700',
              disabled && 'opacity-40',
            )}
          >
            {mood}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Evaluation Components
// ─────────────────────────────────────────────────────────────────────────────

function EvalSection({ title, text, accent }: { title: string; text: string; accent: string }) {
  const lines = text.split('\n').filter(Boolean);
  const scores: { label: string; score: number; reason: string }[] = [];
  lines.forEach((line) => {
    const m = line.match(/^(.+?):\s*(\d+)\/10\s*[—–-]\s*(.+)$/);
    if (m) scores.push({ label: m[1], score: parseInt(m[2]), reason: m[3] });
  });
  if (!scores.length) return <p className="text-zinc-300 text-xs">{text}</p>;

  const getColor = (s: number) =>
    s >= 8 ? { bar: 'bg-green-500', pill: 'bg-green-100 text-green-800' }
    : s >= 6 ? { bar: 'bg-amber-400', pill: 'bg-amber-100 text-amber-800' }
    : { bar: 'bg-red-400', pill: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-3">
      <div className={cn('text-[11px] font-bold uppercase tracking-wider', accent)}>{title}</div>
      {scores.map(({ label, score, reason }) => {
        const c = getColor(score);
        return (
          <div key={label} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-300">{label}</span>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', c.pill)}>{score}/10</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-700 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-700', c.bar)} style={{ width: `${score * 10}%` }} />
            </div>
            <p className="text-[11px] text-zinc-500">{reason}</p>
          </div>
        );
      })}
    </div>
  );
}

function EvaluationCard({ text }: { text: string }) {
  const heroBlock   = text.match(/HERO IMAGE:([\s\S]+?)(?=LIFESTYLE IMAGE:|FEATURE IMAGE:|OVERALL:|$)/i)?.[1] ?? '';
  const lifeBlock   = text.match(/LIFESTYLE IMAGE:([\s\S]+?)(?=FEATURE IMAGE:|OVERALL:|$)/i)?.[1] ?? '';
  const featBlock   = text.match(/FEATURE IMAGE:([\s\S]+?)(?=OVERALL:|$)/i)?.[1] ?? '';
  const overall     = text.match(/OVERALL:\s*(.+)/i)?.[1] ?? '';

  if (!heroBlock && !lifeBlock && !featBlock) {
    return <p className="text-zinc-300 text-xs whitespace-pre-wrap">{text}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-3">
          <EvalSection title="Hero / Premium" text={heroBlock} accent="text-amber-700" />
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-3">
          <EvalSection title="Lifestyle" text={lifeBlock} accent="text-blue-600" />
        </div>
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-3">
          <EvalSection title="Feature" text={featBlock} accent="text-purple-600" />
        </div>
      </div>
      {overall && (
        <p className="text-xs text-zinc-500 italic leading-relaxed border-t border-zinc-700 pt-3">{overall}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Image Overlay
// ─────────────────────────────────────────────────────────────────────────────

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
    <div className="relative aspect-square overflow-hidden rounded-xl">
      <img src={imageData} alt="Feature breakdown" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5 pointer-events-none" />
      {featureList.map((feat, idx) => (
        <div key={idx} className="absolute" style={positions[idx % positions.length] as React.CSSProperties}>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg bg-black/70 border border-white/20 text-white backdrop-blur"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <span className="truncate max-w-[120px]">{feat}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Brief Tab System
// ─────────────────────────────────────────────────────────────────────────────

type TabId = 'product' | 'audience' | 'visual' | 'constraints';

const TABS: { id: TabId; label: string }[] = [
  { id: 'product',     label: 'Product' },
  { id: 'audience',    label: 'Audience' },
  { id: 'visual',      label: 'Visual Direction' },
  { id: 'constraints', label: 'Constraints' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  // ── Form state ──────────────────────────────────────────────────────────────
  const [productName,         setProductName]         = useState('Oversized Graphic T-Shirt');
  const [productCategory,     setProductCategory]     = useState('Apparel & Clothing');
  const [keyFeatures,         setKeyFeatures]         = useState('240 GSM cotton, Oversized fit, Breathable fabric');
  const [coreUSP,             setCoreUSP]             = useState('Only breathable oversized tee under ₹599');
  const [productVisualAnchor, setProductVisualAnchor] = useState(
    'Black oversized crew-neck tee with a large distressed yellow graphic print on the front chest, dropped shoulders, ribbed collar',
  );
  const [targetAudience,      setTargetAudience]      = useState('Gen Z College Students (18–30)');
  const [pricePositioning,    setPricePositioning]    = useState('Budget (₹0–500)');
  const [brandColors,         setBrandColors]         = useState('Black, White, Yellow');
  const [brandTone,           setBrandTone]           = useState('Humorous and Casual');
  const [visualMood,          setVisualMood]          = useState<string[]>(['Bold & Loud', 'Playful & Fun']);
  const [competitorBrands,    setCompetitorBrands]    = useState('Bewakoof, The Souled Store, Snitch');
  const [avoidElements,       setAvoidElements]       = useState('White backgrounds, formal styling, luxury aesthetics');
  const [platform,            setPlatform]            = useState('Website Hero Section');

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('product');

  // ── Pipeline state ───────────────────────────────────────────────────────────
  const [stages,          setStages]          = useState<Stage[]>(INITIAL_STAGES);
  const [isRunning,       setIsRunning]       = useState(false);
  const [images,          setImages]          = useState<ImageResult[]>([]);
  const [errorMessage,    setErrorMessage]    = useState<string | null>(null);
  const [expandedStage,   setExpandedStage]   = useState<number | null>(null);
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
          productName, productCategory, brandTone, targetAudience, brandColors,
          keyFeatures, coreUSP, pricePositioning, visualMood, competitorBrands,
          avoidElements, platform, productVisualAnchor,
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
          } catch { /* skip malformed */ }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') setErrorMessage(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const stop = () => { abortRef.current?.abort(); setIsRunning(false); };

  const completedCount = stages.filter((s) => s.status === 'done').length;
  const progressPct    = (completedCount / stages.length) * 100;
  const stage7Output   = stages.find((s) => s.id === 7 && s.status === 'done')?.output ?? null;
  const canRun         = Boolean(productVisualAnchor.trim()) && !isRunning;

  const pipelineState = useMemo<{ label: string; tone: PillTone }>(() => {
    if (isRunning)    return { label: 'Running',  tone: 'info' };
    if (errorMessage) return { label: 'Error',    tone: 'bad'  };
    if (images.length) return { label: 'Complete', tone: 'good' };
    return              { label: 'Idle',      tone: 'neutral' };
  }, [isRunning, errorMessage, images.length]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 h-14 flex items-center justify-between gap-4">

          {/* Left: brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center text-white shadow-sm">
              <IconSpark />
            </div>
            <span className="text-sm font-semibold tracking-tight">Intent Farm</span>
            <Pill tone={pipelineState.tone}>{pipelineState.label}</Pill>
            <Pill tone="neutral">{platform}</Pill>
          </div>

          {/* Right: progress + actions */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="hidden sm:flex items-center gap-2 w-40">
              <span className="text-[11px] text-zinc-500 whitespace-nowrap">{completedCount}/{stages.length}</span>
              <ProgressBar value={progressPct} />
            </div>

            <button
              onClick={handleRun}
              disabled={!canRun}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold bg-amber-400 text-white',
                'hover:bg-amber-500 transition shadow-sm',
                !canRun && 'opacity-40 cursor-not-allowed',
              )}
            >
              {isRunning ? 'Running…' : 'Run Pipeline'}
            </button>

            {isRunning && (
              <button
                onClick={stop}
                className="rounded-lg px-3 py-2 text-sm font-medium border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Brief strip (horizontal tabs) ───────────────────────────────────── */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="mx-auto max-w-[1600px]">

          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-zinc-800 px-6 bg-zinc-950 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition',
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200',
                )}
              >
                {tab.label}
              </button>
            ))}
            <div className="ml-auto flex items-center pr-2">
              <Pill tone={productVisualAnchor.trim() ? 'good' : 'warn'}>
                Anchor {productVisualAnchor.trim() ? 'Ready' : 'Missing'}
              </Pill>
            </div>
          </div>

          {/* Tab content */}
          <div className="px-6 py-4">

            {/* Product tab */}
            {activeTab === 'product' && (
              <div className="space-y-4">
                {/* Anchor field – highlighted */}
                <div className="rounded-xl border border-amber-800/60 bg-amber-950/30 p-4 space-y-2">
                  <FieldLabel label="Product Visual Description" required tip="Locked into every prompt — biggest driver of consistency" />
                  <TextareaInput
                    value={productVisualAnchor}
                    onChange={setProductVisualAnchor}
                    disabled={isRunning}
                    rows={2}
                  />
                  <p className="text-xs text-amber-400">
                    Be literal: color, print, fit, collar, sleeves, texture. The scene can change — the product shouldn&apos;t.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <FieldLabel label="Product Name" />
                    <TextInput value={productName} onChange={setProductName} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Category" tip="targets competitors" />
                    <SelectInput value={productCategory} onChange={setProductCategory} options={PRODUCT_CATEGORIES} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Key Features" tip="fabric, fit, material" />
                    <TextInput value={keyFeatures} onChange={setKeyFeatures} disabled={isRunning} />
                  </div>
                  <div className="space-y-1.5">
                    <FieldLabel label="Core USP" tip="what makes it different?" />
                    <TextInput value={coreUSP} onChange={setCoreUSP} disabled={isRunning} />
                  </div>
                </div>
              </div>
            )}

            {/* Audience tab */}
            {activeTab === 'audience' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel label="Target Audience" />
                  <TextInput value={targetAudience} onChange={setTargetAudience} disabled={isRunning} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Price Positioning" tip="biggest style driver" />
                  <SelectInput value={pricePositioning} onChange={setPricePositioning} options={PRICE_POSITIONS} disabled={isRunning} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="Platform" tip="changes crop + composition rules" />
                  <SelectInput value={platform} onChange={setPlatform} options={PLATFORMS} disabled={isRunning} />
                </div>
              </div>
            )}

            {/* Visual Direction tab */}
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
                  <FieldLabel label="Visual Mood" tip="select all that apply" />
                  <MoodPicker selected={visualMood} onChange={setVisualMood} disabled={isRunning} />
                </div>
              </div>
            )}

            {/* Constraints tab */}
            {activeTab === 'constraints' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <FieldLabel label="Known Competitors" tip="real brand names = better research" />
                  <TextInput value={competitorBrands} onChange={setCompetitorBrands} disabled={isRunning} />
                </div>
                <div className="space-y-1.5">
                  <FieldLabel label="What to AVOID" tip="colors, styles to never use" />
                  <TextInput value={avoidElements} onChange={setAvoidElements} disabled={isRunning} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {errorMessage && (
        <div className="mx-auto max-w-[1600px] w-full px-6 pt-4">
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 flex items-start gap-3">
            <svg className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-300">Pipeline error</p>
              <p className="text-xs text-red-400 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Three-column results ─────────────────────────────────────────────── */}
      <div className="flex-1 mx-auto max-w-[1600px] w-full px-4 md:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">

          {/* ── Col 1: Pipeline timeline ──────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Pipeline Timeline</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Click completed stages to expand output</p>
                </div>
                <Pill tone="neutral">{completedCount}/{stages.length} done</Pill>
              </div>

              <div className="divide-y divide-zinc-800">
                {stages.map((stage) => {
                  const expanded = expandedStage === stage.id && stage.status === 'done';
                  return (
                    <div
                      key={stage.id}
                      className={cn(
                        'transition',
                        stage.status === 'running' && 'bg-amber-950/20',
                        stage.status === 'done'    && 'hover:bg-zinc-800 cursor-pointer',
                        stage.status === 'error'   && 'bg-red-950/20',
                      )}
                      onClick={() => {
                        if (stage.status !== 'done') return;
                        setExpandedStage(expanded ? null : stage.id);
                      }}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="text-xs text-zinc-600 w-5 text-right tabular-nums">{stage.id}</span>
                        <StatusDot status={stage.status} />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm truncate', stage.status === 'idle' ? 'text-zinc-600' : 'text-zinc-100')}>
                            {stage.title}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {stage.status === 'running' ? 'Processing…'
                              : stage.status === 'done' ? 'Click to view output'
                              : stage.status === 'error' ? 'Failed'
                              : 'Waiting'}
                          </p>
                        </div>
                        {stage.status === 'done' && (
                          <span className="text-xs text-zinc-500">{expanded ? 'Hide' : 'View'}</span>
                        )}
                      </div>

                      {expanded && stage.output && (
                        <div className="px-4 pb-4">
                          <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3">
                            {stage.id === 7
                              ? <EvaluationCard text={stage.output} />
                              : <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{stage.output}</p>
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Col 2: Evaluation scorecard ───────────────────────────────────── */}
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Evaluation Scorecard</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Final QA view of all 3 images</p>
                </div>
                <Pill tone={stage7Output ? 'good' : 'neutral'}>{stage7Output ? 'Done' : 'Pending'}</Pill>
              </div>
              <div className="p-4">
                {stage7Output ? (
                  <EvaluationCard text={stage7Output} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <div className="h-11 w-11 rounded-xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                      <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none">
                        <path d="M9 17l3-3 3 3M12 14V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M3 17a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-300">No scores yet</p>
                    <p className="text-xs text-zinc-500">Run the pipeline to generate scores.</p>
                  </div>
                )}
              </div>
            </div>

            {/* QA Checklist */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
              <p className="text-sm font-semibold text-zinc-100 mb-3">Quick QA Checklist</p>
              <ul className="space-y-2">
                {[
                  'Product looks identical across all 3 images (color, print, fit)',
                  'Hero: premium studio — dark, centered, dramatic lighting',
                  'Lifestyle: real audience vibe — candid, urban or campus',
                  'Feature: macro detail + clean negative space for callouts',
                ].map((item) => (
                  <li key={item} className="flex gap-2 text-xs text-zinc-400">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Col 3: Generated images ───────────────────────────────────────── */}
          <div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Generated Output</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Hero · Lifestyle · Feature (same product, different scenes)</p>
                </div>
                <Pill tone={images.length ? 'good' : 'neutral'}>{images.length ? '3 Images' : 'Empty'}</Pill>
              </div>

              <div className="p-4">
                {images.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <div className="h-11 w-11 rounded-xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                      <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 24 24" fill="none">
                        <path d="M4 16l4.6-4.6a2 2 0 012.8 0L16 16m-2-2l1.6-1.6a2 2 0 012.8 0L20 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-zinc-300">No images yet</p>
                    <p className="text-xs text-zinc-500">Run the pipeline to generate your 3 strategic images.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {images.map((img) => (
                      <div key={img.key} className="rounded-xl border border-zinc-700 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border-b border-zinc-700">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <p className="text-sm font-medium">{img.label}</p>
                          </div>
                          <Pill tone="neutral">{img.key}</Pill>
                        </div>
                        <div className="p-2">
                          {img.key === 'feature' ? (
                            <FeatureImageOverlay imageData={img.imageData} features={keyFeatures} />
                          ) : (
                            <img
                              src={img.imageData}
                              alt={img.label}
                              className="w-full aspect-square object-cover rounded-lg"
                            />
                          )}
                          <details className="mt-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2">
                            <summary className="cursor-pointer text-xs text-zinc-400 font-medium">View prompt</summary>
                            <p className="mt-1.5 text-xs text-zinc-500 leading-relaxed whitespace-pre-wrap">{img.prompt}</p>
                          </details>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}