if (typeof importScripts === '\x66\x75\x6e\x63\x74\x69\x6f\x6e') {
  importScripts('\x69\x31\x38\x6e\x2e\x6a\x73');
}

const KEYS = {
  isLocked: '\x69\x73\x4c\x6f\x63\x6b\x65\x64',
  passwordHash: '\x70\x61\x73\x73\x77\x6f\x72\x64\x48\x61\x73\x68',
  passwordSalt: '\x70\x61\x73\x73\x77\x6f\x72\x64\x53\x61\x6c\x74',
  passwordIterations: '\x70\x61\x73\x73\x77\x6f\x72\x64\x49\x74\x65\x72\x61\x74\x69\x6f\x6e\x73',
  requiresPasswordSetup: '\x72\x65\x71\x75\x69\x72\x65\x73\x50\x61\x73\x73\x77\x6f\x72\x64\x53\x65\x74\x75\x70',
  autoLockMinutes: '\x61\x75\x74\x6f\x4c\x6f\x63\x6b\x4d\x69\x6e\x75\x74\x65\x73',
  whitelist: '\x77\x68\x69\x74\x65\x6c\x69\x73\x74',
  failedAttempts: '\x66\x61\x69\x6c\x65\x64\x41\x74\x74\x65\x6d\x70\x74\x73',
  lockoutUntil: '\x6c\x6f\x63\x6b\x6f\x75\x74\x55\x6e\x74\x69\x6c',
  logs: '\x6c\x6f\x67\x73',
  settingsVersion: '\x73\x65\x74\x74\x69\x6e\x67\x73\x56\x65\x72\x73\x69\x6f\x6e',
  maxAttempts: '\x6d\x61\x78\x41\x74\x74\x65\x6d\x70\x74\x73',
  lockoutMinutes: '\x6c\x6f\x63\x6b\x6f\x75\x74\x4d\x69\x6e\x75\x74\x65\x73',
  unlockSessionMinutes: '\x75\x6e\x6c\x6f\x63\x6b\x53\x65\x73\x73\x69\x6f\x6e\x4d\x69\x6e\x75\x74\x65\x73',
  unlockUntil: '\x75\x6e\x6c\x6f\x63\x6b\x55\x6e\x74\x69\x6c',
  lockOnWindowBlur: '\x6c\x6f\x63\x6b\x4f\x6e\x57\x69\x6e\x64\x6f\x77\x42\x6c\x75\x72',
  blurRegionsByDomain: '\x62\x6c\x75\x72\x52\x65\x67\x69\x6f\x6e\x73\x42\x79\x44\x6f\x6d\x61\x69\x6e',
  defaultRegionMode: '\x64\x65\x66\x61\x75\x6c\x74\x52\x65\x67\x69\x6f\x6e\x4d\x6f\x64\x65',
  maskPageIdentity: '\x6d\x61\x73\x6b\x50\x61\x67\x65\x49\x64\x65\x6e\x74\x69\x74\x79',
  domainProfiles: '\x64\x6f\x6d\x61\x69\x6e\x50\x72\x6f\x66\x69\x6c\x65\x73',
  requirePasswordOnDomainChange: '\x72\x65\x71\x75\x69\x72\x65\x50\x61\x73\x73\x77\x6f\x72\x64\x4f\x6e\x44\x6f\x6d\x61\x69\x6e\x43\x68\x61\x6e\x67\x65',
  sessionAccessHosts: '\x73\x65\x73\x73\x69\x6f\x6e\x41\x63\x63\x65\x73\x73\x48\x6f\x73\x74\x73',
  biometricCredentialId: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x43\x72\x65\x64\x65\x6e\x74\x69\x61\x6c\x49\x64',
  biometricPublicKey: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x50\x75\x62\x6c\x69\x63\x4b\x65\x79',
  biometricAlgorithm: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x41\x6c\x67\x6f\x72\x69\x74\x68\x6d',
  biometricTransports: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x54\x72\x61\x6e\x73\x70\x6f\x72\x74\x73',
  biometricCreatedAt: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x43\x72\x65\x61\x74\x65\x64\x41\x74',
  pendingBiometricRequest: '\x70\x65\x6e\x64\x69\x6e\x67\x42\x69\x6f\x6d\x65\x74\x72\x69\x63\x52\x65\x71\x75\x65\x73\x74'
};

const DEFAULTS = {
  autoLockMinutes: 5,
  passwordIterations: 210000,
  failedAttempts: 0,
  lockoutUntil: 0,
  maxAttempts: 5,
  lockoutMinutes: 10,
  unlockSessionMinutes: 0,
  unlockUntil: 0,
  lockOnWindowBlur: false,
  requiresPasswordSetup: true,
  blurRegionsByDomain: {},
  defaultRegionMode: '\x62\x6c\x75\x72',
  maskPageIdentity: false,
  domainProfiles: [],
  requirePasswordOnDomainChange: true,
  sessionAccessHosts: [],
  biometricCredentialId: '',
  biometricPublicKey: '',
  biometricAlgorithm: -7,
  biometricTransports: [],
  biometricCreatedAt: 0,
  pendingBiometricRequest: null,
  logs: [],
  settingsVersion: 8,
  whitelist: [
    '\x64\x6f\x6d\x61\x69\x6e\x3a\x6d\x61\x69\x6c\x2e\x67\x6f\x6f\x67\x6c\x65\x2e\x63\x6f\x6d',
    '\x64\x6f\x6d\x61\x69\x6e\x3a\x63\x61\x6c\x65\x6e\x64\x61\x72\x2e\x67\x6f\x6f\x67\x6c\x65\x2e\x63\x6f\x6d',
    '\x70\x61\x74\x74\x65\x72\x6e\x3a\x68\x74\x74\x70\x73\x3a\x2f\x2f\x63\x68\x61\x74\x67\x70\x74\x2e\x63\x6f\x6d\x2f\x2a'
  ]
};

const REGION_MODES = ['\x62\x6c\x75\x72', '\x62\x6c\x61\x63\x6b\x6f\x75\x74', '\x70\x69\x78\x65\x6c\x61\x74\x65'];

const ALARMS = {
  autoLock: '\x61\x75\x74\x6f\x2d\x6c\x6f\x63\x6b',
  sessionRelock: '\x73\x65\x73\x73\x69\x6f\x6e\x2d\x72\x65\x6c\x6f\x63\x6b'
};

const BIOMETRIC_REQUEST_TTL_MS = 10 * 60 * 1000;
const MAX_PENDING_BIOMETRIC_REQUESTS = 8;
const WINDOW_BLUR_LOCK_DELAY_MS = 350;
const BIOMETRIC_AUTO_LOCK_GRACE_MS = 2500;
const BIOMETRIC_ALGORITHMS = Object.freeze({
  ES256: -7,
  RS256: -257
});

let pendingWindowBlurLockTimer = null;
let suppressWindowBlurLockUntil = 0;

function now() {
  return Date.now();
}

function suppressWindowBlurLock(durationMs = BIOMETRIC_AUTO_LOCK_GRACE_MS) {
  const normalizedDuration = Math.max(0, Number(durationMs) || 0);
  suppressWindowBlurLockUntil = Math.max(
    suppressWindowBlurLockUntil,
    now() + normalizedDuration
  );
}

function cancelScheduledWindowBlurLock() {
  if (!pendingWindowBlurLockTimer) return;
  clearTimeout(pendingWindowBlurLockTimer);
  pendingWindowBlurLockTimer = null;
}

async function hasFocusedChromeWindow() {
  const windows = await chrome.windows.getAll({});
  return windows.some((window) => !!window?.focused);
}

function scheduleWindowBlurLockCheck(delayMs = WINDOW_BLUR_LOCK_DELAY_MS) {
  cancelScheduledWindowBlurLock();
  const normalizedDelay = Math.max(0, Number(delayMs) || 0);

  pendingWindowBlurLockTimer = setTimeout(() => {
    pendingWindowBlurLockTimer = null;
    void maybeLockAfterWindowBlur().catch(() => {});
  }, normalizedDelay);
}

async function maybeLockAfterWindowBlur() {
  const remainingSuppressionMs = suppressWindowBlurLockUntil - now();
  if (remainingSuppressionMs > 0) {
    scheduleWindowBlurLockCheck(Math.max(WINDOW_BLUR_LOCK_DELAY_MS, remainingSuppressionMs));
    return;
  }

  await ensureInitialized();
  const state = await getState();
  if (!readStateBoolean(state, KEYS.lockOnWindowBlur, DEFAULTS.lockOnWindowBlur)) return;
  if (state[KEYS.isLocked]) return;
  if (await hasFocusedChromeWindow()) return;

  await lockNow('\x77\x69\x6e\x64\x6f\x77\x2d\x62\x6c\x75\x72');
}

async function tr(key, values = {}) {
  if (!globalThis.CLPX_I18N) return key;
  const language = await globalThis.CLPX_I18N.ready();
  return globalThis.CLPX_I18N.translate(language, key, values);
}

function randomBytes(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toBase64Url(bytes) {
  return toBase64(bytes).replace(/\+/g, '\x2d').replace(/\//g, '\x5f').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '\x2b').replace(/_/g, '\x2f');
  const padding = normalized.length % 4 === 0 ? '' : '\x3d'.repeat(4 - (normalized.length % 4));
  return fromBase64(normalized + padding);
}

function clampInteger(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(numeric)));
}

function escapeRegex(value) {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function wildcardToRegex(value) {
  return new RegExp(`^${escapeRegex(value).replace(/\*/g, '.*')}$`);
}

function matchesRule(rule, href) {
  const normalized = String(rule || '').trim();
  if (!normalized) return false;

  try {
    const url = new URL(href);

    if (normalized.startsWith('\x64\x6f\x6d\x61\x69\x6e\x3a')) {
      const domain = normalized.slice(7).trim().toLowerCase();
      return url.hostname.toLowerCase() === domain || url.hostname.toLowerCase().endsWith(`.${domain}`);
    }

    if (normalized.startsWith('\x68\x6f\x73\x74\x3a')) {
      return url.hostname.toLowerCase() === normalized.slice(5).trim().toLowerCase();
    }

    if (normalized.startsWith('\x70\x61\x74\x74\x65\x72\x6e\x3a')) {
      return wildcardToRegex(normalized.slice(8).trim()).test(href);
    }

    if (normalized.startsWith('\x72\x65\x67\x65\x78\x3a')) {
      return new RegExp(normalized.slice(6)).test(href);
    }

    return wildcardToRegex(normalized).test(href);
  } catch {
    return false;
  }
}

function normalizeRegionMode(value, fallback = DEFAULTS.defaultRegionMode) {
  const normalized = String(value || '').trim().toLowerCase();
  return REGION_MODES.includes(normalized) ? normalized : fallback;
}

function normalizeWhitelist(rules) {
  if (!Array.isArray(rules)) return [...DEFAULTS.whitelist];
  return [...new Set(rules.map((rule) => String(rule || '').trim()).filter(Boolean))];
}

function getSessionAccessHost(url) {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/i.test(parsed.protocol)) return '';
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}

