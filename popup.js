// State
let isTyping = false;
let isPaused = false;
let isPro = false;
const WORD_LIMIT = 90;

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

// Elements - upgrade bar
const upgradeBar = document.getElementById('upgradeBar');
const upgradeLink = document.getElementById('upgradeLink');

// Load saved settings and pro status
chrome.storage.local.get(['minDelay', 'maxDelay', 'typos', 'isPro'], (result) => {
  if (result.minDelay) minDelayEl.value = result.minDelay;
  if (result.maxDelay) maxDelayEl.value = result.maxDelay;
  if (result.typos !== undefined) typosEl.checked = result.typos;
  if (result.isPro) {
    isPro = true;
    const proStatus = document.getElementById('proStatus');
    if (proStatus) proStatus.style.display = 'block';
    if (upgradeBar) upgradeBar.style.display = 'none';
    updateWordCounter();
  }
  updatePresetHighlight();
});

// Word counting
function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function updateWordCounter() {
  const wordCounter = document.getElementById('wordCounter');
  if (!wordCounter) return;
  
  const words = countWords(textEl.value);
  
  if (isPro) {
    wordCounter.textContent = `${words} words`;
    wordCounter.className = 'word-counter';
  } else {
    wordCounter.textContent = `${words} / ${WORD_LIMIT} words`;
    if (words > WORD_LIMIT) {
      wordCounter.className = 'word-counter limit';
    } else if (words > WORD_LIMIT * 0.8) {
      wordCounter.className = 'word-counter warning';
    } else {
      wordCounter.className = 'word-counter';
    }
  }
}

// Update word count on text change
textEl.addEventListener('input', updateWordCounter);

// Paywall check
function checkPaywall() {
  if (isPro) return true;
  
  const words = countWords(textEl.value);
  if (words > WORD_LIMIT) {
    const paywall = document.getElementById('paywall');
    const wordCountEl = document.getElementById('wordCount');
    if (paywall && wordCountEl) {
      wordCountEl.textContent = `Your text has ${words} words.`;
      paywall.style.display = 'flex';
    }
    return false;
  }
  return true;
}

// Upgrade handler (shared by upgradeBtn and upgradeLink)
function handleUpgrade() {
  isPro = true;
  chrome.storage.local.set({ isPro: true });

  const paywall = document.getElementById('paywall');
  const proStatus = document.getElementById('proStatus');
  if (paywall) paywall.style.display = 'none';
  if (proStatus) proStatus.style.display = 'block';
  if (upgradeBar) upgradeBar.style.display = 'none';

  updateWordCounter();
  statusEl.className = 'status success';
  statusEl.textContent = '⚡ Upgraded to Pro! Unlimited words unlocked.';
}

// Upgrade button (paywall modal)
const upgradeBtn = document.getElementById('upgradeBtn');
if (upgradeBtn) {
  upgradeBtn.addEventListener('click', handleUpgrade);
}

// Upgrade link (bottom bar)
if (upgradeLink) {
  upgradeLink.addEventListener('click', (e) => {
    e.preventDefault();
    handleUpgrade();
  });
}

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
    updateWordCounter();
    statusEl.className = 'status success';
    statusEl.textContent = `📋 Pasted ${text.length} characters from clipboard`;
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Could not read clipboard. Try Ctrl+V instead.';
  }
});

// Sample texts for testing
const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet!",
  "Hello! I'm testing out this amazing typing simulator. It types just like a real human would, complete with natural pauses and occasional typos.",
  "Dear Sir or Madam, I am writing to inquire about the position advertised on your website. I believe my skills and experience make me an excellent candidate.",
  "Just wanted to follow up on our conversation from yesterday. Let me know if you have any questions or need additional information.",
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "This is a test of the Human Typer extension. Watch as each character appears one by one, simulating realistic human typing behavior.",
  "Thank you for your interest in our product! We're excited to help you get started. Please don't hesitate to reach out if you need assistance.",
  "Meeting notes: Discussed Q1 objectives, assigned action items to team leads, and scheduled follow-up for next Thursday at 2pm."
];

// Generate sample text button
const generateBtn = document.getElementById('generateBtn');
generateBtn.addEventListener('click', () => {
  const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
  textEl.value = randomText;
  updateWordCounter();
  statusEl.className = 'status success';
  statusEl.textContent = `✨ Generated sample text (${randomText.length} chars)`;
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
      updateWordCounter();
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

  // Check paywall
  if (!checkPaywall()) {
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
