/*
 * KeyPilot by AQERIONX — MV3 service worker (v2.2.5)
 * Manages the user's opt-in Universal Dark Mode across existing and future tabs.
 */

'use strict';

const DARK_MODE_KEY = 'keypilot.forceDarkMode';
const DARK_MODE_ATTR = 'data-keypilot-force-dark';
const DARK_MODE_PROFILE_ATTR = 'data-keypilot-dark-profile';
const DARK_MODE_READY_ATTR = 'data-keypilot-dark-ready';
const DARK_MODE_BG_ATTR = 'data-keypilot-dark-bg';
const DARK_MODE_TEXT_ATTR = 'data-keypilot-dark-text';
const DARK_MODE_BORDER_ATTR = 'data-keypilot-dark-border';
const DARK_MODE_FILE = 'dark-mode.css';
const ALL_WEB_ORIGINS = ['http://*/*', 'https://*/*'];

function applySmartDarkModeInPage(enabled, profile, forceAttr, profileAttr, readyAttr, bgAttr, textAttr, borderAttr) {
  const root = document.documentElement;
  const supported = location.protocol === 'http:' || location.protocol === 'https:';
  if (!root || !supported) return { supported: false, wasEnabled: false };

  const markerSelector = `[${bgAttr}], [${textAttr}], [${borderAttr}]`;
  function clearMarkers(scope) {
    const target = scope || root;
    if (target.matches && target.matches(markerSelector)) {
      target.removeAttribute(bgAttr);
      target.removeAttribute(textAttr);
      target.removeAttribute(borderAttr);
    }
    if (target.querySelectorAll) {
      target.querySelectorAll(markerSelector).forEach((element) => {
        element.removeAttribute(bgAttr);
        element.removeAttribute(textAttr);
        element.removeAttribute(borderAttr);
      });
    }
  }
  function stopExisting() {
    const old = window.__keypilotSmartDarkModeController;
    if (old && typeof old.stop === 'function') {
      try { old.stop(); } catch (_) {}
    }
    clearMarkers(root);
    root.removeAttribute(readyAttr);
    delete window.__keypilotSmartDarkModeController;
  }

  const wasEnabled = root.getAttribute(forceAttr) === 'true';
  if (!enabled) {
    stopExisting();
    root.removeAttribute(forceAttr);
    root.removeAttribute(profileAttr);
    return { supported: true, wasEnabled };
  }

  stopExisting();
  root.setAttribute(forceAttr, 'true');
  root.setAttribute(profileAttr, profile || 'generic');

  function readColor(value) {
    if (!value || value === 'transparent') return null;
    const parts = value.match(/-?\d*\.?\d+/g);
    if (!parts || parts.length < 3) return null;
    const r = Math.max(0, Math.min(255, Number(parts[0])));
    const g = Math.max(0, Math.min(255, Number(parts[1])));
    const b = Math.max(0, Math.min(255, Number(parts[2])));
    const alpha = parts.length >= 4 ? Math.max(0, Math.min(1, Number(parts[3]))) : 1;
    if (alpha <= 0.05) return null;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return {
      r, g, b, alpha,
      luminance: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255,
      saturation: max === 0 ? 0 : (max - min) / max
    };
  }
  function isLightNeutral(color) {
    return !!color && color.luminance >= 0.61 && color.saturation <= 0.26;
  }
  function shouldSkip(element) {
    const tag = element.tagName;
    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'NOSCRIPT', 'TEMPLATE'].includes(tag)) return true;
    if (element.closest && element.closest('svg, img, video, canvas, iframe, object, embed, picture')) return true;
    return false;
  }
  function surfaceWillDarken(element) {
    let current = element;
    while (current && current.nodeType === 1) {
      if (current.hasAttribute(bgAttr)) return true;
      const color = readColor(getComputedStyle(current).backgroundColor);
      if (color) return isLightNeutral(color);
      current = current.parentElement;
    }
    // Transparent layouts usually paint on the browser's default light canvas.
    return true;
  }
  function processRoots(inputRoots, reset) {
    const roots = inputRoots.filter((element) => element && element.nodeType === 1 && element.isConnected);
    if (!roots.length) return;

    if (reset) roots.forEach(clearMarkers);

    const elementSet = new Set();
    roots.forEach((element) => {
      elementSet.add(element);
      element.querySelectorAll('*').forEach((child) => elementSet.add(child));
    });
    const elements = Array.from(elementSet).filter((element) => !shouldSkip(element));
    const records = elements.map((element) => {
      const style = getComputedStyle(element);
      const background = readColor(style.backgroundColor);
      const text = readColor(style.color);
      const border = readColor(style.borderTopColor);
      return {
        element,
        darkBackground: isLightNeutral(background),
        lightText: !!text && text.luminance < 0.49 && surfaceWillDarken(element),
        darkBorder: isLightNeutral(border)
      };
    });

    // If both page roots are transparent, make the canvas dark as a safe fallback.
    const htmlBackground = readColor(getComputedStyle(root).backgroundColor);
    const bodyBackground = document.body
      ? readColor(getComputedStyle(document.body).backgroundColor)
      : null;
    if (!htmlBackground && !bodyBackground) {
      const rootRecord = records.find((record) => record.element === root);
      if (rootRecord) rootRecord.darkBackground = true;
    }

    // Apply only after all original computed colors have been read.
    records.forEach((record) => {
      const element = record.element;
      if (record.darkBackground) element.setAttribute(bgAttr, 'light');
      if (record.lightText) element.setAttribute(textAttr, 'dark');
      if (record.darkBorder) element.setAttribute(borderAttr, 'light');
    });
  }

  const observer = new MutationObserver((mutations) => {
    const rootsToProcess = new Set();
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        rootsToProcess.add(mutation.target);
      } else if (mutation.type === 'childList') {
        let foundElement = false;
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            rootsToProcess.add(node);
            foundElement = true;
          }
        });
        if (!foundElement && mutation.target.nodeType === 1) {
          rootsToProcess.add(mutation.target);
        }
      }
    });
    if (!rootsToProcess.size) return;
    const rootsArray = Array.from(rootsToProcess);
    const topLevelRoots = rootsArray.filter((candidate) =>
      !rootsArray.some((other) => other !== candidate && other.contains(candidate))
    );
    processRoots(topLevelRoots, true);
  });

  // Inspect the original page colors before enabling the root dark color scheme.
  processRoots([root], false);
  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  root.setAttribute(readyAttr, 'true');

  window.__keypilotSmartDarkModeController = {
    stop() {
      observer.disconnect();
      clearMarkers(root);
      root.removeAttribute(readyAttr);
    }
  };
  return { supported: true, wasEnabled };
}

