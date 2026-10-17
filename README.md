# KeyPilot by AQERIONX (Chrome MV3, v2.1.0)

A minimal Manifest V3 Chrome extension that lets you pick quiz answer
options with the keyboard keys `1`–`4`. It works on standard radio inputs,
on the "hidden radio + visible label" pattern used by modern styled forms,
on accessible custom radio widgets, and on the portal-specific DOM
structure reported in the inspection report
(`[data-testid="card"]` → `[data-testid="radioGroupOptions"]` →
`label.radioButtonLabel` → hidden `input[type="radio"]`).

It **does not auto-submit on live graded or monitored quizzes** — the
portal's existing Submit/Next button stays under your control. An optional
Enter / Space-to-submit shortcut is hard-gated to local practice pages only.

> ⚠️ **Compatibility notice.** The portal-specific selectors are based on
> a **reported** DOM inspection. They have **not** been verified on the
> actual live portal. Test on the included `practice-quiz-portal.html`
> first. If it works there but not on the real portal, the DOM has changed
> — see "Verifying selectors on the real portal" below.

---

## Table of contents

1. [What changed in v2.1.0 (three themes + Explore AQERIONX footer)](#what-changed-in-v210-three-themes--explore-aqerionx-footer)
2. [What changed in v2.0.0 (KeyPilot rebrand)](#what-changed-in-v200-keypilot-rebrand)
3. [What changed in v1.3.0 (AQERIONX redesign)](#what-changed-in-v130-aqerionx-redesign)
4. [What changed in v1.2.0 (portal DOM fixes)](#what-changed-in-v120-portal-dom-fixes)
5. [Files in this project](#files-in-this-project)
6. [Permissions — what they do and why](#permissions--what-they-do-and-why)
7. [Installation on Windows (VS Code + Chrome)](#installation-on-windows-vs-code--chrome)
8. [Theme management (three themes)](#theme-management-three-themes)
9. [Settings panel](#settings-panel)
10. [Using it](#using-it)
11. [Enter / Space-to-submit (practice mode only)](#enter--space-to-submit-practice-mode-only)
12. [Diagnostics center](#diagnostics-center)
13. [Explore AQERIONX footer (Hush, Instagram, GitHub)](#explore-aqerionx-footer-hush-instagram-github)
14. [Testing procedure — portal DOM (practice-quiz-portal.html)](#testing-procedure--portal-dom-practice-quiz-portalhtml)
15. [Testing procedure — generic patterns (practice-quiz.html)](#testing-procedure--generic-patterns-practice-quizhtml)
16. [Test checklist](#test-checklist)
17. [Debugging guide](#debugging-guide)
18. [Verifying selectors on the real portal](#verifying-selectors-on-the-real-portal)
19. [Customizing option detection](#customizing-option-detection)
20. [Publishing to GitHub](#publishing-to-github)
21. [Configuring external links (Hush, Instagram, GitHub)](#configuring-external-links-hush-instagram-github)
22. [Compatibility limitations (honest)](#compatibility-limitations-honest)
23. [Privacy](#privacy)
24. [Test results (v2.1.0)](#test-results-v210)

---

## What changed in v2.1.0 (three themes + Explore AQERIONX footer)

The two-theme design (Cream Luxury + Dark) was replaced with **three fully
designed themes**, a **pill-shaped navbar theme selector**, an **Explore
AQERIONX footer** with a genuine Hush product card, and an **Instagram
link** using the official `@aqerionx` profile URL. Space-to-submit was
added alongside Enter-to-submit, with safety guards against double-fire
and accidental Next activation.

| # | Change | File(s) | Why |
|---|---|---|---|
| 1 | **Three themes replace two.** Peach Cream Clay (default), Midnight Gradient, Lavender Glass Clay — each a fully designed palette, not a recolour of another. | `popup.css` | Brief required three selectable themes with distinct visual directions. |
| 2 | **Pill-shaped navbar with three-theme selector.** Three compact pills (Peach / Midnight / Lavender) in the navbar. Active theme gets the brand gradient. Both the pill selector and the Settings `<select>` stay in sync and persist via `chrome.storage.local`. | `popup.html`, `popup.css`, `popup.js` | Brief required a compact pill selector in the navbar. |
| 3 | **Explore AQERIONX footer.** New section with: (a) Hush product card — genuine logo + name + subtitle + URL label + external arrow; (b) Instagram pill — Instagram icon + "Instagram" + "@aqerionx"; (c) GitHub pill — GitHub icon + "GitHub" (disabled until URL configured). | `popup.html`, `popup.css`, `popup.js` | Brief required the footer with Hush card + Instagram + GitHub links. |
| 4 | **Genuine Hush logo integrated.** Downloaded from the live site `https://hush.aqerionx.in/icon.svg` (referenced in the site's `<link rel="icon">` and PWA manifest). Saved locally as `icons/hush-logo.svg` + PNG fallback at `icons/hush-logo.png`. The Hush card uses the PNG for crisp rendering in all themes. | `icons/hush-logo.svg`, `icons/hush-logo.png`, `popup.html` | Brief required the genuine Hush logo, not a generic icon. Verified via web-reader fetch + VLM that it's a lowercase "h" on a dark rounded square with violet/cyan glow. |
| 5 | **Official Instagram URL wired.** `INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/aqerionx/'` — the official AQERIONX Instagram profile. Opens via `chrome.tabs.create`. The Instagram pill uses a refined Instagram gradient (`#F58529 → #DD2A7B → #8134AF → #515BD4`) on hover that complements the brand gradient. | `popup.js`, `popup.css` | User supplied the official URL; brief required a polished Instagram pill. |
| 6 | **Space-to-submit added.** Enter AND Space both trigger the submit button in practice mode. Safety: 800ms debounce prevents Enter+Space from both firing; never activates Next as a side effect; requires an answer selected (when options exist); never clicks disabled buttons; ignores repeats. | `content.js` | Brief required Enter and Space to both work in practice mode. |
| 7 | **`hasSelectedAnswer()` guard.** Submit-by-keyboard requires an answer to be selected when the question has options. Prevents triggering an error state on quizzes that reject empty submissions. | `content.js` | Brief required "do not submit if no answer is selected when a selection is required." |
| 8 | **Next-button safety.** If the only available button is labeled "Next" (not "Submit"), practice-mode submit does NOT click it. Prevents accidental Next activation. | `content.js` | Brief required "never activate Next as a side effect of this feature." |
| 9 | **Footer simplified to AQERIONX · v2.1.0 + tagline.** The GitHub link moved up into the Explore AQERIONX section as a pill alongside Instagram. | `popup.html`, `popup.css` | Brief required the footer to show AQERIONX gradient wordmark + version + "Manual submission, always". |

**What was preserved unchanged from v2.0.0:**

- All keyboard selection logic (1–4 selects matching option).
- All portal-specific selectors.
- The native `HTMLInputElement.prototype.checked` setter for React compatibility.
- The duplicate-injection guard, `event.repeat` debounce, 400 ms same-key debounce.
- `allFrames: true` injection.
- Enable/Disable message API.
- Real-checks Diagnostics (loading/success/warn/error states, Copy Debug Report).
- Settings persistence (`chrome.storage.local` under `keypilot.*` keys).
- Manual submission only on live graded or monitored quizzes.

---

## What changed in v2.0.0 (KeyPilot rebrand)

The extension was renamed from "AQERIONX Quiz Navigator" to **KeyPilot by
AQERIONX**, given the supplied paper-plane logo as its primary brand mark,
and gained a Settings panel, an optional practice-mode Enter-to-submit
shortcut, a Copy Debug Report button, and a configurable GitHub footer
link. No existing functionality was removed.

| # | Change | File(s) | Why |
|---|---|---|---|
| 1 | **Rebrand to KeyPilot.** "KeyPilot" wordmark with gradient, "by AQERIONX" italic subtitle. | `manifest.json`, `popup.html`, `popup.css`, `content.js` | New product name per brief. |
| 2 | **Supplied paper-plane logo integrated.** The uploaded PNG is now the primary brand icon in the popup header (`<img src="icons/logo.png">`) and the source for all extension icons (16/48/128). Original shape, proportions, and purple color preserved. | `popup.html`, `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png`, `icons/logo.png` | Brief required using the supplied logo as the primary brand mark. |
| 3 | **Settings panel.** New collapsible section with: theme `<select>`, reduced-motion switch, Enter-to-submit switch, reset-to-defaults button. All persisted to `chrome.storage.local` under `keypilot.*` keys. | `popup.html`, `popup.css`, `popup.js` | Brief required a dedicated settings section. |
| 4 | **Enter-to-submit (practice mode only).** Pressing Enter clicks the visible Submit/Next button — but ONLY when (a) the user has enabled it in Settings AND (b) the page opts in via `<html data-keypilot-practice="true">`. Two-key gate: impossible to fire on a live graded or monitored quiz. | `content.js`, `practice-quiz-portal.html` | Brief allowed optional Enter-to-submit in an explicitly authorized practice environment. |
| 5 | **Copy Debug Report button.** Copies the full diagnostics report to the clipboard via `navigator.clipboard.writeText`, with a fallback to selecting the `<pre>` if the clipboard API is unavailable. | `popup.html`, `popup.js`, `popup.css` | Brief required a Copy Debug Report button. |
| 6 | **GitHub footer link.** Subtle GitHub icon + "View on GitHub" link in the footer. Uses a configurable `GITHUB_REPOSITORY_URL` constant in `popup.js`. Currently a documented placeholder (`''`) — the link is hidden until you set a real URL. Opens via `chrome.tabs.create` (the supported MV3 API), not `window.open`. | `popup.html`, `popup.js`, `popup.css` | Brief required a GitHub footer link. |
| 7 | **Diagnostics improvements.** Real checks (no hardcoded success). Loading/success/warn/error states with colored left-border status. Detects: active-tab URL, content-script injection status, question-container detection, option count, submit-button presence, practice-mode authorization. Clear errors when wrong tab is inspected. | `popup.js`, `content.js` | Brief required genuine diagnostics. |
| 8 | **Reduced-motion preference.** Beyond the OS-level `prefers-reduced-motion` media query, the user can now toggle reduced motion in Settings. Applies an `html.force-reduced-motion` class that collapses all animations. | `popup.css`, `popup.js` | Brief required a reduced-motion preference. |
| 9 | **Storage keys namespaced.** Theme key changed from `aqerionx.theme` to `keypilot.theme`. Added `keypilot.reducedMotion` and `keypilot.practiceSubmit`. Old `aqerionx.theme` key is orphaned (harmless; user can clear extension data if desired). | `popup.js` | Clean namespace for the new product. |

**What was preserved unchanged from v1.3.0/v1.2.0:**

- All keyboard selection logic (1–4 selects matching option).
- All portal-specific selectors (`[data-testid="card"]`, `[data-testid="radioGroupOptions"]`, `label.radioButtonLabel`, `[class*="BaseRadioButtonWrapper"]`).
- The native `HTMLInputElement.prototype.checked` setter for React compatibility.
- The duplicate-injection guard, `event.repeat` debounce, 400 ms same-key debounce.
- `allFrames: true` injection (same-origin iframes supported).
- Enable/Disable message API between popup and content script.
- `tabs.onActivated` and `tabs.onUpdated` listeners.
- Two complete themes (Cream Luxury Light default, Elegant Dark) via CSS variables.
- Theme persistence across popup openings.
- Manual submission only on live graded or monitored quizzes. No bypass of
  termination controls, no concealment of automation.

---

## What changed in v1.3.0 (AQERIONX redesign)

The extension was rebranded to **AQERIONX Quiz Navigator** and given a
premium UI with two complete themes. No functionality was removed — every
behavior from v1.2.0 (keyboard selection, enable/disable, diagnostics,
portal selectors, hidden-radio handling, React setter, duplicate-injection
guard) is preserved.

| # | Change | File(s) | Why |
|---|---|---|---|
| 1 | **Premium Cream Luxury Light theme (default).** Warm cream background, ivory glass surfaces, champagne borders, violet-lavender-cyan gradient accents, cream-toned neumorphic controls. | `popup.css` | New visual identity per the redesign brief. Light is the default for first-time users. |
| 2 | **Elegant Dark Mode.** Deep plum charcoal background, layered dark glass panels, muted lavender text, same brand gradient. Not a simple inversion — separate palette tokens. | `popup.css` | Full second theme, not an inversion. |
| 3 | **Theme switcher with persistence.** Neumorphic toggle in the header. Choice saved to `chrome.storage.local` under `aqerionx.theme`. Restored on popup open. Listens for storage changes from other contexts. | `popup.js`, `manifest.json` | Brief required theme persistence across sessions. |
| 4 | **`storage` permission re-added.** Was removed in v1.1.0 as unused. Now justified: stores only `aqerionx.theme` (a single string, "light" or "dark"). No other data stored. | `manifest.json` | Required for theme persistence. |
| 5 | **AQERIONX wordmark + lightning brand icon.** SVG lightning bolt with the violet-lavender-cyan gradient. Wordmark uses the same gradient via `background-clip: text`. | `popup.html`, `popup.css`, `icons/*.png` | New brand identity. Icons regenerated with the gradient bolt. |
| 6 | **Four premium shortcut cards.** Grid of 4 cards, each with a gradient-styled keyboard key (`<kbd>`) and concise description. Neumorphic raised surface, hover lift, focus ring. | `popup.html`, `popup.css` | Clearer keyboard shortcut presentation. |
| 7 | **Collapsible diagnostics panel.** Section header with chevron; panel reveals with a soft animation. Same `Run Diagnostics` behavior, same monospaced output. | `popup.html`, `popup.js` | Cleaner popup when diagnostics aren't needed; one click to expand. |
| 8 | **Better status card.** Two-line status (label + sub-label), animated pulsing dot when enabled, error state for browser-internal pages. | `popup.html`, `popup.css`, `popup.js` | Clearer active-tab feedback. |
| 9 | **Soft button feedback.** Primary button (gradient) lifts on hover, presses down on click. Secondary button (neumorphic) does the same with inset shadow on press. Loading label "Enabling…" while injecting. | `popup.css`, `popup.js` | Premium micro-interactions. |
| 10 | **`prefers-reduced-motion` respected.** All animations and transitions collapse to near-instant when the user has reduced motion enabled at the OS level. | `popup.css` | Accessibility. |
| 11 | **Popup width 348px.** Fits both Chrome and Brave popup windows with no horizontal scroll. Tested with diagnostics expanded. | `popup.css` | Responsive quality. |

**What was preserved unchanged:**

- All keyboard selection logic (`content.js` — no changes from v1.2.0).
- All portal-specific selectors (`[data-testid="card"]`, `[data-testid="radioGroupOptions"]`, `label.radioButtonLabel`, `[class*="BaseRadioButtonWrapper"]`).
- The native `HTMLInputElement.prototype.checked` setter for React compatibility.
- The duplicate-injection guard, `event.repeat` debounce, 400 ms same-key debounce.
- `allFrames: true` injection (same-origin iframes supported).
- Enable/Disable message API between popup and content script.
- `tabs.onActivated` and `tabs.onUpdated` listeners.
- Manual submission only — the extension never clicks Submit/Next.

---

## What changed in v1.2.0 (portal DOM fixes)

The previous version (v1.1.0) fixed the core hidden-radio and React bugs,
but it still couldn't find the question card on the reported portal because
the portal uses `div[data-testid="card"]` instead of `<fieldset>`,
`<form>`, or any of the generic selectors. The v1.2.0 changes are targeted
fixes based on the DOM inspection report:

| # | What was wrong                                                                                  | Fix in v1.2.0                                                                                                                                              |
|---|-------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1 | **Question container not found.** The portal uses `div[data-testid="card"]` — none of the v1.1.0 `QUESTION_SELECTORS` matched. Result: "no question container found," keys did nothing. | Added `[data-testid="radioGroupOptions"]` and `[data-testid="card"]` to the top of `QUESTION_SELECTORS`. The radio-group container is preferred (smaller, more precise); the card is the fallback. |
| 2 | **Visible wrapper not found.** The portal's radios are wrapped in `div.BaseRadioButtonWrapper-bjpxEr` (styled-components class with a build hash). The v1.1.0 `VISIBLE_WRAPPER_SELECTORS` had `label` but not the styled-components wrapper. | Added `label.radioButtonLabel` and `[class*="BaseRadioButtonWrapper"]` to `VISIBLE_WRAPPER_SELECTORS`. The `[class*=]` partial match survives hash-suffix changes between builds. |
| 3 | **`isInteractive` bug in `buildRadioOption`.** The expression `!radio.getAttribute('aria-disabled') === 'true'` was a no-op — `!` returns a boolean, `=== 'true'` compares it to a string, always `false`. So `aria-disabled` was never checked. | Replaced with a clear `if (radio.disabled) return false; if (radio.getAttribute('aria-disabled') === 'true') return false; return true;`. |
| 4 | **Diagnose output didn't show `data-testid`.** Hard to tell which element was picked as the "question." | Added `testid` field to the diagnose response and the `window.__quizKeyboardNav.diagnose()` debug method. |
| 5 | **No practice page reproducing the portal DOM.** Hard to verify the fix without access to the real portal. | Added `practice-quiz-portal.html` with the exact DOM structure from the report: `#root` → `#desktop-layout` → `[data-testid="card"]` → `[data-testid="radioGroupOptions"]` → `[class*="BaseRadioButtonWrapper"]` → `label.radioButtonLabel` → hidden `input[type="radio"]`. Includes a SUBMIT→NEXT button toggle to simulate React state. |

**What was NOT changed** (because v1.1.0 already fixed it correctly):

- The native `HTMLInputElement.prototype.checked` setter for React compatibility — still in place.
- The `event.repeat` + 400 ms debounce — still in place.
- The duplicate-injection guard (`window.__quizKeyboardNavInstalled`) — still in place.
- The `allFrames: true` injection — still in place.
- The popup diagnostics panel — still in place.

---

## Files in this project

```
quiz-keyboard-navigator/
├── manifest.json               # MV3 manifest; activeTab + scripting + storage. Name: "KeyPilot by AQERIONX", v2.0.0
├── content.js                  # Keyboard handler (1-4), Enter-to-submit (practice-gated), option detection, indicator
├── popup.html                  # KeyPilot layout: header (logo + wordmark + theme toggle), status, shortcuts, controls, diagnostics, settings, footer
├── popup.js                    # Theme + settings persistence, GitHub link, copy debug report, real diagnostics
├── popup.css                   # Cream Luxury Light (default) + Elegant Dark, glass + neumorphism + gradient
├── practice-quiz-portal.html   # Reproduces reported portal DOM; opts into Enter-to-submit via data-keypilot-practice="true"
├── practice-quiz.html          # 8 generic test cases (standard radios, ARIA, nested, etc.)
├── README.md                   # This file
└── icons/
    ├── icon16.png              # Paper-plane logo at 16×16 (generated from supplied logo)
    ├── icon48.png              # Paper-plane logo at 48×48
    ├── icon128.png             # Paper-plane logo at 128×128
    └── logo.png                # Full-res 1254×1254 brand asset (used in popup header)
```

---

## Permissions — what they do and why

| Permission    | Why it's needed                                                                              |
| ------------- | -------------------------------------------------------------------------------------------- |
| `activeTab`   | Access the currently focused tab so we can inject the script only there.                    |
| `scripting`   | Programmatically inject `content.js` into that one tab when you click **Enable**.           |
| `storage`     | Persist user preferences in `chrome.storage.local` under keys `keypilot.theme`, `keypilot.reducedMotion`, `keypilot.practiceSubmit`. No other data is stored. No network sync. |

**What this extension does NOT do:**

- Does **not** declare a `content_scripts` entry — `content.js` is never
  injected into any website automatically. It is only loaded into the
  single tab where you click **Enable**.
- Does **not** request `<all_urls>`, `host_permissions`, `tabs`, `webRequest`,
  `cookies`, `webNavigation`, or any other broad permission.
- Does **not** read answer content, send network requests, modify
  authentication, spoof activity, or interact with proctoring /
  anti-cheating / attempt-limit / session code.
- Does **not** auto-submit on live graded or monitored quizzes. The
  optional Enter-to-submit is hard-gated to local practice pages only
  (see [Enter-to-submit](#enter-to-submit-practice-mode-only)).
- Does **not** hide itself from the page or the user.
- Does **not** bypass termination controls or automation detection.

---

## Installation on Windows (VS Code + Chrome)

### Step 1 — Get the project files

Save the entire `quiz-keyboard-navigator/` folder somewhere easy to reach,
for example:

```
C:\Users\<YourName>\projects\quiz-keyboard-navigator\
```

Inside it you should see `manifest.json`, `content.js`, `popup.html`,
`popup.js`, `popup.css`, `practice-quiz-portal.html`,
`practice-quiz.html`, `README.md`, and an `icons/` subfolder.

### Step 2 — (Optional) Open in VS Code

1. Open VS Code.
2. `File` → `Open Folder…` → pick the `quiz-keyboard-navigator` folder.
3. You can edit any file here. To enable better JS support:
   `Extensions` (`Ctrl+Shift+X`) → search **ESLint** → Install. (Optional.)

### Step 3 — Load it into Chrome

1. Open Chrome.
2. In the address bar, type `chrome://extensions` and press Enter.
3. In the top-right corner of that page, toggle **Developer mode** ON.
4. Three buttons appear at the top-left: **Load unpacked**, **Pack
   extension**, **Update**. Click **Load unpacked**.
5. In the folder picker, navigate to
   `C:\Users\<YourName>\projects\quiz-keyboard-navigator\` and click
   **Select Folder**.
6. The extension card appears in the list. The card will show "AQERIONX
   Quiz Navigator" with the new lightning icon.
7. Pin the extension to the toolbar:
   - Click the puzzle-piece icon in the toolbar.
   - Find "AQERIONX Quiz Navigator".
   - Click the pin icon next to it.

### Step 4 — Reload after editing files

Whenever you change `manifest.json`, `content.js`, `popup.html`, `popup.js`,
or `popup.css`:

1. Go back to `chrome://extensions`.
2. Find the "AQERIONX Quiz Navigator" card.
3. Click the circular **reload** arrow on its card.
4. Refresh any open quiz page (`Ctrl+R`) so the new content script loads.
5. Re-open the popup and click **Enable** again (Enable state is per-tab
   and does not survive page reloads, by design).

---

## Theme management (three themes)

The popup supports three fully designed themes:

- **Peach Cream Clay** (default for first-time users) — warm ivory/peach/champagne
  background, soft claymorphic raised cards, gentle inset controls, violet-to-cyan
  gradient accents.
- **Midnight Gradient** — deep navy/plum/charcoal background, raised dark-clay
  cards, electric violet + cyan + pink accents, subtle luminous borders.
- **Lavender Glass Clay** — lavender/pale lilac/periwinkle background, frosted
  translucent cards with `backdrop-filter`, delicate white borders, soft
  lavender-to-cyan gradients behind selected elements.

### Switching themes

Click one of the three pills in the navbar:
**Peach** · **Midnight** · **Lavender**. The active pill shows the brand
gradient. Alternatively, expand the **Settings** section and use the
Theme `<select>`. Both controls stay in sync and update the popup immediately.

### Persistence

Your choice is saved to `chrome.storage.local` under the key
`keypilot.theme` (values: `peach`, `midnight`, `lavender`). When you
reopen the popup later (or in a new window), your saved theme is restored.
The `storage` permission is used for this — no other data is stored.

### Default for first-time users

Peach Cream Clay is selected by default. The popup applies the default
theme immediately on open before the storage read completes, so there's no
flash of unstyled content. If your saved preference is Midnight or
Lavender, the popup swaps within ~50 ms.

### Synced across windows

If you have the popup open in two windows (rare, but possible), changing
the theme in one updates the other via the `chrome.storage.onChanged`
listener.

---

## Explore AQERIONX footer (Hush, Instagram, GitHub)

Below the Settings accordion is the **Explore AQERIONX** section with three
links:

### Hush product card

A claymorphic card showing the genuine Hush logo (downloaded from
`https://hush.aqerionx.in/icon.svg`), the product name "Hush", the
subtitle "Private emoji & image messages", the URL label
`hush.aqerionx.in`, and an external-link arrow. Clicking the card opens
`https://hush.aqerionx.in/` in a new tab via `chrome.tabs.create`.

The Hush logo is a lowercase "h" in a serif font, on a dark rounded square
with blurred violet and cyan glow circles — matching the live site's
branding. It's saved locally as `icons/hush-logo.png` (with the source
SVG at `icons/hush-logo.svg`) so it renders crisply in all three themes.

### Instagram pill

A compact pill showing the Instagram glyph + "Instagram" + "@aqerionx".
On hover, the pill fills with the Instagram gradient
(`#F58529 → #DD2A7B → #8134AF → #515BD4`). Clicking opens the official
AQERIONX Instagram profile `https://www.instagram.com/aqerionx/` in a new
tab via `chrome.tabs.create`.

The URL is hardcoded in `popup.js` as `INSTAGRAM_PROFILE_URL` — no
placeholder, because the user supplied the official profile.

### GitHub pill

A compact pill showing the GitHub octocat icon + "GitHub". **Until you
publish the repository and set `GITHUB_REPOSITORY_URL` in `popup.js`,
this pill appears disabled (greyed out, not clickable).** Once configured,
clicking opens the repository URL in a new tab via `chrome.tabs.create`.

See [Configuring external links](#configuring-external-links-hush-instagram-github)
for how to set the GitHub URL.

---

## Using it

1. Open the quiz page (or `practice-quiz-portal.html`) you want to use it on.
2. Click the extension's toolbar icon to open the popup.
3. Click **Enable on this tab**. The status dot turns green.
4. Press `1`, `2`, `3`, or `4` to pick the corresponding answer option.
   A blue outline briefly appears around the option you selected.
5. Click the portal's own **Submit** (or **Next**) button when you're ready.
6. To stop the shortcuts, open the popup and click **Disable**.

Shortcuts are ignored:

- While focus is in a text input, textarea, or `contenteditable` element.
- When `Ctrl`, `Cmd`, or `Alt` are held (so browser shortcuts still work).
- When the same key is held down (only one selection per keypress).

---

## Settings panel

Open the **Settings** section (click the "Settings" header to expand). You can configure:

| Setting | What it does | Default | Storage key |
|---|---|---|---|
| **Theme** | Cream Luxury or Dark. Same as the header toggle — both stay in sync. | Cream Luxury | `keypilot.theme` |
| **Reduced motion** | Disables all animations and transitions, even if your OS doesn't have reduced motion enabled. | Off | `keypilot.reducedMotion` |
| **Enter to submit** | Enables Enter-to-submit on practice pages only. See [Enter-to-submit](#enter-to-submit-practice-mode-only). | Off | `keypilot.practiceSubmit` |
| **Reset to defaults** | Clears all three keys from `chrome.storage.local` and restores defaults. | — | — |

All settings are persisted to `chrome.storage.local` and restored when the popup reopens. Changes propagate to other open popup windows via the `chrome.storage.onChanged` listener.

---

## Enter / Space-to-submit (practice mode only)

KeyPilot can optionally click the Submit button when you press `Enter` OR `Space` — but only under strict conditions:

**Two-key gate (both must be true):**

1. The user has enabled **"Enter / Space to submit"** in the popup Settings.
2. The current page opts in via `<html data-keypilot-practice="true">`.

If either condition is false, pressing Enter or Space does nothing related to KeyPilot (the page's own handling, if any, is left untouched). This ensures keyboard submission is **impossible** on a live graded or monitored quiz, even if the user accidentally leaves the setting on.

**Safety guards:**

- **No double-fire:** An 800ms debounce prevents Enter+Space from both firing on the same question.
- **No Next activation:** If the only available button is labeled "Next" (not "Submit"), practice-mode submit does NOT click it.
- **No empty submission:** If the question has options but none is selected, submit is blocked (the console logs the reason).
- **No disabled buttons:** Disabled or `aria-disabled` buttons are never clicked.
- **No repeats:** `event.repeat` (holding the key) is ignored.
- **No typing-field triggers:** Ignored while focus is in an input/textarea/contenteditable.
- **No modifier combos:** Ignored when Ctrl/Cmd/Alt is held.

**Pages that opt in:**

- `practice-quiz-portal.html` (the included local practice file) — already has `data-keypilot-practice="true"` on its `<html>` tag.
- Any local HTML file you author that adds `<html data-keypilot-practice="true">`.

**Pages that NEVER opt in:**

- The real portal (it doesn't set this attribute).
- Any third-party quiz platform.
- Any page you didn't author.

**How to test it:**

1. Open `practice-quiz-portal.html` in Chrome.
2. Open the KeyPilot popup → **Enable on this tab**.
3. Expand **Settings** → toggle **Enter / Space to submit** ON.
4. Press `2` to select an option; the button should become enabled and remain labelled SUBMIT.
5. Press `Enter` (or `Space`) on this local practice page. SUBMIT should be activated and the page should change the label to NEXT.
6. Press Enter/Space again; the extension must not activate NEXT. Open DevTools Console to inspect the result.

To verify the gate works, try the same on a non-practice page (e.g. any normal website) — pressing Enter/Space should do nothing related to KeyPilot, and the console will log `Enter pressed but practice mode is not authorized on this page.`

---

## Diagnostics center

The Diagnostics section is collapsible. Click the **Diagnostics** header to expand it.

**What it shows (all based on real checks, never hardcoded):**

| Field | How it's checked |
|---|---|
| Active-tab URL | Read from `chrome.tabs.query` result; if the URL is a browser-internal scheme (`chrome://`, store, PDF viewer), an error state is shown. |
| Content-script injection status | `chrome.tabs.sendMessage(tabId, { type: 'status' })`. If this rejects, the script isn't injected. |
| Question-container detection | The content script runs `getCurrentlyVisibleQuestion()` and returns the matched element's tag, `data-testid`, role, class, and id. If null, a warn state is shown. |
| Detected option count | The content script runs `getOptionsForQuestion()` and returns the count. If 0, a warn state is shown. |
| Per-option description | Each option's tag, name, value, and visible wrapper are listed. |
| Submit-button presence | The content script runs `findSubmitButton()` and reports whether one was found. |
| Practice-mode authorization | Reports `practiceSubmitSetting` (user toggle) and `practicePageAuthorized` (page opt-in). |

**States:**

- **Loading** — "Running diagnostics…" while waiting for the content script to respond.
- **Success (ok)** — green left-border: question found, options > 0.
- **Warning (warn)** — amber left-border: question not found, OR 0 options detected. Includes troubleshooting guidance.
- **Error (error)** — red left-border: cannot inspect this page, OR content script not injected, OR message-passing failed. Includes the actual error message and suggested next step.

**Copy Debug Report button:**

After a successful diagnostics run, the **Copy Debug Report** button becomes enabled. Click it to copy the full report (including timestamp, extension version, content version, URL, question descriptor, option count, and per-option descriptors) to your clipboard. If `navigator.clipboard.writeText` fails (e.g. clipboard permission denied), the report `<pre>` is auto-selected so you can press Ctrl+C manually.

**Clear errors when wrong tab is inspected:**

If you open DevTools on the wrong tab (e.g. the popup's DevTools instead of the page's), the diagnostics will report `Cannot inspect this page` or `Content script is not injected on this tab.` with a clear instruction to click **Enable on this tab** first.

---

## Testing procedure — portal DOM (practice-quiz-portal.html)

This is the **most important test** for verifying the portal fixes.

### Step 1 — Open the practice file

Double-click `practice-quiz-portal.html` in Windows Explorer, or drag it
from VS Code into Chrome. The URL bar will show
`file:///C:/Users/.../practice-quiz-portal.html`.

### Step 2 — Enable the extension

Click the extension's toolbar icon → **Enable on this tab**. The status
dot turns green.

### Step 3 — Run the portal tests

| # | Test                              | Action                                              | Expected result                                                                                          |
|---|-----------------------------------|-----------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| 1 | Standard portal question (4 options) | Press `2`                                          | "Paris" selected. The wrapper gets `.is-checked`, the custom radio circle fills in, the button changes from SUBMIT to NEXT. Verify panel turns green. |
| 2 | Disabled option at position 2     | Press `2` → nothing. Then press `3`.                | Pressing `2` does nothing (console logs "not interactive"). Pressing `3` selects "11". Verify turns green. |
| 3 | Text-input protection             | Click into the text field, type `1234`            | Field fills with `1234`. No radio changes. Verify turns green.                                            |
| 4 | Dynamic question rendering        | Click "Render dynamic question", then press `2`   | The dynamically injected question's second option ("1") is selected. Verify turns green.                 |
| 5 | Enable/Disable/duplicate-injection | Follow the 5 steps on the page                     | Each keypress produces exactly one selection. Disable truly stops shortcuts.                            |

### Step 4 — Watch the diagnostics

Open DevTools (`F12`) → **Console**. You should see:

```
[Quiz Keyboard Navigator] Content script v1.2.0 ready. Press 1-4 to select options.
[Quiz Keyboard Navigator] Key 2 → question had 4 option(s). Selecting index 1.
[Quiz Keyboard Navigator] Selected <input type=radio name="q1" value="paris"> via <label class="radioButtonLabel"> | wasSelected=false | nowSelected=true | verified=true
```

Also click **Run diagnose** in the popup. You should see:

```
enabled:    true
version:    1.2.0
url:        file:///.../practice-quiz-portal.html
question:   div[data-testid="radioGroupOptions"]
options:    4
  [1] <input type=radio name="q1" value="lyon"> via <label class="radioButtonLabel">
  [2] <input type=radio name="q1" value="paris"> via <label class="radioButtonLabel">
  [3] <input type=radio name="q1" value="nice"> via <label class="radioButtonLabel">
  [4] <input type=radio name="q1" value="marseille"> via <label class="radioButtonLabel">
```

If the diagnose output shows `question: (none found)` or `options: 0`,
the selectors don't match — see "Verifying selectors on the real portal."

---

## Testing procedure — generic patterns (practice-quiz.html)

`practice-quiz.html` covers 8 generic test cases that aren't portal-specific.
Use it to verify the extension still works on standard HTML forms, ARIA
radios, nested markup, etc.

| # | Test                                       | Action                                                          | Expected result                                                                                  |
|---|--------------------------------------------|-----------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| 1 | Standard visible radios                    | Press `2`                                                       | Second radio ("20") selected. Verify panel turns green.                                            |
| 2 | Hidden radios + visible labels             | Press `3`                                                       | "Nice" label highlights. Verify panel turns green.                                                |
| 3 | Accessible custom radios (ARIA)             | Press `1`                                                       | "Earth" gets `aria-checked="true"` and highlight. Verify panel updates.                          |
| 4 | Nested option markup                        | Press `4`                                                       | "Yellow" selected. Important: exactly 4 options should be detected, not 8.                         |
| 5 | Disabled option is skipped                 | Press `2`                                                       | Nothing happens (the disabled radio isn't selected). Then press `3` → "11" selected.               |
| 6 | Text-input keyboard protection              | Click into the text field, type `1234`                         | Field fills with `1234`. None of the Q6 radios change. Verify panel turns green.                  |
| 7 | Dynamic question rendering                 | Click "Render question" button, then press `2`                 | The dynamically added question's second option ("1") is selected.                                  |
| 8 | Enable / Disable / duplicate-injection      | Follow the 5 steps printed on the page                          | Each keypress produces exactly one selection (count the change events in the log). Disable truly stops shortcuts. |

---

## Debugging guide

### "Shortcuts do nothing"

1. Open the quiz page.
2. Open DevTools (`F12` or `Ctrl+Shift+I`).
3. Go to the **Console** tab.
4. Click the small dropdown at the top-left of the Console that says
   **top** (or **`<page url>`**).
5. In that dropdown you should see:
   - `top` — the page's main world.
   - `Quiz Keyboard Navigator` — the content script's isolated world.
6. Select `top` (the default) and reload the page. After clicking
   **Enable** in the popup, you should see in the console:
   ```
   [Quiz Keyboard Navigator] Content script v1.2.0 ready. Press 1-4 to select options.
   ```
   If you don't see it, the script wasn't injected — re-open the popup
   and click **Enable** again. If you see an error like "Cannot access
   contents of the page," you're on a browser-internal URL (`chrome://`)
   or the Chrome Web Store, where Chrome blocks content scripts.

7. Press `2` on the quiz page. In the console you should see a line like:
   ```
   [Quiz Keyboard Navigator] Key 2 → question had 4 option(s). Selecting index 1.
   [Quiz Keyboard Navigator] Selected <input type=radio ...> via <label class="radioButtonLabel"> | verified=true
   ```
   If you see "no question container found," the page's question markup
   doesn't match any selector in `QUESTION_SELECTORS` in `content.js`.
   See [Verifying selectors on the real portal](#verifying-selectors-on-the-real-portal).

8. If you see "Selection not verified. Reason: click_attempted_state_not_verified,"
   the option was clicked but its `checked` / `aria-checked` state didn't
   update. This usually means the page's framework intercepts the click
   but didn't update the DOM as expected. Inspect the element in DevTools
   to see what attributes it uses for selection state.

### Inspecting `window.__quizKeyboardNav` from the console

**Important:** Content scripts in Manifest V3 run in an **isolated world**.
`window.__quizKeyboardNav` is NOT visible from the page's default console
context. To inspect it:

1. Open DevTools (`F12`).
2. Go to the **Console** tab.
3. At the top-left of the Console, click the dropdown that says `top`.
4. Select **Quiz Keyboard Navigator** from the dropdown.
5. Now run:
   ```js
   window.__quizKeyboardNav.diagnose()
   ```
   Output looks like:
   ```js
   {
     enabled: true,
     version: "1.2.0",
     url: "https://your-quiz-page/...",
     question: "div[data-testid=\"radioGroupOptions\"]",
     optionCount: 4,
     options: [
       "<input type=radio name=\"q1\" value=\"lyon\"> via <label class=\"radioButtonLabel\">",
       ...
     ]
   }
   ```

If the **Quiz Keyboard Navigator** entry doesn't appear in the dropdown,
the content script isn't injected into this page. Re-open the popup and
click **Enable**.

### Inspecting the popup itself

1. Click the extension icon to open the popup.
2. Right-click inside the popup → **Inspect**.
3. The popup's own DevTools window opens. Use the Console tab to debug
   `popup.js`.

### Verifying no duplicate listeners

1. In the page console, switch context to **Quiz Keyboard Navigator**
   (see above).
2. Run:
   ```js
   window.__quizKeyboardNavInstalled  // should be true even after multiple Enables
   ```
3. To stress-test: open the popup → click **Enable** five times in a row.
   Close the popup. Press `2` exactly once on the page. In the console,
   you should see **exactly one** "Selected …" log line, not five.

### Common errors and what they mean

| Error message in console                                                       | Meaning                                                                                             |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `Could not establish connection. Receiving end does not exist.`                | Content script isn't injected yet. Click **Enable** in the popup.                                   |
| `Cannot access contents of the page. Extension manifest must request permission.` | You're on a `chrome://` URL, the Chrome Web Store, or a PDF viewer. Open a normal web page.        |
| `[Quiz Keyboard Navigator] Key 2 pressed but no question container found.`     | No element matches `QUESTION_SELECTORS`. Verify the portal's DOM (see below).                     |
| `[Quiz Keyboard Navigator] Key 2 pressed but no options found in question.`    | Question was found, but no radios inside. Verify the option selectors.                             |
| `Selection not verified. Reason: click_attempted_state_not_verified`          | Click fired but the option's `checked` state didn't update. Usually a framework-controlled widget. |

---

## Verifying selectors on the real portal

The portal-specific selectors in v1.2.0 are based on a **reported** DOM
inspection. Before trusting them on the real portal, verify:

### Step 1 — Inspect the real DOM

1. Open the real quiz page in Chrome.
2. Open DevTools (`F12`) → **Elements** tab.
3. Right-click the quiz question text → **Inspect**.
4. In the Elements tree, look for the ancestor elements. You should see:
   ```
   #root
   └── #desktop-layout
       └── div[data-testid="card"]
           ├── div[class*="QuestionContent"]
           ├── div[data-testid="radioGroupOptions"]
           │   └── div[class*="BaseRadioButtonWrapper"]
           │       └── label.radioButtonLabel
           │           └── input[type="radio"]
           └── button (SUBMIT / NEXT)
   ```

### Step 2 — Run the diagnose button

1. Click the extension icon → **Enable on this tab**.
2. Click **Run diagnose**.
3. Check the output:
   - `question` should show `div[data-testid="radioGroupOptions"]` or
     `[data-testid="card"]`.
   - `optionCount` should be 4 (or however many options the question has).
   - Each option should show `via <label class="radioButtonLabel">`.

If the diagnose output shows a different element as the question, or 0
options, the portal's DOM has changed since the report. Update the
selectors in `content.js`:

```js
const QUESTION_SELECTORS = [
  '[data-testid="radioGroupOptions"]',   // ← verify this on the real page
  '[data-testid="card"]',                // ← verify this on the real page
  // ... generic fallbacks
];

const VISIBLE_WRAPPER_SELECTORS = [
  'label',
  'label.radioButtonLabel',              // ← verify this on the real page
  '[class*="BaseRadioButtonWrapper"]',   // ← verify this on the real page
  // ... generic fallbacks
];
```

### Step 3 — DOM details that still need verification

These were reported but not independently confirmed:

- **Whether `div.BaseRadioButtonWrapper-bjpxEr` is the direct parent of
  `label.radioButtonLabel`, or if there's an intermediate wrapper.** The
  extension handles both cases via `radio.closest('label')`, but if the
  label is a sibling (not an ancestor) of the radio, you may need to add
  a `<label for="...">` lookup. The current code already handles this.
- **Whether the radio is truly hidden (`opacity:0`) or visually rendered.**
  The extension handles both — hidden radios are returned without a
  visibility filter.
- **Whether `data-testid="card"` is unique to the quiz card or appears on
  other elements** (sidebar, header, etc.). The extension filters by "has
  options," so non-quiz cards are automatically excluded.
- **Whether the SUBMIT→NEXT button change affects the radio group.** The
  extension does not touch this button. If the portal re-renders the radio
  group when the button changes, the extension will detect the new radios
  on the next keypress (it queries the DOM every time).
- **Whether the portal uses a closed Shadow DOM.** If so, the extension
  cannot reach inside it. Check in DevTools Elements — if you see
  `#shadow-root (closed)`, the extension won't work without a different
  injection strategy.

---

## Customizing option detection

`content.js` looks for question containers via:

```js
const QUESTION_SELECTORS = [
  '[data-testid="radioGroupOptions"]',   // portal: answer container
  '[data-testid="card"]',                // portal: quiz card
  'fieldset',
  '[role="group"]',
  '[data-question]',
  '[data-question-id]',
  '.question',
  '.quiz-question',
  'form'  // last-resort
];
```

And visible wrappers for hidden radios via:

```js
const VISIBLE_WRAPPER_SELECTORS = [
  'label',
  'label.radioButtonLabel',              // portal: visible label
  '[class*="BaseRadioButtonWrapper"]',   // portal: styled-components wrapper
  '[data-option]',
  '[data-option-index]',
  '.quiz-option',
  '.answer-option',
  '.option',
  '.choice'
];
```

If your portal uses different classes or attributes:

1. Open `content.js` in VS Code.
2. Add your selector to the relevant array.
3. Save the file.
4. Go to `chrome://extensions` → click the **reload** arrow on the
   extension card.
5. Refresh the quiz page (`Ctrl+R`).
6. Click **Run diagnose** in the popup to confirm the question and
   options are now detected.

---

## Compatibility limitations (honest)

This extension works on:

- ✅ Standard HTML pages with `<input type="radio">` (visible or hidden).
- ✅ Pages with accessible custom radios (`role="radio"`).
- ✅ Portal DOM with `[data-testid="card"]` + `[data-testid="radioGroupOptions"]`
  + `label.radioButtonLabel` + `[class*="BaseRadioButtonWrapper"]`
  (based on reported findings — verify on the real portal).
- ✅ Same-origin iframes (the script is injected with `allFrames: true`).
- ✅ Single-page applications (the script listens on `document`, which
  survives client-side route changes within the same tab).
- ✅ Dynamically rendered questions (the script queries the DOM on every
  keypress, so it sees options added after page load).

This extension does **not** work on:

- ❌ Cross-origin iframes (e.g. a quiz embedded from a different domain).
  Reaching them would require `host_permissions` for that domain, which
  we deliberately don't request. **Workaround:** open the iframe's URL
  directly in its own tab, then click **Enable** on that tab.
- ❌ Browser-internal pages (`chrome://`, `chrome-extension://`, the
  Chrome Web Store, `view-source:`, the built-in PDF viewer). Chrome
  blocks all extensions on these for security.
- ❌ Pages where the quiz is rendered inside a **closed** Shadow DOM.
  The script uses `querySelectorAll`, which does not pierce closed
  shadow roots. Open shadow roots work fine.
- ❌ Pages where the radio group is rendered inside a canvas element
  (e.g. some proctored exam platforms). Canvas content is not DOM.

What this extension deliberately does **not** do:

- Does **not** bypass proctoring, automation detection, attempt limits,
  session timeouts, or any other platform safeguard.
- Does **not** hide itself from the page, the user, or the platform.
- Does **not** spoof user activity, modify authentication, or manipulate
  server requests.
- Does **not** auto-submit or click the SUBMIT/NEXT button. The Submit
  button is always under manual user control.
- Does **not** read or upload answer content.

If your quiz platform's terms of service restrict browser extensions or
keyboard automation, review those terms before use. This tool is intended
as an accessibility / convenience aid for legitimate quiz-taking, not as
a way to gain an unfair advantage.

---

## Privacy

This extension:

- Does not collect, transmit, or store quiz content or answers.
- Does not modify authentication, cookies, or tokens.
- Does not attempt to evade proctoring, anti-cheat, or automation
  detection.
- Does not hide itself from the page, the user, or the platform.
- Does not auto-submit or repeat selections.
- Uses the minimum permissions required for the documented behavior.

All diagnostic logs are written to the browser's DevTools console only
and are not transmitted anywhere.

---

## Updating the public GitHub repository

The project is already published here:

- Repository: <https://github.com/monu-2008/KeyPilot>
- Default branch: `main`
- Visibility: Public

To publish local changes, open GitHub Desktop, review the changed files,
enter a commit summary, click **Commit to main**, then click **Push origin**.
Do not create a second repository or run `git init` in an existing clone.

Before pushing, review the changes for API keys, passwords, cookies,
authentication tokens, personal session data, and private portal details.
Do not commit generated ZIP files or unnecessary build outputs.

The extension footer's GitHub link is configured directly in `popup.js`
and should point to the public repository URL above.

---

## Configuring external links (Hush, Instagram, GitHub)

All three external links in the Explore AQERIONX footer are controlled by constants near the top of `popup.js`:

```js
const HUSH_URL = 'https://hush.aqerionx.in/';
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/aqerionx/';
const GITHUB_REPOSITORY_URL = 'https://github.com/monu-2008/KeyPilot';
```

### Hush (`HUSH_URL`)

Already configured to the official Hush product URL `https://hush.aqerionx.in/`.
The Hush card is always active. Clicking it opens the URL in a new tab via
`chrome.tabs.create`.

To verify the Hush logo was fetched from the genuine site (not invented),
the SVG at `icons/hush-logo.svg` was downloaded from
`https://hush.aqerionx.in/icon.svg` (referenced in the site's `<link rel="icon">`
and PWA `manifest.webmanifest`). The PNG at `icons/hush-logo.png` is a 128×128
rasterization of the same SVG. Both are committed locally so the extension
works offline.

### Instagram (`INSTAGRAM_PROFILE_URL`)

Already configured to the official AQERIONX Instagram profile
`https://www.instagram.com/aqerionx/` (per user instruction). The Instagram
pill is always active. Clicking it opens the URL in a new tab via
`chrome.tabs.create`. No placeholder — the official URL is hardcoded.

### GitHub (`GITHUB_REPOSITORY_URL`)

The footer link is configured for the public repository:
`https://github.com/monu-2008/KeyPilot`.

Clicking the GitHub pill opens the repository in a new tab through
`chrome.tabs.create`. If you fork or rename the repository, update the
constant near the top of `popup.js` and reload the extension.

---

## Test checklist

Use this checklist to verify KeyPilot works end-to-end. Open `practice-quiz-portal.html` in Chrome for all tests unless noted.

### Shortcuts (1–4)

- [ ] **S1.** Enable on the practice tab. Press `1` → first option selected, blue indicator flashes.
- [ ] **S2.** Press `2` → second option selected.
- [ ] **S3.** Press `3` → third option selected.
- [ ] **S4.** Press `4` → fourth option selected.
- [ ] **S5.** Press `5` → nothing happens (only 1–4 are mapped).
- [ ] **S6.** Click into the text field on Test 3, type `1234` → no radio changes (typing protection).
- [ ] **S7.** Hold `Ctrl` and press `1` → nothing happens (modifier protection).
- [ ] **S8.** Hold `2` key down → only one selection fires (repeat guard).
- [ ] **S9.** Click Enable five times, then press `2` once → exactly one selection (duplicate-listener guard).

### Enable / Disable

- [ ] **E1.** Click Enable → status dot turns green, label says "Enabled on this tab".
- [ ] **E2.** Click Disable → status dot turns grey, label says "Disabled on this tab".
- [ ] **E3.** While disabled, press `1` → nothing happens.
- [ ] **E4.** Re-enable → shortcuts work again.

### Diagnostics

- [ ] **D1.** Expand Diagnostics → click "Run Diagnostics" → status shows "Running diagnostics…" then turns green ("Diagnostics OK. Question detected with N option(s).").
- [ ] **D2.** Output shows: `url:`, `question: div[data-testid="radioGroupOptions"]`, `options: 4`, and 4 numbered option descriptors.
- [ ] **D3.** "Copy Debug Report" button is enabled after a successful run. Click it → "Copied!" appears briefly. Paste into a text editor to confirm.
- [ ] **D4.** Open `chrome://extensions` and click "Run Diagnostics" (without enabling on that page) → error state: "Cannot inspect this page. The current URL is a browser-internal page…".
- [ ] **D5.** Disable the script (popup → Disable), then click "Run Diagnostics" on the practice page → warn state: "Content script is not injected on this tab…".

### Both themes

- [ ] **T1.** Open the popup → default theme is Cream Luxury (warm cream background, ivory surfaces).
- [ ] **T2.** Click the sun/moon toggle in the header → switches to Dark (deep plum charcoal, lavender text).
- [ ] **T3.** Toggle again → back to Cream Luxury.
- [ ] **T4.** Expand Settings → use the Theme `<select>` to switch to Dark → switches.
- [ ] **T5.** Header toggle and Settings select stay in sync.
- [ ] **T6.** Toggle to dark, close popup, reopen → still dark (persistence).
- [ ] **T7.** Toggle to light, close popup, reopen → still light (persistence).
- [ ] **T8.** In both themes: status dot, shortcut cards, buttons, diagnostics panel, settings panel, footer all render with proper contrast and no clipped content.

### Settings persistence

- [ ] **P1.** Toggle "Reduced motion" ON → animations collapse (e.g. status dot stops pulsing, chevron rotation is instant).
- [ ] **P2.** Close popup, reopen → reduced motion still ON.
- [ ] **P3.** Toggle "Enter to submit" ON → hint text appears under the shortcut grid ("Enter submits in practice mode only — never on live quizzes.").
- [ ] **P4.** Close popup, reopen → "Enter to submit" still ON.
- [ ] **P5.** Click "Reset to defaults" → confirm → all settings revert (theme=light, reduced motion=off, Enter-to-submit=off).

### Enter-to-submit (practice mode only)

- [ ] **R1.** On `practice-quiz-portal.html`, Enable, toggle "Enter to submit" ON, press `2` (selects option), then press `Enter` → NEXT button is clicked automatically.
- [ ] **R2.** Check DevTools Console → see `[KeyPilot] Enter pressed on practice page — clicking submit button:`.
- [ ] **R3.** Toggle "Enter to submit" OFF. Press `2` then `Enter` → nothing happens (Enter doesn't click).
- [ ] **R4.** Open a normal website (e.g. `https://example.com`), Enable KeyPilot, toggle "Enter to submit" ON, press `Enter` → nothing happens (page doesn't opt in via `data-keypilot-practice`). Console logs the gate message.

### GitHub footer

- [ ] **G1.** Open the popup and verify the GitHub pill is enabled.
- [ ] **G2.** Click the GitHub pill → `https://github.com/monu-2008/KeyPilot` opens in a new tab.

---

## Test results (v2.1.0)

This section distinguishes tests that were actually performed from tests that were NOT performed, per the brief's requirement.

### Tests performed (in this build environment)

| # | Test | Result |
|---|---|---|
| 1 | `manifest.json` validates as JSON; well-formed MV3 manifest; name is "KeyPilot by AQERIONX"; version 2.1.0. | ✅ Pass |
| 2 | `content.js` passes Node syntax check (`node --check`). | ✅ Pass |
| 3 | `popup.js` passes Node syntax check (`node --check`). | ✅ Pass |
| 4 | All declared icon files exist: `icon16.png`, `icon48.png`, `icon128.png`, `logo.png`, `hush-logo.svg`, `hush-logo.png`. | ✅ Pass |
| 5 | All asset paths referenced in `manifest.json` and `popup.html` exist on disk. | ✅ Pass |
| 6 | All 21 element IDs referenced in `popup.js` via `getElementById` exist in `popup.html` (`copyBtn`, `diagBtn`, `diagOut`, `diagPanel`, `diagStatus`, `diagToggle`, `disableBtn`, `enableBtn`, `enterHint`, `githubLink`, `hushCard`, `instagramLink`, `practiceSubmit`, `reducedMotion`, `resetBtn`, `settingsPanel`, `settingsToggle`, `statusDot`, `statusSub`, `statusText`, `themeSelect`). | ✅ Pass |
| 7 | All message types handled in `content.js` (`ping`, `status`, `enable`, `disable`, `setPracticeSubmit`, `diagnose`) match the messages sent by `popup.js`. | ✅ Pass |
| 8 | `chrome.storage.local` API usage matches the manifest `storage` permission grant (keys: `keypilot.theme`, `keypilot.reducedMotion`, `keypilot.practiceSubmit`). | ✅ Pass |
| 9 | `chrome.scripting.executeScript` target uses `allFrames: true` as documented. | ✅ Pass |
| 10 | `chrome.tabs.create` is used for Hush, Instagram, and GitHub links (not `window.open`). | ✅ Pass |
| 11 | CSS variables exist for all three themes (`[data-theme="peach"]`, `[data-theme="midnight"]`, `[data-theme="lavender"]`) for every token used in component styles (32+ tokens each). | ✅ Pass |
| 12 | `prefers-reduced-motion` media query AND `html.force-reduced-motion` class are both present and collapse animations. | ✅ Pass |
| 13 | All buttons have `:focus-visible` styles for keyboard accessibility. | ✅ Pass |
| 14 | `practice-quiz-portal.html` has `<html lang="en" data-keypilot-practice="true">` — opts in to Enter/Space-to-submit. | ✅ Pass |
| 15 | `GITHUB_REPOSITORY_URL` is configured as `https://github.com/monu-2008/KeyPilot`; the GitHub pill should be enabled. | Source updated; verify in Chrome |
| 16 | `INSTAGRAM_PROFILE_URL` is set to the official `https://www.instagram.com/aqerionx/` (no placeholder). | ✅ Pass |
| 17 | `HUSH_URL` is set to `https://hush.aqerionx.in/` (no placeholder). | ✅ Pass |
| 18 | The genuine Hush logo was successfully downloaded from `https://hush.aqerionx.in/icon.svg` (confirmed via `curl` + web-reader fetch). The SVG content matches the live site's favicon (lowercase "h" on a dark rounded square with violet/cyan glow). | ✅ Pass |
| 19 | The Hush logo PNG (128×128) was generated from the SVG via `cairosvg` and verified visually via VLM as "a lowercase h in a serif font, dark background with violet and teal glow blobs, modern app-icon aesthetic." | ✅ Pass |
| 20 | The supplied paper-plane logo remains as the KeyPilot brand icon (16/48/128 PNGs + full-res `logo.png` in the header). | ✅ Pass |
| 21 | Enter/Space-to-submit code path requires BOTH the user setting AND the page-level `data-keypilot-practice="true"` attribute (verified by reading `isPracticePageAuthorized()` in `content.js`). | ✅ Pass |
| 22 | Enter+Space double-fire prevention: a 800ms `lastSubmitAt` debounce exists in `handleSubmitKey()`. | ✅ Pass |
| 23 | Next-button safety: `handleSubmitKey()` checks `btnText === 'next'` and skips rather than clicking Next. | ✅ Pass |
| 24 | Empty-submission guard: `hasSelectedAnswer()` returns false when options exist but none is selected, blocking submit. | ✅ Pass |
| 25 | Diagnostics status states use real checks (no hardcoded success) — the success/warn/error decision is based on `resp.optionCount` and `resp.question`. | ✅ Pass |
| 26 | Three theme pills in navbar have `data-theme-value` attributes `peach`, `midnight`, `lavender`, all present in `VALID_THEMES` set in `popup.js`. | ✅ Pass |
| 27 | The pill selector and Settings `<select>` both call `applyTheme()` and stay in sync (verified by reading both event handlers). | ✅ Pass |

### Tests NOT performed (require a real Chrome browser)

| # | Test | Why not performed | How to run it |
|---|---|---|---|
| A | **Load unpacked in Chrome** and verify the popup renders without console errors. | This build environment has no Chrome binary. | Load unpacked per the install guide; open the popup; check DevTools console (`F12` on the popup via right-click → Inspect). |
| B | **Visual check of all three themes** — Peach Cream Clay (warm ivory/peach), Midnight Gradient (deep navy/plum), Lavender Glass Clay (frosted translucent). The Hush logo and paper-plane KeyPilot logo should be visible in all themes. | No display. | Open the popup; click each of the three navbar pills (Peach / Midnight / Lavender); verify each theme renders correctly. |
| C | **Theme persistence** — switch to Midnight, close popup, reopen, verify Midnight is restored. Repeat for Lavender. | No Chrome. | Click a pill, close popup, reopen — should still be the chosen theme. |
| D | **Settings persistence** — toggle reduced motion + Enter/Space-to-submit, close popup, reopen, verify both are still on. | No Chrome. | Toggle both settings, close popup, reopen. |
| E | **Keyboard selection on `practice-quiz-portal.html`** — press 1-4, verify the corresponding radio is selected and the verify panel turns green. | No Chrome. | Open `practice-quiz-portal.html`, Enable the extension, press 1-4. |
| F | **Run Diagnostics** produces a snapshot showing `question: div[data-testid="radioGroupOptions"]` and 4 options, with a green ok status. | No Chrome. | Open `practice-quiz-portal.html`, Enable, click "Diagnostics" header to expand, click "Run Diagnostics". |
| G | **Copy Debug Report** copies the report to the clipboard. | No Chrome. | After a successful diagnostics run, click "Copy Debug Report". Paste into a text editor to verify. |
| H | **Collapsible Diagnostics + Settings** — chevron rotates, panel reveals with animation, `aria-expanded` updates. | No Chrome. | Click the "Diagnostics" and "Settings" headers in the popup. |
| I | **Enter-to-submit on practice page** — toggle on, select an option, press Enter → Submit button is clicked. | No Chrome. | Open `practice-quiz-portal.html`, Enable, toggle "Enter / Space to submit" ON, press `2` then `Enter`. |
| J | **Space-to-submit on practice page** — same as I but press Space instead of Enter. | No Chrome. | Same as I, press `Space` instead. |
| K | **Enter+Space double-fire prevention** — press Enter then immediately Space; only one submit should fire. | No Chrome. | On the practice page with submit enabled, press `Enter` then `Space` within 800ms; check console for only one "clicking submit button" log. |
| L | **Next-button safety** — on a question where only a Next button is visible (no Submit), pressing Enter/Space should NOT click it. | No Chrome. | Inspect the practice page DOM; if only Next is visible, press Enter; verify console logs "not activating Next as a side effect". |
| M | **Empty-submission guard** — on a question with options, don't select any, press Enter/Space; should be blocked. | No Chrome. | On the practice page, don't press 1-4, press Enter; verify console logs "no answer is selected". |
| N | **Enter/Space gate on non-practice page** — on a normal website, pressing Enter/Space does NOT trigger anything. | No Chrome. | Open any normal website, Enable, toggle "Enter / Space to submit" ON, press `Enter`/`Space`. Verify nothing happens and console logs the gate message. |
| O | **Reduced-motion** — animations collapse when the OS-level setting is on OR when the extension's "Reduced motion" toggle is on. | No Chrome / no OS setting. | Enable "Reduce motion" in Windows Settings → Accessibility → Visual effects; OR toggle the extension's "Reduced motion" in Settings. |
| P | **Hush card click** — clicking the Hush card opens `https://hush.aqerionx.in/` in a new tab. | No Chrome. | Open the popup, click the Hush card, verify a new tab opens to the Hush site. |
| Q | **Instagram pill click** — clicking opens `https://www.instagram.com/aqerionx/` in a new tab. | No Chrome. | Open the popup, click the Instagram pill, verify a new tab opens to the official AQERIONX Instagram profile. |
| R | **GitHub pill** — opens the published repository in a new tab. | No Chrome. | Reload the extension, open the popup, and click the GitHub pill. | |
| T | **Real portal test.** | The portal DOM was reported but not independently verified. | Test on a real practice quiz on the portal, not a graded one. |

**Honest statement:** The extension has **not** been tested in a real Chrome browser in this build environment. The code passes static validation (JSON syntax, JS syntax, asset references including the genuine Hush logo, ID/message consistency, three-theme CSS variable coverage, accessibility hooks, Enter/Space-to-submit gate logic with all four safety guards, real-checks-not-hardcoded diagnostics) but the visual rendering and runtime behavior must be verified by you in Chrome per the "Tests NOT performed" table above and the [Test checklist](#test-checklist).

The Hush logo was genuinely retrieved from the live site (not invented) — confirmed by downloading `https://hush.aqerionx.in/icon.svg` and verifying its content matches the site's `<link rel="icon">` and PWA manifest. The Instagram URL is the official `https://www.instagram.com/aqerionx/` per user instruction. The GitHub footer URL is configured as `https://github.com/monu-2008/KeyPilot`.



