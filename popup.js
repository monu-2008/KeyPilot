/**
 * KeyPilot by AQERIONX — popup script (Manifest V3, v2.2.12)
 *
 * Responsibilities:
 *   - Three-theme management: peach (default) / midnight / lavender,
 *     persisted to chrome.storage.local under key "keypilot.theme".
 *     Pill selector in navbar + <select> in Settings both control the same
 *     preference and stay in sync.
 *   - Settings panel: theme select, reduced-motion, Enter/Space-to-submit
 *     (works on every website when enabled; Shift+Enter goes to next
 *     question on every website), and all-sites Universal Dark Mode.
 *     All persisted.
 *   - Inject content.js into the active tab's top-level frame only.
 *   - Send enable/disable + setPracticeSubmit messages to content script.
 *   - Real-checks Diagnostics with loading/success/warn/error states and
 *     Copy Debug Report button.
 *   - Explore AQERIONX footer:
 *       * "Download Latest Update" card opens KEYPILOT_DOWNLOAD_URL
 *         (https://keypilot.aqerionx.in/) via chrome.tabs.create.
 *       * Hush product card opens HUSH_URL via chrome.tabs.create.
 *       * Instagram pill opens INSTAGRAM_PROFILE_URL (official:
 *         https://www.instagram.com/aqerionx/) via chrome.tabs.create.
 *       * GitHub pill opens the configured public repository URL.
 *
 * Permissions used:
 *   - activeTab  → access the currently focused tab.
 *   - scripting  → inject content.js only into that tab on Enable.
 *   - storage    → persist themes, shortcuts, and dark-mode preference.
 *   - optional host access → apply Universal Dark Mode to all websites only
 *     after the user explicitly enables the feature and grants access.
 */

'use strict';

const TAG = '[KeyPilot]';
const VERSION = '2.2.12';

// =========================================================================
// CONFIGURATION — EXTERNAL LINKS
// =========================================================================

/**
 * Official Hush product URL.
 * Fetched from the live site metadata (hush.aqerionx.in). Opens in a new
 * tab via chrome.tabs.create when the Hush card is clicked.
 */
const HUSH_URL = 'https://hush.aqerionx.in/';

/**
 * Official AQERIONX Instagram profile URL.
 * Per user instruction: https://www.instagram.com/aqerionx/
 * Opens in a new tab via chrome.tabs.create when the Instagram pill is clicked.
 */
const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/aqerionx/';

/**
 * Public KeyPilot repository URL.
 * The GitHub pill opens this exact repository in a new tab.
 */
const GITHUB_REPOSITORY_URL = 'https://github.com/monu-2008/KeyPilot';

/**
 * Official KeyPilot website — latest update download page.
 * Opens in a new tab via chrome.tabs.create when the
 * "Download Latest Update" card is clicked.
 */
const KEYPILOT_DOWNLOAD_URL = 'https://keypilot.aqerionx.in/';
// Storage keys (all under chrome.storage.local)
const THEME_KEY           = 'keypilot.theme';            // 'peach' | 'midnight' | 'lavender'
const REDUCED_MOTION_KEY  = 'keypilot.reducedMotion';    // boolean
const PRACTICE_SUBMIT_KEY = 'keypilot.practiceSubmit';   // boolean
const FORCE_DARK_MODE_KEY = 'keypilot.forceDarkMode';    // boolean — all-sites mode
const CCBP_NAV_ENABLED_KEY = 'keypilot.ccbpKeyboardNavEnabled';
const CCBP_ORIGIN_PATTERN = 'https://learning.ccbp.in/*';

const DEFAULT_THEME = 'peach';
const DEFAULT_REDUCED_MOTION = false;
const DEFAULT_PRACTICE_SUBMIT = false;
const DEFAULT_FORCE_DARK_MODE = false;

const VALID_THEMES = new Set(['peach', 'midnight', 'lavender']);

// =========================================================================
// DOM REFS
// =========================================================================

