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
  sessionAccessHosts: 'sessionAccessHosts',
  biometricCredentialId: 'biometricCredentialId',
  biometricPublicKey: 'biometricPublicKey',
  biometricAlgorithm: 'biometricAlgorithm',
  biometricTransports: 'biometricTransports',
  biometricCreatedAt: 'biometricCreatedAt',
  pendingBiometricRequest: 'pendingBiometricRequest'
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
  biometricCredentialId: '',
  biometricPublicKey: '',
  biometricAlgorithm: -7,
  biometricTransports: [],
  biometricCreatedAt: 0,
  pendingBiometricRequest: null,
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

const BIOMETRIC_REQUEST_TTL_MS = 10 * 60 * 1000;
const MAX_PENDING_BIOMETRIC_REQUESTS = 8;
const BIOMETRIC_ALGORITHMS = Object.freeze({
  ES256: -7,
  RS256: -257
});

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

function toBase64Url(bytes) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
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

function normalizeBiometricTransports(transports) {
  if (!Array.isArray(transports)) return [];

  const allowed = new Set(['ble', 'hybrid', 'internal', 'nfc', 'usb']);
  return [...new Set(
    transports
      .map((transport) => String(transport || '').trim().toLowerCase())
      .filter((transport) => allowed.has(transport))
  )];
}

function hasBiometricCredential(state) {
  return typeof state[KEYS.biometricCredentialId] === 'string'
    && !!state[KEYS.biometricCredentialId]
    && typeof state[KEYS.biometricPublicKey] === 'string'
    && !!state[KEYS.biometricPublicKey];
}

function isSupportedBiometricAlgorithm(value) {
  return value === BIOMETRIC_ALGORITHMS.ES256 || value === BIOMETRIC_ALGORITHMS.RS256;
}

