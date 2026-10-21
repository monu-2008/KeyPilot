/**
 * KeyPilot by AQERIONX — content script (Manifest V3, v2.2.12)
 *
 * WHAT THIS FILE DOES
 *   Listens for keys 1-4 and selects the matching answer option on the
 *   currently visible quiz question. It supports:
 *     - visible <input type="radio">
 *     - hidden <input type="radio"> paired with a visible <label> (the most
 *       common pattern in modern styled forms — including the portal's
 *       label.radioButtonLabel + BaseRadioButtonWrapper pattern)
 *     - accessible custom radios ([role="radio"], [role="checkbox"])
 *     - common custom option classes ([data-option], .quiz-option, …)
 *     - portal-specific testid-based containers ([data-testid="card"],
 *       [data-testid="radioGroupOptions"])
 *
 *   Optionally listens for Enter OR Space to click the Submit button — when
 *   the user enables the "Enter / Space to submit" toggle in the popup. As of
 *   v2.2.8 this works on EVERY http(s)/file website, not just CCBP practice
 *   routes. As of v2.2.12, Shift+Enter / Shift+Space click the Next / Continue /
 *   Skip button (forward navigation only — never Previous / Back). It is a
 *   keyboard shortcut for a click the user could perform manually; it does not
 *   read, reveal, or upload answer content, and does not bypass any proctoring
 *   or attempt-limit control.
 *   Additionally: never activates Next as a side effect of plain Enter, never
 *   activates Previous / Back via Shift+Enter, never clicks disabled buttons,
 *   requires an answer to be selected for plain Enter (when options exist),
 *   and debounces Enter+Space so both can't fire for the same question.
 *
 * PORTAL-SPECIFIC SELECTORS (reported DOM)
 *   Based on the supplied DOM inspection report:
 *     - [data-testid="card"]              → quiz card (question container)
 *     - div[data-testid="radioGroupOptions"] → answer container
 *     - label.radioButtonLabel             → visible label for each option
 *     - [class*="BaseRadioButtonWrapper"]  → styled-components wrapper
 *   These are treated as REPORTED FINDINGS, not guaranteed permanent.
 *   Stable attributes (data-testid) are preferred; partial class matches
 *   ([class*="…"]) handle styled-components hash suffixes that change
 *   between builds.
 *
 * WHAT IT DOES NOT DO
 *   - Touch timers, attempts, sessions, or proctoring.
 *   - Read or upload answer content.
 *   - Hide itself or spoof user activity.
 *   - Bypass automation detection or termination controls.
 *
 * DEBUGGING
 *   This script runs in an ISOLATED WORLD (MV3 content-script isolation).
 *   `window.__quizKeyboardNav` is NOT visible from the page's default
 *   DevTools console. To inspect it, open DevTools → Console → click the
 *   "top" dropdown (top-left of the Console panel) → choose
 *   "KeyPilot" context. See README.md for step-by-step guidance.
 */

