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

  // Luister naar wijzigingen in de opslag om de modus onmiddellijk bij te werken
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.darkMode) {
      applyDarkMode(changes.darkMode.newValue);
    }
  });

  // Wissel van donkere modus bij klikken op het percentage
  batteryPercentageElement.addEventListener('click', () => {
    chrome.storage.local.get('darkMode', (result) => {
      const newMode = !(result.darkMode || false);
      chrome.storage.local.set({ darkMode: newMode });
    });
  });

  // Open instellingen bij klikken op het tandwiel
  const settingsBtn = document.getElementById('settings-btn');
  settingsBtn.addEventListener('click', () => {
    chrome.windows.create({
      url: 'settings.html',
      type: 'popup',
      width: 450,
      height: 700
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
