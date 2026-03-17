const i18n = globalThis.CLPX_I18N;

const passwordSectionTitle = document.getElementById('passwordSectionTitle');
const oldPasswordRow = document.getElementById('oldPasswordRow');
const oldPassword = document.getElementById('oldPassword');
const newPassword = document.getElementById('newPassword');
const confirmPassword = document.getElementById('confirmPassword');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordMsg = document.getElementById('passwordMsg');
const biometricStatus = document.getElementById('biometricStatus');
const setupBiometricBtn = document.getElementById('setupBiometricBtn');
const removeBiometricBtn = document.getElementById('removeBiometricBtn');
const biometricMsg = document.getElementById('biometricMsg');
const autoLockMinutes = document.getElementById('autoLockMinutes');
const unlockSessionMinutes = document.getElementById('unlockSessionMinutes');
const maxAttempts = document.getElementById('maxAttempts');
const lockoutMinutes = document.getElementById('lockoutMinutes');
const lockOnWindowBlur = document.getElementById('lockOnWindowBlur');
const clearHistoryOnLockout = document.getElementById('clearHistoryOnLockout');
const unlockScope = document.getElementById('unlockScope');
const defaultRegionMode = document.getElementById('defaultRegionMode');
const maskPageIdentity = document.getElementById('maskPageIdentity');
const whitelistInput = document.getElementById('whitelistInput');
const settingsMsg = document.getElementById('settingsMsg');
const logsContainer = document.getElementById('logsContainer');
const logMeta = document.getElementById('logMeta');
const ruleTestUrl = document.getElementById('ruleTestUrl');
const ruleTestResult = document.getElementById('ruleTestResult');
const configFileInput = document.getElementById('configFileInput');
const profileList = document.getElementById('profileList');
const addProfileBtn = document.getElementById('addProfileBtn');
const languageBtn = document.getElementById('languageBtn');
const languageBtnLabel = document.getElementById('languageBtnLabel');

let currentState = null;

function t(key, values) {
  return i18n.t(key, values);
}

function setMessage(target, text, isError = false) {
  target.textContent = text;
  target.classList.toggle('error', isError);
}

async function hasOptionalPermission(permission) {
  if (!chrome.permissions?.contains) return false;

  try {
    return await chrome.permissions.contains({ permissions: [permission] });
  } catch {
    return false;
  }
}

async function ensureBrowsingDataPermission() {
  if (!clearHistoryOnLockout.checked) return true;
  if (!chrome.permissions?.request) return false;
  if (await hasOptionalPermission('browsingData')) return true;

  try {
    return await chrome.permissions.request({ permissions: ['browsingData'] });
  } catch {
    return false;
  }
}

async function maybeReleaseBrowsingDataPermission() {
  if (clearHistoryOnLockout.checked) return;
  if (!chrome.permissions?.remove) return;
  if (!await hasOptionalPermission('browsingData')) return;

  try {
    await chrome.permissions.remove({ permissions: ['browsingData'] });
  } catch {
    // Ignore permission removal failures and keep the saved setting as source of truth.
  }
}

