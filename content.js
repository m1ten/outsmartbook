/**
 * OutSmartBook - McGraw Hill SmartBook enhancement
 * Optimized and organized for better performance and maintenance
 */
console.log("OutSmartBook 🔥");

// Core initialization
window.addEventListener("load", () => {
  console.log("OutSmartBook LOADED ⚡️");
  const rootEl = document;
  
  // Initialize mutation observer to detect new questions
  const observer = new MutationObserver(() => {
    if (!rootEl.querySelector(".outsmartbook-research-buttons")) {
      setupFeatures();
    }
  });
  
  // Start observing for DOM changes
  observer.observe(rootEl, {
    subtree: true,
    childList: true,
  });
  
  /**
   * Main setup function - creates all buttons and handlers
   */
  const setupFeatures = () => {
    // Get question elements
    const promptEl = rootEl.querySelector(".prompt");
    const parentEl = rootEl.querySelector("h2.probe-header");
    if (!promptEl || !promptEl.querySelector("p")) {
      return;
    }
    
    // Extract question and choices
    const question = extractText(promptEl.querySelector("p"));
    const choiceTextEls = rootEl.querySelectorAll(".choiceText");
    const choices = Array.from(choiceTextEls).map(el => extractText(el));
    
    // Create buttons container
    const buttonsEl = createButtonsContainer(question, choices);
    parentEl.after(buttonsEl);
    
    // Add keyboard shortcut for submitting
    setupKeyboardShortcuts(promptEl);
  };
  
  /**
   * Extract and clean text from HTML element
   */
  const extractText = (element) => {
    return element.innerText
      .replaceAll("\n", "")
      .replace(/\s+/g, " ")
      .trim();
  };
  
  /**
   * Creates the container with all tool buttons
   */
  const createButtonsContainer = (question, choices) => {
    const buttonsEl = document.createElement("div");
    buttonsEl.classList.add("outsmartbook-research-buttons");
    
    // Add Google search button
    buttonsEl.appendChild(createGoogleButton(question));
    
    // Add Quizlet search button
    buttonsEl.appendChild(createQuizletButton(question));
    
    // Add Llama button for AI assistance
    buttonsEl.appendChild(createLlamaButton(question, choices, rootEl));
    
    // Add Copy button
    buttonsEl.appendChild(createCopyButton(question));
    
    return buttonsEl;
  };
  
  /**
   * Creates a Google search button
   */
  const createGoogleButton = (question) => {
    const googleButton = document.createElement("button");
    googleButton.innerText = "Google";
    googleButton.setAttribute(
      "title",
      "Open a new Google search with this question"
    );
    googleButton.classList.add("outsmartbook-button", "outsmartbook-google");
    googleButton.addEventListener("click", () => {
      window.open(`https://google.com/search?q=${encodeURIComponent(question)}`);
    });
    return googleButton;
  };
  
  /**
   * Creates a Quizlet search button
   */
  const createQuizletButton = (question) => {
    const quizletButton = document.createElement("button");
    quizletButton.innerText = "Quizlet";
    quizletButton.setAttribute(
      "title",
      "Search for Quizlet flashcards of this question"
    );
    quizletButton.classList.add("outsmartbook-button", "outsmartbook-quizlet");
    quizletButton.addEventListener("click", () => {
      window.open(
        `https://quizlet.com/search?query=${encodeURIComponent(question)}&type=all`
      );
    });
    return quizletButton;
  };
  
  /**
   * Creates a Copy button for the question text
   */
  const createCopyButton = (question) => {
    const copyButton = document.createElement("button");
    copyButton.innerText = "Copy";
    copyButton.setAttribute("title", "Copy the question to your clipboard");
    copyButton.classList.add("outsmartbook-button", "outsmartbook-copy");
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(question);
      copyButton.classList.add("success");
      copyButton.innerText = "Copied!";
      setTimeout(() => {
        copyButton.classList.remove("success");
        copyButton.innerText = "Copy";
      }, 2000);
    });
    return copyButton;
  };
  
  /**
   * Creates the main Llama button for AI-powered answers
   */
  const createLlamaButton = (question, choices, rootEl) => {
    const llamaButton = document.createElement("button");
    llamaButton.innerText = "Llama";
    llamaButton.setAttribute("title", "Get an AI answer with Llama");
    llamaButton.classList.add("outsmartbook-button", "outsmartbook-llama");
    
    // Create optimized prompt
    const instructions = "Give me the answer to this question, only the answer no other words nor rephrasing. No explanation.";
    const llamaPrompt = `Instructions: ${instructions} | Question: ${question} | choices: ${choices.join(", ")}`;
    
    // Add click event
    llamaButton.addEventListener("click", () => handleLlamaClick(llamaButton, llamaPrompt, question, choices, rootEl));
    
    return llamaButton;
  };
  
  /**
   * Handle the Llama button click event
   */
  const handleLlamaClick = (llamaButton, llamaPrompt, question, choices, rootEl) => {
    // Prevent multiple clicks
    if (llamaButton.disabled) return;
    
    // Show loading state
    llamaButton.innerText = "Loading...";
    llamaButton.disabled = true;
    
    generateWithOllama({
      model: "llama3.2",
      prompt: llamaPrompt,
      stream: false
    })
    .then(data => {
      console.log("Llama response:", data);
      const response = data.response || "";
      
      // Process the response based on question type
      processLlamaResponse(response, rootEl, llamaButton);
    })
    .catch(error => {
      console.error("Error with Llama request:", error);
      llamaButton.innerText = "Error";
      setTimeout(() => {
        llamaButton.innerText = "Llama";
        llamaButton.disabled = false;
      }, 1000);
    });
  };
  
  /**
   * Process the Llama response based on question type
   */
  const processLlamaResponse = (response, rootEl, llamaButton) => {
    let answerSelected = false;
    
    // Check for fill-in-the-blank text input fields first
    const textInputs = rootEl.querySelectorAll('input.fitb-input[aria-label="Field 1 of 1"]');
    if (textInputs && textInputs.length > 0) {
      answerSelected = handleTextInputQuestion(textInputs, llamaButton);
      return; // Exit early if we handled text inputs
    }
    
    // Handle multiple choice questions
    answerSelected = handleMultipleChoiceQuestion(response, rootEl);
    
    // Reset button state and show tooltip
    llamaButton.innerText = "Llama";
    llamaButton.disabled = false;
    
    showTooltip(llamaButton, `Llama says: ${response}${answerSelected ? ' (Answer selected)' : ' (No match found)'}`);
  };
  
  /**
   * Handle fill-in-the-blank text input questions
   */
  const handleTextInputQuestion = (textInputs, llamaButton) => {
    console.log("Fill-in-the-blank question detected");
    
    // Get a random human-like answer
    const randomAnswers = [
      "concept", "theory", "process", "method", "function", 
      "analysis", "result", "factor", "element", "value"
    ];
    const randomAnswer = randomAnswers[Math.floor(Math.random() * randomAnswers.length)];
    
    // Fill in each blank
    textInputs.forEach(input => {
      input.value = randomAnswer;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Highlight the input
      input.style.backgroundColor = '#ffebf0';
      input.style.border = '2px solid #ff5722';
    });
    
    // Reset button state
    llamaButton.innerText = "Llama";
    llamaButton.disabled = false;
    
    // Show tooltip
    showTooltip(llamaButton, `Random answer used: "${randomAnswer}"`);
    
    // Handle post-selection actions
    setTimeout(() => handlePostSelection(), 500);
    
    return true;
  };
  
  /**
   * Handle multiple choice questions (radio buttons or checkboxes)
   */
  const handleMultipleChoiceQuestion = (response, rootEl) => {
    const choiceElements = rootEl.querySelectorAll("mhe-radio-button input[type='radio'], input[type='checkbox']");
    if (!choiceElements || choiceElements.length === 0) {
      return false;
    }
    
    let answerSelected = false;
    let bestMatch = null;
    let highestSimilarity = 0;
    const isCheckboxQuestion = choiceElements[0].type === 'checkbox';
    
    // Process each choice
    for (const inputEl of choiceElements) {
      const labelId = inputEl.getAttribute('aria-labelledby');
      if (!labelId) continue;
      
      const labelElement = document.getElementById(labelId);
      if (!labelElement) continue;
      
      const choiceText = labelElement.textContent.trim().toLowerCase();
      const similarity = calculateSimilarity(response.toLowerCase(), choiceText);
      
      console.log(`Choice: "${choiceText}", Similarity: ${similarity}`);
      
      if (isCheckboxQuestion) {
        // For checkbox questions, select all options with good similarity
        if (similarity > 0.3) {
          inputEl.click();
          answerSelected = true;
          highlightElement(labelElement, false);
        }
      } else {
        // For radio buttons, track the best match
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = { input: inputEl, label: labelElement };
        }
      }
    }
    
    // Select the best match for radio buttons
    if (!isCheckboxQuestion && bestMatch && highestSimilarity > 0.3) {
      bestMatch.input.click();
      answerSelected = true;
      highlightElement(bestMatch.label, false);
    } 
    // Fall back to random selection if needed
    else if (!answerSelected) {
      const randomIndex = Math.floor(Math.random() * choiceElements.length);
      choiceElements[randomIndex].click();
      answerSelected = true;
      
      const labelId = choiceElements[randomIndex].getAttribute('aria-labelledby');
      const labelElement = document.getElementById(labelId);
      if (labelElement) {
        highlightElement(labelElement, true);
      }
    }
    
    // Handle post-selection actions
    if (answerSelected) {
      setTimeout(() => handlePostSelection(), 500);
    }
    
    return answerSelected;
  };
  
  /**
   * Handle actions after selecting an answer (confidence buttons, etc)
   */
  const handlePostSelection = () => {
    const confidenceButtons = document.querySelector(".confidence-buttons-container");
    if (!confidenceButtons) return;
    
    const lowConfidenceButton = confidenceButtons.querySelector('button[aria-label="Low Confidence"]');
    if (!lowConfidenceButton || lowConfidenceButton.disabled) return;
    
    // Click the low confidence button
    lowConfidenceButton.click();
    
    // Wait for UI to update after clicking confidence
    setTimeout(() => handlePostConfidence(), 1000);
  };
  
  /**
   * Handle actions after clicking confidence button
   */
  const handlePostConfidence = () => {
    // Check for mandatory reading section
    const trayButton = document.querySelector('button.lr-tray-expand-button');
    const isMandatoryReading = trayButton && 
      trayButton.innerText.includes("Select a concept resource to continue");
    
    if (isMandatoryReading) {
      const readingButton = document.querySelector('button.lr-tray-button');
      if (readingButton) {
        console.log("Mandatory reading detected");
        readingButton.click();
        
        setTimeout(() => {
          const toQuestionsButton = document.querySelector('button[data-automation-id="reading-questions-button"]');
          if (toQuestionsButton) {
            toQuestionsButton.click();
            setTimeout(handleNextQuestion, 1000);
          }
        }, 1000);
      }
    } else {
      handleNextQuestion();
    }
  };
  
  /**
   * Handle clicking the next question button
   */
  const handleNextQuestion = () => {
    const nextButton = document.querySelector(".next-button");
    if (nextButton) {
      nextButton.click();
      
      setTimeout(() => {
        const newLlamaButton = document.querySelector(".outsmartbook-llama");
        if (newLlamaButton) {
          newLlamaButton.click();
        }
      }, 2000);
    }
  };
  
  /**
   * Set up keyboard shortcuts
   */
  const setupKeyboardShortcuts = (promptEl) => {
    const allInputs = Array.from(promptEl.querySelectorAll("input"));
    allInputs.forEach((input) => {
      input.addEventListener("keyup", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
          submitQuestion();
        }
      });
    });
  };
  
  /**
   * Submit question with high confidence
   */
  const submitQuestion = () => {
    const submitButtons = document.querySelector(".confidence-buttons-wrapper");
    if (!submitButtons) return;
    
    const submitButton = submitButtons.querySelector(`button[aria-label="High Confidence"]`);
    if (!submitButton) return;
    
    submitButton.click();
    
    setTimeout(() => {
      const nextButton = document.querySelector(".next-button");
      if (nextButton) {
        nextButton.focus();
      }
    }, 500);
  };
});

