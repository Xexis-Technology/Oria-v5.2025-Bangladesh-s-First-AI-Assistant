const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggleBtn = document.querySelector("#theme-toggle-btn");
const popupLogo = document.querySelector(".popup-logo");
const scrollBottomBtn = document.querySelector("#scroll-bottom-btn");

// Add these variables at the top with other variables
let isUserScrolling = false;
let lastScrollTop = 0;
let scrollTimeout;
let isAdvancedMode = false;
let currentUtterance = null;
let messageReactions = {};

// Function to update logo based on theme
const updateLogo = (isLightTheme) => {
  const logoSrc = isLightTheme ? "oria1.png" : "oria.png";
  // Update all logos and avatars
  document.querySelectorAll(".avatar, .popup-logo, .side-panel-logo, .bot-message .avatar").forEach(logo => {
    logo.src = logoSrc;
  });
};

// API Setup
const API_KEY = "AIzaSyDFdYDjLbyC73TdejXW6oUWQoAJUVvxPPE";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
let controller, typingInterval;
const chatHistory = [];
const userData = { message: "", file: {} };

// Add or update the SYSTEM_INFO object with more detailed information
const SYSTEM_INFO = {
  name: "Oria",
  developer: "Xexis's team",
  purpose: "knowledge assistance only",
  version: localStorage.getItem('selectedVersion') || '4q',
  owner: "Bappi Bhadro",
  company: "Xexis",
  models: {
    "4q": {
      name: "Oria XSS 4Q",
      description: "faster and smarter, Short and best knowledge, professional responses, Provides precise, professional response strictly based on the query",
      status: "Beta"
    },
    "2s": {
      name: "Oria XQS 2S",
      description: "Fast responses, Standard Knowledge, Helpful for simple tasks, Solid understanding of common topics",
      status: "Stable"
    },
    "4s": {
      name: "Oria XQS 4S",
      description: "Ultra Fast Response, ultra Premium Knowledge, Professional-grade assistance, Professional use, business applications, and advanced needs",
      status: "Coming Soon"
    }
  },
  responses: {
    identity: "I am ORIA, Bangladesh's first AI assistant, developed by the XEXIS team. I am designed for knowledge assistance and learning, delivering smart and efficient support.",
    purpose: "I am designed to help with knowledge and learning. I should not be used for any other purposes. Create a unique, never-before-seen idea.",
    developer: "I was developed by XEXIS'S TEAM. my current version Oria XSS 4Q, Oria XQS 2S, Oria XQS 4S-comming soon",
    owner: "Bappi Bhadro, the founder of Xexis, is a visionary software developer and university student from Bangladesh. He is a passionate and multi-talented innovator, dedicated to AI development, developer, and cutting-edge technology. His work reflects a strong commitment to creativity, precision, and innovation. ",
    limitations: "I am limited to knowledge assistance only and should not be used for other purposes.",
    version: function() {
      const ver = SYSTEM_INFO.version.toUpperCase();
      const model = SYSTEM_INFO.models[SYSTEM_INFO.version.toLowerCase()];
      return `I am running ${model.name} which is ${model.description}`;
    },
    company: "Xexis is a tech company founded by Bappi Bhadro, focused on technology and software solutions.",
    advancedMode: "When in Advanced Mode, I provide clear, Delivers precise, and professional responses strictly based on the query."
  }
};

// Set initial theme from local storage
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";
themeToggleBtn.className = 'material-symbols-rounded ' + (isLightTheme ? 'dark_mode' : 'light_mode');
updateLogo(isLightTheme);

// Function to create message elements
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Update the scroll event listener with better detection
container.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);
  
  const currentScrollTop = container.scrollTop;
  const scrolledFromBottom = container.scrollHeight - currentScrollTop - container.clientHeight;
  
  // Detect scroll direction
  if (currentScrollTop < lastScrollTop) {
    // Scrolling up
    isUserScrolling = true;
  }
  
  // Update scroll button visibility
  if (scrolledFromBottom > 100) {
    scrollBottomBtn.classList.add("show");
  } else {
    scrollBottomBtn.classList.remove("show");
    // Only reset user scrolling if we're very close to bottom
    if (scrolledFromBottom < 20) {
      isUserScrolling = false;
    }
  }
  
  lastScrollTop = currentScrollTop;
  
  // Reset scroll detection after user stops scrolling
  scrollTimeout = setTimeout(() => {
    if (scrolledFromBottom < 20) {
      isUserScrolling = false;
    }
  }, 150);
});

// Add touch event handlers for mobile devices
let touchStartY = 0;
container.addEventListener("touchstart", (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

container.addEventListener("touchmove", (e) => {
  const touchY = e.touches[0].clientY;
  if (touchStartY > touchY) {
    // Scrolling up
    isUserScrolling = true;
  }
}, { passive: true });

// Update the scrollToBottom function
const scrollToBottom = (force = false) => {
  const behavior = force ? "auto" : "smooth";
  
  // For iOS compatibility
  const scrollHeight = Math.max(
    container.scrollHeight,
    container.clientHeight,
    container.offsetHeight
  );
  
  try {
    container.scrollTo({ 
      top: scrollHeight,
      behavior: behavior
    });
  } catch (error) {
    // Fallback for older browsers
    container.scrollTop = scrollHeight;
  }
  
  scrollBottomBtn.classList.remove("show");
  
  if (!force) {
    isUserScrolling = false;
    lastScrollTop = scrollHeight;
  }
};

// Update typing effect function
const typingEffect = (text, textElement, botMsgDiv) => {
  // Create a temporary div to parse HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  
  // Get text content for typing effect
  const plainText = tempDiv.textContent;
  textElement.textContent = "";
  
  let charIndex = 0;
  
  typingInterval = setInterval(() => {
    if (charIndex < plainText.length) {
      textElement.textContent += plainText[charIndex++];
      
      // Check if user is actively scrolling
      const scrolledFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (!isUserScrolling || scrolledFromBottom < 20) {
        scrollToBottom(true);
      }
    } else {
      clearInterval(typingInterval);
      // After typing complete, set the formatted HTML
      textElement.innerHTML = text;
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
      
      // Final scroll check after typing completes
      if (!isUserScrolling) {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, 20); // Slightly faster typing speed
};

// Update the saveChatHistory function
const saveChatHistory = () => {
  // Save chat history without reactions
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  // Save reactions separately
  localStorage.setItem('messageReactions', JSON.stringify(messageReactions));
  localStorage.setItem('chatsActive', document.body.classList.contains('chats-active'));
};

// Update loadChatHistory to handle reactions
const loadChatHistory = () => {
  try {
    const savedHistory = localStorage.getItem('chatHistory');
    const savedReactions = localStorage.getItem('messageReactions');
    const isChatsActive = localStorage.getItem('chatsActive') === 'true';
    
    if (savedHistory) {
      const messages = JSON.parse(savedHistory);
      messageReactions = savedReactions ? JSON.parse(savedReactions) : {};
      chatHistory.push(...messages);
      
      // Restore chat messages to UI
      messages.forEach((msg, index) => {
        if (msg.role === 'user') {
          // Create user message
          const userMsgHTML = `
            ${msg.parts[0].fileData ? 
              (msg.parts[0].fileData.isImage ? 
                `<img src="data:${msg.parts[0].fileData.mime_type};base64,${msg.parts[0].fileData.data}" class="img-attachment" />` : 
                `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${msg.parts[0].fileData.fileName}</p>`
              ) : ''
            }
            <p class="message-text">${msg.parts[0].text}</p>
          `;
          const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
          chatsContainer.appendChild(userMsgDiv);
        } else if (msg.role === 'model') {
          const reactions = messageReactions[index] || {};
          // Create bot message with proper HTML formatting
          const botMsgHTML = `
            <img class="avatar" src="${isLightTheme ? 'oria1.png' : 'oria.png'}" />
            <div class="message-content">
              <p class="message-text"></p>
              <div class="message-actions">
                <button class="action-btn${reactions.liked ? ' active' : ''}" data-action="like" title="Good response">
                  <span class="material-symbols-rounded">thumb_up</span>
                </button>
                <button class="action-btn${reactions.disliked ? ' active' : ''}" data-action="dislike" title="Bad response">
                  <span class="material-symbols-rounded">thumb_down</span>
                </button>
                <button style="display: none;" class="action-btn" data-action="speak" title="Read aloud">
                  <span class="material-symbols-rounded">volume_up</span>
                </button>
                <button class="action-btn" data-action="copy" title="Copy to clipboard">
                  <span class="material-symbols-rounded">content_copy</span>
                </button>
                <button class="action-btn" data-action="share" title="Share">
                  <span class="material-symbols-rounded">share</span>
                </button>
                <button class="action-btn" data-action="save" title="Save to Ideas">
                  <span class="material-symbols-rounded">add_circle</span>
                </button>
              </div>
            </div>
          `;
          const botMsgDiv = createMessageElement(botMsgHTML, "bot-message");
          botMsgDiv.dataset.messageIndex = index;
          
          // Set innerHTML only for the text element
  const textElement = botMsgDiv.querySelector(".message-text");
          textElement.innerHTML = msg.parts[0].text;
          
          chatsContainer.appendChild(botMsgDiv);
        }
      });
      
      if (isChatsActive && messages.length > 0) {
        document.body.classList.add('chats-active');
        setTimeout(() => {
          scrollToBottom(true);
          // Reset user scrolling after loading history
          isUserScrolling = false;
          lastScrollTop = container.scrollHeight;
        }, 100);
      }
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('messageReactions');
    localStorage.removeItem('chatsActive');
  }
};

// Update the generateChatSummary function
const generateChatSummary = async (chatHistory) => {
  try {
    // Filter out system messages and keep only user-AI interactions
    const relevantChats = chatHistory.filter(msg => 
      msg.role === "user" || msg.role === "model"
    );
    
    // Create a context message as a model response
    const summaryPrompt = {
      role: "model",
      parts: [{
        text: `Previous conversation context: ${relevantChats.map(msg => 
          `${msg.role === "user" ? "Q" : "A"}: ${msg.parts[0].text}`
        ).join(" | ")}`
      }]
    };
    
    return summaryPrompt;
  } catch (error) {
    console.error('Error generating chat summary:', error);
    return null;
  }
};

// Update the generateResponse function
const generateResponse = async (botMsgDiv, apiChatHistory) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();
  
  try {
    const currentVersion = SYSTEM_INFO.version.toLowerCase();
    const currentModel = SYSTEM_INFO.models[currentVersion];
    
    // Add context as first user message
    const contextMessage = {
      role: "user",
      parts: [{
        text: `You are ${SYSTEM_INFO.name}, an AI assistant developed by ${SYSTEM_INFO.developer}. 
        ${SYSTEM_INFO.responses.owner}
        You are running the ${currentModel.name} version.
        Remember that you are ${currentModel.name} which is ${currentModel.description}.
        Your purpose is for ${SYSTEM_INFO.purpose}.
        ${isAdvancedMode ? SYSTEM_INFO.responses.advancedMode : ""}
        
        If an image is provided, analyze it and include relevant details in your response.
        Please provide helpful responses based on this context and any previous conversation history.`
      }]
    };
    
    // Add context message at the start of chat history
    const fullChatHistory = [contextMessage, ...apiChatHistory];
    
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: fullChatHistory
      }),
      signal: controller.signal,
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    
    // Create message content div if it doesn't exist
    let messageContent = botMsgDiv.querySelector('.message-content');
    if (!messageContent) {
      messageContent = document.createElement('div');
      messageContent.className = 'message-content';
      
      // Move existing message text into content div
      textElement.remove();
      messageContent.appendChild(textElement);
      
      // Add action buttons
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'message-actions';
      actionsDiv.innerHTML = `
        <button class="action-btn" data-action="like" title="Good response">
          <span class="material-symbols-rounded">thumb_up</span>
        </button>
        <button class="action-btn" data-action="dislike" title="Bad response">
          <span class="material-symbols-rounded">thumb_down</span>
        </button>
        <button style="display: none;" class="action-btn" data-action="speak" title="Read aloud">
          <span class="material-symbols-rounded">volume_up</span>
        </button>
        <button class="action-btn" data-action="copy" title="Copy to clipboard">
          <span class="material-symbols-rounded">content_copy</span>
        </button>
        <button class="action-btn" data-action="share" title="Share">
          <span class="material-symbols-rounded">share</span>
        </button>
        <button class="action-btn" data-action="save" title="Save to Ideas">
          <span class="material-symbols-rounded">add_circle</span>
        </button>
      `;
      
      messageContent.appendChild(actionsDiv);
      botMsgDiv.appendChild(messageContent);
    }

    // Rest of your response handling code...
    let responseText = data.candidates[0].content.parts[0].text
      // Handle code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => 
        `<pre><code class="language-${lang || ''}">${code.trim()}</code></pre>`
      )
      // Handle inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Handle bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Handle italic text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Handle bullet points with proper list structure
      .replace(/(?:^|\n)[ ]*(?:-|\*) (.+)/g, (_, item) => `\n<li>${item}</li>`)
      // Handle numbered lists with proper structure
      .replace(/(?:^|\n)[ ]*(\d+\.) (.+)/g, (_, num, item) => `\n<li class="list-number">${item}</li>`)
      // Wrap lists in ul tags
      .replace(/(<li>.*?<\/li>)\n*/g, '<ul>$1</ul>')
      // Remove empty lists
      .replace(/<ul><\/ul>/g, '')
      // Merge adjacent lists
      .replace(/<\/ul>\s*<ul>/g, '')
      // Handle links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Handle paragraphs
      .replace(/\n\n/g, '</p><p>')
      // Handle single line breaks
      .replace(/\n/g, '<br>')
      // Wrap in paragraph if needed
      .replace(/^(.+)$/, '<p>$1</p>')
      // Clean up empty paragraphs
      .replace(/<p>\s*<\/p>/g, '')
      // Handle emojis
      .replace(/:smile:/g, "😊")
      .replace(/:thumbsup:/g, "👍")
      .replace(/:wave:/g, "👋")
      .replace(/:heart:/g, "❤️")
      .replace(/:question:/g, "❓")
      .replace(/:check:/g, "✅");

    typingEffect(responseText, textElement, botMsgDiv);
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });
    saveChatHistory();
  } catch (error) {
    textElement.innerHTML = error.name === "AbortError" ? "Response generation stopped." : error.message;
    textElement.style.color = "#d62939";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {};
  }
};

