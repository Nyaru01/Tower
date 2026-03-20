export const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

// Analyser for real-time data
export const analyser = audioCtx.createAnalyser();
analyser.fftSize = 256;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// Audio Graph: [Source] -> Analyser -> masterGain -> Destination
analyser.connect(masterGain);

export function setMasterVolume(v: number) {
  masterGain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.05);
}

export type AudioData = {
  energy: number;     // 0-1 overall volume
  bass: number;       // 0-1 low frequencies
  mid: number;        // 0-1 mid frequencies
  high: number;       // 0-1 high frequencies
};

export function getAudioData(): AudioData {
  analyser.getByteFrequencyData(dataArray);
  
  let total = 0;
  let bass = 0;
  let mid = 0;
  let high = 0;

  // With fftSize 256, we have 128 bins. Each bin is ~172Hz at 44.1kHz.
  for (let i = 0; i < bufferLength; i++) {
    const val = dataArray[i] / 255;
    total += val;
    if (i < 4) bass += val;            // 0 - 688Hz (Bass)
    else if (i < 32) mid += val;       // 688Hz - 5.5kHz (Mid)
    else high += val;                  // 5.5kHz+ (High)
  }

  // Normalize by number of bins in each range
  const bVal = (bass / 4);
  const mVal = (mid / 28);
  const hVal = (high / 96);

  // Boost the signal slightly to make it more sensitive
  const sensitivity = 1.4;

  return {
    energy: Math.min(1, (total / bufferLength) * sensitivity),
    bass: Math.min(1, bVal * sensitivity),
    mid: Math.min(1, mVal * sensitivity),
    high: Math.min(1, hVal * sensitivity)
  };
}

export function playKillSound(isBoss: boolean) {
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(masterGain);
  
  if (isBoss) {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500 + Math.random()*300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
}

export function playBuySound() {
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const audio = new Audio('/sounds/Buy_tower.mp3');
  audio.volume = masterGain.gain.value * 0.5;
  audio.play().catch(e => console.warn("Audio play failed:", e));
}

