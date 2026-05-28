# Handoff: The Corporate English Project — Translator-First Landing Page

## Overview
A new landing page for **The Corporate English Project (CEP)** that replaces the old marketing hero with a **utility-first translator**. A visitor lands, sees a centered search bar, and can instantly translate Spanish ⇄ English for free — no account. The result shows a free translation, definition, phonetics, and audio pronunciation, then a *gentle* upsell gate (blurred "idioms / conversation practice" and a "Save to study deck" prompt) that pushes toward a paid account. Below the hero, the page scrolls through three brand sections: **Ethos**, **Our Founder**, and **Contact**. Fully bilingual (EN/ES toggle).

This replaces the current landing page at `abrillazaro.github.io/CEP-website`.

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — a working prototype that shows the intended look and behavior. They are **not** production code to copy verbatim. The task is to **recreate this design in the target codebase** using its established patterns (framework, component library, styling system). If the current site is plain static HTML/CSS/JS (it is, on GitHub Pages), you can adapt the prototype's markup/CSS fairly directly, but the translator must be re-wired to a real backend (see ⚠️ below).

Files included:
- `Translator Landing.html` — page shell: Google Fonts, the full CSS design system (in `<style>`), and script mounts.
- `app.jsx` — all React components and copy (EN/ES strings, translator logic, sections, modal, tweaks).
- `tweaks-panel.jsx` — a prototyping-only "Tweaks" panel (live design knobs). **Do not ship this** — it's an authoring tool, not part of the product.
- `assets/logo-navy.png` — CEP logo, white background removed, recolored navy.
- `assets/cep-qr.png` — the real WhatsApp QR code.
- `assets/whatsapp-logo.png` — WhatsApp glyph, white background removed, recolored navy.

## ⚠️ Critical: the translator needs a real backend in production
In this prototype the translation is produced by an environment-provided helper, `window.claude.complete(prompt)` (see `translatePhrase()` in `app.jsx`). **That helper does not exist on a normal website.** To ship:
1. Replace `window.claude.complete(...)` with a `fetch()` to your own endpoint (a serverless function — e.g. Netlify/Vercel/Cloudflare function — so the API key is never exposed client-side).
2. That endpoint calls a translation/LLM service (Anthropic, OpenAI, DeepL, Google Translate, etc.) with the same prompt and returns the **same JSON shape** the UI already expects:
   ```json
   {
     "sourceLang": "en|es", "targetLang": "en|es",
     "translation": "…", "partOfSpeech": "…", "register": "neutral|formal|informal|colloquial",
     "pronunciation": "phonetic respelling of the translation",
     "examples": [ { "source": "…", "target": "…" } ],   // exactly 2
     "idioms":   [ { "phrase": "…", "meaning": "…", "example": "…" } ], // exactly 2
     "note": "short usage tip"
   }
   ```
3. Keep the existing defensive JSON parsing (strips code fences, extracts the `{…}` span).
- Audio pronunciation uses the browser's built-in `speechSynthesis` — that already works in production, no backend needed.
- Voice input (mic) uses the browser's `SpeechRecognition` API (Chrome/Edge). Degrades gracefully with a toast where unsupported.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, and interactions are all specified below and present in the CSS. Recreate pixel-for-pixel using the codebase's conventions.

---

## Design Tokens

### Colors (from `:root` in `Translator Landing.html`)
| Token | Hex | Use |
|---|---|---|
| `--navy` | `#20395c` | Brand, headings, primary buttons, body emphasis |
| `--navy-deep` | `#152840` | Button hover, shadows |
| `--navy-soft` | `#54688a` | Subheads, muted serif text, body prose |
| `--sage` | `#5d7c69` | Accent: focus rings, glow, rules, secondary CTA |
| `--sage-deep` | `#465c4f` | Accent text (eyebrows, italic headline word, captions) |
| `--sage-tint` | `#dce7dd` | Pills, selection, light fills |
| `--bg` | `#f1f3ef` | Page background (muted off-white) |
| `--bg-2` | `#eaeee8` | Alternating section background (Founder) |
| `--surface` | `#ffffff` | Cards, search bar, inputs |
| `--surface-soft` | `#f8faf6` | Card headers, subtle fills |
| `--line` | `#e0e4dd` | Hairline borders |
| `--line-strong` | `#cdd4c9` | Stronger borders, search-bar outline |
| `--ink` | `#1e2a3a` | Default body text |
| `--muted` | `#6c7787` | Secondary/footer text |
| WhatsApp green | `#25D366` | (legacy icon; now replaced by `whatsapp-logo.png`) |