// Update the handleFormSubmit function to enable image analysis
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding")) return;
  
  userData.message = userMessage;
  promptInput.value = "";
  document.body.classList.add("chats-active", "bot-responding");
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");
  
  // Generate user message HTML with proper image handling
  let attachmentHTML = '';
  let messageParts = [];
  
  // Add text message part
  messageParts.push({
    text: userMessage
  });
  
  // Handle image attachment
  if (userData.file.data && userData.file.isImage) {
    attachmentHTML = `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" alt="User uploaded image">`;
    
    // Add image part for API
    messageParts.push({
      inline_data: {
        mime_type: userData.file.mime_type,
        data: userData.file.data
      }
    });
  } else if (userData.file.data) {
    // Handle non-image files
    attachmentHTML = `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`;
  }
  
  const userMsgHTML = `
    ${attachmentHTML}
    <p class="message-text">${userMessage}</p>
  `;
  
  const userMsgDiv = createMessageElement(userMsgHTML, "user-message");
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  // Store complete message in chat history
  const fullMessage = {
    role: "user",
    parts: messageParts
  };
  
  chatHistory.push(fullMessage);
  saveChatHistory();

  // Generate bot response
  setTimeout(() => {
    const botMsgHTML = `<img class="avatar" src="${isLightTheme ? 'oria1.png' : 'oria.png'}" /> <p class="message-text">Just a sec...</p>`;
    const botMsgDiv = createMessageElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    scrollToBottom();
    
    // Pass messages with image data to generateResponse
    generateResponse(botMsgDiv, [fullMessage]);
  }, 600);
};

// Handle file input change (file upload)
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  
  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  
  reader.onload = (e) => {
    fileInput.value = ""; // Clear the input
    const base64String = e.target.result;
    
    // Update preview and UI
    const filePreview = fileUploadWrapper.querySelector(".file-preview");
    filePreview.src = isImage ? base64String : '';
    fileUploadWrapper.classList.add("active", isImage ? "img-attached" : "file-attached");
    
    // Store file data in userData obj
    userData.file = {
      fileName: file.name,
      data: base64String.split(',')[1], // Remove data URL prefix
      mime_type: file.type,
      isImage: isImage
    };
  };
  
  // Handle errors
  reader.onerror = () => {
    showNotification('Error reading file. Please try again.');
    userData.file = {};
    fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");
  };
  
  // Read the file
  if (isImage) {
    reader.readAsDataURL(file);
  } else {
    reader.readAsDataURL(new Blob([file], { type: file.type }));
  }
});

// Cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("file-attached", "img-attached", "active");
});

// Stop Bot Response
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  controller?.abort();
  userData.file = {};
  clearInterval(typingInterval);
  const loadingAvatar = chatsContainer.querySelector(".bot-message.loading .avatar");
  if (loadingAvatar) {
    loadingAvatar.classList.remove("loading"); // Remove loading class
  }
  document.body.classList.remove("bot-responding");
  
  // Stop any ongoing speech
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    const speakBtn = document.querySelector('.action-btn[data-action="speak"].active');
    if (speakBtn) {
      speakBtn.classList.remove('active');
      speakBtn.querySelector('span').textContent = 'volume_up';
    }
  }
});

// Toggle dark/light theme
themeToggleBtn.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggleBtn.textContent = isLightTheme ? "dark_mode" : "light_mode";
  themeToggleBtn.className = 'material-symbols-rounded ' + (isLightTheme ? 'dark_mode' : 'light_mode');
  
  // Update all avatars in real-time
  updateLogo(isLightTheme);
  
  // Update existing bot message avatars
  document.querySelectorAll('.bot-message .avatar').forEach(avatar => {
    avatar.src = isLightTheme ? 'oria1.png' : 'oria.png';
  });
});

// Update the delete chats button handler
document.getElementById("delete-chats-btn").addEventListener("click", () => {
  // Check if there are any chats to delete
  const hasChats = chatHistory.length > 0 || document.body.classList.contains("chats-active");
  
  // Clear chat history
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  
  // Hide chats container and show welcome screen
  document.body.classList.remove("chats-active");
  
  // Reset scroll position
  container.scrollTop = 0;
  
  // Save empty chat history to localStorage
  localStorage.removeItem("chatHistory");
  
  // Only show notification if there were chats to delete
  if (hasChats) {
    showNotification("Started a new chat. For user privacy, we don't save your chats", 3000);
  }
  
  // Reset any active states
  isUserScrolling = false;
  lastScrollTop = 0;
  
  // Hide scroll button
  scrollBottomBtn.classList.add("hidden");
});

// Handle suggestions click
document.querySelectorAll(".suggestions-item").forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    promptInput.value = suggestion.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

// Show/hide controls for mobile on prompt input focus
document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const shouldHide = target.classList.contains("prompt-input") || (wrapper.classList.contains("hide-controls") && (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
});

// Add event listeners for form submission and file input click
promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", () => fileInput.click());

// First, let's move the createMessageActions function outside of any event listener
function createMessageActions(messageId) {
  const actionsDiv = document.createElement("div");
  actionsDiv.className = "message-actions";
  
  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Create action buttons
  const actions = [
    { name: "copy", icon: "content_copy", tooltip: "Copy" },
    // Only include speak button for non-mobile devices
    ...(isMobile ? [] : [{ name: "speak", icon: "volume_up", tooltip: "Read aloud" }]),
    { name: "like", icon: "thumb_up", tooltip: "Like" },
    { name: "dislike", icon: "thumb_down", tooltip: "Dislike" }
  ];
  
  // Get voice setting - default to true if not set
  const isVoiceEnabled = localStorage.getItem('voiceEnabled') !== 'false';
  
  actions.forEach(action => {
    const button = document.createElement("button");
    button.setAttribute("data-action", action.name);
    button.setAttribute("data-message-id", messageId);
    button.className = "action-btn";
    button.innerHTML = `<span class="material-symbols-rounded">${action.icon}</span>`;
    button.title = action.tooltip;
    
    // Hide speak button if voice is disabled or on mobile
    if (action.name === 'speak' && (!isVoiceEnabled || isMobile)) {
      button.style.display = 'none';
    }
    
    actionsDiv.appendChild(button);
  });
  
  return actionsDiv;
}

