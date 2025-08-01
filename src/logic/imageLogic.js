// Shared logic for poker grid and loader image/label assignment

/**
 * Returns the label and image path for a given seat, state, and labels array.
 * @param {object} state - The current state object
 * @param {string} label - The seat label (e.g., '7.SB')
 * @param {string[]} labels - The array of all seat labels
 * @returns {{label: string, image: string}}
 */
export function getLabelAndImage(state, label, labels) {
  const action = state.action || 'RFI';
  const labelIdx = labels.indexOf(label);
  
  // Helper function to get full image path
  const getFullImagePath = (baseImage) => {
    // Special images (Fold, BB, NA) are in root directory
    if (baseImage === 'Fold-HiRes.png' || baseImage === 'BB-HiRes.png' || baseImage === 'NA-HiRes.png') {
      return baseImage;
    }
    // Chart images are in Charts/ directory with format and stacks prefix
    return `Charts/${state.format}-${state.stacks}-${baseImage}`;
  };
  
  // RFI mode
  if (!state.action || state.action === 'RFI') {
    if (label === '8.BB') {
      return { label: 'RFI', image: getFullImagePath('BB-HiRes.png') };
    }
    return { label: 'RFI', image: getFullImagePath(`RFI-${label}-HiRes.png`) };
  }
  // 3bet.vs.<pos>
  if (action.startsWith('3bet.vs.')) {
    const pos = action.split('.')[2];
    const posIdx = labels.findIndex(l => l.endsWith('.' + pos));
    if (labelIdx < posIdx) {
      return { label: 'RFI', image: getFullImagePath('Fold-HiRes.png') };
    } else if (labelIdx === posIdx) {
      return { label: 'RFI', image: getFullImagePath(`RFI-${label}-HiRes.png`) };
    } else {
      return { label: `3bet.vs.${pos}`, image: getFullImagePath(`3bet.vs.${pos}-${label}-HiRes.png`) };
    }
  }
  // 4bet.<rfi>.vs.<pos>
  if (action.startsWith('4bet.')) {
    const parts = action.split('.');
    const rfi = parts[1];
    const pos = parts[3];
    const rfiIdx = labels.findIndex(l => l.endsWith('.' + rfi));
    const posIdx = labels.findIndex(l => l.endsWith('.' + pos));
    if (labelIdx < rfiIdx) {
      return { label: 'RFI', image: getFullImagePath('Fold-HiRes.png') };
    } else if (labelIdx === rfiIdx) {
      return { label: `4bet.vs.${pos}`, image: getFullImagePath(`4bet.${rfi}.vs.${pos}-${label}-HiRes.png`) };
    } else if (labelIdx > rfiIdx && labelIdx < posIdx) {
      return { label: `3bet.vs.${rfi}`, image: getFullImagePath('Fold-HiRes.png') };
    } else if (labelIdx === posIdx) {
      return { label: `3bet.vs.${rfi}`, image: getFullImagePath(`3bet.vs.${rfi}-${label}-HiRes.png`) };
    } else {
      return { label: `4bet.SQZ.vs.${pos}+${rfi}`, image: getFullImagePath(`4bet.${rfi}.vs.${pos}-${label}-HiRes.png`) };
    }
  }
  // Call.<pos>
  if (action.startsWith('Call.')) {
    const pos = action.split('.')[1];
    const posIdx = labels.findIndex(l => l.endsWith('.' + pos));
    if (labelIdx < posIdx) {
      return { label: 'RFI', image: getFullImagePath('Fold-HiRes.png') };
    } else if (labelIdx === posIdx) {
      return { label: 'Call', image: getFullImagePath(`RFI-${label}-HiRes.png`) };
    } else {
      return { label: 'PFR', image: getFullImagePath(`Call.${pos}-${label}-HiRes.png`) };
    }
  }
  // Allin.<pos>
  if (action.startsWith('Allin.')) {
    const pos = action.split('.')[1];
    const posIdx = labels.findIndex(l => l.endsWith('.' + pos));
    if (labelIdx < posIdx) {
      return { label: 'RFI', image: getFullImagePath('Fold-HiRes.png') };
    } else if (labelIdx === posIdx) {
      return { label: 'Allin', image: getFullImagePath(`RFI-${label}-HiRes.png`) };
    } else {
      return { label: 'Call', image: getFullImagePath(`Allin.${pos}-${label}-HiRes.png`) };
    }
  }
  // Fallback
  return { label: '', image: getFullImagePath('NA-HiRes.png') };
}

/**
 * Returns only the image path for a given seat, state, and labels array.
 * @param {object} state
 * @param {string} label
 * @param {string[]} labels
 * @returns {string}
 */
export function getImagePath(state, label, labels) {
  return getLabelAndImage(state, label, labels).image;
} 