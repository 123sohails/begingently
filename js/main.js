// BeginGently - Navigation & Interactivity

// Theme toggle functionality
(function() {
  const html = document.documentElement;
  
  // Get saved theme or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  html.setAttribute('data-theme', initialTheme);
  
  // Set up toggle on page load
  const setupToggle = () => {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      // Click handler
      themeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToggle);
  } else {
    setupToggle();
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  // Update active nav link based on current page
  const navLinks = document.querySelectorAll('.nav-links a');
  const currentPath = window.location.pathname;
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    const isActive = currentPath.includes(href) || (currentPath.endsWith('/') && href === 'index.html');
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
});

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Expand/collapse functionality for library items (used where needed)
window.toggleItem = function (element) {
  const isExpanded = element.classList.contains('expanded');
  if (isExpanded) {
    element.classList.remove('expanded');
  } else {
    element.classList.add('expanded');
  }
};

// Basic text-to-speech controls for supported browsers
(function() {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return;
  }

  let activeButton = null;
  let activeUtterance = null;

  const setButtonState = (button, isPlaying) => {
    if (!button) return;
    button.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    button.textContent = isPlaying ? 'Stop audio' : 'Listen to this page';
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setButtonState(activeButton, false);
    activeButton = null;
    activeUtterance = null;
  };

  const getReadableText = (selector) => {
    const target = document.querySelector(selector || '#main-content');
    if (!target) return '';
    const clone = target.cloneNode(true);
    clone.querySelectorAll('script, style, nav, footer, button, .skip-link').forEach((el) => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };

  const startSpeech = (button) => {
    const selector = button.getAttribute('data-tts-target') || '#main-content';
    const text = getReadableText(selector);
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = document.documentElement.lang === 'ar' ? 'ar-SA' : 'en-US';
    utterance.onend = stopSpeech;
    utterance.onerror = stopSpeech;

    activeButton = button;
    activeUtterance = utterance;
    setButtonState(button, true);
    window.speechSynthesis.speak(utterance);
  };

  const initTTS = () => {
    const buttons = document.querySelectorAll('.tts-toggle');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        if (activeButton === button && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
          stopSpeech();
          return;
        }
        stopSpeech();
        startSpeech(button);
      });
    });
  };

  window.addEventListener('beforeunload', stopSpeech);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTTS);
  } else {
    initTTS();
  }
})();