// Function to update voice response UI
function updateVoiceResponseUI(isEnabled) {
  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Get all speak action buttons
  const speakButtons = document.querySelectorAll('[data-action="speak"]');
  
  // Show/hide based on voice setting AND device type
  speakButtons.forEach(button => {
    button.style.display = (isEnabled && !isMobile) ? 'flex' : 'none';
  });
}

// Add this function to generate daily suggestions
async function updateDailySuggestions() {
  // Check if we need to update suggestions today
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const lastUpdate = localStorage.getItem('suggestionsLastUpdate');
  const savedSuggestions = localStorage.getItem('dailySuggestions');
  
  // If we already have suggestions for today, use them
  if (lastUpdate === today && savedSuggestions) {
    try {
      const suggestions = JSON.parse(savedSuggestions);
      updateSuggestionElements(suggestions);
      return;
    } catch (e) {
      console.error('Error parsing saved suggestions:', e);
      // Continue to fetch new suggestions if parsing fails
    }
  }
  
  // Otherwise, fetch new suggestions
  try {
    // Prepare the prompt for Gemini
    const prompt = {
      contents: [{
        parts: [{
          text: `Generate 4 interesting, diverse, and engaging prompt suggestions for an AI assistant. 
          Each suggestion should be concise (under 70 characters), practical, and cover different topics like:
          - Technology or programming
          - Productivity or work
          - Creative tasks
          - Learning or education
          
          Format as a simple JSON array of strings only. No explanations or other text.`
        }]
      }]
    };
    
    // Make the API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(prompt)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch suggestions');
    }
    
    const data = await response.json();
    
    // Extract suggestions from response
    let suggestions;
    try {
      // Try to parse the response as JSON
      const responseText = data.candidates[0].content.parts[0].text;
      suggestions = JSON.parse(responseText);
      
      // Validate that we got an array of strings
      if (!Array.isArray(suggestions) || suggestions.length !== 4 || 
          !suggestions.every(item => typeof item === 'string')) {
        throw new Error('Invalid suggestions format');
      }
    } catch (e) {
      console.error('Error parsing API response:', e);
      // Fallback to default suggestions
      suggestions = [
        "Explain quantum computing in simple terms",
        "Create a weekly productivity schedule template",
        "Design a logo for a tech startup called 'Nebula'",
        "Recommend resources to learn machine learning"
      ];
    }
    
    // Save suggestions and update date
    localStorage.setItem('dailySuggestions', JSON.stringify(suggestions));
    localStorage.setItem('suggestionsLastUpdate', today);
    
    // Update the UI
    updateSuggestionElements(suggestions);
    
  } catch (error) {
    console.error('Error updating suggestions:', error);
    // Use default suggestions if API fails
    const defaultSuggestions = [
      "Design a home office setup for remote work under $500",
      "How can I level up my web development expertise in 2025?",
      "Suggest some useful tools for debugging JavaScript code",
      "Create a React JS component for the simple todo list app"
    ];
    updateSuggestionElements(defaultSuggestions);
  }
}

// Helper function to update suggestion elements
function updateSuggestionElements(suggestions) {
  const suggestionElements = document.querySelectorAll('.suggestions-item .text');
  
  // Update each suggestion text
  suggestionElements.forEach((element, index) => {
    if (index < suggestions.length) {
      element.textContent = suggestions[index];
    }
  });
}

