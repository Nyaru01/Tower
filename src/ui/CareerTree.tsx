import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Lock, 
  Play, 
  Target,
  ChevronLeft
} from 'lucide-react';

// Données des niveaux (étendues à 10 pour le design)
const LEVEL_META: Record<number, { label: string, desc: string }> = {
  1: { label: "Secteur Alpha", desc: "Introduction aux mécaniques de base. Sécurisez le périmètre d'entrée." },
  2: { label: "Pont d'Accès", desc: "Premier affrontement tactique. Défendez le goulot d'étranglement." },
  3: { label: "Noyau Énergétique", desc: "Gestion des ressources avancée. Protection des générateurs." },
  4: { label: "Zone Industrielle", desc: "Défense d'un complexe de production automatisé." },
  5: { label: "Forteresse Delta", desc: "Infiltration et siège de la forteresse ennemie." },
  6: { label: "Réseau Urbain", desc: "Combat rapproché dans les ruines de la cité." },
  7: { label: "Frontière Finale", desc: "L'ultime rempart avant le centre de commandement." },
  8: { label: "Vortex Néon", desc: "Conditions atmosphériques instables. Visibilité réduite." },
  9: { label: "Porte du Vide", desc: "Dernière ligne de défense. Toutes les unités sont mobilisées." },
  10: { label: "Centre de Contrôle", desc: "Neutralisation de l'IA centrale Overlord." },
};

interface CareerTreeProps {
  maxLevelUnlocked: number;
  onSelectLevel: (lvl: number) => void;
  onClose: () => void;
}

export default function CareerTree({ maxLevelUnlocked, onSelectLevel, onClose }: CareerTreeProps) {
  const [selectedLvl, setSelectedLvl] = useState<number>(Math.min(maxLevelUnlocked, 10));
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(`level-${selectedLvl}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const levels = Array.from({ length: 10 }, (_, i) => {
    const lvl = i + 1;
    let status: 'completed' | 'current' | 'locked' = 'locked';
    if (lvl < maxLevelUnlocked) status = 'completed';
    else if (lvl === maxLevelUnlocked) status = 'current';
    
    return {
      id: lvl,
      label: LEVEL_META[lvl]?.label || `NIVEAU ${lvl}`,
      desc: LEVEL_META[lvl]?.desc || "Données de mission confidentielles.",
      status
    };
  });

  const selected = levels.find(l => l.id === selectedLvl) || levels[0];

  return (
    <div className="fixed inset-0 bg-[#040810]/95 text-white font-sans overflow-hidden flex flex-col z-[150] backdrop-blur-xl">
      
      {/* Header Tactique */}
      <div className="px-6 py-5 border-b border-white/5 bg-black/40 backdrop-blur-md z-20 flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 group text-zinc-500 hover:text-[#00f5c4] transition-all"
          >
            <div className="w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center group-hover:border-[#00f5c4]/30 group-active:scale-90 transition-all">
              <ChevronLeft size={18} />
            </div>
            <span className="mf text-[10px] font-black tracking-[0.2em] uppercase">Retour</span>
          </button>
          
          <div className="text-right">
            <h1 className="text-sm font-black tracking-[0.2em] uppercase text-[#00f5c4] truncate max-w-[200px] sm:max-w-none">Progression_Carrière</h1>
            <p className="mf text-zinc-500 text-[7px] uppercase tracking-[0.3em] mt-1">Secteur / Unité_01</p>
          </div>
        </div>
      </div>

      {/* Zone de l'Arbre Vertical */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative py-16 px-4 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {/* Background Decor (Grille) */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#00f5c4 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative w-full max-w-xs mx-auto flex flex-col items-center gap-16">
          
          {/* Ligne de connexion verticale (fond) */}
          <div className="absolute top-0 bottom-0 w-[1px] bg-white/10 left-1/2 -translate-x-1/2" />

          {/* Rendu des niveaux */}
          {levels.map((level, index) => {
            const isLast = index === levels.length - 1;
            const isSelected = selected.id === level.id;
            
            return (
              <div key={level.id} className="relative z-10 flex flex-col items-center w-full">
                
                {/* Ligne de progression active (entre les noeuds) */}
                {!isLast && (level.status === "completed" || level.status === "current") && levels[index + 1].status !== "locked" && (
                  <div className="absolute top-full h-16 w-[2px] bg-[#00f5c4] shadow-[0_0_15px_#00f5c4]" />
                )}

                {/* Bulle de Niveau */}
                <motion.button
                  id={`level-${level.id}`}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => level.status !== "locked" && setSelectedLvl(level.id)}
                  className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center border-2 transition-all duration-300 transform rotate-45 group
                    ${level.status === "completed" ? 'bg-[#00f5c4]/10 border-[#00f5c4] text-[#00f5c4]' : 
                      level.status === "current" ? 'bg-white border-white text-black shadow-[0_0_30px_white]' : 
                      'bg-zinc-900/50 border-white/5 text-zinc-700'}
                    ${isSelected ? 'ring-8 ring-[#00f5c4]/10 border-white' : ''}
                  `}
                >
                  <div className="-rotate-45">
                    {level.status === "completed" ? <Trophy size={24} /> : 
                     level.status === "locked" ? <Lock size={20} /> : <Target size={26} className="animate-pulse" />}
                  </div>
                </motion.button>

                {/* Label */}
                <div className="mt-8 flex flex-col items-center">
                  <span className={`mf text-[9px] font-black tracking-[0.2em] uppercase transition-colors
                    ${level.status === "locked" ? 'text-zinc-700' : 'text-zinc-400'}
                    ${isSelected ? 'text-white text-glow' : ''}
                  `}>
                    {level.label}
                  </span>
                  {isSelected && (
                    <motion.div layoutId="indicator" className="mt-2 w-1.5 h-1.5 bg-[#00f5c4] rounded-full shadow-[0_0_10px_#00f5c4]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panneau de détails contextuel */}
      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="p-10 bg-[#080c14] border-t border-white/10 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-30"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="mf text-[8px] font-bold text-[#00f5c4] tracking-[0.3em] uppercase mb-2">Secteur_{selected.id.toString().padStart(2, '0')}</div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">{selected.label}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className={`w-2 h-2 rounded-full ${selected.status === 'completed' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : selected.status === 'current' ? 'bg-[#00f5c4] animate-pulse shadow-[0_0_8px_#00f5c4]' : 'bg-zinc-800'}`} />
                  <span className="mf text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    {selected.status === 'completed' ? 'Opération terminée' : selected.status === 'current' ? 'Prêt pour déploiement' : 'Accès refusé / Verrouillé'}
                  </span>
                </div>
              </div>
            </div>

            <p className="tf text-zinc-400 text-[13px] mb-10 leading-relaxed font-medium max-w-md opacity-80">
              {selected.desc}
            </p>

            {selected.status !== 'locked' ? (
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectLevel(selected.id)}
                className="w-full py-5 bg-[#00f5c4] hover:bg-[#00e0b4] text-black font-black tracking-[0.2em] rounded-xl flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(0,245,196,0.15)] transition-all group"
              >
                <Play size={18} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                DÉMARRER LA MISSION
              </motion.button>
            ) : (
              <div className="w-full py-6 bg-zinc-900 text-zinc-600 font-black tracking-[0.3em] rounded-2xl flex items-center justify-center gap-4 border border-white/5 cursor-not-allowed">
                <Lock size={20} />
                MISSION VERROUILLÉE
              </div>
            )}
            
            <div className="mt-6 flex justify-center">
               <div className="mf text-[7px] text-zinc-600 uppercase tracking-[0.5em]">Antigravity_Tactical_Link_Active</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