const APP             = document.querySelector('.app');
const HTML            = document.documentElement;
const THEME_PILLS     = Array.from(document.querySelectorAll('.theme-pill'));
const THEME_SELECT    = document.getElementById('themeSelect');
const REDUCED_MOTION  = document.getElementById('reducedMotion');
const PRACTICE_SUBMIT = document.getElementById('practiceSubmit');
const FORCE_DARK_MODE = document.getElementById('forceDarkMode');
const DARK_MODE_CARD = document.querySelector('.dark-mode-card');
const DARK_MODE_STATUS = document.getElementById('darkModeStatus');
const RESET_BTN       = document.getElementById('resetBtn');
const ENTER_HINT      = document.getElementById('enterHint');
const ENABLE_BTN      = document.getElementById('enableBtn');
const DISABLE_BTN     = document.getElementById('disableBtn');
const DIAG_BTN        = document.getElementById('diagBtn');
const DIAG_TOGGLE     = document.getElementById('diagToggle');
const DIAG_PANEL      = document.getElementById('diagPanel');
const DIAG_STATUS     = document.getElementById('diagStatus');
const DIAG_OUT        = document.getElementById('diagOut');
const COPY_BTN        = document.getElementById('copyBtn');
const SETTINGS_TOGGLE = document.getElementById('settingsToggle');
const SETTINGS_PANEL  = document.getElementById('settingsPanel');
const STATUS_DOT      = document.getElementById('statusDot');
const STATUS_TEXT     = document.getElementById('statusText');
const STATUS_SUB      = document.getElementById('statusSub');
const HUSH_CARD       = document.getElementById('hushCard');
const INSTAGRAM_LINK  = document.getElementById('instagramLink');
const GITHUB_LINK     = document.getElementById('githubLink');
const DOWNLOAD_CARD   = document.getElementById('downloadUpdateCard');

const BLOCKED_SCHEMES = new Set([
  'chrome:', 'chrome-extension:', 'edge:', 'about:', 'view-source:', 'devtools:'
]);

function log(...args)  { console.log(TAG, ...args); }
function warn(...args) { console.warn(TAG, ...args); }

// =========================================================================
// 1. THEME MANAGEMENT (three themes)
// =========================================================================

const settings = {
  theme: DEFAULT_THEME,
  reducedMotion: DEFAULT_REDUCED_MOTION,
  practiceSubmit: DEFAULT_PRACTICE_SUBMIT,
  forceDarkMode: DEFAULT_FORCE_DARK_MODE,
};

function applyTheme(theme) {
  const t = VALID_THEMES.has(theme) ? theme : DEFAULT_THEME;
  HTML.setAttribute('data-theme', t);
  APP.setAttribute('data-theme', t);
  // Update pill selector
  THEME_PILLS.forEach(pill => {
    const active = pill.getAttribute('data-theme-value') === t;
    pill.classList.toggle('active', active);
    pill.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  // Update settings <select>
  if (THEME_SELECT) THEME_SELECT.value = t;
  settings.theme = t;
}

function applyReducedMotion(on) {
  HTML.classList.toggle('force-reduced-motion', !!on);
}

function applyPracticeSubmit(on) {
  if (ENTER_HINT) ENTER_HINT.hidden = !on;
  sendToActiveTab({ type: 'setPracticeSubmit', enabled: !!on }).catch(() => {});
}

function renderDarkModeState(enabled, message) {
  if (FORCE_DARK_MODE) FORCE_DARK_MODE.checked = !!enabled;
  if (DARK_MODE_CARD) DARK_MODE_CARD.dataset.enabled = enabled ? 'true' : 'false';
  if (DARK_MODE_STATUS) {
    DARK_MODE_STATUS.textContent = message || (enabled
      ? 'ON · all websites, including CCBP'
      : 'OFF · turn on to darken all websites');
  }
}

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get([
      THEME_KEY, REDUCED_MOTION_KEY, PRACTICE_SUBMIT_KEY, FORCE_DARK_MODE_KEY
    ]);
    const savedTheme = result[THEME_KEY];
    settings.theme = VALID_THEMES.has(savedTheme) ? savedTheme : DEFAULT_THEME;
    settings.reducedMotion = result[REDUCED_MOTION_KEY] === true;
    settings.practiceSubmit = result[PRACTICE_SUBMIT_KEY] === true;
    settings.forceDarkMode = result[FORCE_DARK_MODE_KEY] === true;
    if (settings.forceDarkMode) {
      const permitted = await chrome.permissions.contains({ origins: ['http://*/*', 'https://*/*'] });
      if (!permitted) {
        settings.forceDarkMode = false;
        await chrome.storage.local.set({ [FORCE_DARK_MODE_KEY]: false });
        renderDarkModeState(false, 'All-sites access was removed. Turn on again to grant it.');
      }
    }
  } catch (e) {
    warn('Failed to load settings, using defaults:', e);
  }
  applyTheme(settings.theme);
  applyReducedMotion(settings.reducedMotion);
  applyPracticeSubmit(settings.practiceSubmit);
  if (REDUCED_MOTION)  REDUCED_MOTION.checked  = settings.reducedMotion;
  if (PRACTICE_SUBMIT) PRACTICE_SUBMIT.checked = settings.practiceSubmit;
  if (settings.forceDarkMode) {
    renderDarkModeState(true, 'ON · automatically applied across websites');
  } else if (FORCE_DARK_MODE && !FORCE_DARK_MODE.checked) {
    // Preserve a permission warning already shown above; otherwise render OFF.
    if (!DARK_MODE_STATUS.textContent.includes('access was removed')) {
      renderDarkModeState(false);
    }
  }
  log('Settings loaded:', settings);
}

