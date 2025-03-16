console.log("SmarterBook is running 😎");
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

window.addEventListener("load", () => {
  console.log("LOADED");
  const rootEl = document;
  var observer = new MutationObserver(() => {
    if (!rootEl.querySelector(".smarterbook-research-buttons")) {
      setupFeatures();
    }
  });

  const setupFeatures = () => {
    const promptEl = rootEl.querySelector(".prompt");
    const parentEl = rootEl.querySelector("h2.probe-header");
    if (!promptEl || !promptEl.querySelector("p")) {
      return;
    }
    const question = promptEl
      .querySelector("p")
      .innerText.replaceAll("\n", "")
      .replace(/\s+/g, " ")
      .trim();
    
    const choiceTextEls = rootEl.querySelectorAll(".choiceText");
    const choices = Array.from(choiceTextEls)
      .map(el =>
      el.innerText.replaceAll("\n", "").replace(/\s+/g, " ").trim()
      );
    
    const buttonsEl = document.createElement("div");
    buttonsEl.classList.add("smarterbook-research-buttons");

    // SEARCH ON GOOGLE button
    const googleButton = document.createElement("button");
    googleButton.innerText = "Google";
    googleButton.setAttribute(
      "title",
      "Open a new Google search with this question"
    );
    googleButton.classList.add("smarterbook-button");
    googleButton.classList.add("smarterbook-google");
    googleButton.addEventListener("click", () => {
      window.open(
        `https://google.com/search?q=${encodeURIComponent(question)}`
      );
    });


    // QUIZLET button
    const quizletButton = document.createElement("button");
    quizletButton.innerText = "Quizlet";
    quizletButton.setAttribute(
      "title",
      "Search for Quizlet flashcards of this question"
    );
    quizletButton.classList.add("smarterbook-button");
    quizletButton.classList.add("smarterbook-quizlet");
    quizletButton.addEventListener("click", () => {
      window.open(
        `https://quizlet.com/search?query=${encodeURIComponent(
          question
        )}&type=all`
      );
    });

    // BING CHAT button
    // const bingButton = document.createElement("button");
    // bingButton.innerText = "Research with GPT4";
    // bingButton.setAttribute(
    //   "title",
    //   "Open a new GPT4 Bing Chat with this question"
    // );
    // bingButton.classList.add("smarterbook-button");
    // bingButton.classList.add("smarterbook-bing");
    // bingButton.addEventListener("click", () => {
    //   window.open(
    //     `https://www.bing.com/search?showconv=1&sendquery=1&q=${encodeURIComponent(
    //       question
    //     )}`
    //   );
    // });

    let instructions = "Give me the answer to this question, only the answer no other words nor rephrasing. No explanation.";
    let llamaPrompt = `Instructions: ${instructions} | Question: ${question} | choices: ${choices.join(", ")}`;

    // ask llama button
    const llamaButton = document.createElement("button");
    llamaButton.innerText = "Llama";
    llamaButton.setAttribute(
      "title",
      "Open a new Llama Chat with this question"
    );
    llamaButton.classList.add("smarterbook-button");
    llamaButton.classList.add("smarterbook-llama");
    llamaButton.addEventListener("click", () => {
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
        let answerSelected = false;
        
        // Check for fill-in-the-blank text input fields first
        const textInputs = rootEl.querySelectorAll('input.fitb-input[aria-label="Field 1 of 1"]');
        if (textInputs && textInputs.length > 0) {
          // This is a fill-in-the-blank question
          console.log("Fill-in-the-blank question detected");
          
          const randomAnswer = Math.random().toString(36).substring(2, 7);
          
          // Fill in each blank with the random answer
          textInputs.forEach((input) => {
            // Set the value and dispatch events to trigger validation
            input.value = randomAnswer;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Highlight the input to indicate it's been filled
            input.style.backgroundColor = '#ffebf0';
            input.style.border = '2px solid #ff5722';
          });
          
          answerSelected = true;
          
          // Wait a short time then click the low confidence button
          if (answerSelected) {
            setTimeout(() => {
              const confidenceButtons = document.querySelector(".confidence-buttons-container");
              if (confidenceButtons) {
                const lowConfidenceButton = confidenceButtons.querySelector('button[aria-label="Low Confidence"]');
                if (lowConfidenceButton && !lowConfidenceButton.disabled) {
                  lowConfidenceButton.click();
                  
                  // Rest of the confidence button handling code...
                  setTimeout(() => {
                    // Existing code for checking reading resources
                    // ...
                  }, 1000);
                }
              }
            }, 500);
          }
          
          // Skip the radio/checkbox handling since we've handled the text input
          return;
        }
        
        // Existing radio/checkbox handling code
        const choiceElements = rootEl.querySelectorAll("mhe-radio-button input[type='radio'], input[type='checkbox']");
        if (choiceElements && choiceElements.length > 0) {
          let bestMatch = null;
          let highestSimilarity = 0;
          const isCheckboxQuestion = choiceElements[0].type === 'checkbox';
          
          // For each choice, calculate similarity with Llama response
          choiceElements.forEach(inputEl => {
            const labelId = inputEl.getAttribute('aria-labelledby');
            if (!labelId) return;
            
            const labelElement = document.getElementById(labelId);
            if (!labelElement) return;
            
            const choiceText = labelElement.textContent.trim().toLowerCase();
            const similarity = calculateSimilarity(response.toLowerCase(), choiceText);
            
            console.log(`Choice: "${choiceText}", Similarity: ${similarity}`);
            
            if (isCheckboxQuestion) {
              // For checkbox questions, select options with similarity above threshold
              if (similarity > 0.3) {
                inputEl.click();
                answerSelected = true;
                
                // Highlight the selected option
                if (labelElement) {
                  labelElement.style.backgroundColor = '#f0f9ff';
                  labelElement.style.border = '2px solid #2196F3';
                }
              }
            } else {
              // For radio button questions, select the best match
              if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatch = inputEl;
              }
            }
          });
          
          // For radio buttons, select the best match if found
          if (!isCheckboxQuestion && bestMatch && highestSimilarity > 0.3) {
            bestMatch.click();
            answerSelected = true;
            
            // Highlight the selected option
            const labelId = bestMatch.getAttribute('aria-labelledby');
            const labelElement = document.getElementById(labelId);
            if (labelElement) {
              labelElement.style.backgroundColor = '#f0f9ff';
              labelElement.style.border = '2px solid #2196F3';
            }
          }
          
          // If no answer was selected for radio button questions (no good match found)
          if (!isCheckboxQuestion && !answerSelected) {
            console.log("No good match found for radio button question. Selecting random option.");
            const randomIndex = Math.floor(Math.random() * choiceElements.length);
            choiceElements[randomIndex].click();
            answerSelected = true;
            
            // Highlight the selected option with a different style to indicate random selection
            const labelId = choiceElements[randomIndex].getAttribute('aria-labelledby');
            const labelElement = document.getElementById(labelId);
            if (labelElement) {
              labelElement.style.backgroundColor = '#ffebf0'; // Different color to indicate random selection
              labelElement.style.border = '2px solid #ff5722';
            }
          }

          // If no answer was selected in checkbox mode and we should select at least one
          if (isCheckboxQuestion && !answerSelected) {
            // Select a random checkbox as fallback
            const randomIndex = Math.floor(Math.random() * choiceElements.length);
            choiceElements[randomIndex].click();
            answerSelected = true;
            
            // Highlight the selected option
            const labelId = choiceElements[randomIndex].getAttribute('aria-labelledby');
            const labelElement = document.getElementById(labelId);
            if (labelElement) {
              labelElement.style.backgroundColor = '#ffebf0'; // Different color to indicate random selection
              labelElement.style.border = '2px solid #ff5722';
            }
          }
          
          // Wait a short time then click the low confidence button if an answer was selected
          if (answerSelected) {
            setTimeout(() => {
              const confidenceButtons = document.querySelector(".confidence-buttons-container");
              if (confidenceButtons) {
                const lowConfidenceButton = confidenceButtons.querySelector('button[aria-label="Low Confidence"]');
                if (lowConfidenceButton && !lowConfidenceButton.disabled) {
                  lowConfidenceButton.click();
                  
                  // Wait for UI to update after clicking low confidence
                  setTimeout(() => {
                    // Check if the "Select a concept resource to continue" button appears
                    const trayButton = document.querySelector('button.lr-tray-expand-button');
                    const isMandatoryReading = trayButton && 
                      trayButton.innerText.includes("Select a concept resource to continue");
                    
                    // Look for reading button
                    const readingButton = document.querySelector('button.lr-tray-button');
                    
                    // Only proceed with reading if it's mandatory or no next button is available
                    if (isMandatoryReading && readingButton) {
                      console.log("Mandatory reading detected");
                      // Click "Read About the Concept" button
                      readingButton.click();
                      
                      // Wait for the reading content to load
                      setTimeout(() => {
                        // Look for "To Questions" button and click it
                        const toQuestionsButton = document.querySelector('button[data-automation-id="reading-questions-button"]');
                        if (toQuestionsButton) {
                          toQuestionsButton.click();
                          
                          // Wait for questions to load and then find Next button
                          setTimeout(() => {
                            const nextButton = document.querySelector(".next-button");
                            if (nextButton) {
                              nextButton.click();
                              
                              // Wait for page to load next question, then click Llama again
                              setTimeout(() => {
                                const newLlamaButton = document.querySelector(".smarterbook-llama");
                                if (newLlamaButton) {
                                  newLlamaButton.click();
                                }
                              }, 2000); // Wait 2 seconds for next question to load
                            }
                          }, 1000); // Wait 1 second after clicking "To Questions"
                        }
                      }, 1000); // Wait 1 second after clicking "Read About the Concept"
                    } else {
                      // If not mandatory reading or no reading button, look directly for Next Question button
                      const nextButton = document.querySelector(".next-button");
                      if (nextButton) {
                        nextButton.click();
                        
                        // Wait for page to load next question, then click Llama again
                        setTimeout(() => {
                          const newLlamaButton = document.querySelector(".smarterbook-llama");
                          if (newLlamaButton) {
                            newLlamaButton.click();
                          }
                        }, 2000); // Wait 2 seconds for next question to load
                      }
                    }
                  }, 1000); // Wait 1 second after clicking confidence
                }
              }
            }, 500);
          }
        }
        
        // Reset button state
        llamaButton.innerText = "Llama";
        llamaButton.disabled = false;
        
        // Display Llama's answer in a small tooltip
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#333';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.zIndex = '1000';
        tooltip.style.maxWidth = '300px';
        tooltip.style.left = `${llamaButton.offsetLeft}px`;
        tooltip.style.top = `${llamaButton.offsetTop + llamaButton.offsetHeight + 5}px`;
        tooltip.textContent = `Llama says: ${response}${answerSelected ? ' (Answer selected)' : ' (No match found)'}`;
        
        document.body.appendChild(tooltip);
        setTimeout(() => {
          document.body.removeChild(tooltip);
        }, 5000);
      })
      .catch(error => {
        console.error("Error with Llama request:", error);
        llamaButton.innerText = "Error";
        setTimeout(() => {
          llamaButton.innerText = "Llama";
          llamaButton.disabled = false;
        }, 1000);
      });
    });

    // COPY QUESTION button
    const copyButton = document.createElement("button");
    copyButton.innerText = "Copy";
    copyButton.setAttribute("title", "Copy the question to your clipboard");
    copyButton.classList.add("smarterbook-button");
    copyButton.classList.add("smarterbook-copy");
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(question);
      copyButton.classList.add("success");
      copyButton.innerText = "Copied!";
    });

    buttonsEl.appendChild(googleButton);
    buttonsEl.appendChild(quizletButton);
    buttonsEl.appendChild(llamaButton);
    buttonsEl.appendChild(copyButton);
    parentEl.after(buttonsEl);
    const allInputs = Array.from(promptEl.querySelectorAll("input"));
    allInputs.forEach((input) => {
      input.addEventListener("keyup", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
          submitQuestion();
        }
      });
    });
  };

  const submitQuestion = () => {
    const submitButtons = document.querySelector(".confidence-buttons-wrapper");
    const submitButton = submitButtons.querySelector(
      `button[aria-label="High Confidence"]`
    );
    submitButton.click();
    setTimeout(() => {
      if (!document.querySelector(".next-button")) {
        console.error("No next button found on-screen");
        return;
      }
      document.querySelector(".next-button").focus();
    }, 500);
  };

  // define what element should be observed by the observer
  // and what types of mutations trigger the callback
  observer.observe(rootEl, {
    subtree: true,
    childList: true,
  });
});

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

// Helper function to calculate similarity between two strings
function calculateSimilarity(str1, str2) {
  // Convert to lowercase and trim
  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();
  
  // Simple check if one string contains the other
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.9;
  }
  
  // Check for key words match
  const words1 = str1.split(/\W+/).filter(w => w.length > 3);
  const words2 = str2.split(/\W+/).filter(w => w.length > 3);
  
  let matchCount = 0;
  for (const word of words1) {
    if (words2.some(w => w === word)) {
      matchCount++;
    }
  }
  
  // Calculate similarity based on word matches
  const totalWords = Math.max(words1.length, words2.length);
  if (totalWords === 0) return 0;
  
  return matchCount / totalWords;
}