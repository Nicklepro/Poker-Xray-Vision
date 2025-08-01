export const state = {
  format: 'ICM100',
  stacks: 'avg100bb',
  action: 'RFI',
  // Add more as needed
};

export function parseHash() {
  const hash = window.location.hash.slice(1);
  const [format, stacks, action] = hash.split('-');
  
  console.log(`[State] Parsing hash: "${hash}" -> format: "${format}", stacks: "${stacks}", action: "${action}"`);
  
  // Check if we have a complete hash
  if (!format || !stacks || !action) {
    // Set default values
    state.format = 'ICM100';
    state.stacks = 'avg100bb';
    state.action = 'RFI';
    
    console.log(`[State] Incomplete hash, using defaults: ${state.format}-${state.stacks}-${state.action}`);
    
    // Set the default hash if it's missing or incomplete
    if (!hash || hash.split('-').length < 3) {
      window.location.hash = 'ICM100-avg100bb-RFI';
    }
  } else {
    // We have a complete hash, use the parsed values
  state.format = format;
  state.stacks = stacks;
  state.action = action;
    console.log(`[State] Complete hash parsed: ${state.format}-${state.stacks}-${state.action}`);
  }
}

export function setHash(format, stacks, action) {
  window.location.hash = `${format}-${stacks}-${action}`;
}