function normalizeRules(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function validateRule(rule) {
  if (/^(domain:|host:|pattern:|regex:)/.test(rule)) return true;
  return /[*]/.test(rule) || /^https?:\/\//i.test(rule);
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
}

function formatSessionLabel(minutes) {
  return minutes > 0
    ? `${minutes} ${t('common.label.minutes_short')}`
    : t('common.session.until_locked');
}

function legacyFormatLogTitle(log) {
  const parts = [log.type || 'event'];
  if (log.action) parts.push(log.action);
  if (log.reason) parts.push(log.reason);
  if (typeof log.sessionMinutes === 'number') {
    parts.push(log.sessionMinutes > 0 ? `${log.sessionMinutes}m` : t('common.session.indefinite'));
  }
  return parts.join(' · ');
}

function legacyFormatLogSub(log) {
  const parts = [new Date(log.ts).toLocaleString()];
  if (log.url) parts.push(log.url);
  if (log.meta && typeof log.meta === 'object' && Object.keys(log.meta).length) {
    parts.push(JSON.stringify(log.meta));
  }
  return parts.join(' · ');
}

function formatLogTitle(log) {
  const parts = [log.type || 'event'];
  if (log.action) parts.push(log.action);
  if (log.reason) parts.push(log.reason);
  if (typeof log.sessionMinutes === 'number') {
    parts.push(log.sessionMinutes > 0 ? `${log.sessionMinutes}m` : t('common.session.indefinite'));
  }
  return parts.join(' | ');
}

function formatLogSub(log) {
  const parts = [new Date(log.ts).toLocaleString()];
  if (log.url) parts.push(log.url);
  if (log.meta && typeof log.meta === 'object' && Object.keys(log.meta).length) {
    parts.push(JSON.stringify(log.meta));
  }
  return parts.join(' | ');
}

function renderLogs(logs) {
  logsContainer.innerHTML = '';
  if (!logs.length) {
    const emptyItem = document.createElement('div');
    const emptyTitle = document.createElement('div');
    const emptySub = document.createElement('div');

    emptyItem.className = 'log-item';
    emptyTitle.className = 'log-main';
    emptySub.className = 'log-sub';
    emptyTitle.textContent = t('common.no_logs');
    emptySub.textContent = t('common.no_logs_sub');

    emptyItem.append(emptyTitle, emptySub);
    logsContainer.appendChild(emptyItem);
    logMeta.textContent = t('common.label.entries', { count: 0 });
    return;
  }

  logMeta.textContent = t('common.label.entries', { count: logs.length });

  for (const log of logs) {
    const item = document.createElement('div');
    const title = document.createElement('div');
    const sub = document.createElement('div');

    item.className = 'log-item';
    title.className = 'log-main';
    sub.className = 'log-sub';
    title.textContent = formatLogTitle(log);
    sub.textContent = formatLogSub(log);

    item.append(title, sub);
    logsContainer.appendChild(item);
  }
}

function applyPasswordMode() {
  const requiresSetup = !!currentState?.requiresPasswordSetup;

  passwordSectionTitle.textContent = requiresSetup
    ? t('options.password.initial_title')
    : t('options.password.change_title');
  changePasswordBtn.textContent = requiresSetup
    ? t('common.action.create_password')
    : t('common.action.change_password');
  oldPasswordRow.style.display = requiresSetup ? 'none' : '';
  oldPassword.disabled = requiresSetup;
  oldPassword.value = '';

  if (requiresSetup) {
    setMessage(passwordMsg, t('options.password.initial_hint'));
  }
}

function renderBiometricState() {
  const configured = !!currentState?.biometricConfigured;
  const requiresSetup = !!currentState?.requiresPasswordSetup;

  biometricStatus.textContent = configured
    ? t('options.biometric.status.ready')
    : t('options.biometric.status.not_setup');
  biometricStatus.classList.toggle('status-on', configured);
  biometricStatus.classList.toggle('status-off', !configured);

  setupBiometricBtn.disabled = requiresSetup;
  removeBiometricBtn.disabled = !configured;

  if (requiresSetup) {
    setMessage(biometricMsg, t('options.biometric.messages.password_first'), true);
  } else if (biometricMsg.textContent === t('options.biometric.messages.password_first')) {
    setMessage(biometricMsg, '');
  }
}

function createInput(labelText, className, value = '', type = 'text') {
  const label = document.createElement('label');
  const span = document.createElement('span');
  const input = document.createElement('input');

  label.className = className;
  span.textContent = labelText;
  input.type = type;
  input.value = value ?? '';
  label.append(span, input);
  return { label, input, span };
}

function createSelect(labelText, className, value, options) {
  const label = document.createElement('label');
  const span = document.createElement('span');
  const select = document.createElement('select');

  label.className = className;
  span.textContent = labelText;

  options.forEach((option) => {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  });

  select.value = value;
  label.append(span, select);
  return { label, select };
}

function createToggle(labelText, className, checked = false) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  const span = document.createElement('span');

  label.className = `toggle ${className}`;
  input.type = 'checkbox';
  input.checked = !!checked;
  span.textContent = labelText;
  label.append(input, span);
  return { label, input, span };
}