function sanitizePendingBiometricRequest(value) {
  if (!isPlainObject(value)) return null;

  const type = value.type === 'setup' || value.type === 'unlock' ? value.type : '';
  const requestId = typeof value.requestId === 'string' ? value.requestId.trim() : '';
  const challenge = typeof value.challenge === 'string' ? value.challenge.trim() : '';
  if (!type || !requestId || !challenge) return null;

  return {
    type,
    requestId,
    challenge,
    createdAt: readStateNumber(value, 'createdAt', 0),
    tabId: Number.isInteger(value.tabId) ? value.tabId : null,
    url: typeof value.url === 'string' ? value.url : '',
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

async function sha256Bytes(data) {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
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
    throw new Error('Invalid DER length.');
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
    throw new Error('Invalid DER length.');
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
    throw new Error('Invalid DER integer.');
  }

  const output = new Uint8Array(fieldLength);
  output.set(normalized, fieldLength - normalized.length);
  return output;
}

function convertDerEcdsaSignatureToP1363(signature, fieldLength = 32) {
  const bytes = signature instanceof Uint8Array ? signature : new Uint8Array(signature);
  if (bytes.length < 8 || bytes[0] !== 0x30) {
    throw new Error('Invalid DER signature.');
  }

  const sequenceLengthInfo = readDerLength(bytes, 1);
  const sequenceEnd = sequenceLengthInfo.nextOffset + sequenceLengthInfo.length;
  if (sequenceEnd !== bytes.length) {
    throw new Error('Invalid DER signature.');
  }

  let offset = sequenceLengthInfo.nextOffset;
  if (bytes[offset] !== 0x02) {
    throw new Error('Invalid DER signature.');
  }

  const rLengthInfo = readDerLength(bytes, offset + 1);
  const rEnd = rLengthInfo.nextOffset + rLengthInfo.length;
  if (rEnd > bytes.length) {
    throw new Error('Invalid DER signature.');
  }
  const r = normalizeDerInteger(bytes.slice(rLengthInfo.nextOffset, rEnd), fieldLength);

  offset = rEnd;
  if (bytes[offset] !== 0x02) {
    throw new Error('Invalid DER signature.');
  }

  const sLengthInfo = readDerLength(bytes, offset + 1);
  const sEnd = sLengthInfo.nextOffset + sLengthInfo.length;
  if (sEnd !== bytes.length) {
    throw new Error('Invalid DER signature.');
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
  const genericError = await tr('background.error.biometric_verification_failed');
  const fail = (reason) => {
    throw createBiometricVerificationError(genericError, reason);
  };

  if (!hasBiometricCredential(state)) {
    throw new Error(await tr('background.error.biometric_not_setup'));
  }

  const biometricAlgorithm = Number(state[KEYS.biometricAlgorithm] || DEFAULTS.biometricAlgorithm);
  if (!isSupportedBiometricAlgorithm(biometricAlgorithm)) {
    fail('unsupported_algorithm');
  }

  const rawId = fromBase64Url(message.credentialId);
  if (toBase64Url(rawId) !== state[KEYS.biometricCredentialId]) {
    fail('credential_id_mismatch');
  }

  const clientDataJSON = fromBase64Url(message.clientDataJSON);
  const authenticatorData = fromBase64Url(message.authenticatorData);
  const signature = fromBase64Url(message.signature);
  if (authenticatorData.length < 37 || signature.length === 0) {
    fail('malformed_assertion');
  }

  let clientData = null;
  try {
    clientData = JSON.parse(new TextDecoder().decode(clientDataJSON));
  } catch {
    fail('client_data_parse_failed');
  }

  if (clientData?.type !== 'webauthn.get') {
    fail('client_data_type_mismatch');
  }
  if (clientData?.challenge !== request.challenge) {
    fail('challenge_mismatch');
  }
  if (clientData?.origin !== getExtensionOrigin()) {
    fail('origin_mismatch');
  }

  const actualRpIdHash = authenticatorData.slice(0, 32);
  const acceptedRpIdHashes = await getAcceptedRpIdHashes();
  const matchesRpIdHash = acceptedRpIdHashes.some((expectedRpIdHash) => (
    expectedRpIdHash.every((byte, index) => actualRpIdHash[index] === byte)
  ));
  if (!matchesRpIdHash) {
    fail('rp_id_hash_mismatch');
  }

  const flags = authenticatorData[32];
  const userPresent = (flags & 0x01) !== 0;
  const userVerified = (flags & 0x04) !== 0;
  if (!userPresent || !userVerified) {
    fail('user_presence_or_verification_missing');
  }

  const clientDataHash = await sha256Bytes(clientDataJSON);
  const signedData = concatBytes(authenticatorData, clientDataHash);
  let verificationKey;
  let verifyAlgorithm;
  let normalizedSignature = signature;

  try {
    if (biometricAlgorithm === BIOMETRIC_ALGORITHMS.ES256) {
      verificationKey = await crypto.subtle.importKey(
        'spki',
        fromBase64(state[KEYS.biometricPublicKey]),
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
      );
      verifyAlgorithm = { name: 'ECDSA', hash: 'SHA-256' };
      normalizedSignature = convertDerEcdsaSignatureToP1363(signature, 32);
    } else {
      verificationKey = await crypto.subtle.importKey(
        'spki',
        fromBase64(state[KEYS.biometricPublicKey]),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      );
      verifyAlgorithm = { name: 'RSASSA-PKCS1-v1_5' };
    }
  } catch {
    fail('public_key_import_or_signature_parse_failed');
  }

  const verified = await crypto.subtle.verify(
    verifyAlgorithm,
    verificationKey,
    normalizedSignature,
    signedData
  );

  if (!verified) {
    fail('signature_mismatch');
  }
}

async function notifyBiometricResult(request, payload) {
  if (!Number.isInteger(request?.tabId)) return;

  try {
    await chrome.tabs.sendMessage(request.tabId, {
      type: 'BIOMETRIC_AUTH_RESULT',
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
    type: 'popup',
    focused: true,
    width: 460,
    height: 640
  });
}

async function beginBiometricSetup() {
  const state = await getState();
  const settings = getSettingsSnapshot(state);
  if (settings.requiresPasswordSetup) {
    throw new Error(await tr('background.error.first_setup_required'));
  }

  const request = {
    type: 'setup',
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
    throw new Error(await tr('background.error.first_setup_before_unlock'));
  }
  if (!hasBiometricCredential(state)) {
    throw new Error(await tr('background.error.biometric_not_setup'));
  }
  if (!Number.isInteger(sender?.tab?.id)) {
    throw new Error(await tr('background.error.biometric_tab_missing'));
  }

  const request = {
    type: 'unlock',
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
  const request = await resolveBiometricRequest(message, 'setup', state);
  if (!request || request.type !== 'setup' || request.requestId !== message.requestId) {
    throw new Error(await tr('background.error.biometric_request_missing'));
  }

  const credentialId = String(message.credentialId || '').trim();
  const publicKey = String(message.publicKey || '').trim();
  const algorithm = Number(message.algorithm);
  if (!credentialId || !publicKey || !isSupportedBiometricAlgorithm(algorithm)) {
    throw new Error(await tr('background.error.biometric_public_key_missing'));
  }

  await setState({
    [KEYS.biometricCredentialId]: credentialId,
    [KEYS.biometricPublicKey]: publicKey,
    [KEYS.biometricAlgorithm]: algorithm,
    [KEYS.biometricTransports]: normalizeBiometricTransports(message.transports),
    [KEYS.biometricCreatedAt]: now()
  });
  await clearPendingBiometricRequest(request.requestId);
  await appendLog({ type: 'security', action: 'biometric-registered' });
  await broadcastLockState();
}

async function completeBiometricUnlock(message) {
  const state = await getState();
  const settings = getSettingsSnapshot(state);
  const request = await resolveBiometricRequest(message, 'unlock', state);
  if (!request || request.type !== 'unlock' || request.requestId !== message.requestId) {
    throw new Error(await tr('background.error.biometric_request_missing'));
  }

  try {
    await verifyBiometricAssertion(message, request, state);
  } catch (error) {
    await appendLog({
      type: 'security',
      action: 'biometric-verification-failed',
      url: safeUrlForLog(request.url),
      meta: {
        reason: error?.biometricReason || 'unknown',
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
      type: 'unlock',
      source: 'profile-biometric',
      url: safeUrlForLog(request.url),
      meta: {
        profileId: matchedProfile?.id || '',
        profileName: matchedProfile?.name || '',
        pageUnlockMinutes: effectivePageUnlockMinutes
      }
    });
    await clearPendingBiometricRequest(request.requestId);
    await notifyBiometricResult(request, {
      ok: true,
      success: true,
      mode: 'profile',
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
    'biometric',
    request.url,
    requestedSessionMinutes,
    settings.requirePasswordOnDomainChange
  );
  await clearPendingBiometricRequest(request.requestId);
  await notifyBiometricResult(request, {
    ok: true,
    success: true,
    mode: 'global',
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
  if (request.type === 'unlock') {
    await notifyBiometricResult(request, {
      ok: true,
      success: false,
      error: errorMessage || await tr('background.error.biometric_cancelled')
    });
  }
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

  const hasBiometricId = typeof state[KEYS.biometricCredentialId] === 'string' && !!state[KEYS.biometricCredentialId];
  const hasBiometricKey = typeof state[KEYS.biometricPublicKey] === 'string' && !!state[KEYS.biometricPublicKey];
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
  const state = await getState();
  if (readStateBoolean(state, KEYS.requiresPasswordSetup, DEFAULTS.requiresPasswordSetup)) {
    await setState({ [KEYS.isLocked]: false });
    await chrome.runtime.openOptionsPage();
    await broadcastLockState();
    return;
  }
  await lockNow('startup');
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureInitialized();
  const state = await getState();
  if (readStateBoolean(state, KEYS.requiresPasswordSetup, DEFAULTS.requiresPasswordSetup)) {
    await setState({ [KEYS.isLocked]: false });
    await broadcastLockState();
    return;
  }
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

chrome.windows.onBoundsChanged.addListener(async (window) => {
  if (!window || window.state !== 'minimized') return;
  if (window.type && window.type !== 'normal') return;

  await ensureInitialized();
  const state = await getState();
  if (!readStateBoolean(state, KEYS.lockOnWindowBlur, DEFAULTS.lockOnWindowBlur)) return;
  if (state[KEYS.isLocked]) return;

  await lockNow('window-minimized', { windowId: window.id || null });
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

    if (message.type === 'GET_BIOMETRIC_CONTEXT') {
      const request = await getPendingBiometricRequestById(message.requestId, state);
      if (!request) {
        sendResponse({ ok: false, error: await tr('background.error.biometric_request_missing') });
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

    if (message.type === 'BEGIN_BIOMETRIC_SETUP') {
      try {
        await beginBiometricSetup();
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || await tr('background.error.unexpected') });
      }
      return;
    }

    if (message.type === 'BEGIN_BIOMETRIC_UNLOCK') {
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
        sendResponse({ ok: false, error: error?.message || await tr('background.error.unexpected') });
      }
      return;
    }

    if (message.type === 'COMPLETE_BIOMETRIC_SETUP') {
      try {
        await completeBiometricSetup(message);
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || await tr('background.error.unexpected') });
      }
      return;
    }

    if (message.type === 'COMPLETE_BIOMETRIC_UNLOCK') {
      try {
        await completeBiometricUnlock(message);
        sendResponse({ ok: true });
      } catch (error) {
        sendResponse({ ok: false, error: error?.message || await tr('background.error.unexpected') });
      }
      return;
    }

    if (message.type === 'CANCEL_BIOMETRIC_REQUEST') {
      await cancelBiometricRequest(
        String(message.requestId || '').trim(),
        String(message.error || '').trim()
      );
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'REMOVE_BIOMETRIC_CREDENTIAL') {
      await setState({
        [KEYS.biometricCredentialId]: '',
        [KEYS.biometricPublicKey]: '',
        [KEYS.biometricAlgorithm]: DEFAULTS.biometricAlgorithm,
        [KEYS.biometricTransports]: [],
        [KEYS.biometricCreatedAt]: 0,
        [KEYS.pendingBiometricRequest]: null
      });
      await appendLog({ type: 'security', action: 'biometric-removed' });
      await broadcastLockState();
      sendResponse({ ok: true });
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
