const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

// State variables
let userMessage = null;
let isResponseGenerating = false;

// API configuration
const API_KEY = ""; // Your API key here
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
// Add this function to handle voice selection and speaking
// Enhanced text-to-speech function with better mobile support
const speakText = (text) => {
    if (!('speechSynthesis' in window)) {
        console.error('Text-to-speech not supported');
        return;
    }

    // Cancel any ongoing speech and reset synthesis
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();

    // Extract only the visible text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const visibleText = tempDiv.textContent || tempDiv.innerText;

    const utterance = new SpeechSynthesisUtterance(visibleText);
    
    // Force English voice selection with better fallback
    const loadVoices = () => new Promise(resolve => {
        let voices = speechSynthesis.getVoices();
        if (voices.length) {
            resolve(voices);
        } else {
            speechSynthesis.addEventListener('voiceschanged', () => {
                voices = speechSynthesis.getVoices();
                resolve(voices);
            }, { once: true });
        }
    });
    
 loadVoices().then(voices => {
        const preferredVoice = voices.find(voice => 
            voice.lang.includes('en') && 
            (voice.name.includes('Google') || 
             voice.name.includes('Daniel') || 
             voice.name.includes('Microsoft'))
        ) || voices[0];
        
        utterance.voice = preferredVoice;
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

 // Handle speech events with mobile-specific handling
  // Event handlers with better mobile support
    utterance.onstart = () => {
        updateSpeakingUI(true);
    };

    utterance.onend = () => {
        updateSpeakingUI(false);
        window.speechSynthesis.cancel();
    };

    utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        updateSpeakingUI(false);
        window.speechSynthesis.cancel();
    };

    // Fix for mobile Safari and some other browsers
    // where speech might get cut off
    const resumeSpeaking = () => {
        window.speechSynthesis.resume();
    };

    // Keep speech synthesis active on mobile devices
      const maintainSpeech = setInterval(() => {
            if (speechSynthesis.speaking) {
                speechSynthesis.pause();
                setTimeout(() => speechSynthesis.resume(), 0);
            } else {
                clearInterval(maintainSpeech);
            }
        }, 2000);

        // Start speaking with mobile optimization
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 50);
    });

    utterance.onend = () => {
        clearInterval(maintainSpeech);
        resetButtons();
    };

    // Reset buttons function
    const resetButtons = () => {
        const listenButtons = document.querySelectorAll(".message-actions .icon");
        listenButtons.forEach(button => {
            if (button.innerHTML === "volume_off") {
                button.innerHTML = "volume_up";
                button.title = "Listen to message";
                window.isSpeaking = false;
            }
        });
    };

    // Start speaking
   try {
        // iOS requires a user interaction to start speech
        // This adds a slight delay to ensure proper initialization
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 100);
    } catch (error) {
        console.error('Speech synthesis error:', error);
        updateSpeakingUI(false);
    }
};

// Usage example:
// speakText("Hello, this is a test message");


