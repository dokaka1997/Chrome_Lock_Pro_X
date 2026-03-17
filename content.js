let overlay = null;
let heartbeatTimer = null;
let overlayFocusTimer = null;
let unlocking = false;
let biometricPending = false;
let lastTamperReportAt = 0;
let lastTamperAction = '';
const i18n = globalThis.CLPX_I18N;
const REGION_MODES = ['blur', 'blackout', 'pixelate'];
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
  defaultRegionMode: 'blur',
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

function normalizeRegionMode(value, fallback = 'blur') {
  const normalized = String(value || '').trim().toLowerCase();
  return REGION_MODES.includes(normalized) ? normalized : fallback;
}

function regionModeLabel(mode) {
  const normalized = normalizeRegionMode(mode, 'blur');
  return t(`common.mode.${normalized}`);
}

function regionModeLowerLabel(mode) {
  const normalized = normalizeRegionMode(mode, 'blur');
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
  return normalizeRegionMode(activeProfile?.regionMode, normalizeRegionMode(currentState.defaultRegionMode, 'blur'));
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
  if (currentState.requiresPasswordSetup) return false;

  const activeProfile = getActiveProfile();
  const globalLocked = isGlobalLockActiveForCurrentPage(activeProfile);
  return globalLocked || isProfilePolicyLocked(activeProfile);
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
    : t('common.session.until_locked');
}

function getSelectedSessionMinutes() {
  if (!overlay) return -1;
  return Number(overlay.dataset.sessionMinutes || '-1');
}

function setSelectedSessionMinutes(value) {
  if (!overlay) return;

  const normalized = Number.isFinite(Number(value)) ? Number(value) : -1;
  overlay.dataset.sessionMinutes = String(normalized);

  overlay.querySelectorAll('.clpx-session-option').forEach((button) => {
    button.classList.toggle('is-active', Number(button.dataset.sessionValue) === normalized);
  });
}

function updateBiometricButtonState() {
  if (!overlay) return;

  const biometricButton = overlay.querySelector('#clpx-biometric-btn');
  if (!biometricButton) return;

  const shouldShow = !!currentState.biometricConfigured && !currentState.requiresPasswordSetup;
  biometricButton.style.display = shouldShow ? 'block' : 'none';
  biometricButton.disabled = biometricPending;
  biometricButton.textContent = biometricPending
    ? t('content.overlay.button.biometric_waiting')
    : t('content.overlay.button.biometric');
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

  const passwordInput = overlay.querySelector('#clpx-pass');
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
      type: 'REPORT_TAMPER',
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

  const modeButton = element.querySelector('.clpx-blur-mode');
  if (modeButton) {
    const currentMode = normalizeRegionMode(region.mode, getEffectiveRegionMode());
    modeButton.textContent = regionModeLabel(currentMode);
    modeButton.dataset.mode = currentMode;
    modeButton.title = t('content.region.mode_switch');
  }
}

function ensureBlurRoot() {
  if (blurRoot && document.documentElement.contains(blurRoot)) {
    return blurRoot;
  }

  blurRoot = document.createElement('div');
  blurRoot.id = 'clpx-blur-root';
  document.documentElement.appendChild(blurRoot);
  return blurRoot;
}