/**
 * Helper function to communicate with background script for Ollama API calls
 */
function generateWithOllama(data) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      type: 'ollama_generate',
      data: data
    }, response => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        reject(response?.error || 'Request failed');
      }
    });
  });
}

/**
 * Helper function to calculate similarity between two strings
 */
function calculateSimilarity(str1, str2) {
  // Convert to lowercase and trim once
  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();
  
  // Direct containment is a strong signal
  if (str1.includes(str2)) return 0.95;
  if (str2.includes(str1)) return 0.9;
  
  // Use a Set for more efficient lookups
  const words1 = new Set(str1.split(/\W+/).filter(w => w.length > 3));
  const words2 = new Set(str2.split(/\W+/).filter(w => w.length > 3));
  
  // Early exit for empty cases
  if (words1.size === 0 || words2.size === 0) return 0;
  
  // Count matching words
  let matchCount = 0;
  for (const word of words1) {
    if (words2.has(word)) matchCount++;
  }
  
  // Calculate Jaccard similarity (intersection over union)
  return matchCount / (words1.size + words2.size - matchCount);
}

/**
 * Helper function to show a tooltip
 */
function showTooltip(anchorElement, message, duration = 5000) {
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.backgroundColor = '#333';
  tooltip.style.color = 'white';
  tooltip.style.padding = '8px';
  tooltip.style.borderRadius = '4px';
  tooltip.style.zIndex = '1000';
  tooltip.style.maxWidth = '300px';
  tooltip.style.left = `${anchorElement.offsetLeft}px`;
  tooltip.style.top = `${anchorElement.offsetTop + anchorElement.offsetHeight + 5}px`;
  tooltip.textContent = message;
  
  document.body.appendChild(tooltip);
  
  setTimeout(() => {
    if (tooltip.parentNode) {
      document.body.removeChild(tooltip);
    }
  }, duration);
}

/**
 * Helper function to highlight elements
 */
function highlightElement(element, isRandom) {
  if (isRandom) {
    element.style.backgroundColor = '#ffebf0';
    element.style.border = '2px solid #ff5722';
  } else {
    element.style.backgroundColor = '#f0f9ff';
    element.style.border = '2px solid #2196F3';
  }
}