function updateProfileTitles() {
  profileList.querySelectorAll('.profile-card[data-profile-row="true"]').forEach((card, index) => {
    const title = card.querySelector('.profile-title');
    if (title) title.textContent = t('options.profile.title', { index: index + 1 });
  });
}

function renderEmptyProfiles() {
  if (profileList.querySelector('[data-profile-row="true"]')) return;

  const emptyState = document.createElement('div');
  const title = document.createElement('div');
  const sub = document.createElement('div');

  emptyState.className = 'profile-card';
  emptyState.dataset.emptyState = 'true';
  title.className = 'profile-title';
  sub.className = 'help';
  title.textContent = t('options.profile.empty_title');
  sub.textContent = t('options.profile.empty_text');

  emptyState.append(title, sub);
  profileList.appendChild(emptyState);
}

function clearEmptyProfiles() {
  profileList.querySelectorAll('[data-empty-state="true"]').forEach((node) => node.remove());
}

function appendProfileCard(profile = {}) {
  clearEmptyProfiles();

  const card = document.createElement('div');
  const top = document.createElement('div');
  const title = document.createElement('div');
  const removeBtn = document.createElement('button');
  const grid = document.createElement('div');
  const policyStack = document.createElement('div');
  const nameField = createInput(t('options.profile.name_label'), 'profile-name', profile.name || '');
  const matchField = createInput(t('options.profile.match_label'), 'profile-match', profile.match || '');
  const sessionField = createInput(
    t('options.profile.session_label'),
    'profile-session',
    profile.unlockSessionMinutes ?? '',
    'number'
  );
  const pageUnlockField = createInput(
    t('options.profile.page_unlock_label'),
    'profile-page-unlock',
    profile.pageUnlockMinutes ?? '',
    'number'
  );
  const modeField = createSelect(
    t('options.profile.mode_label'),
    'profile-mode',
    profile.regionMode || 'blur',
    [
      { value: 'blur', label: t('common.mode.blur') },
      { value: 'blackout', label: t('common.mode.blackout') },
      { value: 'pixelate', label: t('common.mode.pixelate') }
    ]
  );
  const bypassToggle = createToggle(
    t('options.profile.bypass_label'),
    'profile-bypass',
    !!profile.bypassGlobalLock
  );
  const forceToggle = createToggle(
    t('options.profile.force_lock_label'),
    'profile-force-lock',
    !!profile.forceLock
  );
  const reauthToggle = createToggle(
    t('options.profile.reauth_label'),
    'profile-reauth',
    !!profile.reAuthOnVisit
  );
  const maskToggle = createToggle(
    t('options.profile.mask_label'),
    'profile-mask',
    !!profile.maskIdentity
  );

  card.className = 'profile-card';
  card.dataset.profileRow = 'true';

  top.className = 'profile-top';
  title.className = 'profile-title';
  removeBtn.className = 'secondary profile-remove';
  removeBtn.type = 'button';
  removeBtn.textContent = t('common.action.remove');

  grid.className = 'profile-grid';
  policyStack.className = 'profile-policies';

  sessionField.input.min = '0';
  sessionField.input.placeholder = t('options.profile.session_placeholder');
  pageUnlockField.input.min = '0';
  pageUnlockField.input.placeholder = t('options.profile.page_unlock_placeholder');

  removeBtn.addEventListener('click', () => {
    card.remove();
    updateProfileTitles();
    renderEmptyProfiles();
  });

  forceToggle.input.addEventListener('change', () => {
    if (forceToggle.input.checked) {
      bypassToggle.input.checked = false;
    }
  });

  top.append(title, removeBtn);
  grid.append(
    nameField.label,
    matchField.label,
    sessionField.label,
    pageUnlockField.label,
    modeField.label
  );
  policyStack.append(
    bypassToggle.label,
    forceToggle.label,
    reauthToggle.label,
    maskToggle.label
  );
  card.append(top, grid, policyStack);
  profileList.appendChild(card);
  updateProfileTitles();
}