async function legacyPersistBlurRegions() {
  if (!isLockablePage()) return { ok: false, error: 'Trang hiện tại không hỗ trợ blur region.' };

  try {
    return await chrome.runtime.sendMessage({
      type: 'SAVE_BLUR_REGIONS_FOR_URL',
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
    return { ok: false, error: 'Không lưu được blur regions.' };
  }
}

async function persistBlurRegions() {
  if (!isLockablePage()) {
    return { ok: false, error: t('content.selection.unsupported_page') };
  }

  try {
    return await chrome.runtime.sendMessage({
      type: 'SAVE_BLUR_REGIONS_FOR_URL',
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
    return { ok: false, error: t('content.region.save_failed') };
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
      type: 'GET_BLUR_REGIONS_FOR_URL',
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

  window.removeEventListener('pointermove', regionInteractionState.handlePointerMove, true);
  window.removeEventListener('pointerup', regionInteractionState.handlePointerUp, true);
  window.removeEventListener('pointercancel', regionInteractionState.handlePointerCancel, true);

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

    if (mode === 'move') {
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

  window.addEventListener('pointermove', state.handlePointerMove, true);
  window.addEventListener('pointerup', state.handlePointerUp, true);
  window.addEventListener('pointercancel', state.handlePointerCancel, true);
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
  const regionElement = document.createElement('div');
  const modeButton = document.createElement('button');
  const removeButton = document.createElement('button');
  const resizeHandle = document.createElement('div');

  regionElement.className = 'clpx-blur-region';
  regionElement.dataset.regionId = region.id;

  modeButton.className = 'clpx-blur-mode';
  modeButton.type = 'button';
  modeButton.title = t('content.region.mode_switch');
  modeButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    cycleBlurRegionMode(region.id);
  });

  removeButton.className = 'clpx-blur-remove';
  removeButton.type = 'button';
  removeButton.textContent = '×';
  removeButton.title = t('content.region.remove');
  removeButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeBlurRegion(region.id);
  });

  resizeHandle.className = 'clpx-blur-resize';
  resizeHandle.title = t('content.region.resize');
  resizeHandle.addEventListener('pointerdown', (event) => {
    startRegionInteraction(region.id, 'resize', event);
  });

  regionElement.addEventListener('pointerdown', (event) => {
    if (event.target === modeButton || event.target === removeButton || event.target === resizeHandle) return;
    startRegionInteraction(region.id, 'move', event);
  });

  ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach((eventName) => {
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
  selectionBox.style.display = 'block';
  selectionBox.style.left = `${rect.left}px`;
  selectionBox.style.top = `${rect.top}px`;
  selectionBox.style.width = `${rect.width}px`;
  selectionBox.style.height = `${rect.height}px`;
}

function teardownSelectionLayer() {
  if (!selectionState) return;

  selectionLayer?.removeEventListener('pointerdown', selectionState.handlePointerDown, true);
  selectionLayer?.removeEventListener('pointermove', selectionState.handlePointerMove, true);
  selectionLayer?.removeEventListener('pointerup', selectionState.handlePointerUp, true);
  selectionLayer?.removeEventListener('pointercancel', selectionState.handlePointerCancel, true);
  window.removeEventListener('keydown', selectionState.handleKeyDown, true);

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
    return { ok: false, error: t('content.selection.unsupported_page') };
  }

  if (shouldLockCurrentPage()) {
    return { ok: false, error: t('content.selection.locked_page') };
  }

  if (selectionLayer) {
    return { ok: false, error: t('content.selection.already_active') };
  }

  selectionLayer = document.createElement('div');
  selectionLayer.id = 'clpx-blur-selection-layer';

  selectionHint = document.createElement('div');
  selectionHint.className = 'clpx-selection-hint';
  selectionHint.textContent = t('content.selection.hint', {
    mode: regionModeLowerLabel(getEffectiveRegionMode())
  });

  selectionBox = document.createElement('div');
  selectionBox.className = 'clpx-selection-box';

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
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    stopBlurSelection(false);
  };

  selectionLayer.addEventListener('pointerdown', selectionState.handlePointerDown, true);
  selectionLayer.addEventListener('pointermove', selectionState.handlePointerMove, true);
  selectionLayer.addEventListener('pointerup', selectionState.handlePointerUp, true);
  selectionLayer.addEventListener('pointercancel', selectionState.handlePointerCancel, true);
  window.addEventListener('keydown', selectionState.handleKeyDown, true);

  return { ok: true };
}

function getBlurRegionState() {
  const activeProfile = getActiveProfile();
  return {
    ok: true,
    count: blurRegions.length,
    selectionActive: !!selectionLayer,
    activeMode: getEffectiveRegionMode(),
    defaultMode: normalizeRegionMode(currentState.defaultRegionMode, 'blur'),
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
    .from(document.head.querySelectorAll("link[rel~='icon']"))
    .map((node) => node.cloneNode(true));
}

function clearCurrentFavicons() {
  if (!document.head) return;

  Array
    .from(document.head.querySelectorAll("link[rel~='icon'], link[data-clpx-mask-icon='true']"))
    .forEach((node) => node.remove());
}

function applyPageIdentityMask() {
  if (!document.head) return;

  if (!identityMaskApplied) {
    snapshotPageIdentity();
  }

  document.title = t('content.page_mask_title');
  clearCurrentFavicons();

  const maskLink = document.createElement('link');
  maskLink.rel = 'icon';
  maskLink.type = 'image/svg+xml';
  maskLink.href = MASKED_FAVICON_URL;
  maskLink.dataset.clpxMaskIcon = 'true';
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
    overlay.querySelector('#clpx-pass') &&
    overlay.querySelector('#clpx-btn') &&
    overlay.querySelector('#clpx-biometric-btn') &&
    overlay.querySelector('#clpx-session-options') &&
    overlay.querySelector('#clpx-pass-confirm')
  ) {
    return overlay;
  }

  if (overlay) {
    overlay.remove();
    overlay = null;
  }

  overlay = document.createElement('div');
  overlay.id = 'clpx-overlay';
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

  const passwordInput = overlay.querySelector('#clpx-pass');
  const confirmInput = overlay.querySelector('#clpx-pass-confirm');
  const submitButton = overlay.querySelector('#clpx-btn');
  const biometricButton = overlay.querySelector('#clpx-biometric-btn');
  const errorNode = overlay.querySelector('#clpx-error');
  const sessionButtons = [...overlay.querySelectorAll('.clpx-session-option')];
  const languageToggleButton = overlay.querySelector('#clpx-lang-btn');

  setSelectedSessionMinutes(-1);

  overlay.addEventListener('focusin', clearOverlayFocusTimer, true);

  languageToggleButton?.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await i18n.toggleLanguage();
  });

  ['mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach((eventName) => {
    languageToggleButton?.addEventListener(eventName, (event) => {
      event.stopPropagation();
    });
  });

  sessionButtons.forEach((button) => {
    ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        clearOverlayFocusTimer();
        event.stopPropagation();
      });
    });

    button.addEventListener('click', () => {
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
          errorNode.textContent = t('content.overlay.error.short_password');
          passwordInput.focus();
          return;
        }

        if (passwordInput.value !== confirmInput.value) {
          errorNode.textContent = t('content.overlay.error.mismatch');
          confirmInput.focus();
          return;
        }

        const setupResponse = await chrome.runtime.sendMessage({
          type: 'SET_INITIAL_PASSWORD',
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

        errorNode.textContent = setupResponse?.error || t('content.overlay.error.setup_failed');
        return;
      }

      const unlockResponse = await chrome.runtime.sendMessage(
        profileLockOnly
          ? {
              type: 'VERIFY_PASSWORD_ONLY',
              password: passwordInput.value,
              url: location.href,
              sessionMinutes: pageUnlockMinutes,
              useDefaultSession
            }
          : {
              type: 'UNLOCK_WITH_PASSWORD',
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
        errorNode.textContent = t('content.overlay.error.try_after', {
          error: unlockResponse.error,
          time: formatRemaining(unlockResponse.remainingMs)
        });
      } else if (typeof unlockResponse?.failedAttempts === 'number') {
        errorNode.textContent = t('content.overlay.error.failed_attempts', {
          error: unlockResponse.error,
          attempts: unlockResponse.failedAttempts,
          maxAttempts: unlockResponse.maxAttempts
        });
      } else {
        errorNode.textContent = unlockResponse?.error || t('content.overlay.error.unlock_failed');
      }

      passwordInput.value = '';
      passwordInput.focus();
    } catch {
      errorNode.textContent = t('content.overlay.error.no_response');
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
        type: 'BEGIN_BIOMETRIC_UNLOCK',
        url: location.href,
        pageOnly: profileLockOnly,
        sessionMinutes: profileLockOnly ? pageUnlockMinutes : sessionMinutes,
        useDefaultSession
      });

      if (!response?.ok) {
        biometricPending = false;
        updateBiometricButtonState();
        errorNode.textContent = response?.error || t('content.overlay.error.biometric_failed');
      }
    } catch {
      biometricPending = false;
      updateBiometricButtonState();
      errorNode.textContent = t('content.overlay.error.no_response');
    }
  }

  submitButton.addEventListener('click', submitUnlock);
  biometricButton?.addEventListener('click', startBiometricUnlock);

  [submitButton, biometricButton].forEach((button) => {
    if (!button) return;

    ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'touchstart', 'touchend'].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });
  });

  [passwordInput, confirmInput].forEach((input) => {
    ['mousedown', 'mouseup', 'click', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'keydown', 'keyup', 'keypress'].forEach((eventName) => {
      input.addEventListener(eventName, (event) => {
        clearOverlayFocusTimer();
        event.stopPropagation();
      });
    });

    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') submitUnlock();
    }, true);
  });

  ['keydown', 'keyup', 'keypress', 'contextmenu'].forEach((eventName) => {
    overlay.addEventListener(eventName, (event) => {
      event.stopPropagation();
      if (eventName === 'contextmenu') event.preventDefault();
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
  const productChip = overlay.querySelector('#clpx-chip-product');
  const protectedChip = overlay.querySelector('#clpx-chip-protected');
  const languageButton = overlay.querySelector('#clpx-lang-btn');
  const languageLabel = overlay.querySelector('#clpx-lang-label');
  const title = overlay.querySelector('#clpx-title');
  const subtitle = overlay.querySelector('#clpx-sub');
  const passwordInput = overlay.querySelector('#clpx-pass');
  const confirmInput = overlay.querySelector('#clpx-pass-confirm');
  const submitButton = overlay.querySelector('#clpx-btn');
  const biometricButton = overlay.querySelector('#clpx-biometric-btn');
  const setupNote = overlay.querySelector('#clpx-setup-note');
  const sessionLabel = overlay.querySelector('#clpx-session-label');
  const hint = overlay.querySelector('#clpx-hint');
  const sessionButtons = overlay.querySelectorAll('.clpx-session-option');

  if (productChip) productChip.textContent = t('content.overlay.chip.product');
  if (protectedChip) protectedChip.textContent = t('content.overlay.chip.protected');
  if (languageButton) {
    languageButton.title = t('common.language.switch');
    languageButton.setAttribute('aria-label', t('common.language.switch'));
  }
  if (languageLabel) {
    languageLabel.textContent = t(`common.language.short.${i18n.getLanguage()}`);
  }
  if (sessionLabel) {
    sessionLabel.textContent = t('content.overlay.session_label');
  }
  if (hint) {
    hint.textContent = t('content.overlay.hint');
  }
  if (sessionButtons[0]) sessionButtons[0].textContent = t('common.label.default');
  if (sessionButtons[1]) sessionButtons[1].textContent = t('common.label.unlimited');

  if (currentState.requiresPasswordSetup) {
    if (title) title.textContent = t('content.overlay.title.setup');
    if (subtitle) subtitle.textContent = t('content.overlay.subtitle.setup');
    if (passwordInput) passwordInput.placeholder = t('content.overlay.input.new_password');
    if (confirmInput) {
      confirmInput.placeholder = t('content.overlay.input.confirm_password');
      confirmInput.style.display = 'block';
    }
    if (setupNote) {
      setupNote.style.display = 'block';
      setupNote.textContent = t('content.overlay.setup_note');
    }
    if (submitButton) submitButton.textContent = t('content.overlay.button.setup');
    if (biometricButton) biometricButton.style.display = 'none';
    return;
  }

  if (profileLockedOnly) {
    if (title) title.textContent = t('content.overlay.title.profile');
    if (subtitle) {
      subtitle.textContent = t('content.overlay.subtitle.profile', {
        name: activeProfile?.name || 'Profile'
      });
    }
  } else {
    if (title) title.textContent = t('content.overlay.title.locked');
    if (subtitle) subtitle.textContent = t('content.overlay.subtitle.locked');
  }
  if (passwordInput) passwordInput.placeholder = t('content.overlay.input.password');
  if (confirmInput) {
    confirmInput.style.display = 'none';
  }
  if (setupNote) {
    setupNote.style.display = 'none';
    setupNote.textContent = '';
  }
  if (submitButton && !submitButton.disabled) {
    submitButton.textContent = t('content.overlay.button.unlock');
  }
  updateBiometricButtonState();
}

function legacyUpdateOverlayMode() {
  if (!overlay) return;

  const title = overlay.querySelector('#clpx-title');
  const subtitle = overlay.querySelector('#clpx-sub');
  const passwordInput = overlay.querySelector('#clpx-pass');
  const confirmInput = overlay.querySelector('#clpx-pass-confirm');
  const submitButton = overlay.querySelector('#clpx-btn');
  const setupNote = overlay.querySelector('#clpx-setup-note');

  if (currentState.requiresPasswordSetup) {
    title.textContent = 'Thiết lập mật khẩu lần đầu';
    subtitle.textContent = 'Extension chưa có mật khẩu. Hãy tạo mật khẩu mới để bắt đầu sử dụng.';
    passwordInput.placeholder = 'Tạo mật khẩu mới';
    confirmInput.style.display = 'block';
    setupNote.style.display = 'block';
    setupNote.textContent = 'Sau khi thiết lập, tab sẽ được mở khóa ngay bằng session bạn đã chọn.';
    submitButton.textContent = 'Thiết lập và mở khóa';
    applyOverlayLocalizedText();
    return;
  }

  title.textContent = 'Trình duyệt đang bị khóa';
  subtitle.textContent = 'Nhập mật khẩu để tiếp tục. Overlay sẽ tự phục hồi nếu page script cố gỡ khỏi DOM.';
  passwordInput.placeholder = 'Nhập mật khẩu';
  confirmInput.style.display = 'none';
  setupNote.style.display = 'none';
  setupNote.textContent = '';
  submitButton.textContent = 'Mở khóa';
  applyOverlayLocalizedText();
}

function updateOverlayMode() {
  if (!overlay) return;
  applyOverlayLocalizedText();
}

function updateOverlaySessionNote() {
  if (!overlay) return;

  const noteNode = overlay.querySelector('#clpx-session-note');
  if (!noteNode) return;

  const selectedValue = getSelectedSessionMinutes();
  let selectedLabel = t('content.overlay.session_note.default', {
    session: defaultSessionLabel()
  });

  if (selectedValue === 0) {
    selectedLabel = t('content.overlay.session_note.unlimited');
  } else if (selectedValue > 0) {
    selectedLabel = t('content.overlay.session_note.minutes', { minutes: selectedValue });
  }

  noteNode.textContent = selectedLabel;
}

function updateLockoutBanner() {
  if (!overlay) return;

  const lockoutNode = overlay.querySelector('#clpx-lockout');
  const passwordInput = overlay.querySelector('#clpx-pass');
  const confirmInput = overlay.querySelector('#clpx-pass-confirm');
  const submitButton = overlay.querySelector('#clpx-btn');
  const biometricButton = overlay.querySelector('#clpx-biometric-btn');
  const sessionButtons = overlay.querySelectorAll('.clpx-session-option');
  const remainingMs = Math.max(0, Number(currentState.lockoutUntil || 0) - Date.now());
  const lockedOut = !currentState.requiresPasswordSetup && remainingMs > 0;
  const allowBiometric = lockedOut && !!currentState.biometricConfigured;

  lockoutNode.style.display = lockedOut ? 'block' : 'none';
  lockoutNode.textContent = lockedOut
    ? t('content.overlay.lockout', { time: formatRemaining(remainingMs) })
    : '';

  passwordInput.disabled = lockedOut;
  confirmInput.disabled = lockedOut;
  submitButton.disabled = lockedOut;
  sessionButtons.forEach((button) => {
    button.disabled = lockedOut && !allowBiometric;
  });
  if (biometricButton) biometricButton.disabled = biometricPending;

  if (!currentState.requiresPasswordSetup) {
    submitButton.textContent = lockedOut ? t('content.overlay.button.waiting') : t('content.overlay.button.unlock');
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
    reportTamper('overlay-detached');
  }

  if (element.style.display !== 'flex') {
    element.style.display = 'flex';
    restored = true;
    reportTamper('overlay-hidden');
  }

  if (element.style.position !== 'fixed') {
    element.style.position = 'fixed';
    element.style.inset = '0';
    element.style.zIndex = '2147483647';
    restored = true;
    reportTamper('overlay-restyled');
  }

  if (!document.documentElement.classList.contains('clpx-html-lock')) {
    document.documentElement.classList.add('clpx-html-lock');
    restored = true;
  }

  if (document.body && document.body.style.overflow !== 'hidden') {
    document.body.style.overflow = 'hidden';
  }

  document.documentElement.style.overflow = 'hidden';
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
  const wasVisible = element.style.display === 'flex';
  element.style.display = 'flex';
  element.style.position = 'fixed';
  element.style.inset = '0';
  element.style.zIndex = '2147483647';
  document.documentElement.style.overflow = 'hidden';
  document.documentElement.classList.add('clpx-html-lock');
  if (document.body) document.body.style.overflow = 'hidden';

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
  overlay.style.display = 'none';
  document.documentElement.style.overflow = '';
  document.documentElement.classList.remove('clpx-html-lock');
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
      chrome.runtime.sendMessage({ type: 'GET_STATE' }),
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
        defaultRegionMode: normalizeRegionMode(state.defaultRegionMode, 'blur'),
        maskPageIdentity: !!state.maskPageIdentity,
        domainProfiles: Array.isArray(state.domainProfiles) ? state.domainProfiles : [],
        requirePasswordOnDomainChange: typeof state.requirePasswordOnDomainChange === 'boolean'
          ? state.requirePasswordOnDomainChange
          : true,
        sessionAccessHosts: normalizeSessionAccessHosts(state.sessionAccessHosts),
        biometricConfigured: !!state.biometricConfigured
      };
    }

    lastObservedUrl = location.href;
    syncUI();
  } catch {
    // ignore initialization failures
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOCK_STATE_CHANGED') {
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
      defaultRegionMode: normalizeRegionMode(message.defaultRegionMode, 'blur'),
      maskPageIdentity: !!message.maskPageIdentity,
      domainProfiles: Array.isArray(message.domainProfiles) ? message.domainProfiles : [],
      requirePasswordOnDomainChange: typeof message.requirePasswordOnDomainChange === 'boolean'
        ? message.requirePasswordOnDomainChange
        : true,
      sessionAccessHosts: normalizeSessionAccessHosts(message.sessionAccessHosts),
      biometricConfigured: !!message.biometricConfigured
    };
    const nextProfileId = getActiveProfile()?.id || '';

    if ((!wasLocked && currentState.isLocked) || currentState.requiresPasswordSetup || previousProfileId !== nextProfileId) {
      clearActiveProfileAccess();
    }

    syncUI();
    sendResponse?.({ ok: true });
    return;
  }

  if (message.type === 'BIOMETRIC_AUTH_RESULT') {
    biometricPending = false;
    updateBiometricButtonState();

    if (message.success) {
      if (message.mode === 'profile') {
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
      const errorNode = overlay.querySelector('#clpx-error');
      if (errorNode) {
        errorNode.textContent = message.error || t('content.overlay.error.biometric_failed');
      }
    }

    sendResponse?.({ ok: true });
    return;
  }

  if (message.type === 'START_BLUR_REGION_SELECTION') {
    sendResponse(startBlurSelection());
    return;
  }

  if (message.type === 'CLEAR_BLUR_REGIONS') {
    clearBlurRegions();
    sendResponse(getBlurRegionState());
    return;
  }

  if (message.type === 'GET_BLUR_REGION_STATE') {
    sendResponse(getBlurRegionState());
  }
});

const observer = new MutationObserver(() => {
  if (shouldLockCurrentPage()) {
    enforceOverlayIntegrity();
  }
  ensureBlurArtifacts();
  syncPageIdentityMask();
});

observer.observe(document, { childList: true, subtree: true });

window.addEventListener('pageshow', () => {
  handleLocationChange(true);
}, true);
window.addEventListener('focus', () => {
  handleLocationChange();
  syncUI();
}, true);
document.addEventListener('visibilitychange', () => {
  handleLocationChange();
  syncUI();
}, true);

i18n.onChange(() => {
  if (selectionHint) {
    selectionHint.textContent = t('content.selection.hint', {
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
