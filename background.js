if (typeof importScripts === 'function') {
  importScripts('i18n.js');
}

const KEYS = {
  isLocked: 'isLocked',
  passwordHash: 'passwordHash',
  passwordSalt: 'passwordSalt',
  passwordIterations: 'passwordIterations',
  requiresPasswordSetup: 'requiresPasswordSetup',
  autoLockMinutes: 'autoLockMinutes',
  whitelist: 'whitelist',
  failedAttempts: 'failedAttempts',
  lockoutUntil: 'lockoutUntil',
  logs: 'logs',
  settingsVersion: 'settingsVersion',
  maxAttempts: 'maxAttempts',
  lockoutMinutes: 'lockoutMinutes',
  unlockSessionMinutes: 'unlockSessionMinutes',
  unlockUntil: 'unlockUntil',
  lockOnWindowBlur: 'lockOnWindowBlur',
  blurRegionsByDomain: 'blurRegionsByDomain',
  defaultRegionMode: 'defaultRegionMode',
  maskPageIdentity: 'maskPageIdentity',
  domainProfiles: 'domainProfiles',
  requirePasswordOnDomainChange: 'requirePasswordOnDomainChange',
  sessionAccessHosts: 'sessionAccessHosts'
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
  defaultRegionMode: 'blur',
  maskPageIdentity: false,
  domainProfiles: [],
  requirePasswordOnDomainChange: true,
  sessionAccessHosts: [],
  logs: [],
  settingsVersion: 8,
  whitelist: [
    'domain:mail.google.com',
    'domain:calendar.google.com',
    'pattern:https://chatgpt.com/*'
  ]
};

const REGION_MODES = ['blur', 'blackout', 'pixelate'];

const ALARMS = {
  autoLock: 'auto-lock',
  sessionRelock: 'session-relock'
};

function now() {
  return Date.now();
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

    if (normalized.startsWith('domain:')) {
      const domain = normalized.slice(7).trim().toLowerCase();
      return url.hostname.toLowerCase() === domain || url.hostname.toLowerCase().endsWith(`.${domain}`);
    }

    if (normalized.startsWith('host:')) {
      return url.hostname.toLowerCase() === normalized.slice(5).trim().toLowerCase();
    }

    if (normalized.startsWith('pattern:')) {
      return wildcardToRegex(normalized.slice(8).trim()).test(href);
    }

    if (normalized.startsWith('regex:')) {
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
  return typeof state[key] === 'boolean' ? state[key] : fallback;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeDomainProfile(profile, index = 0) {
  if (!isPlainObject(profile)) return null;

  const match = String(profile.match || profile.rule || profile.pattern || '').trim();
  if (!match) return null;

  const forceLock = !!profile.forceLock;

  return {
    id: typeof profile.id === 'string' && profile.id.trim()
      ? profile.id.trim()
      : `profile-${index}-${crypto.randomUUID()}`,
    name: typeof profile.name === 'string' && profile.name.trim()
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
    id: typeof region.id === 'string' && region.id.trim()
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
    )
  };
}

function getState() {
  return chrome.storage.local.get(Object.values(KEYS));
}

function setState(partial) {
  return chrome.storage.local.set(partial);
}

async function derivePasswordHash(password, saltBase64, iterations) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltBase64),
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return toBase64(new Uint8Array(bits));
}

