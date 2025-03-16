chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ollama_generate') {
    fetch('http://localhost:11434/api/generate', {
      method: 'POST',
        headers: {
            'Host': 'localhost',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message.data)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // First clone and log the raw response for debugging
      response.clone().text().then(text => {
        console.log("Raw API response:", text);
      });
      return response.json();
    })
    .then(data => {
      sendResponse({success: true, data});
    })
    .catch(error => {
      console.error("Error with Ollama API:", error);
      sendResponse({success: false, error: error.message});
    });
    
    return true; // Indicates async response
  }
});