function normalizeSessionAccessHosts(hosts) {
  if (!Array.isArray(hosts)) return [];

  return [...new Set(
    hosts
      .map((host) => getSessionAccessHost(`https://${String(host || '').trim()}`) || String(host || '').trim().toLowerCase())
      .filter(Boolean)
  )].slice(0, 200);
}

function readStateNumber(state, key, fallback) {
  const value = Number(state[key]);
  return Number.isFinite(value) ? value : fallback;
}

function readStateBoolean(state, key, fallback) {
  return typeof state[key] === '\x62\x6f\x6f\x6c\x65\x61\x6e' ? state[key] : fallback;
}

function isPlainObject(value) {
  return !!value && typeof value === '\x6f\x62\x6a\x65\x63\x74' && !Array.isArray(value);
}

function normalizeBiometricTransports(transports) {
  if (!Array.isArray(transports)) return [];

  const allowed = new Set(['\x62\x6c\x65', '\x68\x79\x62\x72\x69\x64', '\x69\x6e\x74\x65\x72\x6e\x61\x6c', '\x6e\x66\x63', '\x75\x73\x62']);
  return [...new Set(
    transports
      .map((transport) => String(transport || '').trim().toLowerCase())
      .filter((transport) => allowed.has(transport))
  )];
}

function hasBiometricCredential(state) {
  return typeof state[KEYS.biometricCredentialId] === '\x73\x74\x72\x69\x6e\x67'
    && !!state[KEYS.biometricCredentialId]
    && typeof state[KEYS.biometricPublicKey] === '\x73\x74\x72\x69\x6e\x67'
    && !!state[KEYS.biometricPublicKey];
}

function isSupportedBiometricAlgorithm(value) {
  return value === BIOMETRIC_ALGORITHMS.ES256 || value === BIOMETRIC_ALGORITHMS.RS256;
}

function sanitizePendingBiometricRequest(value) {
  if (!isPlainObject(value)) return null;

  const type = value.type === '\x73\x65\x74\x75\x70' || value.type === '\x75\x6e\x6c\x6f\x63\x6b' ? value.type : '';
  const requestId = typeof value.requestId === '\x73\x74\x72\x69\x6e\x67' ? value.requestId.trim() : '';
  const challenge = typeof value.challenge === '\x73\x74\x72\x69\x6e\x67' ? value.challenge.trim() : '';
  if (!type || !requestId || !challenge) return null;

  return {
    type,
    requestId,
    challenge,
    createdAt: readStateNumber(value, '\x63\x72\x65\x61\x74\x65\x64\x41\x74', 0),
    tabId: Number.isInteger(value.tabId) ? value.tabId : null,
    url: typeof value.url === '\x73\x74\x72\x69\x6e\x67' ? value.url : '',
    pageOnly: !!value.pageOnly,
    useDefaultSession: value.useDefaultSession !== false,
    sessionMinutes: Number.isFinite(Number(value.sessionMinutes))
      ? Number(value.sessionMinutes)
      : DEFAULTS.unlockSessionMinutes
  };
}

function sanitizePendingBiometricRequests(value) {
  const rawRequests = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const dedupedRequests = new Map();
  for (const rawRequest of rawRequests) {
    const request = sanitizePendingBiometricRequest(rawRequest);
    if (!request) continue;
    if (request.createdAt > 0 && (now() - request.createdAt) > BIOMETRIC_REQUEST_TTL_MS) continue;
    dedupedRequests.set(request.requestId, request);
  }

  return [...dedupedRequests.values()]
    .sort((left, right) => left.createdAt - right.createdAt)
    .slice(-MAX_PENDING_BIOMETRIC_REQUESTS);
}

function sanitizeDomainProfile(profile, index = 0) {
  if (!isPlainObject(profile)) return null;

  const match = String(profile.match || profile.rule || profile.pattern || '').trim();
  if (!match) return null;

  const forceLock = !!profile.forceLock;

  return {
    id: typeof profile.id === '\x73\x74\x72\x69\x6e\x67' && profile.id.trim()
      ? profile.id.trim()
      : `profile-${index}-${crypto.randomUUID()}`,
    name: typeof profile.name === '\x73\x74\x72\x69\x6e\x67' && profile.name.trim()
      ? profile.name.trim()
      : `Profile ${index + 1}`,
    match,
    unlockSessionMinutes: profile.unlockSessionMinutes === null || profile.unlockSessionMinutes === undefined || profile.unlockSessionMinutes === ''
      ? null
      : clampInteger(profile.unlockSessionMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes),
    pageUnlockMinutes: profile.pageUnlockMinutes === null || profile.pageUnlockMinutes === undefined || profile.pageUnlockMinutes === ''
      ? null
      : clampInteger(profile.pageUnlockMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes),
    regionMode: normalizeRegionMode(profile.regionMode, DEFAULTS.defaultRegionMode),
    maskIdentity: !!profile.maskIdentity,
    bypassGlobalLock: forceLock ? false : !!profile.bypassGlobalLock,
    forceLock,
    reAuthOnVisit: !!profile.reAuthOnVisit
  };
}

function normalizeDomainProfiles(profiles) {
  if (!Array.isArray(profiles)) return [];

  return profiles
    .map((profile, index) => sanitizeDomainProfile(profile, index))
    .filter(Boolean)
    .slice(0, 40);
}

function findMatchingProfileForUrl(url, profiles) {
  if (!url || !Array.isArray(profiles)) return null;
  return profiles.find((profile) => {
    try {
      return matchesRule(profile.match, url);
    } catch {
      return false;
    }
  }) || null;
}

function resolvePageUnlockMinutes(profile, fallbackMinutes = DEFAULTS.unlockSessionMinutes) {
  if (!profile) return fallbackMinutes;
  if (Number.isFinite(profile.pageUnlockMinutes)) return profile.pageUnlockMinutes;
  if (Number.isFinite(profile.unlockSessionMinutes)) return profile.unlockSessionMinutes;
  return fallbackMinutes;
}

function sanitizeBlurRegion(region, index = 0) {
  if (!isPlainObject(region)) return null;

  const left = clampInteger(region.left, 0, 100000, -1);
  const top = clampInteger(region.top, 0, 100000, -1);
  const width = clampInteger(region.width, 0, 100000, -1);
  const height = clampInteger(region.height, 0, 100000, -1);

  if (left < 0 || top < 0 || width < 24 || height < 24) {
    return null;
  }

  return {
    id: typeof region.id === '\x73\x74\x72\x69\x6e\x67' && region.id.trim()
      ? region.id.trim()
      : `region-${index}-${crypto.randomUUID()}`,
    left,
    top,
    width,
    height,
    mode: normalizeRegionMode(region.mode, DEFAULTS.defaultRegionMode)
  };
}

function normalizeBlurRegions(regions) {
  if (!Array.isArray(regions)) return [];

  return regions
    .map((region, index) => sanitizeBlurRegion(region, index))
    .filter(Boolean)
    .slice(0, 20);
}

function normalizeBlurRegionsByDomain(map) {
  if (!isPlainObject(map)) return {};

  const normalized = {};
  for (const [domain, regions] of Object.entries(map)) {
    const key = String(domain || '').trim().toLowerCase();
    if (!key) continue;

    const sanitizedRegions = normalizeBlurRegions(regions);
    if (sanitizedRegions.length > 0) {
      normalized[key] = sanitizedRegions;
    }
  }

  return normalized;
}

function getBlurDomainKey(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getSettingsSnapshot(state) {
  return {
    autoLockMinutes: clampInteger(state[KEYS.autoLockMinutes], 1, 1440, DEFAULTS.autoLockMinutes),
    whitelist: Array.isArray(state[KEYS.whitelist]) ? state[KEYS.whitelist] : [...DEFAULTS.whitelist],
    maxAttempts: clampInteger(state[KEYS.maxAttempts], 1, 20, DEFAULTS.maxAttempts),
    lockoutMinutes: clampInteger(state[KEYS.lockoutMinutes], 1, 1440, DEFAULTS.lockoutMinutes),
    unlockSessionMinutes: clampInteger(state[KEYS.unlockSessionMinutes], 0, 1440, DEFAULTS.unlockSessionMinutes),
    lockOnWindowBlur: readStateBoolean(state, KEYS.lockOnWindowBlur, DEFAULTS.lockOnWindowBlur),
    requiresPasswordSetup: readStateBoolean(state, KEYS.requiresPasswordSetup, DEFAULTS.requiresPasswordSetup),
    defaultRegionMode: normalizeRegionMode(state[KEYS.defaultRegionMode], DEFAULTS.defaultRegionMode),
    maskPageIdentity: readStateBoolean(state, KEYS.maskPageIdentity, DEFAULTS.maskPageIdentity),
    domainProfiles: normalizeDomainProfiles(state[KEYS.domainProfiles]),
    requirePasswordOnDomainChange: readStateBoolean(
      state,
      KEYS.requirePasswordOnDomainChange,
      DEFAULTS.requirePasswordOnDomainChange
    ),
    biometricConfigured: hasBiometricCredential(state),
    biometricCreatedAt: readStateNumber(state, KEYS.biometricCreatedAt, DEFAULTS.biometricCreatedAt)
  };
}

function getState() {
  return chrome.storage.local.get(Object.values(KEYS));
}

function setState(partial) {
  return chrome.storage.local.set(partial);
}

async function getPendingBiometricRequest(state = null) {
  return getPendingBiometricRequestById('', state);
}

async function getPendingBiometricRequests(state = null) {
  const source = state || await getState();
  return sanitizePendingBiometricRequests(source[KEYS.pendingBiometricRequest]);
}

async function getPendingBiometricRequestById(requestId = '', state = null) {
  const requests = await getPendingBiometricRequests(state);
  const normalizedRequestId = String(requestId || '').trim();

  if (!normalizedRequestId) {
    return requests[requests.length - 1] || null;
  }

  return requests.find((request) => request.requestId === normalizedRequestId) || null;
}

async function setPendingBiometricRequest(request) {
  const normalizedRequest = sanitizePendingBiometricRequest(request);
  if (!normalizedRequest) return;

  const requests = await getPendingBiometricRequests();
  const nextRequests = requests.filter((entry) => entry.requestId !== normalizedRequest.requestId);
  nextRequests.push(normalizedRequest);
  await setState({
    [KEYS.pendingBiometricRequest]: sanitizePendingBiometricRequests(nextRequests)
  });
}

async function clearPendingBiometricRequest(requestId = '') {
  const normalizedRequestId = String(requestId || '').trim();
  if (!normalizedRequestId) {
    await chrome.storage.local.remove(KEYS.pendingBiometricRequest);
    return;
  }

  const requests = await getPendingBiometricRequests();
  const nextRequests = requests.filter((request) => request.requestId !== normalizedRequestId);
  if (!nextRequests.length) {
    await chrome.storage.local.remove(KEYS.pendingBiometricRequest);
    return;
  }

  await setState({
    [KEYS.pendingBiometricRequest]: nextRequests
  });
}

async function resolveBiometricRequest(message, expectedType, state = null) {
  const requestId = String(message?.requestId || '').trim();
  if (!requestId) return null;

  const storedRequest = await getPendingBiometricRequestById(requestId, state);
  if (storedRequest) {
    return storedRequest.type === expectedType ? storedRequest : null;
  }

  const fallbackRequest = sanitizePendingBiometricRequest(message?.request);
  if (!fallbackRequest) return null;
  if (fallbackRequest.type !== expectedType || fallbackRequest.requestId !== requestId) return null;
  if (fallbackRequest.createdAt > 0 && (now() - fallbackRequest.createdAt) > BIOMETRIC_REQUEST_TTL_MS) {
    return null;
  }

  return fallbackRequest;
}

async function derivePasswordHash(password, saltBase64, iterations) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    '\x72\x61\x77',
    encoder.encode(password),
    { name: '\x50\x42\x4b\x44\x46\x32' },
    false,
    ['\x64\x65\x72\x69\x76\x65\x42\x69\x74\x73']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: '\x50\x42\x4b\x44\x46\x32',
      salt: fromBase64(saltBase64),
      iterations,
      hash: '\x53\x48\x41\x2d\x32\x35\x36'
    },
    keyMaterial,
    256
  );

  return toBase64(new Uint8Array(bits));
}

