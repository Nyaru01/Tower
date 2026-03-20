import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Info, MousePointer2, Rocket } from 'lucide-react';

interface TutorialOverlayProps {
  step: number;
  onNext: () => void;
  targetRect?: { x: number; y: number; w: number; h: number } | null;
}

const STEPS = [
  {
    title: "BIENVENUE COMMANDANT",
    text: "Le Secteur Alpha est sous menace imminente. Suivez ce guide pour établir notre périmètre de défense.",
    icon: Rocket,
    button: "COMMENCER",
    position: "center"
  },
  {
    title: "ANCRES DE CONSTRUCTION",
    text: "Ces zones en pointillés sont des emplacements tactiques. Appuyez sur l'une d'elles pour choisir une tour.",
    icon: MousePointer2,
    position: "target"
  },
  {
    title: "CENTRE DE DÉPLOIEMENT",
    text: "Ici, vous pouvez acheter des tours avec vos DIAMANTS (♦). Choisissez un Canon pour commencer.",
    icon: Info,
    position: "bottom"
  },
  {
    title: "LANCEMENT DU COMBAT",
    text: "EXCELLENT. Nos défenses sont prêtes. Appuyez sur GO pour engager les vagues ennemies.",
    icon: Rocket,
    button: "COMPRIS",
    position: "bottom-right"
  }
];

export default function TutorialOverlay({ step, onNext, targetRect }: TutorialOverlayProps) {
  const current = STEPS[step];
  if (!current) return null;

  const Icon = current.icon;

  const getPositionStyles = () => {
    switch (current.position) {
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "bottom":
        return "bottom-32 left-1/2 -translate-x-1/2";
      case "bottom-right":
        return "bottom-24 right-4";
      case "target":
        if (targetRect) {
          return ""; // Handled by absolute coords below
        }
        return "top-1/3 left-1/2 -translate-x-1/2";
      default:
        return "top-1/2 left-1/2 -translate-x-1/2";
    }
  };

  return (
    <div className="absolute inset-0 z-[2000] pointer-events-none overflow-hidden h-[100dvh]">
      {/* Dimmed Background with Hole if targetRect exists */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70"
        style={{
          clipPath: targetRect ? `polygon(0% 0%, 0% 100%, ${targetRect.x}px 100%, ${targetRect.x}px ${targetRect.y}px, ${targetRect.x + targetRect.w}px ${targetRect.y}px, ${targetRect.x + targetRect.w}px ${targetRect.y + targetRect.h}px, ${targetRect.x}px ${targetRect.y + targetRect.h}px, ${targetRect.x}px 100%, 100% 100%, 100% 0%)` : 'none'
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className={`absolute w-[280px] ${getPositionStyles()} ${current.button ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={current.position === "target" && targetRect ? {
            top: targetRect.y + targetRect.h + 20,
            left: Math.max(20, Math.min(window.innerWidth - 300, targetRect.x + targetRect.w / 2 - 140))
          } : {}}
        >
          <div className="relative p-5 rounded-2xl bg-[#171626] border-2 border-[#00f5c4]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Holographic scanner effect removed */}
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#00f5c4]/10 flex items-center justify-center border border-[#00f5c4]/20">
                <Icon size={18} className="text-[#00f5c4]" />
              </div>
              <h3 className="gf text-[#00f5c4] font-black text-xs tracking-widest uppercase">{current.title}</h3>
            </div>

            <p className="tf text-white/70 text-[11px] leading-relaxed mb-4 font-medium">
              {current.text}
            </p>

            {current.button && (
              <button 
                onClick={onNext}
                className="w-full py-2.5 bg-[#00f5c4] text-[#0b0a16] font-black text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-[#00f5c4]/90 active:scale-95 transition-all shadow-[0_5px_15px_rgba(0,245,196,0.3)]"
              >
                {current.button}
                <ChevronRight size={14} />
              </button>
            )}

            {/* Pointer Arrow for target position */}
            {current.position === "target" && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-bottom-[10px] border-bottom-[#00f5c4]/30" />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan { animation: scan 3s linear infinite; }
      `}</style>
    </div>
  );
}
