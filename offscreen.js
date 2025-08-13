// Function to read the battery status and draw the dynamic icon.
async function updateIcon() {
  console.log("Executing updateIcon...");

  try {
    // 1. Get battery information
    const battery = await navigator.getBattery();
    const level = Math.floor(battery.level * 100);

    // --- Notification Logic (remains unchanged) ---
    if (battery.charging && (level === 100 || level === 88)) {
      chrome.runtime.sendMessage({ type: 'showNotification', level: level });
    }
    if (!battery.charging && level === 22) {
      chrome.runtime.sendMessage({ type: 'showNotification', level: 22 });
    }

    // --- Icon Drawing Logic ---
    let iconContent = level.toString(); 
    let fontSize;

    const canvas = document.getElementById('iconCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Bepaal de thema-status aan het begin voor hergebruik.
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let textColor = 'white'; // Standaardwaarde voor tekstkleur

    // --- NIEUWE, GECOMBINEERDE VISUELE LOGICA ---
    
    // Scenario 1: Batterij is 100% vol.
    if (level === 100) {
      iconContent = '💯';
      fontSize = 29;
      if (isDarkMode) {
        ctx.fillStyle = 'black'; // Witte achtergrond
      } else {
        ctx.fillStyle = 'yellow'; // Zwarte achtergrond
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
    // Scenario 2: Batterij is aan het opladen (maar niet 100%).
    } else if (battery.charging) {
      fontSize = 33;
      if (isDarkMode) {
        // Dark Mode: Donkerblauwe achtergrond, witte cijfers.
        ctx.fillStyle = '#000084'; // Zeer donkerblauw
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        textColor = 'white';
      } else {
        // Light Mode: donkerblauwe cijfers.
        textColor = '#4040B9'; 
      }
      
    // Scenario 3: Batterij is bijna leeg (onder 20%).
    } else if (level <= 20) {
      fontSize = 33;
      ctx.fillStyle = '#D32F2F'; // Rode achtergrond
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      textColor = 'white';
      
    // Scenario 4: Normale ontlaad-status.
    } else {
      fontSize = 33;
      // Geen achtergrond (transparant)
      if (isDarkMode) {
        textColor = 'white';
      } else {
        textColor = 'green';
      }
    }

    // Teken de tekst of emoji op het canvas
    ctx.font = `bold ${fontSize}px Arial`; 
    ctx.fillStyle = textColor; // De ingestelde tekstkleur
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconContent, canvas.width / 2, canvas.height / 2 + 2);

    // Stuur de afbeelding naar de background script
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const plainArray = Array.from(imageData.data);

    chrome.runtime.sendMessage({
      type: 'batteryIcon',
      imageDataPayload: {
        data: plainArray,
        width: imageData.width,
        height: imageData.height
      },
      level: level,
      isCharging: battery.charging
    });
    console.log("New icon sent successfully.");

  } catch (error) {
    console.error("Error in updateIcon:", error);
  }
}

// Function to play the notification sound
function playNotificationSound() {
  const sound = document.getElementById('notificationSound');
  sound.play();
}

// Luister naar berichten van het background script
chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case 'getBatteryStatus':
      updateIcon();
      break;
    case 'playSound':
      playNotificationSound();
      break;
  }
});

// Initial call to set the icon when the offscreen document is created.
updateIcon();
setInterval(updateIcon, 60000);