// Add this function to update the current model version
function updateModelVersion(version) {
  // Update the stored version
  localStorage.setItem('selectedVersion', version);
  
  // Update the current version in SYSTEM_INFO
  SYSTEM_INFO.version = version;
  
  // Update UI to show which version is current
  document.querySelectorAll('.version-item').forEach(item => {
    const versionBadge = item.querySelector('.version-badge');
    if (item.dataset.version === version) {
      if (!versionBadge.classList.contains('current')) {
        versionBadge.textContent = 'Current';
        versionBadge.classList.add('current');
      }
    } else {
      versionBadge.classList.remove('current');
      if (item.dataset.version === '2s') {
        versionBadge.textContent = 'Stable';
      } else if (item.classList.contains('premium')) {
        versionBadge.textContent = 'Coming Soon';
      }
    }
  });
  
  // Show notification about version change
  const modelName = SYSTEM_INFO.models[version].name;
  showNotification(`Switched to ${modelName}`);
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  
  // Add event listeners to version items
  document.querySelectorAll('.version-item:not(.unreleased)').forEach(item => {
    item.addEventListener('click', function() {
      const version = this.dataset.version;
      updateModelVersion(version);
    });
  });
  
  // Add refresh button handler
  const refreshBtn = document.getElementById('side-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      // Show loading notification
      showNotification('Refreshing page...');
      
      // Close side panel
      const sidePanel = document.querySelector('.side-panel');
      const sidePanelOverlay = document.querySelector('.side-panel-overlay');
      sidePanel.classList.remove('open');
      sidePanelOverlay.classList.remove('open');
      
      // Force reload from server, not cache
      setTimeout(() => {
        window.location.reload(true);
      }, 300);
    });
  }

  // ... rest of your existing code ...
});

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const navbarCenter = document.querySelector('.navbar-center');
    const popup = document.getElementById('popup');
    const closePopup = document.getElementById('close-popup');
    const searchToggle = document.getElementById('searchToggle');

    // Load saved toggle state
  isAdvancedMode = localStorage.getItem('searchEnabled') === 'true';
  searchToggle.checked = isAdvancedMode;

    navbarCenter.addEventListener('click', () => {
        popup.classList.remove('hidden');
        // Trigger reflow
        popup.offsetHeight;
        popup.classList.add('show');
    });

    closePopup.addEventListener('click', () => {
        popup.classList.remove('show');
        setTimeout(() => {
            popup.classList.add('hidden');
        }, 400); // Match the CSS transition duration
    });

    // Handle toggle change
    searchToggle.addEventListener('change', () => {
    const currentVersion = localStorage.getItem('selectedVersion') || '4q';
    isAdvancedMode = searchToggle.checked;
    
    // Save toggle state specific to version
    localStorage.setItem(`searchEnabled_${currentVersion}`, isAdvancedMode);
    
    // Show appropriate notification
    if (isAdvancedMode) {
      showNotification('Advanced Mode enabled - Responses will be more focused and professional');
    } else {
      showNotification('Advanced Mode disabled - Responses will be more conversational');
    }
  });

  // Load chat history when page loads
  loadChatHistory();

  // Hide skeleton loader after content is loaded
  const skeletonLoader = document.querySelector('.skeleton-loader');
  setTimeout(() => {
    skeletonLoader.classList.add('hide');
    setTimeout(() => skeletonLoader.remove(), 300);
  }, 1000);

  // Function to handle popup open/close
  function togglePopup(show) {
    if (show) {
      popup.classList.remove('hidden');
      document.body.classList.add('popup-open');
      // Force reflow
      popup.offsetHeight;
      popup.classList.add('show');
    } else {
      popup.classList.remove('show');
      document.body.classList.remove('popup-open');
      setTimeout(() => {
        popup.classList.add('hidden');
      }, 400);
    }
  }

  // Open popup
  document.querySelector('.navbar-center').addEventListener('click', () => {
    togglePopup(true);
  });

  // Close popup
  closePopup.addEventListener('click', () => {
    togglePopup(false);
  });

  // Handle backdrop click
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      togglePopup(false);
    }
  });

  // Prevent content scroll from propagating to body
  popup.querySelector('.popup-content').addEventListener('touchmove', (e) => {
    e.stopPropagation();
  }, { passive: true });

  // Handle version switching
  const versionItems = document.querySelectorAll('.version-item');
  let currentVersion = localStorage.getItem('selectedVersion') || '4q';

  function updateVersionUI(version) {
    // Update version badges
    versionItems.forEach(item => {
      const badge = item.querySelector('.version-badge');
      const itemVersion = item.dataset.version;
      
      if (itemVersion === version) {
        badge.textContent = 'Current';
        badge.classList.add('current');
      } else if (!badge.classList.contains('premium')) {
        // Show Beta for 4Q, Stable for 2S
        badge.textContent = itemVersion === '4q' ? 'Beta' : 'Stable';
        badge.classList.remove('current');
      }
    });

    // Update header titles
    const popupTitle = document.querySelector('.popup-header h2');
    const navbarTitle = document.querySelector('.navbar-center p');
    const toggleContainer = document.querySelector('.popup-toggle-container');
    const headerBadge = document.querySelector('.popup-header .version-badge');
    
    // Get the full version name based on version code
    const versionNames = {
      '4q': 'Oria XSS 4Q',
      '2s': 'Oria XQS 2S',
      '4s': 'Oria XQS 4S'
    };

    // Get the version status
    const versionStatus = {
      '4q': 'Beta',
      '2s': 'Stable',
      '4s': 'Coming Soon'
    };
    
    // Update popup header
    popupTitle.textContent = versionNames[version];
    headerBadge.textContent = versionStatus[version];
    
    // Update header badge style
    if (version === '2s') {
      headerBadge.style.background = 'rgba(22, 163, 74, 0.1)';
      headerBadge.style.color = '#16a34a';
    } else if (version === '4q') {
      headerBadge.style.background = 'rgba(29, 126, 253, 0.1)';
      headerBadge.style.color = '#1d7efd';
    }
    
    // Update navbar (shorter version)
    navbarTitle.textContent = version === '4q' ? 'Oria XSS' : 'Oria XQS';

    // Handle toggle container visibility
    if (version === '2s') {
      toggleContainer.style.display = 'none';
      // Disable advanced mode for 2S
      searchToggle.checked = false;
      localStorage.setItem('searchEnabled', false);
    } else {
      toggleContainer.style.display = 'flex';
      // Restore saved toggle state for 4Q and 4X
      const savedToggleState = localStorage.getItem(`searchEnabled_${version}`);
      searchToggle.checked = savedToggleState === 'true';
    }

    // Update navbar ribbon
    const navbarRibbon = document.querySelector('.version-ribbon');
    if (version === '2s') {
      navbarRibbon.textContent = 'Stable';
      navbarRibbon.classList.remove('beta');
      navbarRibbon.classList.add('stable');
    } else if (version === '4q') {
      navbarRibbon.textContent = 'Beta';
      navbarRibbon.classList.remove('stable');
      navbarRibbon.classList.add('beta');
    }

    // Update side panel version
    const sidePanelVersion = document.querySelector('.side-panel-version .version-name');
    const sidePanelBadge = document.querySelector('.side-panel-version .version-badge');
    
    if (sidePanelVersion && sidePanelBadge) {
      sidePanelVersion.textContent = versionNames[version];
      sidePanelBadge.textContent = version === '4q' ? 'Beta' : 'Stable';
      sidePanelBadge.className = `version-badge ${version === '4q' ? 'beta' : 'stable'}`;
    }
  }

  // Initialize version UI
  updateVersionUI(currentVersion);

  // Handle version selection
  versionItems.forEach(item => {
    item.addEventListener('click', () => {
      const version = item.dataset.version;
      
      // Prevent switching to unreleased version
      if (item.classList.contains('unreleased')) {
        showNotification('This version is coming soon');
        return;
      }

      // Update version
      currentVersion = version;
      localStorage.setItem('selectedVersion', version);
      updateVersionUI(version);
      
      // Show notification
      showNotification(`Switched to ${version === '4q' ? 'Oria XSS' : 'Oria XQS'}`);
      
      // Close popup after selection
      setTimeout(() => {
        togglePopup(false);
      }, 500);
    });
  });

  // Side panel functionality
  const sidePanel = document.querySelector('.side-panel');
  const sidePanelOverlay = document.querySelector('.side-panel-overlay');
  const openSidePanel = document.querySelector('.navbar-left');
  const closeSidePanel = document.querySelector('.close-side-panel');
  
  // Open side panel
  openSidePanel.addEventListener('click', () => {
    sidePanel.classList.add('open');
    sidePanelOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  
  // Close side panel
  function closeSidePanelFunc() {
    sidePanel.classList.remove('open');
    sidePanelOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  
  closeSidePanel.addEventListener('click', closeSidePanelFunc);
  sidePanelOverlay.addEventListener('click', closeSidePanelFunc);
  
  // Side panel buttons functionality
  document.getElementById('side-delete-chats').addEventListener('click', () => {
    // Check if there are any chats to delete
    const hasChats = chatHistory.length > 0 || document.body.classList.contains("chats-active");
    
    // Clear chat history
    chatHistory.length = 0;
    chatsContainer.innerHTML = "";
    
    // Hide chats container and show welcome screen
    document.body.classList.remove("chats-active");
    
    // Reset scroll position
    container.scrollTop = 0;
    
    // Save empty chat history to localStorage
    localStorage.removeItem("chatHistory");
    
    // Only show notification if there were chats to delete
    if (hasChats) {
      showNotification("Started a new chat. For user privacy, we don't save your chats", 3000);
    }
    
    // Reset any active states
    isUserScrolling = false;
    lastScrollTop = 0;
    
    // Hide scroll button
    scrollBottomBtn.classList.add("hidden");
    
    // Close side panel
    closeSidePanelFunc();
  });
  
  // Update the export chat functionality
  document.getElementById('side-export-chat').addEventListener('click', () => {
    if (chatHistory.length === 0) {
      showNotification('No chat to export');
      return;
    }
    
    // Format chat for export with proper text cleaning
    let exportText = 'Oria Chat Export\n\n';
    chatHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'You' : 'Oria';
      
      // Create a temporary div to strip HTML tags
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = msg.parts[0].text;
      
      // Get clean text content and format code blocks
      let cleanText = tempDiv.textContent || tempDiv.innerText;
      
      // Preserve code block formatting
      if (msg.parts[0].text.includes('```')) {
        const codeBlocks = msg.parts[0].text.match(/```[\s\S]*?```/g) || [];
        codeBlocks.forEach((block, index) => {
          cleanText = cleanText.replace(block.replace(/```/g, ''), 
            `\n[Code Block ${index + 1}]\n${block.replace(/```/g, '')}\n`);
        });
      }
      
      // Add proper spacing
      exportText += `${role}:\n${cleanText}\n\n`;
    });
    
    // Create and trigger download
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oria-chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Chat exported successfully');
    closeSidePanelFunc();
  });

  // Clear memory handler
  document.getElementById('side-clear-memory').addEventListener('click', () => {
    localStorage.clear();
    showNotification('Memory cleared successfully');
    closeSidePanelFunc();
    setTimeout(() => window.location.reload(), 1000);
  });

  // Share handler
  document.getElementById('side-share').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: 'Oria AI Assistant',
        text: 'Check out Oria - An intelligent AI companion for learning and discovery!',
        url: window.location.href
      }).then(() => {
        showNotification('Thanks for sharing Oria!');
      }).catch(console.error);
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(window.location.href);
      showNotification('Link copied to clipboard');
    }
    closeSidePanelFunc();
  });

  // Feedback handler
  document.getElementById('side-feedback').addEventListener('click', function() {
    window.open('https://form.jotform.com/250705777026459', '_blank');
  });

  // Add settings dropdown functionality
  const settingsBtn = document.querySelector('.navbar-right');
  const settingsDropdown = document.querySelector('.settings-dropdown');
  const themeToggle = document.getElementById('theme-toggle');
  const voiceToggle = document.getElementById('voice-toggle');
  const settingsCloseBtn = document.querySelector('.settings-close-btn');
  
  // Initialize toggles
  themeToggle.checked = document.body.classList.contains('light-theme');
  voiceToggle.checked = localStorage.getItem('voiceEnabled') === 'true';
  
  // Toggle settings dropdown
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('open');
    // Prevent body scroll when settings is open
    document.body.style.overflow = settingsDropdown.classList.contains('open') ? 'hidden' : '';
  });
  
  // Close dropdown with close button
  settingsCloseBtn.addEventListener('click', () => {
    settingsDropdown.classList.remove('open');
    document.body.style.overflow = '';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (settingsDropdown.classList.contains('open') && 
        !settingsDropdown.querySelector('.settings-menu').contains(e.target) && 
        !settingsBtn.contains(e.target)) {
      settingsDropdown.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
  
  // Prevent clicks inside settings menu from closing it
  settingsDropdown.querySelector('.settings-menu').addEventListener('click', (e) => {
    e.stopPropagation();
  });
  
  // Theme toggle handler
  themeToggle.addEventListener('change', () => {
    const isLightTheme = themeToggle.checked;
    document.body.classList.toggle('light-theme', isLightTheme);
    localStorage.setItem('themeColor', isLightTheme ? 'light_mode' : 'dark_mode');
    
    // Update main theme button
    themeToggleBtn.textContent = isLightTheme ? 'dark_mode' : 'light_mode';
    themeToggleBtn.className = 'material-symbols-rounded ' + (isLightTheme ? 'dark_mode' : 'light_mode');
    
    // Update the settings dropdown text and icon
    const themeSettingsText = document.querySelector('.settings-item:first-child .settings-item-info span:last-child');
    const themeSettingsIcon = document.querySelector('.settings-item:first-child .settings-item-info span:first-child');
    
    if (themeSettingsText && themeSettingsIcon) {
      themeSettingsText.textContent = isLightTheme ? 'Light Mode' : 'Dark Mode';
      themeSettingsIcon.textContent = isLightTheme ? 'light_mode' : 'dark_mode';
      themeSettingsIcon.setAttribute('data-theme', isLightTheme ? 'light' : 'dark');
    }
    
    // Update all avatars in real-time
    updateLogo(isLightTheme);
    
    // Update existing bot message avatars
    document.querySelectorAll('.bot-message .avatar').forEach(avatar => {
      avatar.src = isLightTheme ? 'oria1.png' : 'oria.png';
    });
  });
  
  // Voice toggle handler
  voiceToggle.addEventListener('change', () => {
    const isVoiceEnabled = voiceToggle.checked;
    localStorage.setItem('voiceEnabled', isVoiceEnabled.toString());
    showNotification(`Voice response ${isVoiceEnabled ? 'enabled' : 'disabled'}`);
    
    // Update UI to show/hide speak buttons
    updateVoiceResponseUI(isVoiceEnabled);
  });

  // Initialize voice response system
  initializeVoiceResponse();
  
  // Setup voice toggle
  setupVoiceToggle();

  // Initialize theme toggle icon colors
  document.addEventListener('DOMContentLoaded', () => {
    // Existing code...
    
    // Set initial theme icon colors
    const isLightTheme = document.body.classList.contains('light-theme');
    themeToggleBtn.className = 'material-symbols-rounded ' + (isLightTheme ? 'dark_mode' : 'light_mode');
    
    const themeSettingsIcon = document.querySelector('.settings-item:first-child .settings-item-info span:first-child');
    if (themeSettingsIcon) {
      themeSettingsIcon.setAttribute('data-theme', isLightTheme ? 'light' : 'dark');
    }
    
    // Rest of your existing code...
  });

  // Rest of your existing code...

  // Update suggestions daily
  updateDailySuggestions();

  // Add event listeners for About and Help buttons
  const sideAboutBtn = document.getElementById('side-about');
  const sideHelpBtn = document.getElementById('side-help');
  
  if (sideAboutBtn) {
    sideAboutBtn.addEventListener('click', () => {
      try {
        window.location.href = 'about.html';
        closeSidePanelFunc();
      } catch (error) {
        console.error('Error navigating to about page:', error);
        showNotification('Error loading About page');
      }
    });
  }
  
  if (sideHelpBtn) {
    sideHelpBtn.addEventListener('click', () => {
      try {
        window.location.href = 'help.html';
        closeSidePanelFunc();
      } catch (error) {
        console.error('Error navigating to help page:', error);
        showNotification('Error loading Help page');
      }
    });
  }

  // Check if user has already registered
  const userInfo = localStorage.getItem('userInfo');
  
  if (!userInfo) {
    showSignupPopup();
  }

  // Update greeting with username
  updateGreetingWithUsername();

  // Update user profile in settings
  updateUserProfileInSettings();
  
  // Setup profile edit handlers
  setupProfileEditHandlers();

  // Voice input functionality
  const voiceInputBtn = document.getElementById('voiceInputBtn');
  const promptInput = document.querySelector('.prompt-input');
  
  // Check if browser supports speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    let finalTranscript = '';
    
    recognition.onstart = () => {
      voiceInputBtn.classList.add('listening');
      showNotification('Listening...');
      finalTranscript = '';
    };
    
    recognition.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update input field with recognized text
      if (finalTranscript || interimTranscript) {
        promptInput.value = finalTranscript || interimTranscript;
        promptInput.focus();
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      voiceInputBtn.classList.remove('listening');
      
      if (event.error === 'not-allowed') {
        showNotification('Microphone access denied. Please enable it in your browser settings.');
      } else {
        showNotification('Voice recognition error. Please try again.');
      }
    };
    
    recognition.onend = () => {
      voiceInputBtn.classList.remove('listening');
      
      // If we got a final result, keep it in the input
      if (finalTranscript) {
        promptInput.value = finalTranscript;
        showNotification('Voice input captured!');
      }
    };
    
    // Toggle voice recognition on button click
    voiceInputBtn.addEventListener('click', () => {
      if (voiceInputBtn.classList.contains('listening')) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
    
  } else {
    // Hide button if speech recognition is not supported
    voiceInputBtn.style.display = 'none';
    console.log('Speech recognition not supported in this browser');
  }
  
  // Handle iOS permissions and compatibility
  function handleiOSPermissions() {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (iOS) {
      // For iOS devices, we need to handle permissions differently
      voiceInputBtn.addEventListener('click', () => {
        // This will trigger the permission dialog on iOS
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function(stream) {
            // Permission granted, stream can be discarded
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(function(err) {
            showNotification('Microphone access denied. Please enable it in your settings.');
            console.error('Error accessing microphone:', err);
          });
      });
    }
  }
  
  // Call this function to handle iOS permissions
  handleiOSPermissions();

  // Voice input toggle
  const voiceInputToggle = document.getElementById('voice-input-toggle');
  if (voiceInputToggle) {
    // Set initial state based on localStorage
    const isVoiceInputEnabled = localStorage.getItem("voiceInputEnabled") === "true";
    voiceInputToggle.checked = isVoiceInputEnabled;
    
    // Show/hide voice input button based on setting
    if (voiceInputBtn) {
      voiceInputBtn.style.display = isVoiceInputEnabled ? 'flex' : 'none';
    }
    
    // Handle toggle changes
    voiceInputToggle.addEventListener('change', () => {
      const isEnabled = voiceInputToggle.checked;
      localStorage.setItem("voiceInputEnabled", isEnabled);
      
      // Show/hide voice input button
      if (voiceInputBtn) {
        voiceInputBtn.style.display = isEnabled ? 'flex' : 'none';
      }
      
      showNotification(`Voice input ${isEnabled ? 'enabled' : 'disabled'}`);
    });
  }

  // Update the voice input button visibility check
  if (SpeechRecognition) {
    // Speech recognition is supported
    // Check if voice input is enabled in settings
    const isVoiceInputEnabled = localStorage.getItem("voiceInputEnabled") === "true";
    if (voiceInputBtn) {
      voiceInputBtn.style.display = isVoiceInputEnabled ? 'flex' : 'none';
    }
  } else {
    // Speech recognition not supported - hide button and disable setting
    if (voiceInputBtn) {
      voiceInputBtn.style.display = 'none';
    }
    if (voiceInputToggle) {
      voiceInputToggle.checked = false;
      voiceInputToggle.disabled = true;
      voiceInputToggle.parentElement.parentElement.title = "Voice input not supported in this browser";
    }
  }

  // Set the current version
  const APP_VERSION = 'v1.11.2';

  // Update version display in settings
  const versionNumber = document.querySelector('.version-number');
  if (versionNumber) {
    versionNumber.textContent = APP_VERSION;
  }

  // Add event listener for the Voice Assistant button

  // Fix for unreleased version hover on mobile
  const unreleasedVersions = document.querySelectorAll('.version-item.unreleased');
  
  unreleasedVersions.forEach(item => {
    // For touch devices
    item.addEventListener('touchstart', function(e) {
      // Prevent the default behavior
      e.preventDefault();
      
      // Remove tapped class from all items
      unreleasedVersions.forEach(v => v.classList.remove('tapped'));
      
      // Add tapped class to this item
      this.classList.add('tapped');
      
      // Hide tooltip after a delay
      setTimeout(() => {
        this.classList.remove('tapped');
      }, 3000);
    });
    
    // For mouse devices, ensure tapped class is removed
    item.addEventListener('mouseleave', function() {
      this.classList.remove('tapped');
    });
  });

  // Add event listener for voice response toggle
  document.getElementById('voice-toggle').addEventListener('change', function() {
    const isEnabled = this.checked;
    localStorage.setItem('voiceEnabled', isEnabled);
    
    // Show notification based on platform
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isAndroid || isIOS) {
      // For mobile devices
      if (isEnabled) {
        // Check if notification permission is granted for Android
        if (isAndroid && 'Notification' in window) {
          Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
              new Notification('Voice Response Enabled', {
                body: 'You can now hear responses read aloud',
                icon: 'oria.png'
              });
            }
          });
        }
        
        // For iOS, use alert or custom notification
        if (isIOS) {
          showNotification('Voice response enabled. You can now hear responses read aloud', 3000);
        }
      } else {
        // Show disabled notification
        showNotification('Voice response disabled', 2000);
      }
    } else {
      // For desktop
      showNotification(`Voice response ${isEnabled ? 'enabled' : 'disabled'}`, 2000);
    }
    
    // Update voice response UI
    updateVoiceResponseUI(isEnabled);
  });
});