function renderProfileList(profiles) {
  profileList.innerHTML = '';

  if (!profiles.length) {
    renderEmptyProfiles();
    return;
  }

  profiles.forEach((profile) => appendProfileCard(profile));
}

function collectProfiles() {
  const profiles = [];
  const rows = profileList.querySelectorAll('.profile-card[data-profile-row="true"]');

  rows.forEach((card) => {
    const name = card.querySelector('.profile-name input')?.value.trim() || '';
    const match = card.querySelector('.profile-match input')?.value.trim() || '';
    const sessionRaw = card.querySelector('.profile-session input')?.value.trim() || '';
    const pageUnlockRaw = card.querySelector('.profile-page-unlock input')?.value.trim() || '';
    const regionMode = card.querySelector('.profile-mode select')?.value || 'blur';
    const bypassGlobalLock = !!card.querySelector('.profile-bypass input')?.checked;
    const forceLock = !!card.querySelector('.profile-force-lock input')?.checked;
    const reAuthOnVisit = !!card.querySelector('.profile-reauth input')?.checked;
    const maskIdentity = !!card.querySelector('.profile-mask input')?.checked;

    if (!name && !match) return;

    profiles.push({
      name: name || 'Profile',
      match,
      unlockSessionMinutes: sessionRaw === '' ? null : Math.max(0, Number(sessionRaw || 0)),
      pageUnlockMinutes: pageUnlockRaw === '' ? null : Math.max(0, Number(pageUnlockRaw || 0)),
      regionMode,
      maskIdentity,
      bypassGlobalLock: forceLock ? false : bypassGlobalLock,
      forceLock,
      reAuthOnVisit
    });
  });

  return profiles;
}

