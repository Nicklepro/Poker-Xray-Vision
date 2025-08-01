/**
 * Image cache to store loaded images and prevent unnecessary downloads
 */
const imageCache = new Map();

// Progressive loading state
let progressiveSessionId = 0;
let progressiveCounters = new Map();
let activeHiResLoaders = new Set(); // Track active HiRes loading operations

// Preloading state management
let currentPreloadSessionId = 0;
let activePreloadPromises = new Set();
let isProgressiveLoadingActive = false; // Track if progressive loading is active

// Export for use in other modules
export { currentPreloadSessionId };

import { getImagePath } from '../logic/imageLogic.js';

/**
 * Creates a progressive image element that follows the original model:
 * 1. Start with Loading.png
 * 2. Switch to LoRes when all Loading.png are loaded
 * 3. Switch to HiRes when all LoRes are loaded
 * @param {string} loRes - URL of the low-res image.
 * @param {string} hiRes - URL of the high-res image.
 * @param {string} fallback - URL of the fallback image (e.g., NA-HiRes.png).
 * @param {string} alt - Alt text for the image.
 * @param {function} [onload] - Optional callback when the final image is loaded.
 * @returns {HTMLElement} - A div containing the image.
 */
export function createProgressiveImage(loRes, hiRes, fallback, alt, onload) {
  const container = document.createElement('div');
  container.style.setProperty('height', '150px', 'important');
  container.style.setProperty('min-height', '150px', 'important');
  container.style.setProperty('width', '200px', 'important');
  container.style.setProperty('border', '1px solid blue', 'important');
  container.style.setProperty('position', 'relative', 'important');
  container.style.setProperty('overflow', 'visible', 'important');

  const img = document.createElement('img');
  img.alt = alt || '';
  img.style.width = '200px';
  img.style.height = '150px';
  img.style.display = 'block';
  img.style.margin = '0';
  img.style.padding = '0';
  img.style.border = '2px solid red';
  img.style.backgroundColor = 'yellow';
  img.style.position = 'relative';
  img.style.zIndex = '1000';

  console.log(`[Original] Creating image for ${alt}`);

  // Add to DOM first
  container.appendChild(img);

  // Start with Loading.png
  img.src = 'Loading.png';
  img.alt = 'Loading...';
  img.dataset.state = 'loading';
  
  // Store references for global tracking
  if (!window.progressiveImages) {
    window.progressiveImages = [];
    window.loadingCount = 0;
    window.loResCount = 0;
  }
  
  const imageData = {
    img: img,
    loRes: loRes,
    hiRes: hiRes,
    fallback: fallback,
    alt: alt,
    onload: onload
  };
  
  window.progressiveImages.push(imageData);
  
  // When Loading.png loads, increment counter
  img.onload = function() {
    console.log(`[Original] Image loaded: ${img.src}`);
    
    if (img.src.includes('Loading.png')) {
      console.log(`[Original] Loading.png loaded for ${alt}`);
      window.loadingCount++;
      console.log(`[Original] Loading count: ${window.loadingCount}/${window.progressiveImages.length}`);
      
      // If all Loading.png are loaded, switch all to LoRes
      if (window.loadingCount === window.progressiveImages.length) {
        console.log(`[Original] All Loading.png loaded, switching all to LoRes`);
        window.progressiveImages.forEach(data => {
          data.img.src = data.loRes;
          data.img.alt = data.alt;
          data.img.dataset.state = 'lores';
        });
      }
    } else if (img.src.includes('LoRes.jpg')) {
      console.log(`[Original] LoRes loaded for ${alt}`);
      window.loResCount++;
      console.log(`[Original] LoRes count: ${window.loResCount}/${window.progressiveImages.length}`);
      
      // Ensure styles are maintained
      img.style.width = '200px';
      img.style.height = '150px';
      img.style.display = 'block';
      
      // If all LoRes are loaded, switch all to HiRes
      if (window.loResCount === window.progressiveImages.length) {
        console.log(`[Original] All LoRes loaded, switching all to HiRes`);
        window.progressiveImages.forEach(data => {
          data.img.src = data.hiRes;
          data.img.alt = data.alt;
          data.img.dataset.state = 'hires';
          if (data.onload) data.onload();
        });
      }
    } else if (img.src.includes('HiRes.png')) {
      console.log(`[Original] HiRes loaded for ${alt}`);
      // Ensure styles are maintained
      img.style.width = '200px';
      img.style.height = '150px';
      img.style.display = 'block';
    }
  };

  img.onerror = function() {
    console.log(`[Original] Image failed to load: ${img.src}`);
    if (img.src.includes('Loading.png')) {
      console.log(`[Original] Loading.png failed for ${alt}, trying LoRes directly`);
      img.src = loRes;
      img.alt = alt;
      img.dataset.state = 'lores';
    } else if (img.src.includes('LoRes.jpg')) {
      console.log(`[Original] LoRes failed for ${alt}, using fallback`);
        img.src = fallback;
      img.dataset.state = 'fallback';
    }
  };

  return container;
}