async function sha256Bytes(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await crypto.subtle.digest('\x53\x48\x41\x2d\x32\x35\x36', bytes);
  return new Uint8Array(digest);
}

function concatBytes(...parts) {
  const arrays = parts.map((part) => (part instanceof Uint8Array ? part : new Uint8Array(part)));
  const totalLength = arrays.reduce((sum, array) => sum + array.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  arrays.forEach((array) => {
    output.set(array, offset);
    offset += array.length;
  });

  return output;
}

function readDerLength(bytes, offset) {
  if (offset >= bytes.length) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x6c\x65\x6e\x67\x74\x68\x2e');
  }

  const firstByte = bytes[offset];
  if ((firstByte & 0x80) === 0) {
    return {
      length: firstByte,
      nextOffset: offset + 1
    };
  }

  const lengthBytes = firstByte & 0x7f;
  if (lengthBytes < 1 || lengthBytes > 4 || (offset + 1 + lengthBytes) > bytes.length) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x6c\x65\x6e\x67\x74\x68\x2e');
  }

  let length = 0;
  for (let index = 0; index < lengthBytes; index += 1) {
    length = (length << 8) | bytes[offset + 1 + index];
  }

  return {
    length,
    nextOffset: offset + 1 + lengthBytes
  };
}

function normalizeDerInteger(bytes, fieldLength) {
  let start = 0;
  while (start < bytes.length - 1 && bytes[start] === 0) {
    start += 1;
  }

  const normalized = bytes.slice(start);
  if (normalized.length > fieldLength) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x69\x6e\x74\x65\x67\x65\x72\x2e');
  }

  const output = new Uint8Array(fieldLength);
  output.set(normalized, fieldLength - normalized.length);
  return output;
}

function convertDerEcdsaSignatureToP1363(signature, fieldLength = 32) {
  const bytes = signature instanceof Uint8Array ? signature : new Uint8Array(signature);
  if (bytes.length < 8 || bytes[0] !== 0x30) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x2e');
  }

  const sequenceLengthInfo = readDerLength(bytes, 1);
  const sequenceEnd = sequenceLengthInfo.nextOffset + sequenceLengthInfo.length;
  if (sequenceEnd !== bytes.length) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x2e');
  }

  let offset = sequenceLengthInfo.nextOffset;
  if (bytes[offset] !== 0x02) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x2e');
  }

  const rLengthInfo = readDerLength(bytes, offset + 1);
  const rEnd = rLengthInfo.nextOffset + rLengthInfo.length;
  if (rEnd > bytes.length) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x2e');
  }
  const r = normalizeDerInteger(bytes.slice(rLengthInfo.nextOffset, rEnd), fieldLength);

  offset = rEnd;
  if (bytes[offset] !== 0x02) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x2e');
  }

  const sLengthInfo = readDerLength(bytes, offset + 1);
  const sEnd = sLengthInfo.nextOffset + sLengthInfo.length;
  if (sEnd !== bytes.length) {
    throw new Error('\x49\x6e\x76\x61\x6c\x69\x64\x20\x44\x45\x52\x20\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x2e');
  }
  const s = normalizeDerInteger(bytes.slice(sLengthInfo.nextOffset, sEnd), fieldLength);

  return concatBytes(r, s);
}

function getExtensionOrigin() {
  return chrome.runtime.getURL('').replace(/\/$/, '');
}

async function getAcceptedRpIdHashes() {
  const candidates = [
    getExtensionOrigin(),
    String(chrome.runtime.id || '').trim()
  ].filter(Boolean);

  const uniqueCandidates = [...new Set(candidates)];
  const hashes = await Promise.all(
    uniqueCandidates.map((candidate) => sha256Bytes(new TextEncoder().encode(candidate)))
  );

  return hashes;
}

function createBiometricVerificationError(genericError, reason) {
  const error = new Error(`${genericError} [${reason}]`);
  error.biometricReason = reason;
  return error;
}

async function verifyBiometricAssertion(message, request, state) {
  const genericError = await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x76\x65\x72\x69\x66\x69\x63\x61\x74\x69\x6f\x6e\x5f\x66\x61\x69\x6c\x65\x64');
  const fail = (reason) => {
    throw createBiometricVerificationError(genericError, reason);
  };

  if (!hasBiometricCredential(state)) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x6e\x6f\x74\x5f\x73\x65\x74\x75\x70'));
  }

  const biometricAlgorithm = Number(state[KEYS.biometricAlgorithm] || DEFAULTS.biometricAlgorithm);
  if (!isSupportedBiometricAlgorithm(biometricAlgorithm)) {
    fail('\x75\x6e\x73\x75\x70\x70\x6f\x72\x74\x65\x64\x5f\x61\x6c\x67\x6f\x72\x69\x74\x68\x6d');
  }

  const rawId = fromBase64Url(message.credentialId);
  if (toBase64Url(rawId) !== state[KEYS.biometricCredentialId]) {
    fail('\x63\x72\x65\x64\x65\x6e\x74\x69\x61\x6c\x5f\x69\x64\x5f\x6d\x69\x73\x6d\x61\x74\x63\x68');
  }

  const clientDataJSON = fromBase64Url(message.clientDataJSON);
  const authenticatorData = fromBase64Url(message.authenticatorData);
  const signature = fromBase64Url(message.signature);
  if (authenticatorData.length < 37 || signature.length === 0) {
    fail('\x6d\x61\x6c\x66\x6f\x72\x6d\x65\x64\x5f\x61\x73\x73\x65\x72\x74\x69\x6f\x6e');
  }

  let clientData = null;
  try {
    clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));
  } catch {
    fail('\x63\x6c\x69\x65\x6e\x74\x5f\x64\x61\x74\x61\x5f\x70\x61\x72\x73\x65\x5f\x66\x61\x69\x6c\x65\x64');
  }

  if (clientData?.type !== '\x77\x65\x62\x61\x75\x74\x68\x6e\x2e\x67\x65\x74') {
    fail('\x63\x6c\x69\x65\x6e\x74\x5f\x64\x61\x74\x61\x5f\x74\x79\x70\x65\x5f\x6d\x69\x73\x6d\x61\x74\x63\x68');
  }
  if (clientData?.challenge !== request.challenge) {
    fail('\x63\x68\x61\x6c\x6c\x65\x6e\x67\x65\x5f\x6d\x69\x73\x6d\x61\x74\x63\x68');
  }
  if (clientData?.origin !== getExtensionOrigin()) {
    fail('\x6f\x72\x69\x67\x69\x6e\x5f\x6d\x69\x73\x6d\x61\x74\x63\x68');
  }

  const actualRpIdHash = authenticatorData.slice(0, 32);
  const acceptedRpIdHashes = await getAcceptedRpIdHashes();
  const matchesRpIdHash = acceptedRpIdHashes.some((expectedRpIdHash) => (
    expectedRpIdHash.every((byte, index) => actualRpIdHash[index] === byte)
  ));
  if (!matchesRpIdHash) {
    fail('\x72\x70\x5f\x69\x64\x5f\x68\x61\x73\x68\x5f\x6d\x69\x73\x6d\x61\x74\x63\x68');
  }

  const flags = authenticatorData[32];
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;
  if (!userPresent || !userVerified) {
    fail('\x75\x73\x65\x72\x5f\x70\x72\x65\x73\x65\x6e\x63\x65\x5f\x6f\x72\x5f\x76\x65\x72\x69\x66\x69\x63\x61\x74\x69\x6f\x6e\x5f\x6d\x69\x73\x73\x69\x6e\x67');
  }

  const clientDataHash = await sha256Bytes(clientDataJSON);
  const signedData = concatBytes(authenticatorData, clientDataHash);
  let verificationKey;
  let verifyAlgorithm;
  let normalizedSignature = signature;

  try {
    if (biometricAlgorithm === BIOMETRIC_ALGORITHMS.ES256) {
      verificationKey = await crypto.subtle.importKey(
        '\x73\x70\x6b\x69',
        fromBase64(state[KEYS.biometricPublicKey]),
        { name: '\x45\x43\x44\x53\x41', namedCurve: '\x50\x2d\x32\x35\x36' },
        false,
        ['\x76\x65\x72\x69\x66\x79']
      );
      verifyAlgorithm = { name: '\x45\x43\x44\x53\x41', hash: '\x53\x48\x41\x2d\x32\x35\x36' };
      normalizedSignature = convertDerEcdsaSignatureToP1363(signature, 32);
    } else {
      verificationKey = await crypto.subtle.importKey(
        '\x73\x70\x6b\x69',
        fromBase64(state[KEYS.biometricPublicKey]),
        { name: '\x52\x53\x41\x53\x53\x41\x2d\x50\x4b\x43\x53\x31\x2d\x76\x31\x5f\x35', hash: '\x53\x48\x41\x2d\x32\x35\x36' },
        false,
        ['\x76\x65\x72\x69\x66\x79']
      );
      verifyAlgorithm = { name: '\x52\x53\x41\x53\x53\x41\x2d\x50\x4b\x43\x53\x31\x2d\x76\x31\x5f\x35' };
    }
  } catch {
    fail('\x70\x75\x62\x6c\x69\x63\x5f\x6b\x65\x79\x5f\x69\x6d\x70\x6f\x72\x74\x5f\x6f\x72\x5f\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x5f\x70\x61\x72\x73\x65\x5f\x66\x61\x69\x6c\x65\x64');
  }

  const verified = await crypto.subtle.verify(
    verifyAlgorithm,
    verificationKey,
    normalizedSignature,
    signedData
  );

  if (!verified) {
    fail('\x73\x69\x67\x6e\x61\x74\x75\x72\x65\x5f\x6d\x69\x73\x6d\x61\x74\x63\x68');
  }
}