function applyStaticTranslations() {
  document.title = t('options.document_title');
  languageBtn.title = t('common.language.switch');
  languageBtn.setAttribute('aria-label', t('common.language.switch'));
  languageBtnLabel.textContent = t(`common.language.short.${i18n.getLanguage()}`);

  document.getElementById('heroTitle').textContent = t('options.hero.title');
  document.getElementById('heroText').textContent = t('options.hero.text');
  document.getElementById('heroPill').textContent = t('options.hero.pill');
  document.getElementById('oldPasswordLabel').textContent = t('options.password.old_label');
  document.getElementById('newPasswordLabel').textContent = t('options.password.new_label');
  document.getElementById('confirmPasswordLabel').textContent = t('options.password.confirm_label');
  document.getElementById('biometricTitle').textContent = t('options.biometric.title');
  document.getElementById('biometricHelp').textContent = t('options.biometric.help');
  setupBiometricBtn.textContent = t('common.action.register_biometric');
  removeBiometricBtn.textContent = t('common.action.remove_biometric');
  document.getElementById('policyTitle').textContent = t('options.policy.title');
  document.getElementById('autoLockMinutesLabel').textContent = t('options.policy.auto_lock_label');
  document.getElementById('unlockSessionMinutesLabel').textContent = t('options.policy.default_session_label');
  document.getElementById('unlockSessionMinutesHint').textContent = t('options.policy.default_session_hint');
  document.getElementById('maxAttemptsLabel').textContent = t('options.policy.max_attempts_label');
  document.getElementById('lockoutMinutesLabel').textContent = t('options.policy.lockout_minutes_label');
  document.getElementById('lockOnWindowBlurLabel').textContent = t('options.policy.blur_lock_toggle');
  document.getElementById('clearHistoryOnLockoutLabel').textContent = t('options.policy.clear_history_on_lockout_toggle');
  document.getElementById('clearHistoryOnLockoutHint').textContent = t('options.policy.clear_history_on_lockout_hint');
  document.getElementById('unlockScopeLabel').textContent = t('options.policy.unlock_scope_label');
  document.getElementById('unlockScopeHint').textContent = t('options.policy.unlock_scope_hint');
  unlockScope.options[0].textContent = t('options.policy.unlock_scope.domain');
  unlockScope.options[1].textContent = t('options.policy.unlock_scope.global');
  document.getElementById('privacyTitle').textContent = t('options.privacy.title');
  document.getElementById('privacyHelp').textContent = t('options.privacy.help');
  addProfileBtn.textContent = t('common.action.add_profile');
  document.getElementById('defaultRegionModeLabel').textContent = t('options.privacy.default_mode_label');
  defaultRegionMode.options[0].textContent = t('common.mode.blur');
  defaultRegionMode.options[1].textContent = t('common.mode.blackout');
  defaultRegionMode.options[2].textContent = t('common.mode.pixelate');
  document.getElementById('maskPageIdentityLabel').textContent = t('options.privacy.mask_identity_toggle');
  document.getElementById('profileHelp').textContent = t('options.privacy.profile_help');
  document.getElementById('whitelistTitle').textContent = t('options.whitelist.title');
  document.getElementById('whitelistHelp').textContent = t('options.whitelist.help');
  document.getElementById('whitelistRuleDomain').textContent = `domain:example.com ${t('options.whitelist.rule.domain')}`;
  document.getElementById('whitelistRuleHost').textContent = `host:app.example.com ${t('options.whitelist.rule.host')}`;
  document.getElementById('whitelistRulePattern').textContent = `pattern:https://mail.google.com/* ${t('options.whitelist.rule.pattern')}`;
  document.getElementById('whitelistRuleRegex').textContent = `regex:^https://.*\\.corp\\.com/.*$ ${t('options.whitelist.rule.regex')}`;
  ruleTestUrl.placeholder = t('options.whitelist.test_placeholder');
  document.getElementById('testRuleBtn').textContent = t('common.action.test_rule');
  document.getElementById('backupTitle').textContent = t('options.backup.title');
  document.getElementById('backupMuted').textContent = t('options.backup.muted');
  document.getElementById('exportConfigBtn').textContent = t('common.action.export_config');
  document.getElementById('importConfigBtn').textContent = t('common.action.import_config');
  document.getElementById('saveSettingsBtn').textContent = t('common.action.save_settings');
  document.getElementById('lockNowBtn').textContent = t('common.action.panic_lock_now');
  document.getElementById('exportLogsBtn').textContent = t('common.action.export_logs');
  document.getElementById('clearLogsBtn').textContent = t('common.action.clear_logs');
  document.getElementById('logsTitle').textContent = t('options.logs.title');

  applyPasswordMode();
  renderBiometricState();
  renderProfileList(collectProfiles());
}

function runRuleTest() {
  const rules = normalizeRules(whitelistInput.value);
  const href = ruleTestUrl.value.trim();

  setMessage(ruleTestResult, '');

  if (!href) {
    setMessage(ruleTestResult, t('common.rule_test.enter_url'), true);
    return;
  }

  if (/^(chrome|edge|about|chrome-extension):/i.test(href)) {
    setMessage(ruleTestResult, t('common.rule_test.special_page'), true);
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(href);
  } catch {
    setMessage(ruleTestResult, t('common.rule_test.invalid_url'), true);
    return;
  }

  if (!/^https?:/i.test(parsedUrl.protocol)) {
    setMessage(ruleTestResult, t('common.rule_test.http_only'), true);
    return;
  }

  const matchedRule = rules.find((rule) => {
    try {
      return matchesRule(rule, parsedUrl.href);
    } catch {
      return false;
    }
  });

  if (matchedRule) {
    setMessage(ruleTestResult, t('common.rule_test.matched', { rule: matchedRule }));
    return;
  }

  setMessage(ruleTestResult, t('common.rule_test.no_match'), true);
}

