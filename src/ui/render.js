import { available, labels } from '../data/charts.js';
import { renderGrid } from './grid.js';
import { renderOptions } from './options.js';
import { resetProgressiveLoading, startProgressiveLoading, preloadImagesForState, preloadAdjacentStates, cancelAllPreloading, currentPreloadSessionId } from './loader.js';

export function renderApp(state) {
  console.log(`[Render] Rendering app with state: ${state.format}-${state.stacks}-${state.action}`);
  
  // Cancel any ongoing preloading operations to prioritize current state
  cancelAllPreloading();
  
  // Reset progressive loading counters before creating new images
  resetProgressiveLoading();
  
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="options-container">
      ${renderOptions(state, available)}
    </div>
    <div class="table-container">
      ${renderGrid(state, available, labels)}
    </div>
  `;
  
  // Dynamically position table container below options container
  const optionsContainer = document.querySelector('.options-container');
  const tableContainer = document.querySelector('.table-container');
  
  if (optionsContainer && tableContainer) {
    const optionsHeight = optionsContainer.offsetHeight;
    tableContainer.style.top = `${optionsHeight}px`;
  }
  
  // Clear any existing callback to prevent conflicts
  if (window.onProgressiveLoadingComplete) {
    console.log(`[Render] Clearing existing callback`);
    window.onProgressiveLoadingComplete = null;
  }
  
  // Set up callback to preload adjacent states only after current state is fully loaded
  window.onProgressiveLoadingComplete = function() {
    console.log(`[Render] Current state fully loaded, starting adjacent state preloading after delay`);
    
    // Add a small delay to ensure current state images are fully displayed
    // and to avoid competing with any remaining progressive loading operations
    setTimeout(() => {
      preloadAdjacentStates(state, labels, available);
    }, 100); // 100ms delay
    
    // Clear the callback to prevent memory leaks and multiple calls
    window.onProgressiveLoadingComplete = null;
  };
  
  console.log(`[Render] Callback set up:`, typeof window.onProgressiveLoadingComplete);
  
  // Start progressive loading after table is rendered with a small delay
  // to ensure hash change is fully processed
  setTimeout(() => {
    startProgressiveLoading(state, labels);
  }, 50);

  // Add event delegation for image clicks (step 1)
  const tableContainerEl = document.querySelector('.table-container');
  if (tableContainerEl) {
    tableContainerEl.addEventListener('click', function (e) {
      // Only handle clicks on images
      if (e.target.tagName === 'IMG' && state.action === 'RFI') {
        // Find the label for this image
        const imgId = e.target.id;
        const labelIndex = imgId && imgId.startsWith('image') ? parseInt(imgId.replace('image', '')) - 1 : -1;
        if (labelIndex >= 0 && labelIndex < labels.length) {
          const label = labels[labelIndex];
          // Only allow for main positions (not BB, NA, etc.)
          if (label && label.match(/^[1-7]\./)) {
            // e.g., 4.HJ -> 3bet.vs.HJ
            const pos = label.split('.')[1];
            const newAction = `3bet.vs.${pos}`;
            // Update hash to trigger navigation
            window.location.hash = `${state.format}-${state.stacks}-${newAction}`;
    }
        }
      }
    });
  }
  
  // Note: Current state preloading removed - progressive loading handles this
  // Only adjacent states are preloaded for better performance
}
