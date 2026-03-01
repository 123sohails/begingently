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
