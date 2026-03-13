export const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);

export function setMasterVolume(v: number) {
  masterGain.gain.setTargetAtTime(v, audioCtx.currentTime, 0.05);
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
