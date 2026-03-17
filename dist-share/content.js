let overlay = null;
let heartbeatTimer = null;
let overlayFocusTimer = null;
let unlocking = false;
let biometricPending = false;
let stateInitialized = false;
let uiSyncScheduled = false;
let lastTamperReportAt = 0;
let lastTamperAction = '';
const i18n = globalThis.CLPX_I18N;
const REGION_MODES = ['\x62\x6c\x75\x72', '\x62\x6c\x61\x63\x6b\x6f\x75\x74', '\x70\x69\x78\x65\x6c\x61\x74\x65'];
const MASKED_FAVICON_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#0b1020"/><path fill="#eff5ff" d="M20 28a12 12 0 1124 0v4h2a4 4 0 014 4v12a6 6 0 01-6 6H20a6 6 0 01-6-6V36a4 4 0 014-4h2zm6 0h12v-4a6 6 0 10-12 0z"/></svg>'
)}`;

let blurRoot = null;
let blurRegionElements = new Map();
let blurRegions = [];
let selectionLayer = null;
let selectionHint = null;
let selectionBox = null;
let selectionState = null;
let regionInteractionState = null;
let identityMaskApplied = false;
let originalDocumentTitle = '';
let originalFaviconNodes = [];
let pageUnlockGranted = false;
let pageUnlockUntil = 0;
let pageUnlockProfileId = '';
let lastObservedUrl = location.href;

let currentState = {
  isLocked: true,
  whitelist: [],
  failedAttempts: 0,
  lockoutUntil: 0,
  maxAttempts: 5,
  unlockSessionMinutes: 0,
  unlockUntil: 0,
  requiresPasswordSetup: false,
  defaultRegionMode: '\x62\x6c\x75\x72',
  maskPageIdentity: false,
  domainProfiles: [],
  requirePasswordOnDomainChange: true,
  sessionAccessHosts: [],
  biometricConfigured: false
};

function t(key, values) {
  return i18n?.t ? i18n.t(key, values) : key;
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

function isWhitelisted(href, rules) {
  return (rules || []).some((rule) => {
    try {
      return matchesRule(rule, href);
    } catch {
      return false;
    }
  });
}

function isLockablePage() {
  return /^https?:/i.test(location.protocol);
}

function getSessionAccessHost(url = location.href) {
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
  return [...new Set(hosts.map((host) => String(host || '').trim().toLowerCase()).filter(Boolean))];
}

function normalizeRegionMode(value, fallback = '\x62\x6c\x75\x72') {
  const normalized = String(value || '').trim().toLowerCase();
  return REGION_MODES.includes(normalized) ? normalized : fallback;
}

function regionModeLabel(mode) {
  const normalized = normalizeRegionMode(mode, '\x62\x6c\x75\x72');
  return t(`common.mode.${normalized}`);
}

function regionModeLowerLabel(mode) {
  const normalized = normalizeRegionMode(mode, '\x62\x6c\x75\x72');
  return t(`common.mode.lower.${normalized}`);
}

function getActiveProfile() {
  return (currentState.domainProfiles || []).find((profile) => {
    try {
      return matchesRule(profile.match, location.href);
    } catch {
      return false;
    }
  }) || null;
}

function isProfileGateEnabled(profile = getActiveProfile()) {
  return !!(profile?.forceLock || profile?.reAuthOnVisit);
}

function getEffectiveDefaultSessionMinutes() {
  const activeProfile = getActiveProfile();
  return Number.isFinite(activeProfile?.unlockSessionMinutes)
    ? activeProfile.unlockSessionMinutes
    : currentState.unlockSessionMinutes;
}

function getEffectivePageUnlockMinutes(profile = getActiveProfile()) {
  if (!profile) return currentState.unlockSessionMinutes;
  if (Number.isFinite(profile.pageUnlockMinutes)) return profile.pageUnlockMinutes;
  if (Number.isFinite(profile.unlockSessionMinutes)) return profile.unlockSessionMinutes;
  return currentState.unlockSessionMinutes;
}

function getEffectiveRegionMode() {
  const activeProfile = getActiveProfile();
  return normalizeRegionMode(activeProfile?.regionMode, normalizeRegionMode(currentState.defaultRegionMode, '\x62\x6c\x75\x72'));
}

function shouldBypassGlobalLock(profile = getActiveProfile()) {
  return !!profile?.bypassGlobalLock || isWhitelisted(location.href, currentState.whitelist);
}

function hasCurrentSessionAccess() {
  if (currentState.isLocked) return false;
  if (!currentState.requirePasswordOnDomainChange) return true;

  const currentHost = getSessionAccessHost(location.href);
  if (!currentHost) return false;

  return normalizeSessionAccessHosts(currentState.sessionAccessHosts).includes(currentHost);
}

function isGlobalLockActiveForCurrentPage(profile = getActiveProfile()) {
  if (shouldBypassGlobalLock(profile)) return false;
  return !hasCurrentSessionAccess();
}

function clearActiveProfileAccess() {
  pageUnlockGranted = false;
  pageUnlockUntil = 0;
  pageUnlockProfileId = '';
}

function grantActiveProfileAccess(profile = getActiveProfile(), sessionMinutes = getEffectivePageUnlockMinutes(profile)) {
  if (!profile || !isProfileGateEnabled(profile)) {
    clearActiveProfileAccess();
    return;
  }

  const normalizedMinutes = Number.isFinite(Number(sessionMinutes))
    ? Math.max(0, Number(sessionMinutes))
    : getEffectivePageUnlockMinutes(profile);

  pageUnlockGranted = true;
  pageUnlockProfileId = profile.id || '';
  pageUnlockUntil = normalizedMinutes > 0 ? Date.now() + (normalizedMinutes * 60 * 1000) : 0;
}

function hasActiveProfileSession(profile = getActiveProfile()) {
  if (!profile || !isProfileGateEnabled(profile)) return true;
  if (!pageUnlockGranted || pageUnlockProfileId !== profile.id) return false;
  return pageUnlockUntil === 0 || pageUnlockUntil > Date.now();
}

function getProfileUnlockRemainingMs(profile = getActiveProfile()) {
  if (!profile || !isProfileGateEnabled(profile)) return 0;
  if (!pageUnlockGranted || pageUnlockProfileId !== profile.id) return 0;
  if (pageUnlockUntil === 0) return 0;
  return Math.max(0, pageUnlockUntil - Date.now());
}

function isProfilePolicyLocked(profile = getActiveProfile()) {
  return isProfileGateEnabled(profile) && !hasActiveProfileSession(profile);
}

function shouldLockCurrentPage() {
  if (!isLockablePage()) return false;
  if (!stateInitialized) return false;
  if (currentState.requiresPasswordSetup) return false;

  const activeProfile = getActiveProfile();
  const globalLocked = isGlobalLockActiveForCurrentPage(activeProfile);
  return globalLocked || isProfilePolicyLocked(activeProfile);
}

function scheduleUiSync() {
  if (uiSyncScheduled) return;

  uiSyncScheduled = true;
  window.requestAnimationFrame(() => {
    uiSyncScheduled = false;
    if (!stateInitialized) return;

    if (shouldLockCurrentPage()) {
      enforceOverlayIntegrity();
    }
    ensureBlurArtifacts();
    syncPageIdentityMask();
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

function defaultSessionLabel() {
  const activeProfile = getActiveProfile();
  const effectiveMinutes = (!isGlobalLockActiveForCurrentPage(activeProfile) && isProfilePolicyLocked(activeProfile))
    ? getEffectivePageUnlockMinutes()
    : getEffectiveDefaultSessionMinutes();
  return effectiveMinutes > 0
    ? `${effectiveMinutes} ${t('common.label.minutes_short')}`
    : t('\x63\x6f\x6d\x6d\x6f\x6e\x2e\x73\x65\x73\x73\x69\x6f\x6e\x2e\x75\x6e\x74\x69\x6c\x5f\x6c\x6f\x63\x6b\x65\x64');
}

function getSelectedSessionMinutes() {
  if (!overlay) return -1;
  return Number(overlay.dataset.sessionMinutes || '\x2d\x31');
}

function setSelectedSessionMinutes(value) {
  if (!overlay) return;

  const normalized = Number.isFinite(Number(value)) ? Number(value) : -1;
  overlay.dataset.sessionMinutes = String(normalized);

  overlay.querySelectorAll('\x2e\x63\x6c\x70\x78\x2d\x73\x65\x73\x73\x69\x6f\x6e\x2d\x6f\x70\x74\x69\x6f\x6e').forEach((button) => {
    button.classList.toggle('\x69\x73\x2d\x61\x63\x74\x69\x76\x65', Number(button.dataset.sessionValue) === normalized);
  });
}

function updateBiometricButtonState() {
  if (!overlay) return;

  const biometricButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x62\x74\x6e');
  if (!biometricButton) return;

  const shouldShow = !!currentState.biometricConfigured && !currentState.requiresPasswordSetup;
  biometricButton.style.display = shouldShow ? '\x62\x6c\x6f\x63\x6b' : '\x6e\x6f\x6e\x65';
  biometricButton.disabled = biometricPending;
  biometricButton.textContent = biometricPending
    ? t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x62\x75\x74\x74\x6f\x6e\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x77\x61\x69\x74\x69\x6e\x67')
    : t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x62\x75\x74\x74\x6f\x6e\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63');
}

function overlayOwnsFocus() {
  return !!(overlay && document.activeElement && overlay.contains(document.activeElement));
}

function clearOverlayFocusTimer() {
  if (!overlayFocusTimer) return;
  clearTimeout(overlayFocusTimer);
  overlayFocusTimer = null;
}

function scheduleOverlayPrimaryFocus(force = false, delay = 30) {
  clearOverlayFocusTimer();
  overlayFocusTimer = window.setTimeout(() => {
    overlayFocusTimer = null;
    focusOverlayPrimaryInput(force);
  }, delay);
}

function focusOverlayPrimaryInput(force = false) {
  if (!overlay) return;
  if (!force && overlayOwnsFocus()) return;

  const passwordInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73');
  if (passwordInput && !passwordInput.disabled) {
    passwordInput.focus();
  }
}

function reportTamper(action, meta = {}) {
  const currentTime = Date.now();
  if (action === lastTamperAction && (currentTime - lastTamperReportAt) < 30000) {
    return;
  }

  lastTamperAction = action;
  lastTamperReportAt = currentTime;

  try {
    chrome.runtime.sendMessage({
      type: '\x52\x45\x50\x4f\x52\x54\x5f\x54\x41\x4d\x50\x45\x52',
      action,
      url: location.href,
      meta
    }).catch(() => {});
  } catch {
    // ignore send failures
  }
}

function normalizeRegionRect(rect) {
  const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

  return {
    left: clamp(Math.round(rect.left), 0, viewportWidth),
    top: clamp(Math.round(rect.top), 0, viewportHeight),
    width: clamp(Math.round(rect.width), 0, viewportWidth),
    height: clamp(Math.round(rect.height), 0, viewportHeight)
  };
}

function updateRegionElement(region, element) {
  element.style.left = `${region.left}px`;
  element.style.top = `${region.top}px`;
  element.style.width = `${region.width}px`;
  element.style.height = `${region.height}px`;
  element.dataset.mode = normalizeRegionMode(region.mode, getEffectiveRegionMode());

  const modeButton = element.querySelector('\x2e\x63\x6c\x70\x78\x2d\x62\x6c\x75\x72\x2d\x6d\x6f\x64\x65');
  if (modeButton) {
    const currentMode = normalizeRegionMode(region.mode, getEffectiveRegionMode());
    modeButton.textContent = regionModeLabel(currentMode);
    modeButton.dataset.mode = currentMode;
    modeButton.title = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x72\x65\x67\x69\x6f\x6e\x2e\x6d\x6f\x64\x65\x5f\x73\x77\x69\x74\x63\x68');
  }
}

function ensureBlurRoot() {
  if (blurRoot && document.documentElement.contains(blurRoot)) {
    return blurRoot;
  }

  blurRoot = document.createElement('\x64\x69\x76');
  blurRoot.id = '\x63\x6c\x70\x78\x2d\x62\x6c\x75\x72\x2d\x72\x6f\x6f\x74';
  document.documentElement.appendChild(blurRoot);
  return blurRoot;
}

async function legacyPersistBlurRegions() {
  if (!isLockablePage()) return { ok: false, error: '\x54\x72\x61\x6e\x67\x20\x68\x69\u1ec7\x6e\x20\x74\u1ea1\x69\x20\x6b\x68\u00f4\x6e\x67\x20\x68\u1ed7\x20\x74\x72\u1ee3\x20\x62\x6c\x75\x72\x20\x72\x65\x67\x69\x6f\x6e\x2e' };

  try {
    return await chrome.runtime.sendMessage({
      type: '\x53\x41\x56\x45\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x53\x5f\x46\x4f\x52\x5f\x55\x52\x4c',
      url: location.href,
      regions: blurRegions.map((region) => ({
        id: region.id,
        left: region.left,
        top: region.top,
        width: region.width,
        height: region.height,
        mode: normalizeRegionMode(region.mode, getEffectiveRegionMode())
      }))
    });
  } catch {
    return { ok: false, error: '\x4b\x68\u00f4\x6e\x67\x20\x6c\u01b0\x75\x20\u0111\u01b0\u1ee3\x63\x20\x62\x6c\x75\x72\x20\x72\x65\x67\x69\x6f\x6e\x73\x2e' };
  }
}

async function persistBlurRegions() {
  if (!isLockablePage()) {
    return { ok: false, error: t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2e\x75\x6e\x73\x75\x70\x70\x6f\x72\x74\x65\x64\x5f\x70\x61\x67\x65') };
  }

  try {
    return await chrome.runtime.sendMessage({
      type: '\x53\x41\x56\x45\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x53\x5f\x46\x4f\x52\x5f\x55\x52\x4c',
      url: location.href,
      regions: blurRegions.map((region) => ({
        id: region.id,
        left: region.left,
        top: region.top,
        width: region.width,
        height: region.height,
        mode: normalizeRegionMode(region.mode, getEffectiveRegionMode())
      }))
    });
  } catch {
    return { ok: false, error: t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x72\x65\x67\x69\x6f\x6e\x2e\x73\x61\x76\x65\x5f\x66\x61\x69\x6c\x65\x64') };
  }
}

async function loadPersistedBlurRegions() {
  if (!isLockablePage()) {
    blurRegions = [];
    renderBlurRegions();
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: '\x47\x45\x54\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x53\x5f\x46\x4f\x52\x5f\x55\x52\x4c',
      url: location.href
    });

    blurRegions = Array.isArray(response?.regions)
      ? response.regions.map((region) => ({
          id: String(region.id),
          left: Number(region.left) || 0,
          top: Number(region.top) || 0,
          width: Number(region.width) || 0,
          height: Number(region.height) || 0,
          mode: normalizeRegionMode(region.mode, getEffectiveRegionMode())
        }))
      : [];
  } catch {
    blurRegions = [];
  }

  renderBlurRegions();
}

function findRegion(regionId) {
  return blurRegions.find((region) => region.id === regionId) || null;
}

function stopRegionInteraction({ save = false } = {}) {
  if (!regionInteractionState) return;

  window.removeEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x6d\x6f\x76\x65', regionInteractionState.handlePointerMove, true);
  window.removeEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', regionInteractionState.handlePointerUp, true);
  window.removeEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x63\x61\x6e\x63\x65\x6c', regionInteractionState.handlePointerCancel, true);

  if (save) {
    persistBlurRegions().catch(() => {});
  }

  regionInteractionState = null;
}

function startRegionInteraction(regionId, mode, event) {
  if (shouldLockCurrentPage()) return;

  const region = findRegion(regionId);
  if (!region) return;

  event.preventDefault();
  event.stopPropagation();
  stopBlurSelection(false);
  stopRegionInteraction();

  const origin = {
    left: region.left,
    top: region.top,
    width: region.width,
    height: region.height
  };

  const state = {
    regionId,
    mode,
    startX: event.clientX,
    startY: event.clientY,
    origin,
    handlePointerMove: null,
    handlePointerUp: null,
    handlePointerCancel: null
  };

  state.handlePointerMove = (moveEvent) => {
    const targetRegion = findRegion(regionId);
    if (!targetRegion) return;

    moveEvent.preventDefault();
    moveEvent.stopPropagation();

    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const dx = moveEvent.clientX - state.startX;
    const dy = moveEvent.clientY - state.startY;

    if (mode === '\x6d\x6f\x76\x65') {
      targetRegion.left = clamp(Math.round(state.origin.left + dx), 0, Math.max(0, viewportWidth - targetRegion.width));
      targetRegion.top = clamp(Math.round(state.origin.top + dy), 0, Math.max(0, viewportHeight - targetRegion.height));
    } else {
      targetRegion.width = clamp(Math.round(state.origin.width + dx), 24, Math.max(24, viewportWidth - targetRegion.left));
      targetRegion.height = clamp(Math.round(state.origin.height + dy), 24, Math.max(24, viewportHeight - targetRegion.top));
    }

    const element = blurRegionElements.get(regionId);
    if (element) updateRegionElement(targetRegion, element);
  };

  state.handlePointerUp = (upEvent) => {
    upEvent.preventDefault();
    upEvent.stopPropagation();
    stopRegionInteraction({ save: true });
  };

  state.handlePointerCancel = (cancelEvent) => {
    cancelEvent.preventDefault();
    cancelEvent.stopPropagation();
    stopRegionInteraction({ save: false });
  };

  window.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x6d\x6f\x76\x65', state.handlePointerMove, true);
  window.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', state.handlePointerUp, true);
  window.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x63\x61\x6e\x63\x65\x6c', state.handlePointerCancel, true);
  regionInteractionState = state;
}

function removeBlurRegion(regionId) {
  blurRegions = blurRegions.filter((region) => region.id !== regionId);
  renderBlurRegions();
  persistBlurRegions().catch(() => {});
}

function setBlurRegionMode(regionId, mode) {
  const region = findRegion(regionId);
  if (!region) return;

  region.mode = normalizeRegionMode(mode, getEffectiveRegionMode());
  const element = blurRegionElements.get(regionId);
  if (element) updateRegionElement(region, element);
  persistBlurRegions().catch(() => {});
}

function cycleBlurRegionMode(regionId) {
  const region = findRegion(regionId);
  if (!region) return;

  const currentMode = normalizeRegionMode(region.mode, getEffectiveRegionMode());
  const currentIndex = REGION_MODES.indexOf(currentMode);
  const nextMode = REGION_MODES[(currentIndex + 1) % REGION_MODES.length];
  setBlurRegionMode(regionId, nextMode);
}

function createRegionElement(region) {
  const regionElement = document.createElement('\x64\x69\x76');
  const modeButton = document.createElement('\x62\x75\x74\x74\x6f\x6e');
  const removeButton = document.createElement('\x62\x75\x74\x74\x6f\x6e');
  const resizeHandle = document.createElement('\x64\x69\x76');

  regionElement.className = '\x63\x6c\x70\x78\x2d\x62\x6c\x75\x72\x2d\x72\x65\x67\x69\x6f\x6e';
  regionElement.dataset.regionId = region.id;

  modeButton.className = '\x63\x6c\x70\x78\x2d\x62\x6c\x75\x72\x2d\x6d\x6f\x64\x65';
  modeButton.type = '\x62\x75\x74\x74\x6f\x6e';
  modeButton.title = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x72\x65\x67\x69\x6f\x6e\x2e\x6d\x6f\x64\x65\x5f\x73\x77\x69\x74\x63\x68');
  modeButton.addEventListener('\x63\x6c\x69\x63\x6b', (event) => {
    event.preventDefault();
    event.stopPropagation();
    cycleBlurRegionMode(region.id);
  });

  removeButton.className = '\x63\x6c\x70\x78\x2d\x62\x6c\x75\x72\x2d\x72\x65\x6d\x6f\x76\x65';
  removeButton.type = '\x62\x75\x74\x74\x6f\x6e';
  removeButton.textContent = '\u00d7';
  removeButton.title = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x72\x65\x67\x69\x6f\x6e\x2e\x72\x65\x6d\x6f\x76\x65');
  removeButton.addEventListener('\x63\x6c\x69\x63\x6b', (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeBlurRegion(region.id);
  });

  resizeHandle.className = '\x63\x6c\x70\x78\x2d\x62\x6c\x75\x72\x2d\x72\x65\x73\x69\x7a\x65';
  resizeHandle.title = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x72\x65\x67\x69\x6f\x6e\x2e\x72\x65\x73\x69\x7a\x65');
  resizeHandle.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', (event) => {
    startRegionInteraction(region.id, '\x72\x65\x73\x69\x7a\x65', event);
  });

  regionElement.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', (event) => {
    if (event.target === modeButton || event.target === removeButton || event.target === resizeHandle) return;
    startRegionInteraction(region.id, '\x6d\x6f\x76\x65', event);
  });

  ['\x6d\x6f\x75\x73\x65\x64\x6f\x77\x6e', '\x6d\x6f\x75\x73\x65\x75\x70', '\x63\x6c\x69\x63\x6b', '\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', '\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', '\x74\x6f\x75\x63\x68\x73\x74\x61\x72\x74', '\x74\x6f\x75\x63\x68\x65\x6e\x64'].forEach((eventName) => {
    regionElement.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    modeButton.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
    removeButton.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
    resizeHandle.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  regionElement.append(modeButton, removeButton, resizeHandle);
  updateRegionElement(region, regionElement);
  return regionElement;
}

function renderBlurRegions() {
  if (blurRegions.length === 0) {
    if (blurRoot) {
      blurRoot.replaceChildren();
    }
    blurRegionElements.clear();
    return;
  }

  const root = ensureBlurRoot();
  const nextIds = new Set(blurRegions.map((region) => region.id));

  for (const [regionId, element] of blurRegionElements.entries()) {
    if (nextIds.has(regionId)) continue;
    element.remove();
    blurRegionElements.delete(regionId);
  }

  for (const region of blurRegions) {
    let element = blurRegionElements.get(region.id);
    if (!element) {
      element = createRegionElement(region);
      blurRegionElements.set(region.id, element);
    }
    if (element.parentElement !== root) {
      root.appendChild(element);
    }
    updateRegionElement(region, element);
  }
}

function addBlurRegion(rect, mode = getEffectiveRegionMode()) {
  const normalized = normalizeRegionRect(rect);
  if (normalized.width < 24 || normalized.height < 24) {
    return false;
  }

  blurRegions.push({
    id: crypto.randomUUID(),
    ...normalized,
    mode: normalizeRegionMode(mode, getEffectiveRegionMode())
  });
  renderBlurRegions();
  persistBlurRegions().catch(() => {});
  return true;
}

function clearBlurRegions() {
  blurRegions = [];
  renderBlurRegions();
  persistBlurRegions().catch(() => {});
}

function createSelectionRect(startX, startY, endX, endY) {
  const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const left = clamp(Math.min(startX, endX), 0, viewportWidth);
  const top = clamp(Math.min(startY, endY), 0, viewportHeight);
  const right = clamp(Math.max(startX, endX), 0, viewportWidth);
  const bottom = clamp(Math.max(startY, endY), 0, viewportHeight);

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top)
  };
}

function updateSelectionBox(endX, endY) {
  if (!selectionState || !selectionBox) return;

  const rect = createSelectionRect(selectionState.startX, selectionState.startY, endX, endY);
  selectionState.currentRect = rect;
  selectionBox.style.display = '\x62\x6c\x6f\x63\x6b';
  selectionBox.style.left = `${rect.left}px`;
  selectionBox.style.top = `${rect.top}px`;
  selectionBox.style.width = `${rect.width}px`;
  selectionBox.style.height = `${rect.height}px`;
}

function teardownSelectionLayer() {
  if (!selectionState) return;

  selectionLayer?.removeEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', selectionState.handlePointerDown, true);
  selectionLayer?.removeEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x6d\x6f\x76\x65', selectionState.handlePointerMove, true);
  selectionLayer?.removeEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', selectionState.handlePointerUp, true);
  selectionLayer?.removeEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x63\x61\x6e\x63\x65\x6c', selectionState.handlePointerCancel, true);
  window.removeEventListener('\x6b\x65\x79\x64\x6f\x77\x6e', selectionState.handleKeyDown, true);

  selectionLayer?.remove();
  selectionLayer = null;
  selectionHint = null;
  selectionBox = null;
  selectionState = null;
}

function stopBlurSelection(commit = false) {
  const rect = selectionState?.currentRect;
  const mode = selectionState?.mode || getEffectiveRegionMode();
  teardownSelectionLayer();

  if (commit && rect) {
    addBlurRegion(rect, mode);
  }
}

function startBlurSelection() {
  if (!isLockablePage()) {
    return { ok: false, error: t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2e\x75\x6e\x73\x75\x70\x70\x6f\x72\x74\x65\x64\x5f\x70\x61\x67\x65') };
  }

  if (shouldLockCurrentPage()) {
    return { ok: false, error: t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2e\x6c\x6f\x63\x6b\x65\x64\x5f\x70\x61\x67\x65') };
  }

  if (selectionLayer) {
    return { ok: false, error: t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2e\x61\x6c\x72\x65\x61\x64\x79\x5f\x61\x63\x74\x69\x76\x65') };
  }

  selectionLayer = document.createElement('\x64\x69\x76');
  selectionLayer.id = '\x63\x6c\x70\x78\x2d\x62\x6c\x75\x72\x2d\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2d\x6c\x61\x79\x65\x72';

  selectionHint = document.createElement('\x64\x69\x76');
  selectionHint.className = '\x63\x6c\x70\x78\x2d\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2d\x68\x69\x6e\x74';
  selectionHint.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2e\x68\x69\x6e\x74', {
    mode: regionModeLowerLabel(getEffectiveRegionMode())
  });

  selectionBox = document.createElement('\x64\x69\x76');
  selectionBox.className = '\x63\x6c\x70\x78\x2d\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2d\x62\x6f\x78';

  selectionLayer.append(selectionHint, selectionBox);
  document.documentElement.appendChild(selectionLayer);

  selectionState = {
    startX: 0,
    startY: 0,
    dragging: false,
    currentRect: null,
    mode: getEffectiveRegionMode(),
    handlePointerDown: null,
    handlePointerMove: null,
    handlePointerUp: null,
    handlePointerCancel: null,
    handleKeyDown: null
  };

  selectionState.handlePointerDown = (event) => {
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    selectionState.dragging = true;
    selectionState.startX = event.clientX;
    selectionState.startY = event.clientY;
    updateSelectionBox(event.clientX, event.clientY);
  };

  selectionState.handlePointerMove = (event) => {
    if (!selectionState.dragging) return;
    event.preventDefault();
    event.stopPropagation();
    updateSelectionBox(event.clientX, event.clientY);
  };

  selectionState.handlePointerUp = (event) => {
    if (!selectionState.dragging) return;
    event.preventDefault();
    event.stopPropagation();
    selectionState.dragging = false;
    updateSelectionBox(event.clientX, event.clientY);
    stopBlurSelection(true);
  };

  selectionState.handlePointerCancel = (event) => {
    event.preventDefault();
    event.stopPropagation();
    stopBlurSelection(false);
  };

  selectionState.handleKeyDown = (event) => {
    if (event.key !== '\x45\x73\x63\x61\x70\x65') return;
    event.preventDefault();
    event.stopPropagation();
    stopBlurSelection(false);
  };

  selectionLayer.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', selectionState.handlePointerDown, true);
  selectionLayer.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x6d\x6f\x76\x65', selectionState.handlePointerMove, true);
  selectionLayer.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', selectionState.handlePointerUp, true);
  selectionLayer.addEventListener('\x70\x6f\x69\x6e\x74\x65\x72\x63\x61\x6e\x63\x65\x6c', selectionState.handlePointerCancel, true);
  window.addEventListener('\x6b\x65\x79\x64\x6f\x77\x6e', selectionState.handleKeyDown, true);

  return { ok: true };
}

function getBlurRegionState() {
  const activeProfile = getActiveProfile();
  return {
    ok: true,
    count: blurRegions.length,
    selectionActive: !!selectionLayer,
    activeMode: getEffectiveRegionMode(),
    defaultMode: normalizeRegionMode(currentState.defaultRegionMode, '\x62\x6c\x75\x72'),
    activeProfileName: activeProfile?.name || '',
    effectiveSessionMinutes: getEffectiveDefaultSessionMinutes(),
    titleMasked: identityMaskApplied,
    pageLocked: shouldLockCurrentPage(),
    profileBypassGlobalLock: !!activeProfile?.bypassGlobalLock,
    profileForceLock: !!activeProfile?.forceLock,
    profileReAuthOnVisit: !!activeProfile?.reAuthOnVisit,
    profilePageUnlockMinutes: getEffectivePageUnlockMinutes(activeProfile),
    profileUnlockRemainingMs: getProfileUnlockRemainingMs(activeProfile),
    profileUnlockIndefinite: !!activeProfile && isProfileGateEnabled(activeProfile) && pageUnlockGranted && pageUnlockProfileId === activeProfile.id && pageUnlockUntil === 0
  };
}

function ensureBlurArtifacts() {
  if (blurRegions.length > 0) {
    const root = ensureBlurRoot();
    if (blurRegionElements.size !== blurRegions.length || root.childElementCount !== blurRegions.length) {
      renderBlurRegions();
    }
  } else if (blurRoot && (blurRoot.childElementCount > 0 || blurRegionElements.size > 0)) {
    blurRoot.replaceChildren();
    blurRegionElements.clear();
  }

  if (selectionLayer && !document.documentElement.contains(selectionLayer)) {
    document.documentElement.appendChild(selectionLayer);
  }
}

function snapshotPageIdentity() {
  if (identityMaskApplied || !document.head) return;

  originalDocumentTitle = document.title;
  originalFaviconNodes = Array
    .from(document.head.querySelectorAll("\x6c\x69\x6e\x6b\x5b\x72\x65\x6c\x7e\x3d\x27\x69\x63\x6f\x6e\x27\x5d"))
    .map((node) => node.cloneNode(true));
}

function clearCurrentFavicons() {
  if (!document.head) return;

  Array
    .from(document.head.querySelectorAll("\x6c\x69\x6e\x6b\x5b\x72\x65\x6c\x7e\x3d\x27\x69\x63\x6f\x6e\x27\x5d\x2c\x20\x6c\x69\x6e\x6b\x5b\x64\x61\x74\x61\x2d\x63\x6c\x70\x78\x2d\x6d\x61\x73\x6b\x2d\x69\x63\x6f\x6e\x3d\x27\x74\x72\x75\x65\x27\x5d"))
    .forEach((node) => node.remove());
}

function applyPageIdentityMask() {
  if (!document.head) return;

  if (!identityMaskApplied) {
    snapshotPageIdentity();
  }

  document.title = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x70\x61\x67\x65\x5f\x6d\x61\x73\x6b\x5f\x74\x69\x74\x6c\x65');
  clearCurrentFavicons();

  const maskLink = document.createElement('\x6c\x69\x6e\x6b');
  maskLink.rel = '\x69\x63\x6f\x6e';
  maskLink.type = '\x69\x6d\x61\x67\x65\x2f\x73\x76\x67\x2b\x78\x6d\x6c';
  maskLink.href = MASKED_FAVICON_URL;
  maskLink.dataset.clpxMaskIcon = '\x74\x72\x75\x65';
  document.head.appendChild(maskLink);
  identityMaskApplied = true;
}

function restorePageIdentity() {
  if (!document.head || !identityMaskApplied) return;

  clearCurrentFavicons();
  document.title = originalDocumentTitle;
  originalFaviconNodes.forEach((node) => {
    document.head.appendChild(node.cloneNode(true));
  });
  identityMaskApplied = false;
}

function shouldMaskPageIdentity() {
  const activeProfile = getActiveProfile();
  return !!activeProfile?.maskIdentity || (!!currentState.maskPageIdentity && shouldLockCurrentPage());
}

function syncPageIdentityMask() {
  if (!isLockablePage()) return;

  if (shouldMaskPageIdentity()) {
    applyPageIdentityMask();
    return;
  }

  restorePageIdentity();
}

function ensureOverlay() {
  if (
    overlay &&
    overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73') &&
    overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x74\x6e') &&
    overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x62\x74\x6e') &&
    overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x73\x65\x73\x73\x69\x6f\x6e\x2d\x6f\x70\x74\x69\x6f\x6e\x73') &&
    overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73\x2d\x63\x6f\x6e\x66\x69\x72\x6d')
  ) {
    return overlay;
  }

  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  overlay = document.createElement('\x64\x69\x76');
  overlay.id = '\x63\x6c\x70\x78\x2d\x6f\x76\x65\x72\x6c\x61\x79';
  overlay.innerHTML = `
    <div class="clpx-bg"></div>
    <div class="clpx-noise"></div>
    <div class="clpx-shell">
      <div class="clpx-topbar">
        <span id="clpx-chip-product" class="clpx-chip">${t('content.overlay.chip.product')}</span>
        <div class="clpx-topbar-actions">
          <button id="clpx-lang-btn" class="clpx-chip clpx-lang-btn" type="button" aria-label="${t('common.language.switch')}">
            <span class="clpx-lang-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 9h-3.02a15.9 15.9 0 00-1.22-5 8.03 8.03 0 014.24 5zM12 4.1c.88 1.2 1.85 3.46 2.2 6.9H9.8C10.15 7.56 11.12 5.3 12 4.1zM9.32 6a15.9 15.9 0 00-1.22 5H5.08a8.03 8.03 0 014.24-5zM5.08 13H8.1c.14 1.86.56 3.63 1.22 5a8.03 8.03 0 01-4.24-5zM12 19.9c-.88-1.2-1.85-3.46-2.2-6.9h4.4c-.35 3.44-1.32 5.7-2.2 6.9zM14.68 18a15.9 15.9 0 001.22-5h3.02a8.03 8.03 0 01-4.24 5z"></path>
              </svg>
            </span>
            <span id="clpx-lang-label">${t(`common.language.short.${i18n.getLanguage()}`)}</span>
          </button>
          <span id="clpx-chip-protected" class="clpx-chip alt">${t('content.overlay.chip.protected')}</span>
        </div>
      </div>
      <div class="clpx-card">
        <h1 id="clpx-title">${t('content.overlay.title.locked')}</h1>
        <p id="clpx-sub" class="clpx-sub">${t('content.overlay.subtitle.locked')}</p>
        <div id="clpx-lockout" class="clpx-lockout"></div>
        <div class="clpx-form">
          <input id="clpx-pass" type="password" placeholder="${t('content.overlay.input.password')}" autocomplete="off" />
          <input id="clpx-pass-confirm" class="clpx-setup-field" type="password" placeholder="${t('content.overlay.input.confirm_password')}" autocomplete="off" />
          <div class="clpx-session-row">
            <div class="clpx-field">
              <span id="clpx-session-label">${t('content.overlay.session_label')}</span>
              <div class="clpx-session-options" id="clpx-session-options">
                <button class="clpx-session-option is-active" data-session-value="-1" type="button">${t('common.label.default')}</button>
                <button class="clpx-session-option" data-session-value="0" type="button">${t('common.label.unlimited')}</button>
                <button class="clpx-session-option" data-session-value="5" type="button">5m</button>
                <button class="clpx-session-option" data-session-value="15" type="button">15m</button>
                <button class="clpx-session-option" data-session-value="30" type="button">30m</button>
              </div>
            </div>
            <div id="clpx-session-note" class="clpx-session-note"></div>
          </div>
          <button id="clpx-btn" class="clpx-primary-btn" type="button">${t('content.overlay.button.unlock')}</button>
          <button id="clpx-biometric-btn" class="clpx-secondary-btn" type="button">${t('content.overlay.button.biometric')}</button>
        </div>
        <div id="clpx-setup-note" class="clpx-setup-note"></div>
        <div id="clpx-hint" class="clpx-hint">${t('content.overlay.hint')}</div>
        <div id="clpx-error" class="clpx-error"></div>
      </div>
    </div>
  `;

  document.documentElement.appendChild(overlay);

  const passwordInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73');
  const confirmInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73\x2d\x63\x6f\x6e\x66\x69\x72\x6d');
  const submitButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x74\x6e');
  const biometricButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x62\x74\x6e');
  const errorNode = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x65\x72\x72\x6f\x72');
  const sessionButtons = [...overlay.querySelectorAll('\x2e\x63\x6c\x70\x78\x2d\x73\x65\x73\x73\x69\x6f\x6e\x2d\x6f\x70\x74\x69\x6f\x6e')];
  const languageToggleButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x6c\x61\x6e\x67\x2d\x62\x74\x6e');

  setSelectedSessionMinutes(-1);

  overlay.addEventListener('\x66\x6f\x63\x75\x73\x69\x6e', clearOverlayFocusTimer, true);

  languageToggleButton?.addEventListener('\x63\x6c\x69\x63\x6b', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await i18n.toggleLanguage();
  });

  ['\x6d\x6f\x75\x73\x65\x64\x6f\x77\x6e', '\x6d\x6f\x75\x73\x65\x75\x70', '\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', '\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', '\x74\x6f\x75\x63\x68\x73\x74\x61\x72\x74', '\x74\x6f\x75\x63\x68\x65\x6e\x64'].forEach((eventName) => {
    languageToggleButton?.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  sessionButtons.forEach((button) => {
    ['\x6d\x6f\x75\x73\x65\x64\x6f\x77\x6e', '\x6d\x6f\x75\x73\x65\x75\x70', '\x63\x6c\x69\x63\x6b', '\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', '\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', '\x74\x6f\x75\x63\x68\x73\x74\x61\x72\x74', '\x74\x6f\x75\x63\x68\x65\x6e\x64'].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        clearOverlayFocusTimer();
        event.stopPropagation();
      });
    });

    button.addEventListener('\x63\x6c\x69\x63\x6b', () => {
      setSelectedSessionMinutes(Number(button.dataset.sessionValue));
      updateOverlaySessionNote();
    });
  });

  async function submitUnlock() {
    if (unlocking) return;

    unlocking = true;
    errorNode.textContent = '';

    try {
      const activeProfile = getActiveProfile();
      const profileGateActive = isProfileGateEnabled(activeProfile);
      const profileLockOnly = !isGlobalLockActiveForCurrentPage(activeProfile) && isProfilePolicyLocked(activeProfile);
      const selectedValue = getSelectedSessionMinutes();
      const useDefaultSession = selectedValue === -1;
      const sessionMinutes = useDefaultSession ? getEffectiveDefaultSessionMinutes() : selectedValue;
      const pageUnlockMinutes = useDefaultSession ? getEffectivePageUnlockMinutes(activeProfile) : selectedValue;

      if (currentState.requiresPasswordSetup) {
        if (!passwordInput.value || passwordInput.value.length < 6) {
          errorNode.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x73\x68\x6f\x72\x74\x5f\x70\x61\x73\x73\x77\x6f\x72\x64');
          passwordInput.focus();
          return;
        }

        if (passwordInput.value !== confirmInput.value) {
          errorNode.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x6d\x69\x73\x6d\x61\x74\x63\x68');
          confirmInput.focus();
          return;
        }

        const setupResponse = await chrome.runtime.sendMessage({
          type: '\x53\x45\x54\x5f\x49\x4e\x49\x54\x49\x41\x4c\x5f\x50\x41\x53\x53\x57\x4f\x52\x44',
          newPassword: passwordInput.value,
          url: location.href,
          sessionMinutes,
          useDefaultSession
        });

        if (setupResponse?.success) {
          passwordInput.value = '';
          confirmInput.value = '';
          hideOverlay();
          return;
        }

        errorNode.textContent = setupResponse?.error || t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x73\x65\x74\x75\x70\x5f\x66\x61\x69\x6c\x65\x64');
        return;
      }

      const unlockResponse = await chrome.runtime.sendMessage(
        profileLockOnly
          ? {
              type: '\x56\x45\x52\x49\x46\x59\x5f\x50\x41\x53\x53\x57\x4f\x52\x44\x5f\x4f\x4e\x4c\x59',
              password: passwordInput.value,
              url: location.href,
              sessionMinutes: pageUnlockMinutes,
              useDefaultSession
            }
          : {
              type: '\x55\x4e\x4c\x4f\x43\x4b\x5f\x57\x49\x54\x48\x5f\x50\x41\x53\x53\x57\x4f\x52\x44',
              password: passwordInput.value,
              url: location.href,
              sessionMinutes,
              useDefaultSession
            }
      );

      if (unlockResponse?.success) {
        if (profileGateActive) {
          grantActiveProfileAccess(activeProfile, pageUnlockMinutes);
        } else {
          clearActiveProfileAccess();
        }
        passwordInput.value = '';
        hideOverlay();
        return;
      }

      if (unlockResponse?.remainingMs) {
        errorNode.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x74\x72\x79\x5f\x61\x66\x74\x65\x72', {
          error: unlockResponse.error,
          time: formatRemaining(unlockResponse.remainingMs)
        });
      } else if (typeof unlockResponse?.failedAttempts === '\x6e\x75\x6d\x62\x65\x72') {
        errorNode.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x66\x61\x69\x6c\x65\x64\x5f\x61\x74\x74\x65\x6d\x70\x74\x73', {
          error: unlockResponse.error,
          attempts: unlockResponse.failedAttempts,
          maxAttempts: unlockResponse.maxAttempts
        });
      } else {
        errorNode.textContent = unlockResponse?.error || t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x75\x6e\x6c\x6f\x63\x6b\x5f\x66\x61\x69\x6c\x65\x64');
      }

      passwordInput.value = '';
      passwordInput.focus();
    } catch {
      errorNode.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x6e\x6f\x5f\x72\x65\x73\x70\x6f\x6e\x73\x65');
    } finally {
      unlocking = false;
    }
  }

  async function startBiometricUnlock() {
    if (biometricPending || currentState.requiresPasswordSetup || !currentState.biometricConfigured) return;

    biometricPending = true;
    updateBiometricButtonState();
    errorNode.textContent = '';

    try {
      const activeProfile = getActiveProfile();
      const profileLockOnly = !isGlobalLockActiveForCurrentPage(activeProfile) && isProfilePolicyLocked(activeProfile);
      const selectedValue = getSelectedSessionMinutes();
      const useDefaultSession = selectedValue === -1;
      const sessionMinutes = useDefaultSession ? getEffectiveDefaultSessionMinutes() : selectedValue;
      const pageUnlockMinutes = useDefaultSession ? getEffectivePageUnlockMinutes(activeProfile) : selectedValue;

      const response = await chrome.runtime.sendMessage({
        type: '\x42\x45\x47\x49\x4e\x5f\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x55\x4e\x4c\x4f\x43\x4b',
        url: location.href,
        pageOnly: profileLockOnly,
        sessionMinutes: profileLockOnly ? pageUnlockMinutes : sessionMinutes,
        useDefaultSession
      });

      if (!response?.ok) {
        biometricPending = false;
        updateBiometricButtonState();
        errorNode.textContent = response?.error || t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x66\x61\x69\x6c\x65\x64');
      }
    } catch {
      biometricPending = false;
      updateBiometricButtonState();
      errorNode.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x6e\x6f\x5f\x72\x65\x73\x70\x6f\x6e\x73\x65');
    }
  }

  submitButton.addEventListener('\x63\x6c\x69\x63\x6b', submitUnlock);
  biometricButton?.addEventListener('\x63\x6c\x69\x63\x6b', startBiometricUnlock);

  [submitButton, biometricButton].forEach((button) => {
    if (!button) return;

    ['\x6d\x6f\x75\x73\x65\x64\x6f\x77\x6e', '\x6d\x6f\x75\x73\x65\x75\x70', '\x63\x6c\x69\x63\x6b', '\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', '\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', '\x74\x6f\x75\x63\x68\x73\x74\x61\x72\x74', '\x74\x6f\x75\x63\x68\x65\x6e\x64'].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });
  });

  [passwordInput, confirmInput].forEach((input) => {
    ['\x6d\x6f\x75\x73\x65\x64\x6f\x77\x6e', '\x6d\x6f\x75\x73\x65\x75\x70', '\x63\x6c\x69\x63\x6b', '\x70\x6f\x69\x6e\x74\x65\x72\x64\x6f\x77\x6e', '\x70\x6f\x69\x6e\x74\x65\x72\x75\x70', '\x74\x6f\x75\x63\x68\x73\x74\x61\x72\x74', '\x74\x6f\x75\x63\x68\x65\x6e\x64', '\x6b\x65\x79\x64\x6f\x77\x6e', '\x6b\x65\x79\x75\x70', '\x6b\x65\x79\x70\x72\x65\x73\x73'].forEach((eventName) => {
      input.addEventListener(eventName, (event) => {
        clearOverlayFocusTimer();
        event.stopPropagation();
      });
    });

    input.addEventListener('\x6b\x65\x79\x64\x6f\x77\x6e', (event) => {
      event.stopPropagation();
      if (event.key === '\x45\x6e\x74\x65\x72') submitUnlock();
    }, true);
  });

  ['\x6b\x65\x79\x64\x6f\x77\x6e', '\x6b\x65\x79\x75\x70', '\x6b\x65\x79\x70\x72\x65\x73\x73', '\x63\x6f\x6e\x74\x65\x78\x74\x6d\x65\x6e\x75'].forEach((eventName) => {
    overlay.addEventListener(eventName, (event) => {
      event.stopPropagation();
      if (eventName === '\x63\x6f\x6e\x74\x65\x78\x74\x6d\x65\x6e\x75') event.preventDefault();
    });
  });

  updateOverlayMode();
  updateOverlaySessionNote();
  updateBiometricButtonState();
  return overlay;
}

function applyOverlayLocalizedText() {
  if (!overlay) return;

  const activeProfile = getActiveProfile();
  const profileLockedOnly = !isGlobalLockActiveForCurrentPage(activeProfile) && isProfilePolicyLocked(activeProfile);
  const productChip = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x63\x68\x69\x70\x2d\x70\x72\x6f\x64\x75\x63\x74');
  const protectedChip = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x63\x68\x69\x70\x2d\x70\x72\x6f\x74\x65\x63\x74\x65\x64');
  const languageButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x6c\x61\x6e\x67\x2d\x62\x74\x6e');
  const languageLabel = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x6c\x61\x6e\x67\x2d\x6c\x61\x62\x65\x6c');
  const title = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x74\x69\x74\x6c\x65');
  const subtitle = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x73\x75\x62');
  const passwordInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73');
  const confirmInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73\x2d\x63\x6f\x6e\x66\x69\x72\x6d');
  const submitButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x74\x6e');
  const biometricButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x62\x74\x6e');
  const setupNote = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x73\x65\x74\x75\x70\x2d\x6e\x6f\x74\x65');
  const sessionLabel = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x73\x65\x73\x73\x69\x6f\x6e\x2d\x6c\x61\x62\x65\x6c');
  const hint = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x68\x69\x6e\x74');
  const sessionButtons = overlay.querySelectorAll('\x2e\x63\x6c\x70\x78\x2d\x73\x65\x73\x73\x69\x6f\x6e\x2d\x6f\x70\x74\x69\x6f\x6e');

  if (productChip) productChip.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x63\x68\x69\x70\x2e\x70\x72\x6f\x64\x75\x63\x74');
  if (protectedChip) protectedChip.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x63\x68\x69\x70\x2e\x70\x72\x6f\x74\x65\x63\x74\x65\x64');
  if (languageButton) {
    languageButton.title = t('\x63\x6f\x6d\x6d\x6f\x6e\x2e\x6c\x61\x6e\x67\x75\x61\x67\x65\x2e\x73\x77\x69\x74\x63\x68');
    languageButton.setAttribute('\x61\x72\x69\x61\x2d\x6c\x61\x62\x65\x6c', t('\x63\x6f\x6d\x6d\x6f\x6e\x2e\x6c\x61\x6e\x67\x75\x61\x67\x65\x2e\x73\x77\x69\x74\x63\x68'));
  }
  if (languageLabel) {
    languageLabel.textContent = t(`common.language.short.${i18n.getLanguage()}`);
  }
  if (sessionLabel) {
    sessionLabel.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x65\x73\x73\x69\x6f\x6e\x5f\x6c\x61\x62\x65\x6c');
  }
  if (hint) {
    hint.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x68\x69\x6e\x74');
  }
  if (sessionButtons[0]) sessionButtons[0].textContent = t('\x63\x6f\x6d\x6d\x6f\x6e\x2e\x6c\x61\x62\x65\x6c\x2e\x64\x65\x66\x61\x75\x6c\x74');
  if (sessionButtons[1]) sessionButtons[1].textContent = t('\x63\x6f\x6d\x6d\x6f\x6e\x2e\x6c\x61\x62\x65\x6c\x2e\x75\x6e\x6c\x69\x6d\x69\x74\x65\x64');

  if (currentState.requiresPasswordSetup) {
    if (title) title.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x74\x69\x74\x6c\x65\x2e\x73\x65\x74\x75\x70');
    if (subtitle) subtitle.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x75\x62\x74\x69\x74\x6c\x65\x2e\x73\x65\x74\x75\x70');
    if (passwordInput) passwordInput.placeholder = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x69\x6e\x70\x75\x74\x2e\x6e\x65\x77\x5f\x70\x61\x73\x73\x77\x6f\x72\x64');
    if (confirmInput) {
      confirmInput.placeholder = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x69\x6e\x70\x75\x74\x2e\x63\x6f\x6e\x66\x69\x72\x6d\x5f\x70\x61\x73\x73\x77\x6f\x72\x64');
      confirmInput.style.display = '\x62\x6c\x6f\x63\x6b';
    }
    if (setupNote) {
      setupNote.style.display = '\x62\x6c\x6f\x63\x6b';
      setupNote.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x65\x74\x75\x70\x5f\x6e\x6f\x74\x65');
    }
    if (submitButton) submitButton.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x62\x75\x74\x74\x6f\x6e\x2e\x73\x65\x74\x75\x70');
    if (biometricButton) biometricButton.style.display = '\x6e\x6f\x6e\x65';
    return;
  }

  if (profileLockedOnly) {
    if (title) title.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x74\x69\x74\x6c\x65\x2e\x70\x72\x6f\x66\x69\x6c\x65');
    if (subtitle) {
      subtitle.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x75\x62\x74\x69\x74\x6c\x65\x2e\x70\x72\x6f\x66\x69\x6c\x65', {
        name: activeProfile?.name || '\x50\x72\x6f\x66\x69\x6c\x65'
      });
    }
  } else {
    if (title) title.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x74\x69\x74\x6c\x65\x2e\x6c\x6f\x63\x6b\x65\x64');
    if (subtitle) subtitle.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x75\x62\x74\x69\x74\x6c\x65\x2e\x6c\x6f\x63\x6b\x65\x64');
  }
  if (passwordInput) passwordInput.placeholder = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x69\x6e\x70\x75\x74\x2e\x70\x61\x73\x73\x77\x6f\x72\x64');
  if (confirmInput) {
    confirmInput.style.display = '\x6e\x6f\x6e\x65';
  }
  if (setupNote) {
    setupNote.style.display = '\x6e\x6f\x6e\x65';
    setupNote.textContent = '';
  }
  if (submitButton && !submitButton.disabled) {
    submitButton.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x62\x75\x74\x74\x6f\x6e\x2e\x75\x6e\x6c\x6f\x63\x6b');
  }
  updateBiometricButtonState();
}

function legacyUpdateOverlayMode() {
  if (!overlay) return;

  const title = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x74\x69\x74\x6c\x65');
  const subtitle = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x73\x75\x62');
  const passwordInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73');
  const confirmInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73\x2d\x63\x6f\x6e\x66\x69\x72\x6d');
  const submitButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x74\x6e');
  const setupNote = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x73\x65\x74\x75\x70\x2d\x6e\x6f\x74\x65');

  if (currentState.requiresPasswordSetup) {
    title.textContent = '\x54\x68\x69\u1ebf\x74\x20\x6c\u1ead\x70\x20\x6d\u1ead\x74\x20\x6b\x68\u1ea9\x75\x20\x6c\u1ea7\x6e\x20\u0111\u1ea7\x75';
    subtitle.textContent = '\x45\x78\x74\x65\x6e\x73\x69\x6f\x6e\x20\x63\x68\u01b0\x61\x20\x63\u00f3\x20\x6d\u1ead\x74\x20\x6b\x68\u1ea9\x75\x2e\x20\x48\u00e3\x79\x20\x74\u1ea1\x6f\x20\x6d\u1ead\x74\x20\x6b\x68\u1ea9\x75\x20\x6d\u1edb\x69\x20\u0111\u1ec3\x20\x62\u1eaf\x74\x20\u0111\u1ea7\x75\x20\x73\u1eed\x20\x64\u1ee5\x6e\x67\x2e';
    passwordInput.placeholder = '\x54\u1ea1\x6f\x20\x6d\u1ead\x74\x20\x6b\x68\u1ea9\x75\x20\x6d\u1edb\x69';
    confirmInput.style.display = '\x62\x6c\x6f\x63\x6b';
    setupNote.style.display = '\x62\x6c\x6f\x63\x6b';
    setupNote.textContent = '\x53\x61\x75\x20\x6b\x68\x69\x20\x74\x68\x69\u1ebf\x74\x20\x6c\u1ead\x70\x2c\x20\x74\x61\x62\x20\x73\u1ebd\x20\u0111\u01b0\u1ee3\x63\x20\x6d\u1edf\x20\x6b\x68\u00f3\x61\x20\x6e\x67\x61\x79\x20\x62\u1eb1\x6e\x67\x20\x73\x65\x73\x73\x69\x6f\x6e\x20\x62\u1ea1\x6e\x20\u0111\u00e3\x20\x63\x68\u1ecd\x6e\x2e';
    submitButton.textContent = '\x54\x68\x69\u1ebf\x74\x20\x6c\u1ead\x70\x20\x76\u00e0\x20\x6d\u1edf\x20\x6b\x68\u00f3\x61';
    applyOverlayLocalizedText();
    return;
  }

  title.textContent = '\x54\x72\u00ec\x6e\x68\x20\x64\x75\x79\u1ec7\x74\x20\u0111\x61\x6e\x67\x20\x62\u1ecb\x20\x6b\x68\u00f3\x61';
  subtitle.textContent = '\x4e\x68\u1ead\x70\x20\x6d\u1ead\x74\x20\x6b\x68\u1ea9\x75\x20\u0111\u1ec3\x20\x74\x69\u1ebf\x70\x20\x74\u1ee5\x63\x2e\x20\x4f\x76\x65\x72\x6c\x61\x79\x20\x73\u1ebd\x20\x74\u1ef1\x20\x70\x68\u1ee5\x63\x20\x68\u1ed3\x69\x20\x6e\u1ebf\x75\x20\x70\x61\x67\x65\x20\x73\x63\x72\x69\x70\x74\x20\x63\u1ed1\x20\x67\u1ee1\x20\x6b\x68\u1ecf\x69\x20\x44\x4f\x4d\x2e';
  passwordInput.placeholder = '\x4e\x68\u1ead\x70\x20\x6d\u1ead\x74\x20\x6b\x68\u1ea9\x75';
  confirmInput.style.display = '\x6e\x6f\x6e\x65';
  setupNote.style.display = '\x6e\x6f\x6e\x65';
  setupNote.textContent = '';
  submitButton.textContent = '\x4d\u1edf\x20\x6b\x68\u00f3\x61';
  applyOverlayLocalizedText();
}

function updateOverlayMode() {
  if (!overlay) return;
  applyOverlayLocalizedText();
}

function updateOverlaySessionNote() {
  if (!overlay) return;

  const noteNode = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x73\x65\x73\x73\x69\x6f\x6e\x2d\x6e\x6f\x74\x65');
  if (!noteNode) return;

  const selectedValue = getSelectedSessionMinutes();
  let selectedLabel = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x65\x73\x73\x69\x6f\x6e\x5f\x6e\x6f\x74\x65\x2e\x64\x65\x66\x61\x75\x6c\x74', {
    session: defaultSessionLabel()
  });

  if (selectedValue === 0) {
    selectedLabel = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x65\x73\x73\x69\x6f\x6e\x5f\x6e\x6f\x74\x65\x2e\x75\x6e\x6c\x69\x6d\x69\x74\x65\x64');
  } else if (selectedValue > 0) {
    selectedLabel = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x73\x65\x73\x73\x69\x6f\x6e\x5f\x6e\x6f\x74\x65\x2e\x6d\x69\x6e\x75\x74\x65\x73', { minutes: selectedValue });
  }

  noteNode.textContent = selectedLabel;
}

function updateLockoutBanner() {
  if (!overlay) return;

  const lockoutNode = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x6c\x6f\x63\x6b\x6f\x75\x74');
  const passwordInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73');
  const confirmInput = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x70\x61\x73\x73\x2d\x63\x6f\x6e\x66\x69\x72\x6d');
  const submitButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x74\x6e');
  const biometricButton = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x2d\x62\x74\x6e');
  const sessionButtons = overlay.querySelectorAll('\x2e\x63\x6c\x70\x78\x2d\x73\x65\x73\x73\x69\x6f\x6e\x2d\x6f\x70\x74\x69\x6f\x6e');
  const remainingMs = Math.max(0, Number(currentState.lockoutUntil || 0) - Date.now());
  const lockedOut = !currentState.requiresPasswordSetup && remainingMs > 0;
  const allowBiometric = lockedOut && !!currentState.biometricConfigured;

  lockoutNode.style.display = lockedOut ? '\x62\x6c\x6f\x63\x6b' : '\x6e\x6f\x6e\x65';
  lockoutNode.textContent = lockedOut
    ? t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x6c\x6f\x63\x6b\x6f\x75\x74', { time: formatRemaining(remainingMs) })
    : '';

  passwordInput.disabled = lockedOut;
  confirmInput.disabled = lockedOut;
  submitButton.disabled = lockedOut;
  sessionButtons.forEach((button) => {
    button.disabled = lockedOut && !allowBiometric;
  });
  if (biometricButton) biometricButton.disabled = biometricPending;

  if (!currentState.requiresPasswordSetup) {
    submitButton.textContent = lockedOut ? t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x62\x75\x74\x74\x6f\x6e\x2e\x77\x61\x69\x74\x69\x6e\x67') : t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x62\x75\x74\x74\x6f\x6e\x2e\x75\x6e\x6c\x6f\x63\x6b');
  }
  updateBiometricButtonState();
}

function enforceOverlayIntegrity() {
  if (!shouldLockCurrentPage()) return;

  const element = ensureOverlay();
  let restored = false;

  if (!document.documentElement.contains(element)) {
    document.documentElement.appendChild(element);
    restored = true;
    reportTamper('\x6f\x76\x65\x72\x6c\x61\x79\x2d\x64\x65\x74\x61\x63\x68\x65\x64');
  }

  if (element.style.display !== '\x66\x6c\x65\x78') {
    element.style.display = '\x66\x6c\x65\x78';
    restored = true;
    reportTamper('\x6f\x76\x65\x72\x6c\x61\x79\x2d\x68\x69\x64\x64\x65\x6e');
  }

  if (element.style.position !== '\x66\x69\x78\x65\x64') {
    element.style.position = '\x66\x69\x78\x65\x64';
    element.style.inset = '\x30';
    element.style.zIndex = '\x32\x31\x34\x37\x34\x38\x33\x36\x34\x37';
    restored = true;
    reportTamper('\x6f\x76\x65\x72\x6c\x61\x79\x2d\x72\x65\x73\x74\x79\x6c\x65\x64');
  }

  if (!document.documentElement.classList.contains('\x63\x6c\x70\x78\x2d\x68\x74\x6d\x6c\x2d\x6c\x6f\x63\x6b')) {
    document.documentElement.classList.add('\x63\x6c\x70\x78\x2d\x68\x74\x6d\x6c\x2d\x6c\x6f\x63\x6b');
    restored = true;
  }

  if (document.body && document.body.style.overflow !== '\x68\x69\x64\x64\x65\x6e') {
    document.body.style.overflow = '\x68\x69\x64\x64\x65\x6e';
  }

  document.documentElement.style.overflow = '\x68\x69\x64\x64\x65\x6e';
  updateOverlayMode();
  updateOverlaySessionNote();
  updateLockoutBanner();

  if (restored) {
    scheduleOverlayPrimaryFocus(true, 20);
  }
}

function showOverlay() {
  if (!isLockablePage()) return;

  stopBlurSelection(false);
  stopRegionInteraction({ save: false });

  const element = ensureOverlay();
  const wasVisible = element.style.display === '\x66\x6c\x65\x78';
  element.style.display = '\x66\x6c\x65\x78';
  element.style.position = '\x66\x69\x78\x65\x64';
  element.style.inset = '\x30';
  element.style.zIndex = '\x32\x31\x34\x37\x34\x38\x33\x36\x34\x37';
  document.documentElement.style.overflow = '\x68\x69\x64\x64\x65\x6e';
  document.documentElement.classList.add('\x63\x6c\x70\x78\x2d\x68\x74\x6d\x6c\x2d\x6c\x6f\x63\x6b');
  if (document.body) document.body.style.overflow = '\x68\x69\x64\x64\x65\x6e';

  updateOverlayMode();
  updateOverlaySessionNote();
  updateLockoutBanner();

  if (!wasVisible) {
    scheduleOverlayPrimaryFocus(false, 30);
  }

  if (!heartbeatTimer) {
    heartbeatTimer = window.setInterval(() => {
      handleLocationChange();
      if (shouldLockCurrentPage()) enforceOverlayIntegrity();
      ensureBlurArtifacts();
      syncPageIdentityMask();
    }, 800);
  }
}

function hideOverlay() {
  if (!overlay) return;

  clearOverlayFocusTimer();
  biometricPending = false;
  overlay.style.display = '\x6e\x6f\x6e\x65';
  document.documentElement.style.overflow = '';
  document.documentElement.classList.remove('\x63\x6c\x70\x78\x2d\x68\x74\x6d\x6c\x2d\x6c\x6f\x63\x6b');
  if (document.body) document.body.style.overflow = '';
}

function syncUI() {
  if (shouldLockCurrentPage()) {
    showOverlay();
    syncPageIdentityMask();
    return;
  }

  hideOverlay();
  ensureBlurArtifacts();
  syncPageIdentityMask();
}

function handleLocationChange(force = false) {
  if (!force && location.href === lastObservedUrl) return;

  lastObservedUrl = location.href;
  stopBlurSelection(false);
  stopRegionInteraction({ save: false });
  clearActiveProfileAccess();
  loadPersistedBlurRegions().catch(() => {
    blurRegions = [];
    renderBlurRegions();
  });
  syncUI();
}

async function init() {
  try {
    await i18n.ready();
    const [state] = await Promise.all([
      chrome.runtime.sendMessage({ type: '\x47\x45\x54\x5f\x53\x54\x41\x54\x45' }),
      loadPersistedBlurRegions()
    ]);

    if (state?.ok) {
      currentState = {
        isLocked: !!state.isLocked,
        whitelist: state.whitelist || [],
        failedAttempts: state.failedAttempts || 0,
        lockoutUntil: state.lockoutUntil || 0,
        maxAttempts: state.maxAttempts || 5,
        unlockSessionMinutes: state.unlockSessionMinutes || 0,
        unlockUntil: state.unlockUntil || 0,
        requiresPasswordSetup: !!state.requiresPasswordSetup,
        defaultRegionMode: normalizeRegionMode(state.defaultRegionMode, '\x62\x6c\x75\x72'),
        maskPageIdentity: !!state.maskPageIdentity,
        domainProfiles: Array.isArray(state.domainProfiles) ? state.domainProfiles : [],
        requirePasswordOnDomainChange: typeof state.requirePasswordOnDomainChange === '\x62\x6f\x6f\x6c\x65\x61\x6e'
          ? state.requirePasswordOnDomainChange
          : true,
        sessionAccessHosts: normalizeSessionAccessHosts(state.sessionAccessHosts),
        biometricConfigured: !!state.biometricConfigured
      };
      stateInitialized = true;
    }

    lastObservedUrl = location.href;
    syncUI();
  } catch {
    stateInitialized = false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === '\x4c\x4f\x43\x4b\x5f\x53\x54\x41\x54\x45\x5f\x43\x48\x41\x4e\x47\x45\x44') {
    const wasLocked = currentState.isLocked;
    const previousProfileId = getActiveProfile()?.id || '';
    biometricPending = false;
    currentState = {
      isLocked: !!message.isLocked,
      whitelist: message.whitelist || [],
      failedAttempts: message.failedAttempts || 0,
      lockoutUntil: message.lockoutUntil || 0,
      maxAttempts: message.maxAttempts || 5,
      unlockSessionMinutes: message.unlockSessionMinutes || 0,
      unlockUntil: message.unlockUntil || 0,
      requiresPasswordSetup: !!message.requiresPasswordSetup,
      defaultRegionMode: normalizeRegionMode(message.defaultRegionMode, '\x62\x6c\x75\x72'),
      maskPageIdentity: !!message.maskPageIdentity,
      domainProfiles: Array.isArray(message.domainProfiles) ? message.domainProfiles : [],
      requirePasswordOnDomainChange: typeof message.requirePasswordOnDomainChange === '\x62\x6f\x6f\x6c\x65\x61\x6e'
        ? message.requirePasswordOnDomainChange
        : true,
      sessionAccessHosts: normalizeSessionAccessHosts(message.sessionAccessHosts),
      biometricConfigured: !!message.biometricConfigured
    };
    stateInitialized = true;
    const nextProfileId = getActiveProfile()?.id || '';

    if ((!wasLocked && currentState.isLocked) || currentState.requiresPasswordSetup || previousProfileId !== nextProfileId) {
      clearActiveProfileAccess();
    }

    syncUI();
    sendResponse?.({ ok: true });
    return;
  }

  if (message.type === '\x42\x49\x4f\x4d\x45\x54\x52\x49\x43\x5f\x41\x55\x54\x48\x5f\x52\x45\x53\x55\x4c\x54') {
    biometricPending = false;
    updateBiometricButtonState();

    if (message.success) {
      if (message.mode === '\x70\x72\x6f\x66\x69\x6c\x65') {
        const activeProfile = getActiveProfile();
        grantActiveProfileAccess(
          activeProfile,
          Number.isFinite(Number(message.pageUnlockMinutes))
            ? Number(message.pageUnlockMinutes)
            : getEffectivePageUnlockMinutes(activeProfile)
        );
        hideOverlay();
      }
    } else if (overlay) {
      const errorNode = overlay.querySelector('\x23\x63\x6c\x70\x78\x2d\x65\x72\x72\x6f\x72');
      if (errorNode) {
        errorNode.textContent = message.error || t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x6f\x76\x65\x72\x6c\x61\x79\x2e\x65\x72\x72\x6f\x72\x2e\x62\x69\x6f\x6d\x65\x74\x72\x69\x63\x5f\x66\x61\x69\x6c\x65\x64');
      }
    }

    sendResponse?.({ ok: true });
    return;
  }

  if (message.type === '\x53\x54\x41\x52\x54\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x5f\x53\x45\x4c\x45\x43\x54\x49\x4f\x4e') {
    sendResponse(startBlurSelection());
    return;
  }

  if (message.type === '\x43\x4c\x45\x41\x52\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x53') {
    clearBlurRegions();
    sendResponse(getBlurRegionState());
    return;
  }

  if (message.type === '\x47\x45\x54\x5f\x42\x4c\x55\x52\x5f\x52\x45\x47\x49\x4f\x4e\x5f\x53\x54\x41\x54\x45') {
    sendResponse(getBlurRegionState());
  }
});

const observer = new MutationObserver(() => {
  scheduleUiSync();
});

observer.observe(document, { childList: true, subtree: true });

window.addEventListener('\x70\x61\x67\x65\x73\x68\x6f\x77', () => {
  handleLocationChange(true);
}, true);
window.addEventListener('\x66\x6f\x63\x75\x73', () => {
  handleLocationChange();
  syncUI();
}, true);
document.addEventListener('\x76\x69\x73\x69\x62\x69\x6c\x69\x74\x79\x63\x68\x61\x6e\x67\x65', () => {
  handleLocationChange();
  syncUI();
}, true);

i18n.onChange(() => {
  if (selectionHint) {
    selectionHint.textContent = t('\x63\x6f\x6e\x74\x65\x6e\x74\x2e\x73\x65\x6c\x65\x63\x74\x69\x6f\x6e\x2e\x68\x69\x6e\x74', {
      mode: regionModeLowerLabel(getEffectiveRegionMode())
    });
  }
  renderBlurRegions();
  updateOverlayMode();
  updateOverlaySessionNote();
  updateLockoutBanner();
  syncPageIdentityMask();
});

init();
