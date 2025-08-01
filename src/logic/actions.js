import { state, setHash } from './state.js';
import { available } from '../data/charts.js';

// Global flag to prevent multiple event listener setup
let actionsInitialized = false;

export function setupActions() {
  // Only set up event listeners once
  if (actionsInitialized) {
    return;
  }
  actionsInitialized = true;
  
  console.log('[Actions] Setting up event listeners (one-time setup)');
  
  // Handle dropdown changes
  document.getElementById('app').addEventListener('change', (e) => {
    if (e.target.classList.contains('format-dropdown')) {
      const value = e.target.value;
      const dataType = e.target.getAttribute('data-type');
      if (dataType === 'main-format') {
        // Set default sub-format for each main format
        let newFormat = value;
        if (value === 'Cash') newFormat = 'CashLive5x';
        else if (value === 'ICM') newFormat = 'ICM100';
        else if (value === 'SNG') newFormat = 'SNG6.6';
        else if (value === 'HU') newFormat = 'HU';
        setHash(newFormat, state.stacks, state.action);
      } else if (dataType === 'stacks') {
        // If dummy option selected, go to main avg stack
        if (value === '__main_avg__') {
          const mainStack = state.stacks ? state.stacks.split(',')[0] : '';
          setHash(state.format, mainStack, state.action);
        } else {
          setHash(state.format, value, state.action);
        }
      }
    } else if (e.target.classList.contains('rake-dropdown')) {
      const value = e.target.value;
      // Set default format for rake type
      let newFormat = value;
      setHash(newFormat, state.stacks, state.action);
    }
  });

  // Handle clicking the dropdown to re-select the same value (use mousedown for better reliability)
  document.getElementById('app').addEventListener('mousedown', (e) => {
    if (
      e.target.classList.contains('format-dropdown') &&
      e.target.getAttribute('data-type') === 'stacks'
    ) {
      const value = e.target.value;
      if (value === state.stacks) {
        setTimeout(() => {
          setHash(state.format, value, state.action);
        }, 150); // Wait for dropdown to close
      }
    }
  });

  document.getElementById('app').addEventListener('click', (e) => {
    if (e.target.classList.contains('option')) {
      const { type, value } = e.target.dataset;
      if (type === 'main-format') {
        // Set default sub-format for each main format
        let newFormat = value;
        if (value === 'Cash') newFormat = 'CashLive';
        else if (value === 'ICM') newFormat = 'ICM100';
        else if (value === 'SNG') newFormat = 'SNG6.6';
        else if (value === 'HU') newFormat = 'HU';
        setHash(newFormat, state.stacks, state.action);
      } else if (type === 'rake') {
        // Set default format for rake type
        let newFormat = value;
        setHash(newFormat, state.stacks, state.action);
      } else if (type === 'format') {
        if (value.startsWith('ICM')) {
          const exists = available.some(entry => {
            const [format, stacks, action] = entry.split('-');
            return format === value && stacks === state.stacks && action === state.action;
          });
          if (exists) {
            setHash(value, state.stacks, state.action);
          } else {
            // Directional fallback
            const currentICM = parseInt(state.format.replace('ICM', ''));
            const targetICM = parseInt(value.replace('ICM', ''));
            // Get all stacks for the target ICM and current action
            const stacksForTarget = available
              .filter(entry => {
                const [format, stacks, action] = entry.split('-');
                return format === value && action === state.action;
              })
              .map(entry => entry.split('-')[1])
              .map(s => parseInt(s.replace(/\D/g, '')))
              .filter(n => !isNaN(n));
            if (stacksForTarget.length > 0) {
              let chosenStack;
              const currentStackNum = parseInt(state.stacks.replace(/\D/g, ''));
              if (targetICM > currentICM) {
                // Moving up: pick the next higher or equal stack, or the lowest if none
                const higher = stacksForTarget.filter(n => n >= currentStackNum).sort((a, b) => a - b);
                chosenStack = higher.length ? higher[0] : Math.min(...stacksForTarget);
              } else {
                // Moving down: pick the next lower or equal stack, or the highest if none
                const lower = stacksForTarget.filter(n => n <= currentStackNum).sort((a, b) => b - a);
                chosenStack = lower.length ? lower[0] : Math.max(...stacksForTarget);
              }
              // Find the full stack string in available (in case it's a various stack)
              const match = available.find(entry => {
                const [format, stacks, action] = entry.split('-');
                return format === value && action === state.action && parseInt(stacks.replace(/\D/g, '')) === chosenStack;
              });
              if (match) {
                const [, stacks] = match.split('-');
                setHash(value, stacks, state.action);
              }
            }
          }
        } else {
          setHash(value, state.stacks, state.action);
        }
      } else if (type === 'stacks') {
        const mainFormat = ['Cash', 'ICM', 'SNG', 'HU'].find(f => state.format.startsWith(f)) || 'Cash';
        
        if (mainFormat === 'ICM') {
          // For ICM format: allow automatic format switching (ICM100 -> ICM50, etc.)
          const exists = available.some(entry => {
            const [format, stacks, action] = entry.split('-');
            return format === state.format && stacks === value && action === state.action;
          });
          if (exists) {
            setHash(state.format, value, state.action);
          } else {
            // Find the first ICM format that supports this stack size and action
            const match = available.find(entry => {
              const [format, stacks, action] = entry.split('-');
              return format.startsWith('ICM') && stacks === value && action === state.action;
            });
            if (match) {
              const [format] = match.split('-');
              setHash(format, value, state.action);
            }
          }
        } else {
          // For non-ICM formats (Cash, SNG, HU): only change stacks, never change format
          const exists = available.some(entry => {
            const [format, stacks, action] = entry.split('-');
            return format === state.format && stacks === value && action === state.action;
          });
          if (exists) {
            setHash(state.format, value, state.action);
          } else {
            // If the exact combination doesn't exist, don't change anything
            // This prevents unwanted format changes for Cash/SNG/HU
            console.log(`[Actions] Stack combination not available: ${state.format}-${value}-${state.action}`);
          }
        }
      }
    }
  });
} 