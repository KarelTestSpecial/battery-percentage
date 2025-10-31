document.addEventListener('DOMContentLoaded', async () => {
  const batteryPercentageElement = document.getElementById('battery-percentage');
  const body = document.body;

  function updateBatteryStatus(percentage) {
    batteryPercentageElement.textContent = `${percentage}%`;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'batteryUpdate') {
      updateBatteryStatus(msg.level);
    }
  });

  // Load the saved mode
  const applyDarkMode = (isDarkMode) => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  };

  const loadDarkModeSetting = () => {
    chrome.storage.local.get('darkMode', (result) => {
      applyDarkMode(result.darkMode || false);
    });
  };

  loadDarkModeSetting();

  // Wissel van donkere modus bij klikken
  batteryPercentageElement.addEventListener('click', () => {
    chrome.windows.create({
      url: 'settings.html',
      type: 'popup',
      width: 400,
      height: 600
    });
  });

  try {
    const battery = await navigator.getBattery();
    const percentage = Math.round(battery.level * 100);
    updateBatteryStatus(percentage);
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'getBatteryStatus' });
  }
});