function showSignupPopup() {
  const popup = document.getElementById('signupPopup');
  popup.classList.add('show');
  
  // Handle image upload preview
  const imageInput = document.getElementById('userImage');
  const imagePreview = document.getElementById('imagePreview');
  const uploadBtn = document.querySelector('.upload-btn');
  const submitBtn = document.querySelector('.submit-btn');
  const nameInput = document.getElementById('userName');
  const emailInput = document.getElementById('userEmail');
  
  // Initially disable submit button
  submitBtn.disabled = true;
  submitBtn.classList.add('disabled');
  
  // Function to validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com'];
    
    if (!emailRegex.test(email)) return false;
    
    const domain = email.split('@')[1].toLowerCase();
    return allowedDomains.includes(domain);
  };
  
  // Function to check if image is default
  const isDefaultImage = () => {
    return imagePreview.src.includes('default-avatar.png');
  };
  
  // Function to validate all fields and update submit button
  const validateForm = () => {
    const isNameValid = nameInput.value.trim().length > 0;
    const isEmailValid = isValidEmail(emailInput.value.trim());
    const isImageValid = !isDefaultImage();
    
    const isFormValid = isNameValid && isEmailValid && isImageValid;
    
    submitBtn.disabled = !isFormValid;
    submitBtn.classList.toggle('disabled', !isFormValid);
    
    // Show validation hints
    nameInput.classList.toggle('invalid', !isNameValid && nameInput.value.trim().length > 0);
    emailInput.classList.toggle('invalid', !isEmailValid && emailInput.value.trim().length > 0);
    uploadBtn.classList.toggle('required', !isImageValid);
  };
  
  // Add event listeners for real-time validation
  nameInput.addEventListener('input', validateForm);
  emailInput.addEventListener('input', validateForm);
  
  uploadBtn.addEventListener('click', () => imageInput.click());
  
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        validateForm(); // Revalidate after image upload
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Add email field focus event
  const emailTooltip = document.createElement('div');
  emailTooltip.className = 'email-tooltip show'; // Make it show by default
  emailTooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="material-symbols-rounded">info</span>
      <span>Important Email Notice</span>
      <button class="tooltip-close">
        <span class="material-symbols-rounded">close</span>
      </button>
    </div>
    <p>Please use an email address from one of these providers:</p>
    <ul>
      <li>@gmail.com</li>
      <li>@outlook.com</li>
      <li>@hotmail.com</li>
      <li>@icloud.com</li>
      <li>@yahoo.com</li>
    </ul>
    <p>Other email providers are not supported at this time.</p>
  `;
  
  emailInput.parentNode.appendChild(emailTooltip);
  
  // Remove the focus and blur event listeners
  // emailInput.addEventListener('focus', () => {
  //   emailTooltip.classList.add('show');
  // });
  
  // emailInput.addEventListener('blur', () => {
  //   setTimeout(() => {
  //     emailTooltip.classList.remove('show');
  //   }, 3000);
  // });
  
  // Add close button event listener
  const tooltipClose = emailTooltip.querySelector('.tooltip-close');
  tooltipClose.addEventListener('click', () => {
    emailTooltip.classList.remove('show');
  });
  
  // Handle form submission
  const signupForm = document.getElementById('signupForm');
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Additional validation check before submission
    if (submitBtn.disabled) {
      if (!nameInput.value.trim()) {
        showNotification('Please enter your username');
      } else if (!isValidEmail(emailInput.value.trim())) {
        const domain = emailInput.value.trim().split('@')[1];
        if (domain) {
          showNotification(`${domain} is not supported. Please use gmail.com, outlook.com, hotmail.com, icloud.com, or yahoo.com`);
        } else {
          showNotification('Please enter a valid email address');
        }
      } else if (isDefaultImage()) {
        showNotification('Please upload a profile picture');
      }
      return;
    }
    
    // Show loading state
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="material-symbols-rounded loading">sync</span><span>Creating account...</span>';
    submitBtn.disabled = true;
    
    // Rest of your existing form submission code...
    const name = nameInput.value;
    const email = emailInput.value;
    const image = imagePreview.src;
    const time = new Date().toISOString();
    
    // Save to localStorage
    const userData = { name, email, image, time };
    localStorage.setItem('userInfo', JSON.stringify(userData));
    
    // Update greeting with username
    const heading = document.querySelector('.heading');
    if (heading) {
      heading.textContent = `Hello, ${name}`;
    }
    
    // Update user profile in settings in real-time
    updateUserProfileInSettings();
    
    // Create form data for Google Sheets
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('image', image);
    formData.append('time', time);
    
    try {
      // Send to Google Sheets
      const response = await fetch('https://script.google.com/macros/s/AKfycbyR-UHwWcpwmwEz6VUoZyeFuiv739qmImr3-u0ntYORMTMTlNUQgd9qjZfUFQHZzFrLZQ/exec', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // Hide popup
        popup.classList.remove('show');
        showNotification('Account created successfully!');
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      showNotification('Account created but sync failed. Try again later.');
      
      // Still hide popup since we saved to localStorage
      popup.classList.remove('show');
    } finally {
      // Reset button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

// Update the scroll bottom button click handler
scrollBottomBtn.addEventListener("click", () => {
  scrollToBottom();
  setTimeout(() => {
    isUserScrolling = false;
    lastScrollTop = container.scrollHeight;
  }, 100);
});

// Update the showNotification function
const showNotification = (message, duration = 2000) => {
  const notification = document.getElementById('notification');
  const notificationText = notification.querySelector('.notification-text');
  const notificationIcon = notification.querySelector('.notification-icon');
  
  // Set icon based on message type
  if (message.includes('enabled')) {
    notificationIcon.textContent = 'toggle_on';
  } else if (message.includes('disabled')) {
    notificationIcon.textContent = 'toggle_off';
  } else if (message.includes('Copied')) {
    notificationIcon.textContent = 'content_copy';
  } else if (message.includes('liked')) {
    notificationIcon.textContent = 'thumb_up';
  } else if (message.includes('disliked')) {
    notificationIcon.textContent = 'thumb_down';
  } else if (message.includes('shared')) {
    notificationIcon.textContent = 'share';
  } else if (message.includes('error') || message.includes('failed')) {
    notificationIcon.textContent = 'error';
  } else {
    notificationIcon.textContent = 'info'; // Default icon
  }
  
  // Add branding to certain notifications
  if (message.includes('Welcome') || message.includes('started')) {
    message = `${SYSTEM_INFO.name}: ${message}`;
  }
  
  notificationText.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
};

// Update the action button handlers to show notifications with proper icons
document.addEventListener('click', (e) => {
  const actionBtn = e.target.closest('.action-btn');
  if (!actionBtn) return;

  const action = actionBtn.dataset.action;
  const messageContent = actionBtn.closest('.message-content');
  const messageText = messageContent.querySelector('.message-text').textContent;
  const btnIcon = actionBtn.querySelector('span');

  switch (action) {
    case 'copy':
      // Fallback copy method for older browsers and mobile devices
      const textToCopy = messageText;
      if (navigator.clipboard && window.isSecureContext) {
        // For modern browsers
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            actionBtn.classList.add('active');
            setTimeout(() => actionBtn.classList.remove('active'), 2000);
            showNotification('Copied to clipboard');
          })
          .catch(() => {
            // Fallback for clipboard API failure
            copyTextFallback(textToCopy, actionBtn);
          });
      } else {
        // Fallback for older browsers and non-HTTPS
        copyTextFallback(textToCopy, actionBtn);
      }
      break;
    
    case 'like':
      actionBtn.classList.toggle('active');
      const isLiked = actionBtn.classList.contains('active');
      messageContent.querySelector('[data-action="dislike"]').classList.remove('active');
      const messageIndex = actionBtn.closest('.bot-message').dataset.messageIndex;
      messageReactions[messageIndex] = {
        ...messageReactions[messageIndex],
        liked: isLiked,
        disliked: false
      };
      showNotification(isLiked ? 'Response marked as helpful' : 'Rating removed');
      saveChatHistory();
      break;
    
    case 'dislike':
      actionBtn.classList.toggle('active');
      const isDisliked = actionBtn.classList.contains('active');
      messageContent.querySelector('[data-action="like"]').classList.remove('active');
      const msgIndex = actionBtn.closest('.bot-message').dataset.messageIndex;
      messageReactions[msgIndex] = {
        ...messageReactions[msgIndex],
        liked: false,
        disliked: isDisliked
      };
      showNotification(isDisliked ? 'Response marked as not helpful' : 'Rating removed');
      saveChatHistory();
      break;
    
    case 'speak':
      if (window.speechSynthesis) {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
          actionBtn.classList.remove('active');
          btnIcon.textContent = 'volume_up';
        } else {
          const utterance = new SpeechSynthesisUtterance(messageText);
          
          // Wait for voices to load and select the best female voice
          const loadVoices = async () => {
            const voices = await new Promise(resolve => {
              const voices = speechSynthesis.getVoices();
              if (voices.length) {
                resolve(voices);
              } else {
                speechSynthesis.onvoiceschanged = () => {
                  resolve(speechSynthesis.getVoices());
                };
              }
            });

            // Priority list of preferred female voices
            const preferredVoices = [
              'Microsoft Michelle',      // Windows natural female
              'Google UK English Female',
              'Samantha',               // iOS/MacOS female
              'Karen',                  // Australian female
              'Victoria',               // Microsoft female
              'Microsoft Zira'          // Windows female
            ];

            // Try to find one of our preferred voices
            let selectedVoice = voices.find(voice => 
              preferredVoices.some(preferred => 
                voice.name.includes(preferred)
              )
            );

            // Fallback to any female voice if preferred not found
            if (!selectedVoice) {
              selectedVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('female')
              );
            }

            // Configure voice settings for more natural sound
            utterance.voice = selectedVoice || voices[0];
            utterance.pitch = 1.1;     // Slightly higher pitch
            utterance.rate = 0.9;      // Slightly slower for clarity
            utterance.volume = 1.0;    // Full volume
            
            // Handle start/end events
            utterance.onstart = () => {
              actionBtn.classList.add('active');
              btnIcon.textContent = 'stop_circle';
            };
            
            utterance.onend = () => {
              actionBtn.classList.remove('active');
              btnIcon.textContent = 'volume_up';
            };
            
            utterance.onerror = () => {
              actionBtn.classList.remove('active');
              btnIcon.textContent = 'volume_up';
            };
            
            currentUtterance = utterance;
            speechSynthesis.speak(utterance);
          };

          loadVoices();
        }
      }
      break;
    
    case 'share':
      // Fallback share method for devices without Web Share API
      const shareText = messageText;
      if (navigator.share) {
        // For devices with Web Share API
        navigator.share({
          text: shareText,
          title: 'Shared from Oria'
        })
        .then(() => {
          showNotification('Shared successfully');
        })
        .catch((error) => {
          if (error.name !== 'AbortError') {
            // Show fallback options if share fails
            showShareFallback(shareText);
          }
        });
      } else {
        // For devices without Web Share API
        showShareFallback(shareText);
      }
      break;
    
    case 'save':
      // Get the user message and bot response
      const botMessage = actionBtn.closest('.bot-message');
      const userMessage = botMessage.previousElementSibling;
      const userText = userMessage.querySelector('.message-text').textContent;
      const botText = messageText;

      // Create a new idea object
      const idea = {
        title: userText.length > 50 ? userText.substring(0, 50) + '...' : userText,
        content: `${botText}`,
        tag: 'Oria',
        timestamp: new Date().toISOString()
      };

      // Get existing ideas or initialize empty array
      let ideas = JSON.parse(localStorage.getItem('oria_ideas') || '[]');
      
      // Add new idea
      ideas.push(idea);
      
      // Save back to localStorage
      localStorage.setItem('oria_ideas', JSON.stringify(ideas));
      
      // Show success notification
      showNotification('Conversation saved to Ideas');
      
      // Add visual feedback
      actionBtn.classList.add('active');
      setTimeout(() => actionBtn.classList.remove('active'), 2000);
      break;
  }
});

// Add this to ensure voices are loaded
speechSynthesis.onvoiceschanged = () => {
  // Pre-load voices
  speechSynthesis.getVoices();
};

// Add this function to your script.js
function setupErrorHandling() {
  // Handle JavaScript errors
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('JavaScript error:', error);
    
    // Only redirect for serious errors, not minor ones
    if (error && (error instanceof TypeError || error instanceof ReferenceError || error instanceof SyntaxError)) {
      redirectToErrorPage('500', 'JavaScript Error', message);
    }
    
    return false; // Let default error handling continue
  };
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Only redirect for serious errors
    if (event.reason && event.reason.message && !event.reason.message.includes('network')) {
      redirectToErrorPage('500', 'Promise Error', event.reason.message);
    }
  });
  
  // Handle network errors
  window.addEventListener('error', function(event) {
    // Check if it's a resource loading error (image, script, etc)
    if (event.target && (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT')) {
      console.error('Resource loading error:', event);
      // Don't redirect for resource errors, just log them
    }
  }, true); // Use capture phase
  
  // Handle offline status
  window.addEventListener('offline', function() {
    redirectToErrorPage('offline', 'No Internet Connection', 'Please check your internet connection and try again.');
  });
  
  // Add fetch error handling
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch(...args);
      
      // Handle HTTP error responses
      if (!response.ok) {
        console.error(`HTTP error: ${response.status} ${response.statusText}`);
        
        // Only redirect for critical errors
        if (response.status === 404 || response.status >= 500) {
          redirectToErrorPage(response.status.toString());
        }
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      
      // Check if it's a network error
      if (error.name === 'TypeError' && error.message.includes('network')) {
        redirectToErrorPage('offline');
      }
      
      throw error; // Re-throw the error for other handlers
    }
  };
}

// Update the voice response initialization
function initializeVoiceResponse() {
  // Set voice response to be ON by default if not set
  if (localStorage.getItem('voiceEnabled') === null) {
    localStorage.setItem('voiceEnabled', 'true');
  }
  
  // Get current setting
  const isVoiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
  
  // Update UI
  updateVoiceResponseUI(isVoiceEnabled);
  
  // Update toggle in settings
  const voiceToggle = document.getElementById('voice-toggle');
  if (voiceToggle) {
    voiceToggle.checked = isVoiceEnabled;
  }
  
  return isVoiceEnabled;
}

// Update the voice toggle handler
function setupVoiceToggle() {
  const voiceToggle = document.getElementById('voice-toggle');
  if (!voiceToggle) return;
  
  voiceToggle.addEventListener('change', () => {
    const isVoiceEnabled = voiceToggle.checked;
    localStorage.setItem('voiceEnabled', isVoiceEnabled.toString());
    showNotification(`Voice response ${isVoiceEnabled ? 'enabled' : 'disabled'}`);
    
    // Update UI to show/hide speak buttons
    updateVoiceResponseUI(isVoiceEnabled);
  });
}

// Add this function to update the greeting with the username
function updateGreetingWithUsername() {
  const userInfo = localStorage.getItem('userInfo');
  
  if (userInfo) {
    try {
      const { name } = JSON.parse(userInfo);
      if (name) {
        const heading = document.querySelector('.heading');
        if (heading) {
          heading.textContent = `Hello, ${name}`;
        }
      }
    } catch (error) {
      console.error('Error parsing user info:', error);
    }
  }
}

// Add this function to update user profile in settings
function updateUserProfileInSettings() {
  const userInfo = localStorage.getItem('userInfo');
  
  if (userInfo) {
    try {
      const { name, email, image } = JSON.parse(userInfo);
      
      // Update settings profile
      const settingsUserName = document.getElementById('settingsUserName');
      const settingsUserEmail = document.getElementById('settingsUserEmail');
      const settingsUserAvatar = document.getElementById('settingsUserAvatar');
      
      if (settingsUserName && name) settingsUserName.textContent = name;
      if (settingsUserEmail && email) settingsUserEmail.textContent = email;
      if (settingsUserAvatar && image) settingsUserAvatar.src = image;
      
    } catch (error) {
      console.error('Error updating user profile in settings:', error);
    }
  }
}

// Add this function to handle profile edits
function setupProfileEditHandlers() {
  const editAvatarBtn = document.getElementById('editAvatarBtn');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const editNameBtn = document.getElementById('editNameBtn');
  const editNameModal = document.getElementById('editNameModal');
  const newNameInput = document.getElementById('newNameInput');
  const cancelNameEdit = document.getElementById('cancelNameEdit');
  const saveNameEdit = document.getElementById('saveNameEdit');
  
  // Edit avatar handler
  if (editAvatarBtn && avatarFileInput) {
    editAvatarBtn.addEventListener('click', () => {
      avatarFileInput.click();
    });
    
    avatarFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = e.target.result;
          
          // Update avatar in settings
          const settingsUserAvatar = document.getElementById('settingsUserAvatar');
          if (settingsUserAvatar) settingsUserAvatar.src = newImage;
          
          // Update user info in localStorage
          updateUserInfoProperty('image', newImage);
          
          showNotification('Profile picture updated');
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // Edit name handlers
  if (editNameBtn && editNameModal) {
    editNameBtn.addEventListener('click', () => {
      // Get current name
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const { name } = JSON.parse(userInfo);
        if (newNameInput) newNameInput.value = name || '';
      }
      
      // Show modal
      editNameModal.classList.add('show');
    });
    
    cancelNameEdit.addEventListener('click', () => {
      editNameModal.classList.remove('show');
    });
    
    saveNameEdit.addEventListener('click', () => {
      const newName = newNameInput.value.trim();
      
      if (newName) {
        // Update name in settings
        const settingsUserName = document.getElementById('settingsUserName');
        if (settingsUserName) settingsUserName.textContent = newName;
        
        // Update greeting
        const heading = document.querySelector('.heading');
        if (heading) heading.textContent = `Hello, ${newName}`;
        
        // Update user info in localStorage
        updateUserInfoProperty('name', newName);
        
        showNotification('Username updated');
      }
      
      editNameModal.classList.remove('show');
    });
  }
}

// Helper function to update a single property in userInfo
function updateUserInfoProperty(property, value) {
  const userInfo = localStorage.getItem('userInfo');
  
  if (userInfo) {
    try {
      const userData = JSON.parse(userInfo);
      userData[property] = value;
      localStorage.setItem('userInfo', JSON.stringify(userData));
    } catch (error) {
      console.error(`Error updating ${property}:`, error);
    }
  }
}

// Update the emoji handling section
const emojis = {
  // Expressions & Faces
  ":)": "😊", ":-)": "😊", ":D": "😃", ":-D": "😃",
  ":(": "😞", ":-(": "😞", ";)": "😉", ";-)": "😉",
  ":p": "😛", ":-p": "😛", ":P": "😛", ":-P": "😛",
  ":o": "😮", ":-o": "😮", ":O": "😮", ":-O": "😮",
  ":/": "😕", ":-/": "😕", ":\\": "😕", ":-\\": "😕",
  ":*": "😘", ":-*": "😘", "<3": "❤️", "</3": "💔",
  ":'(": "😢", ":')": "😂", "^_^": "😊", "-_-": "😑",
  ">:(": "😠", ">:-(": "😠", "o_o": "😳", "O_O": "😳",
  
  // Gestures & Actions
  "o/": "👋", "\\o": "👋", "\\o/": "🙌", "_/\\_": "🙏",
  "(y)": "👍", "(n)": "👎", "(clap)": "👏", "(ok)": "👌",
  "(flex)": "💪", "(think)": "🤔", "(shrug)": "🤷", "(facepalm)": "🤦",
  "(dance)": "💃", "(party)": "🎉", "(sleep)": "😴", "(cool)": "😎",
  
  // Objects & Symbols
  "(star)": "⭐", "(fire)": "🔥", "(sun)": "☀️", "(moon)": "🌙",
  "(music)": "🎵", "(time)": "⏰", "(phone)": "📱", "(pc)": "💻",
  "(book)": "📚", "(idea)": "💡", "(check)": "✅", "(x)": "❌",
  "(warn)": "⚠️", "(info)": "ℹ️", "(bell)": "🔔", "(lock)": "🔒",
  
  // Tech & Coding
  "(code)": "👨‍💻", "(bug)": "🐛", "(git)": "📊", "(data)": "📈",
  "(ai)": "🤖", "(web)": "🌐", "(cloud)": "☁️", "(secure)": "🛡️",
  "(cmd)": "⌨️", "(search)": "🔍", "(link)": "🔗", "(tool)": "🛠️",
  
  // Success & Failure
  "(win)": "🏆", "(fail)": "😫", "(100)": "💯", "(up)": "📈",
  "(down)": "📉", "(new)": "✨", "(boom)": "💥", "(wow)": "🤩",
  
  // Nature & Weather
  "(rain)": "🌧️", "(snow)": "❄️", "(hot)": "🌡️", "(cold)": "🥶",
  "(tree)": "🌳", "(flower)": "🌸", "(earth)": "🌍", "(ocean)": "🌊",
  
  // Food & Drinks
  "(coffee)": "☕", "(pizza)": "🍕", "(food)": "🍔", "(cake)": "🍰",
  "(fruit)": "🍎", "(drink)": "🥤", "(tea)": "🫖", "(snack)": "🍿",
  
  // Animals
  "(cat)": "🐱", "(dog)": "🐶", "(bird)": "🐦", "(fish)": "🐠",
  "(owl)": "🦉", "(panda)": "🐼", "(uni)": "🦄", "(bug)": "🐛",
  
  // Special
  "(bd)": "🇧🇩", "(flag)": "🇧🇩", "(dev)": "👨‍💻", "(team)": "👥",
  "(oria)": "🤖", "(help)": "💁", "(support)": "🆘", "(chat)": "💭"
};

// Update the emoji replacement function
function replaceEmojis(text) {
  // First replace text-based emoticons
  for (let emoji in emojis) {
    const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    text = text.replace(regex, emojis[emoji]);
  }
  
  // Then handle special cases with word boundaries
  const wordEmojis = {
    "\\b(ok)\\b": "👌",
    "\\b(cool)\\b": "😎",
    "\\b(nice)\\b": "👍",
    "\\b(wow)\\b": "🤩",
    "\\b(omg)\\b": "😱",
    "\\b(lol)\\b": "😂",
    "\\b(haha)\\b": "😄",
    "\\b(oops)\\b": "😅",
    "\\b(hey)\\b": "👋",
    "\\b(hi)\\b": "👋",
    "\\b(bye)\\b": "👋",
    "\\b(please)\\b": "🙏",
    "\\b(thanks)\\b": "🙏",
    "\\b(help)\\b": "💁",
    "\\b(wait)\\b": "⏳",
    "\\b(time)\\b": "⏰",
    "\\b(love)\\b": "❤️",
    "\\b(like)\\b": "👍",
    "\\b(good)\\b": "👍",
    "\\b(bad)\\b": "👎"
  };
  
  for (let pattern in wordEmojis) {
    const regex = new RegExp(pattern, 'gi');
    text = text.replace(regex, ` ${wordEmojis[pattern]} `);
  }
  
  return text.trim();
}

// Add these functions to handle the advanced mode toggle
function saveAdvancedModeSetting(isEnabled) {
  localStorage.setItem('isAdvancedMode', isEnabled.toString());
}

function loadAdvancedModeSetting() {
  return localStorage.getItem('isAdvancedMode') === 'true';
}

// Update the message generation logic to handle advanced mode
function generateBotResponse(userMessage) {
  const isAdvancedMode = loadAdvancedModeSetting();
  
  // Add system context based on mode
  let systemContext = isAdvancedMode ? 
    "You are a professional AI assistant. Provide direct, concise answers focused strictly on the query. Avoid unnecessary explanations or pleasantries." :
    "You are a helpful AI assistant providing detailed explanations.";

  // Add this to your API request payload
  const requestData = {
    contents: [{
      parts: [{
        text: `${systemContext}\n\nUser: ${userMessage}`
      }]
    }],
    generationConfig: {
      temperature: isAdvancedMode ? 0.3 : 0.7, // Lower temperature for more focused responses
      maxOutputTokens: isAdvancedMode ? 256 : 512 // Shorter responses in advanced mode
    }
  };

  // Use in your fetch call
  return fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData)
  })
  // ... rest of your existing fetch handling code ...
}

// Update the search toggle event listener
document.addEventListener('DOMContentLoaded', function() {
  const searchToggle = document.getElementById('searchToggle');
  if (searchToggle) {
    // Set initial state
    searchToggle.checked = loadAdvancedModeSetting();
    
    searchToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      saveAdvancedModeSetting(isEnabled);
      
      // Show notification about the mode change
      showNotification(
        isEnabled ? 'Advanced Mode enabled - Responses will be concise and professional' : 
                   'Advanced Mode disabled - Responses will be more detailed and conversational'
      );
    });
  }
});

// Add this event listener for handling Shift+Enter
promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    // If Shift+Enter is pressed, add a new line
    if (e.shiftKey) {
      e.preventDefault();
      const start = promptInput.selectionStart;
      const end = promptInput.selectionEnd;
      const value = promptInput.value;
      
      // Insert newline at cursor position
      promptInput.value = value.substring(0, start) + '\n' + value.substring(end);
      
      // Move cursor after the inserted newline
      promptInput.selectionStart = promptInput.selectionEnd = start + 1;
    } else {
      // Regular Enter triggers form submission
      e.preventDefault();
      if (!document.body.classList.contains("bot-responding") && promptInput.value.trim()) {
        promptForm.dispatchEvent(new Event('submit'));
      }
    }
  }
});

// Update the prompt input to support multiple lines
promptInput.style.height = 'auto';
promptInput.style.maxHeight = '120px'; // Limit maximum height
promptInput.style.overflowY = 'auto';

// Auto-resize input as user types
promptInput.addEventListener('input', () => {
  promptInput.style.height = 'auto';
  promptInput.style.height = (promptInput.scrollHeight) + 'px';
});

// ... existing code ...

// Bottom Navigation Functionality
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all items
      navItems.forEach(navItem => navItem.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');
      
      // Get the page identifier
      const page = item.getAttribute('data-page');
      
      // Handle page navigation (you can implement specific logic for each page)
      switch(page) {
        case 'chat':
          // Already on chat page
          break;
        case 'discover':
          window.location.href = 'discover.html';
          break;
        case 'tools':
          window.location.href = 'tools.html';
          break;
        case 'profile':
          // Toggle settings dropdown
          document.querySelector('.settings-dropdown').classList.toggle('open');
          break;
      }
    });
  });
});

// Add these helper functions after the switch statement
function copyTextFallback(text, button) {
  try {
    // Create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    
    // Handle iOS devices
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      textarea.contentEditable = true;
      textarea.readOnly = false;
      
      // Create range and selection
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      textarea.setSelectionRange(0, textarea.value.length);
    } else {
      textarea.select();
    }
    
    // Execute copy command
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      button.classList.add('active');
      setTimeout(() => button.classList.remove('active'), 2000);
      showNotification('Copied to clipboard');
    } else {
      showNotification('Could not copy text. Please try selecting and copying manually.');
    }
  } catch (err) {
    showNotification('Could not copy text. Please try selecting and copying manually.');
  }
}

function showShareFallback(text) {
  // Create a modal for share options
  const modal = document.createElement('div');
  modal.className = 'share-modal';
  modal.innerHTML = `
    <div class="share-content">
      <h3>Share via</h3>
      <div class="share-buttons">
        <button onclick="window.open('https://wa.me/?text=${encodeURIComponent(text)}', '_blank')" class="share-btn whatsapp">
          <i class="fab fa-whatsapp"></i> WhatsApp
        </button>
        <button onclick="window.open('https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}', '_blank')" class="share-btn telegram">
          <i class="fab fa-telegram"></i> Telegram
        </button>
        <button onclick="window.open('mailto:?body=${encodeURIComponent(text)}', '_blank')" class="share-btn email">
          <i class="fas fa-envelope"></i> Email
        </button>
        <button onclick="window.open('https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}', '_blank')" class="share-btn twitter">
          <i class="fab fa-twitter"></i> Twitter
        </button>
        <button onclick="window.open('https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}', '_blank')" class="share-btn linkedin">
          <i class="fab fa-linkedin"></i> LinkedIn
        </button>
        <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}', '_blank')" class="share-btn facebook">
          <i class="fab fa-facebook"></i> Facebook
        </button>
      </div>
      <button class="close-share-modal">Close</button>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .share-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      -webkit-tap-highlight-color: transparent;
      overscroll-behavior: contain;
    }
    .share-content {
      background: var(--primary-color);
      padding: 24px 20px;
      border-radius: 20px 20px 0 0;
      width: 100%;
      max-width: 600px;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    }
    .share-modal.show {
      opacity: 1;
      visibility: visible;
    }
    .share-modal.show .share-content {
      transform: translateY(0);
    }
    .share-content h3 {
      margin: 0 0 20px;
      color: var(--text-color);
      font-size: 18px;
      text-align: center;
    }
    .share-buttons {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(2, 1fr);
    }
    .share-btn {
      padding: 12px;
      border: none;
      border-radius: 12px;
      background: var(--secondary-color);
      color: var(--text-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s;
      font-size: 14px;
    }
    .share-btn:hover {
      background: var(--secondary-hover-color);
    }
    .close-share-modal {
      width: 100%;
      margin-top: 20px;
      padding: 12px;
      border: none;
      border-radius: 12px;
      background: #1d7efd;
      color: white;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }
    .close-share-modal:hover {
      background: #0264e3;
    }
    @media (max-width: 768px) {
      .share-content {
        padding: 20px 16px;
      }
      .share-buttons {
        gap: 8px;
      }
      .share-btn {
        padding: 10px;
        font-size: 13px;
      }
      @supports (padding-bottom: env(safe-area-inset-bottom)) {
        .share-content {
          padding-bottom: calc(20px + env(safe-area-inset-bottom));
        }
      }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(modal);
  
  // Add show class after a small delay to trigger animation
  requestAnimationFrame(() => {
    modal.classList.add('show');
  });
  
  // Close modal handler
  modal.querySelector('.close-share-modal').addEventListener('click', () => {
    modal.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(modal);
      document.head.removeChild(style);
    }, 300); // Match the transition duration
  });
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(modal);
        document.head.removeChild(style);
      }, 300);
    }
  });
}