/**
 * Resets the progressive loading counters when new options are selected.
 * This should be called before creating new images.
 */
export function resetProgressiveLoading() {
  if (window.progressiveImages) {
    window.progressiveImages = [];
    window.loadingCount = 0;
    window.loResCount = 0;
    console.log(`[Original] Reset progressive loading counters`);
  }
}

/**
 * Cancels all active HiRes loading operations
 */
export function cancelAllHiResLoading() {
  const oldCount = activeHiResLoaders.size;
  activeHiResLoaders.clear();
  return oldCount;
}

/**
 * Preloads an image and stores it in cache
 * @param {string} src - Image source URL
 * @param {number} sessionId - Session ID to check if preload should continue
 * @returns {Promise} - Promise that resolves when image is loaded
 */
function preloadImage(src, sessionId = null) {
  return new Promise((resolve, reject) => {
    // Check if image is already in cache
    if (imageCache.has(src)) {
      console.log(`[Cache] Image already cached: ${src}`);
      resolve(imageCache.get(src));
      return;
    }

    const img = new Image();
    
    // Store the image reference for potential cancellation
    if (!window.activePreloadImages) {
      window.activePreloadImages = new Set();
    }
    window.activePreloadImages.add(img);
    
    img.onload = () => {
      // Remove from active set
      window.activePreloadImages.delete(img);
      
      // Check if this preload session is still valid
      if (sessionId !== null && sessionId !== currentPreloadSessionId) {
        // Reduced logging - only log occasionally to avoid spam
        if (Math.random() < 0.1) { // Only log 10% of cancellations
          console.log(`[Cache] Preload cancelled for ${src} (session ${sessionId} vs ${currentPreloadSessionId})`);
        }
        reject(new Error('Preload cancelled'));
        return;
      }
      
      console.log(`[Cache] Image preloaded: ${src}`);
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      // Remove from active set
      window.activePreloadImages.delete(img);
      
      // Check if this preload session is still valid
      if (sessionId !== null && sessionId !== currentPreloadSessionId) {
        // Reduced logging - only log occasionally to avoid spam
        if (Math.random() < 0.1) { // Only log 10% of cancellations
          console.log(`[Cache] Preload cancelled for ${src} (session ${sessionId} vs ${currentPreloadSessionId})`);
        }
        reject(new Error('Preload cancelled'));
        return;
      }
      
      console.log(`[Cache] Image failed to preload: ${src}`);
      reject(new Error(`Failed to load image: ${src}`));
    };
    img.src = src;
  });
}

/**
 * Checks if an image is already cached
 * @param {string} src - Image source URL
 * @returns {boolean} - True if image is cached
 */
function isImageCached(src) {
  return imageCache.has(src);
}

/**
 * Gets cached image or null if not cached
 * @param {string} src - Image source URL
 * @returns {HTMLImageElement|null} - Cached image or null
 */
function getCachedImage(src) {
  return imageCache.get(src) || null;
}

/**
 * Starts progressive loading using existing image elements with IDs.
 * This follows the original code approach of using static image elements.
 * @param {Object} state - The current state object
 * @param {Array} labels - Array of position labels
 */
