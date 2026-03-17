const DEFAULT_TAB_AUDIO_VOLUME = 100;
const MIN_TAB_AUDIO_VOLUME = 0;
const MAX_TAB_AUDIO_VOLUME = 200;

const controllers = new Map();
let audioContext = null;

function normalizeTabAudioVolume(value, fallback = DEFAULT_TAB_AUDIO_VOLUME) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(MAX_TAB_AUDIO_VOLUME, Math.max(MIN_TAB_AUDIO_VOLUME, Math.trunc(numeric)));
}

async function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  return audioContext;
}

function buildStateResponse(tabId) {
  const controller = controllers.get(tabId);
  return {
    ok: true,
    active: !!controller,
    volumePercent: controller?.volumePercent ?? DEFAULT_TAB_AUDIO_VOLUME
  };
}

async function notifyStateChanged(tabId) {
  try {
    await chrome.runtime.sendMessage({
      type: 'OFFSCREEN_AUDIO_STATE_CHANGED',
      tabId,
      activeCount: controllers.size
    });
  } catch {
    // Ignore if the service worker is unavailable momentarily.
  }
}

async function stopTabAudio(tabId) {
  const controller = controllers.get(tabId);
  if (!controller) {
    return {
      ok: true,
      active: false,
      volumePercent: DEFAULT_TAB_AUDIO_VOLUME,
      activeCount: controllers.size
    };
  }

  controllers.delete(tabId);

  try {
    controller.sourceNode.disconnect();
  } catch {
    // Ignore disconnect failures.
  }

  try {
    controller.gainNode.disconnect();
  } catch {
    // Ignore disconnect failures.
  }

  controller.stream.getTracks().forEach((track) => track.stop());

  if (controllers.size === 0 && audioContext && audioContext.state !== 'closed') {
    try {
      await audioContext.suspend();
    } catch {
      // Ignore suspend failures.
    }
  }

  void notifyStateChanged(tabId);

  return {
    ok: true,
    active: false,
    volumePercent: DEFAULT_TAB_AUDIO_VOLUME,
    activeCount: controllers.size
  };
}

async function startTabAudio(tabId, streamId, volumePercent) {
  if (!streamId) {
    return { ok: false, error: 'Missing stream ID.' };
  }

  const context = await getAudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId
      }
    },
    video: false
  });

  const sourceNode = context.createMediaStreamSource(stream);
  const gainNode = context.createGain();
  gainNode.gain.value = volumePercent / 100;
  sourceNode.connect(gainNode);
  gainNode.connect(context.destination);

  const controller = {
    tabId,
    stream,
    sourceNode,
    gainNode,
    volumePercent
  };

  controllers.set(tabId, controller);

  stream.getAudioTracks().forEach((track) => {
    track.addEventListener('ended', () => {
      void stopTabAudio(tabId);
    }, { once: true });
  });

  void notifyStateChanged(tabId);

  return {
    ok: true,
    active: true,
    volumePercent,
    activeCount: controllers.size
  };
}

async function setTabAudio(tabId, volumePercent, streamId = '') {
  const normalizedVolume = normalizeTabAudioVolume(volumePercent, DEFAULT_TAB_AUDIO_VOLUME);
  if (normalizedVolume === DEFAULT_TAB_AUDIO_VOLUME) {
    return stopTabAudio(tabId);
  }

  const existing = controllers.get(tabId);
  if (existing) {
    existing.volumePercent = normalizedVolume;
    existing.gainNode.gain.value = normalizedVolume / 100;
    return {
      ok: true,
      active: true,
      volumePercent: normalizedVolume,
      activeCount: controllers.size
    };
  }

  return startTabAudio(tabId, streamId, normalizedVolume);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target !== 'offscreen') {
    return false;
  }

  (async () => {
    const tabId = Number(message.tabId);

    if (message.type === 'OFFSCREEN_GET_TAB_AUDIO_STATE') {
      sendResponse(buildStateResponse(tabId));
      return;
    }

    if (message.type === 'OFFSCREEN_GET_AUDIO_SUMMARY') {
      sendResponse({ ok: true, activeCount: controllers.size });
      return;
    }

    if (message.type === 'OFFSCREEN_SET_TAB_AUDIO') {
      sendResponse(await setTabAudio(tabId, message.volumePercent, String(message.streamId || '')));
      return;
    }

    if (message.type === 'OFFSCREEN_STOP_TAB_AUDIO') {
      sendResponse(await stopTabAudio(tabId));
      return;
    }

    sendResponse({ ok: false, error: 'Unknown offscreen message.' });
  })().catch((error) => {
    sendResponse({ ok: false, error: error?.message || 'Offscreen audio error.' });
  });

  return true;
});
