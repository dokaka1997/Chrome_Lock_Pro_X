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

  if (audioContext.state === '\x73\x75\x73\x70\x65\x6e\x64\x65\x64') {
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
      type: '\x4f\x46\x46\x53\x43\x52\x45\x45\x4e\x5f\x41\x55\x44\x49\x4f\x5f\x53\x54\x41\x54\x45\x5f\x43\x48\x41\x4e\x47\x45\x44',
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

  if (controllers.size === 0 && audioContext && audioContext.state !== '\x63\x6c\x6f\x73\x65\x64') {
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
    return { ok: false, error: '\x4d\x69\x73\x73\x69\x6e\x67\x20\x73\x74\x72\x65\x61\x6d\x20\x49\x44\x2e' };
  }

  const context = await getAudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: '\x74\x61\x62',
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
    track.addEventListener('\x65\x6e\x64\x65\x64', () => {
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
  if (message?.target !== '\x6f\x66\x66\x73\x63\x72\x65\x65\x6e') {
    return false;
  }

  (async () => {
    const tabId = Number(message.tabId);

    if (message.type === '\x4f\x46\x46\x53\x43\x52\x45\x45\x4e\x5f\x47\x45\x54\x5f\x54\x41\x42\x5f\x41\x55\x44\x49\x4f\x5f\x53\x54\x41\x54\x45') {
      sendResponse(buildStateResponse(tabId));
      return;
    }

    if (message.type === '\x4f\x46\x46\x53\x43\x52\x45\x45\x4e\x5f\x47\x45\x54\x5f\x41\x55\x44\x49\x4f\x5f\x53\x55\x4d\x4d\x41\x52\x59') {
      sendResponse({ ok: true, activeCount: controllers.size });
      return;
    }

    if (message.type === '\x4f\x46\x46\x53\x43\x52\x45\x45\x4e\x5f\x53\x45\x54\x5f\x54\x41\x42\x5f\x41\x55\x44\x49\x4f') {
      sendResponse(await setTabAudio(tabId, message.volumePercent, String(message.streamId || '')));
      return;
    }

    if (message.type === '\x4f\x46\x46\x53\x43\x52\x45\x45\x4e\x5f\x53\x54\x4f\x50\x5f\x54\x41\x42\x5f\x41\x55\x44\x49\x4f') {
      sendResponse(await stopTabAudio(tabId));
      return;
    }

    sendResponse({ ok: false, error: '\x55\x6e\x6b\x6e\x6f\x77\x6e\x20\x6f\x66\x66\x73\x63\x72\x65\x65\x6e\x20\x6d\x65\x73\x73\x61\x67\x65\x2e' });
  })().catch((error) => {
    sendResponse({ ok: false, error: error?.message || '\x4f\x66\x66\x73\x63\x72\x65\x65\x6e\x20\x61\x75\x64\x69\x6f\x20\x65\x72\x72\x6f\x72\x2e' });
  });

  return true;
});