export function startProgressiveLoading(state, labels) {
  isProgressiveLoadingActive = true;
  console.log(`[Progressive] Starting progressive loading for ${state.format}-${state.stacks}-${state.action}`);
  
  // Cancel any existing progressive loading by clearing all image event handlers
  for (let i = 1; i <= 8; i++) {
    const img = document.getElementById(`image${i}`);
    if (img) {
      img.onload = null;
      img.onerror = null;
    }
  }
  
  // Cancel all active HiRes loading operations immediately
  const cancelledHiRes = cancelAllHiResLoading();
  if (cancelledHiRes > 0) {
    console.log(`[Progressive] Cancelled ${cancelledHiRes} active HiRes loading operations`);
  }
  
  // Get all image elements by ID
  const images = [];
  for (let i = 1; i <= 8; i++) {
    const img = document.getElementById(`image${i}`);
    if (img) {
      images.push(img);
    }
  }
  
  if (images.length !== 8) {
    console.error(`[Progressive] Expected 8 images, found ${images.length}`);
    return;
  }
  
  // Create a unique session ID for this loading session
  const sessionId = Date.now() + Math.random();
  
  // Clear old event handlers
  images.forEach(img => {
    img.onload = null;
    img.onerror = null;
  });
  
  // Create session-specific counters
  const sessionCounters = {
    loadingCount: 0,
    loResCount: 0,
    sessionId: sessionId
  };
  
  // Store the current session ID for callback validation
  const currentProgressiveSession = sessionId;
  
  // Set up all images with progressive loading
  images.forEach((image, index) => {
    const label = labels[index];
    let cellStack = state.stacks;
    
    // Handle various stacks
    if (state.stacks && state.stacks.includes(',')) {
      const stackArray = state.stacks.replace(/^avg/, '').split(',').slice(1);
      cellStack = stackArray[index] ? stackArray[index] + 'bb' : '';
    } else {
      cellStack = state.stacks.replace(/^avg/, '');
    }

    // Use shared getImagePath function for consistent image path logic
    const imagePath = getImagePath(state, label, labels);
    let loRes, hiRes, fallback;
    
    // Determine LoRes/HiRes paths based on the image path
    if (imagePath.endsWith('-HiRes.png')) {
      hiRes = imagePath;
      loRes = imagePath.replace('-HiRes.png', '-LoRes.jpg');
      fallback = 'NA-HiRes.png';
    } else {
      // For special images like BB-HiRes.png, Fold-HiRes.png, etc.
      hiRes = imagePath;
      loRes = imagePath.replace('-HiRes.png', '-LoRes.png'); // Convert to LoRes version
      fallback = imagePath;
    }
    
    // Debug logging for each seat
    console.log(`[Progressive] Seat ${label}: imagePath=${imagePath}, loRes=${loRes}, hiRes=${hiRes}`);
    
    // Store image data
    image.dataset.loRes = loRes;
    image.dataset.hiRes = hiRes;
    image.dataset.fallback = fallback;
    image.dataset.label = label;
    image.dataset.state = 'loading';
    
    // Check if images are already cached - if so, skip progressive loading
    const isLoResCached = isImageCached(loRes);
    const isHiResCached = isImageCached(hiRes);
    
    if (isLoResCached && isHiResCached) {
      // Both images cached - load HiRes directly
      console.log(`[Progressive] Images cached for ${label}, loading HiRes directly`);
      image.src = hiRes;
      image.alt = label;
      image.dataset.state = 'hires';
      sessionCounters.loadingCount++;
      sessionCounters.loResCount++;
    } else {
      // Set Loading.png first (this triggers the onload event)
      image.src = 'Loading.png';
      image.alt = 'Loading...';
      image.dataset.state = 'loading';
    }

    // Set up onload handler for progressive loading
    image.onload = function() {
      // Check if this is still the current session
      if (sessionCounters.sessionId !== sessionId) {
        console.log(`[Progressive] Ignoring event from old session for ${label} (session ${sessionCounters.sessionId} vs ${sessionId})`);
        return;
      }
      
      if (image.src.includes('Loading.png')) {
        sessionCounters.loadingCount++;
        
        // If all Loading.png are loaded, switch to LoRes sequentially
        if (sessionCounters.loadingCount === 8) {
          console.log(`[Progressive] All Loading.png loaded, switching to LoRes sequentially`);
          
          let currentLoResIndex = 0;
          const totalImages = images.length;
          
          // Function to load next LoRes image
          function loadNextLoResImage() {
            // Check if this is still the current session
            if (sessionCounters.sessionId !== sessionId) {
              console.log(`[Progressive] LoRes loading cancelled - session changed`);
              return;
            }
            
            // Check if we've loaded all LoRes images
            if (currentLoResIndex >= totalImages) {

              
              // Start HiRes loading sequentially
              let currentHiResIndex = 0;
              let hiResLoadedCount = 0;
              
              // Function to load next HiRes image
              function loadNextHiResImage() {
                // Check if this is still the current session
                if (sessionCounters.sessionId !== sessionId) {
                  console.log(`[Progressive] HiRes loading cancelled - session changed`);
                  return;
                }
                
                // Check if we've loaded all HiRes images
                if (currentHiResIndex >= totalImages) {
                  console.log(`[Progressive] All HiRes images loaded and displayed (session ${currentProgressiveSession})`);
                  console.log(`[Progressive] Checking for callback:`, typeof window.onProgressiveLoadingComplete);
                  
                  // Only call callback if this is still the current progressive session
                  if (window.onProgressiveLoadingComplete && currentProgressiveSession === sessionId) {
                    console.log(`[Progressive] Calling completion callback (session ${currentProgressiveSession})`);
                    isProgressiveLoadingActive = false; // Mark progressive loading as complete
                    window.onProgressiveLoadingComplete();
                  } else if (!window.onProgressiveLoadingComplete) {
                    console.log(`[Progressive] No completion callback found (callback was already called and cleared)`);
                    isProgressiveLoadingActive = false; // Mark progressive loading as complete
                  } else {
                    console.log(`[Progressive] Session mismatch - callback exists but session changed (current: ${currentProgressiveSession}, callback session: ${sessionId})`);
                    isProgressiveLoadingActive = false; // Mark progressive loading as complete
                  }
                  return;
                }
                
                const img = images[currentHiResIndex];
                currentHiResIndex++;
                
                // Test if the image loads before setting it
                const testImg = new Image();
                
                // Track this HiRes loader for potential cancellation
                activeHiResLoaders.add(testImg);
                
                testImg.onload = function() {
                  // Check if this HiRes loader is still valid
                  if (!activeHiResLoaders.has(testImg)) {
                    console.log(`[Progressive] HiRes loader cancelled for ${img.dataset.label}`);
                    return;
                  }
                  
                  // Check if this is still the current session
                  if (sessionCounters.sessionId !== sessionId) {
                    console.log(`[Progressive] Ignoring HiRes load from old session for ${img.dataset.label} (session ${sessionCounters.sessionId} vs ${sessionId})`);
                    activeHiResLoaders.delete(testImg);
                    return;
                  }
                  
                  // Only change src if the test image loaded successfully
                  if (testImg.complete && testImg.naturalWidth > 0) {
                    img.src = img.dataset.hiRes;
                    img.alt = img.dataset.label;
                    img.dataset.state = 'hires';
                    
                    // Track when this HiRes image is actually displayed
                    img.onload = function() {
                      // Check if this is still the current session
                      if (sessionCounters.sessionId !== sessionId) {
                        console.log(`[Progressive] Ignoring HiRes display from old session for ${img.dataset.label} (session ${sessionCounters.sessionId} vs ${sessionId})`);
                        return;
                      }
                      
                      hiResLoadedCount++;
                      console.log(`[Progressive] HiRes loaded and displayed: ${hiResLoadedCount}/${totalImages} (${img.dataset.label}) - ${img.dataset.hiRes}`);
                      
                      // Clean up the HiRes loader
                      activeHiResLoaders.delete(testImg);
                      
                      // Wait for this image to fully load before starting the next one
                      setTimeout(() => {
                        loadNextHiResImage();
                      }, 0); // Minimal delay to ensure completion
                    };
                  }
                };
                
                testImg.onerror = function() {
                  // Remove from active loaders
                  activeHiResLoaders.delete(testImg);
                  
                  // Check if this is still the current session
                  if (sessionCounters.sessionId !== sessionId) {
                    console.log(`[Progressive] Ignoring HiRes error from old session for ${img.dataset.label} (session ${sessionCounters.sessionId} vs ${sessionId})`);
                    return;
                  }
                  
                  // If HiRes fails, keep the current image (LoRes)
                  console.log(`[Progressive] HiRes failed for ${img.dataset.label}, keeping LoRes`);
                  hiResLoadedCount++;
                  
                  // Load next HiRes image even if this one failed
                  setTimeout(() => {
                    loadNextHiResImage();
                  }, 0); // Minimal delay to ensure completion
                };
                
                testImg.src = img.dataset.hiRes;
              }
              
              // Start loading HiRes images sequentially
              loadNextHiResImage();
              return;
            }
            
            const img = images[currentLoResIndex];
            currentLoResIndex++;
            
            // Test if the image loads before setting it
            const testImg = new Image();
            testImg.onload = function() {
              // Check if this is still the current session
              if (sessionCounters.sessionId !== sessionId) {
                console.log(`[Progressive] Ignoring LoRes load from old session for ${img.dataset.label} (session ${sessionCounters.sessionId} vs ${sessionId})`);
                return;
              }
              
              // Only change src if the test image loaded successfully
              if (testImg.complete && testImg.naturalWidth > 0) {
                img.src = img.dataset.loRes;
                img.alt = img.dataset.label;
                img.dataset.state = 'lores';
                
                // Track when this LoRes image is actually displayed
                img.onload = function() {
                  // Check if this is still the current session
                  if (sessionCounters.sessionId !== sessionId) {
                    console.log(`[Progressive] Ignoring LoRes display from old session for ${img.dataset.label} (session ${sessionCounters.sessionId} vs ${sessionId})`);
                    return;
                  }
                  
                  sessionCounters.loResCount++;
                  console.log(`[Progressive] LoRes loaded and displayed: ${sessionCounters.loResCount}/8 (${img.dataset.label}) - ${img.dataset.loRes}`);
                  
                  // Wait for this image to fully load before starting the next one
                  setTimeout(() => {
                    loadNextLoResImage();
                  }, 0); // Minimal delay to ensure completion
                };
              }
            };
            testImg.onerror = function() {
              // Check if this is still the current session
              if (sessionCounters.sessionId !== sessionId) {
                console.log(`[Progressive] Ignoring LoRes error from old session for ${img.dataset.label} (session ${sessionCounters.sessionId} vs ${sessionId})`);
                return;
              }
              
              // If LoRes fails, try fallback
              const fallbackImg = new Image();
              fallbackImg.onload = function() {
                img.src = img.dataset.fallback;
                img.alt = 'NA';
                img.dataset.state = 'fallback';
                
                sessionCounters.loResCount++;
                
                // Load next LoRes image even if this one failed
                setTimeout(() => {
                  loadNextLoResImage();
                }, 0); // Minimal delay to ensure completion
              };
              fallbackImg.onerror = function() {
                // Last resort - show NA image
                img.src = 'NA-HiRes.png';
                img.alt = 'NA';
                img.dataset.state = 'fallback';
                
                sessionCounters.loResCount++;
                
                // Load next LoRes image even if this one failed
                setTimeout(() => {
                  loadNextLoResImage();
                }, 0); // Minimal delay to ensure completion
              };
              fallbackImg.src = img.dataset.fallback;
            };
            testImg.src = img.dataset.loRes;
          }
          
          // Start loading LoRes images sequentially
          loadNextLoResImage();
        }
      } else if (image.src.includes('LoRes.jpg') || image.src.includes('LoRes.png')) {
        // This is now handled in the sequential loading logic
      } else if (image.src.includes('HiRes.png')) {
      }
    };

    // Set up error handler
    image.onerror = function() {
      if (image.src.includes('Loading.png')) {
        // Test if LoRes loads before setting it
        const testImg = new Image();
        testImg.onload = function() {
          // Only change src if the test image loaded successfully
          if (testImg.complete && testImg.naturalWidth > 0) {
            image.src = image.dataset.loRes;
            image.alt = image.dataset.label;
            image.dataset.state = 'lores';
          }
        };
        testImg.onerror = function() {
          const fallbackImg = new Image();
          fallbackImg.onload = function() {
            image.src = image.dataset.fallback;
            image.alt = 'NA';
            image.dataset.state = 'fallback';
          };
          fallbackImg.onerror = function() {
            image.src = 'NA-HiRes.png';
            image.alt = 'NA';
            image.dataset.state = 'fallback';
          };
          fallbackImg.src = image.dataset.fallback;
        };
        testImg.src = image.dataset.loRes;
      } else if (image.src.includes('LoRes.jpg') || image.src.includes('LoRes.png')) {
        console.log(`[Progressive] LoRes failed for ${label}, using fallback`);
        image.src = image.dataset.fallback;
        image.dataset.state = 'fallback';
      }
    };
  });
}

