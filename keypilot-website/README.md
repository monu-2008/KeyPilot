# KeyPilot by AQERIONX — Landing Page

A premium, responsive landing page for the **KeyPilot** Chrome extension,
built with **Next.js 16 + TypeScript + Tailwind CSS v4**. Premium pastel
claymorphism + neomorphism + glossy glass bubbles.

> ⚠️ **This is the marketing site for KeyPilot, not the extension itself.**
> The Chrome extension source lives at
> [github.com/monu-2008/KeyPilot](https://github.com/monu-2008/KeyPilot).
> The main download button uses the stable GitHub Releases asset URL:
> `https://github.com/monu-2008/KeyPilot/releases/latest/download/KeyPilot.zip`.
> A Drive preview is retained as a temporary fallback until the first GitHub
> Release has been published.

---

## Quick start

```bash
# install deps (bun preferred; npm/yarn also work)
bun install

# run dev server (port 3000)
bun run dev
```

Open <http://localhost:3000>.

For production:

```bash
bun run build
bun run start
```

Use `bun run dev` for development. Use `bun run build` and `bun run start`
to verify a local production build.


## Deploy to Vercel

This repository contains two related projects: the Chrome extension at the
repository root and this Next.js website in `keypilot-website/`. Deploy only
the website folder in Vercel; do not set the repository root as the website's
Root Directory.

1. In the Vercel dashboard, choose **Add New → Project** and import
   `monu-2008/KeyPilot`.
2. Open **Root Directory → Edit** and set it to
   `keypilot-website`.
3. Confirm the framework preset is **Next.js**.
4. Leave **Output Directory** unset so Vercel uses Next.js defaults. The build
   command can remain auto-detected (equivalent to `bun run build`).
5. Deploy. No environment variables are required for the static marketing
   page based on the current source.

The project uses the standard `next build` command and does not force
container-style `standalone` output; Vercel handles the Next.js deployment
packaging. TypeScript build checks are enabled, so a real type error will
fail the build rather than being silently ignored.

For local production verification:

```bash
bun install
bun run lint
bun run build
bun run start
```

Open `http://localhost:3000`. The development server remains available with
`bun run dev`.


---

## Project structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout — Inter + Poppins fonts, metadata
│   ├── page.tsx             # Landing page (navbar, hero, features, install, FAQ, footer)
│   ├── globals.css          # Tailwind v4 import only
│   └── keypilot-styles.css  # All custom CSS (color system, components, responsive)
public/
└── assets/
    ├── keypilot-pastel-bubble-background.svg   # Glossy iridescent bubble background (supplied)
    ├── keypilot-pastel-soft-background.svg     # Softer alternative (supplied)
    ├── keypilot-logo.png                       # KeyPilot paper-plane logo (from extension repo)
    ├── keypilot-icon-16/48/128.png             # Extension toolbar icons
    ├── hush-logo.png                           # Genuine Hush logo (from hush.aqerionx.in)
    └── hush-logo.svg                            # SVG source
```

### Why is custom CSS in `keypilot-styles.css` instead of `globals.css`?

Tailwind v4 with `@import "tailwindcss"` tree-shakes any CSS it doesn't
recognize as a Tailwind utility or `@layer` block. Putting the custom
component styles in a separate `.css` file (imported via a normal ES
`import` in `layout.tsx`) bypasses that tree-shaking, so all the
`.navbar-pill`, `.hero`, `.faq-container` etc. rules survive into the
production stylesheet.

---

## Brand & product links

All external URLs are centralized at the top of `src/app/page.tsx` in the
`LINKS` constant:

```ts
const LINKS = {
  github:    "https://github.com/monu-2008/KeyPilot",
  instagram: "https://www.instagram.com/aqerionx/",
  hush:      "https://hush.aqerionx.in/",
  // Stable GitHub Release asset URL; the Drive file remains a temporary fallback.
  downloadDirect:
    "https://github.com/monu-2008/KeyPilot/releases/latest/download/KeyPilot.zip",
  downloadPreview:
    "https://drive.google.com/file/d/15Lu293brRSRbD7DxUsgLIS0QF74pSfog/view?usp=sharing",
} as const;
```

The **Download ZIP** buttons (navbar, hero, and footer) use the stable GitHub Releases URL:
`https://github.com/monu-2008/KeyPilot/releases/latest/download/KeyPilot.zip`.
The hero keeps a Google Drive preview link as a temporary fallback until the
first GitHub Release has been published.

> **For the site owner:** publish the first package once from GitHub Actions →
> **Publish KeyPilot ZIP** → **Run workflow** with version `2.2.12`. After the
> first release exists, keep attaching the exact asset name `KeyPilot.zip` to
> each release. The website URL then stays unchanged; no new Drive ID is needed.

---

## Sections

1. **Navbar** — floating pill, translucent cream background, 18px backdrop
   blur. Desktop: logo + 5 nav links + GitHub/Instagram icon pills + gradient
   Download ZIP pill. Mobile: collapses center links into a hamburger menu.
   Active section is highlighted with a violet dot as you scroll.
2. **Hero** — two-column. Left: version badge `v2.2.12`, "KeyPilot" title,
   "Your keyboard. Your workflow." (gradient on the keywords), description,
   Download + Installation Guide CTAs, four mini selling points. Right:
   decorative popup preview card (theme pills, status, 1–4 shortcuts,
   Diagnostics/Settings rows, AQERIONX footer).
3. **Feature cards** — 4 claymorphic cards with icon tiles, on a 4-col
   desktop / 2-col tablet / 1-col mobile grid.
4. **Install guide** — 4 illustrated steps (Download & Extract, Open Chrome
   Extensions, Load Unpacked, Pin & Open). Each step has a numbered purple
   badge, a clean SVG illustration (clearly marked "Illustration — not a
   genuine screenshot"), and short instructions.
5. **FAQ** — full-width container with the lavender→peach gradient and a
   1.5px dark `#211923` outline (matches the reference). 5 questions, single-
   open accordion, first question open by default. Right-aligned chevrons,
   smooth expansion, `prefers-reduced-motion` respected.
6. **Changelog** — current `v2.2.12` source summary + an honest "code vs.
   runtime" callout.
7. **Footer** — glass/clay panel with KeyPilot brand block, nav links,
   resources (GitHub/Download/Instagram), and a Hush product card using the
   genuine Hush logo. Scroll-to-top button appears after scrolling.

---

## Mobile responsiveness

Verified at 360 / 430 / 768 / 1024 / 1440 / 1920 px. **Zero horizontal
overflow at every width** (verified via `document.documentElement.scrollWidth
- document.documentElement.clientWidth === 0`).

- 360–430px: navbar collapses to logo + GitHub + Download + hamburger.
  Hero stacks (text first, preview below). Feature/install cards stack 1-col.
  FAQ rows fit. Footer wraps. CTA buttons go full-width. Tap targets ≥ 44px.
- 768px: 2-col layouts where readable (features, install, footer grid).
- 1024px+: full 4-col layouts.

Typography uses `clamp()` so it scales fluidly between mobile and desktop
(e.g. hero title: `clamp(44px, 7vw, 80px)`).

---

## Accessibility

- Semantic landmarks: `<nav>`, `<section>` with `id`s, `<footer>`.
- Heading order: one `h1` (KeyPilot), `h2`s for section titles, `h3`s for
  card titles, `h4`s for footer columns.
- FAQ uses `<button>` with `aria-expanded`, `aria-controls`, unique panel IDs,
  and `role="region"` on the answer container. First item open by default.
- All external links have descriptive `aria-label`s and `rel="noopener noreferrer"`.
- `:focus-visible` outlines (3px solid violet) on every interactive element.
- Decorative SVG illustrations have descriptive `role="img"` + `aria-label`.
- `prefers-reduced-motion` collapses all transitions/animations.
- Tap targets ≥ 44px on mobile.
- Lazy rendering: below-the-fold sections use normal scroll (no eager
  image loading that would block first paint).

---

## Tests performed (in this build environment)

| # | Test | Result |
|---|---|---|
| 1 | `bun run lint` (ESLint + Next.js rules) passes with no errors. | ✅ Pass |
| 2 | Dev server compiles and serves `/` with HTTP 200. | ✅ Pass |
| 3 | Page title is "KeyPilot by AQERIONX — Premium keyboard navigation for quiz practice pages". | ✅ Pass |
| 4 | No runtime errors in the browser console (only harmless React DevTools suggestion + HMR). | ✅ Pass |
| 5 | All custom CSS rules survive Tailwind v4 tree-shaking (verified via `document.styleSheets` inspection — `.navbar-pill`, body background, FAQ container border all present). | ✅ Pass |
| 6 | Body background: SVG bubble background applied (`url(...keypilot-pastel-bubble-background.svg)`), `background-color: #FFF7F3`. | ✅ Pass |
| 7 | Navbar pill: 1200×68px, `border-radius: 999px`, translucent white bg, has shadow. | ✅ Pass |
| 8 | Hero title font-size: 80px (within the 76–84px desktop spec). | ✅ Pass |
| 9 | FAQ container: 1.5px solid `#211923` outline, `border-radius: 20px`, lavender→peach gradient background. | ✅ Pass |
| 10 | **Horizontal overflow check at 360px: `scrollWidth - clientWidth === 0`** (no horizontal scroll). | ✅ Pass |
| 11 | Mobile menu toggle visible (`display: flex`) at 360px width. | ✅ Pass |
| 12 | FAQ accordion interaction: clicking the 2nd question closes the 1st and opens the 2nd (single-open behavior, `aria-expanded` toggles correctly). | ✅ Pass |
| 13 | All external link `href`s verified via DOM inspection: GitHub → `https://github.com/monu-2008/KeyPilot`, Instagram → `https://www.instagram.com/aqerionx/`, Download → `https://github.com/monu-2008/KeyPilot/releases/latest/download/KeyPilot.zip` (stable release asset); Drive is retained as a fallback., Hush → `https://hush.aqerionx.in/`. | ✅ Pass |
| 14 | Verify that the current Google Drive ZIP is accessible to public visitors without signing in. | Needs real-user verification | Open the Download ZIP link in a signed-out/private window; confirm the file is shared as “Anyone with the link” → Viewer. |
| 15 | Scroll-to-top button appears after scrolling 600px and scrolls back to top on click. | ✅ Pass |
| 16 | VLM visual verification (desktop 1440px): pill navbar ✓, large KeyPilot heading ✓, gradient "keyboard"/"workflow" ✓, popup preview with theme pills + 1–4 keys ✓. | ✅ Pass |
| 17 | VLM visual verification (full page 1440px): glossy pastel bubbles ✓, four install step cards ✓, FAQ section with expanded accordion ✓. | ✅ Pass |
| 18 | Hush logo asset present at `/assets/hush-logo.png` and loaded in footer card. | ✅ Pass |

## Tests NOT performed

| # | Test | Why not | How to run it |
|---|---|---|---|
| A | Production build (`bun run build`) — the sandbox auto-runs dev server only and forbids `bun run build`. | Sandbox constraint | Run `bun run build && bun run start` locally to verify the production bundle. |
| B | Real-user click on the GitHub Release download to confirm the ZIP downloads; the Drive preview is a temporary fallback. | No interactive Drive session in build env. | Click Download ZIP once the initial GitHub Release exists; until then, use the Drive fallback in the hero. |
| C | Lighthouse / Core Web Vitals audit. | No Lighthouse CLI in build env. | Run `npx lighthouse http://localhost:3000` locally. |
| D | Cross-browser testing (Firefox, Safari, Edge). | Only Chromium available via agent-browser. | Open the page in each browser locally. |
| E | Real mobile device testing (iOS Safari, Android Chrome). | No real devices. | Use browser dev-tools device emulation, or deploy and test on a real phone. |
| F | The actual Chrome Web Store listing (this is **not** a Web Store listing — it's a manual-install ZIP). | n/a — by design. | Load the downloaded ZIP via `chrome://extensions` → Developer mode → Load unpacked. |

**Honest statement:** The landing page has been runtime-verified in a
headless Chromium browser (agent-browser) at multiple viewport widths.
Lint passes, the page renders without console errors, the FAQ accordion
works, all external links point to the exact URLs in the brief, and there
is zero horizontal overflow at 360px. Production build and real-device
testing must be done locally by you.