async function notifyBiometricResult(request, payload) {
  if (!Number.isInteger(request?.tabId)) return;

  try {
    await chrome.tabs.sendMessage(request.tabId, {
      type: '\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x41\x55\x54\x48\x5f\x52\x45\x53\x55\x4c\x54',
      ...payload
    });
  } catch {
    // Ignore if the original tab is gone or cannot receive messages.
  }
}

async function openBiometricWindow(requestId) {
  const url = chrome.runtime.getURL(`biometric.html?requestId=${encodeURIComponent(requestId)}`);
  await chrome.windows.create({
    url,
    type: '\x70\x6f\x70\x75\x70',
    focused: true,
    width: 460,
    height: 640
  });
}

async function beginBiometricSetup() {
  const state = await getState();
  const settings = getSettingsSnapshot(state);
  if (settings.requiresPasswordSetup) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x66\x69\x72\x73\x74\x5f\x73\x65\x74\x75\x70\x5f\x72\x65\x71\x75\x69\x72\x65\x64'));
  }

  const request = {
    type: '\x73\x65\x74\x75\x70',
    requestId: crypto.randomUUID(),
    challenge: toBase64Url(randomBytes(32)),
    createdAt: now(),
    tabId: null,
    url: '',
    pageOnly: false,
    useDefaultSession: true,
    sessionMinutes: settings.unlockSessionMinutes
  };

  await setPendingBiometricRequest(request);

  try {
    await openBiometricWindow(request.requestId);
  } catch (error) {
    await clearPendingBiometricRequest(request.requestId);
    throw error;
  }
}

async function beginBiometricUnlock(sender, url, pageOnly, useDefaultSession, sessionMinutes) {
  const state = await getState();
  const settings = getSettingsSnapshot(state);

  if (settings.requiresPasswordSetup) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x66\x69\x72\x73\x74\x5f\x73\x65\x74\x75\x70\x5f\x62\x65\x66\x6f\x72\x65\x5f\x75\x6e\x6c\x6f\x63\x6b'));
  }
  if (!hasBiometricCredential(state)) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x6e\x6f\x74\x5f\x73\x65\x74\x75\x70'));
  }
  if (!Number.isInteger(sender?.tab?.id)) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x74\x61\x62\x5f\x6d\x69\x73\x73\x69\x6e\x67'));
  }

  const request = {
    type: '\x75\x6e\x6c\x6f\x63\x6b',
    requestId: crypto.randomUUID(),
    challenge: toBase64Url(randomBytes(32)),
    createdAt: now(),
    tabId: sender.tab.id,
    url: url || sender?.url || sender?.tab?.url || '',
    pageOnly: !!pageOnly,
    useDefaultSession: !!useDefaultSession,
    sessionMinutes: clampInteger(sessionMinutes, 0, 1440, settings.unlockSessionMinutes)
  };

  await setPendingBiometricRequest(request);

  try {
    await openBiometricWindow(request.requestId);
  } catch (error) {
    await clearPendingBiometricRequest(request.requestId);
    throw error;
  }
}

async function completeBiometricSetup(message) {
  const state = await getState();
  const request = await resolveBiometricRequest(message, '\x73\x65\x74\x75\x70', state);
  if (!request || request.type !== '\x73\x65\x74\x75\x70' || request.requestId !== message.requestId) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x72\x65\x71\x75\x65\x73\x74\x5f\x6d\x69\x73\x73\x69\x6e\x67'));
  }

  const credentialId = String(message.credentialId || '').trim();
  const publicKey = String(message.publicKey || '').trim();
  const algorithm = Number(message.algorithm);
  if (!credentialId || !publicKey || !isSupportedBiometricAlgorithm(algorithm)) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x70\x75\x62\x6c\x69\x63\x5f\x6b\x65\x79\x5f\x6d\x69\x73\x73\x69\x6e\x67'));
  }

  await setState({
    [KEYS.biometricCredentialId]: credentialId,
    [KEYS.biometricPublicKey]: publicKey,
    [KEYS.biometricAlgorithm]: algorithm,
    [KEYS.biometricTransports]: normalizeBiometricTransports(message.transports),
    [KEYS.biometricCreatedAt]: now()
  });
  suppressWindowBlurLock();
  await clearPendingBiometricRequest(request.requestId);
  await appendLog({ type: '\x73\x65\x63\x75\x72\x69\x74\x79', action: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x72\x65\x67\x69\x73\x74\x65\x72\x65\x64' });
  await broadcastLockState();
}

async function completeBiometricUnlock(message) {
  const state = await getState();
  const settings = getSettingsSnapshot(state);
  const request = await resolveBiometricRequest(message, '\x75\x6e\x6c\x6f\x63\x6b', state);
  if (!request || request.type !== '\x75\x6e\x6c\x6f\x63\x6b' || request.requestId !== message.requestId) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x72\x65\x71\x75\x65\x73\x74\x5f\x6d\x69\x73\x73\x69\x6e\x67'));
  }

  try {
    await verifyBiometricAssertion(message, request, state);
  } catch (error) {
    await appendLog({
      type: '\x73\x65\x63\x75\x72\x69\x74\x79',
      action: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x76\x65\x72\x69\x66\x69\x63\x61\x74\x69\x6f\x6e\x2d\x66\x61\x69\x6c\x65\x64',
      url: safeUrlForLog(request.url),
      meta: {
        reason: error?.biometricReason || '\x75\x6e\x6b\x6e\x6f\x77\x6e',
        algorithm: Number(state[KEYS.biometricAlgorithm] || DEFAULTS.biometricAlgorithm)
      }
    });
    await clearPendingBiometricRequest(request.requestId);
    await notifyBiometricResult(request, { ok: true, success: false, error: error.message });
    throw error;
  }

  if (request.pageOnly) {
    const matchedProfile = findMatchingProfileForUrl(request.url, settings.domainProfiles);
    const effectivePageUnlockMinutes = resolvePageUnlockMinutes(
      matchedProfile,
      settings.unlockSessionMinutes
    );

    await appendLog({
      type: '\x75\x6e\x6c\x6f\x63\x6b',
      source: '\x70\x72\x6f\x66\x69\x6c\x65\x2d\x62\x69\x6f\x6d\x65\x74\x72\x69\x63',
      url: safeUrlForLog(request.url),
      meta: {
        profileId: matchedProfile?.id || '',
        profileName: matchedProfile?.name || '',
        pageUnlockMinutes: effectivePageUnlockMinutes
      }
    });
    suppressWindowBlurLock();
    await clearPendingBiometricRequest(request.requestId);
    await notifyBiometricResult(request, {
      ok: true,
      success: true,
      mode: '\x70\x72\x6f\x66\x69\x6c\x65',
      profileId: matchedProfile?.id || '',
      profileName: matchedProfile?.name || '',
      pageUnlockMinutes: effectivePageUnlockMinutes
    });
    return;
  }

  const requestedSessionMinutes = resolveUnlockSessionMinutes(
    settings,
    request.url,
    request.useDefaultSession,
    request.sessionMinutes
  );

  await unlockNow(
    state,
    '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63',
    request.url,
    requestedSessionMinutes,
    settings.requirePasswordOnDomainChange
  );
  suppressWindowBlurLock();
  await clearPendingBiometricRequest(request.requestId);
  await notifyBiometricResult(request, {
    ok: true,
    success: true,
    mode: '\x67\x6c\x6f\x62\x61\x6c',
    sessionMinutes: requestedSessionMinutes
  });
}

async function cancelBiometricRequest(requestId, errorMessage = '') {
  const state = await getState();
  const request = await getPendingBiometricRequestById(requestId, state);
  if (!request || request.requestId !== requestId) {
    return;
  }

  await clearPendingBiometricRequest(request.requestId);
  if (request.type === '\x75\x6e\x6c\x6f\x63\x6b') {
    await notifyBiometricResult(request, {
      ok: true,
      success: false,
      error: errorMessage || await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x63\x61\x6e\x63\x65\x6c\x6c\x65\x64')
    });
  }
}