/**
 * Cancels all active loading operations (HiRes, LoRes, and Preload)
 */
export function cancelAllPreloading() {
  const oldSession = currentPreloadSessionId;
  currentPreloadSessionId++;
  
  let totalCancelled = 0;
  
  // Cancel HiRes loading operations
  const cancelledHiRes = activeHiResLoaders.size;
  activeHiResLoaders.clear();
  totalCancelled += cancelledHiRes;
  
  // Cancel preload promises
  const cancelledPromises = activePreloadPromises.size;
  activePreloadPromises.clear();
  totalCancelled += cancelledPromises;
  
  // Cancel all active preload image requests
  if (window.activePreloadImages) {
    const cancelledImages = window.activePreloadImages.size;
    window.activePreloadImages.forEach(img => {
      // Abort the HTTP request by setting src to empty
      img.src = '';
      // Clear event handlers
      img.onload = null;
      img.onerror = null;
    });
    window.activePreloadImages.clear();
    totalCancelled += cancelledImages;
  }
  
  // Force garbage collection hint for cancelled images
  if (window.gc) {
    try {
      window.gc();
    } catch (e) {
      // GC not available
    }
  }
}

/**
 * Preloads images for a given state to improve performance
 * @param {Object} state - The current state object
 * @param {Array} labels - Array of position labels
 * @param {number} sessionId - Session ID to track if this preload should continue
 */
