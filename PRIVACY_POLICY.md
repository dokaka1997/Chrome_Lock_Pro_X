# Chrome Lock Pro X Privacy Policy

Last updated: March 17, 2026

## Summary

Chrome Lock Pro X stores its data locally in your browser profile. The extension does not send your settings, password material, biometric unlock metadata, logs, whitelist rules, or privacy-region data to any remote server.
All executable logic is bundled inside the extension package. The extension does not download or execute remote code.

## Data Stored Locally

The extension may store the following data in `chrome.storage.local`:

- A derived password hash, salt, and PBKDF2 iteration count
- Optional biometric unlock metadata used for WebAuthn platform authenticators, including a credential ID, public key, algorithm, transports, and registration timestamp
- Lock state and unlock-session timers
- Session access state used to remember whether the current unlock session applies only to the current domain or to all domains
- Failed-attempt counters and lockout information
- Whitelist rules and per-domain profiles
- Privacy-region data saved by domain
- Security and tamper logs
- UI language preference

Chrome Lock Pro X does not receive raw fingerprint, face, or PIN data. When biometric unlock is enabled, Chrome and the operating system perform the verification and only return a WebAuthn success or failure result plus the credential material needed for future verification.

## Browsing Data Used

The extension runs on regular `http` and `https` pages so it can:

- show the lock overlay
- evaluate whitelist and profile rules against the current page URL
- decide whether the current site is allowed by the active unlock-session scope
- restore privacy regions for the current domain
- mask page identity when that feature is enabled
- record local security events

Security logs may include a normalized page URL made from the page origin and path. Query strings and fragments are not intentionally stored in logs.

## Data Sharing

Chrome Lock Pro X does not sell, transmit, or share your data with third parties. All processing is performed locally by the extension unless you explicitly export logs or settings yourself.

The extension does not use a remote backend for password checks, biometric verification, lock decisions, or privacy-region storage.

## User Controls

You can:

- change or remove lock settings
- register or remove biometric unlock
- clear security logs
- export logs
- export and import settings backups
- remove the extension at any time unless your browser is managed by an administrator

Settings backup exports do not include password material or biometric credential material.

## Limitations

Chrome Lock Pro X protects regular web pages inside Chrome. It does not provide an operating-system security boundary and cannot block access to special Chrome pages such as `chrome://extensions`.

## Contact

Before publishing to the Chrome Web Store, replace this section with your verified support email or support website and host this policy at a public HTTPS URL for the store listing.

Example:

- Support email: dokaka1997@gmail.com
- Support page: https://web.facebook.com/daovando1997/
