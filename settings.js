document.addEventListener('DOMContentLoaded', () => {
  const chargingAlarmsContainer = document.getElementById('charging-alarms');
  const dischargingAlarmsContainer = document.getElementById('discharging-alarms');
  const saveButton = document.getElementById('save-button');
  const soundSelectPreview = document.getElementById('sound-select');
  const playSoundButton = document.getElementById('play-sound-button');

  const sounds = [
    { name: 'Notification', path: 'sounds/notification.wav' },
    { name: 'Alarm', path: 'sounds/alarm.wav' },
    { name: 'Beep', path: 'sounds/beep.mp3' },
    { name: 'Bell', path: 'sounds/bell.mp3' },
    { name: 'Digital', path: 'sounds/digital.mp3' },
  ];

  const populateSoundDropdown = (selectElement) => {
    sounds.forEach(sound => {
      const option = new Option(sound.name, sound.path);
      selectElement.add(option);
    });
  };

  const createAlarmUI = (alarm, index, type) => {
    const container = document.createElement('div');
    container.classList.add('alarm-settings');

    const enabledCheckbox = document.createElement('input');
    enabledCheckbox.type = 'checkbox';
    enabledCheckbox.checked = alarm.enabled;
    container.appendChild(enabledCheckbox);

    const percentageInput = document.createElement('input');
    percentageInput.type = 'number';
    percentageInput.min = 0;
    percentageInput.max = 100;
    percentageInput.value = alarm.percentage;
    container.appendChild(percentageInput);

    const soundSelect = document.createElement('select');
    populateSoundDropdown(soundSelect);
    soundSelect.value = alarm.sound;
    container.appendChild(soundSelect);

    const durationInput = document.createElement('input');
    durationInput.type = 'number';
    durationInput.min = 1;
    durationInput.value = alarm.duration;
    container.appendChild(durationInput);

    if (type === 'charging') {
      chargingAlarmsContainer.appendChild(container);
    } else {
      dischargingAlarmsContainer.appendChild(container);
    }
  };

  const loadSettings = () => {
    chrome.storage.local.get('alarms', (result) => {
      const alarms = result.alarms || {
        charging: [
          { enabled: false, percentage: 100, sound: 'sounds/alarm.wav', duration: 5 },
          { enabled: false, percentage: 95, sound: 'sounds/notification.wav', duration: 1 },
          { enabled: false, percentage: 90, sound: 'sounds/notification.wav', duration: 1 },
          { enabled: false, percentage: 85, sound: 'sounds/notification.wav', duration: 1 },
        ],
        discharging: [
          { enabled: true, percentage: 22, sound: 'sounds/notification.wav', duration: 1 },
          { enabled: true, percentage: 16, sound: 'sounds/alarm.wav', duration: 5 },
          { enabled: false, percentage: 12, sound: 'sounds/alarm.wav', duration: 5 },
          { enabled: false, percentage: 8, sound: 'sounds/alarm.wav', duration: 5 },
        ],
      };

      chargingAlarmsContainer.innerHTML = '';
      dischargingAlarmsContainer.innerHTML = '';

      alarms.charging.forEach((alarm, index) => createAlarmUI(alarm, index, 'charging'));
      alarms.discharging.forEach((alarm, index) => createAlarmUI(alarm, index, 'discharging'));
    });
  };

  const saveSettings = () => {
    const chargingAlarms = [];
    for (const container of chargingAlarmsContainer.children) {
      chargingAlarms.push({
        enabled: container.children[0].checked,
        percentage: parseInt(container.children[1].value),
        sound: container.children[2].value,
        duration: parseInt(container.children[3].value),
      });
    }

    const dischargingAlarms = [];
    for (const container of dischargingAlarmsContainer.children) {
      dischargingAlarms.push({
        enabled: container.children[0].checked,
        percentage: parseInt(container.children[1].value),
        sound: container.children[2].value,
        duration: parseInt(container.children[3].value),
      });
    }

    chrome.storage.local.set({ alarms: { charging: chargingAlarms, discharging: dischargingAlarms } }, () => {
      alert('Settings saved!');
    });
  };

  playSoundButton.addEventListener('click', () => {
    const selectedSound = soundSelectPreview.value;
    chrome.runtime.sendMessage({ type: 'playSound', sound: selectedSound });
  });

  saveButton.addEventListener('click', saveSettings);

  populateSoundDropdown(soundSelectPreview);
  loadSettings();
});
