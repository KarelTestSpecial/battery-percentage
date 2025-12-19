const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

async function getBatteryStatus() {
  if (!(await chrome.offscreen.hasDocument())) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['DOM_PARSER', 'AUDIO_PLAYBACK'],
      justification: 'Required to use the Battery Status API, Canvas API and play audio.',
    });
  }
  const { textColor } = await chrome.storage.local.get('textColor');
  chrome.runtime.sendMessage({ type: 'getBatteryStatus', textColor: textColor });
}

async function checkAlarms(level, isCharging) {
  const { alarms } = await chrome.storage.local.get('alarms');
  if (!alarms) return;

  const alarmType = isCharging ? 'charging' : 'discharging';
  const relevantAlarms = alarms[alarmType];

  for (const alarm of relevantAlarms) {
    if (!alarm.enabled) continue;

    const notificationKey = `notified_${alarmType}_${alarm.percentage}`;
    const { [notificationKey]: notified } = await chrome.storage.local.get(notificationKey);

    const conditionMet = isCharging ? level >= alarm.percentage : level <= alarm.percentage;

    if (conditionMet && !notified) {
      showNotification(alarm);
      await chrome.storage.local.set({ [notificationKey]: true });
    } else if (!conditionMet && notified) {
      await chrome.storage.local.set({ [notificationKey]: false });
    }
  }
}

async function showNotification(alarm) {
  const state = await chrome.idle.queryState(15);
  if (state === 'locked') {
    return;
  }

  const message = `Your battery has reached ${alarm.percentage}%!`;

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon128.png',
    title: 'Battery Notification',
    message: message
  });

  const { volume } = await chrome.storage.local.get('volume');
  chrome.runtime.sendMessage({
    type: 'playSound',
    sound: alarm.sound,
    duration: alarm.duration,
    volume: volume !== undefined ? volume : 1
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case 'getBatteryStatus':
      getBatteryStatus();
      break;
    case 'batteryIcon':
      const pixelData = Uint8ClampedArray.from(msg.imageDataPayload.data);
      const imageData = new ImageData(pixelData, msg.imageDataPayload.width, msg.imageDataPayload.height);
      chrome.action.setIcon({ imageData: imageData });

      chrome.runtime.sendMessage({ type: 'batteryUpdate', level: msg.level });

      checkAlarms(msg.level, msg.isCharging);
      break;
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'battery_display.html',
    type: 'popup',
    width: 220,
    height: 130
  });
});

// Bestaande triggers blijven hetzelfde
chrome.runtime.onStartup.addListener(getBatteryStatus);

chrome.runtime.onInstalled.addListener((details) => {
  getBatteryStatus(); // Voer de batterij-check uit zoals voorheen.

  // Toon een welkomst- of updatemelding.
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.notifications.create('welcomeNotification', {
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'Thanks for installing!',
      message: 'Click the numbers in the pop-up to open settings and configure alarms.'
    });
  }
});

chrome.alarms.create('batteryCheck', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'batteryCheck') {
    getBatteryStatus();
  }
});