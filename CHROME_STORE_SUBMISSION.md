# Chrome Web Store Submission Notes

Last updated: March 16, 2026

This file contains ready-to-use text for the Chrome Web Store listing and `Privacy practices` tab.

## Single Purpose Description

Chrome Lock Pro X protects regular web pages in Chrome by showing a password lock overlay, auto-locking idle sessions, and letting the user save per-site privacy regions and lock rules.

## Remote Code

Chrome Lock Pro X does not use remote code.
All executable code is packaged inside the extension bundle shipped to the Chrome Web Store.
The extension does not download, inject, or execute JavaScript from remote servers.

## Permission Justifications

### storage

Used to store the extension's local configuration and security state, including password-derived data, lock timers, whitelist rules, domain profiles, privacy regions, logs, and language preference.

### tabs

Used to identify eligible web tabs, send lock and unlock state changes to content scripts, and operate on the current active page from the popup and background service worker.

### alarms

Used to schedule automatic relock events, including unlock-session expiration and auto-lock timers after configured idle periods.

### idle

Used to detect when the browser becomes idle so the extension can trigger the user-configured auto-lock behavior.

### windows

Used to detect when all Chrome windows lose focus or are minimized so the optional `lock on window blur` policy can lock protected tabs immediately.

### host_permissions (`http://*/*`, `https://*/*`)

Used so the extension can run on regular web pages, show the lock overlay, restore saved privacy regions for the current site, evaluate whitelist and domain-profile rules against the current URL, and mask page identity when the user enables that feature.

The extension does not run on special browser pages such as `chrome://`.

## Data Handling Summary

- All settings and logs are stored locally in `chrome.storage.local`.
- The extension does not transmit user settings, password material, logs, or privacy-region data to remote servers.
- The extension does not sell or share collected data with third parties.
- Any export of logs or settings happens only when the user explicitly triggers export.

## Privacy Practices Answers

Use the following positions in the Chrome Web Store dashboard:

- Single purpose: required, paste the text from `Single Purpose Description`.
- Remote code: select `No`. If the dashboard still requires a note, paste the text from `Remote Code`.
- Permissions: explain `storage`, `tabs`, `alarms`, `idle`, `windows`, and `host_permissions` using the text above.
- Data usage certification: confirm only if the published item matches the local-only behavior described above.

## Account And Listing Checklist

- Add a contact email on the `Account` tab.
- Verify the same contact email before publishing.
- Host `PRIVACY_POLICY.md` at a public HTTPS URL and place that URL in the store listing.
- Upload at least one screenshot or one promo video before submitting for review.

## GitHub Pages Setup

This repo now includes a GitHub Pages-ready file at `docs/index.html`.

If you publish this repository on GitHub, use:

1. `Settings` -> `Pages`
2. `Build and deployment` -> `Deploy from a branch`
3. Branch: `main`
4. Folder: `/docs`

Your privacy policy URL will then be:

`https://<github-username>.github.io/<repo-name>/`

## Suggested Screenshots

Minimum set that should satisfy the listing requirement:

1. Popup showing current lock state and quick actions.
2. Locked web page overlay asking for the password.
3. Options page showing lock policy, whitelist, and privacy tools.

## Notes For Review

If Chrome Web Store asks about server-side or backend use, the correct explanation for this build is:

"This extension does not rely on a backend service and does not execute server-hosted code. All lock, timer, whitelist, profile, and privacy-region logic runs locally in the browser."