async function saveSetting(key, value) {
  try {
    await chrome.storage.local.set({ [key]: value });
    log('Setting saved:', key, '=', value);
  } catch (e) {
    warn('Failed to save setting:', key, e);
  }
}

// Pill selector click handler
THEME_PILLS.forEach(pill => {
  pill.addEventListener('click', async () => {
    const value = pill.getAttribute('data-theme-value');
    if (!VALID_THEMES.has(value)) return;
    applyTheme(value);
    await saveSetting(THEME_KEY, value);
  });
});

// Settings <select> change handler
THEME_SELECT.addEventListener('change', async () => {
  const value = THEME_SELECT.value;
  if (!VALID_THEMES.has(value)) return;
  applyTheme(value);
  await saveSetting(THEME_KEY, value);
});

REDUCED_MOTION.addEventListener('change', async () => {
  const on = REDUCED_MOTION.checked;
  settings.reducedMotion = on;
  applyReducedMotion(on);
  await saveSetting(REDUCED_MOTION_KEY, on);
});

PRACTICE_SUBMIT.addEventListener('change', async () => {
  const on = PRACTICE_SUBMIT.checked;
  settings.practiceSubmit = on;
  applyPracticeSubmit(on);
  await saveSetting(PRACTICE_SUBMIT_KEY, on);
});


FORCE_DARK_MODE.addEventListener('change', async () => {
  const enabled = FORCE_DARK_MODE.checked;
  FORCE_DARK_MODE.disabled = true;

  try {
    if (enabled) {
      if (DARK_MODE_STATUS) DARK_MODE_STATUS.textContent = 'Chrome will ask to allow access to all websites…';
      // This is called directly from the user's toggle gesture; all-sites
      // access remains optional until the user confirms Chrome's prompt.
      const granted = await chrome.permissions.request({ origins: ['http://*/*', 'https://*/*'] });
      if (!granted) {
        settings.forceDarkMode = false;
        renderDarkModeState(false, 'Permission not granted. Dark mode remains off.');
        return;
      }
    }

    const response = await chrome.runtime.sendMessage({
      type: 'keypilot:setForceDarkMode',
      enabled
    });

    if (!response || !response.ok) {
      throw new Error(response?.message || (response?.reason === 'permission_missing'
        ? 'Allow all-sites access in Chrome first.'
        : 'Could not update Universal Dark Mode.'));
    }

    settings.forceDarkMode = enabled;
    if (enabled) {
      renderDarkModeState(true,
        `ON · applied to ${response.appliedTabs} open tab(s); new pages included`);
    } else {
      renderDarkModeState(false,
        response.skippedTabs > 0
          ? 'OFF · if a restricted page stays dark, refresh that tab'
          : 'OFF · dark-mode styling removed');
    }
    log('Universal Dark Mode changed:', { enabled, ...response });
  } catch (error) {
    settings.forceDarkMode = !enabled;
    renderDarkModeState(settings.forceDarkMode,
      error?.message || 'Could not change Universal Dark Mode.');
    warn('Universal Dark Mode update failed:', error);
  } finally {
    FORCE_DARK_MODE.disabled = false;
  }
});

