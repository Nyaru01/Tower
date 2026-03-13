import { useEffect, useRef, useState } from 'react';
import { X, ShieldAlert, Database, Layers, Settings } from 'lucide-react';

interface MainMenuProps {
  onPlay: () => void;
  onSelectLevel: (lvl: number) => void;
  maxLevelUnlocked: number;
  currentLevel: number;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
}

const ENEMIES = [
  { id: 'normal', name: 'Ennemi Normal', type: 'Standard', hp: 'Moyen', speed: 'Moyenne', color: '#ff4d6d', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ), desc: "L'unité de base. Stable et prévisible, elle constitue la majorité des vagues entrantes.", counter: "Canon / Rapide" },
  { id: 'fast', name: 'Ennemi Rapide', type: 'Véloce', hp: 'Faible', speed: 'Très Rapide', color: '#fbbf24', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" strokeWidth="2"/>
      <path d="M12 7l3 6H9l3-6z" fill="currentColor" stroke="none" />
    </svg>
  ), desc: "Une version optimisée pour la vitesse. Son triangle interne lui permet de transiter plus rapidement.", counter: "Givrant / Tesla" },
  { id: 'tank', name: 'Ennemi Blindé', type: 'Lourd', hp: 'Élevé', speed: 'Lent', color: '#a78bfa', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" opacity="0.6"/>
    </svg>
  ), desc: "Un bloc lourdement protégé. Sa structure carrée absorbe les impacts directs, nécessitant une grande puissance de feu.", counter: "Dégâts du Sniper" },
  { id: 'shield', name: 'Éclaireur Bouclier', type: 'Protégé', hp: 'Moyen', speed: 'Moyenne', color: '#38bdf8', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ), desc: "Équipé d'un bouclier énergétique capable d'absorber plusieurs impacts avant de céder. Très résistant aux tirs rapides mais vulnérable aux dégâts de zone.", counter: "Mortier / Tesla" },
  { id: 'boss', name: 'Noyau Alpha (Boss)', type: 'Élite', hp: 'Massif', speed: 'Très Lent', color: '#ef4444', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="2.5"/>
      <rect x="7" y="9" width="3" height="4" fill="currentColor" stroke="none"/>
      <rect x="14" y="9" width="3" height="4" fill="currentColor" stroke="none"/>
    </svg>
  ), desc: "L'entité maîtresse. Ce noyau massif possède une résistance extrême et des points de vie colossaux.", counter: "Focus Sniper" },
];

const TOWERS_INFO = [
  { id: 'cannon', name: 'Canon', color: '#cbd5e1', role: 'Polyvalence', desc: "La base de votre défense. Cadence de tir et dégâts équilibrés.", strength: "Équilibré" },
  { id: 'sniper', name: 'Sniper', color: '#34d399', role: 'Dégâts Brut', desc: "Portée extrême et dégâts massifs. Parfait pour éliminer les cibles prioritaires et les bosses.", strength: "Dégâts / Portée" },
  { id: 'rapid', name: 'Rapide', color: '#fbbf24', role: 'Anti-Nuée', desc: "Une pluie de projectiles. Idéal pour finir les ennemis affaiblis.", strength: "Cadence" },
  { id: 'frost', name: 'Givrant', color: '#7dd3fc', role: 'Contrôle', desc: "Ralentit les ennemis au passage, donnant plus de temps à vos autres tours pour frapper.", strength: "Ralentissement" },
  { id: 'mortar', name: 'Mortier', color: '#fb923c', role: 'Zone (AOE)', desc: "Lente cadence mais dégâts de zone dévastateurs. Efficace contre les groupes et les boucliers.", strength: "Dégâts de Zone" },
  { id: 'tesla', name: 'Tesla', color: '#60a5fa', role: 'Multi-Cibles', desc: "Frappe jusqu'à 3 cibles simultanément. Très efficace contre les groupes d'éclaireurs.", strength: "Chaîne d'éclairs" },
];

