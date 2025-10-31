document.addEventListener('DOMContentLoaded', () => {
  const chargingAlarmsContainer = document.getElementById('charging-alarms');
  const dischargingAlarmsContainer = document.getElementById('discharging-alarms');
  const saveButton = document.getElementById('save-button');

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
    const notificationOption = new Option('Notification', 'notification.wav');
    const alarmOption = new Option('Alarm', 'alarm.wav');
    soundSelect.add(notificationOption);
    soundSelect.add(alarmOption);
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
          { enabled: false, percentage: 80, sound: 'notification.wav', duration: 1 },
          { enabled: false, percentage: 90, sound: 'notification.wav', duration: 1 },
          { enabled: false, percentage: 95, sound: 'notification.wav', duration: 1 },
          { enabled: false, percentage: 100, sound: 'alarm.wav', duration: 5 },
        ],
        discharging: [
          { enabled: true, percentage: 22, sound: 'notification.wav', duration: 1 },
          { enabled: true, percentage: 15, sound: 'alarm.wav', duration: 5 },
          { enabled: false, percentage: 10, sound: 'alarm.wav', duration: 5 },
          { enabled: false, percentage: 5, sound: 'alarm.wav', duration: 5 },
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

  saveButton.addEventListener('click', saveSettings);

  loadSettings();
});