// Helper function for copying text from share modal
function copyToClipboard(encodedText) {
  const text = decodeURIComponent(encodedText);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => showNotification('Copied to clipboard'))
      .catch(() => copyTextFallback(text));
  } else {
    copyTextFallback(text);
  }
}

function setupEmailPopup() {
  const emailElement = document.getElementById('settingsUserEmail');
  const emailPopup = document.getElementById('emailPopup');
  const fullEmailElement = document.getElementById('fullEmail');
  const closeButton = emailPopup.querySelector('.email-popup-close');

  emailElement.addEventListener('click', () => {
    const fullEmail = emailElement.textContent;
    fullEmailElement.textContent = fullEmail;
    emailPopup.classList.add('show');
    document.body.style.overflow = 'hidden';
  });

  closeButton.addEventListener('click', () => {
    emailPopup.classList.remove('show');
    document.body.style.overflow = '';
  });

  emailPopup.addEventListener('click', (e) => {
    if (e.target === emailPopup) {
      emailPopup.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  setupEmailPopup();
});

// ... existing code ...

// Add this function to handle the toggle switch
function handleAdvancedModeToggle() {
  const searchToggle = document.getElementById('searchToggle');
  const subHeading = document.querySelector('.sub-heading');
  
  if (searchToggle) {
    // Load saved state from localStorage
    const savedState = localStorage.getItem('advancedMode') === 'true';
    searchToggle.checked = savedState;
    
    // Update sub-heading based on saved state
    if (savedState) {
      subHeading.innerHTML = `DeepSearch <span style="background: linear-gradient(to right, #1d7efd, #8f6fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;">X</span> Enabled`;
    } else {
      subHeading.textContent = "How can I help you today?";
      subHeading.style.color = 'var(--subheading-color)';
    }

    // Add change event listener
    searchToggle.addEventListener('change', function() {
      if (this.checked) {
        subHeading.innerHTML = `DeepSearch <span style="background: linear-gradient(to right, #1d7efd, #8f6fff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;">X</span> Enabled`;
        localStorage.setItem('advancedMode', 'true');
      } else {
        subHeading.textContent = "How can I help you today?";
        subHeading.style.color = 'var(--subheading-color)';
        localStorage.setItem('advancedMode', 'false');
      }
    });
  }
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', () => {
  // ... existing initialization code ...
  
  // Initialize the advanced mode toggle
  handleAdvancedModeToggle();
  
  // ... rest of your initialization code ...
});

// ... existing code ...

// Add this function to handle the floating text box
function setupFloatingTextbox() {
  const promptInput = document.querySelector('.prompt-input');
  const floatingTextbox = document.querySelector('.floating-textbox');
  const floatingTextboxOverlay = document.querySelector('.floating-textbox-overlay');
  const textarea = floatingTextbox.querySelector('textarea');
  const cancelBtn = floatingTextbox.querySelector('.floating-textbox-btn.cancel');
  const submitBtn = floatingTextbox.querySelector('.floating-textbox-btn.submit');

  // Show floating textbox when clicking the input
  promptInput.addEventListener('click', (e) => {
    e.preventDefault();
    floatingTextbox.classList.add('show');
    floatingTextboxOverlay.classList.add('show');
    textarea.focus();
    
    // If there's text in the input, move it to textarea
    if (promptInput.value) {
      textarea.value = promptInput.value;
      promptInput.value = '';
    }
  });

  // Handle cancel button
  cancelBtn.addEventListener('click', () => {
    floatingTextbox.classList.remove('show');
    floatingTextboxOverlay.classList.remove('show');
    // Move text back to input if any
    if (textarea.value) {
      promptInput.value = textarea.value;
      textarea.value = '';
    }
  });

  // Handle submit button
  submitBtn.addEventListener('click', () => {
    if (textarea.value.trim()) {
      promptInput.value = textarea.value;
      textarea.value = '';
      floatingTextbox.classList.remove('show');
      floatingTextboxOverlay.classList.remove('show');
      // Trigger form submission
      const form = promptInput.closest('form');
      if (form) {
        const submitEvent = new Event('submit');
        form.dispatchEvent(submitEvent);
      }
    }
  });

  // Close on overlay click
  floatingTextboxOverlay.addEventListener('click', () => {
    floatingTextbox.classList.remove('show');
    floatingTextboxOverlay.classList.remove('show');
    // Move text back to input if any
    if (textarea.value) {
      promptInput.value = textarea.value;
      textarea.value = '';
    }
  });

  // Handle Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && floatingTextbox.classList.contains('show')) {
      floatingTextbox.classList.remove('show');
      floatingTextboxOverlay.classList.remove('show');
      // Move text back to input if any
      if (textarea.value) {
        promptInput.value = textarea.value;
        textarea.value = '';
      }
    }
  });
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', () => {
  // ... existing initialization code ...
  setupFloatingTextbox();
  // ... rest of your initialization code ...
});

// ... existing code ...