export default function MainMenu({ onPlay, onSelectLevel, maxLevelUnlocked, currentLevel, onOpenEditor, onOpenSettings }: MainMenuProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [bestiaryTab, setBestiaryTab] = useState<'enemies' | 'towers'>('enemies');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [glitchTitle, setGlitchTitle] = useState(false);

  // Random glitch effect on title
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchTitle(true);
        setTimeout(() => setGlitchTitle(false), 150 + Math.random() * 200);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  // Canvas Grid & Data streams animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    
    const streams = Array.from({ length: 15 }).map(() => ({
      x: Math.random() * 400,
      y: Math.random() * 800,
      length: Math.random() * 60 + 20,
      speed: Math.random() * 150 + 50,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    let lastTime = performance.now();
    let offset = 0;

    const draw = (ts: number) => {
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;
      offset += 30 * dt;

      ctx.fillStyle = '#040810';
      ctx.fillRect(0, 0, 400, 800);

      // 3D Perspective Grid
      ctx.save();
      ctx.translate(200, 600);
      ctx.scale(1, 0.4);
      ctx.rotate(Math.PI / 4);

      ctx.strokeStyle = 'rgba(29,233,182,0.06)';
      ctx.lineWidth = 1.5;
      const gridSize = 40;
      
      const gridOffset = offset % gridSize;

      ctx.beginPath();
      for (let i = -600; i <= 600; i += gridSize) {
        ctx.moveTo(i + gridOffset, -600); ctx.lineTo(i + gridOffset, 600);
        ctx.moveTo(-600, i - gridOffset); ctx.lineTo(600, i - gridOffset);
      }
      ctx.stroke();
      ctx.restore();

      // Data Streams (falling lines)
      streams.forEach(s => {
        s.y += s.speed * dt;
        if (s.y > 800 + s.length) {
          s.y = -s.length;
          s.x = Math.random() * 400;
        }
        
        const grad = ctx.createLinearGradient(0, s.y - s.length, 0, s.y);
        grad.addColorStop(0, 'rgba(29,233,182,0)');
        grad.addColorStop(1, `rgba(29,233,182,${s.alpha})`);
        
        ctx.fillStyle = grad;
        ctx.fillRect(s.x, s.y - s.length, 2, s.length);
        
        // Bright head
        ctx.fillStyle = `rgba(255,255,255,${s.alpha + 0.3})`;
        ctx.fillRect(s.x, s.y, 2, 3);
      });

      // Dark gradient overlay to fade top/bottom
      const mainGrad = ctx.createLinearGradient(0, 0, 0, 800);
      mainGrad.addColorStop(0, '#040810');
      mainGrad.addColorStop(0.3, 'rgba(4,8,16,0)');
      mainGrad.addColorStop(0.8, 'rgba(4,8,16,0.3)');
      mainGrad.addColorStop(1, '#040810');
      ctx.fillStyle = mainGrad;
      ctx.fillRect(0, 0, 400, 800);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex justify-center items-center w-full select-none overflow-hidden touch-none" style={{ height: '100dvh', background: '#000' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        .gf { font-family: 'Orbitron', sans-serif; }
        .mf { font-family: 'IBM Plex Mono', monospace; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .glitch-layer {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          opacity: 0.8;
        }
        .glitch-red {
          color: #ff3d5a;
          clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
          transform: translate(-3px, 2px);
          filter: blur(1px);
        }
        .glitch-cyan {
          color: #00f5c4;
          clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
          transform: translate(3px, -2px);
          filter: blur(1px);
        }

        .btn-premium {
          position: relative;
          background: rgba(0, 245, 196, 0.02);
          border: 1px solid rgba(0, 245, 196, 0.15);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        
        .btn-premium::after {
          content: ''; position: absolute; inset: -1px;
          border: 1px solid #00f5c4;
          opacity: 0; transition: opacity 0.3s;
          clip-path: polygon(0 0, 10% 0, 0 10%, 0 0, 90% 0, 100% 0, 100% 10%, 90% 0, 100% 90%, 100% 100%, 90% 100%, 100% 90%, 10% 100%, 0 100%, 0 90%, 10% 100%);
        }

        .btn-premium:hover::after { opacity: 1; }
        .btn-premium:hover {
          background: rgba(0, 245, 196, 0.08);
          border-color: rgba(0, 245, 196, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -10px rgba(0, 245, 196, 0.2);
        }
        
        .btn-premium:active { transform: scale(0.96) translateY(0); }

        .scanlines::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 5;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
        }

        .glow-text {
          text-shadow: 0 0 20px rgba(0,245,196,0.3), 0 0 40px rgba(0,245,196,0.1);
        }

        .tech-border {
          clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
        }

        .tab-btn {
          position: relative;
          padding: 8px 16px;
          font-weight: 800;
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #00f5c4;
        }
        .tab-btn.active::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0; height: 2px;
          background: #00f5c4;
          box-shadow: 0 0 10px #00f5c4;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .pulse-soft { animation: pulse-slow 4s ease-in-out infinite; }

        .accordion-content {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .accordion-open .accordion-content {
          max-height: 200px;
          opacity: 1;
          margin-top: 12px;
        }
        
        .chevron {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .accordion-open .chevron {
          transform: rotate(180deg);
        }
      `}</style>

      <div className="gf relative overflow-hidden flex flex-col justify-center items-center scanlines mx-auto shadow-2xl" 
        style={{ 
          width: '100vw', 
          height: '100dvh', 
          maxWidth: 'min(100vw, 50dvh)', // Ratio 1:2
          maxHeight: '100dvh',
          background: '#040810' 
        }}>

        {/* Background Canvas */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <canvas ref={canvasRef} width={400} height={800} className="w-full h-full block" />
        </div>

        {/* Badge Top Left */}
        <div className="absolute top-8 left-6 z-10 flex items-center gap-2 border border-[#00f5c4]/30 bg-[#00f5c4]/5 px-2 py-1 rounded" style={{ opacity: 0.8 }}>
          <div className="w-1.5 h-1.5 bg-[#00f5c4] animate-pulse" />
          <span className="mf text-[#00f5c4] text-[10px] tracking-widest font-bold uppercase">v 1.1.0</span>
        </div>

        {/* Content Wrapper */}
        <div className="z-10 flex flex-col items-center justify-center w-full px-8 h-full">

          {/* Glitched Logo */}
          <div className="relative flex flex-col items-center mb-16 anim-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="absolute -inset-4 bg-[#00f5c4]/5 blur-3xl rounded-full pulse-soft" />
            <h1 className="font-black text-[58px] leading-[0.85] tracking-tighter text-center relative z-10 glow-text">
              <span className="text-white">Proxy</span><br />
              <span className="text-[#00f5c4]">Tower</span>
            </h1>
            
            {glitchTitle && (
              <>
                <h1 className="font-black text-[58px] leading-[0.85] tracking-tighter text-center absolute top-0 left-0 right-0 glitch-layer glitch-red z-20 pointer-events-none">
                  <span className="text-white">Proxy</span><br /><span className="text-[#ff3d5a]">Tower</span>
                </h1>
                <h1 className="font-black text-[58px] leading-[0.85] tracking-tighter text-center absolute top-0 left-0 right-0 glitch-layer glitch-cyan z-20 pointer-events-none">
                  <span className="text-white">Proxy</span><br /><span className="text-[#00f5c4]">Tower</span>
                </h1>
              </>
            )}

            <div className="mt-10 flex items-center gap-4 w-full max-w-[240px]">
              <div className="flex-1 h-px bg-gradient-to-l from-[#00f5c4]/40 to-transparent" />
              <p className="mf text-[#00f5c4] text-[9px] tracking-[0.6em] uppercase font-bold opacity-60">Status: Operational</p>
              <div className="flex-1 h-px bg-gradient-to-r from-[#00f5c4]/40 to-transparent" />
            </div>
          </div>

          {/* Buttons Area */}
          <div className="w-full max-w-[260px] flex flex-col gap-5">
            {/* Mission / Play Button */}
            {!showLevelSelect ? (
              <button
                onClick={() => setShowLevelSelect(true)}
                className="anim-up relative w-full h-[68px] flex justify-center items-center cursor-pointer btn-premium tech-border group"
                style={{ animationDelay: '0.3s', opacity: 0 }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00f5c4] shadow-[0_0_20px_#00f5c4]" />
                <div className="flex items-center gap-3 relative z-10">
                  <ShieldAlert size={22} className="text-[#00f5c4] group-hover:scale-110 transition-transform" />
                  <span className="text-[#00f5c4] font-black text-2xl tracking-[0.2em] pl-1 group-hover:text-white transition-colors duration-300">MISSIONS</span>
                </div>
              </button>
            ) : (
              <div className="anim-up flex flex-col gap-3" style={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-1 px-1">
                  <span className="mf text-[9px] text-[#00f5c4] font-bold tracking-widest uppercase">Secteur Alpha</span>
                  <button onClick={() => setShowLevelSelect(false)} className="text-white/20 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const isUnlocked = lvl <= maxLevelUnlocked;
                    const isCurrent = lvl === currentLevel;
                    return (
                      <button
                        key={lvl}
                        disabled={!isUnlocked}
                        onClick={() => onSelectLevel(lvl)}
                        className={`h-11 rounded-lg border mf font-black transition-all relative overflow-hidden flex items-center justify-center
                          ${isUnlocked 
                            ? isCurrent 
                              ? 'bg-[#00f5c4]/20 border-[#00f5c4] text-[#00f5c4] shadow-[0_0_15px_#00f5c440]' 
                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-[#00f5c4]/10 hover:border-[#00f5c4]/40 hover:text-white'
                            : 'bg-black/40 border-white/5 text-white/5 opacity-50 cursor-not-allowed'
                          }`}
                      >
                        {lvl}
                        {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center opacity-20"><Settings size={10} /></div>}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={onPlay}
                  className="w-full h-12 bg-[#00f5c4] text-[#0b0a16] font-black tracking-widest rounded-xl hover:bg-[#00f5c4]/90 transition-all active:scale-95 mt-1 shadow-[0_0_20px_#00f5c440]"
                >
                  CONTINUER (NVX.{currentLevel})
                </button>
              </div>
            )}

            {/* Sub-actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowBestiary(true)}
                className="anim-up relative h-[56px] flex flex-col justify-center items-center btn-premium group"
                style={{ animationDelay: '0.4s', opacity: 0, borderRadius: '12px' }}
              >
                <Database size={18} className="text-[#a78bfa] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-white/40 font-bold text-[10px] tracking-widest uppercase group-hover:text-white transition-colors">Bestiaire</span>
              </button>

              <button
                onClick={onOpenEditor}
                className="anim-up relative h-[56px] flex flex-col justify-center items-center btn-premium group"
                style={{ animationDelay: '0.45s', opacity: 0, borderRadius: '12px' }}
              >
                <Layers size={18} className="text-[#00f5c4] mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-white/40 font-bold text-[10px] tracking-widest uppercase group-hover:text-white transition-colors">Éditeur</span>
              </button>
            </div>

            {/* Bottom Row */}
            <div className="flex justify-center mt-2">
              <button
                onClick={onOpenSettings}
                className="anim-up p-4 rounded-full border border-white/5 bg-white/[0.02] text-white/20 hover:text-[#00f5c4] hover:bg-[#00f5c4]/5 hover:border-[#00f5c4]/20 transition-all active:scale-90"
                style={{ animationDelay: '0.55s', opacity: 0 }}
              >
                <Settings size={22} className="hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom minimal tag */}
        <div className="absolute bottom-8 mf text-white/20 text-[9px] tracking-[0.3em] uppercase text-center w-full pointer-events-none anim-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
          Connexion sécurisée // Actif
        </div>

        {/* Bestiary Modal */}
        {showBestiary && (
          <div className="absolute inset-0 z-50 bg-[#040810]/95 backdrop-blur-md flex flex-col" style={{ animation: 'fadeUp 0.3s ease-out' }}>
            <div className="flex items-center justify-between px-6 pt-12 pb-2 border-b border-[#00f5c4]/20">
              <div className="flex items-center gap-3">
                <Database className="text-[#00f5c4]" size={24} />
                <div>
                  <h2 className="text-white font-black text-xl tracking-widest uppercase">Base de données</h2>
                  <p className="text-[#00f5c4]/60 mf text-[10px] uppercase tracking-wider mt-0.5">Classification du secteur</p>
                </div>
              </div>
              <button onClick={() => setShowBestiary(false)} className="w-10 h-10 rounded-xl border border-[#00f5c4]/30 flex items-center justify-center text-[#00f5c4]/70 hover:text-white hover:bg-[#00f5c4]/10 transition-colors active:scale-95">
                <X size={18} />
              </button>
            </div>

            <div className="flex gap-4 px-6 py-4 bg-white/[0.02] border-b border-white/5">
              <button onClick={() => setBestiaryTab('enemies')} className={`tab-btn mf ${bestiaryTab === 'enemies' ? 'active' : ''}`}>Unités</button>
              <button onClick={() => setBestiaryTab('towers')} className={`tab-btn mf ${bestiaryTab === 'towers' ? 'active' : ''}`}>Arsenal</button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-3">
              {bestiaryTab === 'enemies' ? ENEMIES.map((enemy) => (
                <div key={enemy.id} 
                  onClick={() => setExpandedId(expandedId === enemy.id ? null : enemy.id)}
                  className={`bg-[#0b0a16] border border-white/10 rounded-2xl p-4 relative overflow-hidden group cursor-pointer transition-all duration-300
                    ${expandedId === enemy.id ? 'accordion-open border-[#00f5c4]/30 bg-[#00f5c4]/5' : 'hover:border-white/20'}`}>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300" 
                      style={{ background: `${enemy.color}15`, border: `1px solid ${enemy.color}40`, color: enemy.color, transform: expandedId === enemy.id ? 'scale(1.1)' : 'scale(1)' }}>
                      {enemy.icon}
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-black text-base uppercase tracking-wide">{enemy.name}</h3>
                        <div className="mf text-[8px] tracking-[0.2em] font-bold opacity-40 uppercase">{enemy.type}</div>
                      </div>
                      <Database className="chevron text-white/10" size={14} />
                    </div>
                  </div>

                  <div className="accordion-content relative z-10">
                    <p className="text-white/50 text-[11px] leading-relaxed mb-4 border-l-2 border-[#00f5c4]/20 pl-3">
                      {enemy.desc}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <div className="text-white/30 mf text-[7px] uppercase tracking-widest mb-1">Menace</div>
                        <div className="text-white text-[10px] font-bold">{enemy.hp} / {enemy.speed}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                        <div className="text-[#38bdf8]/40 mf text-[7px] uppercase tracking-widest mb-1">Contrer avec</div>
                        <div className="text-[#38bdf8] text-[10px] font-bold uppercase">{enemy.counter}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )) : TOWERS_INFO.map((tower) => (
                <div key={tower.id} 
                  onClick={() => setExpandedId(expandedId === tower.id ? null : tower.id)}
                  className={`bg-[#0b0a16] border border-white/10 rounded-2xl p-4 relative overflow-hidden group cursor-pointer transition-all duration-300
                    ${expandedId === tower.id ? 'accordion-open border-[#00f5c4]/30 bg-[#00f5c4]/5' : 'hover:border-white/20'}`}>
                  
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300" 
                      style={{ background: `${tower.color}15`, border: `1px solid ${tower.color}40`, color: tower.color, transform: expandedId === tower.id ? 'scale(1.1)' : 'scale(1)' }}>
                      <Database size={18} />
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-black text-base uppercase tracking-wide">{tower.name}</h3>
                        <div className="mf text-[8px] tracking-[0.2em] font-bold opacity-40 uppercase">{tower.role}</div>
                      </div>
                      <Database className="chevron text-white/10" size={14} />
                    </div>
                  </div>

                  <div className="accordion-content relative z-10">
                    <p className="text-white/50 text-[11px] leading-relaxed mb-4 border-l-2 border-[#00f5c4]/20 pl-3">
                      {tower.desc}
                    </p>
                    <div className="bg-[#00f5c4]/5 rounded-lg p-3 border border-[#00f5c4]/10">
                      <div className="text-[#00f5c4]/40 mf text-[7px] uppercase tracking-widest mb-1">Capacité Spéciale</div>
                      <div className="text-white text-[11px] font-black uppercase tracking-wider">{tower.strength}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
