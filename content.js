// Typing state
let typingState = {
  isTyping: false,
  isPaused: false,
  shouldStop: false,
  currentIndex: 0,
  text: '',
  minDelay: 30,
  maxDelay: 120,
  addTypos: true,
  typoToFix: false,
  activeElement: null,
  isContentEditable: false
};

// Common typo mappings (nearby keys)
const typoMap = {
  'a': ['s', 'q', 'z'],
  'b': ['v', 'n', 'g'],
  'c': ['x', 'v', 'd'],
  'd': ['s', 'f', 'e'],
  'e': ['w', 'r', 'd'],
  'f': ['d', 'g', 'r'],
  'g': ['f', 'h', 't'],
  'h': ['g', 'j', 'y'],
  'i': ['u', 'o', 'k'],
  'j': ['h', 'k', 'u'],
  'k': ['j', 'l', 'i'],
  'l': ['k', 'o', 'p'],
  'm': ['n', 'j', 'k'],
  'n': ['b', 'm', 'h'],
  'o': ['i', 'p', 'l'],
  'p': ['o', 'l'],
  'q': ['w', 'a'],
  'r': ['e', 't', 'f'],
  's': ['a', 'd', 'w'],
  't': ['r', 'y', 'g'],
  'u': ['y', 'i', 'j'],
  'v': ['c', 'b', 'f'],
  'w': ['q', 'e', 's'],
  'x': ['z', 'c', 's'],
  'y': ['t', 'u', 'h'],
  'z': ['a', 'x']
};

function getRandomDelay() {
  const { minDelay, maxDelay } = typingState;
  const baseDelay = Math.random() * (maxDelay - minDelay) + minDelay;
  
  // 10% chance of a longer pause (thinking)
  if (Math.random() < 0.1) {
    return baseDelay * 3;
  }
  // 20% chance of faster typing (burst)
  if (Math.random() < 0.2) {
    return baseDelay * 0.5;
  }
  return baseDelay;
}

function makeTypo(char) {
  const lower = char.toLowerCase();
  if (typoMap[lower] && Math.random() < 0.03) { // 3% typo rate
    const typoChar = typoMap[lower][Math.floor(Math.random() * typoMap[lower].length)];
    return char === char.toUpperCase() ? typoChar.toUpperCase() : typoChar;
  }
  return null;
}

function typeChar(char) {
  const { activeElement, isContentEditable } = typingState;
  
  if (isContentEditable) {
    document.execCommand('insertText', false, char);
  } else {
    const start = activeElement.selectionStart;
    const end = activeElement.selectionEnd;
    const value = activeElement.value;
    activeElement.value = value.substring(0, start) + char + value.substring(end);
    activeElement.selectionStart = activeElement.selectionEnd = start + 1;
    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function deleteChar() {
  const { activeElement, isContentEditable } = typingState;
  
  if (isContentEditable) {
    document.execCommand('delete', false, null);
  } else {
    const start = activeElement.selectionStart;
    if (start > 0) {
      const value = activeElement.value;
      activeElement.value = value.substring(0, start - 1) + value.substring(start);
      activeElement.selectionStart = activeElement.selectionEnd = start - 1;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

function updateState() {
  chrome.storage.local.set({
    typingState: {
      isTyping: typingState.isTyping,
      isPaused: typingState.isPaused
    }
  });
}

function sendProgress() {
  chrome.runtime.sendMessage({
    type: 'progress',
    current: typingState.currentIndex,
    total: typingState.text.length
  });
}

function typeNext() {
  // Check if stopped
  if (typingState.shouldStop) {
    typingState.isTyping = false;
    typingState.shouldStop = false;
    updateState();
    chrome.runtime.sendMessage({ type: 'stopped' });
    return;
  }

  // Check if paused
  if (typingState.isPaused) {
    setTimeout(typeNext, 100);
    return;
  }

  // If we made a typo, fix it first
  if (typingState.typoToFix) {
    deleteChar();
    typingState.typoToFix = false;
    setTimeout(typeNext, getRandomDelay());
    return;
  }

  // Check if done
  if (typingState.currentIndex >= typingState.text.length) {
    typingState.isTyping = false;
    updateState();
    chrome.runtime.sendMessage({ type: 'complete' });
    return;
  }

  const char = typingState.text[typingState.currentIndex];
  
  // Maybe make a typo
  if (typingState.addTypos && char.match(/[a-zA-Z]/)) {
    const typo = makeTypo(char);
    if (typo) {
      typeChar(typo);
      typingState.typoToFix = true;
      setTimeout(typeNext, getRandomDelay());
      return;
    }
  }

  typeChar(char);
  typingState.currentIndex++;
  
  // Send progress every 10 characters
  if (typingState.currentIndex % 10 === 0) {
    sendProgress();
  }
  
  // Calculate delay
  let delay = getRandomDelay();
  if (['.', '!', '?', ',', ';', ':'].includes(char)) {
    delay *= 1.5;
  }
  if (['.', '!', '?'].includes(char) && typingState.text[typingState.currentIndex] === ' ') {
    delay *= 2;
  }

  setTimeout(typeNext, delay);
}

function startTyping(text, minDelay, maxDelay, addTypos) {
  const activeElement = document.activeElement;
  
  // Check if we have a valid input target
  if (!activeElement || 
      (activeElement.tagName !== 'INPUT' && 
       activeElement.tagName !== 'TEXTAREA' && 
       !activeElement.isContentEditable)) {
    chrome.runtime.sendMessage({ 
      type: 'error', 
      error: 'No input field focused. Click on an input field first!' 
    });
    return;
  }

  // Initialize state
  typingState = {
    isTyping: true,
    isPaused: false,
    shouldStop: false,
    currentIndex: 0,
    text,
    minDelay,
    maxDelay,
    addTypos,
    typoToFix: false,
    activeElement,
    isContentEditable: activeElement.isContentEditable
  };

  updateState();
  sendProgress();
  typeNext();
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'start':
      startTyping(message.text, message.minDelay, message.maxDelay, message.addTypos);
      break;
    case 'pause':
      typingState.isPaused = true;
      updateState();
      break;
    case 'resume':
      typingState.isPaused = false;
      updateState();
      break;
    case 'stop':
      typingState.shouldStop = true;
      break;
  }
});