export function preloadImagesForState(state, labels, sessionId = null) {
  const preloadSessionId = sessionId || currentPreloadSessionId;
  console.log(`[Preload] Starting preload for ${state.format}-${state.stacks}-${state.action} (session ${preloadSessionId})`);
  
  // Execute preloading immediately
  executePreload(state, labels, preloadSessionId);
}

/**
 * Internal function to execute the actual preloading
 */
function executePreload(state, labels, preloadSessionId) {
  // Skip preloading if progressive loading is active to avoid network congestion
  if (isProgressiveLoadingActive) {
    return;
  }
  
  const imagesToPreload = [];
  
  labels.forEach((label, index) => {
    let cellStack = state.stacks;
    
    // Handle various stacks
    if (state.stacks && state.stacks.includes(',')) {
      const stackArray = state.stacks.replace(/^avg/, '').split(',').slice(1);
      cellStack = stackArray[index] ? stackArray[index] + 'bb' : '';
    } else {
      cellStack = state.stacks.replace(/^avg/, '');
    }
    
    // --- Explicit image logic for all modes (RFI, 3bet, 4bet, Call, Allin) ---
    // Use getImagePath for consistent image path logic
    const imagePath = getImagePath(state, label, labels);
    
    // Convert HiRes path to LoRes path for progressive loading
    let loRes, hiRes;
    if (imagePath.endsWith('-HiRes.png')) {
      hiRes = imagePath;
      loRes = imagePath.replace('-HiRes.png', '-LoRes.jpg');
    } else {
      hiRes = imagePath;
      loRes = imagePath;
    }
    
    // Only preload if not already cached and not a special image
    if (imagePath !== 'Fold-HiRes.png' && imagePath !== 'BB-HiRes.png' && imagePath !== 'NA-HiRes.png') {
      if (!isImageCached(loRes)) {
        const promise = preloadImage(loRes, preloadSessionId);
        activePreloadPromises.add(promise);
        imagesToPreload.push(promise);
      }
      if (!isImageCached(hiRes)) {
        const promise = preloadImage(hiRes, preloadSessionId);
        activePreloadPromises.add(promise);
        imagesToPreload.push(promise);
      }
    }
  });
  
  // Preload all images in parallel
  Promise.allSettled(imagesToPreload).then(results => {
    // Check if this preload session is still valid
    if (preloadSessionId !== currentPreloadSessionId) {
      console.log(`[Preload] Preload session ${preloadSessionId} cancelled - new session ${currentPreloadSessionId} started`);
      return;
    }
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[Preload] Preload completed for ${state.format}-${state.stacks}-${state.action}: ${successful} successful, ${failed} failed`);
    
    // Clean up promises from active set
    imagesToPreload.forEach(promise => activePreloadPromises.delete(promise));
  });
}

/**
 * Preloads images for adjacent states to improve user experience
 * Only preloads within the same format to reduce unnecessary downloads
 * @param {Object} currentState - The current state object
 * @param {Array} labels - Array of position labels
 * @param {Object} available - Available options object
 */
export function preloadAdjacentStates(currentState, labels, available) {
  // Capture the current session ID to track if this preload should continue
  const adjacentPreloadSessionId = currentPreloadSessionId;
  
  const adjacentStates = [];
  
  // Extract available formats, stacks, and actions from the available array
  const availableFormats = new Set();
  
  // Parse the available array to extract unique formats
  available.forEach(item => {
    const parts = item.split('-');
    if (parts.length >= 3) {
      availableFormats.add(parts[0]); // First part is format (Cash, CashLive, etc.)
    }
  });
  

  
  // Filter available items to only include the current format
  const currentFormatItems = available.filter(item => item.startsWith(currentState.format));
  console.log(`[Preload] Found ${currentFormatItems.length} items for format ${currentState.format}:`, currentFormatItems.slice(0, 5)); // Show first 5
  
  // Extract actions and stacks only from the current format
  const formatActions = new Set();
  const formatStacks = new Set();
  
  currentFormatItems.forEach(item => {
    // Find stack size (look for avg pattern)
    const stackMatch = item.match(/avg\d+bb/);
    if (stackMatch) {
      formatStacks.add(stackMatch[0]);
    }
    
    // Find action (everything after the stack)
    const stackIndex = item.indexOf(stackMatch ? stackMatch[0] : '');
    if (stackIndex !== -1) {
      const actionPart = item.substring(stackIndex + (stackMatch ? stackMatch[0].length : 0) + 1);
      if (actionPart) {
        formatActions.add(actionPart);
      }
    }
  });
  
  console.log(`[Preload] Available actions for ${currentState.format}:`, Array.from(formatActions));
  console.log(`[Preload] Available stacks for ${currentState.format}:`, Array.from(formatStacks));
  
  // Preload different actions that actually exist within the same format
  formatActions.forEach(action => {
    if (action !== currentState.action) {
      adjacentStates.push({
        format: currentState.format,
        stacks: currentState.stacks,
        action: action
      });
    }
  });
  
  // Preload different stack sizes that actually exist within the same format (limit to most common ones)
  const commonStacks = Array.from(formatStacks).slice(0, 3); // Limit to 3 most common
  commonStacks.forEach(stack => {
    if (stack !== currentState.stacks) {
      adjacentStates.push({
        format: currentState.format,
        stacks: stack,
        action: currentState.action
      });
    }
  });
  
  // Filter out states that are already mostly cached and verify they exist
  const statesToPreload = adjacentStates
    .map(state => {
      // Check how many images for this state are already cached
      let cachedCount = 0;
      let totalCount = 0;
      let existingImages = 0;
      
      labels.forEach(label => {
        // Use shared getImagePath function for consistent image path logic
        const imagePath = getImagePath(state, label, labels);
        
        // Convert HiRes path to LoRes path for cache checking
        let loRes, hiRes;
        if (imagePath.endsWith('-HiRes.png')) {
          hiRes = imagePath;
          loRes = imagePath.replace('-HiRes.png', '-LoRes.jpg');
        } else {
          hiRes = imagePath;
          loRes = imagePath;
        }
        
        // Only count cache for non-special images
        if (imagePath !== 'Fold-HiRes.png' && imagePath !== 'BB-HiRes.png' && imagePath !== 'NA-HiRes.png') {
          if (isImageCached(loRes)) cachedCount++;
          if (isImageCached(hiRes)) cachedCount++;
          totalCount += 2;
        }
        // Check if this state actually exists in the available data
        const stateKey = `${state.format}-${state.stacks}-${state.action}`;
        if (currentFormatItems.some(item => item.includes(stateKey))) {
          existingImages++;
        }
      });
      
      const cacheRatio = cachedCount / totalCount;
      const existsRatio = existingImages / labels.length;
      return { state, cacheRatio, cachedCount, totalCount, existsRatio };
    })
    .filter(item => item.cacheRatio < 0.5 && item.existsRatio > 0.5) // Only preload if less than 50% cached AND more than 50% of images exist
    .sort((a, b) => a.cacheRatio - b.cacheRatio) // Sort by least cached first
    .slice(0, 5) // Limit to 5 states (was 3)
    .map(item => item.state);
  
  console.log(`[Preload] Queuing ${statesToPreload.length} adjacent states for sequential preloading (smart cache-aware):`, statesToPreload);
  
  // Calculate total images being preloaded
  const totalImages = statesToPreload.length * labels.length * 2; // 2 images per label (LoRes + HiRes)
  console.log(`[Preload] Total images to preload: ${totalImages} (${statesToPreload.length} states × ${labels.length} labels × 2 images each)`);
  
  // Start truly sequential preloading - one image at a time
  let currentStateIndex = 0;
  let currentImageIndex = 0;
  let currentImageType = 'loRes'; // Start with LoRes images
  
  function preloadNextImage() {
    // Check if this preload session is still valid
    if (adjacentPreloadSessionId !== currentPreloadSessionId) {
      console.log(`[Preload] Adjacent preloading cancelled - session changed (${adjacentPreloadSessionId} vs ${currentPreloadSessionId})`);
      return;
    }
    
    // Check if we've preloaded all states
    if (currentStateIndex >= statesToPreload.length) {
      console.log(`[Preload] All adjacent states preloaded`);
      return;
    }
    
    const state = statesToPreload[currentStateIndex];
    const label = labels[currentImageIndex];
    
    // Use shared getImagePath function for consistent image path logic
    const baseImagePath = getImagePath(state, label, labels);
    
    // Convert to LoRes or HiRes based on current type
    let imagePath;
    if (baseImagePath.endsWith('-HiRes.png')) {
      imagePath = currentImageType === 'loRes' 
        ? baseImagePath.replace('-HiRes.png', '-LoRes.jpg')
        : baseImagePath;
    } else {
      // For special images like BB-HiRes.png, Fold-HiRes.png, etc.
      imagePath = currentImageType === 'loRes' 
        ? baseImagePath.replace('-HiRes.png', '-LoRes.jpg')
        : baseImagePath;
    }
    
    // Only preload if not already cached and not a special image
    if (baseImagePath !== 'Fold-HiRes.png' && baseImagePath !== 'BB-HiRes.png' && baseImagePath !== 'NA-HiRes.png' && !isImageCached(imagePath)) {
      console.log(`[Preload] Preloading image ${currentStateIndex + 1}/${statesToPreload.length}, ${currentImageIndex + 1}/${labels.length}, ${currentImageType}: ${imagePath}`);
      
      const promise = preloadImage(imagePath, adjacentPreloadSessionId);
      activePreloadPromises.add(promise);
      
      promise.then(() => {
        // Move to next image
        moveToNextImage();
      }).catch(() => {
        // Even if it fails, move to next image
        moveToNextImage();
      });
    } else {
      // Skip cached image and move to next
      moveToNextImage();
    }
  }
  
  function moveToNextImage() {
    // Move to next image type or next label
    if (currentImageType === 'loRes') {
      currentImageType = 'hiRes';
    } else {
      currentImageType = 'loRes';
      currentImageIndex++;
    }
    
    // Move to next state if we've processed all labels
    if (currentImageIndex >= labels.length) {
      currentImageIndex = 0;
      currentStateIndex++;
    }
    
    // Continue with next image after a delay to ensure truly sequential loading
    setTimeout(() => {
      preloadNextImage();
    }, 100); // 100ms delay between each preload image
  }
  
  // Start sequential preloading
  preloadNextImage();
  
  console.log(`[Preload] Started truly sequential adjacent state preloading (one image at a time)`);
}

/**
 * Clears the image cache (useful for debugging or memory management)
 */
export function clearImageCache() {
  imageCache.clear();
  console.log(`[Cache] Image cache cleared`);
}

/**
 * Gets cache statistics
 * @returns {Object} - Cache statistics
 */
export function getCacheStats() {
  return {
    size: imageCache.size,
    keys: Array.from(imageCache.keys()),
    activePreloads: activePreloadPromises.size,
    currentSession: currentPreloadSessionId
  };
}

/**
 * Gets detailed cache information
 * @returns {Object} - Detailed cache information
 */
export function getDetailedCacheInfo() {
  const keys = Array.from(imageCache.keys());
  const formatGroups = {};
  const actionGroups = {};
  
  keys.forEach(key => {
    // Group by format
    if (key.includes('Charts/')) {
      const parts = key.split('/')[1].split('-');
      const format = parts[0];
      formatGroups[format] = (formatGroups[format] || 0) + 1;
      
      // Group by action
      const actionMatch = key.match(/-(RFI|3bet\.vs\.[A-Z]+|4bet\.[A-Z]+\.vs\.[A-Z]+)/);
      if (actionMatch) {
        const action = actionMatch[1];
        actionGroups[action] = (actionGroups[action] || 0) + 1;
      }
    } else {
      // Special images (BB, NA, etc.)
      formatGroups['Special'] = (formatGroups['Special'] || 0) + 1;
    }
  });
  
  return {
    totalImages: imageCache.size,
    byFormat: formatGroups,
    byAction: actionGroups,
    allKeys: keys
  };
}

/**
 * Checks if specific images are cached
 * @param {Array} imagePaths - Array of image paths to check
 * @returns {Object} - Results showing which images are cached
 */
export function checkImagesCached(imagePaths) {
  const results = {};
  imagePaths.forEach(path => {
    results[path] = {
      cached: isImageCached(path),
      cachedImage: getCachedImage(path)
    };
  });
  return results;
}

/**
 * Tests browser cache vs JavaScript cache for a specific image
 * @param {string} imagePath - Image path to test
 * @returns {Promise<Object>} - Results of the cache test
 */
export function testBrowserCache(imagePath) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // Test browser cache (fresh Image object)
    const testImg = new Image();
    testImg.onload = () => {
      const loadTime = performance.now() - startTime;
      resolve({
        imagePath,
        browserCacheHit: loadTime < 50, // Very fast load indicates cache hit
        loadTime: Math.round(loadTime),
        naturalWidth: testImg.naturalWidth,
        naturalHeight: testImg.naturalHeight,
        jsCacheHit: isImageCached(imagePath)
      });
    };
    testImg.onerror = () => {
      resolve({
        imagePath,
        browserCacheHit: false,
        loadTime: null,
        error: true,
        jsCacheHit: isImageCached(imagePath)
      });
    };
    testImg.src = imagePath;
  });
}

/**
 * Tests multiple images for browser cache status
 * @param {Array} imagePaths - Array of image paths to test
 * @returns {Promise<Array>} - Results for all images
 */
export async function testBrowserCacheMultiple(imagePaths) {
  const results = [];
  for (const path of imagePaths) {
    const result = await testBrowserCache(path);
    results.push(result);
  }
  return results;
}

/**
 * Gets preloading statistics
 * @returns {Object} - Preloading statistics
 */
export function getPreloadStats() {
  return {
    activePreloads: activePreloadPromises.size,
    currentSession: currentPreloadSessionId,
    cacheSize: imageCache.size,
    progressiveLoadingActive: isProgressiveLoadingActive
  };
}

// Debug function to show current state
export function debugCurrentState() {
  console.log(`[Debug] Progressive loading active: ${isProgressiveLoadingActive}`);
  console.log(`[Debug] Cache size: ${imageCache.size}`);
  console.log(`[Debug] Active preloads: ${activePreloadPromises.size}`);
  console.log(`[Debug] Current preload session: ${currentPreloadSessionId}`);
  
  // Show cached images for current format
  const cachedImages = Array.from(imageCache.keys());
  const currentFormatImages = cachedImages.filter(img => img.includes('ICM'));
  console.log(`[Debug] Cached ICM images:`, currentFormatImages.slice(0, 10)); // Show first 10
}