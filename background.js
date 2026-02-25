// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) return;

  switch (command) {
    case 'start-typing':
      // Read clipboard and start typing
      try {
        // Inject content script first
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });

        // Get settings
        const settings = await chrome.storage.local.get(['minDelay', 'maxDelay', 'typos']);
        const minDelay = settings.minDelay || 30;
        const maxDelay = settings.maxDelay || 120;
        const addTypos = settings.typos !== false;

        // Read clipboard by injecting a script
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async () => {
            try {
              return await navigator.clipboard.readText();
            } catch (e) {
              return null;
            }
          }
        });

        if (result.result) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'start',
            text: result.result,
            minDelay,
            maxDelay,
            addTypos
          });
        }
      } catch (err) {
        console.error('Error starting typing:', err);
      }
      break;

    case 'pause-resume':
      try {
        const state = await chrome.storage.local.get(['typingState']);
        if (state.typingState && state.typingState.isTyping) {
          if (state.typingState.isPaused) {
            chrome.tabs.sendMessage(tab.id, { action: 'resume' });
          } else {
            chrome.tabs.sendMessage(tab.id, { action: 'pause' });
          }
        }
      } catch (err) {
        console.error('Error toggling pause:', err);
      }
      break;

    case 'stop-typing':
      try {
        chrome.tabs.sendMessage(tab.id, { action: 'stop' });
      } catch (err) {
        console.error('Error stopping:', err);
      }
      break;
  }
});

// Clean up typing state when tab is closed
chrome.tabs.onRemoved.addListener(() => {
  chrome.storage.local.remove(['typingState']);
});