// Check if the message is asking about AI identity
const isAskingAboutIdentity = (message) => {
    const identityKeywords = [
        'who are you', 
        'who created you', 
        'who made you', 
        'who invented you', 
        'who developed you',
        'who built you',
        'who programmed you',
        'who is your creator',
        'where do you come from',
        'who designed you',
        'who is behind your creation',
        'who are the minds behind you',
        'who engineered you',
        'who is responsible for making you',
        'who\'s your maker',
        'who\'s behind your existence',
        'who gave you life',
        'how were you created',
        'who’s the team behind you',
        'who\'s your originator',
        'who brought you into existence',
        'who constructed you',
        'what company made you',
        'what team developed you',
        'who make you',
        'make you',
        'made you',
        'who build you',
        'who create you',
        'create you',
        'built you',
		'who are you',
    'who created you',
    'who made you',
    'who built you',
    'who programmed you',
    'who is your creator',
    'who is your maker',
    'who developed you',
    'who designed you',
    'who is behind your creation',
    'who are the minds behind you',
    'who engineered you',
    'who is responsible for making you',
    'who\'s your maker',
    'who\'s behind your existence',
    'who gave you life',
    'how were you created',
    'who’s the team behind you',
    'who\'s your originator',
    'who brought you into existence',
    'who constructed you',
    'what company made you',
    'what team developed you',
    'who constructed you',
    'who is responsible for you',
    'who brought you into being',
    'who is your originator',
    'who is your engineer',
    'who invented you',
    'who\'s the team behind you',
    'what company made you',
    'how were you created',
    'who gave you life',
	        'what is your name',
        'whats your name',
        'what\'s your name',
		'what is your name',
        'who are you',
        'tell me your name',
        'your name',
        'may i know your name',
        'what should i call you',
        'introduce yourself',
        'what are you called',
        'who created you', 
        'who made you', 
        'who invented you', 
        'who developed you',
        'who built you',
        'who programmed you',
        'who is your creator',
        'where do you come from',
        'who designed you',
        'who is behind your creation',
        'who are the minds behind you',
        'who engineered you',
		'about you',
        'who is responsible for making you',
        'who\'s your maker',
        'who\'s behind your existence',
        'who gave you life',
        'how were you created',
        'who\'s the team behind you',
        'who\'s your originator',
        'who brought you into existence',
        'who constructed you',
        'what company made you',
		'which company made you',
        'what team developed you',
    ];
    return identityKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Check if the message is asking for image generation
const isAskingForImage = (message) => {
    const imageKeywords = [
        'generate an image',
        'create an image',
        'make an image',
        'draw a picture',
        'produce an image',
        'render an image',
        'can you make an image',
        'can you create an image',
        'show me a picture',
        'make a photo',
        'create a drawing',
        'image request',
        'make a sketch',
        'can you draw',
        'can you paint',
        'make a graphic',
        'create a visual',
        'design an image',
        'please draw',
        'image generation',
        'image creation',
        'generate a graphic',
        'produce a picture',
		'create an image',
        'generate an image',
        'make an image',
        'create picture',
        'generate picture',
        'make a picture',
        'draw a picture',
        'show me a picture',
        'create drawing',
        'generate a photo',
        'make photo',
        'design an image',
        'image request',
		'create image',
		'make image',
		'create picture',
		'make picture',
		'create a image',
		'make a image',
		'create a picture',
		'make a picture',
		"Can you generate an image?",
    "Could you create an image for me?",
    "Can you make an image?",
    "Would you be able to draw a picture?",
    "Are you able to produce an image?",
    "Can you render an image?",
    "Can you make an image for me?",
    "Could you create an image, please?",
    "Show me a picture, please.",
    "Can you make a photo?",
    "Can you create a drawing?",
    "Is this an image request?",
    "Could you make a sketch?",
    "Are you able to draw?",
    "Can you paint something for me?",
    "Could you make a graphic?",
    "Can you create a visual?",
    "Could you design an image for me?",
    "Would you please draw?",
    "Can you help with image generation?",
    "Could you handle image creation?",
    "Can you generate a graphic?",
    "Could you produce a picture?",
    "Would you be able to create artwork?",
    "Could you sketch something for me?",
    "Can you illustrate an idea?",
    "Can you create a cartoon?",
    "Would you make a digital painting?",
    "Can you make an abstract image?",
    "Could you create some art for me?",
    "Please render an image.",
    "Show me an illustration.",
    "Would you be able to create a concept art image?",
    "Can you do a digital sketch?",
    "Could you create a character design?",
    "Can you make a landscape drawing?",
    "Create a portrait for me.",
    "Can you make a visual representation of this idea?",
    "Would you create a digital graphic?",
    "Draw something for me, please.",
    "Can you help with artwork generation?",
    "Please generate a photo."
	
    ];
    return imageKeywords.some(keyword => message.toLowerCase().includes(keyword));
};


// Load theme and chat data from local storage on page load
// Initialize theme based on system preference and localStorage
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  
  // Check if user has a stored preference, if not use system preference
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem("theme");
  const currentTheme = storedTheme || (systemPrefersDark ? 'dark_mode' : 'light_mode');

  // Apply theme to the body
  document.body.classList.toggle("dark_mode", currentTheme === 'dark_mode');
  toggleThemeButton.innerText = currentTheme === 'dark_mode' ? "light_mode" : "dark_mode";

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem("theme")) { // Only update if user hasn't set a preference
      const newTheme = e.matches ? 'dark_mode' : 'light_mode';
      document.body.classList.toggle("dark_mode", e.matches);
      toggleThemeButton.innerText = e.matches ? "light_mode" : "dark_mode";
    }
  });

  // Handle saved chats
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
}
const toggleTheme = () => {
  const body = document.body;
  const isLightMode = body.classList.toggle("dark_mode");
  
  // Smooth transition for all elements
  document.documentElement.style.setProperty('--transition-speed', '0.3s');
  
  // Save theme preference
  localStorage.setItem("theme", isLightMode ? "dark_mode" : "light_mode");
  
  // Update toggle button with animation
  const toggleButton = document.querySelector("#theme-toggle-button");
  toggleButton.style.transform = "rotate(180deg)";
  
  setTimeout(() => {
    toggleButton.innerText = isLightMode ? "light_mode" : "dark_mode";
    toggleButton.style.transform = "rotate(0deg)";
  }, 150);
}


// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupThemeListener();
});

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
       // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent;
    const words = plainText.split(' ');
    let currentWordIndex = 0;
    let isSpeaking = false;

    // Clear the text element
    textElement.innerHTML = '';

    const typingInterval = setInterval(() => {
        if (currentWordIndex === 0) {
            // For the first word
            textElement.innerHTML = text;
        }
        currentWordIndex++;

        incomingMessageDiv.querySelector(".icon").classList.add("hide");

        if (currentWordIndex === words.length) {
            clearInterval(typingInterval);
            isResponseGenerating = false;
            incomingMessageDiv.querySelector(".icon").classList.remove("hide");
            
            // Add listen button after typing is complete
            const messageActions = incomingMessageDiv.querySelector(".message-actions");
            const listenButton = document.createElement("span");
            listenButton.className = "icon material-symbols-rounded";
            listenButton.title = "Listen to message";
            listenButton.innerHTML = "volume_up";
            
            // Modified click handler for toggle functionality
            listenButton.onclick = () => {
                if (!isSpeaking) {
                    // Start speaking
                    speakText(text);
                    listenButton.innerHTML = "volume_off";
                    listenButton.title = "Stop listening";
                    isSpeaking = true;
                } else {
                    // Stop speaking
                    window.speechSynthesis.cancel();
                    listenButton.innerHTML = "volume_up";
                    listenButton.title = "Listen to message";
                    isSpeaking = false;
                }
            };
            
            // Insert listen button before the copy button
            messageActions.insertBefore(listenButton, messageActions.firstChild);
            
          localStorage.setItem("saved-chats", chatContainer.innerHTML);
        }
        
    }, 75);
}

const generateAPIResponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    try {
        // Check if the message is asking about identity
        if (isAskingAboutIdentity(userMessage)) {
            const identityResponse =
                "<b>Introducing Oria:</b> A cutting-edge AI intelligence platform meticulously engineered by <a href='https://clory.netlify.app/' style='color: var(--help-color);'><b>Clory Technologies</b></a>, owned by Bappi, pioneering the next frontier of intelligent computational assistance. Crafted with precision and innovative design, <b>Oria</b> represents the pinnacle of advanced artificial intelligence, developed to transform complex problem-solving and interactive technological experiences.";
            showTypingEffect(identityResponse, textElement, incomingMessageDiv);
            return;
        }

        // Check if the message is asking for an image
        if (isAskingForImage(userMessage)) {
            const imageResponse = "At <b>Clory</b>, the pinnacle of innovation is embodied in every creation. While I, <b>Oria</b>, cannot generate images directly, our cutting-edge AI image generator, <b>C.Bailey 3</b>, stands as a testament to technological sophistication—crafting visuals of extraordinary precision and intricate detail. In the meantime, you can explore the remarkable capabilities of <a href='https://clory-bailey.netlify.app/' style='color: var(--help-color);'><b>C.Bailey 1.5</b></a>, a marvel of engineering excellence, designed to inspire and impress.";
            showTypingEffect(imageResponse, textElement, incomingMessageDiv);
            return;
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        const apiResponse = data?.candidates[0].content.parts[0].text.replace(
            /\*\*(.*?)\*\*/g, 
            '<b>$1</b>'
        );
        showTypingEffect(apiResponse, textElement, incomingMessageDiv);
    } catch (error) {
        isResponseGenerating = false;
        textElement.innerText = error.message;
        textElement.parentElement.closest(".message").classList.add("error");
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
}



const showLoadingAnimation = () => {
    const html = `
        <div class="message-content">
            <div class="avatar">
<svg width="20" class="avatar" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle 
        cx="12" 
        cy="12" 
        r="7" 
        fill="none" 
        stroke="var(--text-color)" 
        stroke-width="2.5" 
        stroke-linecap="round">
    </circle>
</svg>


        </div>
		
            <p class="text"></p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>
        <div class="message-actions">
            <span onClick="copyMessage(this)" class="icon material-symbols-rounded" title="Copy message">content_copy</span>
            <span onClick="likeMessage(this)" class="icon material-symbols-rounded like-icon" title="Like message">favorite_border</span>
		
            <div class="inline-menu">
                <span onClick="toggleInlineMenu(this)" class="icon material-symbols-rounded" title="More options">more_horiz</span>
                <div class="inline-options">
                    <div class="menu-section share-section">
                        <div class="section-title">Share on</div>
                        <div class="action-buttons">
<button onclick="shareToFacebook(this)" class="action-btn facebook">
    <i class="fab fa-facebook"></i>
</button>
<button onclick="shareToTwitter(this)" class="action-btn twitter">
    <i class="fab fa-twitter"></i>
</button>
<button onclick="shareToLinkedIn(this)" class="action-btn linkedin">
    <i class="fab fa-linkedin-in"></i>
</button>
<button onclick="shareToWhatsApp(this)" class="action-btn whatsapp">
    <i class="fab fa-whatsapp"></i>
</button>
<button onclick="shareToTelegram(this)" class="action-btn telegram">
    <i class="fab fa-telegram"></i>
</button>
<button onclick="shareToReddit(this)" class="action-btn reddit">
    <i class="fab fa-reddit"></i>
</button>
<button onclick="shareToPinterest(this)" class="action-btn pinterest">
    <i class="fab fa-pinterest"></i>
</button>
<button onclick="shareToTumblr(this)" class="action-btn tumblr">
    <i class="fab fa-tumblr"></i>
</button>
<button onclick="shareToEmail(this)" class="action-btn email">
    <i class="fas fa-envelope"></i>
</button>
                        </div>
                    </div>
                    <div class="menu-section search-section">
                        <div class="section-title">More search with</div>
                        <div class="action-buttons">
                            <button onclick="searchWithGemini(this)" class="action-btn gemini">
                                <img src="images/go.svg" alt="Gemini">
                            </button>
                            <button onclick="searchWithChatGPT(this)" class="action-btn chatgpt">
                                <img src="images/gpt.svg" alt="ChatGPT">
                            </button>
							<button onclick="searchWithclaude(this)" class="action-btn chatgpt">
                                <img src="images/cl.svg" alt="Claude">
                            </button>
							<button onclick="searchWithcopilot(this)" class="action-btn chatgpt">
                                <img src="images/cop.svg" alt="Copilot">
                            </button>
							<button onclick="searchWithllama(this)" class="action-btn chatgpt">
                                <img src="images/la.svg" alt="Meta llama">
                            </button>
							<button onclick="searchWithOria(this)" class="action-btn chatgpt">
                                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path 
									d="M16 7 A 7 7 0 1 0 16 17" 
									fill="none" 
									stroke="var(--text-color)" 
									stroke-width="2.5" 
									stroke-linecap="round" 
									transform="translate(-2, 0)">
								</path>
							</svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
    chatContainer.appendChild(incomingMessageDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    generateAPIResponse(incomingMessageDiv);
}

const copyMessage = (copyButton) => {
    const messageText = copyButton.closest('.message-actions').previousElementSibling.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyButton.innerText = "done";
    setTimeout(() => copyButton.innerText = "content_copy", 1000);
}

const likeMessage = (likeButton) => {
    const isLiked = likeButton.innerText === "favorite";
    likeButton.innerText = isLiked ? "favorite_border" : "favorite";
    likeButton.classList.toggle('liked');
    
    // Add animation class
    likeButton.classList.add('like-animation');
    setTimeout(() => likeButton.classList.remove('like-animation'), 300);
}

const toggleInlineMenu = (menuButton) => {
    const inlineOptions = menuButton.nextElementSibling;
    const isVisible = inlineOptions.classList.contains('show');
    
    // Close all other menus first
    document.querySelectorAll('.inline-options').forEach(menu => {
        menu.classList.remove('show');
    });
    
    if (!isVisible) {
        inlineOptions.classList.add('show');
    }
}

const getMessageText = (element) => {
    return element.closest('.message-actions').previousElementSibling.querySelector(".text").innerText;
}

const shareToWhatsApp = (element) => {
    const text = getMessageText(element);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}

const shareToTelegram = (element) => {
    const text = getMessageText(element);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
}

const shareToTwitter = (element) => {
    const text = getMessageText(element);
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
}

const shareToFacebook = (element) => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
}

const shareToLinkedIn = (element) => {
    const text = getMessageText(element);
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`, '_blank');
}

// Share to Reddit
const shareToReddit = (element) => {
    const text = getMessageText(element);
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`, '_blank');
}

// Share to Pinterest
const shareToPinterest = (element) => {
    const imageUrl = ''; // Provide the image URL you want to share
    const text = getMessageText(element);
    window.open(`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(window.location.href)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(text)}`, '_blank');
}

// Share to Tumblr
const shareToTumblr = (element) => {
    const text = getMessageText(element);
    window.open(`https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(text)}`, '_blank');
}

const shareToEmail = (element) => {
    const text = getMessageText(element);
    const subject = 'Shared Message';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
}

const searchWithGemini = (element) => {
    const text = getMessageText(element);
    window.open(`https://gemini.google.com/`, '_blank');
}

