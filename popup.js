// State
let isTyping = false;
let isPaused = false;

// Elements
const textEl = document.getElementById('text');
const minDelayEl = document.getElementById('minDelay');
const maxDelayEl = document.getElementById('maxDelay');
const typosEl = document.getElementById('typos');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const controlRow = document.getElementById('controlRow');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const clipboardBtn = document.getElementById('clipboardBtn');

// Load saved settings
chrome.storage.local.get(['minDelay', 'maxDelay', 'typos'], (result) => {
  if (result.minDelay) minDelayEl.value = result.minDelay;
  if (result.maxDelay) maxDelayEl.value = result.maxDelay;
  if (result.typos !== undefined) typosEl.checked = result.typos;
  updatePresetHighlight();
});

// Save settings when changed
function saveSettings() {
  chrome.storage.local.set({
    minDelay: parseInt(minDelayEl.value),
    maxDelay: parseInt(maxDelayEl.value),
    typos: typosEl.checked
  });
}

minDelayEl.addEventListener('change', () => { saveSettings(); updatePresetHighlight(); });
maxDelayEl.addEventListener('change', () => { saveSettings(); updatePresetHighlight(); });
typosEl.addEventListener('change', saveSettings);

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const min = btn.dataset.min;
    const max = btn.dataset.max;
    minDelayEl.value = min;
    maxDelayEl.value = max;
    saveSettings();
    updatePresetHighlight();
  });
});

function updatePresetHighlight() {
  const min = minDelayEl.value;
  const max = maxDelayEl.value;
  document.querySelectorAll('.preset-btn').forEach(btn => {
    const isMatch = btn.dataset.min === min && btn.dataset.max === max;
    btn.classList.toggle('active', isMatch);
  });
}

// Clipboard button
clipboardBtn.addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    textEl.value = text;
    statusEl.className = 'status success';
    statusEl.textContent = `📋 Pasted ${text.length} characters from clipboard`;
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Could not read clipboard. Try Ctrl+V instead.';
  }
});

// Start button
startBtn.addEventListener('click', () => startTyping());

// Pause button
pauseBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (isPaused) {
    chrome.tabs.sendMessage(tab.id, { action: 'resume' });
    isPaused = false;
    pauseBtn.textContent = '⏸️ Pause';
    pauseBtn.className = 'warning';
    statusEl.className = 'status typing';
    statusEl.textContent = 'Resumed typing...';
  } else {
    chrome.tabs.sendMessage(tab.id, { action: 'pause' });
    isPaused = true;
    pauseBtn.textContent = '▶️ Resume';
    pauseBtn.className = 'secondary';
    statusEl.className = 'status paused';
    statusEl.textContent = 'Paused. Click Resume to continue.';
  }
});

// Stop button
stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'stop' });
  resetUI();
  statusEl.className = 'status error';
  statusEl.textContent = 'Stopped.';
});

async function startTyping(fromClipboard = false) {
  let text = textEl.value;
  
  if (fromClipboard) {
    try {
      text = await navigator.clipboard.readText();
      textEl.value = text;
    } catch (err) {
      statusEl.className = 'status error';
      statusEl.textContent = 'Could not read clipboard.';
      return;
    }
  }

  const minDelay = parseInt(minDelayEl.value) || 30;
  const maxDelay = parseInt(maxDelayEl.value) || 120;
  const addTypos = typosEl.checked;

  if (!text.trim()) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Please paste some text first!';
    return;
  }

  // Update UI
  isTyping = true;
  isPaused = false;
  startBtn.style.display = 'none';
  controlRow.style.display = 'flex';
  progressBar.classList.add('active');
  progressFill.style.width = '0%';
  statusEl.className = 'status typing';
  statusEl.textContent = `Typing ${text.length} characters...`;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // First inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    // Then send the typing command
    chrome.tabs.sendMessage(tab.id, {
      action: 'start',
      text,
      minDelay,
      maxDelay,
      addTypos
    });

  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = `Error: ${err.message}`;
    resetUI();
  }
}

function resetUI() {
  isTyping = false;
  isPaused = false;
  startBtn.style.display = 'block';
  controlRow.style.display = 'none';
  progressBar.classList.remove('active');
  pauseBtn.textContent = '⏸️ Pause';
  pauseBtn.className = 'warning';
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'progress') {
    const percent = Math.round((message.current / message.total) * 100);
    progressFill.style.width = `${percent}%`;
    statusEl.textContent = `Typing... ${message.current}/${message.total} (${percent}%)`;
  } else if (message.type === 'complete') {
    statusEl.className = 'status success';
    statusEl.textContent = 'Done! Text has been typed.';
    resetUI();
  } else if (message.type === 'error') {
    statusEl.className = 'status error';
    statusEl.textContent = message.error;
    resetUI();
  } else if (message.type === 'stopped') {
    resetUI();
  }
});

// Check if already typing when popup opens
chrome.storage.local.get(['typingState'], (result) => {
  if (result.typingState && result.typingState.isTyping) {
    isTyping = true;
    isPaused = result.typingState.isPaused;
    startBtn.style.display = 'none';
    controlRow.style.display = 'flex';
    progressBar.classList.add('active');
    if (isPaused) {
      pauseBtn.textContent = '▶️ Resume';
      pauseBtn.className = 'secondary';
      statusEl.className = 'status paused';
      statusEl.textContent = 'Paused. Click Resume to continue.';
    } else {
      statusEl.className = 'status typing';
      statusEl.textContent = 'Typing in progress...';
    }
  }
});
