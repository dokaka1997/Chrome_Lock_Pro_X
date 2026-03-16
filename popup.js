const i18n = globalThis.CLPX_I18N;

const heroTitle = document.getElementById('heroTitle');
const heroText = document.getElementById('heroText');
const signal = document.getElementById('signal');
const autoLock = document.getElementById('autoLock');
const sessionState = document.getElementById('sessionState');
const blurLock = document.getElementById('blurLock');
const blurZones = document.getElementById('blurZones');
const whitelistCount = document.getElementById('whitelistCount');
const attempts = document.getElementById('attempts');
const sessionNote = document.getElementById('sessionNote');
const toolMsg = document.getElementById('toolMsg');
const lockNowBtn = document.getElementById('lockNowBtn');
const sessionBtn = document.getElementById('sessionBtn');
const blurRegionBtn = document.getElementById('blurRegionBtn');
const clearRegionsBtn = document.getElementById('clearRegionsBtn');
const optionsBtn = document.getElementById('optionsBtn');
const blurModeBtn = document.getElementById('blurModeBtn');
const blackoutModeBtn = document.getElementById('blackoutModeBtn');
const pixelateModeBtn = document.getElementById('pixelateModeBtn');
const languageBtn = document.getElementById('languageBtn');
const languageBtnLabel = document.getElementById('languageBtnLabel');

const modeButtons = {
  blur: blurModeBtn,
  blackout: blackoutModeBtn,
  pixelate: pixelateModeBtn
};

let currentState = null;
let currentBlurState = { ok: true, count: 0, selectionActive: false };
let ticker = null;

function t(key, values) {
  return i18n.t(key, values);
}

function setToolMessage(text, isError = false) {
  toolMsg.textContent = text;
  toolMsg.classList.toggle('error', isError);
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

function formatDefaultSession(minutes) {
  return minutes > 0
    ? `${minutes} ${t('common.label.minutes_short')}`
    : t('common.session.indefinite');
}

function regionModeLabel(mode) {
  return t(`common.mode.${mode || 'blur'}`);
}

function formatProfileMinutes(minutes) {
  return minutes > 0
    ? `${minutes} ${t('common.label.minutes_short')}`
    : t('common.session.indefinite');
}

function formatProfilePolicies(blurState) {
  const policies = [];

  if (blurState?.profileForceLock) {
    policies.push(t('popup.tool.profile_flag.force_lock'));
  }
  if (blurState?.profileReAuthOnVisit) {
    policies.push(t('popup.tool.profile_flag.reauth'));
  }
  if (blurState?.profileBypassGlobalLock) {
    policies.push(t('popup.tool.profile_flag.bypass'));
  }
  if ((blurState?.profileForceLock || blurState?.profileReAuthOnVisit) && typeof blurState?.profilePageUnlockMinutes === 'number') {
    policies.push(
      blurState.profilePageUnlockMinutes > 0
        ? t('popup.tool.profile_flag.page_unlock', {
            minutes: formatProfileMinutes(blurState.profilePageUnlockMinutes)
          })
        : t('popup.tool.profile_flag.page_unlock_indefinite')
    );
  }
  if (typeof blurState?.effectiveSessionMinutes === 'number') {
    policies.push(t('popup.tool.profile_flag.default_session', {
      minutes: formatProfileMinutes(blurState.effectiveSessionMinutes)
    }));
  }
  if (blurState?.titleMasked) {
    policies.push(t('popup.tool.profile_flag.masked'));
  }

  return policies.join(', ');
}

function renderModeButtons(selectedMode) {
  Object.entries(modeButtons).forEach(([mode, button]) => {
    button.classList.toggle('is-active', mode === selectedMode);
  });
}

function applyStaticTranslations() {
  document.title = t('popup.document_title');
  languageBtn.title = t('common.language.switch');
  languageBtn.setAttribute('aria-label', t('common.language.switch'));
  languageBtnLabel.textContent = t(`common.language.short.${i18n.getLanguage()}`);

  document.getElementById('autoLockLabel').textContent = t('common.label.auto_lock');
  document.getElementById('sessionLabel').textContent = t('common.label.session');
  document.getElementById('blurLockLabel').textContent = t('common.label.blur_lock');
  document.getElementById('blurZonesLabel').textContent = t('common.label.blur_zones');
  document.getElementById('whitelistLabel').textContent = t('common.label.whitelist');
  document.getElementById('attemptsLabel').textContent = t('common.label.attempts');
  document.getElementById('modeLabel').textContent = t('popup.tool.default_region_label');
  blurModeBtn.textContent = t('common.mode.blur');
  blackoutModeBtn.textContent = t('common.mode.blackout');
  pixelateModeBtn.textContent = t('common.mode.pixelate');
  blurRegionBtn.textContent = t('common.action.new_region');
  clearRegionsBtn.textContent = t('common.action.clear_regions');
  optionsBtn.textContent = t('common.action.open_settings');
  document.getElementById('hotkeyPrefix').textContent = t('common.note.default_hotkey');
  toolMsg.textContent = toolMsg.textContent || t('popup.tool.saved_by_domain');
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function sendMessageToActiveTab(message) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return { ok: false, error: t('popup.error.no_tab') };
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response || { ok: false, error: t('popup.error.no_response') };
  } catch {
    return {
      ok: false,
      error: t('popup.error.unsupported_page')
    };
  }
}

