import { available, labels } from './data/charts.js';
import { state, parseHash } from './logic/state.js';
import { renderApp } from './ui/render.js';
import { setupNavigation } from './logic/navigation.js';
import { setupActions } from './logic/actions.js';

// For now, just log to verify import works
console.log('Available charts:', available);
console.log('Labels:', labels);

// Initial load - parseHash will handle setting defaults and updating the hash if needed
parseHash();
console.log('On first load, state.format =', state.format);
renderApp(state);

// Set up navigation and actions
setupNavigation();
setupActions();

// Dynamic glow sizing based on window size
function updateGlowSize() {
  const width = window.innerWidth;
  let blur, spread;
  
  if (width <= 480) {
    // Small mobile
    blur = '12px';
    spread = '3px';
  } else if (width <= 768) {
    // Medium mobile/tablet
    blur = '16px';
    spread = '4px';
  } else if (width <= 1024) {
    // Small desktop/tablet landscape
    blur = '20px';
    spread = '5px';
  } else {
    // Large desktop
    blur = '24px';
    spread = '6px';
  }
  
  document.documentElement.style.setProperty('--glow-blur', blur);
  document.documentElement.style.setProperty('--glow-spread', spread);
  }
  
// --- Scrollbar detection and .has-scrollbar toggle ---
function updateScrollbarClass() {
  const container = document.querySelector('.table-container');
  if (!container) return;
  // Check if vertical scrollbar is present
  if (container.scrollHeight > container.clientHeight) {
    container.classList.add('has-scrollbar');
  } else {
    container.classList.remove('has-scrollbar');
  }
}

// Initialize glow size and set up resize listener
document.addEventListener('DOMContentLoaded', () => {
  // Add viewport meta tag if not present
  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement('meta');
    viewport.name = 'viewport';
    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
    document.head.appendChild(viewport);
  }
  
  // Set initial glow size
  updateGlowSize();
  
  // Update glow size on window resize (with debouncing for performance)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateGlowSize, 100); // Debounce to 100ms
  });

  // Set initial scrollbar class
  updateScrollbarClass();

  // Update scrollbar class on window resize (debounced)
  let resizeTimeoutScrollbar;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeoutScrollbar);
    resizeTimeoutScrollbar = setTimeout(() => {
      updateGlowSize();
      updateScrollbarClass();
    }, 100);
  });
});
