import { X, Volume2, VolumeX, Monitor } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  settings: {
    volume: number;
    effects: boolean;
    bloom: boolean;
  };
  onUpdate: (newSettings: any) => void;
}

export default function SettingsModal({ onClose, settings, onUpdate }: SettingsModalProps) {
  return (
    <div className="absolute inset-0 z-[100] bg-[#040810]/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="w-full max-w-[320px] bg-[#0b0a16] border border-[#00f5c4]/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(0,245,196,0.1)] relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-white font-black text-2xl tracking-tighter mb-8 flex items-center gap-3">
          <Monitor className="text-[#00f5c4]" /> CONFIGURATION
        </h2>

        <div className="flex flex-col gap-8">
          {/* Volume */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[10px] items-center text-white/50 mf tracking-widest font-bold">
              <span className="flex items-center gap-2 uppercase">
                {settings.volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />} Audio master
              </span>
              <span>{Math.round(settings.volume * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" value={settings.volume}
              onChange={(e) => onUpdate({ ...settings, volume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00f5c4]"
            />
          </div>

          {/* Effects Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold tracking-tight">Effets Particules</span>
              <span className="text-white/30 text-[9px] mf uppercase tracking-wider">Impact sur les perfs</span>
            </div>
            <button 
              onClick={() => onUpdate({ ...settings, effects: !settings.effects })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.effects ? 'bg-[#00f5c4]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.effects ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Bloom Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white text-sm font-bold tracking-tight">Glow & Bloom</span>
              <span className="text-white/30 text-[9px] mf uppercase tracking-wider">Atmosphère néon</span>
            </div>
            <button 
              onClick={() => onUpdate({ ...settings, bloom: !settings.bloom })}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.bloom ? 'bg-[#3fbdf8]' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.bloom ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="mt-10 w-full py-4 bg-[#00f5c4]/10 border border-[#00f5c4]/40 text-[#00f5c4] font-black text-sm tracking-[0.3em] rounded-xl hover:bg-[#00f5c4]/20 transition-all uppercase"
        >
          CONFIRMER
        </button>
      </div>
    </div>
  );
}