function render(state, blurState) {
  applyStaticTranslations();

  const locked = !!state.isLocked;
  const requiresSetup = !!state.requiresPasswordSetup;
  const hasTemporarySession = !locked && Number(state.unlockUntil || 0) > Date.now();
  const sessionRemainingMs = Math.max(0, Number(state.unlockUntil || 0) - Date.now());
  const blurCount = blurState?.ok ? Number(blurState.count || 0) : 0;
  const defaultMode = state.defaultRegionMode || 'blur';
  const activeMode = blurState?.activeMode || defaultMode;
  const activeProfileName = blurState?.activeProfileName || '';
  const effectiveSessionMinutes = Number.isFinite(Number(blurState?.effectiveSessionMinutes))
    ? Number(blurState.effectiveSessionMinutes)
    : Number(state.unlockSessionMinutes || 0);

  renderModeButtons(defaultMode);

  if (requiresSetup) {
    heroTitle.textContent = t('popup.hero.setup_title');
    heroText.textContent = t('popup.hero.setup_text');
  } else {
    heroTitle.textContent = locked ? t('popup.hero.locked_title') : t('popup.hero.unlocked_title');
    heroText.textContent = locked
      ? t('popup.hero.locked_text')
      : hasTemporarySession
        ? t('popup.hero.relock_text', { time: formatRemaining(sessionRemainingMs) })
        : t('popup.hero.open_text');
  }

  signal.style.background = locked ? '#ef4444' : '#22c55e';
  signal.style.boxShadow = locked
    ? '0 0 0 6px rgba(239,68,68,0.15)'
    : '0 0 0 6px rgba(34,197,94,0.15)';

  autoLock.textContent = `${state.autoLockMinutes} ${t('common.label.minutes_short')}`;
  sessionState.textContent = locked
    ? (requiresSetup ? t('common.status.setup') : t('common.status.locked'))
    : hasTemporarySession
      ? formatRemaining(sessionRemainingMs)
      : t('common.status.open');
  blurLock.textContent = state.lockOnWindowBlur ? t('common.status.on') : t('common.status.off');
  blurZones.textContent = `${blurCount}`;
  whitelistCount.textContent = `${(state.whitelist || []).length}`;
  attempts.textContent = `${state.failedAttempts || 0}/${state.maxAttempts || 5}`;

  lockNowBtn.disabled = locked;
  sessionBtn.disabled = locked || requiresSetup;
  lockNowBtn.textContent = t('common.action.panic_lock');
  sessionBtn.textContent = locked
    ? t('common.action.unlock_on_page')
    : hasTemporarySession
      ? t('common.action.keep_open')
      : t('common.action.session_15m');

  blurRegionBtn.disabled = !!blurState?.selectionActive || locked || requiresSetup;
  clearRegionsBtn.disabled = blurCount === 0;

  sessionNote.textContent = requiresSetup
    ? t('popup.session.note.setup')
    : locked
      ? t('popup.session.note.locked', { session: formatDefaultSession(effectiveSessionMinutes) })
      : hasTemporarySession
        ? t('popup.session.note.timer', { blurLock: state.lockOnWindowBlur ? t('common.status.on') : t('common.status.off') })
        : t('popup.session.note.default', {
            session: formatDefaultSession(effectiveSessionMinutes),
            blurLock: state.lockOnWindowBlur ? t('common.status.on') : t('common.status.off')
          });

  if (!blurState?.ok) {
    setToolMessage(blurState.error, true);
    return;
  }

  if (blurState.selectionActive) {
    setToolMessage(t('popup.tool.selection_active'));
    return;
  }

  const maskedSuffix = blurState.titleMasked ? t('popup.tool.masked_suffix') : t('popup.tool.period');

  if (activeProfileName) {
    setToolMessage(t('popup.tool.profile_policy', {
      name: activeProfileName,
      policies: formatProfilePolicies(blurState),
      mode: regionModeLabel(activeMode),
      masked: maskedSuffix
    }));
    return;
  }

  if (blurCount > 0) {
    setToolMessage(t('popup.tool.regions_present', {
      count: blurCount,
      mode: regionModeLabel(activeMode),
      masked: maskedSuffix
    }));
    return;
  }

  setToolMessage(t('popup.tool.default_mode', {
    defaultMode: regionModeLabel(defaultMode),
    activeMode: regionModeLabel(activeMode),
    masked: maskedSuffix
  }));
}

