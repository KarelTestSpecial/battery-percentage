document.addEventListener('DOMContentLoaded', async () => {
  const batteryPercentageElement = document.getElementById('battery-percentage');

  function updateBatteryStatus(percentage) {
    batteryPercentageElement.textContent = `${percentage}%`;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'batteryUpdate') {
      updateBatteryStatus(msg.level);
    }
  });

  try {
    const battery = await navigator.getBattery();
    const percentage = Math.round(battery.level * 100);
    updateBatteryStatus(percentage);
  } catch (error) {
    // In Manifest V3, navigator.getBattery is not available in popups.
    // We need to request the battery status from the background script.
    chrome.runtime.sendMessage({ type: 'getBatteryStatus' });
  }
});