### Typography
- **Serif (display):** `"Playfair Display"`, weights 400/500/600/700 + italics. Used for headlines, section titles (`Ethos`, `Our Founder`, `Contact`), the translation result word, form heading, modal titles, and italic subheads.
- **Sans (UI/body):** `"Hanken Grotesk"`, weights 400/500/600/700. Used for nav, buttons, inputs, prose, chips, labels.
- **Mono (captions):** system mono stack (`ui-monospace, "SF Mono", Menlo`) for the video caption.
- Load via Google Fonts (link is in the HTML `<head>`).
- Headline size: `clamp(38px, 6vw, 68px)`, line-height ~1.04, letter-spacing -0.01em. Section titles: `clamp(40px, 6vw, 72px)`.

### Shadows
- `--shadow-sm: 0 1px 2px rgba(21,40,64,.05), 0 1px 3px rgba(21,40,64,.06)`
- `--shadow-md: 0 6px 16px rgba(21,40,64,.08), 0 2px 6px rgba(21,40,64,.05)`
- `--shadow-lg: 0 22px 50px -12px rgba(21,40,64,.22), 0 8px 20px rgba(21,40,64,.10)`

### Radius
Search bar / chips / pills: `999px` (full). Cards: `22px`. Inner cards/inputs: `11–18px`. QR box / video: `16–20px`.

### Spacing / layout
Content max-width `1080–1180px`, side padding `40px` (desktop) / `20–22px` (mobile). Mobile breakpoint: **820px** (everything collapses to single column).

---

## Screens / Views (single page, top to bottom)

### 1. Top nav (fixed-feel header, not sticky)
- **Left:** CEP logo (`assets/logo-navy.png`, height 60px). Clicking it **resets to the landing state** (clears the search + result, closes modals, clears URL hash, smooth-scrolls to top).
- **Right:** language segmented toggle (globe icon + `EN` / `ES`; active pill = navy bg, white text), a text link `Conjugate` (hidden < 820px), and a solid navy `Log in` button (radius 11px).

### 2. Hero + translator (the core tool)
- Centered column. A soft **radial glow** sits behind it (`position: fixed`, sage by default, blurred, slow pulse). Glow color/intensity/animation are prototype tweaks — ship the sage glow at ~58% intensity, gentle pulse (or static).
- **Eyebrow:** "THE CORPORATE ENGLISH PROJECT" (uppercase, letter-spaced, sage-deep, 13px, 700).
- **Headline (serif):** two lines — line 1 `At last, <em>embody</em> English.` (the italic word is sage-deep), line 2 `Translate now.` (ES: `Por fin, <em>encarna</em> el inglés.` / `Tradúcelo ya.`).
- **Subhead (serif italic, navy-soft):** "Instant Spanish ⇄ English, built for learners." (ES: "Español ⇄ inglés al instante, para quienes aprenden.").
- **Search bar:** white pill, `1.5px` `--line-strong` border, `--shadow-md`. Left: search icon. Center: text input (20px, serif placeholder "Found a new word? Translate it into English or Spanish"). Right: mic button (turns sage-filled while listening) + solid navy `Translate` button (shows spinner while loading). Focus state: sage border + 4px sage glow ring.
- **Direction chip** (below bar, centered): cycles `Detect language` → `ES → EN` → `EN → ES` on click (swap icon). Default `Detect language` (auto).
- **Quick-try chips** (only when no result): "Try:" + `aprovechar`, `to look forward to`, `echar de menos`, `hindsight`. Clicking runs that translation.

When a translation runs: the eyebrow/headline/subhead **collapse** (max-height + opacity transition, ~0.55s) so the tool moves up; the glow shifts up slightly; the quick chips hide; a result card animates in.

### 3. Translation result card
- White card, radius 22px, `--shadow-lg`.
- **Header:** "You searched: **<input>** · <Source lang> ⇄ <Target lang>" and a register pill (e.g. `neutral`) or a `Free` pill.
- **Body:** big serif **translation** word(s); italic part-of-speech; phonetic line `/…/` (small-caps); a **Listen** button (outline pill, plays `speechSynthesis` in the target language, animates equalizer bars while playing, tagged `Free`).
- **"In a sentence":** up to 2 example rows — source sentence (ink) over its translation (muted).
- **Gentle upsell gate** (dashed-border panel): heading "Go further with this word" + subtext; a 2-up grid of **locked** cards — "Idioms & natural usage" and "Practice this in conversation" — each blurred with a `Pro` pill and an "Unlock with Pro" lock CTA (click → opens the account modal). Action row: outline `Save to my study deck` (→ modal), solid-sage `Start free trial` (→ modal), and a quiet `New search` (resets).

