"use client";

import { useEffect, useState } from "react";

/* =====================================================================
   KeyPilot by AQERIONX — Landing page
   Pure HTML/CSS/TSX. No external runtime dependencies beyond Next/React.
   ===================================================================== */

/* ---------- Constants (single source of truth) ----------------------- */
const LINKS = {
  github: "https://github.com/monu-2008/KeyPilot",
  instagram: "https://www.instagram.com/aqerionx/",
  hush: "https://hush.aqerionx.in/",
  // KeyPilot downloads folder on Google Drive.
  downloadFolder:
    "https://drive.google.com/drive/folders/1VECvVBTVzq4LtEpLrxpbaGnovaTZ5v9c?usp=sharing",
} as const;

const VERSION = "v2.2.0";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Install", href: "#install" },
  { label: "FAQ", href: "#faq" },
  { label: "Changelog", href: "#changelog" },
] as const;

/* ---------- Icons (inline SVG, no dependency) ------------------------ */
function IconGitHub({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}
function IconInstagram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.42-.35 1.04-.4 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.4 2.19.21.55.47.94.88 1.35.41.41.8.67 1.35.88.42.16 1.04.35 2.19.4 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.42.35-1.04.4-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.4-2.19a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.16-1.04-.35-2.19-.4-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92zm0 1.62a3.84 3.84 0 1 0 0 7.68 3.84 3.84 0 0 0 0-7.68zm5.65-2.88a1.28 1.28 0 1 1 0 2.56 1.28 1.28 0 0 1 0-2.56z" />
    </svg>
  );
}
function IconExternal({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}
function IconChevron({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function IconMenu({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 12h16M4 6h16M4 18h16" />
    </svg>
  );
}
function IconClose({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function IconCheck({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconArrowUp({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function IconDownload({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

/* ---------- Feature + install icons (small SVG illustrations) ------- */
function IconKeyboard({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M8 14h8" />
    </svg>
  );
}
function IconPalette({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.052 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
function IconStethoscope({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 3v6a4 4 0 0 0 8 0V3" />
      <path d="M8 13v3a5 5 0 0 0 10 0v-2" />
      <circle cx="18" cy="11" r="2" />
    </svg>
  );
}
function IconSliders({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
function IconMoon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 14.2A8.7 8.7 0 0 1 9.8 3.2 8.9 8.9 0 1 0 20.8 14.2Z" />
      <path d="M16.5 3.5v4M14.5 5.5h4" />
    </svg>
  );
}

/* ---------- Install step illustrations (clean SVG, marked as illustrations) ------- */
function InstallStep1Illustration() {
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of Windows Extract All context menu">
      <rect width="320" height="200" fill="#F4F1FB" />
      {/* file icon */}
      <g transform="translate(40, 50)">
        <path d="M10 0 L60 0 L80 20 L80 90 L10 90 Z" fill="#FFD9C9" stroke="#E8B59E" strokeWidth="1.5" />
        <path d="M60 0 L60 20 L80 20 Z" fill="#FFCBB8" stroke="#E8B59E" strokeWidth="1.5" />
        <text x="45" y="55" textAnchor="middle" fontSize="11" fill="#7C6CFF" fontWeight="700" fontFamily="monospace">.zip</text>
      </g>
      {/* context menu */}
      <g transform="translate(150, 40)">
        <rect x="0" y="0" width="150" height="120" rx="8" fill="#FFFFFF" stroke="#D4C5E8" strokeWidth="1" />
        <rect x="0" y="0" width="150" height="22" rx="8" fill="#F1E4FF" />
        <text x="10" y="15" fontSize="9" fill="#565472" fontFamily="sans-serif">Extract All…</text>
        {/* highlight */}
        <rect x="2" y="2" width="146" height="18" rx="6" fill="none" stroke="#7C6CFF" strokeWidth="2" strokeDasharray="3 2" />
        <text x="10" y="42" fontSize="9" fill="#827D9B" fontFamily="sans-serif">Open with</text>
        <text x="10" y="62" fontSize="9" fill="#827D9B" fontFamily="sans-serif">Send to</text>
        <text x="10" y="82" fontSize="9" fill="#827D9B" fontFamily="sans-serif">Cut</text>
        <text x="10" y="102" fontSize="9" fill="#827D9B" fontFamily="sans-serif">Properties</text>
      </g>
    </svg>
  );
}
function InstallStep2Illustration() {
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of chrome extensions developer mode toggle">
      <rect width="320" height="200" fill="#E6F2FF" />
      {/* browser chrome */}
      <rect x="20" y="20" width="280" height="160" rx="10" fill="#FFFFFF" stroke="#C5D5E8" strokeWidth="1" />
      <rect x="20" y="20" width="280" height="28" rx="10" fill="#F1F5FA" />
      <circle cx="35" cy="34" r="4" fill="#FF8E9E" />
      <circle cx="48" cy="34" r="4" fill="#FFD56B" />
      <circle cx="61" cy="34" r="4" fill="#7CD68A" />
      {/* developer mode toggle */}
      <g transform="translate(180, 50)">
        <text x="0" y="0" fontSize="10" fill="#565472" fontFamily="sans-serif" fontWeight="600">Developer mode</text>
        <rect x="0" y="6" width="40" height="20" rx="10" fill="#7C6CFF" />
        <circle cx="30" cy="16" r="8" fill="#FFFFFF" />
        {/* highlight */}
        <rect x="-2" y="2" width="44" height="28" rx="14" fill="none" stroke="#7C6CFF" strokeWidth="2" strokeDasharray="3 2" />
      </g>
      {/* extension cards placeholder */}
      <rect x="40" y="90" width="100" height="60" rx="8" fill="#F1E4FF" stroke="#D4C5E8" />
      <rect x="160" y="90" width="100" height="60" rx="8" fill="#FFE9D9" stroke="#E8B59E" />
      <text x="55" y="115" fontSize="9" fill="#565472" fontFamily="sans-serif">Extension 1</text>
      <text x="175" y="115" fontSize="9" fill="#565472" fontFamily="sans-serif">Extension 2</text>
    </svg>
  );
}
function InstallStep3Illustration() {
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of Load unpacked button and folder selection">
      <rect width="320" height="200" fill="#FFF0D8" />
      <rect x="20" y="20" width="280" height="160" rx="10" fill="#FFFFFF" stroke="#E8D9B5" strokeWidth="1" />
      {/* Load unpacked button */}
      <g transform="translate(40, 40)">
        <rect x="0" y="0" width="120" height="32" rx="8" fill="#7C6CFF" />
        <text x="60" y="20" textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="600" fontFamily="sans-serif">Load unpacked</text>
        <rect x="-2" y="-2" width="124" height="36" rx="10" fill="none" stroke="#7C6CFF" strokeWidth="2" strokeDasharray="3 2" />
      </g>
      {/* folder dialog */}
      <g transform="translate(40, 90)">
        <rect x="0" y="0" width="220" height="80" rx="8" fill="#FFF7F3" stroke="#D4C5E8" />
        <path d="M10 14 L30 14 L36 20 L210 20 L210 70 L10 70 Z" fill="#F1E4FF" stroke="#D4C5E8" />
        <rect x="40" y="30" width="60" height="30" rx="4" fill="#FFE9D9" stroke="#E8B59E" />
        <text x="70" y="48" textAnchor="middle" fontSize="9" fill="#7C6CFF" fontWeight="700" fontFamily="monospace">KeyPilot</text>
        <text x="120" y="48" fontSize="9" fill="#827D9B" fontFamily="sans-serif">manifest.json ✓</text>
      </g>
    </svg>
  );
}
function InstallStep4Illustration() {
  return (
    <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of pinning KeyPilot to the Chrome toolbar">
      <rect width="320" height="200" fill="#F1E4FF" />
      {/* toolbar */}
      <rect x="10" y="20" width="300" height="40" rx="8" fill="#FFFFFF" stroke="#D4C5E8" strokeWidth="1" />
      <circle cx="30" cy="40" r="5" fill="#FF8E9E" />
      <circle cx="45" cy="40" r="5" fill="#FFD56B" />
      <circle cx="60" cy="40" r="5" fill="#7CD68A" />
      <rect x="80" y="32" width="160" height="16" rx="8" fill="#F1F5FA" stroke="#E8D9C9" />
      {/* extensions menu */}
      <g transform="translate(250, 28)">
        <rect x="0" y="0" width="40" height="24" rx="6" fill="#F1E4FF" stroke="#7C6CFF" strokeWidth="1.5" />
        <rect x="-2" y="-2" width="44" height="28" rx="8" fill="none" stroke="#7C6CFF" strokeWidth="2" strokeDasharray="3 2" />
        <circle cx="14" cy="12" r="3" fill="#7C6CFF" />
        <circle cx="26" cy="12" r="3" fill="#7C6CFF" />
      </g>
      {/* KeyPilot icon pinned */}
      <g transform="translate(120, 80)">
        <rect x="0" y="0" width="80" height="80" rx="14" fill="#FFFFFF" stroke="#D4C5E8" />
        <path d="M40 18 L24 44 L36 44 L32 62 L56 36 L44 36 L48 18 Z" fill="#7C6CFF" />
        {/* pin badge */}
        <g transform="translate(60, 0)">
          <circle cx="0" cy="0" r="10" fill="#7C6CFF" />
          <path d="M0 -5 L2 -2 L5 0 L2 2 L0 5 L-2 2 L-5 0 L-2 -2 Z" fill="#FFFFFF" />
        </g>
        <text x="40" y="100" textAnchor="middle" fontSize="10" fill="#565472" fontWeight="600" fontFamily="sans-serif">KeyPilot</text>
      </g>
      <text x="160" y="190" textAnchor="middle" fontSize="10" fill="#827D9B" fontFamily="sans-serif" fontStyle="italic">Click the icon to open the popup</text>
    </svg>
  );
}

/* ---------- FAQ data ------------------------------------------------- */
const FAQ_ITEMS = [
  {
    q: "How do I install KeyPilot?",
    a: (
      <>
        <p>
          Install KeyPilot in four steps: download the ZIP, extract it, enable
          Developer mode on <code>chrome://extensions</code>, and click
          &ldquo;Load unpacked&rdquo; to select the extracted folder. The folder
          must contain <code>manifest.json</code>.
        </p>
        <p>
          See the <a href="#install">illustrated installation guide</a> above
          for a visual walkthrough. KeyPilot is a manual-install package — it is
          not on the Chrome Web Store.
        </p>
      </>
    ),
  },
  {
    q: "How do the keyboard shortcuts work?",
    a: (
      <>
        <p>
          On a supported quiz practice page where KeyPilot is enabled, pressing{" "}
          <strong>1</strong>, <strong>2</strong>, <strong>3</strong>, or{" "}
          <strong>4</strong> selects the corresponding available answer option.
          The extension detects the visible question container and its options
          automatically.
        </p>
        <p>
          Shortcuts are ignored while you are typing in a text field, and when
          Ctrl / Cmd / Alt modifiers are held. Holding a number key only fires
          the selection once.
        </p>
      </>
    ),
  },
  {
    q: "Does KeyPilot automatically submit live quizzes?",
    a: (
      <>
        <p>
          <strong>No.</strong> Submission on live graded or monitored
          assessments always remains manual — you click the portal&rsquo;s own
          Submit / Next button.
        </p>
        <p>
          An optional Enter / Space-to-submit behaviour is available, but it is
          strictly restricted to local practice pages that opt in via the{" "}
          <code>data-keypilot-practice</code> attribute. It cannot fire on live
          graded or monitored assessments, even if you accidentally leave the
          setting on.
        </p>
      </>
    ),
  },
  {
    q: "Why isn't my question being detected?",
    a: (
      <>
        <p>
          Quiz page DOM can differ between sites and over time. KeyPilot looks
          for common patterns (<code>fieldset</code>, <code>[role=&quot;group&quot;]</code>,
          radios, ARIA radios, and reported testid-based containers), but a
          specific page may use a structure it doesn&rsquo;t recognise.
        </p>
        <p>
          Open the popup, expand <strong>Diagnostics</strong>, and click{" "}
          <strong>Run Diagnostics</strong>. Check the <em>question</em> and{" "}
          <em>option count</em> fields — if either is 0, the selectors need to
          be updated in <code>content.js</code>.
        </p>
      </>
    ),
  },
  {
    q: "How do I update KeyPilot?",
    a: (
      <>
        <p>
          Download the newest ZIP package, extract it, and replace your local
          KeyPilot folder with the new contents. Then open{" "}
          <code>chrome://extensions</code> and click the <strong>Reload</strong>{" "}
          arrow on the KeyPilot card.
        </p>
        <p>
          Your saved theme and settings are preserved where supported — they
          are stored in <code>chrome.storage.local</code> under{" "}
          <code>keypilot.*</code> keys.
        </p>
      </>
    ),
  },
];

/* ---------- Page component ------------------------------------------- */
export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [openFaq, setOpenFaq] = useState<number | null>(0); // first open by default
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track active section for navbar highlight
  useEffect(() => {
    const ids = ["home", "features", "install", "faq", "changelog"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Show scroll-to-top after scrolling
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleFaq = (i: number) => setOpenFaq(openFaq === i ? null : i);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* ============================ NAVBAR ============================ */}
      <nav
        className={`navbar-pill ${menuOpen ? "expanded" : ""}`}
        aria-label="Main navigation"
      >
        <a href="#home" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <img src="/assets/keypilot-logo.png" alt="KeyPilot logo" className="navbar-logo" />
          <span className="navbar-brand-text">
            <span className="navbar-brand-name">KeyPilot</span>
            <span className="navbar-brand-sub">by AQERIONX</span>
          </span>
        </a>

        <div className="navbar-links">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`navbar-link ${activeSection === l.href.slice(1) ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="navbar-actions">
          <a
            href={LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-pill github"
            aria-label="View source on GitHub"
            title="View on GitHub"
          >
            <IconGitHub size={16} />
          </a>
          <a
            href={LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-pill instagram"
            aria-label="Follow AQERIONX on Instagram (@aqerionx)"
            title="Follow on Instagram — @aqerionx"
          >
            <IconInstagram size={16} />
          </a>
          <a
            href={LINKS.downloadFolder}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill btn-pill-primary"
            aria-label="Open KeyPilot downloads folder in Google Drive"
          >
            <IconDownload size={15} />
            <span className="navbar-download-label">Download ZIP</span>
          </a>
          <button
            type="button"
            className="navbar-menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </nav>

      {/* ============================ HERO ============================== */}
      <section className="hero" id="home">
        <div className="hero-left">
          <span className="version-badge">
            <span className="version-badge-dot" aria-hidden="true" />
            {VERSION}
          </span>
          <h1 className="hero-title">KeyPilot</h1>
          <p className="hero-headline">
            Your <span className="accent">keyboard</span>. Your{" "}
            <span className="accent">workflow</span>.
          </p>
          <p className="hero-description">
            A smarter browser companion with keyboard shortcuts, built-in
            diagnostics, premium themes and optional Universal Dark Mode for
            websites that feel too bright — including CCBP.
          </p>
          <div className="hero-ctas">
            <a
              href={LINKS.downloadFolder}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill-primary"
            >
              <IconDownload size={16} />
              Download KeyPilot
            </a>
            <a href="#install" className="btn-pill btn-pill-soft">
              Installation Guide
            </a>
          </div>
          <p className="cta-meta">ZIP Package · Manual Installation</p>
          <p className="cta-download-fallback">
            Download not starting?{" "}
            <a
              href={LINKS.downloadFolder}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open the Google Drive folder
            </a>
          </p>
          <div className="hero-points">
            <div className="hero-point">
              <span className="hero-point-check"><IconCheck /></span>
              Free &amp; Open Source
            </div>
            <div className="hero-point">
              <span className="hero-point-check"><IconCheck /></span>
              Lightweight
            </div>
            <div className="hero-point">
              <span className="hero-point-check"><IconCheck /></span>
              Custom Themes
            </div>
            <div className="hero-point">
              <span className="hero-point-check"><IconCheck /></span>
              Practice Friendly
            </div>
          </div>
        </div>

        {/* Decorative popup preview — not the real extension; visual only */}
        <div className="hero-preview" aria-hidden="true">
          <span className="hero-preview-tag">Popup Preview</span>
          <div className="popup-mock">
            <div className="popup-mock-header">
              <div className="popup-mock-brand">
                <img src="/assets/keypilot-logo.png" alt="" />
                <div>
                  <div className="popup-mock-brand-name">KeyPilot</div>
                  <div className="popup-mock-brand-sub">by AQERIONX</div>
                </div>
              </div>
              <span className="popup-mock-version">v2.1.1</span>
            </div>
            <div className="popup-mock-pills">
              <button className="popup-mock-pill active">Peach</button>
              <button className="popup-mock-pill">Midnight</button>
              <button className="popup-mock-pill">Lavender</button>
            </div>
            <div className="popup-mock-status">
              <span className="popup-mock-status-dot" />
              <div>
                <div className="popup-mock-status-text">Enabled on this tab</div>
                <span className="popup-mock-status-sub">Press 1–4 to select options</span>
              </div>
            </div>
            <div className="popup-mock-keys">
              {["1", "2", "3", "4"].map((k) => (
                <div className="popup-mock-key" key={k}>
                  <div className="popup-mock-key-num">{k}</div>
                  <div className="popup-mock-key-desc">Option {k}</div>
                </div>
              ))}
            </div>
            <div className="popup-mock-rows">
              <div className="popup-mock-row">
                Diagnostics
                <span className="popup-mock-row-chev">›</span>
              </div>
              <div className="popup-mock-row">
                Settings
                <span className="popup-mock-row-chev">›</span>
              </div>
            </div>
            <div className="popup-mock-footer">
              <span className="popup-mock-footer-brand">AQERIONX</span>
              · v2.1.1 · Manual submission, always
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ========================== */}
      <section className="section" id="features">
        <h2 className="section-title">Built for focus</h2>
        <p className="section-subtitle">
          Keyboard shortcuts, practical diagnostics and an optional dark
          viewing experience across the websites you use every day.
        </p>
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon-tile"><IconKeyboard /></div>
            <h3 className="feature-card-title">Keyboard Shortcuts</h3>
            <p className="feature-card-body">
              Select options quickly using 1–4 on supported practice pages.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon-tile"><IconMoon /></div>
            <h3 className="feature-card-title">Universal Dark Mode</h3>
            <p className="feature-card-body">
              Apply a reversible force-dark filter across websites, including
              CCBP. Requires your permission for all-site access.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon-tile"><IconPalette /></div>
            <h3 className="feature-card-title">Three Premium Themes</h3>
            <p className="feature-card-body">
              Peach Clay, Midnight and Lavender Glass Clay.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon-tile"><IconStethoscope /></div>
            <h3 className="feature-card-title">Built-in Diagnostics</h3>
            <p className="feature-card-body">
              Inspect supported question structures and useful debugging
              information.
            </p>
          </article>
          <article className="feature-card">
            <div className="feature-icon-tile"><IconSliders /></div>
            <h3 className="feature-card-title">Easy Settings</h3>
            <p className="feature-card-body">
              Configure available preferences and practice-mode behaviour.
            </p>
          </article>
        </div>
      </section>

      {/* ============================ INSTALL =========================== */}
      <section className="section" id="install">
        <h2 className="section-title">How to Install KeyPilot</h2>
        <p className="section-subtitle">
          Follow these simple steps to install the extension on your Chrome
          browser.
        </p>
        <div className="install-grid">
          <article className="install-card">
            <span className="install-step-badge">1</span>
            <div className="install-step-illustration">
              <InstallStep1Illustration />
            </div>
            <h3 className="install-card-title">Download &amp; Extract</h3>
            <p className="install-card-body">
              Download the ZIP file, right-click it in File Explorer, and choose
              Extract All.
            </p>
            <p className="install-illustration-note">Illustration — not a genuine screenshot.</p>
          </article>
          <article className="install-card">
            <span className="install-step-badge">2</span>
            <div className="install-step-illustration">
              <InstallStep2Illustration />
            </div>
            <h3 className="install-card-title">Open Chrome Extensions</h3>
            <p className="install-card-body">
              Go to <code>chrome://extensions</code> and enable Developer mode.
            </p>
            <p className="install-illustration-note">Illustration — not a genuine screenshot.</p>
          </article>
          <article className="install-card">
            <span className="install-step-badge">3</span>
            <div className="install-step-illustration">
              <InstallStep3Illustration />
            </div>
            <h3 className="install-card-title">Load Unpacked</h3>
            <p className="install-card-body">
              Click <strong>Load unpacked</strong> and select the extracted
              KeyPilot folder containing <code>manifest.json</code>.
            </p>
            <p className="install-illustration-note">Illustration — not a genuine screenshot.</p>
          </article>
          <article className="install-card">
            <span className="install-step-badge">4</span>
            <div className="install-step-illustration">
              <InstallStep4Illustration />
            </div>
            <h3 className="install-card-title">Pin &amp; Open</h3>
            <p className="install-card-body">
              Pin KeyPilot to the browser toolbar and open its popup.
            </p>
            <p className="install-illustration-note">Illustration — not a genuine screenshot.</p>
          </article>
        </div>
      </section>

      {/* ============================ FAQ ============================== */}
      <section className="section" id="faq">
        <div className="faq-container">
          <h2 className="faq-heading">FAQs</h2>
          <div className="faq-list">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div className={`faq-item ${isOpen ? "open" : ""}`} key={i}>
                  <button
                    type="button"
                    className="faq-question"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    onClick={() => toggleFaq(i)}
                  >
                    <span>{item.q}</span>
                    <span className="faq-chev" aria-hidden="true">
                      <IconChevron size={18} />
                    </span>
                  </button>
                  <div
                    className="faq-answer"
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    hidden={!isOpen}
                  >
                    <div className="faq-answer-inner">{item.a}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================ CHANGELOG ======================== */}
      <section className="section" id="changelog">
        <h2 className="section-title">Changelog</h2>
        <p className="section-subtitle">
          What&rsquo;s in the current build — implemented code vs.
          browser-tested functionality.
        </p>
        <div className="changelog-card">
          <h3 className="changelog-version">{VERSION}</h3>
          <p className="changelog-meta">Implemented in code · not yet browser-tested by the maintainer</p>
          <ul className="changelog-list">
            <li><span className="changelog-bullet" />Universal Dark Mode for all supported web pages, including CCBP; all-sites access is requested only when you enable it.</li>
            <li><span className="changelog-bullet" />Three premium themes (Peach Clay, Midnight, Lavender Glass Clay) with persistence.</li>
            <li><span className="changelog-bullet" />Keyboard shortcuts 1–4 select the corresponding available option on supported practice pages.</li>
            <li><span className="changelog-bullet" />Built-in Diagnostics with real checks, status states, and Copy Debug Report.</li>
            <li><span className="changelog-bullet" />Saved theme, reduced-motion, and practice-mode preferences via chrome.storage.local.</li>
            <li><span className="changelog-bullet" />Optional Enter / Space-to-submit restricted to local practice pages only.</li>
            <li><span className="changelog-bullet" />Footer links to Hush, Instagram (@aqerionx), and the public GitHub repository.</li>
          </ul>
          <div className="changelog-note">
            <strong>Code vs. runtime:</strong> the items above are implemented
            in the source. They have not been runtime-tested in a real Chrome
            browser by the maintainer. Run the practice tests in the repository
            README before relying on any behaviour on a live page.
          </div>
        </div>
      </section>

      {/* ============================ FOOTER =========================== */}
      <footer className="footer" id="footer">
        <div className="footer-grid">
          <div className="footer-brand-block">
            <div className="footer-brand-row">
              <img src="/assets/keypilot-logo.png" alt="KeyPilot logo" />
              <div>
                <div className="footer-brand-name">KeyPilot</div>
                <div className="footer-brand-sub">
                  by <span className="accent">AQERIONX</span>
                </div>
              </div>
            </div>
            <p className="footer-tagline">
              A smarter keyboard-navigation extension for supported quiz
              practice pages. Manual submission, always.
            </p>
          </div>

          <div className="footer-col">
            <h4>Navigate</h4>
            <ul className="footer-links">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>Resources</h4>
            <ul className="footer-links">
              <li>
                <a href={LINKS.github} target="_blank" rel="noopener noreferrer">
                  GitHub <IconExternal />
                </a>
              </li>
              <li>
                <a href={LINKS.downloadFolder} target="_blank" rel="noopener noreferrer">
                  Google Drive Folder <IconExternal />
                </a>
              </li>
              <li>
                <a href={LINKS.instagram} target="_blank" rel="noopener noreferrer">
                  Instagram <IconExternal />
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>By AQERIONX</h4>
            <a
              href={LINKS.hush}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-product-row"
              aria-label="Open Hush — Private emoji and image messages"
            >
              <img src="/assets/hush-logo.png" alt="Hush logo" />
              <span className="footer-product-text">
                <span className="footer-product-name">Hush</span>
                <span className="footer-product-sub">Private emoji &amp; image messages</span>
              </span>
              <IconExternal />
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <span className="footer-copy">
            <span className="accent">AQERIONX</span> · {VERSION} · Manual submission, always
          </span>
          {showScrollTop && (
            <button
              type="button"
              className="scroll-top"
              onClick={scrollToTop}
              aria-label="Scroll back to top"
            >
              <IconArrowUp />
            </button>
          )}
        </div>
      </footer>
    </>
  );
}
