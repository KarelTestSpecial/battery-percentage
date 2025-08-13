const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';
let displayWindowId = null;

async function getBatteryStatus() {
  if (!(await chrome.offscreen.hasDocument())) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['DOM_PARSER', 'AUDIO_PLAYBACK'],
      justification: 'Required to use the Battery Status API, Canvas API and play audio.',
    });
  }
  chrome.runtime.sendMessage({ type: 'getBatteryStatus' });
}

// Functie om de notificatie te tonen
async function showNotificationForLevel(level) {
  const state = await chrome.idle.queryState(15);
  if (state === 'locked') {
    return;
  }

  const notificationKey = `notified_${level}`;
  
  const storage = await chrome.storage.local.get(notificationKey);
  if (storage[notificationKey]) {
    return;
  }

  let message = `Your battery has reached ${level}%!`;
  if (level === 22) {
    message = `Your battery is getting low (${level}%)!`;
  }

  // Creëer de notificatie.
  chrome.notifications.create(notificationKey, {
    type: 'basic',
    iconUrl: 'icon128.png',
    title: 'Battery Notification',
    message: message
  });

  // Play sound
  chrome.runtime.sendMessage({ type: 'playSound' });

  await chrome.storage.local.set({ [notificationKey]: true });
}

// De hoofd-bericht-handler
chrome.runtime.onMessage.addListener((msg, sender) => {
  switch (msg.type) {
    case 'batteryIcon':
      const pixelData = Uint8ClampedArray.from(msg.imageDataPayload.data);
      const imageData = new ImageData(pixelData, msg.imageDataPayload.width, msg.imageDataPayload.height);
      chrome.action.setIcon({ imageData: imageData });

      // Stuur de update naar het display venster
      chrome.runtime.sendMessage({ type: 'batteryUpdate', level: msg.level });

      if (msg.isCharging) {
        chrome.storage.local.get(['notified_88', 'notified_100']).then(storage => {
          if (storage.notified_100 && msg.level < 100) chrome.storage.local.set({ notified_100: false });
          if (storage.notified_88 && msg.level < 88) chrome.storage.local.set({ notified_88: false });
        });
      } else {
        chrome.storage.local.get(['notified_22']).then(storage => {
          if (storage.notified_22 && msg.level > 22) {
            chrome.storage.local.set({ notified_22: false });
          }
        });
      }
      break;

    case 'showNotification':
      showNotificationForLevel(msg.level);
      break;

    case 'resize_window':
      if (sender.tab && sender.tab.windowId) {
        chrome.windows.update(sender.tab.windowId, { width: msg.width, height: msg.height });
      }
      break;
  }
});

// Listener for when the display window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === displayWindowId) {
    displayWindowId = null;
  }
});

chrome.action.onClicked.addListener(async () => {
  // Immediately update the battery status on click
  getBatteryStatus();

  if (displayWindowId !== null) {
    try {
      await chrome.windows.update(displayWindowId, { focused: true });
    } catch (error) {
      // The window was closed without us knowing
      displayWindowId = null;
    }
  }

  if (displayWindowId === null) {
    const createData = {
      url: chrome.runtime.getURL("battery_display.html"),
      type: "popup",
      focused: true,
      width: 200,
      height: 100
    };
    const window = await chrome.windows.create(createData);
    displayWindowId = window.id;
  }
});

// Bestaande triggers blijven hetzelfde
chrome.runtime.onStartup.addListener(getBatteryStatus);
chrome.runtime.onInstalled.addListener(getBatteryStatus);
chrome.alarms.create('batteryCheck', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'batteryCheck') {
    getBatteryStatus();
  }
});