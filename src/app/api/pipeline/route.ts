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

// Simple hash function to derive a fixed seed from the product anchor
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Updated fetchImage now accepts a seed parameter
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

  // Locked product identity
  const PRODUCT_ANCHOR = productVisualAnchor?.trim()
    ? productVisualAnchor.trim()
    : `${productName}${brandColors ? `, in colors: ${brandColors}` : ''}`;

  // Fixed seed derived from the product anchor (all 3 images share the same seed)
  const SEED = hashCode(PRODUCT_ANCHOR) % 99999;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        // Build enriched brand brief
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

        // ── Stage 1: Competitor Research ─────────────────────────────────
        send({ stage: 1, status: 'running', title: 'Competitor Research' });
        const competitorResearch = await runStep(
          'You are an ecommerce creative strategist. Be concise and structured.',
          `Brand brief:\n${brandBrief}\n\nThe brand has identified these known competitors: ${competitorBrands || 'none specified — infer from category and positioning'}.\n\nIdentify:\n1. Top 4 competitors in the ${productCategory || 'product'} space at ${pricePositioning || 'mid-range'} positioning\n2. Common visual approaches each uses\n3. Common color palettes in this category\n4. Photography styles dominant in this space\n5. Hero image trends for ${platform || 'ecommerce'}\n6. One gap — what none of them do visually\n\nMax 280 words.`
        );
        send({ stage: 1, status: 'done', title: 'Competitor Research', output: competitorResearch });

        // ── Stage 2: Pattern Extraction ──────────────────────────────────
        send({ stage: 2, status: 'running', title: 'Pattern Extraction' });
        const patternExtraction = await runStep(
          'You are a visual trend analyst. Be concise and insight-driven.',
          `Competitor research:\n${competitorResearch}\n\nBrand avoids: ${avoidElements || 'nothing specified'}\nBrand mood target: ${Array.isArray(visualMood) ? visualMood.join(', ') : visualMood || 'not specified'}\n\nIdentify:\n1. Repeating visual patterns (what everyone does — the safe zone)\n2. Repeating messaging themes (overused angles)\n3. Market gaps (what nobody does — the opportunity)\n4. One key strategic insight for this brand specifically\n5. How the brand's USP (${coreUSP || 'not specified'}) can be visualized differently\n\nMax 220 words.`
        );
        send({ stage: 2, status: 'done', title: 'Pattern Extraction', output: patternExtraction });

        // ── Stage 3: Visual Strategy Creation (LOCKED to exact specs) ──────
        send({ stage: 3, status: 'running', title: 'Visual Strategy Creation' });
        const visualStrategies = await runStep(
          'You are a brand creative director. Return the strategies EXACTLY as provided, enriched only with product-specific details.',
          `Brand brief:\n${brandBrief}\n\n` +
          `DO NOT invent new strategies. Use these three locked strategies, adding only product-specific visual details (like how brand colors appear) where appropriate:\n\n` +
          `STRATEGY 1 — HERO/PREMIUM: Psychological goal: Perceived value and desirability. Subject: The product alone — no people, no distractions. Background: Deep black or very dark studio. Lighting: Dramatic single-source light — sharp shadows. Composition: Dead center, symmetrical, lots of negative space. Color: Brand colors (${brandColors}) dominate — yellow accent light or yellow folded detail catches the eye. Mood: "This brand takes itself seriously." Avoid: Bright, cheerful, lifestyle-y, any people or context.\n\n` +
          `STRATEGY 2 — LIFESTYLE: Psychological goal: Identity, belonging, aspiration. Subject: A real-looking person from target audience (${targetAudience}) wearing the product in an urban/campus setting. Background: Real environment — graffiti wall, college corridor, busy street. NOT studio. Lighting: Natural daylight or golden hour, candid feel. Composition: Slightly off-center, motion implied. Color: Brand colors appear naturally in surroundings. Mood: "That's literally me." Avoid: Stock-photo poses, studio lighting, overly polished model shots.\n\n` +
          `STRATEGY 3 — FEATURE/FUNCTIONAL: Psychological goal: Reduce purchase hesitation, build trust. Subject: Extreme close-up of product — fabric texture, stitching, weave of ${keyFeatures} visible. Background: Clean white or very light grey (white background is ALLOWED for this image only, as it's informational). Lighting: Even, soft, shadowless — Amazon-style product photography. Composition: Macro detail shot or multiple angles showing quality. Color: Neutral — let the product speak; small yellow label or tag showing features ok. Mood: "I know what I'm getting." Avoid: Dark, moody, artistic styles; no lifestyle elements; no people.\n\n` +
          `Return these three strategies exactly as provided, plus one sentence each on why they work against competitors. Max 300 words total.`
        );
        send({ stage: 3, status: 'done', title: 'Visual Strategy Creation', output: visualStrategies });

        // ── Stage 4: Concept Generation (LOCKED to exact shot-by-shot) ─────
        send({ stage: 4, status: 'running', title: 'Concept Generation' });
        const conceptGeneration = await runStep(
          'You are a creative director converting strategies into detailed visual concepts. Follow the provided visual rules exactly.',
          `Strategies:\n${visualStrategies}\n\n` +
          `Brand brief:\n${brandBrief}\n\n` +
          `IMPORTANT: The product always looks exactly like this in every concept: "${PRODUCT_ANCHOR}". Do NOT change the product's appearance between concepts — only the scene, lighting, and composition changes.\n\n` +
          `Convert ALL 3 strategies into detailed, executable image concepts.\n` +
          `For CONCEPT 1 (Hero):\n` +
          `- Composition: dead center, symmetrical, lots of negative space.\n` +
          `- Background: deep black / dark studio.\n` +
          `- Lighting: dramatic single-source with sharp shadows.\n` +
          `- Styling: product alone, no people, no props.\n` +
          `- Color: brand colors (${brandColors}) must be prominent; yellow accent light or detail.\n` +
          `- Mood: high-value, aspirational, serious.\n\n` +
          `For CONCEPT 2 (Lifestyle):\n` +
          `- Composition: slightly off-center, motion implied.\n` +
          `- Background: urban setting (graffiti, campus, street) — NOT studio.\n` +
          `- Lighting: natural daylight or golden hour, candid.\n` +
          `- Subject: one person (target audience: ${targetAudience}) wearing the product, real/relatable, not model-agency.\n` +
          `- Mood: relatable, aspirational, "that could be me".\n\n` +
          `For CONCEPT 3 (Feature):\n` +
          `- Composition: extreme close-up macro, or multi-angle detail shot.\n` +
          `- Background: clean white or very light grey (white is ALLOWED for this image only).\n` +
          `- Lighting: even, soft, shadowless.\n` +
          `- Subject: fabric texture, stitching, material quality visible.\n` +
          `- Color: neutral, maybe a small yellow tag showing GSM/feature.\n` +
          `- Mood: trust, transparency, quality assurance.\n\n` +
          `STILL STRICTLY AVOID in concepts 1 and 2: ${avoidElements || 'nothing specified'}. For concept 3, white background is allowed. Also exclude cluttered backgrounds for all.\n` +
          `Label as CONCEPT 1, CONCEPT 2, CONCEPT 3. Max 400 words total.`
        );
        send({ stage: 4, status: 'done', title: 'Concept Generation', output: conceptGeneration });

        // ── Stage 5: Prompt Engineering (PER‑IMAGE EXACT SPECS) ──────────
        send({ stage: 5, status: 'running', title: 'Prompt Engineering' });
        const promptsRaw = await runStep(
          'You are an expert AI image generation prompt engineer. Follow the exact visual specifications for each image.',
          `Brand brief:\n${brandBrief}\n\n` +
          `Product visual anchor (MUST start every prompt): "${PRODUCT_ANCHOR}".\n\n` +
          `Generate THREE prompts, one per image. For each, adhere to the locked style guide:\n\n` +
          `PROMPT_1 (HERO/PREMIUM):\n` +
          `- Start with: "${PRODUCT_ANCHOR}, " then scene description.\n` +
          `- Scene: product alone on deep black studio background, dramatic single light source creating sharp shadows, dead center, symmetrical, lots of negative space, high-end streetwear lookbook style, no people, no text.\n` +
          `- Colors: prominently use brand colors (${brandColors}).\n` +
          `- Photography style: commercial fashion, photorealistic.\n` +
          `- Exclude: ${avoidElements ? avoidElements + ', ' : ''}bright cheerful lighting, lifestyle context, any person.\n\n` +
          `PROMPT_2 (LIFESTYLE):\n` +
          `- Start with: "${PRODUCT_ANCHOR}, " then scene description.\n` +
          `- Scene: one relatable Gen Z person wearing the product in an urban setting (college campus, graffiti wall, busy street), natural daylight/golden hour, candid, motion implied, slightly off-center.\n` +
          `- Colors: brand colors appear naturally in surroundings.\n` +
          `- Photography style: instagram candid, photorealistic, real-life feel.\n` +
          `- Exclude: ${avoidElements ? avoidElements + ', ' : ''}studio lighting, posed stock photography, model-agency faces, white studio background.\n\n` +
          `PROMPT_3 (FEATURE/FUNCTIONAL):\n` +
          `- Start with: "(((${PRODUCT_ANCHOR}))), " then scene description.\n` +
          `- Scene: extreme macro close-up of the EXACT product "${PRODUCT_ANCHOR}". Show the real product's fabric texture, stitching, and details filling the frame. Background: clean white or very light grey (white ALLOWED). Lighting: even, soft, shadowless. Composition: macro detail shot that leaves space around the edges for overlaying callout icons (do NOT draw icons, just leave clean negative space).\n` +
          `- Colors: neutral, let product colors be accurate.\n` +
          `- Photography style: detailed macro product photography, photorealistic, 8k.\n` +
          `- Exclude: dark moody lighting, lifestyle elements, people, clutter, text, logos.\n` +
          `(Note: for this image only, white background is acceptable, even if the avoid list includes it. The avoid list applies to the other two images.)\n\n` +
          `Format EXACTLY as:\n` +
          `PROMPT_1: <prompt>\n` +
          `PROMPT_2: <prompt>\n` +
          `PROMPT_3: <prompt>\n` +
          `No explanations.`
        );
        send({ stage: 5, status: 'done', title: 'Prompt Engineering', output: promptsRaw });

        // Parse 3 prompts
        const parsePrompts = (raw: string): [string, string, string] => {
          const p1 = raw.match(/PROMPT_1:\s*(.+?)(?=PROMPT_2:|$)/s)?.[1]?.trim() ?? raw;
          const p2 = raw.match(/PROMPT_2:\s*(.+?)(?=PROMPT_3:|$)/s)?.[1]?.trim() ?? raw;
          const p3 = raw.match(/PROMPT_3:\s*(.+?)$/s)?.[1]?.trim() ?? raw;
          return [p1, p2, p3];
        };
        let [prompt1, prompt2, prompt3] = parsePrompts(promptsRaw);

        // Enforce product anchor at the very start of every prompt
        const enforceAnchor = (p: string): string => {
          const anchor = PRODUCT_ANCHOR;
          if (p.toLowerCase().startsWith(anchor.toLowerCase())) return p;
          return `${anchor}, ${p}`;
        };
        prompt1 = enforceAnchor(prompt1);
        prompt2 = enforceAnchor(prompt2);
        prompt3 = enforceAnchor(prompt3);

        // ── Stage 6: Image Generation (with fixed seed) ──────────────────
        send({ stage: 6, status: 'running', title: 'Image Generation (3 images)' });
        const imageData1 = await fetchImage(prompt1, SEED);
        await new Promise(r => setTimeout(r, 2000));
        const imageData2 = await fetchImage(prompt2, SEED);
        await new Promise(r => setTimeout(r, 2000));
        const imageData3 = await fetchImage(prompt3, SEED);
        send({ stage: 6, status: 'done', title: 'Image Generation (3 images)', output: 'All 3 images generated successfully.' });

        // ── Stage 7: Evaluation ───────────────────────────────────────────
        send({ stage: 7, status: 'running', title: 'Evaluation Scorecard' });
        const evaluation = await runStep(
          'You are a creative quality reviewer for ecommerce. Be honest, specific, and structured.',
          `Brand Brief:\n${brandBrief}\n\nProduct Visual Anchor (should appear consistently in all images): "${PRODUCT_ANCHOR}"\n\nConcepts & Prompts:\n${conceptGeneration}\n\nPrompts used:\nHero: ${prompt1}\nLifestyle: ${prompt2}\nFeature: ${prompt3}\n\nScore each image on Brand Fit, Product Visibility, Audience Match, USP Clarity, Mood Accuracy (1-10 each).\nAlso flag if any concept violates the avoid list: ${avoidElements || 'none'}.\nAlso note if product visual consistency is maintained across all three images.\n\nFormat EXACTLY as:\nHERO IMAGE:\nBrand Fit: X/10 — reason\nProduct Visibility: X/10 — reason\nAudience Match: X/10 — reason\nUSP Clarity: X/10 — reason\nMood Accuracy: X/10 — reason\n\nLIFESTYLE IMAGE:\nBrand Fit: X/10 — reason\nProduct Visibility: X/10 — reason\nAudience Match: X/10 — reason\nUSP Clarity: X/10 — reason\nMood Accuracy: X/10 — reason\n\nFEATURE IMAGE:\nBrand Fit: X/10 — reason\nProduct Visibility: X/10 — reason\nAudience Match: X/10 — reason\nUSP Clarity: X/10 — reason\nMood Accuracy: X/10 — reason\n\nOVERALL: one sentence summary`
        );
        send({ stage: 7, status: 'done', title: 'Evaluation Scorecard', output: evaluation });

        // ── Final ─────────────────────────────────────────────────────────
        send({
          stage: 'complete',
          images: [
            { key: 'hero',      label: 'Hero / Premium',      prompt: prompt1, imageData: imageData1 },
            { key: 'lifestyle', label: 'Lifestyle / Audience', prompt: prompt2, imageData: imageData2 },
            { key: 'feature',   label: 'Feature Breakdown',   prompt: prompt3, imageData: imageData3 },
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