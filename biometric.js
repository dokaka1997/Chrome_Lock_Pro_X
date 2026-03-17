const i18n = globalThis.CLPX_I18N;

const titleNode = document.getElementById('title');
const subtitleNode = document.getElementById('subtitle');
const statusNode = document.getElementById('status');
const noteNode = document.getElementById('note');
const actionBtn = document.getElementById('actionBtn');
const cancelBtn = document.getElementById('cancelBtn');

const requestId = new URLSearchParams(location.search).get('requestId') || '';

let currentContext = null;
let busy = false;
let completed = false;

const BIOMETRIC_ALGORITHMS = Object.freeze({
  ES256: -7,
  RS256: -257
});

function t(key, values) {
  return i18n.t(key, values);
}

function toBase64(bytes) {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of array) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toBase64Url(bytes) {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function setStatus(text, state = '') {
  statusNode.textContent = text;
  statusNode.classList.toggle('error', state === 'error');
  statusNode.classList.toggle('success', state === 'success');
}

function isSetupMode() {
  return currentContext?.request?.type === 'setup';
}

function applyStaticTranslations() {
  document.title = t('biometric.window.document_title');
  cancelBtn.textContent = t('biometric.window.button.cancel');
  noteNode.textContent = t('biometric.window.note');
}

function renderContext() {
  if (!currentContext) return;

  if (isSetupMode()) {
    titleNode.textContent = t('biometric.window.title.setup');
    subtitleNode.textContent = t('biometric.window.subtitle.setup');
    actionBtn.textContent = t('biometric.window.button.setup');
    setStatus(t('biometric.window.status.ready_setup'));
    return;
  }

  titleNode.textContent = t('biometric.window.title.unlock');
  subtitleNode.textContent = t('biometric.window.subtitle.unlock');
  actionBtn.textContent = t('biometric.window.button.unlock');
  setStatus(t('biometric.window.status.ready_unlock'));
}

function normalizeError(error) {
  if (error?.name === 'NotAllowedError') {
    return t('biometric.window.error.cancelled');
  }

  if (error?.name === 'InvalidStateError') {
    return t('biometric.window.error.invalid_state');
  }

  if (error?.name === 'NotSupportedError') {
    return t('biometric.window.error.unsupported');
  }

  return error?.message || t('biometric.window.error.generic');
}

async function ensurePlatformSupport() {
  if (!globalThis.PublicKeyCredential || !navigator.credentials) {
    throw new Error(t('biometric.window.error.unsupported'));
  }

  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    return;
  }

  const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  if (!available) {
    throw new Error(t('biometric.window.error.platform_unavailable'));
  }
}

async function loadContext() {
  await i18n.ready();
  applyStaticTranslations();

  if (!requestId) {
    setStatus(t('biometric.window.error.context_missing'), 'error');
    return;
  }

  try {
    await ensurePlatformSupport();
    const response = await chrome.runtime.sendMessage({
      type: 'GET_BIOMETRIC_CONTEXT',
      requestId
    });

    if (!response?.ok) {
      setStatus(response?.error || t('biometric.window.error.context_missing'), 'error');
      return;
    }

    currentContext = response;
    renderContext();
    actionBtn.disabled = false;
  } catch (error) {
    setStatus(normalizeError(error), 'error');
  }
}

async function finishAndClose(successMessage) {
  completed = true;
  busy = false;
  actionBtn.disabled = true;
  cancelBtn.disabled = true;
  setStatus(successMessage, 'success');
  window.setTimeout(() => window.close(), 900);
}

async function notifyCancel(errorText) {
  if (!requestId || completed) return;

  try {
    await chrome.runtime.sendMessage({
      type: 'CANCEL_BIOMETRIC_REQUEST',
      requestId,
      error: errorText
    });
  } catch {
    // Ignore cleanup failures when the window is about to close.
  }
}

async function createBiometricCredential() {
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: fromBase64Url(currentContext.request.challenge),
      rp: { name: 'Chrome Lock Pro X' },
      user: {
        id: userId,
        name: 'chrome-lock-pro-x',
        displayName: 'Chrome Lock Pro X'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: BIOMETRIC_ALGORITHMS.ES256 },
        { type: 'public-key', alg: BIOMETRIC_ALGORITHMS.RS256 }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'none'
    }
  });

  const response = credential?.response;
  const publicKey = response?.getPublicKey?.();
  const algorithm = response?.getPublicKeyAlgorithm?.();
  if (
    !credential?.rawId
    || !publicKey
    || ![BIOMETRIC_ALGORITHMS.ES256, BIOMETRIC_ALGORITHMS.RS256].includes(algorithm)
  ) {
    throw new Error(t('biometric.window.error.no_public_key'));
  }

  const saveResponse = await chrome.runtime.sendMessage({
    type: 'COMPLETE_BIOMETRIC_SETUP',
    requestId,
    request: currentContext?.request || null,
    credentialId: toBase64Url(credential.rawId),
    publicKey: toBase64(publicKey),
    algorithm,
    transports: response?.getTransports?.() || []
  });

  if (!saveResponse?.ok) {
    throw new Error(saveResponse?.error || t('biometric.window.error.generic'));
  }
}

async function performBiometricUnlock() {
  const credentialId = currentContext?.credential?.credentialId;
  if (!credentialId) {
    throw new Error(t('biometric.window.error.not_configured'));
  }

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: fromBase64Url(currentContext.request.challenge),
      allowCredentials: [{
        type: 'public-key',
        id: fromBase64Url(credentialId),
        transports: currentContext.credential.transports || []
      }],
      userVerification: 'required',
      timeout: 60000
    }
  });

  const response = assertion?.response;
  if (!assertion?.rawId || !response?.authenticatorData || !response?.clientDataJSON || !response?.signature) {
    throw new Error(t('biometric.window.error.generic'));
  }

  const completeResponse = await chrome.runtime.sendMessage({
    type: 'COMPLETE_BIOMETRIC_UNLOCK',
    requestId,
    request: currentContext?.request || null,
    credentialId: toBase64Url(assertion.rawId),
    authenticatorData: toBase64Url(response.authenticatorData),
    clientDataJSON: toBase64Url(response.clientDataJSON),
    signature: toBase64Url(response.signature),
    userHandle: response.userHandle ? toBase64Url(response.userHandle) : ''
  });

  if (!completeResponse?.ok) {
    throw new Error(completeResponse?.error || t('biometric.window.error.generic'));
  }
}

async function handleAction() {
  if (busy || !currentContext) return;

  busy = true;
  actionBtn.disabled = true;
  cancelBtn.disabled = true;
  setStatus(
    isSetupMode()
      ? t('biometric.window.status.running_setup')
      : t('biometric.window.status.running_unlock')
  );

  try {
    if (isSetupMode()) {
      await createBiometricCredential();
      await finishAndClose(t('biometric.window.status.success_setup'));
      return;
    }

    await performBiometricUnlock();
    await finishAndClose(t('biometric.window.status.success_unlock'));
  } catch (error) {
    const text = normalizeError(error);
    busy = false;
    actionBtn.disabled = false;
    cancelBtn.disabled = false;
    setStatus(text, 'error');
    await notifyCancel(text);
  }
}

actionBtn.addEventListener('click', handleAction);
cancelBtn.addEventListener('click', async () => {
  const cancelledText = t('biometric.window.error.cancelled');
  await notifyCancel(cancelledText);
  window.close();
});

i18n.onChange(() => {
  applyStaticTranslations();
  if (!busy && !completed) {
    renderContext();
  }
});

loadContext();
