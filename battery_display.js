document.addEventListener('DOMContentLoaded', async () => {
  const batteryPercentageElement = document.getElementById('battery-percentage');
  const body = document.body;

  // Functie om de batterijstatus bij te werken
  function updateBatteryStatus(percentage) {
    batteryPercentageElement.textContent = `${percentage}%`;
    // Pas de venstergrootte aan de inhoud aan
    const contentWidth = batteryPercentageElement.offsetWidth;
    const contentHeight = batteryPercentageElement.offsetHeight;
    // Stuur een bericht naar het achtergrondscript om het venster te vergroten/verkleinen
    chrome.runtime.sendMessage({ type: 'resize_window', width: contentWidth + 40, height: contentHeight + 40 }); // Add padding
  }

  // Luister naar berichten van het achtergrondscript
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'batteryUpdate') {
      updateBatteryStatus(msg.level);
    }
  });

  // Laad de opgeslagen modus
  chrome.storage.local.get(['darkMode'], function(result) {
    if (result.darkMode) {
      body.classList.add('dark-mode');
    }
  });

  // Wissel van donkere modus bij klikken
  body.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    chrome.storage.local.set({darkMode: isDarkMode});
  });

  try {
    const battery = await navigator.getBattery();
    const percentage = Math.round(battery.level * 100);
    updateBatteryStatus(percentage);
  } catch (error) {
    console.error('Failed to get battery information:', error);
    batteryPercentageElement.textContent = 'N/A';
  }
});