const searchWithChatGPT = (element) => {
    const text = getMessageText(element);
    window.open(`https://chat.openai.com/`, '_blank');
}

const searchWithclaude = (element) => {
    const text = getMessageText(element);
    window.open(`https://claude.ai/`, '_blank');
}

const searchWithcopilot = (element) => {
    const text = getMessageText(element);
    window.open(`https://copilot.microsoft.com/`, '_blank');
}

const searchWithllama = (element) => {
    const text = getMessageText(element);
    window.open(`https://api.together.ai/playground/chat/meta-llama/Llama-Vision-Free`, '_blank');
}

const searchWithOria = (element) => {
    const text = getMessageText(element);
    window.open(`https://clory.netlify.app/`);
}
// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.inline-menu')) {
        document.querySelectorAll('.inline-options').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});



const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
    if(!userMessage || isResponseGenerating) return;

    isResponseGenerating = true;

    const html = `
	
	<div class="message-conten">
                    
                    <p class="text"></p>
                </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    outgoingMessageDiv.querySelector(".text").innerText = userMessage;
    chatContainer.appendChild(outgoingMessageDiv);
    
    typingForm.reset();
    document.body.classList.add("hide-header");
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
    setTimeout(showLoadingAnimation, 500);
}

// Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("dark_mode");
  // Save theme preference to localStorage
  localStorage.setItem("theme", isLightMode ? "dark_mode" : "light_mode");
  toggleThemeButton.innerText = isLightMode ? "light_mode" : "dark_mode";
});

// Delete all chats from local storage when button is clicked
// Create a modal container for the confirmation message
const createModal = () => {
  const modal = document.createElement('div');
  modal.className = 'confirmation-modal';
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--secondary-color);
    padding: 24px;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 90vw;
    width: 400px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
	border: 1px solid var(--placeholder-color);
  `;
  return modal;
};

// Create an overlay backdrop with blur effect
const createOverlay = () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
 position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(17, 24, 39, 0.7);  /* Aligned with primary-color */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 999;
    opacity: 0;
    transition: all 0.3s ease-in-out;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  return overlay;
};

// Enhanced delete chat functionality with event isolation
deleteChatButton.addEventListener("click", () => {
  const overlay = createOverlay();
  const modal = createModal();
  
  // Disable pointer events on the main content
  document.body.style.overflow = 'hidden';
  Array.from(document.body.children).forEach(child => {
    if (child !== overlay && child !== modal) {
      child.style.pointerEvents = 'none';
      child.style.userSelect = 'none';
    }
  });
  
  modal.innerHTML = `
    <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: var(--text-color);">Confirm Delete</h2>
    <p style="margin: 0 0 24px; color: var(--text-color);">Are you certain you want to begin a<b> new chat?</b> This action will <b>reset the current conversation.</b><br/> <b>Note: <u>Oria</u></b>, powered by <b><a href="https://clory.netlify.app/" style="color: var(--help-color);" target="_b">Clory</a></b>, ensures every interaction is seamless and innovative</p>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="cancelDelete" style="
        padding: 8px 16px;
        border: 1px solid var(--text-color);
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        transition: background 0.2s;
        user-select: none;
		color: var(--text-color);
      ">Cancel</button>
      <button id="confirmDelete" style="
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: #dc3545;
        color: white;
        cursor: pointer;
        transition: background 0.2s;
        user-select: none;
      ">Delete</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Trigger reflow to enable transitions
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    modal.style.opacity = '1';
  });

  const closeModal = () => {
    overlay.style.opacity = '0';
    modal.style.opacity = '0';
    
    // Re-enable pointer events on the main content
    document.body.style.overflow = '';
    Array.from(document.body.children).forEach(child => {
      if (child !== overlay && child !== modal) {
        child.style.pointerEvents = '';
        child.style.userSelect = '';
      }
    });
    
    setTimeout(() => {
      overlay.remove();
      modal.remove();
    }, 300);
  };

  // Event handlers with stopPropagation
  document.getElementById('cancelDelete').addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
  });
  
  document.getElementById('confirmDelete').addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.removeItem("saved-chats");
    loadDataFromLocalstorage();
    closeModal();
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
});

// Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

// Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault(); 
  handleOutgoingChat();
});



loadDataFromLocalstorage();


