# KeyPilot by AQERIONX

Manifest V3 Chrome extension. Current repository version: **2.2.12**.

KeyPilot adds keyboard navigation for supported quiz/question interfaces, optional keyboard-based form actions, an optional dark-mode feature, and a configurable popup with diagnostics and themes.

## Features

- **Number keys 1–4:** Select the matching visible answer option when KeyPilot detects a supported question layout.
- **Enter / Space:** When the setting is enabled, attempt to activate the visible Submit button on the active page. This can submit a real form, so leave the setting off on pages where you do not want keyboard submission.
- **Shift+Enter / Shift+Space:** When enabled on the active page, look for a forward-navigation button such as Next, Continue, or Skip. KeyPilot deliberately avoids buttons labelled Previous or Back.
- **Adaptive question detection:** Supports native radio inputs, common labelled-radio patterns, ARIA radio controls, common custom option classes, and the known portal-specific test-id structure. Not every website or page layout is guaranteed to work.
- **CCBP route persistence:** When enabled on `learning.ccbp.in`, KeyPilot can request the narrow optional site permission and restore keyboard navigation after supported page navigations.
- **Universal Dark Mode:** Optional site access is requested only when this feature is enabled. Its colour changes are heuristic and may not look perfect on every site.
- **Popup customization:** Peach, Midnight, and Lavender themes; reduced-motion control; separate settings; diagnostics; and a compact shortcut reference.

KeyPilot does not generate answers. It responds to keyboard actions and detected page controls. Test changes on a page where it is safe to submit or navigate.

## Download the latest ZIP

After the first release is published, use the stable download URL:

**[Download the latest KeyPilot.zip](https://github.com/monu-2008/KeyPilot/releases/latest/download/KeyPilot.zip)**

The link stays the same for future versions as long as every GitHub Release attaches the asset under the exact name `KeyPilot.zip`.

- [All releases and release notes](https://github.com/monu-2008/KeyPilot/releases)
- [Source code](https://github.com/monu-2008/KeyPilot)

### One-time setup for the first release

The repository includes a GitHub Actions workflow named **Publish KeyPilot ZIP**. To publish the first `v2.2.12` package, open the repository's **Actions** tab, select that workflow, choose **Run workflow**, and keep the version at `2.2.12`. The workflow validates the tag/version against `manifest.json`, packages the extension files, and publishes `KeyPilot.zip`.

For future versions, update the version in `manifest.json`, make the corresponding source/documentation changes, then push a matching tag such as `v2.2.13`. The workflow will build the ZIP and attach it to a GitHub Release. No new download URL is needed on the website.

> Creating a release ZIP does not automatically update an extension installed with **Load unpacked**. The user must replace/update the extracted files and click **Reload** in `chrome://extensions`. Automatic extension updates are a separate distribution feature; consider the Chrome Web Store if you want regular users to receive browser-managed updates.

## Install from a ZIP (developer mode)

1. Download and extract `KeyPilot.zip` to a folder you control.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select the extracted folder that contains `manifest.json`.
5. Open the popup on a supported website and click **Enable on this tab**.
6. Enable optional features individually in Settings. Read permission prompts before accepting them.

Keep the extracted folder in place; Chrome loads the extension from that folder.

## Update an unpacked installation

1. Download the newest ZIP from the same [stable URL](https://github.com/monu-2008/KeyPilot/releases/latest/download/KeyPilot.zip).
2. Extract the ZIP and replace the files in the existing KeyPilot folder. Make sure you preserve the folder that Chrome has loaded.
3. Open `chrome://extensions` and press **Reload** on KeyPilot.

If Chrome reports an error, open the extension's **Errors** panel and check the popup's **Diagnostics** report. Review a diagnostic report before sharing it publicly; it can include the active page URL.

## Keyboard reference

| Shortcut | Action |
| --- | --- |
| `1`–`4` | Select a detected answer option |
| `Enter` / `Space` | Try to activate Submit when the setting is enabled |
| `Shift+Enter` / `Shift+Space` | Try to activate Next / Continue / Skip when available |

Shortcuts are ignored while typing in text fields and when Ctrl, Cmd, or Alt is held. A page must expose a supported control for an action to work. The keyboard submission setting is separate from question-option detection.

## Permissions

KeyPilot uses a small set of required extension permissions plus optional host permissions:

| Permission | Purpose |
| --- | --- |
| `activeTab` | Interact with the tab the user has actively chosen. |
| `scripting` | Inject the packaged content script into the active tab when requested. |
| `storage` | Save preferences locally using Chrome extension storage. |
| Optional `https://learning.ccbp.in/*` | Keep keyboard navigation enabled across CCBP page navigations after the user enables it there. |
| Optional `http://*/*` and `https://*/*` | Allow Universal Dark Mode to operate across websites only after the user opts in. |

KeyPilot does not need an account to run the extension's local features. Review each optional permission prompt carefully and turn optional features off when they are not needed.

## Passwords, ownership, and source visibility

The current extension does **not** have a strong owner-only password or licence system. Because this repository is public, anyone can inspect and copy the source. A password check embedded only in a client-side extension can be removed by someone who edits the files; a local encrypted string does not prove that the installer has your permission.

If you need to restrict who may install/use KeyPilot, decide on distribution before adding an unlock screen. A private Chrome Web Store listing can be restricted to approved testers/accounts where supported; an unlisted listing can still be installed by anyone who receives its link. A server-side activation system can add revocation and account controls, but it requires a hosted service and careful privacy design. Do not put a master password or server secret in the extension source. Manifest V3 extensions must package their executable JavaScript rather than fetch and run remote code.

## Development and checks

The extension's main files are at the repository root:

- `manifest.json` — extension metadata, version, and permissions.
- `popup.html`, `popup.css`, `popup.js` — popup structure, styling, and interactions.
- `content.js` — keyboard handling and question/control detection.
- `background.js` — persistent optional dark-mode and CCBP navigation behavior.
- `dark-mode.css` — packaged dark-mode styles.
- `icons/` — extension and popup images.

Before publishing, verify the manifest is valid JSON and the JavaScript files parse. Then load the folder in Chrome and test the popup, settings, question detection, shortcuts, Dark Mode, and Diagnostics on pages you are allowed to test. Source-level syntax checks are not a substitute for live Chrome testing.

## Release history

See [CHANGELOG.md](CHANGELOG.md) for notable changes and [GitHub Releases](https://github.com/monu-2008/KeyPilot/releases) for release assets.