async function hasAllSitesAccess() {
  return chrome.permissions.contains({ origins: ALL_WEB_ORIGINS });
}

async function applyDarkModeToTab(tabId, enabled) {
  if (enabled && !(await hasAllSitesAccess())) {
    return { ok: false, applied: false, reason: 'permission_missing' };
  }

  if (enabled) {
    const [inspection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (attributeName) => ({
        supported: location.protocol === 'http:' || location.protocol === 'https:',
        alreadyEnabled: document.documentElement?.getAttribute(attributeName) === 'true',
        profile: location.hostname.toLowerCase() === 'learning.ccbp.in' ? 'ccbp' : 'generic'
      }),
      args: [DARK_MODE_ATTR]
    });

    const state = inspection?.result;
    if (!state?.supported) {
      return { ok: true, applied: false, reason: 'unsupported_url' };
    }
    // Refresh the stylesheet for tabs already darkened before an extension update.
    if (state.alreadyEnabled) {
      try {
        await chrome.scripting.removeCSS({ target: { tabId }, files: [DARK_MODE_FILE] });
      } catch (_) {}
    }

    // insertCSS uses Chrome's extension injection API rather than a page-created
    // style element, so ordinary page CSS policies do not block the stylesheet.
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: [DARK_MODE_FILE]
    });

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: applySmartDarkModeInPage,
        args: [
          true, state.profile,
          DARK_MODE_ATTR, DARK_MODE_PROFILE_ATTR, DARK_MODE_READY_ATTR,
          DARK_MODE_BG_ATTR, DARK_MODE_TEXT_ATTR, DARK_MODE_BORDER_ATTR
        ]
      });
    } catch (error) {
      try {
        await chrome.scripting.removeCSS({ target: { tabId }, files: [DARK_MODE_FILE] });
      } catch (_) {}
      throw error;
    }

    return { ok: true, applied: true, reason: state.alreadyEnabled ? 'refreshed' : 'enabled' };
  }

  // Remove the opt-in marker first; this instantly turns off the conditional CSS
  // even if Chrome cannot remove the stylesheet on an unusual page.
  let wasEnabled = false;
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: applySmartDarkModeInPage,
      args: [
        false, 'generic',
        DARK_MODE_ATTR, DARK_MODE_PROFILE_ATTR, DARK_MODE_READY_ATTR,
        DARK_MODE_BG_ATTR, DARK_MODE_TEXT_ATTR, DARK_MODE_BORDER_ATTR
      ]
    });
    wasEnabled = result?.result?.wasEnabled === true;
    if (result?.result?.supported !== true) {
      return { ok: true, applied: false, reason: 'unsupported_url' };
    }
  } catch (error) {
    return { ok: false, applied: false, reason: String(error) };
  }

  try {
    await chrome.scripting.removeCSS({ target: { tabId }, files: [DARK_MODE_FILE] });
  } catch (_) {
    // A stylesheet can be absent or access may have been revoked. The marker
    // is already gone, so the dark-mode rule no longer matches.
  }

  return { ok: true, applied: wasEnabled, reason: wasEnabled ? 'disabled' : 'already_off' };
}