RESET_BTN.addEventListener('click', async () => {
  if (!confirm('Reset all settings to defaults?')) return;
  settings.theme = DEFAULT_THEME;
  settings.reducedMotion = DEFAULT_REDUCED_MOTION;
  settings.practiceSubmit = DEFAULT_PRACTICE_SUBMIT;
  settings.forceDarkMode = DEFAULT_FORCE_DARK_MODE;
  applyTheme(settings.theme);
  applyReducedMotion(settings.reducedMotion);
  applyPracticeSubmit(settings.practiceSubmit);
  renderDarkModeState(false);
  if (REDUCED_MOTION)  REDUCED_MOTION.checked  = false;
  if (PRACTICE_SUBMIT) PRACTICE_SUBMIT.checked = false;
  if (FORCE_DARK_MODE) FORCE_DARK_MODE.checked = false;
  try {
    await chrome.runtime.sendMessage({ type: 'keypilot:setForceDarkMode', enabled: false });
  } catch (_) {}
  await chrome.storage.local.remove([
    THEME_KEY, REDUCED_MOTION_KEY, PRACTICE_SUBMIT_KEY, FORCE_DARK_MODE_KEY, CCBP_NAV_ENABLED_KEY
  ]);
  log('Settings reset to defaults.');
});

// =========================================================================
// 2. EXPLORE AQERIONX FOOTER LINKS (Hush, Instagram, GitHub)
// =========================================================================

function openExternal(url) {
  if (!url || !/^https?:\/\//.test(url)) return;
  chrome.tabs.create({ url });
}

// Hush card — always active (URL is configured)
HUSH_CARD.addEventListener('click', (e) => {
  e.preventDefault();
  openExternal(HUSH_URL);
});

// Download latest update card — always active (keypilot.aqerionx.in is configured)
DOWNLOAD_CARD.addEventListener('click', (e) => {
  e.preventDefault();
  openExternal(KEYPILOT_DOWNLOAD_URL);
});

// Instagram pill — always active (official URL is configured)
INSTAGRAM_LINK.addEventListener('click', (e) => {
  e.preventDefault();
  openExternal(INSTAGRAM_PROFILE_URL);
});

// GitHub pill — only active if URL configured
function initGitHubLink() {
  if (GITHUB_REPOSITORY_URL && /^https?:\/\//.test(GITHUB_REPOSITORY_URL)) {
    GITHUB_LINK.classList.remove('disabled');
    GITHUB_LINK.setAttribute('aria-disabled', 'false');
    GITHUB_LINK.title = 'View on GitHub';
    GITHUB_LINK.addEventListener('click', (e) => {
      e.preventDefault();
      openExternal(GITHUB_REPOSITORY_URL);
    });
    log('GitHub link enabled:', GITHUB_REPOSITORY_URL);
  } else {
    // Keep visible but disabled so users see it exists
    GITHUB_LINK.classList.add('disabled');
    GITHUB_LINK.setAttribute('aria-disabled', 'true');
    GITHUB_LINK.title = 'GitHub repository not yet published';
    log('GitHub URL is a placeholder — pill shown disabled. Set GITHUB_REPOSITORY_URL in popup.js to enable.');
  }
}

// =========================================================================
// 3. COLLAPSIBLE PANELS (Diagnostics + Settings)
// =========================================================================

function wireCollapsible(toggleBtn, panelEl) {
  toggleBtn.addEventListener('click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!expanded));
    panelEl.hidden = expanded;
  });
}
wireCollapsible(DIAG_TOGGLE, DIAG_PANEL);
wireCollapsible(SETTINGS_TOGGLE, SETTINGS_PANEL);

// =========================================================================
// 4. TAB HELPERS
// =========================================================================

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isInjectable(tab) {
  if (!tab || !tab.url) return false;
  try {
    const scheme = new URL(tab.url).protocol;
    return !BLOCKED_SCHEMES.has(scheme);
  } catch (_) {
    return false;
  }
}

async function getContentState(tabId) {
  try {
    const resp = await chrome.tabs.sendMessage(tabId, { type: 'status' }, { frameId: 0 });
    if (resp && resp.installed) {
      return { installed: true, enabled: !!resp.enabled, version: resp.version };
    }
    return { installed: false, enabled: false };
  } catch (_) {
    return { installed: false, enabled: false };
  }
}

async function injectContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

async function sendToActiveTab(message) {
  const tab = await getActiveTab();
  if (!tab) throw new Error('No active tab');
  return chrome.tabs.sendMessage(tab.id, message, { frameId: 0 });
}

// =========================================================================
// 5. UI RENDERING
// =========================================================================

