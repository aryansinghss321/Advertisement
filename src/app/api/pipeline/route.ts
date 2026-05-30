// src/app/api/pipeline/route.ts
import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function runStep(systemPrompt: string, userPrompt: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? '';
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

async function fetchImage(prompt: string, seed: number, retries = 3): Promise<string> {
  const truncated = prompt.trim().slice(0, 400);
  const encoded = encodeURIComponent(truncated);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (i < retries - 1) { await new Promise(r => setTimeout(r, 3000 * (i + 1))); continue; }
        throw new Error(`Pollinations failed: ${res.status}`);
      }
      const buf = await res.arrayBuffer();
      const mime = res.headers.get('content-type') || 'image/jpeg';
      return `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
    } catch (e: any) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw new Error('Image fetch failed after retries');
}

export async function POST(req: Request) {
  const {
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
  } = await req.json();

  const encoder = new TextEncoder();
  const PRODUCT_ANCHOR = productVisualAnchor?.trim()
    ? productVisualAnchor.trim()
    : `${productName}${brandColors ? `, in colors: ${brandColors}` : ''}`;
  const SEED = hashCode(PRODUCT_ANCHOR) % 99999;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        const brandBrief = `
Product: ${productName}
Product Visual Description: ${PRODUCT_ANCHOR}
Category: ${productCategory || 'Not specified'}
Key Features: ${keyFeatures || 'Not specified'}
Core USP / Differentiator: ${coreUSP || 'Not specified'}
Target Audience: ${targetAudience}
Price Positioning: ${pricePositioning || 'Mid-range'}
Brand Colors: ${brandColors || 'Not specified'}
Brand Tone: ${brandTone}
Visual Mood / Aesthetic: ${Array.isArray(visualMood) ? visualMood.join(', ') : visualMood || 'Not specified'}
Known Competitors: ${competitorBrands || 'Not specified'}
What to AVOID: ${avoidElements || 'Nothing specified'}
Platform: ${platform || 'Website Hero Section'}
`.trim();

        // ── Stage 1: Competitor Research (UPGRADED 10/10) ──
        send({ stage: 1, status: 'running', title: 'Competitor Research' });
        const competitorResearch = await runStep(
          `You are a senior ecommerce creative strategist with expertise in DTC brands, Meta ads, and consumer psychology.
Do NOT summarize. Extract actionable insights only.
For every competitor observation: (1) what they do (2) why it works psychologically (3) one gap the brand can exploit.
Prioritize: winning visual patterns, emotional triggers, and market gaps.
Max 280 words. Concise, executive-level bullet points.`,
          `Brand brief:\n${brandBrief}\n\nKnown competitors: ${competitorBrands || 'infer from category'}.\n\nAnswer:
1. Top 4 direct competitors at ${pricePositioning || 'mid-range'} positioning
2. Common visual approach each uses (one phrase each)
3. Dominant color palettes in this category
4. Overused photography styles (what everyone does)
5. Hero image trends for ${platform || 'ecommerce'}
6. One specific market gap — what NONE of them do visually
7. How the brand's USP (${coreUSP || 'not specified'}) can visually contradict competitors`
        );
        send({ stage: 1, status: 'done', title: 'Competitor Research', output: competitorResearch });

        // ── Stage 2: Pattern Extraction (UPGRADED 10/10) ──
        send({ stage: 2, status: 'running', title: 'Pattern Extraction' });
        const patternExtraction = await runStep(
          `You are a visual trend analyst and consumer psychologist.
Identify patterns competitors repeat (the "safe zone") and what they miss (the "opportunity zone").
For each pattern: why it works → why it's now saturated → how to counter it.
Be specific, not generic. Max 220 words. Bullet points only.`,
          `Competitor research:\n${competitorResearch}\n\nBrand mood target: ${Array.isArray(visualMood) ? visualMood.join(', ') : visualMood || 'not specified'}\nBrand avoids: ${avoidElements || 'nothing specified'}\n\nIdentify:
1. Three repeating visual patterns in this category (everyone does these)
2. Two overused messaging angles that have lost impact
3. Two market gaps (what nobody does — specific, not vague)
4. One strategic visual insight unique to this brand
5. How to visualize ${coreUSP || 'the USP'} in a way competitors haven't`
        );
        send({ stage: 2, status: 'done', title: 'Pattern Extraction', output: patternExtraction });

        // ── Stage 3: Visual Strategy Creation (UPGRADED 10/10) ──
        send({ stage: 3, status: 'running', title: 'Visual Strategy Creation' });
        const visualStrategies = await runStep(
          `You are a brand creative director and conversion rate optimization specialist.
For each strategy below, add ONE sentence on its psychological mechanism and ONE sentence on why it beats competitors.
Do not invent new strategies. Keep all three. Max 350 words.`,
          `Brand brief:\n${brandBrief}\n\nCompetitor patterns:\n${patternExtraction}\n\nUse these THREE locked strategies. Add product-specific visual details (brand colors: ${brandColors}):

STRATEGY 1 — HERO/PREMIUM
Psychological goal: Perceived value + scarcity heuristics
Subject: Product alone — no people, no props
Background: Deep black or very dark studio
Lighting: Dramatic single-source, sharp shadows
Composition: Dead center, symmetrical, negative space
Color: Brand colors (${brandColors}) dominate; yellow accent light
Mood: "This brand takes itself seriously"
Avoid: Bright, cheerful, lifestyle, people, white backgrounds

STRATEGY 2 — LIFESTYLE
Psychological goal: Social proof + identity signaling
Subject: Real-looking person from ${targetAudience} wearing product
Background: Real urban environment (graffiti wall, campus, street) — NOT studio
Lighting: Natural daylight or golden hour, candid feel
Composition: Slightly off-center, motion implied
Color: Brand colors appear naturally in surroundings
Mood: "That's literally me"
Avoid: Stock poses, studio lighting, overly polished models

STRATEGY 3 — FEATURE/FUNCTIONAL
Psychological goal: Risk reduction + trust via transparency
Subject: Extreme close-up — texture, stitching, material quality visible
Background: Clean white or light grey (allowed only for this image)
Lighting: Even, soft, shadowless (Amazon product style)
Composition: Macro detail or multi-angle
Color: Neutral; small yellow label/tag for feature callout
Mood: "I know exactly what I'm getting"
Avoid: Dark/moody, lifestyle elements, people, artistic filters

For each strategy, add one sentence: "Why it beats competitors: [specific gap from competitor research]"`
        );
        send({ stage: 3, status: 'done', title: 'Visual Strategy Creation', output: visualStrategies });

        // ── Stage 4: Concept Generation (UPGRADED 10/10) ──
        send({ stage: 4, status: 'running', title: 'Concept Generation' });
        const conceptGeneration = await runStep(
          `You are a creative director converting strategies to detailed visual concepts.
The product appearance is LOCKED to: "${PRODUCT_ANCHOR}". Never change it — only change scene, lighting, composition.
For each concept: shot type + camera + lighting + composition + styling + mood + why it converts.
Max 400 words. Label CONCEPT 1, 2, 3.`,
          `Strategies:\n${visualStrategies}\n\nBrand brief:\n${brandBrief}\n\nProduct lock: "${PRODUCT_ANCHOR}" — identical appearance across all 3 concepts.\n\nCONCEPT 1 (Hero/Premium):
- Composition: dead center, symmetrical, negative space
- Background: deep black/dark studio
- Lighting: dramatic single-source, sharp shadows
- Styling: product alone, no people, no props
- Color: ${brandColors} prominent; yellow accent light
- Mood: high-value, aspirational, serious

CONCEPT 2 (Lifestyle):
- Composition: slightly off-center, motion implied
- Background: urban setting (graffiti wall, campus, street) — NOT studio
- Lighting: natural daylight or golden hour, candid
- Subject: one person (${targetAudience}) wearing product, real/relatable
- Mood: aspirational but attainable, "that could be me"

CONCEPT 3 (Feature/Macro):
- Composition: extreme close-up macro or multi-angle detail
- Background: clean white or light grey (allowed only here)
- Lighting: even, soft, shadowless
- Subject: fabric texture, stitching, material quality
- Color: neutral; optional small yellow tag showing feature
- Mood: trust, transparency, quality assurance

Strictly avoid in concepts 1 & 2: ${avoidElements || 'nothing specified'}
For concept 3, white background is ALLOWED.`
        );
        send({ stage: 4, status: 'done', title: 'Concept Generation', output: conceptGeneration });

        // ── Stage 5: Prompt Engineering (UPGRADED 10/10) ──
        send({ stage: 5, status: 'running', title: 'Prompt Engineering' });
        const promptsRaw = await runStep(
          `You are an expert AI image prompt engineer for FLUX/Stable Diffusion. Every prompt MUST be under 350 characters total. No explanations. No extra text. Format exactly as shown.`,
          `Product anchor (start EVERY prompt with this EXACT string): "${PRODUCT_ANCHOR}"
Brand colors: ${brandColors}
Avoid in prompts 1 & 2: ${avoidElements || 'nothing'}

PROMPT_1 — HERO/PREMIUM:
[${PRODUCT_ANCHOR}], floating product hero shot, Sony A7R 85mm f/1.8, dramatic single-source rim light sharp shadows, deep black studio negative space, high-end streetwear lookbook commercial fashion, photorealistic 8k, aspirational premium confident. Exclude: people props white backgrounds ${avoidElements}

PROMPT_2 — LIFESTYLE:
[${PRODUCT_ANCHOR}], candid street editorial, 35mm f/2.0 golden hour natural light, graffiti wall or college campus background, one Gen Z person wearing product candid slightly off-center, Instagram editorial photorealistic authentic, relatable youthful identity-driven. Exclude: studio lighting posed stock white backgrounds ${avoidElements}

PROMPT_3 — FEATURE/MACRO:
[${PRODUCT_ANCHOR}], extreme macro close-up detail, 100mm macro lens f/8 tripod, even softbox shadowless lighting, clean white background, ${keyFeatures?.split(',')[0]?.trim() || 'product'} texture and stitching filling frame, detailed macro product photography 8k sharp edges, trust transparency quality.

Format EXACTLY (no extra words, no markdown):
PROMPT_1: <text under 350 chars>
PROMPT_2: <text under 350 chars>
PROMPT_3: <text under 350 chars>`
        );
        send({ stage: 5, status: 'done', title: 'Prompt Engineering', output: promptsRaw });

        const parsePrompts = (raw: string): [string, string, string] => {
          const p1 = raw.match(/PROMPT_1:\s*([\s\S]+?)(?=PROMPT_2:|$)/)?.[1]?.trim() ?? raw;
          const p2 = raw.match(/PROMPT_2:\s*([\s\S]+?)(?=PROMPT_3:|$)/)?.[1]?.trim() ?? raw;
          const p3 = raw.match(/PROMPT_3:\s*([\s\S]+?)$/)?.[1]?.trim() ?? raw;
          return [p1, p2, p3];
        };
        let [prompt1, prompt2, prompt3] = parsePrompts(promptsRaw);

        const enforceAnchor = (p: string): string => {
          const anchor = PRODUCT_ANCHOR;
          if (p.toLowerCase().startsWith(anchor.toLowerCase())) return p;
          return `${anchor}, ${p}`;
        };
        prompt1 = enforceAnchor(prompt1);
        prompt2 = enforceAnchor(prompt2);
        prompt3 = enforceAnchor(prompt3);

        // ── Stage 6: Image Generation ──
        send({ stage: 6, status: 'running', title: 'Image Generation (3 images)' });
        const imageData1 = await fetchImage(prompt1, SEED);
        await new Promise(r => setTimeout(r, 2000));
        const imageData2 = await fetchImage(prompt2, SEED);
        await new Promise(r => setTimeout(r, 2000));
        const imageData3 = await fetchImage(prompt3, SEED);
        send({ stage: 6, status: 'done', title: 'Image Generation (3 images)', output: 'All 3 images generated successfully.' });

        // ── Stage 7: Evaluation (UPGRADED 10/10) ──
        send({ stage: 7, status: 'running', title: 'Evaluation Scorecard' });
        const evaluation = await runStep(
          `You are a senior creative quality reviewer for DTC ecommerce.
Score each image 1-10 on five metrics. For any score below 7, provide a specific fix.
Also check: does the product appearance remain consistent across all 3 images? If not, flag it.
Format exactly as shown. One sentence summary at end.`,
          `Brand brief:\n${brandBrief}\n\nProduct anchor (must look identical in all images): "${PRODUCT_ANCHOR}"\n\nAvoid list: ${avoidElements || 'none'}\n\nConcepts used:\n${conceptGeneration}\n\nPrompts:\nHero: ${prompt1}\nLifestyle: ${prompt2}\nFeature: ${prompt3}\n\nScore each on:\n- Brand Fit (colors, tone, positioning)\n- Product Visibility (can you see what's being sold?)\n- Audience Match (does ${targetAudience} see themselves?)\n- USP Clarity (is ${coreUSP || 'the differentiator'} communicated?)\n- Mood Accuracy (matches brand tone: ${brandTone})\n\nFormat EXACTLY:\nHERO IMAGE:\nBrand Fit: X/10 — [reason + fix if under 7]\nProduct Visibility: X/10 — [reason + fix if under 7]\nAudience Match: X/10 — [reason + fix if under 7]\nUSP Clarity: X/10 — [reason + fix if under 7]\nMood Accuracy: X/10 — [reason + fix if under 7]\n\nLIFESTYLE IMAGE:\n[same format]\n\nFEATURE IMAGE:\n[same format]\n\nPRODUCT CONSISTENCY: Yes/No — [if No, which image differs and how]\n\nOVERALL: one sentence recommendation for next iteration.`
        );
        send({ stage: 7, status: 'done', title: 'Evaluation Scorecard', output: evaluation });

        send({
          stage: 'complete',
          images: [
            { key: 'hero', label: 'Hero / Premium', prompt: prompt1, imageData: imageData1 },
            { key: 'lifestyle', label: 'Lifestyle / Audience', prompt: prompt2, imageData: imageData2 },
            { key: 'feature', label: 'Feature Breakdown', prompt: prompt3, imageData: imageData3 },
          ],
          evaluation,
        });

      } catch (error: any) {
        send({ stage: 'error', message: error.message || 'Pipeline failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}