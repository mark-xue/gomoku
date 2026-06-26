/**
 * Web Audio API sound effects for Gomoku.
 * No external audio files needed - generates sounds programmatically.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch {
    // Silently fail if audio not available
  }
}

export function playPlaceSound() {
  // Soft wood-like thud
  playTone(120, 0.15, 'sine', 0.25);
  // Subtle high-frequency click
  setTimeout(() => playTone(800, 0.05, 'square', 0.08), 10);
}

export function playCaptureSound() {
  // More pronounced placement
  playTone(150, 0.2, 'sine', 0.3);
  setTimeout(() => playTone(600, 0.08, 'square', 0.1), 15);
}

export function playWinSound() {
  // Ascending victory chime
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.25), i * 150);
  });
  // Add a triumphant chord at the end
  setTimeout(() => {
    playTone(523, 0.8, 'triangle', 0.15);
    playTone(659, 0.8, 'triangle', 0.15);
    playTone(784, 0.8, 'triangle', 0.15);
  }, 600);
}

export function playLoseSound() {
  // Descending sad tone
  const notes = [784, 659, 523, 392]; // G5, E5, C5, G4
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.4, 'sine', 0.2), i * 200);
  });
}

export function playDrawSound() {
  // Neutral flat tone
  playTone(440, 0.3, 'triangle', 0.2);
  setTimeout(() => playTone(440, 0.3, 'triangle', 0.2), 400);
}

export function playInvalidSound() {
  // Error buzz
  playTone(100, 0.15, 'sawtooth', 0.15);
  setTimeout(() => playTone(60, 0.15, 'sawtooth', 0.15), 100);
}

export function playButtonSound() {
  // UI click
  playTone(500, 0.08, 'square', 0.1);
}

export function playStartSound() {
  // Game start fanfare
  const notes = [392, 523, 659]; // G4, C5, E5
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 100);
  });
}

export function playUndoSound() {
  // Reverse whoosh
  playTone(300, 0.1, 'triangle', 0.1);
  setTimeout(() => playTone(200, 0.1, 'triangle', 0.1), 80);
}