function setStatus(level, label, sub) {
  STATUS_DOT.classList.remove('on', 'off', 'error');
  STATUS_DOT.classList.add(level);
  STATUS_TEXT.textContent = label;
  if (sub !== undefined) STATUS_SUB.textContent = sub;
}

function renderStatus({ installed, enabled }) {
  if (!installed) {
    setStatus('off', 'Not enabled', 'Click Enable to inject the script');
  } else if (enabled) {
    setStatus('on',  'Enabled on this tab', 'Press 1–4 to select options');
  } else {
    setStatus('off', 'Disabled on this tab', 'Click Enable to resume');
  }
  ENABLE_BTN.disabled  = !installed ? false : enabled;
  DISABLE_BTN.disabled = !installed || !enabled;
  DIAG_BTN.disabled    = !installed;
}

async function refresh() {
  const tab = await getActiveTab();
  if (!tab) {
    setStatus('error', 'No active tab', '');
    ENABLE_BTN.disabled = true;
    DISABLE_BTN.disabled = true;
    DIAG_BTN.disabled = true;
    return;
  }
  if (!isInjectable(tab)) {
    setStatus('error', 'Cannot run on this page',
              'Browser-internal URL (chrome://, store, PDF viewer)');
    ENABLE_BTN.disabled = true;
    DISABLE_BTN.disabled = true;
    DIAG_BTN.disabled = true;
    return;
  }
  const state = await getContentState(tab.id);
  renderStatus(state);
}

// =========================================================================
// 6. BUTTON HANDLERS
// =========================================================================

ENABLE_BTN.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab || !isInjectable(tab)) return;

  let isCCBP = false;
  try {
    const url = new URL(tab.url);
    isCCBP = url.protocol === 'https:' && url.hostname === 'learning.ccbp.in';
  } catch (_) {}

  let persistAcrossCCBPRoutes = false;
  if (isCCBP) {
    try {
      persistAcrossCCBPRoutes = await chrome.permissions.contains({ origins: [CCBP_ORIGIN_PATTERN] });
      if (!persistAcrossCCBPRoutes) {
        // This is a narrow permission for learning.ccbp.in only, requested
        // from the user's Enable click. It is not the all-sites dark-mode grant.
        persistAcrossCCBPRoutes = await chrome.permissions.request({ origins: [CCBP_ORIGIN_PATTERN] });
      }
    } catch (permissionError) {
      warn('CCBP route permission was not granted:', permissionError);
      persistAcrossCCBPRoutes = false;
    }
  }

  const originalLabel = ENABLE_BTN.querySelector('.btn-label').textContent;
  ENABLE_BTN.querySelector('.btn-label').textContent = 'Enabling…';
  ENABLE_BTN.disabled = true;

  try {
    const before = await getContentState(tab.id);
    if (!before.installed) {
      log('Injecting content.js into top-level tab', tab.id);
      await injectContentScript(tab.id);
      log('Injection complete.');
    } else {
      log('Script already installed; sending enable only.');
    }
    await chrome.tabs.sendMessage(tab.id, { type: 'enable' }, { frameId: 0 });
    await chrome.tabs.sendMessage(tab.id, {
      type: 'setPracticeSubmit',
      enabled: settings.practiceSubmit
    }, { frameId: 0 });

    if (isCCBP) {
      await chrome.storage.local.set({ [CCBP_NAV_ENABLED_KEY]: persistAcrossCCBPRoutes });
      if (persistAcrossCCBPRoutes) {
        log('CCBP route persistence enabled for learning.ccbp.in.');
      } else {
        alert('KeyPilot is enabled on this CCBP tab, but Chrome site access was not granted. To keep it working after moving to another CCBP quiz page, click Enable again and allow access to learning.ccbp.in.');
      }
    }
    log('Enable message sent.');
  } catch (err) {
    warn('Enable failed:', err);
    setStatus('error', 'Enable failed', err && err.message ? err.message : String(err));
    alert('Could not enable on this tab.\n\n' + (err && err.message ? err.message : err));
  } finally {
    ENABLE_BTN.querySelector('.btn-label').textContent = originalLabel;
    await refresh();
  }
});