async function ensureInitialized() {
  const state = await getState();
  const updates = {};
  const hasPassword = typeof state[KEYS.passwordHash] === '\x73\x74\x72\x69\x6e\x67' && state[KEYS.passwordHash];
  const hasSalt = typeof state[KEYS.passwordSalt] === '\x73\x74\x72\x69\x6e\x67' && state[KEYS.passwordSalt];

  if (typeof state[KEYS.isLocked] !== '\x62\x6f\x6f\x6c\x65\x61\x6e') updates[KEYS.isLocked] = true;
  if (!Number.isFinite(Number(state[KEYS.autoLockMinutes]))) updates[KEYS.autoLockMinutes] = DEFAULTS.autoLockMinutes;
  if (!Array.isArray(state[KEYS.whitelist])) updates[KEYS.whitelist] = [...DEFAULTS.whitelist];
  if (!Array.isArray(state[KEYS.logs])) updates[KEYS.logs] = [...DEFAULTS.logs];
  if (!Number.isFinite(Number(state[KEYS.failedAttempts]))) updates[KEYS.failedAttempts] = DEFAULTS.failedAttempts;
  if (!Number.isFinite(Number(state[KEYS.lockoutUntil]))) updates[KEYS.lockoutUntil] = DEFAULTS.lockoutUntil;
  if (!Number.isFinite(Number(state[KEYS.maxAttempts]))) updates[KEYS.maxAttempts] = DEFAULTS.maxAttempts;
  if (!Number.isFinite(Number(state[KEYS.lockoutMinutes]))) updates[KEYS.lockoutMinutes] = DEFAULTS.lockoutMinutes;
  if (!Number.isFinite(Number(state[KEYS.unlockSessionMinutes]))) updates[KEYS.unlockSessionMinutes] = DEFAULTS.unlockSessionMinutes;
  if (!Number.isFinite(Number(state[KEYS.unlockUntil]))) updates[KEYS.unlockUntil] = DEFAULTS.unlockUntil;
  if (!Number.isFinite(Number(state[KEYS.passwordIterations]))) updates[KEYS.passwordIterations] = DEFAULTS.passwordIterations;
  if (typeof state[KEYS.lockOnWindowBlur] !== '\x62\x6f\x6f\x6c\x65\x61\x6e') updates[KEYS.lockOnWindowBlur] = DEFAULTS.lockOnWindowBlur;
  if (!REGION_MODES.includes(String(state[KEYS.defaultRegionMode] || '').trim().toLowerCase())) {
    updates[KEYS.defaultRegionMode] = DEFAULTS.defaultRegionMode;
  }
  if (typeof state[KEYS.maskPageIdentity] !== '\x62\x6f\x6f\x6c\x65\x61\x6e') {
    updates[KEYS.maskPageIdentity] = DEFAULTS.maskPageIdentity;
  }
  if (!Array.isArray(state[KEYS.domainProfiles])) {
    updates[KEYS.domainProfiles] = [...DEFAULTS.domainProfiles];
  } else {
    const normalizedProfiles = normalizeDomainProfiles(state[KEYS.domainProfiles]);
    if (JSON.stringify(normalizedProfiles) !== JSON.stringify(state[KEYS.domainProfiles])) {
      updates[KEYS.domainProfiles] = normalizedProfiles;
    }
  }
  if (typeof state[KEYS.requirePasswordOnDomainChange] !== '\x62\x6f\x6f\x6c\x65\x61\x6e') {
    updates[KEYS.requirePasswordOnDomainChange] = DEFAULTS.requirePasswordOnDomainChange;
  }
  if (!Array.isArray(state[KEYS.sessionAccessHosts])) {
    updates[KEYS.sessionAccessHosts] = [...DEFAULTS.sessionAccessHosts];
  } else {
    const normalizedSessionHosts = normalizeSessionAccessHosts(state[KEYS.sessionAccessHosts]);
    if (JSON.stringify(normalizedSessionHosts) !== JSON.stringify(state[KEYS.sessionAccessHosts])) {
      updates[KEYS.sessionAccessHosts] = normalizedSessionHosts;
    }
  }
  if (!isPlainObject(state[KEYS.blurRegionsByDomain])) {
    updates[KEYS.blurRegionsByDomain] = { ...DEFAULTS.blurRegionsByDomain };
  } else {
    const normalizedBlurMap = normalizeBlurRegionsByDomain(state[KEYS.blurRegionsByDomain]);
    if (JSON.stringify(normalizedBlurMap) !== JSON.stringify(state[KEYS.blurRegionsByDomain])) {
      updates[KEYS.blurRegionsByDomain] = normalizedBlurMap;
    }
  }

  const hasBiometricId = typeof state[KEYS.biometricCredentialId] === '\x73\x74\x72\x69\x6e\x67' && !!state[KEYS.biometricCredentialId];
  const hasBiometricKey = typeof state[KEYS.biometricPublicKey] === '\x73\x74\x72\x69\x6e\x67' && !!state[KEYS.biometricPublicKey];
  if (!hasBiometricId || !hasBiometricKey) {
    updates[KEYS.biometricCredentialId] = '';
    updates[KEYS.biometricPublicKey] = '';
    updates[KEYS.biometricAlgorithm] = DEFAULTS.biometricAlgorithm;
    updates[KEYS.biometricTransports] = [...DEFAULTS.biometricTransports];
    updates[KEYS.biometricCreatedAt] = DEFAULTS.biometricCreatedAt;
  } else {
    if (!Number.isFinite(Number(state[KEYS.biometricAlgorithm]))) {
      updates[KEYS.biometricAlgorithm] = DEFAULTS.biometricAlgorithm;
    }
    if (!Array.isArray(state[KEYS.biometricTransports])) {
      updates[KEYS.biometricTransports] = [...DEFAULTS.biometricTransports];
    } else {
      const normalizedTransports = normalizeBiometricTransports(state[KEYS.biometricTransports]);
      if (JSON.stringify(normalizedTransports) !== JSON.stringify(state[KEYS.biometricTransports])) {
        updates[KEYS.biometricTransports] = normalizedTransports;
      }
    }
    if (!Number.isFinite(Number(state[KEYS.biometricCreatedAt]))) {
      updates[KEYS.biometricCreatedAt] = DEFAULTS.biometricCreatedAt;
    }
  }

  const pendingBiometricRequests = sanitizePendingBiometricRequests(state[KEYS.pendingBiometricRequest]);
  const normalizedPendingBiometricRequests = pendingBiometricRequests.length ? pendingBiometricRequests : null;
  if (JSON.stringify(state[KEYS.pendingBiometricRequest] ?? null) !== JSON.stringify(normalizedPendingBiometricRequests)) {
    updates[KEYS.pendingBiometricRequest] = normalizedPendingBiometricRequests;
  }

  if (!hasPassword || !hasSalt) {
    updates[KEYS.passwordHash] = '';
    updates[KEYS.passwordSalt] = '';
    updates[KEYS.requiresPasswordSetup] = true;
  } else if (state[KEYS.requiresPasswordSetup] !== false) {
    updates[KEYS.requiresPasswordSetup] = false;
  }

  if (state[KEYS.settingsVersion] !== DEFAULTS.settingsVersion) {
    updates[KEYS.settingsVersion] = DEFAULTS.settingsVersion;
  }

  if (Object.keys(updates).length > 0) {
    await setState(updates);
  }

  await chrome.storage.local.remove('\x63\x6c\x6f\x73\x65\x4f\x6e\x4c\x6f\x63\x6b\x6f\x75\x74');
}

function safeUrlForLog(url) {
  try {
    const parsed = new URL(url);
    return parsed.origin + parsed.pathname;
  } catch {
    return url || '';
  }
}

async function appendLog(entry) {
  const state = await getState();
  const logs = Array.isArray(state[KEYS.logs]) ? state[KEYS.logs] : [];
  logs.unshift({
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ...entry
  });
  await setState({ [KEYS.logs]: logs.slice(0, 200) });
}

function getEligibleTabs(tabs) {
  return tabs.filter((tab) => tab.id && typeof tab.url === '\x73\x74\x72\x69\x6e\x67' && /^https?:/i.test(tab.url));
}

async function broadcastLockState() {
  const state = await getState();
  const settings = getSettingsSnapshot(state);
  const sessionAccessHosts = normalizeSessionAccessHosts(state[KEYS.sessionAccessHosts]);
  const tabs = getEligibleTabs(await chrome.tabs.query({}));

  await Promise.allSettled(
    tabs.map((tab) => chrome.tabs.sendMessage(tab.id, {
      type: '\x4c\x4f\x43\x4b\x5f\x53\x54\x41\x54\x45\x5f\x43\x48\x41\x4e\x47\x45\x44',
      isLocked: !!state[KEYS.isLocked],
      whitelist: settings.whitelist,
      failedAttempts: readStateNumber(state, KEYS.failedAttempts, DEFAULTS.failedAttempts),
      lockoutUntil: readStateNumber(state, KEYS.lockoutUntil, DEFAULTS.lockoutUntil),
      maxAttempts: settings.maxAttempts,
      lockoutMinutes: settings.lockoutMinutes,
      unlockSessionMinutes: settings.unlockSessionMinutes,
      unlockUntil: readStateNumber(state, KEYS.unlockUntil, DEFAULTS.unlockUntil),
      lockOnWindowBlur: settings.lockOnWindowBlur,
      requiresPasswordSetup: settings.requiresPasswordSetup,
      defaultRegionMode: settings.defaultRegionMode,
      maskPageIdentity: settings.maskPageIdentity,
      domainProfiles: settings.domainProfiles,
      requirePasswordOnDomainChange: settings.requirePasswordOnDomainChange,
      sessionAccessHosts
    }))
  );
}

async function syncSessionAlarm(unlockUntil) {
  await chrome.alarms.clear(ALARMS.sessionRelock);
  if (unlockUntil > now()) {
    await chrome.alarms.create(ALARMS.sessionRelock, { when: unlockUntil });
  }
}

async function lockNow(reason = '\x6d\x61\x6e\x75\x61\x6c', meta = {}) {
  await syncSessionAlarm(0);
  await setState({
    [KEYS.isLocked]: true,
    [KEYS.unlockUntil]: 0,
    [KEYS.sessionAccessHosts]: []
  });
  await appendLog({ type: '\x6c\x6f\x63\x6b', reason, meta });
  await broadcastLockState();
}

async function unlockNow(state, source = '\x70\x61\x73\x73\x77\x6f\x72\x64', tabUrl = '', sessionMinutes = 0, requirePasswordOnDomainChange = DEFAULTS.requirePasswordOnDomainChange) {
  const normalizedMinutes = clampInteger(sessionMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes);
  const unlockUntil = normalizedMinutes > 0 ? now() + (normalizedMinutes * 60 * 1000) : 0;
  const latestState = state || await getState();
  const existingHosts = normalizeSessionAccessHosts(latestState?.[KEYS.sessionAccessHosts]);
  const currentHost = getSessionAccessHost(tabUrl);
  const sessionAccessHosts = requirePasswordOnDomainChange
    ? normalizeSessionAccessHosts(currentHost ? [...existingHosts, currentHost] : existingHosts)
    : [];

  await setState({
    [KEYS.isLocked]: false,
    [KEYS.failedAttempts]: 0,
    [KEYS.lockoutUntil]: 0,
    [KEYS.unlockUntil]: unlockUntil,
    [KEYS.sessionAccessHosts]: sessionAccessHosts
  });
  await syncSessionAlarm(unlockUntil);
  await appendLog({
    type: '\x75\x6e\x6c\x6f\x63\x6b',
    source,
    sessionMinutes: normalizedMinutes,
    url: safeUrlForLog(tabUrl)
  });
  await broadcastLockState();
}

