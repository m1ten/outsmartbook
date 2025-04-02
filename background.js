const browserAPI = (function() {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return {
      name: 'Firefox',
      runtime: browser.runtime
    };
  } else {
    return {
      name: 'Chrome',
      runtime: chrome.runtime
    };
  }
})();

console.log(`OutSmartBook background running on ${browserAPI.name}`);

browserAPI.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ollama_generate') {
    fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message.data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => sendResponse({success: true, data}))
    .catch(error => {
      console.error("Error with Ollama API:", error);
      sendResponse({success: false, error: error.message});
    });
    
    return true; // Indicates async response
  }
});
