// Function to read the battery status and draw the dynamic icon.
async function updateIcon(userTextColor) {
  console.log("Executing updateIcon...");

  try {
    // 1. Get battery information
    const battery = await navigator.getBattery();
    const level = Math.floor(battery.level * 100);

    // --- Notification Logic (remains unchanged) ---
    if (battery.charging && (level === 100 || level === 88)) {
      chrome.runtime.sendMessage({ type: 'showNotification', level: level });
    }
    if (!battery.charging && (level === 22 || level === 15)) {
      chrome.runtime.sendMessage({ type: 'showNotification', level: level });
    }

    // --- Icon Drawing Logic ---
    let iconContent = level.toString();
    let fontSize;
    let textColor;

    const canvas = document.getElementById('iconCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // --- VISUAL LOGIC ---
    if (level === 100) {
      iconContent = '💯';
      fontSize = 29;
      ctx.fillStyle = isDarkMode ? 'black' : 'yellow';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (battery.charging) {
      fontSize = 33;
      if (isDarkMode) {
        ctx.fillStyle = '#000084';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else if (level <= 20) {
      fontSize = 33;
      ctx.fillStyle = '#D32F2F';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      fontSize = 33;
    }

    // Determine text color
    if (userTextColor) {
      textColor = userTextColor;
    } else {
      // Fallback to original default colors
      if (battery.charging) {
        textColor = isDarkMode ? 'white' : '#4040B9';
      } else if (level <= 20) {
        textColor = 'white';
      } else {
        textColor = isDarkMode ? 'white' : 'green';
      }
    }

    // Draw text or emoji
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconContent, canvas.width / 2, canvas.height / 2 + 2);

    // Send image to background script
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

// Web Audio API setup for volume amplification
let audioContext;
let currentSource = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function stopCurrentSound() {
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
}

// Function to play the notification sound using Web Audio API
async function playNotificationSound(soundPath, volume) {
  if (!soundPath) return;

  stopCurrentSound();

  try {
    const context = getAudioContext();
    if (context.state === 'suspended') {
      await context.resume();
    }

    const response = await fetch(soundPath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);

    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    currentSource = source;

    source.onended = () => {
        if (currentSource === source) {
            currentSource = null;
        }
    };

    const gainNode = context.createGain();
    const gainValue = (volume !== undefined ? volume : 100) / 100;
    gainNode.gain.value = gainValue;

    source.connect(gainNode);
    gainNode.connect(context.destination);

    source.start(0);
  } catch (error) {
    console.error('Error playing sound with Web Audio API:', error);
    // Fallback for safety
    const sound = new Audio(soundPath);
    sound.volume = Math.min(1, (volume !== undefined ? volume : 100) / 100);
    sound.play();
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case 'getBatteryStatus':
      updateIcon(msg.textColor);
      break;
    case 'playSound':
      playNotificationSound(msg.sound, msg.volume);
      break;
    case 'stopSound':
      stopCurrentSound();
      break;
  }
});