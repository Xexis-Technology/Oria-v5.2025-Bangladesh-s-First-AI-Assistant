let deferredPrompt;
const installButton = document.createElement('button');
installButton.style.display = 'none';

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show the install button
  installButton.style.display = 'block';
});

// Installation function
function installPWA() {
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      showNotification('Installing Oria...');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the deferredPrompt
    deferredPrompt = null;
    
    // Hide the install button
    installButton.style.display = 'none';
  });
}

// Check if the app is installed
window.addEventListener('appinstalled', (evt) => {
  showNotification('Oria has been installed successfully!');
  // Hide the install button
  installButton.style.display = 'none';
});

// Check if running as installed PWA
if (window.matchMedia('(display-mode: standalone)').matches) {
  // Running as installed PWA
  document.body.classList.add('pwa-installed');
}

// Add install button to side panel
document.addEventListener('DOMContentLoaded', () => {
  installButton.className = 'side-panel-button';
  installButton.innerHTML = `
    <span class="material-symbols-rounded">download</span>
    <span>Install App</span>
  `;
  installButton.addEventListener('click', installPWA);
  
  // Add to side panel
  const quickActionsSection = document.querySelector('.side-panel-center .side-panel-section');
  if (quickActionsSection) {
    quickActionsSection.appendChild(installButton);
  }
}); 