async function applyToAllOpenTabs(enabled) {
  const tabs = await chrome.tabs.query({});
  const outcomes = await Promise.all(
    tabs.filter((tab) => Number.isInteger(tab.id)).map(async (tab) => {
      try {
        return await applyDarkModeToTab(tab.id, enabled);
      } catch (error) {
        return { ok: false, applied: false, reason: String(error) };
      }
    })
  );

  return {
    appliedTabs: outcomes.filter((outcome) => outcome.ok && outcome.applied).length,
    skippedTabs: outcomes.filter((outcome) => !outcome.ok).length
  };
}

async function applyIfGloballyEnabled(tabId) {
  try {
    const stored = await chrome.storage.local.get(DARK_MODE_KEY);
    if (stored[DARK_MODE_KEY] !== true) return;
    if (!(await hasAllSitesAccess())) return;
    await applyDarkModeToTab(tabId, true);
  } catch (_) {
    // Some tabs are browser-internal, restricted, or otherwise not scriptable.
  }
}

async function syncOpenTabsFromSavedSetting() {
  try {
    const stored = await chrome.storage.local.get(DARK_MODE_KEY);
    if (stored[DARK_MODE_KEY] === true && await hasAllSitesAccess()) {
      await applyToAllOpenTabs(true);
    }
  } catch (error) {
    console.warn('[KeyPilot] Could not restore Universal Dark Mode:', error);
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== 'keypilot:setForceDarkMode') return false;

  (async () => {
    const enabled = message.enabled === true;
    if (enabled && !(await hasAllSitesAccess())) {
      sendResponse({
        ok: false,
        reason: 'permission_missing',
        message: 'All-sites access has not been granted.'
      });
      return;
    }

    await chrome.storage.local.set({ [DARK_MODE_KEY]: enabled });
    const summary = await applyToAllOpenTabs(enabled);
    sendResponse({ ok: true, enabled, ...summary });
  })().catch((error) => {
    sendResponse({ ok: false, message: error?.message || String(error) });
  });

  return true;
});

// Apply the saved preference after each normal page navigation, including CCBP.
// Browser-internal pages and restricted URLs are skipped gracefully.
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    void applyIfGloballyEnabled(tabId);
  }
});

chrome.runtime.onStartup.addListener(() => {
  void syncOpenTabsFromSavedSetting();
});

chrome.runtime.onInstalled.addListener(() => {
  void syncOpenTabsFromSavedSetting();
});
