/*
 * KeyPilot by AQERIONX — MV3 service worker (v2.2.1)
 * Manages the user's opt-in Universal Dark Mode across existing and future tabs.
 */

'use strict';

const DARK_MODE_KEY = 'keypilot.forceDarkMode';
const DARK_MODE_ATTR = 'data-keypilot-force-dark';
const DARK_MODE_PROFILE_ATTR = 'data-keypilot-dark-profile';
const DARK_MODE_FILE = 'dark-mode.css';
const ALL_WEB_ORIGINS = ['http://*/*', 'https://*/*'];

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
        func: (attributeName, profileAttributeName, profile) => {
          if (document.documentElement) {
            document.documentElement.setAttribute(attributeName, 'true');
            document.documentElement.setAttribute(profileAttributeName, profile);
          }
        },
        args: [DARK_MODE_ATTR, DARK_MODE_PROFILE_ATTR, state.profile]
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
      func: (attributeName, profileAttributeName) => {
        const root = document.documentElement;
        if (!root || (location.protocol !== 'http:' && location.protocol !== 'https:')) {
          return { supported: false, wasEnabled: false };
        }
        const active = root.getAttribute(attributeName) === 'true';
        root.removeAttribute(attributeName);
        root.removeAttribute(profileAttributeName);
        return { supported: true, wasEnabled: active };
      },
      args: [DARK_MODE_ATTR, DARK_MODE_PROFILE_ATTR]
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
