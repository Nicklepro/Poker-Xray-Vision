import { state } from '../logic/state.js';

export function renderOptions(state, available) {
  // Recalculate isICM on every render
  const isICM = state.format.startsWith('ICM');
  
  // Check if we're on mobile (portrait)
  const isMobile = window.innerWidth <= 480;
  
  // --- MAIN FORMAT BUTTONS ---
  const mainFormats = ['Cash', 'ICM', 'SNG', 'HU'];
  const mainFormat = mainFormats.find(f => state.format.startsWith(f)) || 'Cash';
  
  let mainFormatButtons;
  if (isMobile) {
    // Mobile: Use dropdown
    mainFormatButtons = `<select class="format-dropdown" data-type="main-format">
      ${mainFormats.map(f => {
        const isSelected = mainFormat === f;
        return `<option value="${f}"${isSelected ? ' selected' : ''}>${f}</option>`;
      }).join('')}
    </select>`;
  } else {
    // Desktop: Use buttons
    mainFormatButtons = mainFormats.map(f => {
    const isActive = mainFormat === f;
    return `<button class="changeLink option${isActive ? ' active' : ''}" data-type="main-format" data-value="${f}">${f}</button>`;
  }).join(' ');
  }

  // --- SUB-OPTION BUTTONS ---
  let subOptionButtons = '';
  if (mainFormat === 'ICM') {
    const icmFormats = Array.from(new Set(
      available
        .filter(entry => entry.startsWith('ICM') && entry.endsWith('-' + state.action))
        .map(entry => entry.split('-')[0])
    ));
    subOptionButtons = '<span class="options-label">Players Left:</span> ' + icmFormats.map(f => {
      const percent = f.replace('ICM', '') + '%';
      const isActive = state.format === f;
      return `<button class="changeLink option${isActive ? ' active' : ''}" data-type="format" data-value="${f}">${percent}</button>`;
    }).join(' ');
  } else if (mainFormat === 'Cash') {
    const rakeOptions = [
      { label: '5%, 4bb cap', value: 'Cash' },
      { label: 'Live 10%, 2bb cap', value: 'CashLive' }
    ];
    
    if (isMobile) {
      // Mobile: Use dropdown for Rake
      const currentRake = state.format === 'Cash' ? 'Cash' : 'CashLive';
      subOptionButtons = '<span class="options-label">Rake:</span> <select class="rake-dropdown" data-type="rake">' + rakeOptions.map(opt => {
        const isSelected = currentRake === opt.value;
        return `<option value="${opt.value}"${isSelected ? ' selected' : ''}>${opt.label}</option>`;
      }).join('') + '</select>';
    } else {
      // Desktop: Use buttons
      subOptionButtons = '<span class="options-label">Rake:</span> ' + rakeOptions.map(opt => {
      let isActive = false;
      if (opt.value === 'Cash') {
        isActive = state.format === 'Cash';
      } else {
        isActive = state.format.startsWith(opt.value);
      }
      return `<button class="changeLink option${isActive ? ' active' : ''}" data-type="rake" data-value="${opt.value}">${opt.label}</button>`;
      }).join(' ');
    }
    if (state.format.startsWith('CashLive')) {
      // Visually group GTO with opening size buttons
      const openSizes = [
        { label: 'GTO', value: 'CashLive' },
        { label: '3x', value: 'CashLive3x' },
        { label: '5x', value: 'CashLive5x' },
        { label: '7x', value: 'CashLive7x' }
      ];
      subOptionButtons += '<span class="options-label">Opening Size:</span> ' + openSizes.map(opt => {
        const isActive = state.format === opt.value;
        return `<button class="changeLink option${isActive ? ' active' : ''}" data-type="format" data-value="${opt.value}">${opt.label}</button>`;
      }).join(' ');
    }
  } else if (mainFormat === 'SNG') {
    // You can add SNG sub-option logic here if needed
  }
  // No subOptionButtons for HU

  // --- STACK SIZE BUTTONS ---
  const stackSet = new Set();
  if (isICM) {
    // For ICM: show all ICM stacks
    available.forEach(entry => {
      const [format, stacks, action] = entry.split('-');
      if (format.startsWith('ICM') && action === state.action && !stacks.includes(',')) {
        stackSet.add(stacks);
      }
    });
  } else {
    // For non-ICM formats: show only stacks for the current sub-format
    available.forEach(entry => {
      const [format, stacks, action] = entry.split('-');
      if (format === state.format && action === state.action && !stacks.includes(',')) {
        stackSet.add(stacks);
      }
    });
  }
  const stackArray = Array.from(stackSet).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''));
    const numB = parseInt(b.replace(/\D/g, ''));
    return numB - numA;
  });
  // Highlight main stack if state.stacks is the main stack or a various stack that starts with it
  const getMainStackActive = (mainStack) => {
    if (state.stacks === mainStack) return true;
    if (state.stacks && state.stacks.startsWith(mainStack + ',')) return true;
    return false;
  };
  const stackButtons = stackArray.map(stacks => {
    const isActive = getMainStackActive(stacks);
    return `<button class="changeLink option${isActive ? ' active' : ''}" data-type="stacks" data-value="${stacks}">${stacks.replace('avg', '').replace('bb', '')}bb</button>`;
  }).join(' ');

  // --- VARIOUS STACK SIZE OPTIONS ---
  let variousStackButtons = '';
  let mainStack = state.stacks ? state.stacks.split(',')[0] : '';
  const isPortrait = window.innerWidth <= 480 && window.matchMedia('(orientation: portrait)').matches;
  if (mainStack && mainStack.startsWith('avg')) {
    const variousOptions = available.filter(entry => {
      const [format, stacks, action] = entry.split('-');
      return (
        format === state.format &&
        action === state.action &&
        stacks.startsWith(mainStack + ',')
      );
    });
    if (variousOptions.length > 0) {
      // Add .active class if the current value matches state.stacks
      const isActive = variousOptions.some(entry => entry.split('-')[1] === state.stacks);
      variousStackButtons = `<select class="format-dropdown various-stacks-dropdown${isActive ? ' active' : ''}" data-type="stacks">` +
        `<option value="__main_avg__"${mainStack === state.stacks ? ' selected' : ''} style="font-style:italic;">Select Stacks</option>` +
        variousOptions.map(entry => {
          const [, stacks] = entry.split('-');
          const isSelected = state.stacks === stacks;
          let label = stacks.replace(mainStack + ',', '');
          return `<option value="${stacks}"${isSelected ? ' selected' : ''}>${label}</option>`;
        }).join('') + '</select>';
    }
  }

  let variousStackLabel = '';
  if (variousStackButtons && variousStackButtons.trim() !== '') {
    variousStackLabel = '<span class="options-label">Various Stack Sizes:</span>';
  }

  // --- BUTTON HANDLING LOGIC (actions.js) ---
  // When a main-format button is clicked, set the default sub-format:
  //   - Cash → CashLive5x
  //   - ICM → ICM100
  //   - SNG/HU → your preferred default
  // When a sub-option is clicked, update state.format accordingly

  // --- RENDER ---
  if (isPortrait && variousStackButtons) {
    // Portrait: Various Stacks on new row as dropdown
    return `
      <div class="options-row">
        <span class="options-label">Format:</span> ${mainFormatButtons}${subOptionButtons}
      </div>
      <div class="options-row">
        <span class="options-label">Average Stacks:</span> ${stackButtons}
      </div>
      <div class="options-row">
        ${variousStackLabel}${variousStackButtons}
      </div>
    `;
  } else {
    // Landscape/desktop: Various Stacks on same row as dropdown
    return `
      <div class="options-row">
        <span class="options-label">Format:</span> ${mainFormatButtons}${subOptionButtons}
      </div>
      <div class="options-row">
        <span class="options-label">Average Stacks:</span> ${stackButtons}${variousStackLabel}${variousStackButtons}
      </div>
    `;
  }
}