async function handleFailedPasswordAttempt(state, settings, url = '', meta = {}) {
  const failedAttempts = readStateNumber(state, KEYS.failedAttempts, DEFAULTS.failedAttempts) + 1;
  const updates = { [KEYS.failedAttempts]: failedAttempts };
  let response = {
    ok: true,
    success: false,
    error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x77\x72\x6f\x6e\x67\x5f\x70\x61\x73\x73\x77\x6f\x72\x64'),
    failedAttempts,
    maxAttempts: settings.maxAttempts
  };

  if (failedAttempts >= settings.maxAttempts) {
    const until = now() + (settings.lockoutMinutes * 60 * 1000);
    updates[KEYS.failedAttempts] = settings.maxAttempts;
    updates[KEYS.lockoutUntil] = until;
    response = {
      ok: true,
      success: false,
      error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x6c\x6f\x63\x6b\x6f\x75\x74\x5f\x61\x63\x74\x69\x76\x61\x74\x65\x64'),
      failedAttempts: settings.maxAttempts,
      maxAttempts: settings.maxAttempts,
      remainingMs: until - now()
    };
  }

  await setState(updates);
  await appendLog({
    type: '\x73\x65\x63\x75\x72\x69\x74\x79',
    action: '\x66\x61\x69\x6c\x65\x64\x2d\x75\x6e\x6c\x6f\x63\x6b',
    url: safeUrlForLog(url),
    meta
  });

  if (failedAttempts >= settings.maxAttempts) {
    await appendLog({
      type: '\x73\x65\x63\x75\x72\x69\x74\x79',
      action: '\x6c\x6f\x63\x6b\x6f\x75\x74\x2d\x61\x63\x74\x69\x76\x61\x74\x65\x64',
      meta
    });
  }

  await broadcastLockState();

  return response;
}

async function verifyPasswordOnly(state, settings, password, tabUrl = '', meta = {}) {
  const lockoutUntil = readStateNumber(state, KEYS.lockoutUntil, DEFAULTS.lockoutUntil);
  const remainingMs = Math.max(0, lockoutUntil - now());
  if (remainingMs > 0) {
    return {
      ok: true,
      success: false,
      error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x74\x65\x6d\x70\x5f\x6c\x6f\x63\x6b\x65\x64'),
      remainingMs
    };
  }

  const submitted = await derivePasswordHash(
    String(password || ''),
    state[KEYS.passwordSalt],
    readStateNumber(state, KEYS.passwordIterations, DEFAULTS.passwordIterations)
  );

  if (submitted !== state[KEYS.passwordHash]) {
    return handleFailedPasswordAttempt(state, settings, tabUrl, meta);
  }

  const updates = {};
  if (readStateNumber(state, KEYS.failedAttempts, DEFAULTS.failedAttempts) !== 0) {
    updates[KEYS.failedAttempts] = 0;
  }
  if (readStateNumber(state, KEYS.lockoutUntil, DEFAULTS.lockoutUntil) !== 0) {
    updates[KEYS.lockoutUntil] = 0;
  }

  if (Object.keys(updates).length > 0) {
    await setState(updates);
    await broadcastLockState();
  }

  await appendLog({
    type: '\x75\x6e\x6c\x6f\x63\x6b',
    source: '\x70\x72\x6f\x66\x69\x6c\x65\x2d\x61\x75\x74\x68',
    url: safeUrlForLog(tabUrl),
    meta
  });

  return { ok: true, success: true };
}

async function setUnlockTimer(sessionMinutes, source = '\x70\x6f\x70\x75\x70\x2d\x73\x65\x73\x73\x69\x6f\x6e') {
  const state = await getState();
  if (state[KEYS.isLocked]) {
    throw new Error(await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x6d\x75\x73\x74\x5f\x75\x6e\x6c\x6f\x63\x6b\x5f\x66\x69\x72\x73\x74'));
  }

  const normalizedMinutes = clampInteger(sessionMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes);
  const unlockUntil = normalizedMinutes > 0 ? now() + (normalizedMinutes * 60 * 1000) : 0;

  await setState({ [KEYS.unlockUntil]: unlockUntil });
  await syncSessionAlarm(unlockUntil);
  await appendLog({
    type: '\x73\x65\x73\x73\x69\x6f\x6e',
    action: '\x74\x69\x6d\x65\x72\x2d\x75\x70\x64\x61\x74\x65\x64',
    source,
    sessionMinutes: normalizedMinutes
  });
  await broadcastLockState();
}

function buildStateResponse(state) {
  const settings = getSettingsSnapshot(state);
  const lockoutUntil = readStateNumber(state, KEYS.lockoutUntil, DEFAULTS.lockoutUntil);
  const unlockUntil = readStateNumber(state, KEYS.unlockUntil, DEFAULTS.unlockUntil);

  return {
    ok: true,
    isLocked: !!state[KEYS.isLocked],
    autoLockMinutes: settings.autoLockMinutes,
    whitelist: settings.whitelist,
    failedAttempts: readStateNumber(state, KEYS.failedAttempts, DEFAULTS.failedAttempts),
    lockoutUntil,
    remainingMs: Math.max(0, lockoutUntil - now()),
    logCount: Array.isArray(state[KEYS.logs]) ? state[KEYS.logs].length : 0,
    maxAttempts: settings.maxAttempts,
    lockoutMinutes: settings.lockoutMinutes,
    unlockSessionMinutes: settings.unlockSessionMinutes,
    unlockUntil,
    unlockRemainingMs: Math.max(0, unlockUntil - now()),
    lockOnWindowBlur: settings.lockOnWindowBlur,
    requiresPasswordSetup: settings.requiresPasswordSetup,
    defaultRegionMode: settings.defaultRegionMode,
    maskPageIdentity: settings.maskPageIdentity,
    domainProfiles: settings.domainProfiles,
    requirePasswordOnDomainChange: settings.requirePasswordOnDomainChange,
    sessionAccessHosts: normalizeSessionAccessHosts(state[KEYS.sessionAccessHosts]),
    biometricConfigured: settings.biometricConfigured,
    biometricCreatedAt: settings.biometricCreatedAt
  };
}

function resolveUnlockSessionMinutes(settings, url, useDefaultSession, requestedMinutes) {
  if (!useDefaultSession) {
    return clampInteger(requestedMinutes, 0, 1440, settings.unlockSessionMinutes);
  }

  const matchedProfile = findMatchingProfileForUrl(url, settings.domainProfiles);
  if (matchedProfile && Number.isFinite(matchedProfile.unlockSessionMinutes)) {
    return matchedProfile.unlockSessionMinutes;
  }

  return settings.unlockSessionMinutes;
}

function pickConfigValue(config, key) {
  if (!isPlainObject(config)) return undefined;
  if (isPlainObject(config.settings) && key in config.settings) {
    return config.settings[key];
  }
  return key in config ? config[key] : undefined;
}

function normalizeImportedConfig(config) {
  if (!isPlainObject(config)) {
    throw new Error('\x54\x52\x41\x4e\x53\x4c\x41\x54\x45\x5f\x49\x4e\x56\x41\x4c\x49\x44\x5f\x43\x4f\x4e\x46\x49\x47');
  }

  const updates = {};
  let touched = false;

  const autoLockMinutes = pickConfigValue(config, '\x61\x75\x74\x6f\x4c\x6f\x63\x6b\x4d\x69\x6e\x75\x74\x65\x73');
  if (autoLockMinutes !== undefined) {
    updates[KEYS.autoLockMinutes] = clampInteger(autoLockMinutes, 1, 1440, DEFAULTS.autoLockMinutes);
    touched = true;
  }

  const whitelist = pickConfigValue(config, '\x77\x68\x69\x74\x65\x6c\x69\x73\x74');
  if (whitelist !== undefined) {
    updates[KEYS.whitelist] = normalizeWhitelist(whitelist);
    touched = true;
  }

  const maxAttempts = pickConfigValue(config, '\x6d\x61\x78\x41\x74\x74\x65\x6d\x70\x74\x73');
  if (maxAttempts !== undefined) {
    updates[KEYS.maxAttempts] = clampInteger(maxAttempts, 1, 20, DEFAULTS.maxAttempts);
    touched = true;
  }

  const lockoutMinutes = pickConfigValue(config, '\x6c\x6f\x63\x6b\x6f\x75\x74\x4d\x69\x6e\x75\x74\x65\x73');
  if (lockoutMinutes !== undefined) {
    updates[KEYS.lockoutMinutes] = clampInteger(lockoutMinutes, 1, 1440, DEFAULTS.lockoutMinutes);
    touched = true;
  }

  const unlockSessionMinutes = pickConfigValue(config, '\x75\x6e\x6c\x6f\x63\x6b\x53\x65\x73\x73\x69\x6f\x6e\x4d\x69\x6e\x75\x74\x65\x73');
  if (unlockSessionMinutes !== undefined) {
    updates[KEYS.unlockSessionMinutes] = clampInteger(unlockSessionMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes);
    touched = true;
  }

  const requirePasswordOnDomainChange = pickConfigValue(config, '\x72\x65\x71\x75\x69\x72\x65\x50\x61\x73\x73\x77\x6f\x72\x64\x4f\x6e\x44\x6f\x6d\x61\x69\x6e\x43\x68\x61\x6e\x67\x65');
  if (requirePasswordOnDomainChange !== undefined) {
    updates[KEYS.requirePasswordOnDomainChange] = !!requirePasswordOnDomainChange;
    touched = true;
  }

  const lockOnWindowBlur = pickConfigValue(config, '\x6c\x6f\x63\x6b\x4f\x6e\x57\x69\x6e\x64\x6f\x77\x42\x6c\x75\x72');
  if (lockOnWindowBlur !== undefined) {
    updates[KEYS.lockOnWindowBlur] = !!lockOnWindowBlur;
    touched = true;
  }

  const defaultRegionMode = pickConfigValue(config, '\x64\x65\x66\x61\x75\x6c\x74\x52\x65\x67\x69\x6f\x6e\x4d\x6f\x64\x65');
  if (defaultRegionMode !== undefined) {
    updates[KEYS.defaultRegionMode] = normalizeRegionMode(defaultRegionMode, DEFAULTS.defaultRegionMode);
    touched = true;
  }

  const maskPageIdentity = pickConfigValue(config, '\x6d\x61\x73\x6b\x50\x61\x67\x65\x49\x64\x65\x6e\x74\x69\x74\x79');
  if (maskPageIdentity !== undefined) {
    updates[KEYS.maskPageIdentity] = !!maskPageIdentity;
    touched = true;
  }

  const domainProfiles = pickConfigValue(config, '\x64\x6f\x6d\x61\x69\x6e\x50\x72\x6f\x66\x69\x6c\x65\x73');
  if (domainProfiles !== undefined) {
    updates[KEYS.domainProfiles] = normalizeDomainProfiles(domainProfiles);
    touched = true;
  }

  const blurRegionsByDomain = pickConfigValue(config, '\x62\x6c\x75\x72\x52\x65\x67\x69\x6f\x6e\x73\x42\x79\x44\x6f\x6d\x61\x69\x6e');
  if (blurRegionsByDomain !== undefined) {
    updates[KEYS.blurRegionsByDomain] = normalizeBlurRegionsByDomain(blurRegionsByDomain);
    touched = true;
  }

  if (updates[KEYS.requirePasswordOnDomainChange] === false) {
    updates[KEYS.sessionAccessHosts] = [];
  }

  if (!touched) {
    throw new Error('\x54\x52\x41\x4e\x53\x4c\x41\x54\x45\x5f\x4e\x4f\x5f\x49\x4d\x50\x4f\x52\x54\x5f\x46\x49\x45\x4c\x44\x53');
  }

  return updates;
}

function exportConfig(state) {
  const settings = getSettingsSnapshot(state);
  const exportedSettings = {
    autoLockMinutes: settings.autoLockMinutes,
    whitelist: settings.whitelist,
    maxAttempts: settings.maxAttempts,
    lockoutMinutes: settings.lockoutMinutes,
    unlockSessionMinutes: settings.unlockSessionMinutes,
    requirePasswordOnDomainChange: settings.requirePasswordOnDomainChange,
    lockOnWindowBlur: settings.lockOnWindowBlur,
    defaultRegionMode: settings.defaultRegionMode,
    maskPageIdentity: settings.maskPageIdentity,
    domainProfiles: settings.domainProfiles
  };

  return {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    settings: exportedSettings,
    blurRegionsByDomain: normalizeBlurRegionsByDomain(state[KEYS.blurRegionsByDomain])
  };
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureInitialized();
  const state = await getState();
  if (readStateBoolean(state, KEYS.requiresPasswordSetup, DEFAULTS.requiresPasswordSetup)) {
    await setState({ [KEYS.isLocked]: false });
    await chrome.runtime.openOptionsPage();
    await broadcastLockState();
    return;
  }
  await lockNow('\x73\x74\x61\x72\x74\x75\x70');
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureInitialized();
  const state = await getState();
  if (readStateBoolean(state, KEYS.requiresPasswordSetup, DEFAULTS.requiresPasswordSetup)) {
    await setState({ [KEYS.isLocked]: false });
    await broadcastLockState();
    return;
  }
  await lockNow('\x73\x74\x61\x72\x74\x75\x70');
});