### 4. Ethos section
- Big serif title "Ethos", a 64×3px sage rule, then two prose paragraphs (max-width 760px, navy-soft, line-height ~1.72). Copy is in `app.jsx` (`ethos1`, `ethos2`), EN + ES.

### 5. Our Founder section (alternating `--bg-2` background)
- Sized to ~one viewport tall, content vertically centered. Faint CEP logo watermark top-right (opacity ~0.09).
- Title "Our Founder" + sage rule.
- **Stacked column (max-width 680px):** a 16:9 **video placeholder** (striped sage fill, centered round play button) → a mono caption beneath it: "FOUNDER INTRO · VIDEO COMING SOON" → kicker "MEET ABRIL" (uppercase sage-deep) → Abril's bio paragraph. *The founder wants to replace the placeholder with a real intro video* — implement the placeholder now; when the video file/URL exists, swap the placeholder div for a `<video>` (the CSS already supports `.video-ph video`).

### 6. Contact section
- Title "Contact" + sage rule. Faint logo watermark bottom-right.
- **3-column row, vertically centered:** `[ QR column ]  ·  or  ·  [ form column ]`.
  - QR column: "scan me" (serif italic) → white QR box (`assets/cep-qr.png`, 222×222, padding, radius 16) → WhatsApp row = `assets/whatsapp-logo.png` (40px) + "55 7313 2329", linking to `https://wa.me/525573132329`.
  - Center: the word "or" (serif italic, navy-soft), centered between the two columns.
  - Form column: heading "Leave your contact information" (serif italic) + subhead "and I'll reach out soon", then stacked inputs **Full name**, **Cell**, **Email** (no separators between them), then a solid navy **Submit**. Inputs are translucent white with blur, sage focus ring. Submitting currently just shows a confirmation toast — wire to email/CRM/Formspree/etc.
- **Footer:** "© The Corporate English Project · CEP · México, México".

---

## Interactions & Behavior
- **Language toggle (EN/ES):** swaps every string via the `STR` dictionary in `app.jsx`. Default EN.
- **Translate:** Enter or Translate button → `translatePhrase(query, direction)` → loading spinner → result card (riseIn animation) or a friendly error box on failure.
- **Direction chip:** cycles auto → es2en → en2es; passed into the prompt.
- **Listen:** `speechSynthesis`, target-language voice, rate 0.92; equalizer bars animate while speaking.
- **Mic:** `SpeechRecognition`; fills the input and auto-translates; toast if unsupported.
- **Locked cards / Save / Start free trial / Log in:** all open a centered **modal** (email + password + "Continue with Google" — all mocked; wire to real auth). Modal copy varies by trigger (`save` vs `pro` vs `login`). Footer link: "New to the CEP? Go pro".
- **Logo click:** full reset to landing state.
- **Transitions:** headline collapse 0.55s ease; cards/modal riseIn ~0.3–0.5s; glow pulse 9s; respect standard easing.
- **Responsive:** single column < 820px; grids collapse; nav `Conjugate` hides; Translate button shows icon only.

## State Management (see `App()` in `app.jsx`)
- `lang` ('en'|'es'), `query` (string), `dir` ('auto'|'en2es'|'es2en'), `busy` (bool), `result` (object|null), `error` (string), `modal` (null|'save'|'pro'|'login'), `toast` (string), `listening` (bool).
- `hasResult = result || busy || error` drives the headline collapse + glow shift.
- Tweak state (`useTweaks`) is **prototype-only** — drop it in production; hardcode: sage glow ~58%, animated, default EN, founder video shown.

## Assets
- `assets/logo-navy.png` — CEP circular logo (white bg knocked out, recolored to `--navy`). Original was a steel-blue mark on white.
- `assets/cep-qr.png` — production WhatsApp QR (provided by client).
- `assets/whatsapp-logo.png` — WhatsApp glyph (white bg knocked out, navy). Replaces an earlier green circle icon.
- Icons (search, mic, swap, globe, speaker, lock, bookmark, spark, chat, check, close, shield, play, phone) are inline SVGs in the `Icon` component in `app.jsx` — reuse or swap for your icon library.
- Fonts: Playfair Display + Hanken Grotesk via Google Fonts.

## Files in the running prototype (this project)
- `Translator Landing.html`, `app.jsx`, `tweaks-panel.jsx`, `assets/logo-navy.png`, `assets/cep-qr.png`, `assets/whatsapp-logo.png`.
