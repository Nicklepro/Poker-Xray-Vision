import { resetProgressiveLoading } from './loader.js';
import { getLabelAndImage } from '../logic/imageLogic.js';

export function renderGrid(state, available, labels) {
  // Define the layouts
  const landscapeOrder = [
    ['1.EP', '2.MP', '3.LJ', '4.HJ'],
    ['8.BB', '7.SB', '6.BU', '5.CO']
  ];
  const portraitOrder = [
    ['1.EP', '2.MP'],
    ['8.BB', '3.LJ'],
    ['7.SB', '4.HJ'],
    ['6.BU', '5.CO']
  ];

  // Use CSS media queries for responsive design, with JS as fallback
  const isPortrait = window.matchMedia('(orientation: portrait)').matches || window.innerWidth < window.innerHeight;
  const layout = isPortrait ? portraitOrder : landscapeOrder;

  // For various stacks, assign the correct stack size to each cell
  let stackArray = null;
  if (state.stacks && state.stacks.includes(',')) {
    stackArray = state.stacks.replace(/^avg/, '').split(',').slice(1);
  }

  // Create a grid container
  const grid = document.createElement('div');
  grid.className = 'poker-grid';

  // Flatten the layout for grid rendering
  const flatLabels = layout.flat();
  flatLabels.forEach((label, index) => {
    let cellStack = state.stacks || '';
    if (stackArray) {
      const idx = labels.indexOf(label);
      cellStack = stackArray[idx] ? stackArray[idx] + 'bb' : '';
    } else if (state.stacks) {
      cellStack = state.stacks.replace(/^avg/, '');
    }
    

    
    // Create grid cell
    const seatIndex = labels.indexOf(label); // Use original seat order
    const cell = document.createElement('div');
    cell.className = 'grid-cell cell-clickable cell-pos-' + (seatIndex + 1); // Add position class based on seat
    cell.id = `cell-${label.replace('.', '-')}`;
    
    // Make main grid cells clickable (1-7, not BB)
    if (label.match(/^[1-7]\./) || (label === '8.BB' && state.action !== 'RFI')) {
      cell.classList.add('cell-clickable');
      cell.tabIndex = 0; // for keyboard accessibility
    }
    
    // --- Universal yellow highlight for actions ending in .<pos> ---
    let highlightPos = null;
    if (state.action) {
      // 3bet.vs.<pos>, 4bet.<rfi>.vs.<pos>, Allin.<pos>, Call.<pos>
      if (state.action.startsWith('3bet.vs.')) {
        highlightPos = state.action.split('.')[2];
      } else if (state.action.startsWith('4bet.')) {
        const parts = state.action.split('.');
        if (parts.length === 4 && parts[2] === 'vs') highlightPos = parts[3];
      } else if (state.action.startsWith('Allin.') || state.action.startsWith('Call.')) {
        highlightPos = state.action.split('.')[1];
      }
    }
    if (highlightPos && label.endsWith('.' + highlightPos)) {
      cell.classList.add('self-highlight');
    }
    
    // --- Explicit label and image logic for all modes (RFI, 3bet, 4bet, Call, Allin) ---
    // Use shared getLabelAndImage
    const { label: cellLabel, image: cellImage } = getLabelAndImage(state, label, labels);
    const alt = `${label} ${cellLabel} ${cellStack}`;
    
    // Debug logging for final assignments
    console.log(`[DEBUG] Final assignments for ${label}:`, { cellLabel, cellImage, alt });
    
    // Add label
    const labelContainer = document.createElement('div');
    labelContainer.className = 'label-container';

    // --- Add Allin/Call button(s) in RFI mode if available ---
    const cellPos = label.split('.')[1];
    let allinBtn = null;
    let callBtn = null;
    if (state.action === 'RFI') {
      const allinState = `${state.format}-${state.stacks}-Allin.${cellPos}`;
      if (available.includes(allinState)) {
        allinBtn = document.createElement('button');
        allinBtn.className = 'action-btn action-btn-allin align-allin';
        allinBtn.textContent = 'Allin';
        // No inline or direct event handler
      }
      const callState = `${state.format}-${state.stacks}-Call.${cellPos}`;
      if (available.includes(callState)) {
        callBtn = document.createElement('button');
        callBtn.className = 'action-btn action-btn-call align-call';
        callBtn.textContent = 'Call';
        // No inline or direct event handler
      }
    }
    // --- New: Use three flex children for perfect centering ---
    const leftSide = document.createElement('div');
    leftSide.className = 'label-side left';
    if (allinBtn) leftSide.appendChild(allinBtn);
    const rightSide = document.createElement('div');
    rightSide.className = 'label-side right';
    if (callBtn) rightSide.appendChild(callBtn);
    const labelSpan = document.createElement('span');
    labelSpan.className = 'cell-label';
    labelSpan.textContent = `${label} ${cellLabel} ${cellStack}`;
    labelSpan.style.background = 'transparent';
    // Apply smaller text class only for 4bet.SQZ labels
    if (state.action && state.action.startsWith('4bet.')) {
      if (cellLabel.includes('4bet.SQZ.vs.')) {
        labelSpan.classList.add('very-small-text');
      }
    }
    labelContainer.appendChild(leftSide);
    labelContainer.appendChild(labelSpan);
    labelContainer.appendChild(rightSide);
    
    // Add image
    const img = document.createElement('img');
    img.id = `image${labels.indexOf(label) + 1}`;
    img.alt = alt;
    img.src = cellImage;
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.style.margin = '0';
    img.style.padding = '0';
    img.style.objectFit = 'contain';
    img.style.position = 'relative';
    img.style.zIndex = '1';
    img.style.boxSizing = 'border-box';
    img.dataset.labelContainerId = `label-container-${labels.indexOf(label) + 1}`;
    labelContainer.id = `label-container-${labels.indexOf(label) + 1}`;
    // Add .cell-glow overlay for future highlight effect
    const glow = document.createElement('div');
    glow.className = 'cell-glow';
    // Add outside glow overlay for hover effect
    const outsideGlow = document.createElement('div');
    outsideGlow.className = 'outside-glow';
    // Add inside glow overlay for self-highlight
    const insideGlow = document.createElement('div');
    insideGlow.className = 'inside-glow';
    // Compose cell
    cell.appendChild(labelContainer);
    cell.appendChild(img);
    cell.appendChild(glow);
    cell.appendChild(outsideGlow);
    cell.appendChild(insideGlow);
    grid.appendChild(cell);
  });

  // Reset progressive loading before starting
  resetProgressiveLoading();

  // Add event listeners for hover/focus/active to toggle .active on .cell-glow
  setTimeout(() => {
    document.querySelectorAll('.cell-clickable').forEach(cell => {
      const glow = cell.querySelector('.cell-glow');
      if (!glow) return;
      cell.addEventListener('mouseenter', () => {
        glow.classList.add('active');
      });
      cell.addEventListener('mouseleave', () => {
        glow.classList.remove('active');
      });
      cell.addEventListener('focus', () => glow.classList.add('active'));
      cell.addEventListener('blur', () => glow.classList.remove('active'));
      cell.addEventListener('mousedown', () => glow.classList.add('active'));
      cell.addEventListener('mouseup', () => glow.classList.remove('active'));
      // Add click handler for action change
      cell.addEventListener('click', (event) => {
        // Ignore if the click was on a button inside the cell
        if (event.target.closest('button')) return;
        const label = cell.id.replace('cell-', '').replace('-', '.');
        const cellPos = label.split('.')[1];
        // --- Universal go-back logic for highlighted cell ---
        let goBack = false;
        if (state.action) {
          if (state.action.startsWith('3bet.vs.')) {
            const pos = state.action.split('.')[2];
            if (cellPos === pos) goBack = true;
          } else if (state.action.startsWith('4bet.')) {
            const parts = state.action.split('.');
            if (parts.length === 4 && parts[2] === 'vs' && cellPos === parts[3]) goBack = true;
          } else if (state.action.startsWith('Allin.') || state.action.startsWith('Call.')) {
            const pos = state.action.split('.')[1];
            if (cellPos === pos) goBack = true;
          }
        }
        if (goBack) {
          // Go back to previous state
          if (state.action.startsWith('3bet.vs.')) {
            window.location.hash = `${state.format}-${state.stacks}-RFI`;
          } else if (state.action.startsWith('4bet.')) {
            const rfiPos = state.action.split('.')[1];
            window.location.hash = `${state.format}-${state.stacks}-3bet.vs.${rfiPos}`;
          } else if (state.action.startsWith('Allin.') || state.action.startsWith('Call.')) {
            window.location.hash = `${state.format}-${state.stacks}-RFI`;
          }
          return;
        }
        if (state.action === 'RFI') {
          // RFI mode: clicking on a position creates a 3bet.vs.<position> action
          if (label.match(/^[1-7]\./)) {
            const pos = label.split('.')[1];
            const newAction = `3bet.vs.${pos}`;
            window.location.hash = `${state.format}-${state.stacks}-${newAction}`;
          }
        } else if (state.action && state.action.startsWith('3bet.vs.')) {
          // 3bet mode: handle different click scenarios
          const threeBetPos = state.action.replace('3bet.vs.', '');
          const clickedPos = label.split('.')[1];
          const clickedIdx = labels.findIndex(l => l === label);
          const threeBetIdx = labels.findIndex(l => l.endsWith('.' + threeBetPos));
          if (clickedIdx === threeBetIdx) {
            // Clicking on the highlighted RFI position goes back to RFI
            window.location.hash = `${state.format}-${state.stacks}-RFI`;
          } else if (clickedIdx < threeBetIdx) {
            // Clicking on a position before the RFI (with Fold images) goes to their 3bet.vs.<clicked> state
            if (label.match(/^[1-7]\./)) {
              const newAction = `3bet.vs.${clickedPos}`;
              window.location.hash = `${state.format}-${state.stacks}-${newAction}`;
            }
          } else if (clickedIdx > threeBetIdx) {
            // Clicking on a position after the RFI goes to 4bet.<RFI>.vs.<clicked> state
            if (label.match(/^[1-7]\./)) {
              const newAction = `4bet.${threeBetPos}.vs.${clickedPos}`;
              // Check if this 4bet action exists in available charts
              const chartExists = available.includes(`${state.format}-${state.stacks}-${newAction}`);
              if (chartExists) {
                window.location.hash = `${state.format}-${state.stacks}-${newAction}`;
              } else {
                console.log(`[Grid] 4bet chart not available: ${state.format}-${state.stacks}-${newAction}`);
                // Could add a fallback or user notification here
              }
            }
          }
        } else if (state.action && state.action.startsWith('4bet.')) {
          // 4bet mode: handle different click scenarios
          // Parse "4bet.LJ.vs.BU" -> rfiPos = "LJ", threeBetPos = "BU"
          const actionParts = state.action.split('.');
          const rfiPos = actionParts[1]; // "LJ"
          const threeBetPos = actionParts[3]; // "BU" (index 3, not splitting vsParts)
          const clickedPos = label.split('.')[1];
          const clickedIdx = labels.findIndex(l => l === label);
          const rfiIdx = labels.findIndex(l => l.endsWith('.' + rfiPos));
          const threeBetIdx = labels.findIndex(l => l.endsWith('.' + threeBetPos));
          if (clickedIdx === rfiIdx) {
            // Clicking on the RFI position (3.LJ) - no action, stays in current state
            console.log(`[Grid] RFI position clicked in 4bet mode - no navigation`);
          } else if (clickedIdx === threeBetIdx) {
            // Clicking on the 3-bettor position (6.BU) goes to 3bet.vs.<RFI> state
            const newAction = `3bet.vs.${rfiPos}`;
            window.location.hash = `${state.format}-${state.stacks}-${newAction}`;
          } else if (clickedIdx < rfiIdx) {
            // Clicking on a position before the RFI (with Fold images) goes to their 3bet.vs.<clicked> state
            if (label.match(/^[1-7]\./)) {
              const newAction = `3bet.vs.${clickedPos}`;
              window.location.hash = `${state.format}-${state.stacks}-${newAction}`;
            }
          } else if (clickedIdx > rfiIdx && clickedIdx < threeBetIdx) {
            // Clicking on positions between RFI and 3-bettor (4.HJ, 5.CO) goes to 4bet.<RFI>.vs.<clicked>
            if (label.match(/^[1-7]\./)) {
              const newAction = `4bet.${rfiPos}.vs.${clickedPos}`;
              // Check if this 4bet action exists in available charts
              const chartExists = available.includes(`${state.format}-${state.stacks}-${newAction}`);
              if (chartExists) {
                window.location.hash = `${state.format}-${state.stacks}-${newAction}`;
              } else {
                console.log(`[Grid] 4bet chart not available: ${state.format}-${state.stacks}-${newAction}`);
              }
            }
          } else if (clickedIdx > threeBetIdx) {
            // Clicking on positions after 3-bettor does nothing (will implement red glow later)
            console.log(`[Grid] 4bet squeeze position clicked: ${label} - no action yet`);
          }
        }
      });
    });
  }, 0);

  // After grid.outerHTML is set, add event delegation for .action-btn
  setTimeout(() => {
    const gridEl = document.querySelector('.poker-grid');
    if (gridEl) {
      gridEl.addEventListener('click', function(event) {
        const btn = event.target.closest('.action-btn');
        if (!btn) return;
        event.stopPropagation();
        const cell = btn.closest('.grid-cell');
        if (!cell) return;
        const label = cell.id.replace('cell-', '').replace('-', '.');
        const cellPos = label.split('.')[1];
        if (btn.classList.contains('action-btn-allin')) {
          const newHash = `${state.format}-${state.stacks}-Allin.${cellPos}`;
          console.debug('[Allin Button] Delegated Click', { newHash, currentHash: window.location.hash });
          if (window.location.hash.slice(1) !== newHash) {
            window.location.hash = newHash;
          } else {
            import('../logic/state.js').then(({ parseHash, state: globalState }) => {
              parseHash();
              import('../ui/render.js').then(({ renderApp }) => {
                renderApp(globalState);
              });
            });
          }
        } else if (btn.classList.contains('action-btn-call')) {
          const newHash = `${state.format}-${state.stacks}-Call.${cellPos}`;
          console.debug('[Call Button] Delegated Click', { newHash, currentHash: window.location.hash });
          if (window.location.hash.slice(1) !== newHash) {
            window.location.hash = newHash;
          } else {
            import('../logic/state.js').then(({ parseHash, state: globalState }) => {
              parseHash();
              import('../ui/render.js').then(({ renderApp }) => {
                renderApp(globalState);
              });
            });
          }
        }
      });
    }
  }, 0);

  return grid.outerHTML;
}