(() => {
  'use strict';

  // KeyPilot tab commands and diagnostics target the top-level page. Do not
  // install keyboard handlers inside unrelated third-party iframes (for
  // example, embedded engagement/tracking frames).
  if (window.top !== window) return;

  // =========================================================================
  // 1. Duplicate-injection guard
  //    On re-Enable, popup.js may call executeScript again. Without this
  //    guard, every re-injection would register a second keydown listener
  //    and each keypress would select twice.
  // =========================================================================
  if (window.__quizKeyboardNavInstalled) {
    // Already running. Just re-enable in case we were disabled.
    if (window.__quizKeyboardNav) {
      window.__quizKeyboardNav.setEnabled(true);
    }
    return;
  }
  window.__quizKeyboardNavInstalled = true;

  // =========================================================================
  // 2. State + constants
  // =========================================================================
  const TAG = '[KeyPilot]';
  const VERSION = '2.2.12';

  let enabled = true;
  let practiceSubmit = false;     // Enter-to-submit toggle (honored on any http/https/file page when ON)
  let indicatorEl = null;
  let indicatorTimer = null;
  let lastSelectedKey = null;        // debounces identical repeat keydown
  let lastSelectedAt = 0;
  let lastDetectionStrategy = 'not-run';

  // Question containers — most specific first. `form` is last-resort only,
  // because a quiz page often has one huge <form> wrapping everything.
  //
  // Portal-specific (v1.2.0): [data-testid="card"] and
  // div[data-testid="radioGroupOptions"] are added at the top because
  // data-testid attributes are stable across builds. The radioGroupOptions
  // container is smaller and more precise, so the size-based filter in
  // getCurrentlyVisibleQuestion will prefer it over the card when both exist.
  const QUESTION_SELECTORS = [
    '[data-testid="radioGroupOptions"]',
    '[data-testid="card"]',
    '[role="radiogroup"]',
    'fieldset',
    '[role="group"]',
    '[data-question]',
    '[data-question-id]',
    '.question',
    '.quiz-question',
    'form'
  ].join(', ');

  // Custom (non-radio) option patterns. Used only when no real radios found.
  const CUSTOM_OPTION_SELECTORS = [
    '[role="radio"]',
    '[role="checkbox"]',
    '[aria-checked]',
    '[data-answer]',
    '[data-option]',
    '[data-option-index]',
    '[data-index]',
    '.quiz-option',
    '.answer-option',
    '.option',
    '.choice',
    '[class*="BaseRadioButtonWrapper"]'
  ].join(', ');

  // Classes that mark the visible wrapper of a hidden radio.
  // Portal-specific (v1.2.0): label.radioButtonLabel and
  // [class*="BaseRadioButtonWrapper"] handle the reported portal DOM.
  // The [class*=] partial match covers styled-components hash suffixes
  // (e.g. BaseRadioButtonWrapper-bjpxEr) that change between builds.
  const VISIBLE_WRAPPER_SELECTORS = [
    'label',
    'label.radioButtonLabel',
    '[class*="BaseRadioButtonWrapper"]',
    '[data-option]',
    '[data-option-index]',
    '.quiz-option',
    '.answer-option',
    '.option',
    '.choice'
  ].join(', ');

  const INDICATOR_ID = '__quiz_kb_nav_indicator__';
  const INDICATOR_TTL_MS = 1800;

  // ── Question cache (v2.2.12) ────────────────────────────────────────────
  // Caches the currently-visible question + its detection strategy + its
  // options for a short TTL so rapid 1-4 keypresses don't re-scan the whole
  // DOM each time. Invalidated after submit/next clicks and on navigation.
  const QUESTION_CACHE_TTL = 600; // ms — short enough to stay fresh on SPAs,
                                  // long enough to cover a rapid keypress burst
  let _cachedQuestion = null;
  let _cachedStrategy = 'not-run';
  let _cachedAt = 0;
  let _cachedOptionsForQuestion = null;

  function _setQuestionCache(el, strategy) {
    _cachedQuestion = el;
    _cachedStrategy = strategy;
    _cachedAt = Date.now();
  }
  function _invalidateQuestionCache() {
    _cachedQuestion = null;
    _cachedOptionsForQuestion = null;
    _cachedStrategy = 'not-run';
    _cachedAt = 0;
  }

  // Invalidate cache on SPA navigation (URL change without full reload).
  let _lastUrl = location.href;
  setInterval(() => {
    if (location.href !== _lastUrl) {
      _lastUrl = location.href;
      _invalidateQuestionCache();
    }
  }, 1000);

  // =========================================================================
  // 3. Logging — every diagnostic goes through here so it's easy to grep
  //    page console output for "[Quiz Keyboard Navigator]".
  // =========================================================================
  function log(...args)  { console.log(TAG, ...args); }
  function warn(...args) { console.warn(TAG, ...args); }
  function err(...args)  { console.error(TAG, ...args); }

  // =========================================================================
  // 4. DOM helpers
  // =========================================================================

  /** Is the user currently typing in a text field, textarea, or contenteditable? */
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'textarea') return true;
    if (el.isContentEditable) return true;
    if (tag === 'input') {
      const type = (el.type || 'text').toLowerCase();
      // Radio/checkbox/submit/button inputs are NOT typing targets.
      const nonTextTypes = new Set([
        'radio', 'checkbox', 'submit', 'button', 'image',
        'reset', 'file', 'hidden', 'range', 'color'
      ]);
      return !nonTextTypes.has(type);
    }
    return false;
  }

  /** Is this element visually rendered (non-zero size, not display:none)? */
  function isVisible(el) {
    if (!el || !el.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (parseFloat(style.opacity) === 0) return false;
    return true;
  }

  /**
   * Given a hidden radio input, find its visible clickable wrapper.
   * Tries, in order:
   *   1. ancestor <label>
   *   2. <label for="<radio.id>"> inside the question container
   *   3. element referenced by aria-labelledby
   *   4. ancestor matching one of VISIBLE_WRAPPER_SELECTORS
   *   5. the radio itself (last resort)
   */
  function findVisibleWrapperForRadio(radio, questionEl) {
    // 1. ancestor <label>
    const ancestorLabel = radio.closest('label');
    if (ancestorLabel && isVisible(ancestorLabel)) return ancestorLabel;

    // 2. <label for="radioId">
    if (radio.id) {
      try {
        const byFor = questionEl.querySelector(`label[for="${CSS.escape(radio.id)}"]`);
        if (byFor && isVisible(byFor)) return byFor;
      } catch (_) { /* CSS.escape shouldn't throw on a real id, but be safe */ }
    }

    // 3. aria-labelledby
    const labelledBy = radio.getAttribute('aria-labelledby');
    if (labelledBy) {
      const ids = labelledBy.trim().split(/\s+/);
      for (const id of ids) {
        const ref = document.getElementById(id);
        if (ref && isVisible(ref)) return ref;
      }
    }

    // 4. ancestor custom-option wrapper
    const wrapper = radio.closest(VISIBLE_WRAPPER_SELECTORS);
    if (wrapper && isVisible(wrapper)) return wrapper;

    // 5. fallback to the radio itself
    return radio;
  }

  // =========================================================================
  // 5. Option discovery
  //    Returns an array of normalized "option" objects:
  //      {
  //        kind:      'radio' | 'custom',
  //        radio:     HTMLInputElement | null,
  //        target:    HTMLElement,            // visible element for indicator + click
  //        isInteractive: () => boolean,
  //        isSelected:    () => boolean,
  //        describe:     () => string
  //      }
  //    Selecting is centralized in selectOption() so verification is uniform.
  // =========================================================================

  function buildRadioOption(radio, questionEl) {
    const target = findVisibleWrapperForRadio(radio, questionEl);
    return {
      kind: 'radio',
      radio,
      target,
      // For radios we do NOT check visibility — hidden radios paired with
      // visible labels are the standard pattern. We only reject disabled
      // or aria-disabled radios.
      isInteractive: () => {
        if (radio.disabled) return false;
        if (radio.getAttribute('aria-disabled') === 'true') return false;
        return true;
      },
      isSelected: () => radio.checked,
      describe: () => {
        const label = target === radio ? 'radio' : target.tagName.toLowerCase();
        const cls = target.className && typeof target.className === 'string'
          ? target.className.split(' ').slice(0, 2).join('.')
          : '';
        return `<input type=radio name="${radio.name || ''}" value="${radio.value || ''}"> via <${label}${cls ? ' class="' + cls + '"' : ''}>`;
      }
    };
  }

  function buildCustomOption(el) {
    const role = el.getAttribute('role');
    return {
      kind: 'custom',
      radio: null,
      target: el,
      isInteractive: () => {
        if (el.disabled) return false;
        if (el.getAttribute('aria-disabled') === 'true') return false;
        return isVisible(el);
      },
      isSelected: () => {
        if (role === 'radio' || role === 'checkbox') {
          return el.getAttribute('aria-checked') === 'true';
        }
        if (el.getAttribute('data-selected') === 'true') return true;
        if (el.classList.contains('selected')) return true;
        return false;
      },
      describe: () => {
        const text = (el.textContent || '').trim().slice(0, 30);
        return `<${el.tagName.toLowerCase()} role="${role || ''}"> "${text}"`;
      }
    };
  }

  /**
   * Find all answer options inside a question container.
   * Strategy (first non-empty wins):
   *   1. Real <input type="radio"> (including hidden ones paired with a visible label)
   *   2. Custom [role="radio"], [role="checkbox"], .quiz-option, etc.
   *
   * Dedup: if a wrapper contains a radio, the wrapper is NOT also returned
   * as a custom option (we'd otherwise double-count the same option).
   */
  function getOptionsForQuestion(questionEl) {
    if (!questionEl) return [];

    // Fast path: if this is the cached question and we have cached options,
    // return them. This makes the 2nd+ keypress in a burst nearly free.
    if (questionEl === _cachedQuestion && _cachedOptionsForQuestion &&
        (Date.now() - _cachedAt) < QUESTION_CACHE_TTL) {
      return _cachedOptionsForQuestion;
    }
    const isCachedQ = (questionEl === _cachedQuestion);

    // Prefer real radios where available, including hidden radios paired with
    // visible labels. This avoids double-counting wrappers around native inputs.
    const radios = Array.from(questionEl.querySelectorAll('input[type="radio"]'));
    if (radios.length > 0) {
      const result = radios.map(radio => buildRadioOption(radio, questionEl));
      if (isCachedQ) _cachedOptionsForQuestion = result;
      return result;
    }

    // Runtime-adaptive custom controls. Prefer semantic answer nodes (ARIA roles,
    // checked state, explicit data attributes) over nested visual wrappers.
    const custom = Array.from(questionEl.querySelectorAll(CUSTOM_OPTION_SELECTORS))
      .filter(el => {
        if (!isVisible(el)) return false;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
        return true;
      });

    const priority = el => {
      const role = el.getAttribute('role');
      if (role === 'radio' || role === 'checkbox' || el.hasAttribute('aria-checked')) return 100;
      if (el.hasAttribute('data-answer') || el.hasAttribute('data-option') ||
          el.hasAttribute('data-option-index') || el.hasAttribute('data-index')) return 90;
      if (el.classList.contains('quiz-option') || el.classList.contains('answer-option') ||
          el.classList.contains('option') || el.classList.contains('choice') ||
          (typeof el.className === 'string' && el.className.includes('BaseRadioButtonWrapper'))) return 80;
      return 50;
    };

    // Keep one clickable node for each nested option: use the highest-priority
    // semantic node and discard any matched ancestor/descendant duplicate.
    const ranked = custom.map((element, order) => ({ element, order, score: priority(element) }))
      .sort((a, b) => b.score - a.score || a.order - b.order);
    const deduped = [];
    for (const item of ranked) {
      const el = item.element;
      const overlaps = deduped.some(existing => existing === el ||
        existing.contains(el) || el.contains(existing));
      if (!overlaps) deduped.push(el);
    }

    const result = deduped
      .sort((a, b) => {
        if (a === b) return 0;
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      })
      .map(buildCustomOption);
    if (isCachedQ) _cachedOptionsForQuestion = result;
    return result;
  }

  // =========================================================================
  // 6. Question discovery
  //    Picks the question container whose center is closest to the viewport's
  //    vertical center. Filters out containers that are way larger than the
  //    viewport (likely whole-page <form> wrappers) when smaller specific
  //    containers exist.
  // =========================================================================

  function getFallbackRadioQuestion() {
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'))
      .filter(radio => {
        if (radio.disabled || radio.getAttribute('aria-disabled') === 'true') return false;
        const label = radio.closest('label');
        return isVisible(radio) || (label && isVisible(label));
      });
    if (radios.length < 2) return null;

    // Prefer explicit option/question containers, then group by the native
    // radio name and form owner. This fallback is route-independent and only
    // runs when the normal quiz container selectors find no options.
    const groups = new Map();
    const formIds = new WeakMap();
    let nextFormId = 1;
    const getFormId = form => {
      if (!form) return 'no-form';
      if (!formIds.has(form)) formIds.set(form, nextFormId++);
      return formIds.get(form);
    };

    radios.forEach(radio => {
      const explicitScope = radio.closest(
        '[data-testid="radioGroupOptions"], [role="radiogroup"], fieldset, ' +
        '[data-question], [data-question-id], .question, .quiz-question, [data-testid="card"]'
      );
      const key = explicitScope || (radio.name
        ? `form:${getFormId(radio.form)}:name:${radio.name}`
        : (radio.closest('form') || radio.parentElement || radio));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(radio);
    });

    const fallbackCandidates = [];
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      let current = group[0].parentElement;
      let best = null;
      while (current && current !== document.documentElement) {
        const count = current.querySelectorAll('input[type="radio"]').length;
        if (count < group.length || !group.every(radio => current.contains(radio))) break;
        if (count === group.length) best = current;
        else break;
        current = current.parentElement;
      }
      if (best) fallbackCandidates.push(best);
    }

    if (!fallbackCandidates.length) return null;
    const viewportCenter = window.innerHeight / 2;
    return fallbackCandidates.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return Math.abs(ar.top + ar.height / 2 - viewportCenter) -
             Math.abs(br.top + br.height / 2 - viewportCenter);
    })[0];
  }

  function getFallbackCustomQuestion() {
    const customOptions = Array.from(document.querySelectorAll(CUSTOM_OPTION_SELECTORS))
      .filter(el => {
        if (!isVisible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
        // Avoid considering a custom wrapper that actually contains a native radio;
        // native radios are handled by getFallbackRadioQuestion().
        return !el.querySelector('input[type="radio"]');
      });
    if (customOptions.length < 2) return null;

    // If a quiz does not use known card classes or stable test IDs, walk up from
    // each visible option and evaluate nearby ancestors as candidate question
    // scopes. No page text is stored or sent anywhere; each shortcut re-scans live DOM.
    const scopes = new Set();
    for (const option of customOptions) {
      let current = option.parentElement;
      let depth = 0;
      while (current && current !== document.documentElement && depth < 7) {
        const optionCount = getOptionsForQuestion(current).length;
        if (optionCount >= 2 && optionCount <= 8) scopes.add(current);
        current = current.parentElement;
        depth += 1;
      }
    }

    const candidates = Array.from(scopes).map(element => {
      const options = getOptionsForQuestion(element);
      const rect = element.getBoundingClientRect();
      return {
        element,
        optionCount: options.length,
        area: Math.max(0, rect.width) * Math.max(0, rect.height),
        distance: Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2)
      };
    }).filter(candidate =>
      candidate.optionCount >= 2 && candidate.optionCount <= 8 &&
      candidate.area > 0 && isVisible(candidate.element)
    );

    // Tightest plausible group wins; the viewport center breaks ties when
    // a page has more than one visible question or option group.
    candidates.sort((a, b) => a.area - b.area || a.distance - b.distance);
    return candidates[0]?.element || null;
  }

  function getCurrentlyVisibleQuestion() {
    // ── Fast path: short-lived cache (added v2.2.12) ───────────────────────
    // On large SPA quiz pages, the full DOM scan below can take 50–200ms per
    // call because CUSTOM_OPTION_SELECTORS includes [aria-checked] which
    // matches hundreds of elements on React pages. When the user presses
    // 1-4 rapidly, each keypress re-scans. This cache returns the previously
    // found question if it's still connected and within TTL, so only the
    // FIRST keypress in a burst pays the scan cost. The cache is invalidated
    // after submit/next clicks (question likely changes) and on URL change.
    const now = Date.now();
    if (_cachedQuestion && _cachedQuestion.isConnected &&
        (now - _cachedAt) < QUESTION_CACHE_TTL) {
      lastDetectionStrategy = _cachedStrategy;
      return _cachedQuestion;
    }

    const allCandidates = Array.from(document.querySelectorAll(QUESTION_SELECTORS));

    // Start with known semantic selectors on every key press. This runs against
    // the current DOM, so SPA route changes and question re-renders are not cached.
    const withOptions = allCandidates.filter(c => getOptionsForQuestion(c).length > 0);
    if (withOptions.length > 0) {
      // Filter out oversized containers (more than 2x viewport height) IF
      // we have smaller alternatives. This avoids picking a whole-page <form>.
      const vh = window.innerHeight;
      const small = withOptions.filter(c => c.getBoundingClientRect().height <= vh * 2);
      const candidates = small.length > 0 ? small : withOptions;

      const viewportCenter = vh / 2;
      let best = candidates[0];
      let bestDist = Infinity;
      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) {
          best = el;
          bestDist = dist;
        }
      }
      lastDetectionStrategy = 'known-selectors';
      _setQuestionCache(best, 'known-selectors');
      return best;
    }

    const radioFallback = getFallbackRadioQuestion();
    if (radioFallback) {
      lastDetectionStrategy = 'native-radio-fallback';
      _setQuestionCache(radioFallback, 'native-radio-fallback');
      return radioFallback;
    }

    const customFallback = getFallbackCustomQuestion();
    if (customFallback) {
      lastDetectionStrategy = 'custom-option-fallback';
      _setQuestionCache(customFallback, 'custom-option-fallback');
      return customFallback;
    }

    lastDetectionStrategy = 'no-matching-question';
    _invalidateQuestionCache();
    return null;
  }

  // =========================================================================
  // 7. Selection — the heart of the fix.
  //    Uses the native HTMLInputElement.prototype.checked setter so React's
  //    value tracker doesn't get confused. Also dispatches input+change so
  //    React's onChange fires, AND clicks the visible target so non-React
  //    click handlers (and the browser's default label→input activation) fire.
  //    Verifies the post-click state and reports honestly.
  // =========================================================================

  // Cache the native setter once (React/Vue/etc. override the property on
  // the instance, so going through the prototype bypasses their override).
  const nativeCheckedSetter =
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked') &&
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'checked').set;

  function selectOption(option) {
    if (!option) {
      warn('selectOption called with no option');
      return { ok: false, verified: false, reason: 'no_option' };
    }

    if (!option.isInteractive()) {
      warn('Option not interactive (disabled or hidden):', option.describe());
      return { ok: false, verified: false, reason: 'not_interactive' };
    }

    const wasSelected = option.isSelected();

    if (option.kind === 'radio' && option.radio) {
      const radio = option.radio;

      // 1. Native setter — bypasses React's value tracker.
      if (nativeCheckedSetter) {
        try { nativeCheckedSetter.call(radio, true); } catch (e) { warn('setter failed', e); }
      } else {
        radio.checked = true;
      }

      // 2. Dispatch input + change so React's onChange / Vue's v-model fire.
      radio.dispatchEvent(new Event('input',  { bubbles: true }));
      radio.dispatchEvent(new Event('change', { bubbles: true }));

      // 3. Click the visible target. If target is a <label> wrapping the radio
      //    (or pointing to it via `for`), clicking the label also activates
      //    the radio per the HTML spec — which triggers any framework's
      //    onClick handler. If target IS the radio, this is redundant but harmless.
      try { option.target.click(); } catch (e) { warn('target.click failed', e); }

    } else {
      // Custom ARIA radio / checkbox / generic clickable.
      try { option.target.click(); } catch (e) { warn('target.click failed', e); }
      const role = option.target.getAttribute('role');
      if (role === 'radio' || role === 'checkbox') {
        // Best-effort ARIA state hint; framework may already set this.
        option.target.setAttribute('aria-checked', 'true');
      }
    }

    // Verify the resulting selection state where technically possible.
    // For radios this is reliable (radio.checked is the source of truth).
    // For custom widgets we check aria-checked / data-selected / .selected.
    const nowSelected = option.isSelected();
    showIndicator(option.target);

    log(
      `Selected ${option.describe()}`,
      `| wasSelected=${wasSelected}`,
      `| nowSelected=${nowSelected}`,
      `| verified=${nowSelected}`
    );

    return {
      ok: true,
      verified: nowSelected,
      reason: nowSelected
        ? (wasSelected ? 'already_selected' : 'selected_and_verified')
        : 'click_attempted_state_not_verified'
    };
  }

  // =========================================================================
  // 8. Visual indicator — positioned around the VISIBLE target (label or
  //    wrapper), not the hidden radio. Fixes the "indicator is invisible
  //    because the radio is opacity:0" bug.
  // =========================================================================

  function showIndicator(targetEl) {
    if (indicatorEl) {
      indicatorEl.remove();
      indicatorEl = null;
    }
    if (indicatorTimer) {
      clearTimeout(indicatorTimer);
      indicatorTimer = null;
    }

    const rect = targetEl.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Target itself is invisible — don't bother showing a 0×0 box.
      return;
    }

    const el = document.createElement('div');
    el.id = INDICATOR_ID;
    el.setAttribute('data-quiz-kb-indicator', 'true');
    el.style.cssText = [
      'position: fixed',
      `left: ${rect.left - 4}px`,
      `top: ${rect.top - 4}px`,
      `width: ${rect.width + 8}px`,
      `height: ${rect.height + 8}px`,
      'border: 3px solid #2563eb',
      'border-radius: 8px',
      'pointer-events: none',
      'z-index: 2147483647',
      'box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2)',
      'transition: opacity 0.2s ease',
      'opacity: 1'
    ].join('; ');
    document.documentElement.appendChild(el);
    indicatorEl = el;

    indicatorTimer = setTimeout(() => {
      if (indicatorEl) {
        indicatorEl.style.opacity = '0';
        const toRemove = indicatorEl;
        setTimeout(() => toRemove.remove(), 220);
        indicatorEl = null;
      }
    }, INDICATOR_TTL_MS);
  }

  function hideIndicator() {
    if (indicatorEl) { indicatorEl.remove(); indicatorEl = null; }
    if (indicatorTimer) { clearTimeout(indicatorTimer); indicatorTimer = null; }
  }

  // =========================================================================
  // 9. Key handler
  // =========================================================================

  /**
   * Is Enter/Space-to-submit authorized on the current page?
   *
   * As of v2.2.12 the feature is enabled on EVERY website — not just CCBP
   * practice routes. The only gate is the user's "Enter / Space to submit"
   * toggle in the popup. When that toggle is ON, Enter/Space will look for a
   * Submit/Check/Verify button on the current question and click it, on any
   * http(s)/file page.
   *
   * The remaining safety guards in handleSubmitKey() are preserved:
   *   - ignored while typing in a text field / contenteditable
   *   - ignored with Ctrl/Cmd/Alt held
   *   - requires an answer to be selected (when options exist)
   *   - never activates a "Next"-only button
   *   - never clicks a disabled button
   *   - debounces Enter+Space so both can't fire for the same question
   *
   * Note: this is a keyboard shortcut for a click the user could perform
   * manually. It does not read, reveal, or upload answer content, and does
   * not bypass any proctoring or attempt-limit control.
   */
  function isPracticePageAuthorized() {
    if (!practiceSubmit) return false;
    // Only run on real document pages. Browser-internal pages
    // (chrome://, about:, devtools:) are skipped because content scripts
    // can't be injected there anyway, but file: and loopback hosts are
    // explicitly allowed for local practice fixtures.
    const p = location.protocol;
    return p === 'http:' || p === 'https:' || p === 'file:';
  }

  /**
   * Read the "label text" of a button-shaped element from any of the common
   * sources portals use: visible textContent, value (for input[type=submit]),
   * aria-label, aria-labelledby (resolved), title, or data-testid. Returns a
   * trimmed lower-case string (or '' if none).
   *
   * Why so many sources: many modern portals use ICON-ONLY submit buttons
   * (just an SVG + aria-label) or styled <div role="button"> with a hidden
   * <span>. Reading only textContent would miss those.
   */
  function getButtonLabel(btn) {
    // 1. Visible text content (most common).
    let text = (btn.textContent || '').trim();
    // 2. <input type="submit"> uses .value, not textContent.
    if (!text && 'value' in btn) text = (btn.value || '').trim();
    // 3. aria-label is the standard accessible name for icon buttons.
    if (!text) {
      const al = btn.getAttribute('aria-label');
      if (al) text = al.trim();
    }
    // 4. aria-labelledby points to one or more element ids whose text is the label.
    if (!text) {
      const labelledBy = btn.getAttribute('aria-labelledby');
      if (labelledBy) {
        text = labelledBy.trim().split(/\s+/)
          .map(id => { const el = document.getElementById(id); return el ? (el.textContent || '').trim() : ''; })
          .join(' ')
          .trim();
      }
    }
    // 5. title attribute is a tooltip but is often the only text on icon buttons.
    if (!text) {
      const t = btn.getAttribute('title');
      if (t) text = t.trim();
    }
    // 6. data-testid is a last-resort hint (e.g. data-testid="submit-btn").
    //    Only used when nothing else is available.
    if (!text) {
      const dt = btn.getAttribute('data-testid') || btn.getAttribute('data-test');
      if (dt && /submit|check|verify/i.test(dt)) text = dt.trim();
    }
    return text.toLowerCase();
  }

  /**
   * Is a button's label a "submit" action (not navigation)?
   *
   * Accepts: submit, submit answer, submit & next, submit quiz, check answer,
   *          check, verify, icon buttons labelled "Submit" via aria-label.
   * Rejects (exact match only, so multi-word labels still fall through):
   *          next, next question, continue, skip, previous, prev, back,
   *          cancel, close, finish, save, save & exit, exit.
   *
   * Why not "answer" / "grade" / "evaluate": those words are ambiguous.
   * "Show Answer" / "Gradebook" / "Evaluate Quiz" are not submit buttons.
   * The conservative submit|check|verify set covers every real submit label
   * we've seen across CCBP, Quizlet, Kahoot-style portals and Google Forms.
   */
  function isSubmitLabel(text) {
    if (!text) return false;
    const t = text.trim().toLowerCase();
    // Exact-match pure navigation labels — never treated as submit even
    // if they happen to contain a stray word.
    const pureNav =
      /^(next|next question|continue|skip|skip question|previous|prev|back|cancel|close|finish|save|save & exit|save and exit|exit)$/;
    if (pureNav.test(t)) return false;
    // Any submit-like action word anywhere in the label.
    return /\b(submit|check|verify)\b/.test(t);
  }

  /**
   * Find a Submit/Check/Verify button for the current question.
   *
   * Strategy (in order, first visible match wins):
   *   1. Search the question scope + known parent scopes (card, fieldset,
   *      question container, form). This is the normal case where Submit
   *      lives next to the options.
   *   2. If nothing is found in-scope, fall back to a whole-document search
   *      for the closest visible, enabled submit-labelled button. This
   *      covers portals that render the Submit button in a page-level
   *      toolbar, a sticky footer, or a modal — outside the question card.
   *
   * In BOTH passes we use the same getButtonLabel + isSubmitLabel checks so
   * icon-only buttons (aria-label="Submit"), <input type=submit>, and
   * multi-word labels ("Submit Answer", "Submit & Next", "Check Answer")
   * all match, while "Next" / "Continue" / "Skip" / "Save" are excluded.
   *
   * Returns null if no eligible button is found.
   */
  function findSubmitButton(questionEl) {
    if (!questionEl) return null;

    const SUBMIT_SELECTOR = 'button, [role="button"], input[type="submit"], [data-testid*="submit" i], [data-testid*="check" i]';

    const isEligible = (btn) => {
      if (!btn || btn.disabled) return false;
      if (btn.getAttribute('aria-disabled') === 'true') return false;
      return isSubmitLabel(getButtonLabel(btn));
    };

    // ---- Pass 1: question scope + known parent scopes ----------------------
    const scopes = [];
    const addScope = (el) => {
      if (el && !scopes.includes(el)) scopes.push(el);
    };
    addScope(questionEl);
    addScope(questionEl.closest('[data-testid="card"]'));
    addScope(questionEl.closest('fieldset'));
    addScope(questionEl.closest('[data-question], [data-question-id], .question, .quiz-question'));
    addScope(questionEl.closest('form'));
    addScope(questionEl.closest('[role="dialog"], [role="tabpanel"], [aria-modal="true"]'));
    addScope(questionEl.closest('main, [role="main"], #root, body'));

    for (const scope of scopes) {
      if (!scope || !scope.querySelectorAll) continue;
      const candidates = Array.from(scope.querySelectorAll(SUBMIT_SELECTOR)).filter(isEligible);
      const visibleCandidate = candidates.find(isVisible);
      if (visibleCandidate) return visibleCandidate;
    }

    // ---- Pass 2: whole-document fallback -----------------------------------
    // Some portals render the Submit button at the page level (sticky footer,
    // top toolbar, or outside any question container). We search the entire
    // document for the nearest VISIBLE, ENABLED submit-labelled button,
    // preferring the one closest to the viewport center so multi-question
    // pages pick the right one.
    const all = Array.from(document.querySelectorAll(SUBMIT_SELECTOR))
      .filter(btn => isVisible(btn) && isEligible(btn));
    if (all.length === 0) return null;
    if (all.length === 1) return all[0];

    const viewportCenter = window.innerHeight / 2;
    let best = all[0];
    let bestDist = Infinity;
    for (const btn of all) {
      const rect = btn.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) {
        best = btn;
        bestDist = dist;
      }
    }
    return best;
  }

  /**
   * Is a button's label a "next/forward" action (advances to the next question)?
   *
   * Accepts: next, next question, next →, continue, skip, skip question,
   *          submit & next, submit and next (these advance after submitting),
   *          check & next, verify & next.
   * Rejects (no forward word present): submit, submit answer, check answer,
   *          verify, previous, prev, back, cancel, close, finish, save, exit.
   *
   * "previous"/"back" are intentionally rejected — Shift+Enter is forward-only.
   * Pure submit labels ("Submit", "Check Answer") are rejected because they
   * do NOT advance to the next question by themselves; the user can press
   * plain Enter for those.
   */
  function isNextLabel(text) {
    if (!text) return false;
    const t = text.trim().toLowerCase();
    // Pure backward-navigation labels: never treat as next.
    if (/^(previous|prev|back|cancel|close)$/.test(t)) return false;
    // Must contain a forward word: next, continue, or skip.
    // "submit & next" qualifies (it advances), "submit" alone does not.
    return /\b(next|continue|skip)\b/.test(t);
  }

  /**
   * Find a Next/Continue/Skip button for the current question.
   *
   * Same two-pass strategy as findSubmitButton():
   *   1. Search question scope + known parent scopes.
   *   2. Fall back to a whole-document search for the closest visible,
   *      enabled, next-labelled button (sticky footer / top toolbar / modal).
   *
   * Uses the same getButtonLabel() so icon-only buttons (aria-label="Next"),
   * <input value="Next">, title="Next Question", and data-testid="next-btn"
   * all work. Backward-only labels (Previous/Back) are never matched.
   *
   * Returns null if no eligible button is found.
   */
  function findNextButton(questionEl) {
    if (!questionEl) return null;

    const NEXT_SELECTOR = 'button, [role="button"], input[type="submit"], input[type="button"], [data-testid*="next" i], [data-testid*="continue" i]';

    const isEligible = (btn) => {
      if (!btn || btn.disabled) return false;
      if (btn.getAttribute('aria-disabled') === 'true') return false;
      return isNextLabel(getButtonLabel(btn));
    };

    // ---- Pass 1: question scope + known parent scopes ----------------------
    const scopes = [];
    const addScope = (el) => {
      if (el && !scopes.includes(el)) scopes.push(el);
    };
    addScope(questionEl);
    addScope(questionEl.closest('[data-testid="card"]'));
    addScope(questionEl.closest('fieldset'));
    addScope(questionEl.closest('[data-question], [data-question-id], .question, .quiz-question'));
    addScope(questionEl.closest('form'));
    addScope(questionEl.closest('[role="dialog"], [role="tabpanel"], [aria-modal="true"]'));
    addScope(questionEl.closest('main, [role="main"], #root, body'));

    for (const scope of scopes) {
      if (!scope || !scope.querySelectorAll) continue;
      const candidates = Array.from(scope.querySelectorAll(NEXT_SELECTOR)).filter(isEligible);
      const visibleCandidate = candidates.find(isVisible);
      if (visibleCandidate) return visibleCandidate;
    }

    // ---- Pass 2: whole-document fallback -----------------------------------
    const all = Array.from(document.querySelectorAll(NEXT_SELECTOR))
      .filter(btn => isVisible(btn) && isEligible(btn));
    if (all.length === 0) return null;
    if (all.length === 1) return all[0];

    const viewportCenter = window.innerHeight / 2;
    let best = all[0];
    let bestDist = Infinity;
    for (const btn of all) {
      const rect = btn.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(center - viewportCenter);
      if (dist < bestDist) {
        best = btn;
        bestDist = dist;
      }
    }
    return best;
  }

  /**
   * Has the user selected an answer for the current question?
   * We require a selection before Enter/Space can submit, because some
   * quizzes reject empty submissions and we don't want to trigger an
   * error state. If we can't determine selection (no radios found), we
   * still allow submit (the page may allow skipping).
   */
  function hasSelectedAnswer(questionEl) {
    if (!questionEl) return false;
    const opts = getOptionsForQuestion(questionEl);
    if (opts.length === 0) return true; // no options — assume page allows submit
    return opts.some(o => o.isSelected());
  }

  /**
   * Handle plain Enter OR Space as a submit trigger.
   *
   * Safety guards:
   *   - Only fires on the first keydown (event.repeat is ignored).
   *   - Prevents double-fire: if Enter just submitted within the last 800ms,
   *     Space (or vice versa) is ignored for the same question.
   *   - Never activates Next as a side effect: we look for the Submit button
   *     specifically. If only a Next button is visible (no Submit), we skip
   *     rather than click Next. (Shift+Enter is the dedicated Next shortcut.)
   *   - Never clicks a disabled button.
   *   - Requires an answer to be selected (when options exist).
   *
   * NOTE: This handler is called for Enter/Space WITHOUT Shift held.
   * Shift+Enter / Shift+Space are routed to handleNextKey() instead.
   */
  let lastSubmitAt = 0;
  const SUBMIT_DEBOUNCE_MS = 800;
  let lastNextAt = 0;
  const NEXT_DEBOUNCE_MS = 800;

  function handleSubmitKey(event) {
    if (!enabled) return;
    if (isTypingTarget(event.target)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key;
    const isSubmitKey = (key === 'Enter' || key === ' ');
    if (!isSubmitKey) return;

    // Ignore repeated keydown from holding the key.
    if (event.repeat) {
      event.preventDefault();
      return;
    }

    if (!isPracticePageAuthorized()) {
      log(key === 'Enter' ? 'Enter' : 'Space',
          'pressed but Enter/Space-to-submit is OFF. ' +
          'Open the KeyPilot popup → Settings → enable "Enter / Space to submit" ' +
          'to use this shortcut on any website.');
      return;
    }

    // Debounce: prevent Enter+Space from both firing on the same question.
    const now = Date.now();
    if ((now - lastSubmitAt) < SUBMIT_DEBOUNCE_MS) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const question = getCurrentlyVisibleQuestion();
    if (!question) {
      warn(key + ' pressed but no question container found.');
      return;
    }

    // Require an answer to be selected (when options exist).
    if (!hasSelectedAnswer(question)) {
      warn(key + ' pressed but no answer is selected. Select an option (1-4) first.');
      return;
    }

    const submitBtn = findSubmitButton(question);
    if (!submitBtn) {
      warn(key + ' pressed but no Submit button found on this page. ' +
           'If a Submit button exists, its label may use a non-English word or an ' +
           'icon without an aria-label. Open the popup → Diagnostics → Run Diagnostics.');
      return;
    }

    // Defensive double-check: never click a button whose final label is a
    // pure navigation word. findSubmitButton already filters these, but this
    // guards against label resolution edge cases.
    const finalLabel = getButtonLabel(submitBtn);
    if (/^(next|next question|continue|skip|skip question|previous|prev|back|cancel|close|finish|save|save & exit|save and exit|exit)$/.test(finalLabel)) {
      warn(key + ' pressed but the resolved button is navigation-only: "' + finalLabel + '". Not clicking.');
      return;
    }

    lastSubmitAt = now;
    // Invalidate the question cache — after submit, the page likely shows a
    // new question or feedback panel, so the next keypress must re-scan.
    _invalidateQuestionCache();
    log(key + ' pressed — clicking submit button:', submitBtn,
        '(label="' + finalLabel + '")');
    try { submitBtn.click(); } catch (e) { warn('submitBtn.click failed', e); }
  }

  /**
   * Handle Shift+Enter OR Shift+Space as a "go to next question" trigger.
   *
   * This is the dedicated shortcut for advancing to the next question:
   *   - Plain Enter / Space  → click Submit button (see handleSubmitKey)
   *   - Shift + Enter / Space → click Next / Continue / Skip button
   *
   * Safety guards (same shape as handleSubmitKey):
   *   - Only fires on the first keydown (event.repeat is ignored).
   *   - Debounce: 800ms between Next clicks so Shift+Enter+Space can't double-fire.
   *   - Never clicks a disabled button.
   *   - Gated by the same "Enter / Space to submit" toggle in the popup.
   *   - Works on any http/https/file page (same as submit).
   *   - Never activates Previous / Back — findNextButton only matches
   *     forward navigation labels (next/continue/skip).
   *
   * Note: the answer does NOT need to be selected for Shift+Enter. The user
   * may want to skip a question without answering, and most portals allow
   * that via the Next/Skip button. If a portal requires an answer before
   * enabling Next, findNextButton will simply return null because the button
   * is disabled, and we'll log a friendly warning.
   */
  function handleNextKey(event) {
    if (!enabled) return;
    if (isTypingTarget(event.target)) return;
    // Ctrl/Cmd/Alt are reserved for browser shortcuts. Shift is the modifier
    // we WANT here, so we don't reject it.
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key;
    const isNextKey = (key === 'Enter' || key === ' ');
    if (!isNextKey) return;

    // Only call this handler when Shift is held. (handleKeyDown branches.)
    if (!event.shiftKey) return;

    // Ignore repeated keydown from holding the key.
    if (event.repeat) {
      event.preventDefault();
      return;
    }

    if (!isPracticePageAuthorized()) {
      log('Shift+' + (key === 'Enter' ? 'Enter' : 'Space'),
          'pressed but Enter/Space-to-submit is OFF. ' +
          'Open the KeyPilot popup → Settings → enable "Enter / Space to submit" ' +
          'to use Shift+Enter for Next on any website.');
      return;
    }

    // Debounce: prevent Shift+Enter+Space from both firing on the same question.
    const now = Date.now();
    if ((now - lastNextAt) < NEXT_DEBOUNCE_MS) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const question = getCurrentlyVisibleQuestion();
    // We don't strictly need a question container to find a Next button —
    // many portals render Next in a page-level toolbar. But if we DO have
    // one, prefer it as the search root for tighter scoping.
    const nextBtn = findNextButton(question || document.body);
    if (!nextBtn) {
      warn('Shift+' + (key === 'Enter' ? 'Enter' : 'Space') +
           ' pressed but no Next / Continue / Skip button found on this page. ' +
           'If the next button uses an icon without aria-label, or is labeled ' +
           'in a non-English word, it may not be detected. Open popup → ' +
           'Diagnostics → Run Diagnostics.');
      return;
    }

    // Defensive double-check: never click a backward-only button.
    const finalLabel = getButtonLabel(nextBtn);
    if (/^(previous|prev|back|cancel|close|finish|save|save & exit|save and exit|exit|submit|check|verify)$/.test(finalLabel)) {
      warn('Shift+' + (key === 'Enter' ? 'Enter' : 'Space') +
           ' resolved to a non-forward button: "' + finalLabel + '". Not clicking.');
      return;
    }

    lastNextAt = now;
    // Invalidate the question cache — after Next, a new question is shown.
    _invalidateQuestionCache();
    log('Shift+' + (key === 'Enter' ? 'Enter' : 'Space') +
        ' pressed — clicking next button:', nextBtn,
        '(label="' + finalLabel + '")');
    try { nextBtn.click(); } catch (e) { warn('nextBtn.click failed', e); }
  }

  function handleKeyDown(event) {
    if (!enabled) return;

    // Skip when user is typing in a text input/textarea/contenteditable.
    if (isTypingTarget(event.target)) return;

    // Skip modifier-key combinations (Ctrl/Cmd/Alt) so browser shortcuts work.
    // NOTE: Shift is intentionally NOT skipped here — Shift+Enter / Shift+Space
    // are our dedicated "go to next question" shortcuts.
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const key = event.key;

    // Enter / Space → submit (plain) OR next (with Shift).
    // Branch on Shift BEFORE dispatching so the two shortcuts don't collide.
    if (key === 'Enter' || key === ' ') {
      if (event.shiftKey) {
        handleNextKey(event);
      } else {
        handleSubmitKey(event);
      }
      return;
    }

    if (key !== '1' && key !== '2' && key !== '3' && key !== '4') return;

    // Avoid repeated actions when a key is held down. The browser fires
    // keydown repeatedly during a hold; we only act on the first one.
    if (event.repeat) {
      event.preventDefault();
      return;
    }

    // Debounce: ignore identical key within 400ms (handles the case where
    // event.repeat isn't set by some platforms).
    const now = Date.now();
    if (key === lastSelectedKey && (now - lastSelectedAt) < 400) {
      event.preventDefault();
      return;
    }
    lastSelectedKey = key;
    lastSelectedAt = now;

    const index = parseInt(key, 10) - 1;

    const question = getCurrentlyVisibleQuestion();
    if (!question) {
      warn(`Key ${key} pressed but no question container found.`);
      return;
    }

    const options = getOptionsForQuestion(question);
    if (options.length === 0) {
      warn(`Key ${key} pressed but no options found in question:`, question);
      return;
    }

    log(`Key ${key} → question had ${options.length} option(s). Selecting index ${index}.`);

    if (index >= options.length) {
      warn(`Key ${key} → index ${index} out of range (only ${options.length} options).`);
      return;
    }

    // Prevent the page from also reacting to the digit (rare, but safe).
    event.preventDefault();
    event.stopPropagation();

    const result = selectOption(options[index]);

    // Surface failures clearly in the console for debugging.
    if (!result.verified) {
      warn(`Selection not verified. Reason: ${result.reason}`);
    }
  }

  // =========================================================================
  // 10. Listener registration
  // =========================================================================

  // Capture phase so we see the event before framework-level handlers.
  // This is fine — we only call preventDefault/stopPropagation for our 4
  // mapped keys, and only when an actual selection happened.
  document.addEventListener('keydown', handleKeyDown, true);

  // Hide the indicator if the user scrolls or resizes (it would otherwise
  // float in the wrong place because it's position: fixed).
  window.addEventListener('resize', hideIndicator, { passive: true });
  window.addEventListener('scroll', hideIndicator, { passive: true, capture: true });

  // =========================================================================
  // 11. Message API (from popup.js)
  // =========================================================================

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message.type !== 'string') return;

    switch (message.type) {
      case 'ping':
      case 'status':
        sendResponse({ ok: true, installed: true, enabled, version: VERSION });
        break;
      case 'enable':
        enabled = true;
        log('Enabled via popup.');
        sendResponse({ ok: true, installed: true, enabled });
        break;
      case 'disable':
        enabled = false;
        hideIndicator();
        log('Disabled via popup.');
        sendResponse({ ok: true, installed: true, enabled });
        break;
      case 'setPracticeSubmit':
        // Updates the Enter/Space-to-submit toggle. When ON, Enter/Space
        // works on any http/https/file page (no per-site opt-in needed).
        // See isPracticePageAuthorized().
        practiceSubmit = !!message.enabled;
        log('practiceSubmit set to', practiceSubmit,
            '(works on any http/https/file page when ON)');
        sendResponse({ ok: true, practiceSubmit });
        break;
      case 'diagnose':
        // Returns a snapshot useful when filing a bug report.
        try {
          const q = getCurrentlyVisibleQuestion();
          const opts = q ? getOptionsForQuestion(q) : [];
          const submitBtn = q ? findSubmitButton(q) : null;
          const nextBtn = q ? findNextButton(q) : findNextButton(document.body);
          sendResponse({
            ok: true,
            installed: true,
            enabled,
            version: VERSION,
            url: location.href,
            detectionMode: lastDetectionStrategy,
            practiceSubmitSetting: practiceSubmit,
            practicePageAuthorized: isPracticePageAuthorized(),
            submitButtonFound: !!submitBtn,
            submitButtonText: submitBtn ? (submitBtn.textContent || submitBtn.value || '').trim() : null,
            nextButtonFound: !!nextBtn,
            nextButtonText: nextBtn ? (nextBtn.textContent || nextBtn.value || '').trim() : null,
            answerSelected: q ? hasSelectedAnswer(q) : false,
            question: q ? {
              tag: q.tagName.toLowerCase(),
              testid: q.getAttribute('data-testid'),
              role: q.getAttribute('role'),
              className: q.className,
              id: q.id || null
            } : null,
            optionCount: opts.length,
            options: opts.map(o => o.describe())
          });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
        break;
      default:
        // Unknown message — ignore silently.
        break;
    }
    return true; // keep channel open for async sendResponse
  });

  // =========================================================================
  // 12. Debug surface
  //    NOTE: This namespace is on the content-script isolated world's window,
  //    NOT the page's main world. To access it from DevTools:
  //      1. Open DevTools (F12) on the quiz page.
  //      2. In the Console tab, click the "top" dropdown at the top-left.
  //      3. Choose "Quiz Keyboard Navigator" from the list.
  //      4. Now `window.__quizKeyboardNav` is available.
  // =========================================================================
  window.__quizKeyboardNav = {
    version: VERSION,
    getEnabled: () => enabled,
    setEnabled: (v) => { enabled = !!v; },
    getVisibleQuestion: getCurrentlyVisibleQuestion,
    getOptions: getOptionsForQuestion,
    selectOption,
    diagnose: () => {
      const q = getCurrentlyVisibleQuestion();
      const opts = q ? getOptionsForQuestion(q) : [];
      const submitBtn = q ? findSubmitButton(q) : null;
      const nextBtn = q ? findNextButton(q) : findNextButton(document.body);
      return {
        enabled,
        version: VERSION,
        url: location.href,
        detectionMode: lastDetectionStrategy,
        practiceSubmitSetting: practiceSubmit,
        practicePageAuthorized: isPracticePageAuthorized(),
        submitButtonFound: !!submitBtn,
        submitButtonText: submitBtn ? (submitBtn.textContent || submitBtn.value || '').trim() : null,
        nextButtonFound: !!nextBtn,
        nextButtonText: nextBtn ? (nextBtn.textContent || nextBtn.value || '').trim() : null,
        answerSelected: q ? hasSelectedAnswer(q) : false,
        question: q
          ? q.tagName.toLowerCase() +
            (q.getAttribute('data-testid') ? '[data-testid="' + q.getAttribute('data-testid') + '"]' : '') +
            (q.className ? '.' + String(q.className).split(' ').join('.') : '')
          : null,
        optionCount: opts.length,
        options: opts.map(o => o.describe())
      };
    },
    hideIndicator
  };

  log(`KeyPilot content script v${VERSION} ready. Press 1-4 to select options.`);
  log('Tip: open DevTools → Console → switch context to "KeyPilot" to inspect window.__quizKeyboardNav');
})();
