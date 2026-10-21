# Changelog

Notable changes to KeyPilot are recorded here. The current manifest/source version is **2.2.12**.

## [2.2.12] — Current source

### Added
- Added `Shift+Enter` and `Shift+Space` to try forward navigation through a visible Next, Continue, or Skip control.
- Added a Download Latest Update card in the popup.

### Changed
- Reduced popup spacing, shortcut-key badge sizes, action-button padding, and the download/Hush card footprint.
- Shortened modifier-key labels to reduce wrapping in the shortcut grid.
- Rewrote the README around the current source, its actual permissions, release workflow, and testing limits.
- Added a GitHub Actions workflow that publishes both `KeyPilot-vX.Y.Z.zip` (versioned download filename) and a stable `KeyPilot.zip` alias for each release.
- Added a website `/api/download` route that finds the latest versioned release asset and redirects to it, so the website URL stays constant while the downloaded filename changes with the release.

### Notes
- Option detection is adaptive but not guaranteed to support every website or DOM structure.
- Pressing Enter/Space can activate a page's Submit action when that setting is enabled; turn it off on pages where you do not want keyboard submission.
- The source has been inspected and syntax patterns checked, but live Chrome testing is still required for the full runtime behavior.

## [2.2.8] — Keyboard-submit behavior

- The Enter/Space preference was expanded to supported HTTP(S)/file pages where KeyPilot is enabled, rather than being limited only to the earlier practice-page gate.
- This remains an explicit user setting; it should be used with care because it may submit a real form.

## [2.2.6] — Persistent CCBP navigation

- Added an optional `https://learning.ccbp.in/*` permission requested when the user enables KeyPilot on CCBP.
- Saved the CCBP navigation preference and restored it across supported page navigations and extension restarts.
- Added diagnostics for the adaptive detector path.

## [2.2.5] — Adaptive DOM recovery

- Added fallback detection for visible ARIA/custom answer controls when known question containers are not found.
- Diagnostics report whether detection used known selectors, native-radio fallback, custom-option fallback, or no matching question.

## [2.2.4] — Route-independent question detection

- Added a generic radio-group container and fallback grouping for visible native radio inputs.
- Kept keyboard option selection independent of a specific URL path where a supported DOM pattern is present.

## [2.2.3] — CCBP diagnostics and route fix

- Directed popup commands and diagnostics to the top-level frame to avoid reading a third-party embedded frame.
- Added the CCBP primitive-coding practice route to the explicit practice-submit allowlist used at that time.

Earlier entries summarise selected notable changes; see repository history for the complete source history.