async function loadState() {
  const [state, blurState] = await Promise.all([
    chrome.runtime.sendMessage({ type: 'GET_STATE' }),
    sendMessageToActiveTab({ type: 'GET_BLUR_REGION_STATE' })
  ]);

  if (state?.ok) {
    currentState = state;
  }

  currentBlurState = blurState || { ok: false, error: t('popup.error.privacy_state') };

  if (currentState) {
    render(currentState, currentBlurState);
  }
}

lockNowBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'LOCK_NOW', reason: 'popup-panic' });
  await loadState();
});

sessionBtn.addEventListener('click', async () => {
  if (!currentState || currentState.isLocked || currentState.requiresPasswordSetup) return;

  const hasTemporarySession = Number(currentState.unlockUntil || 0) > Date.now();
  await chrome.runtime.sendMessage({
    type: 'SET_UNLOCK_TIMER',
    sessionMinutes: hasTemporarySession ? 0 : 15,
    source: 'popup-session'
  });
  await loadState();
});

blurRegionBtn.addEventListener('click', async () => {
  const response = await sendMessageToActiveTab({ type: 'START_BLUR_REGION_SELECTION' });
  if (!response?.ok) {
    setToolMessage(response?.error || t('popup.error.selection_mode'), true);
    return;
  }

  window.close();
});

clearRegionsBtn.addEventListener('click', async () => {
  const response = await sendMessageToActiveTab({ type: 'CLEAR_BLUR_REGIONS' });
  if (!response?.ok) {
    setToolMessage(response?.error || t('popup.error.clear_regions'), true);
    return;
  }

  await loadState();
});

Object.entries(modeButtons).forEach(([mode, button]) => {
  button.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'SET_DEFAULT_REGION_MODE', mode });
    if (!response?.ok) {
      setToolMessage(response?.error || t('popup.error.default_mode'), true);
      return;
    }

    await loadState();
  });
});

languageBtn.addEventListener('click', async () => {
  await i18n.toggleLanguage();
  await loadState();
});

optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

i18n.onChange(() => {
  applyStaticTranslations();
  if (currentState) {
    render(currentState, currentBlurState);
  }
});

(async () => {
  await i18n.ready();
  applyStaticTranslations();
  await loadState();
  ticker = window.setInterval(() => {
    if (currentState) render(currentState, currentBlurState);
  }, 1000);
})();

window.addEventListener('unload', () => {
  if (ticker) window.clearInterval(ticker);
});