async function loadState() {
  const state = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  if (state?.ok) {
    currentState = state;
    autoLockMinutes.value = state.autoLockMinutes || 5;
    unlockSessionMinutes.value = state.unlockSessionMinutes || 0;
    maxAttempts.value = state.maxAttempts || 5;
    lockoutMinutes.value = state.lockoutMinutes || 10;
    lockOnWindowBlur.checked = !!state.lockOnWindowBlur;
    clearHistoryOnLockout.checked = !!state.clearHistoryOnLockout;
    unlockScope.value = typeof state.requirePasswordOnDomainChange === 'boolean' && !state.requirePasswordOnDomainChange
      ? 'global'
      : 'domain';
    defaultRegionMode.value = state.defaultRegionMode || 'blur';
    maskPageIdentity.checked = !!state.maskPageIdentity;
    whitelistInput.value = (state.whitelist || []).join('\n');
    renderProfileList(Array.isArray(state.domainProfiles) ? state.domainProfiles : []);
    applyStaticTranslations();
    renderBiometricState();
  }

  const logs = await chrome.runtime.sendMessage({ type: 'GET_LOGS' });
  if (logs?.ok) renderLogs(logs.logs || []);
}

changePasswordBtn.addEventListener('click', async () => {
  setMessage(passwordMsg, '');

  if (!newPassword.value || newPassword.value.length < 6) {
    setMessage(passwordMsg, t('options.password.error.short'), true);
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    setMessage(passwordMsg, t('options.password.error.mismatch'), true);
    return;
  }

  const message = currentState?.requiresPasswordSetup
    ? {
        type: 'SET_INITIAL_PASSWORD',
        newPassword: newPassword.value,
        useDefaultSession: true,
        sessionMinutes: Number(unlockSessionMinutes.value || 0)
      }
    : {
        type: 'CHANGE_PASSWORD',
        oldPassword: oldPassword.value,
        newPassword: newPassword.value
      };

  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok) {
    setMessage(passwordMsg, response?.error || t('options.password.error.update_failed'), true);
    return;
  }

  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  setMessage(
    passwordMsg,
    currentState?.requiresPasswordSetup
      ? t('options.password.success.initial')
      : t('options.password.success.changed')
  );
  await loadState();
});

setupBiometricBtn.addEventListener('click', async () => {
  setMessage(biometricMsg, '');

  const response = await chrome.runtime.sendMessage({ type: 'BEGIN_BIOMETRIC_SETUP' });
  if (!response?.ok) {
    setMessage(biometricMsg, response?.error || t('options.biometric.messages.request_failed'), true);
    return;
  }

  setMessage(biometricMsg, t('options.biometric.messages.window_opened'));
});

removeBiometricBtn.addEventListener('click', async () => {
  setMessage(biometricMsg, '');

  const response = await chrome.runtime.sendMessage({ type: 'REMOVE_BIOMETRIC_CREDENTIAL' });
  if (!response?.ok) {
    setMessage(biometricMsg, response?.error || t('options.biometric.messages.remove_failed'), true);
    return;
  }

  setMessage(biometricMsg, t('options.biometric.messages.removed'));
  await loadState();
});

