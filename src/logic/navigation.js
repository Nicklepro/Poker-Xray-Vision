import { parseHash, state } from './state.js';
import { renderApp } from '../ui/render.js';
import { preloadImagesForState } from '../ui/loader.js';

let resizeTimeout = null;

export function setupNavigation() {
  window.addEventListener('hashchange', () => {
    console.log('[Navigation] hashchange event fired, re-rendering app');
    parseHash();
    renderApp(state);
  });

  // Debounced resize handler to prevent excessive re-renders
  window.addEventListener('resize', () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      const currentOrientation = window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
      
      // Check if orientation changed due to resize
      if (currentOrientation !== lastOrientation) {
        lastOrientation = currentOrientation;
        renderApp(state);
        console.log(`[Navigation] Resize: re-rendered app (${currentOrientation}, ${window.innerWidth}x${window.innerHeight})`);
      } else {
        // Only adjust positioning if orientation didn't change
        const optionsContainer = document.querySelector('.options-container');
        const tableContainer = document.querySelector('.table-container');
        
        if (optionsContainer && tableContainer) {
          const currentTop = parseInt(tableContainer.style.top) || 0;
          const optionsHeight = optionsContainer.offsetHeight;
          
          // Only update if the position actually needs to change
          if (Math.abs(currentTop - optionsHeight) > 5) {
            tableContainer.style.top = `${optionsHeight}px`;
          }
        }
      }
    }, 100); // 100ms debounce
  });

  // Handle orientation change with smart detection
  let lastOrientation = window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';

  window.addEventListener('orientationchange', () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      const currentOrientation = window.innerWidth < window.innerHeight ? 'portrait' : 'landscape';
      
      // Only re-render if orientation actually changed
      if (currentOrientation !== lastOrientation) {
        lastOrientation = currentOrientation;
    renderApp(state);
        console.log(`[Navigation] Orientation change: re-rendered app (${currentOrientation}, ${window.innerWidth}x${window.innerHeight})`);
      } else {
        console.log(`[Navigation] Orientation change: no layout change needed (${currentOrientation}, ${window.innerWidth}x${window.innerHeight})`);
      }
    }, 100);
  });
}

/**
 * Preloads images for the current state to improve performance
 */
export async function preloadCurrentState() {
  const { available, labels } = await import('../data/charts.js');
  preloadImagesForState(state, labels);
} 