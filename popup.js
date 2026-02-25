document.getElementById('startBtn').addEventListener('click', async () => {
  const text = document.getElementById('text').value;
  const minDelay = parseInt(document.getElementById('minDelay').value) || 30;
  const maxDelay = parseInt(document.getElementById('maxDelay').value) || 120;
  const addTypos = document.getElementById('typos').checked;
  const statusEl = document.getElementById('status');
  const btn = document.getElementById('startBtn');

  if (!text.trim()) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Please paste some text first!';
    return;
  }

  // Disable button and show typing status
  btn.disabled = true;
  btn.textContent = 'Typing...';
  statusEl.className = 'status typing';
  statusEl.textContent = `Typing ${text.length} characters...`;

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject and execute the typing script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: simulateTyping,
      args: [text, minDelay, maxDelay, addTypos]
    });

    statusEl.className = 'status success';
    statusEl.textContent = 'Done! Text has been typed.';
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Start Typing';
  }
});

// This function runs in the context of the page
function simulateTyping(text, minDelay, maxDelay, addTypos) {
  return new Promise((resolve, reject) => {
    const activeElement = document.activeElement;
    
    // Check if we have a valid input target
    if (!activeElement || 
        (activeElement.tagName !== 'INPUT' && 
         activeElement.tagName !== 'TEXTAREA' && 
         !activeElement.isContentEditable)) {
      reject(new Error('No input field focused. Click on an input field first!'));
      return;
    }

    const isContentEditable = activeElement.isContentEditable;
    let currentIndex = 0;
    
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
      // Add some variance - occasionally type faster or slower
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
      if (isContentEditable) {
        // For contenteditable elements
        document.execCommand('insertText', false, char);
      } else {
        // For input/textarea
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const value = activeElement.value;
        activeElement.value = value.substring(0, start) + char + value.substring(end);
        activeElement.selectionStart = activeElement.selectionEnd = start + 1;
        
        // Trigger input event
        activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    function deleteChar() {
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

    let typoToFix = false;

    function typeNext() {
      // If we made a typo, fix it first
      if (typoToFix) {
        deleteChar();
        typoToFix = false;
        setTimeout(typeNext, getRandomDelay());
        return;
      }

      if (currentIndex >= text.length) {
        resolve();
        return;
      }

      const char = text[currentIndex];
      
      // Maybe make a typo
      if (addTypos && char.match(/[a-zA-Z]/)) {
        const typo = makeTypo(char);
        if (typo) {
          typeChar(typo);
          typoToFix = true;
          currentIndex++; // We'll type the correct char after deleting
          currentIndex--; // But first go back
          setTimeout(typeNext, getRandomDelay());
          return;
        }
      }

      typeChar(char);
      currentIndex++;
      
      // Slightly longer pause after punctuation
      let delay = getRandomDelay();
      if (['.', '!', '?', ',', ';', ':'].includes(char)) {
        delay *= 1.5;
      }
      // Longer pause after sentences
      if (['.', '!', '?'].includes(char) && text[currentIndex] === ' ') {
        delay *= 2;
      }

      setTimeout(typeNext, delay);
    }

    typeNext();
  });
}