document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
  setMessage(settingsMsg, '');

  const rules = normalizeRules(whitelistInput.value);
  const invalidRule = rules.find((rule) => !validateRule(rule));
  if (invalidRule) {
    setMessage(settingsMsg, t('options.messages.invalid_rule', { rule: invalidRule }), true);
    return;
  }

  const profiles = collectProfiles();
  const invalidProfile = profiles.find((profile) => !profile.match || !validateRule(profile.match));
  if (invalidProfile) {
    setMessage(settingsMsg, t('options.messages.invalid_profile_rule', {
      rule: invalidProfile.match || '(empty)'
    }), true);
    return;
  }

  const payload = {
    type: 'SAVE_SETTINGS',
    autoLockMinutes: Math.max(1, Number(autoLockMinutes.value || 5)),
    unlockSessionMinutes: Math.max(0, Number(unlockSessionMinutes.value || 0)),
    maxAttempts: Math.max(1, Number(maxAttempts.value || 5)),
    lockoutMinutes: Math.max(1, Number(lockoutMinutes.value || 10)),
    lockOnWindowBlur: lockOnWindowBlur.checked,
    clearHistoryOnLockout: clearHistoryOnLockout.checked,
    requirePasswordOnDomainChange: unlockScope.value !== 'global',
    defaultRegionMode: defaultRegionMode.value,
    maskPageIdentity: maskPageIdentity.checked,
    domainProfiles: profiles,
    whitelist: rules
  };

  if (payload.clearHistoryOnLockout) {
    const granted = await ensureBrowsingDataPermission();
    if (!granted) {
      setMessage(settingsMsg, t('options.messages.history_permission_denied'), true);
      return;
    }
  }

  const response = await chrome.runtime.sendMessage(payload);
  if (!response?.ok) {
    setMessage(settingsMsg, response?.error || t('options.messages.save_failed'), true);
    return;
  }

  await maybeReleaseBrowsingDataPermission();

  setMessage(settingsMsg, t('options.messages.settings_saved', {
    session: formatSessionLabel(payload.unlockSessionMinutes),
    profiles: profiles.length
  }));
  await loadState();
});

document.getElementById('lockNowBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'LOCK_NOW', reason: 'options-panic' });
  setMessage(settingsMsg, t('options.messages.panic_lock'));
  await loadState();
});

document.getElementById('clearLogsBtn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'CLEAR_LOGS' });
  setMessage(settingsMsg, t('options.messages.logs_cleared'));
  await loadState();
});

document.getElementById('exportLogsBtn').addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ type: 'GET_LOGS' });
  const blob = new Blob([JSON.stringify(response.logs || [], null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chrome-lock-pro-logs.json';
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById('exportConfigBtn').addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage({ type: 'EXPORT_CONFIG' });
  if (!response?.ok) {
    setMessage(settingsMsg, response?.error || t('options.messages.config_export_failed'), true);
    return;
  }

  const blob = new Blob([JSON.stringify(response.config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'chrome-lock-pro-config.json';
  link.click();
  URL.revokeObjectURL(url);
  setMessage(settingsMsg, t('options.messages.config_exported'));
});

document.getElementById('importConfigBtn').addEventListener('click', () => {
  configFileInput.click();
});

configFileInput.addEventListener('change', async () => {
  const file = configFileInput.files?.[0];
  if (!file) return;

  try {
    const raw = await file.text();
    const config = JSON.parse(raw);
    const response = await chrome.runtime.sendMessage({ type: 'IMPORT_CONFIG', config });

    if (!response?.ok) {
      setMessage(settingsMsg, response?.error || t('options.messages.config_import_failed'), true);
      return;
    }

    setMessage(settingsMsg, t('options.messages.config_imported'));
    await loadState();
  } catch (error) {
    setMessage(settingsMsg, error?.message || t('options.messages.invalid_json'), true);
  } finally {
    configFileInput.value = '';
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'LOCK_STATE_CHANGED') return;

  const biometricWasDisabled = !currentState?.biometricConfigured;
  const biometricNowEnabled = !!message.biometricConfigured;

  loadState();
  if (biometricWasDisabled && biometricNowEnabled) {
    setMessage(biometricMsg, t('options.biometric.messages.registered'));
  }

  sendResponse?.({ ok: true });
});

document.getElementById('testRuleBtn').addEventListener('click', runRuleTest);
ruleTestUrl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    runRuleTest();
  }
});

addProfileBtn.addEventListener('click', () => {
  appendProfileCard();
});

languageBtn.addEventListener('click', async () => {
  await i18n.toggleLanguage();
  await loadState();
});

i18n.onChange(() => {
  applyStaticTranslations();
  if (currentState) {
    void loadState();
  }
});

(async () => {
  await i18n.ready();
  applyStaticTranslations();
  await loadState();
})();