chrome.idle.setDetectionInterval(60);

chrome.idle.onStateChanged.addListener(async (idleState) => {
  const current = await getState();
  const minutes = clampInteger(current[KEYS.autoLockMinutes], 1, 1440, DEFAULTS.autoLockMinutes);

  if (idleState === '\x69\x64\x6c\x65' || idleState === '\x6c\x6f\x63\x6b\x65\x64') {
    chrome.alarms.create(ALARMS.autoLock, { delayInMinutes: minutes });
    return;
  }

  if (idleState === '\x61\x63\x74\x69\x76\x65') {
    chrome.alarms.clear(ALARMS.autoLock);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    cancelScheduledWindowBlurLock();
    return;
  }

  scheduleWindowBlurLockCheck();
});

chrome.windows.onBoundsChanged.addListener(async (window) => {
  if (!window || window.state !== '\x6d\x69\x6e\x69\x6d\x69\x7a\x65\x64') return;
  if (window.type && window.type !== '\x6e\x6f\x72\x6d\x61\x6c') return;

  await ensureInitialized();
  const state = await getState();
  if (!readStateBoolean(state, KEYS.lockOnWindowBlur, DEFAULTS.lockOnWindowBlur)) return;
  if (state[KEYS.isLocked]) return;

  await lockNow('\x77\x69\x6e\x64\x6f\x77\x2d\x6d\x69\x6e\x69\x6d\x69\x7a\x65\x64', { windowId: window.id || null });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.autoLock) {
    await lockNow('\x69\x64\x6c\x65\x2d\x74\x69\x6d\x65\x6f\x75\x74');
    return;
  }

  if (alarm.name === ALARMS.sessionRelock) {
    await lockNow('\x73\x65\x73\x73\x69\x6f\x6e\x2d\x65\x78\x70\x69\x72\x65\x64');
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === '\x70\x61\x6e\x69\x63\x2d\x6c\x6f\x63\x6b') {
    await lockNow('\x70\x61\x6e\x69\x63\x2d\x68\x6f\x74\x6b\x65\x79');
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    await ensureInitialized();
    const state = await getState();
    const settings = getSettingsSnapshot(state);
    const lockoutUntil = readStateNumber(state, KEYS.lockoutUntil, DEFAULTS.lockoutUntil);
    const remainingMs = Math.max(0, lockoutUntil - now());

    if (message.type === '\x47\x45\x54\x5f\x53\x54\x41\x54\x45') {
      sendResponse(buildStateResponse(state));
      return;
    }

    if (message.type === '\x47\x45\x54\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x43\x4f\x4e\x54\x45\x58\x54') {
      const request = await getPendingBiometricRequestById(message.requestId, state);
      if (!request) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x72\x65\x71\x75\x65\x73\x74\x5f\x6d\x69\x73\x73\x69\x6e\x67') });
        return;
      }

      sendResponse({
        ok: true,
        request,
        credential: hasBiometricCredential(state)
          ? {
              credentialId: state[KEYS.biometricCredentialId],
              transports: normalizeBiometricTransports(state[KEYS.biometricTransports])
            }
          : null,
        extensionOrigin: getExtensionOrigin(),
        rpId: chrome.runtime.id
      });
      return;
    }

    if (message.type === '\x42\x45\x47\x49\x4e\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x53\x45\x54\x55\x50') {
      try {
        await beginBiometricSetup();
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x75\x6e\x65\x78\x70\x65\x63\x74\x65\x64') });
      }
      return;
    }

    if (message.type === '\x42\x45\x47\x49\x4e\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x55\x4e\x4c\x4f\x43\x4b') {
      try {
        await beginBiometricUnlock(
          sender,
          message.url || sender?.url || '',
          !!message.pageOnly,
          !!message.useDefaultSession,
          message.sessionMinutes
        );
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x75\x6e\x65\x78\x70\x65\x63\x74\x65\x64') });
      }
      return;
    }

    if (message.type === '\x43\x4f\x4d\x50\x4c\x45\x54\x45\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x53\x45\x54\x55\x50') {
      try {
        await completeBiometricSetup(message);
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x75\x6e\x65\x78\x70\x65\x63\x74\x65\x64') });
      }
      return;
    }

    if (message.type === '\x43\x4f\x4d\x50\x4c\x45\x54\x45\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x55\x4e\x4c\x4f\x43\x4b') {
      try {
        await completeBiometricUnlock(message);
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x75\x6e\x65\x78\x70\x65\x63\x74\x65\x64') });
      }
      return;
    }

    if (message.type === '\x43\x41\x4e\x43\x45\x4c\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x52\x45\x51\x55\x45\x53\x54') {
      await cancelBiometricRequest(
        String(message.requestId || '').trim(),
        String(message.error || '').trim()
      );
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x52\x45\x4d\x4f\x56\x45\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x43\x52\x45\x44\x45\x4e\x54\x49\x41\x4c') {
      await setState({
        [KEYS.biometricCredentialId]: '',
        [KEYS.biometricPublicKey]: '',
        [KEYS.biometricAlgorithm]: DEFAULTS.biometricAlgorithm,
        [KEYS.biometricTransports]: [],
        [KEYS.biometricCreatedAt]: 0,
        [KEYS.pendingBiometricRequest]: null
      });
      await appendLog({ type: '\x73\x65\x63\x75\x72\x69\x74\x79', action: '\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x72\x65\x6d\x6f\x76\x65\x64' });
      await broadcastLockState();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x4c\x4f\x43\x4b\x5f\x4e\x4f\x57') {
      await lockNow(message.reason || '\x6d\x61\x6e\x75\x61\x6c');
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x53\x45\x54\x5f\x55\x4e\x4c\x4f\x43\x4b\x5f\x54\x49\x4d\x45\x52') {
      await setUnlockTimer(message.sessionMinutes, message.source || '\x70\x6f\x70\x75\x70\x2d\x73\x65\x73\x73\x69\x6f\x6e');
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x47\x45\x54\x5f\x4c\x4f\x47\x53') {
      sendResponse({ ok: true, logs: Array.isArray(state[KEYS.logs]) ? state[KEYS.logs] : [] });
      return;
    }

    if (message.type === '\x43\x4c\x45\x41\x52\x5f\x4c\x4f\x47\x53') {
      await setState({ [KEYS.logs]: [] });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x45\x58\x50\x4f\x52\x54\x5f\x43\x4f\x4e\x46\x49\x47') {
      sendResponse({ ok: true, config: exportConfig(state) });
      return;
    }

    if (message.type === '\x49\x4d\x50\x4f\x52\x54\x5f\x43\x4f\x4e\x46\x49\x47') {
      const updates = normalizeImportedConfig(message.config);

      if (KEYS.maxAttempts in updates) {
        updates[KEYS.failedAttempts] = Math.min(
          readStateNumber(state, KEYS.failedAttempts, DEFAULTS.failedAttempts),
          updates[KEYS.maxAttempts]
        );
      }

      await setState(updates);
      await appendLog({ type: '\x73\x65\x74\x74\x69\x6e\x67\x73', action: '\x63\x6f\x6e\x66\x69\x67\x2d\x69\x6d\x70\x6f\x72\x74\x65\x64' });
      await broadcastLockState();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x47\x45\x54\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x53\x5f\x46\x4f\x52\x5f\x55\x52\x4c') {
      const domainKey = getBlurDomainKey(message.url || sender?.url || '');
      const blurMap = normalizeBlurRegionsByDomain(state[KEYS.blurRegionsByDomain]);
      sendResponse({
        ok: true,
        domainKey,
        regions: domainKey ? (blurMap[domainKey] || []) : []
      });
      return;
    }

    if (message.type === '\x53\x41\x56\x45\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x53\x5f\x46\x4f\x52\x5f\x55\x52\x4c') {
      const domainKey = getBlurDomainKey(message.url || sender?.url || '');
      if (!domainKey) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x63\x75\x72\x72\x65\x6e\x74\x5f\x64\x6f\x6d\x61\x69\x6e\x5f\x75\x6e\x6b\x6e\x6f\x77\x6e') });
        return;
      }

      const blurMap = normalizeBlurRegionsByDomain(state[KEYS.blurRegionsByDomain]);
      const regions = normalizeBlurRegions(message.regions);

      if (regions.length > 0) {
        blurMap[domainKey] = regions;
      } else {
        delete blurMap[domainKey];
      }

      await setState({ [KEYS.blurRegionsByDomain]: blurMap });
      sendResponse({ ok: true, count: regions.length, domainKey });
      return;
    }

    if (message.type === '\x52\x45\x50\x4f\x52\x54\x5f\x54\x41\x4d\x50\x45\x52') {
      await appendLog({
        type: '\x74\x61\x6d\x70\x65\x72',
        action: String(message.action || '\x75\x6e\x6b\x6e\x6f\x77\x6e'),
        url: safeUrlForLog(message.url || sender?.url || ''),
        meta: isPlainObject(message.meta) ? message.meta : {}
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x53\x41\x56\x45\x5f\x53\x45\x54\x54\x49\x4e\x47\x53') {
      const updates = {
        [KEYS.whitelist]: normalizeWhitelist(message.whitelist),
        [KEYS.autoLockMinutes]: clampInteger(message.autoLockMinutes, 1, 1440, DEFAULTS.autoLockMinutes),
        [KEYS.maxAttempts]: clampInteger(message.maxAttempts, 1, 20, DEFAULTS.maxAttempts),
        [KEYS.lockoutMinutes]: clampInteger(message.lockoutMinutes, 1, 1440, DEFAULTS.lockoutMinutes),
        [KEYS.unlockSessionMinutes]: clampInteger(message.unlockSessionMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes),
        [KEYS.requirePasswordOnDomainChange]: !!message.requirePasswordOnDomainChange,
        [KEYS.lockOnWindowBlur]: !!message.lockOnWindowBlur,
        [KEYS.defaultRegionMode]: normalizeRegionMode(message.defaultRegionMode, DEFAULTS.defaultRegionMode),
        [KEYS.maskPageIdentity]: !!message.maskPageIdentity,
        [KEYS.domainProfiles]: normalizeDomainProfiles(message.domainProfiles)
      };

      if (!updates[KEYS.requirePasswordOnDomainChange]) {
        updates[KEYS.sessionAccessHosts] = [];
      }

      updates[KEYS.failedAttempts] = Math.min(
        readStateNumber(state, KEYS.failedAttempts, DEFAULTS.failedAttempts),
        updates[KEYS.maxAttempts]
      );

      await setState(updates);
      await appendLog({ type: '\x73\x65\x74\x74\x69\x6e\x67\x73', action: '\x73\x61\x76\x65\x2d\x73\x65\x74\x74\x69\x6e\x67\x73' });
      await broadcastLockState();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x53\x45\x54\x5f\x44\x45\x46\x41\x55\x4c\x54\x5f\x52\x45\x47\x49\x4f\x4e\x5f\x4d\x4f\x44\x45') {
      const nextMode = normalizeRegionMode(message.mode, settings.defaultRegionMode);
      await setState({ [KEYS.defaultRegionMode]: nextMode });
      await appendLog({ type: '\x70\x72\x69\x76\x61\x63\x79', action: '\x64\x65\x66\x61\x75\x6c\x74\x2d\x72\x65\x67\x69\x6f\x6e\x2d\x6d\x6f\x64\x65', meta: { mode: nextMode } });
      await broadcastLockState();
      sendResponse({ ok: true, mode: nextMode });
      return;
    }

    if (message.type === '\x53\x45\x54\x5f\x49\x4e\x49\x54\x49\x41\x4c\x5f\x50\x41\x53\x53\x57\x4f\x52\x44') {
      if (!settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x70\x61\x73\x73\x77\x6f\x72\x64\x5f\x61\x6c\x72\x65\x61\x64\x79\x5f\x73\x65\x74\x75\x70') });
        return;
      }

      const newPassword = String(message.newPassword || '');
      if (newPassword.length < 6) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x70\x61\x73\x73\x77\x6f\x72\x64\x5f\x74\x6f\x6f\x5f\x73\x68\x6f\x72\x74') });
        return;
      }

      const newSalt = toBase64(randomBytes(16));
      const iterations = DEFAULTS.passwordIterations;
      const newHash = await derivePasswordHash(newPassword, newSalt, iterations);

      await setState({
        [KEYS.passwordSalt]: newSalt,
        [KEYS.passwordIterations]: iterations,
        [KEYS.passwordHash]: newHash,
        [KEYS.requiresPasswordSetup]: false,
        [KEYS.failedAttempts]: 0,
        [KEYS.lockoutUntil]: 0
      });
      await appendLog({ type: '\x73\x65\x63\x75\x72\x69\x74\x79', action: '\x70\x61\x73\x73\x77\x6f\x72\x64\x2d\x69\x6e\x69\x74\x69\x61\x6c\x69\x7a\x65\x64' });

      const requestedSessionMinutes = resolveUnlockSessionMinutes(
        settings,
        message.url || sender?.url || '',
        !!message.useDefaultSession,
        message.sessionMinutes
      );

      await unlockNow(
        state,
        '\x69\x6e\x69\x74\x69\x61\x6c\x2d\x73\x65\x74\x75\x70',
        message.url || sender?.url || '',
        requestedSessionMinutes,
        settings.requirePasswordOnDomainChange
      );
      sendResponse({ ok: true, success: true });
      return;
    }

    if (message.type === '\x56\x45\x52\x49\x46\x59\x5f\x50\x41\x53\x53\x57\x4f\x52\x44\x5f\x4f\x4e\x4c\x59') {
      if (settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x66\x69\x72\x73\x74\x5f\x73\x65\x74\x75\x70\x5f\x62\x65\x66\x6f\x72\x65\x5f\x75\x6e\x6c\x6f\x63\x6b') });
        return;
      }

      const matchedProfile = findMatchingProfileForUrl(
        message.url || sender?.url || '',
        settings.domainProfiles
      );
      const effectivePageUnlockMinutes = resolvePageUnlockMinutes(
        matchedProfile,
        settings.unlockSessionMinutes
      );

      const response = await verifyPasswordOnly(
        state,
        settings,
        message.password,
        message.url || sender?.url || '',
        {
          profileId: matchedProfile?.id || '',
          profileName: matchedProfile?.name || '',
          pageUnlockMinutes: effectivePageUnlockMinutes
        }
      );

      if (response?.success) {
        response.profileId = matchedProfile?.id || '';
        response.profileName = matchedProfile?.name || '';
        response.pageUnlockMinutes = effectivePageUnlockMinutes;
      }

      sendResponse(response);
      return;
    }

    if (message.type === '\x43\x48\x41\x4e\x47\x45\x5f\x50\x41\x53\x53\x57\x4f\x52\x44') {
      if (settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x66\x69\x72\x73\x74\x5f\x73\x65\x74\x75\x70\x5f\x72\x65\x71\x75\x69\x72\x65\x64') });
        return;
      }

      const currentHash = await derivePasswordHash(
        String(message.oldPassword || ''),
        state[KEYS.passwordSalt],
        readStateNumber(state, KEYS.passwordIterations, DEFAULTS.passwordIterations)
      );

      if (currentHash !== state[KEYS.passwordHash]) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x6f\x6c\x64\x5f\x70\x61\x73\x73\x77\x6f\x72\x64\x5f\x77\x72\x6f\x6e\x67') });
        return;
      }

      const newSalt = toBase64(randomBytes(16));
      const iterations = DEFAULTS.passwordIterations;
      const newHash = await derivePasswordHash(String(message.newPassword || ''), newSalt, iterations);

      await setState({
        [KEYS.passwordSalt]: newSalt,
        [KEYS.passwordIterations]: iterations,
        [KEYS.passwordHash]: newHash,
        [KEYS.failedAttempts]: 0,
        [KEYS.lockoutUntil]: 0,
        [KEYS.requiresPasswordSetup]: false
      });
      await appendLog({ type: '\x73\x65\x63\x75\x72\x69\x74\x79', action: '\x70\x61\x73\x73\x77\x6f\x72\x64\x2d\x63\x68\x61\x6e\x67\x65\x64' });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === '\x55\x4e\x4c\x4f\x43\x4b\x5f\x57\x49\x54\x48\x5f\x50\x41\x53\x53\x57\x4f\x52\x44') {
      if (settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x66\x69\x72\x73\x74\x5f\x73\x65\x74\x75\x70\x5f\x62\x65\x66\x6f\x72\x65\x5f\x75\x6e\x6c\x6f\x63\x6b') });
        return;
      }

      if (remainingMs > 0) {
        sendResponse({
          ok: true,
          success: false,
          error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x74\x65\x6d\x70\x5f\x6c\x6f\x63\x6b\x65\x64'),
          remainingMs
        });
        return;
      }

      const submitted = await derivePasswordHash(
        String(message.password || ''),
        state[KEYS.passwordSalt],
        readStateNumber(state, KEYS.passwordIterations, DEFAULTS.passwordIterations)
      );

      if (submitted === state[KEYS.passwordHash]) {
        const requestedSessionMinutes = resolveUnlockSessionMinutes(
          settings,
          message.url || sender?.url || '',
          !!message.useDefaultSession,
          message.sessionMinutes
        );

        await unlockNow(
          state,
          '\x70\x61\x73\x73\x77\x6f\x72\x64',
          message.url || sender?.url || '',
          requestedSessionMinutes,
          settings.requirePasswordOnDomainChange
        );
        sendResponse({
          ok: true,
          success: true,
          sessionMinutes: requestedSessionMinutes,
          unlockUntil: requestedSessionMinutes > 0 ? now() + (requestedSessionMinutes * 60 * 1000) : 0
        });
        return;
      }

      sendResponse(await handleFailedPasswordAttempt(
        state,
        settings,
        message.url || sender?.url || '',
        { source: '\x67\x6c\x6f\x62\x61\x6c\x2d\x75\x6e\x6c\x6f\x63\x6b' }
      ));
      return;
    }

    sendResponse({ ok: false, error: await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x75\x6e\x6b\x6e\x6f\x77\x6e\x5f\x6d\x65\x73\x73\x61\x67\x65') });
  })().catch(async (error) => {
    const message = error?.message || '';
    const normalized = message === '\x54\x52\x41\x4e\x53\x4c\x41\x54\x45\x5f\x49\x4e\x56\x41\x4c\x49\x44\x5f\x43\x4f\x4e\x46\x49\x47'
      ? await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x69\x6e\x76\x61\x6c\x69\x64\x5f\x63\x6f\x6e\x66\x69\x67\x5f\x66\x69\x6c\x65')
      : message === '\x54\x52\x41\x4e\x53\x4c\x41\x54\x45\x5f\x4e\x4f\x5f\x49\x4d\x50\x4f\x52\x54\x5f\x46\x49\x45\x4c\x44\x53'
          ? await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x6e\x6f\x5f\x69\x6d\x70\x6f\x72\x74\x5f\x66\x69\x65\x6c\x64\x73')
          : (message || await tr('\x62\x61\x63\x6b\x67\x72\x6f\x75\x6e\x64\x2e\x65\x72\x72\x6f\x72\x2e\x75\x6e\x65\x78\x70\x65\x63\x74\x65\x64'));
    sendResponse({ ok: false, error: normalized });
  });

  return true;
});
