// BeginGently - Navigation & Interactivity

// Theme toggle functionality
(function() {
  const html = document.documentElement;
  const themes = ['light', 'brown', 'dark'];
  
  // Get saved theme or use system preference
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = themes.includes(savedTheme) ? savedTheme : (prefersDark ? 'dark' : 'light');
  
  html.setAttribute('data-theme', initialTheme);
  
  // Set up toggle on page load
  const setupToggle = () => {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
      // Click handler
      themeToggle.addEventListener('click', function(e) {
        e.preventDefault();
        const currentTheme = html.getAttribute('data-theme') || 'light';
        const currentIndex = themes.indexOf(currentTheme);
        const newTheme = themes[(currentIndex + 1) % themes.length];
        
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
  let utteranceQueue = [];
  let selectedVoice = null;
  let selectedLang = 'en-US';

  const setButtonState = (button, isPlaying) => {
    if (!button) return;
    button.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    button.textContent = isPlaying ? getLabel('stop') : getLabel('listen');
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setButtonState(activeButton, false);
    activeButton = null;
    utteranceQueue = [];
  };

  const getReadableText = (selector) => {
    const target = document.querySelector(selector || '#main-content');
    if (!target) return '';
    const clone = target.cloneNode(true);
    clone.querySelectorAll('script, style, nav, footer, button, .skip-link').forEach((el) => el.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  };

  const normalizeLang = (value) => {
    const v = (value || '').toLowerCase();
    if (v === 'en') return 'en-US';
    if (v === 'ur') return 'ur-PK';
    if (v === 'te') return 'te-IN';
    if (v.startsWith('ur')) return 'ur-PK';
    if (v.startsWith('te')) return 'te-IN';
    if (v.startsWith('ar')) return 'ar-SA';
    return 'en-US';
  };

  const inferLangFromText = (text) => {
    if (/[\u0600-\u06FF]/.test(text)) return 'ur-PK';
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
    return 'en-US';
  };

  const getPreferredLang = (selector, text) => {
    const target = document.querySelector(selector || '#main-content');
    const forcedButtonLang = normalizeLang(activeButton?.getAttribute('data-tts-lang') || '');
    if (forcedButtonLang !== 'en-US' || (activeButton?.getAttribute('data-tts-lang') || '').toLowerCase().startsWith('en')) {
      return forcedButtonLang;
    }
    const forcedStoredLang = normalizeLang(localStorage.getItem('tts_lang') || '');
    if (forcedStoredLang !== 'en-US' || (localStorage.getItem('tts_lang') || '').toLowerCase().startsWith('en')) {
      return forcedStoredLang;
    }
    const targetLang = target?.getAttribute('lang') || target?.closest('[lang]')?.getAttribute('lang');
    const docLang = document.documentElement.getAttribute('lang');
    const attrLang = normalizeLang(targetLang || docLang || '');
    if (attrLang !== 'en-US') return attrLang;
    return inferLangFromText(text || '');
  };

  const getLabel = (kind) => {
    const l = selectedLang.toLowerCase();
    if (l.startsWith('ur')) return kind === 'stop' ? 'آڈیو بند کریں' : 'یہ صفحہ سنیں';
    if (l.startsWith('te')) return kind === 'stop' ? 'ఆడియో ఆపు' : 'ఈ పేజీ వినండి';
    return kind === 'stop' ? 'Stop audio' : 'Listen to this page';
  };

  const splitIntoChunks = (text, maxLength = 220) => {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    const chunks = [];
    let current = '';

    sentences.forEach((sentence) => {
      const part = sentence.trim();
      if (!part) return;

      if ((current + ' ' + part).trim().length <= maxLength) {
        current = (current + ' ' + part).trim();
        return;
      }

      if (current) {
        chunks.push(current);
      }

      if (part.length <= maxLength) {
        current = part;
        return;
      }

      let start = 0;
      while (start < part.length) {
        const slice = part.slice(start, start + maxLength).trim();
        if (slice) chunks.push(slice);
        start += maxLength;
      }
      current = '';
    });

    if (current) chunks.push(current);
    return chunks;
  };

  const pickVoice = (preferredLang) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const base = (preferredLang || 'en-US').split('-')[0].toLowerCase();
    return (
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(base)) ||
      voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) ||
      voices.find((v) => /english/i.test(v.name)) ||
      voices[0]
    );
  };

  const speakNextChunk = () => {
    if (!activeButton || !utteranceQueue.length) {
      stopSpeech();
      return;
    }

    const text = utteranceQueue.shift();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = selectedVoice?.lang || selectedLang;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = speakNextChunk;
    utterance.onerror = stopSpeech;

    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const startSpeech = (button) => {
    const selector = button.getAttribute('data-tts-target') || '#main-content';
    const text = getReadableText(selector);
    if (!text) return;

    activeButton = button;
    selectedLang = getPreferredLang(selector, text);
    setButtonState(button, true);
    selectedVoice = pickVoice(selectedLang);
    utteranceQueue = splitIntoChunks(text);
    speakNextChunk();
  };

  const initTTS = () => {
    const buttons = document.querySelectorAll('.tts-toggle');
    if (!buttons.length) return;

    const baseSelector = buttons[0].getAttribute('data-tts-target') || '#main-content';
    selectedLang = getPreferredLang(baseSelector, getReadableText(baseSelector));
    selectedVoice = pickVoice(selectedLang);
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      selectedVoice = pickVoice(selectedLang);
    });

    buttons.forEach((button) => {
      setButtonState(button, false);
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
  window.setTtsLanguage = function(lang) {
    if (!lang) {
      localStorage.removeItem('tts_lang');
      selectedLang = 'en-US';
      selectedVoice = pickVoice(selectedLang);
      return;
    }
    selectedLang = normalizeLang(lang);
    localStorage.setItem('tts_lang', selectedLang);
    selectedVoice = pickVoice(selectedLang);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTTS);
  } else {
    initTTS();
  }
})();

// Register service worker + external link offline handling
(function() {
  const offlineUrl = '/offline.html';

  const isExternalLink = (anchor) => {
    try {
      const url = new URL(anchor.getAttribute('href'), window.location.href);
      return url.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  };

  const annotateExternalLinks = () => {
    const links = document.querySelectorAll('a[href]');
    links.forEach((link) => {
      if (!isExternalLink(link)) return;
      const label = link.textContent.trim();
      link.classList.add('external-link');
      link.setAttribute('data-external', 'true');
      link.setAttribute('title', 'External link (internet required offline)');
      link.setAttribute('aria-label', `${label} (external link, internet required offline)`);
      if (link.getAttribute('target') === '_blank') {
        const rel = (link.getAttribute('rel') || '').trim();
        if (!/noopener/i.test(rel) || !/noreferrer/i.test(rel)) {
          link.setAttribute('rel', `${rel} noopener noreferrer`.trim());
        }
      }
    });
  };

  const setupOfflineExternalRedirect = () => {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]');
      if (!link || !isExternalLink(link)) return;
      if (navigator.onLine) return;
      event.preventDefault();
      window.location.href = offlineUrl;
    });
  };

  const registerServiceWorker = () => {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail: site remains functional without offline cache.
      });
    });
  };

  const init = () => {
    annotateExternalLinks();
    setupOfflineExternalRedirect();
    registerServiceWorker();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Custom PWA install prompt button
(function() {
  let deferredPrompt = null;
  let installBtn = null;

  const createInstallButton = () => {
    if (installBtn) return installBtn;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'install-app-btn';
    btn.textContent = 'Install App';
    btn.hidden = true;
    btn.setAttribute('aria-label', 'Install this app');
    document.body.appendChild(btn);
    installBtn = btn;
    return btn;
  };

  const showInstallButton = () => {
    const btn = createInstallButton();
    btn.hidden = false;
  };

  const hideInstallButton = () => {
    if (installBtn) {
      installBtn.hidden = true;
    }
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideInstallButton();
  });

  if (window.matchMedia('(display-mode: standalone)').matches) {
    hideInstallButton();
    return;
  }

  const btn = createInstallButton();
  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice && choice.outcome === 'accepted') {
      hideInstallButton();
    }
    deferredPrompt = null;
  });
})();