DISABLE_BTN.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab) return;

  let isCCBP = false;
  try {
    const url = new URL(tab.url);
    isCCBP = url.protocol === 'https:' && url.hostname === 'learning.ccbp.in';
  } catch (_) {}

  if (isCCBP) {
    try {
      await chrome.storage.local.set({ [CCBP_NAV_ENABLED_KEY]: false });
    } catch (storageError) {
      warn('Could not clear saved CCBP navigation setting:', storageError);
    }
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'disable' }, { frameId: 0 });
    log('Disable message sent.');
  } catch (err) {
    warn('Disable failed:', err);
  }
  await refresh();
});

// =========================================================================
// 7. DIAGNOSTICS (real checks, loading/success/error states)
// =========================================================================

let lastDiagReport = null;

function setDiagStatus(level, message) {
  DIAG_STATUS.classList.remove('ok', 'warn', 'error');
  if (level) DIAG_STATUS.classList.add(level);
  DIAG_STATUS.textContent = message;
}

DIAG_BTN.addEventListener('click', async () => {
  const tab = await getActiveTab();
  if (!tab) {
    setDiagStatus('error', 'No active tab found. Open a quiz page and try again.');
    DIAG_OUT.textContent = '';
    return;
  }

  DIAG_BTN.disabled = true;
  COPY_BTN.disabled = true;
  setDiagStatus('', 'Running diagnostics…');
  DIAG_OUT.textContent = 'Loading…';

  try {
    if (!isInjectable(tab)) {
      setDiagStatus('error',
        `Cannot inspect this page. The current URL is a browser-internal page ` +
        `(chrome://, Chrome Web Store, PDF viewer, etc.) where Chrome blocks content scripts. ` +
        `Open a normal web page or the local practice-quiz-portal.html file and try again.`);
      DIAG_OUT.textContent = '';
      lastDiagReport = null;
      return;
    }

    const resp = await chrome.tabs.sendMessage(tab.id, { type: 'diagnose' }, { frameId: 0 });

    if (!resp || !resp.ok) {
      setDiagStatus('error',
        'Content script is not injected on this tab. Click "Enable on this tab" first, ' +
        'then run diagnostics again. (' + (resp && resp.error ? resp.error : 'no response') + ')');
      DIAG_OUT.textContent = '';
      lastDiagReport = null;
      return;
    }

    const lines = [];
    lines.push('=== KeyPilot Diagnostics ===');
    lines.push(`generated:   ${new Date().toISOString()}`);
    lines.push(`extension:   v${VERSION}`);
    lines.push(`content:     v${resp.version}`);
    lines.push(`enabled:     ${resp.enabled}`);
    lines.push(`tab.id:      ${tab.id}`);
    lines.push(`tab.url:     ${tab.url}`);
    lines.push(`page.url:    ${resp.url}`);
    lines.push(`detector:    ${resp.detectionMode || 'legacy'}`);
    lines.push(`injectable:  yes`);
    lines.push(`practice:    setting=${resp.practiceSubmitSetting} pageAuthorized=${resp.practicePageAuthorized}`);
    lines.push(`submitBtn:   ${resp.submitButtonFound ? 'found' : 'not found'}`);
    lines.push(`buttonText:  ${resp.submitButtonText || '(none)'}`);
    lines.push(`answer:      ${resp.answerSelected ? 'selected' : 'not selected'}`);
    const q = resp.question;
    const qDesc = q
      ? q.tag +
        (q.testid ? `[data-testid="${q.testid}"]` : '') +
        (q.id ? '#' + q.id : '') +
        (q.className ? '.' + String(q.className).split(' ').join('.') : '')
      : '(none found)';
    lines.push(`question:    ${qDesc}`);
    lines.push(`options:     ${resp.optionCount}`);
    if (resp.options && resp.options.length) {
      resp.options.forEach((o, i) => lines.push(`  [${i + 1}] ${o}`));
    }
    lines.push('=== End ===');
    const report = lines.join('\n');
    DIAG_OUT.textContent = report;
    lastDiagReport = report;

    if (!q) {
      setDiagStatus('warn',
        `Content script is running on this tab, but no question container was detected. ` +
        `The page may not be a quiz, or its selectors don't match KeyPilot's QUESTION_SELECTORS. ` +
        `Inspect the page DOM and update the selectors in content.js if needed.`);
    } else if (resp.optionCount === 0) {
      setDiagStatus('warn',
        `Question container found (${qDesc}), but 0 answer options detected inside it. ` +
        `The page may use a non-standard option pattern. Check the DOM and add the ` +
        `option selector to content.js if needed.`);
    } else {
      setDiagStatus('ok',
        `Diagnostics OK. Question detected with ${resp.optionCount} option(s). ` +
        `Press 1–4 on the page to select an option.`);
    }
    COPY_BTN.disabled = false;
    log('Diagnostics:', resp);
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    setDiagStatus('error',
      `Diagnostics failed: ${msg}. ` +
      `This usually means the content script isn't injected. Click "Enable on this tab" and try again.`);
    DIAG_OUT.textContent = '';
    lastDiagReport = null;
    warn('Diagnostics failed:', e);
  } finally {
    DIAG_BTN.disabled = false;
  }
});