async function ensureInitialized() {
  const state = await getState();
  const updates = {};
  const hasPassword = typeof state[KEYS.passwordHash] === 'string' && state[KEYS.passwordHash];
  const hasSalt = typeof state[KEYS.passwordSalt] === 'string' && state[KEYS.passwordSalt];

  if (typeof state[KEYS.isLocked] !== 'boolean') updates[KEYS.isLocked] = true;
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
  if (typeof state[KEYS.lockOnWindowBlur] !== 'boolean') updates[KEYS.lockOnWindowBlur] = DEFAULTS.lockOnWindowBlur;
  if (!REGION_MODES.includes(String(state[KEYS.defaultRegionMode] || '').trim().toLowerCase())) {
    updates[KEYS.defaultRegionMode] = DEFAULTS.defaultRegionMode;
  }
  if (typeof state[KEYS.maskPageIdentity] !== 'boolean') {
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
  if (typeof state[KEYS.requirePasswordOnDomainChange] !== 'boolean') {
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

  await chrome.storage.local.remove('closeOnLockout');
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
  return tabs.filter((tab) => tab.id && typeof tab.url === 'string' && /^https?:/i.test(tab.url));
}

async function broadcastLockState() {
  const state = await getState();
  const settings = getSettingsSnapshot(state);
  const sessionAccessHosts = normalizeSessionAccessHosts(state[KEYS.sessionAccessHosts]);
  const tabs = getEligibleTabs(await chrome.tabs.query({}));

  await Promise.allSettled(
    tabs.map((tab) => chrome.tabs.sendMessage(tab.id, {
      type: 'LOCK_STATE_CHANGED',
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

async function lockNow(reason = 'manual', meta = {}) {
  await syncSessionAlarm(0);
  await setState({
    [KEYS.isLocked]: true,
    [KEYS.unlockUntil]: 0,
    [KEYS.sessionAccessHosts]: []
  });
  await appendLog({ type: 'lock', reason, meta });
  await broadcastLockState();
}

async function unlockNow(state, source = 'password', tabUrl = '', sessionMinutes = 0, requirePasswordOnDomainChange = DEFAULTS.requirePasswordOnDomainChange) {
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
    type: 'unlock',
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
    error: await tr('background.error.wrong_password'),
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
      error: await tr('background.error.lockout_activated'),
      failedAttempts: settings.maxAttempts,
      maxAttempts: settings.maxAttempts,
      remainingMs: until - now()
    };
  }

  await setState(updates);
  await appendLog({
    type: 'security',
    action: 'failed-unlock',
    url: safeUrlForLog(url),
    meta
  });

  if (failedAttempts >= settings.maxAttempts) {
    await appendLog({
      type: 'security',
      action: 'lockout-activated',
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
      error: await tr('background.error.temp_locked'),
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
    type: 'unlock',
    source: 'profile-auth',
    url: safeUrlForLog(tabUrl),
    meta
  });

  return { ok: true, success: true };
}

async function setUnlockTimer(sessionMinutes, source = 'popup-session') {
  const state = await getState();
  if (state[KEYS.isLocked]) {
    throw new Error(await tr('background.error.must_unlock_first'));
  }

  const normalizedMinutes = clampInteger(sessionMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes);
  const unlockUntil = normalizedMinutes > 0 ? now() + (normalizedMinutes * 60 * 1000) : 0;

  await setState({ [KEYS.unlockUntil]: unlockUntil });
  await syncSessionAlarm(unlockUntil);
  await appendLog({
    type: 'session',
    action: 'timer-updated',
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
    sessionAccessHosts: normalizeSessionAccessHosts(state[KEYS.sessionAccessHosts])
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
    throw new Error('TRANSLATE_INVALID_CONFIG');
  }

  const updates = {};
  let touched = false;

  const autoLockMinutes = pickConfigValue(config, 'autoLockMinutes');
  if (autoLockMinutes !== undefined) {
    updates[KEYS.autoLockMinutes] = clampInteger(autoLockMinutes, 1, 1440, DEFAULTS.autoLockMinutes);
    touched = true;
  }

  const whitelist = pickConfigValue(config, 'whitelist');
  if (whitelist !== undefined) {
    updates[KEYS.whitelist] = normalizeWhitelist(whitelist);
    touched = true;
  }

  const maxAttempts = pickConfigValue(config, 'maxAttempts');
  if (maxAttempts !== undefined) {
    updates[KEYS.maxAttempts] = clampInteger(maxAttempts, 1, 20, DEFAULTS.maxAttempts);
    touched = true;
  }

  const lockoutMinutes = pickConfigValue(config, 'lockoutMinutes');
  if (lockoutMinutes !== undefined) {
    updates[KEYS.lockoutMinutes] = clampInteger(lockoutMinutes, 1, 1440, DEFAULTS.lockoutMinutes);
    touched = true;
  }

  const unlockSessionMinutes = pickConfigValue(config, 'unlockSessionMinutes');
  if (unlockSessionMinutes !== undefined) {
    updates[KEYS.unlockSessionMinutes] = clampInteger(unlockSessionMinutes, 0, 1440, DEFAULTS.unlockSessionMinutes);
    touched = true;
  }

  const requirePasswordOnDomainChange = pickConfigValue(config, 'requirePasswordOnDomainChange');
  if (requirePasswordOnDomainChange !== undefined) {
    updates[KEYS.requirePasswordOnDomainChange] = !!requirePasswordOnDomainChange;
    touched = true;
  }

  const lockOnWindowBlur = pickConfigValue(config, 'lockOnWindowBlur');
  if (lockOnWindowBlur !== undefined) {
    updates[KEYS.lockOnWindowBlur] = !!lockOnWindowBlur;
    touched = true;
  }

  const defaultRegionMode = pickConfigValue(config, 'defaultRegionMode');
  if (defaultRegionMode !== undefined) {
    updates[KEYS.defaultRegionMode] = normalizeRegionMode(defaultRegionMode, DEFAULTS.defaultRegionMode);
    touched = true;
  }

  const maskPageIdentity = pickConfigValue(config, 'maskPageIdentity');
  if (maskPageIdentity !== undefined) {
    updates[KEYS.maskPageIdentity] = !!maskPageIdentity;
    touched = true;
  }

  const domainProfiles = pickConfigValue(config, 'domainProfiles');
  if (domainProfiles !== undefined) {
    updates[KEYS.domainProfiles] = normalizeDomainProfiles(domainProfiles);
    touched = true;
  }

  const blurRegionsByDomain = pickConfigValue(config, 'blurRegionsByDomain');
  if (blurRegionsByDomain !== undefined) {
    updates[KEYS.blurRegionsByDomain] = normalizeBlurRegionsByDomain(blurRegionsByDomain);
    touched = true;
  }

  if (updates[KEYS.requirePasswordOnDomainChange] === false) {
    updates[KEYS.sessionAccessHosts] = [];
  }

  if (!touched) {
    throw new Error('TRANSLATE_NO_IMPORT_FIELDS');
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
  await lockNow('startup');
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureInitialized();
  await lockNow('startup');
});

chrome.idle.setDetectionInterval(60);

chrome.idle.onStateChanged.addListener(async (idleState) => {
  const current = await getState();
  const minutes = clampInteger(current[KEYS.autoLockMinutes], 1, 1440, DEFAULTS.autoLockMinutes);

  if (idleState === 'idle' || idleState === 'locked') {
    chrome.alarms.create(ALARMS.autoLock, { delayInMinutes: minutes });
    return;
  }

  if (idleState === 'active') {
    chrome.alarms.clear(ALARMS.autoLock);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) return;

  await ensureInitialized();
  const state = await getState();
  if (!readStateBoolean(state, KEYS.lockOnWindowBlur, DEFAULTS.lockOnWindowBlur)) return;
  if (state[KEYS.isLocked]) return;

  await lockNow('window-blur');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARMS.autoLock) {
    await lockNow('idle-timeout');
    return;
  }

  if (alarm.name === ALARMS.sessionRelock) {
    await lockNow('session-expired');
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'panic-lock') {
    await lockNow('panic-hotkey');
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    await ensureInitialized();
    const state = await getState();
    const settings = getSettingsSnapshot(state);
    const lockoutUntil = readStateNumber(state, KEYS.lockoutUntil, DEFAULTS.lockoutUntil);
    const remainingMs = Math.max(0, lockoutUntil - now());

    if (message.type === 'GET_STATE') {
      sendResponse(buildStateResponse(state));
      return;
    }

    if (message.type === 'LOCK_NOW') {
      await lockNow(message.reason || 'manual');
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'SET_UNLOCK_TIMER') {
      await setUnlockTimer(message.sessionMinutes, message.source || 'popup-session');
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'GET_LOGS') {
      sendResponse({ ok: true, logs: Array.isArray(state[KEYS.logs]) ? state[KEYS.logs] : [] });
      return;
    }

    if (message.type === 'CLEAR_LOGS') {
      await setState({ [KEYS.logs]: [] });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'EXPORT_CONFIG') {
      sendResponse({ ok: true, config: exportConfig(state) });
      return;
    }

    if (message.type === 'IMPORT_CONFIG') {
      const updates = normalizeImportedConfig(message.config);

      if (KEYS.maxAttempts in updates) {
        updates[KEYS.failedAttempts] = Math.min(
          readStateNumber(state, KEYS.failedAttempts, DEFAULTS.failedAttempts),
          updates[KEYS.maxAttempts]
        );
      }

      await setState(updates);
      await appendLog({ type: 'settings', action: 'config-imported' });
      await broadcastLockState();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'GET_BLUR_REGIONS_FOR_URL') {
      const domainKey = getBlurDomainKey(message.url || sender?.url || '');
      const blurMap = normalizeBlurRegionsByDomain(state[KEYS.blurRegionsByDomain]);
      sendResponse({
        ok: true,
        domainKey,
        regions: domainKey ? (blurMap[domainKey] || []) : []
      });
      return;
    }

    if (message.type === 'SAVE_BLUR_REGIONS_FOR_URL') {
      const domainKey = getBlurDomainKey(message.url || sender?.url || '');
      if (!domainKey) {
        sendResponse({ ok: false, error: await tr('background.error.current_domain_unknown') });
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

    if (message.type === 'REPORT_TAMPER') {
      await appendLog({
        type: 'tamper',
        action: String(message.action || 'unknown'),
        url: safeUrlForLog(message.url || sender?.url || ''),
        meta: isPlainObject(message.meta) ? message.meta : {}
      });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'SAVE_SETTINGS') {
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
      await appendLog({ type: 'settings', action: 'save-settings' });
      await broadcastLockState();
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'SET_DEFAULT_REGION_MODE') {
      const nextMode = normalizeRegionMode(message.mode, settings.defaultRegionMode);
      await setState({ [KEYS.defaultRegionMode]: nextMode });
      await appendLog({ type: 'privacy', action: 'default-region-mode', meta: { mode: nextMode } });
      await broadcastLockState();
      sendResponse({ ok: true, mode: nextMode });
      return;
    }

    if (message.type === 'SET_INITIAL_PASSWORD') {
      if (!settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('background.error.password_already_setup') });
        return;
      }

      const newPassword = String(message.newPassword || '');
      if (newPassword.length < 6) {
        sendResponse({ ok: false, error: await tr('background.error.password_too_short') });
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
      await appendLog({ type: 'security', action: 'password-initialized' });

      const requestedSessionMinutes = resolveUnlockSessionMinutes(
        settings,
        message.url || sender?.url || '',
        !!message.useDefaultSession,
        message.sessionMinutes
      );

      await unlockNow(
        state,
        'initial-setup',
        message.url || sender?.url || '',
        requestedSessionMinutes,
        settings.requirePasswordOnDomainChange
      );
      sendResponse({ ok: true, success: true });
      return;
    }

    if (message.type === 'VERIFY_PASSWORD_ONLY') {
      if (settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('background.error.first_setup_before_unlock') });
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

    if (message.type === 'CHANGE_PASSWORD') {
      if (settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('background.error.first_setup_required') });
        return;
      }

      const currentHash = await derivePasswordHash(
        String(message.oldPassword || ''),
        state[KEYS.passwordSalt],
        readStateNumber(state, KEYS.passwordIterations, DEFAULTS.passwordIterations)
      );

      if (currentHash !== state[KEYS.passwordHash]) {
        sendResponse({ ok: false, error: await tr('background.error.old_password_wrong') });
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
      await appendLog({ type: 'security', action: 'password-changed' });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'UNLOCK_WITH_PASSWORD') {
      if (settings.requiresPasswordSetup) {
        sendResponse({ ok: false, error: await tr('background.error.first_setup_before_unlock') });
        return;
      }

      if (remainingMs > 0) {
        sendResponse({
          ok: true,
          success: false,
          error: await tr('background.error.temp_locked'),
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
          'password',
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
        { source: 'global-unlock' }
      ));
      return;
    }

    sendResponse({ ok: false, error: await tr('background.error.unknown_message') });
  })().catch(async (error) => {
    const message = error?.message || '';
    const normalized = message === 'TRANSLATE_INVALID_CONFIG'
      ? await tr('background.error.invalid_config_file')
      : message === 'TRANSLATE_NO_IMPORT_FIELDS'
          ? await tr('background.error.no_import_fields')
          : (message || await tr('background.error.unexpected'));
    sendResponse({ ok: false, error: normalized });
  });

  return true;
});