COPY_BTN.addEventListener('click', async () => {
  if (!lastDiagReport) return;
  try {
    await navigator.clipboard.writeText(lastDiagReport);
    const original = COPY_BTN.textContent;
    COPY_BTN.textContent = 'Copied!';
    setTimeout(() => { COPY_BTN.textContent = original; }, 1500);
    log('Debug report copied to clipboard.');
  } catch (e) {
    warn('Clipboard write failed:', e);
    const range = document.createRange();
    range.selectNode(DIAG_OUT);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    alert('Clipboard write failed. The diagnostics text is now selected — press Ctrl+C to copy.');
  }
});

// =========================================================================
// 8. LIFECYCLE
// =========================================================================

applyTheme(DEFAULT_THEME);
applyReducedMotion(false);
loadSettings();
initGitHubLink();
refresh();

chrome.tabs?.onActivated?.addListener(refresh);
chrome.tabs?.onUpdated?.addListener((tabId, changeInfo, _tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([active]) => {
      if (active && active.id === tabId) refresh();
    });
  }
});

// =========================================================================
// 10-SECOND LIVE RE-CHECK (added v2.2.12)
// =========================================================================
// The user asked the popup to keep re-checking the active tab every 10
// seconds so the status card ("Enabled / Disabled / Submit-button found")
// stays live while the popup is open. This is important on SPA quiz
// portals where the question changes without a page navigation — the
// popup must reflect the new question's submit/next button state without
// requiring the user to close and reopen the popup.
//
// The interval is created once at popup open and cleared on
// window.unload (popup closes). It does NOT poll when the popup is closed,
// so it costs zero CPU/battery when not in use. The poll itself is a single
// lightweight `chrome.tabs.sendMessage` round-trip per 10 s.
let liveCheckInterval = null;
const LIVE_CHECK_MS = 10_000;

function startLiveCheck() {
  if (liveCheckInterval) return; // already running
  // Kick one immediately so the user sees fresh state right away, then
  // repeat every 10 s while the popup stays open.
  refresh();
  liveCheckInterval = setInterval(refresh, LIVE_CHECK_MS);
  log(`Live re-check started (every ${LIVE_CHECK_MS / 1000}s).`);
}

function stopLiveCheck() {
  if (liveCheckInterval) {
    clearInterval(liveCheckInterval);
    liveCheckInterval = null;
    log('Live re-check stopped (popup closing).');
  }
}

// Start the 10-second loop as soon as initial setup completes.
startLiveCheck();
// Stop it when the popup window closes so we don't leak an interval.
window.addEventListener('unload', stopLiveCheck, { once: true });

chrome.storage?.onChanged?.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes[THEME_KEY]) {
    const next = changes[THEME_KEY].newValue;
    applyTheme(VALID_THEMES.has(next) ? next : DEFAULT_THEME);
  }
  if (changes[REDUCED_MOTION_KEY]) {
    const on = changes[REDUCED_MOTION_KEY].newValue === true;
    applyReducedMotion(on);
    settings.reducedMotion = on;
    if (REDUCED_MOTION) REDUCED_MOTION.checked = on;
  }
  if (changes[PRACTICE_SUBMIT_KEY]) {
    const on = changes[PRACTICE_SUBMIT_KEY].newValue === true;
    settings.practiceSubmit = on;
    applyPracticeSubmit(on);
    if (PRACTICE_SUBMIT) PRACTICE_SUBMIT.checked = on;
  }
  if (changes[FORCE_DARK_MODE_KEY]) {
    const on = changes[FORCE_DARK_MODE_KEY].newValue === true;
    settings.forceDarkMode = on;
    renderDarkModeState(on);
  }
});
