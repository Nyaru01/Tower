import { useEffect, useRef, useState } from 'react';
import { X, Settings, ChevronRight, Shield, Rocket, Sword, Edit3, ChevronDown, Database, CloudDownload, RefreshCw } from 'lucide-react';
import { TOWER_TYPES, ENEMY_TYPES } from '../game/constants';
import CareerTree from './CareerTree';

interface MainMenuProps {
  onSelectCareerLevel: (lvl: number) => void;
  onSelectLevel: (lvl: number) => void;
  currentLevel: number;
  maxLevelUnlocked: number;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
  officialLevels: Record<number, any>;
  updateAvailable?: boolean;
  onCheckUpdate?: () => void;
}

const ENEMIES = Object.values(ENEMY_TYPES || {})?.map(e => ({
  ...e,
  Icon: e.icon
}));

const TOWERS_INFO = Object.values(TOWER_TYPES || {})?.map(t => ({
  id: t.id,
  name: t.name,
  role: t.special === 'slow' ? 'SUPPORT / RALENTISSEMENT' : t.special === 'aoe' ? 'DÉGÂTS DE ZONE' : 'DÉFENSE TACTIQUE',
  color: t.color,
  strength: t.desc,
  desc: t.desc,
  stats: t.statBar,
  Icon: t.icon
}));

export default function MainMenu({ onSelectCareerLevel, onSelectLevel, currentLevel, maxLevelUnlocked, onOpenEditor, onOpenSettings, officialLevels, updateAvailable, onCheckUpdate }: MainMenuProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showCareerTree, setShowCareerTree] = useState(false);
  const [bestiaryTab, setBestiaryTab] = useState<'enemies' | 'towers'>('enemies');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let particles: { x: number, y: number, vx: number, vy: number, s: number, o: number }[] = [];
    for(let i=0; i<60; i++) {
        particles.push({
            x: Math.random() * 400,
            y: Math.random() * 800,
            vx: (Math.random() - 0.5) * 0.15,
            vy: (Math.random() - 0.5) * 0.15,
            s: Math.random() * 1.2 + 0.3,
            o: Math.random() * 0.5 + 0.2
        });
    }

    let gridOffset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, 400, 800);
      
      // 3D Grid drawing
      ctx.strokeStyle = '#00f5c408';
      ctx.lineWidth = 1;
      gridOffset = (gridOffset + 0.2) % 40;
      
      // Vertical lines with perspective
      for (let x = -200; x <= 600; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (x - 200) * 0.5, 800);
        ctx.stroke();
      }
      
      // Horizontal lines moving
      for (let y = gridOffset; y <= 800; y += 40) {
        ctx.beginPath();
        const opacity = (y / 800) * 0.1;
        ctx.strokeStyle = `rgba(0, 245, 196, ${opacity})`;
        ctx.moveTo(0, y);
        ctx.lineTo(400, y);
        ctx.stroke();
      }

      // Particles & Connections
      particles.forEach((p, i) => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > 400) p.vx *= -1;
          if (p.y < 0 || p.y > 800) p.vy *= -1;
          ctx.fillStyle = `rgba(0, 245, 196, ${p.o})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
          
          for(let j=i+1; j<particles.length; j++) {
              let p2 = particles[j];
              let d = Math.sqrt((p.x-p2.x)**2 + (p.y-p2.y)**2);
              if (d < 50) {
                  ctx.strokeStyle = `rgba(0, 245, 196, ${0.12 * (1 - d/50)})`;
                  ctx.lineWidth = 0.5;
                  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
              }
          }
      });

      // Dark overlays for depth
      const grad = ctx.createLinearGradient(0, 0, 0, 800);
      grad.addColorStop(0, '#040810');
      grad.addColorStop(0.15, 'rgba(4,8,16,0)');
      grad.addColorStop(0.85, 'rgba(4,8,16,0)');
      grad.addColorStop(1, '#040810');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 800);
      
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex justify-center items-center w-full select-none overflow-hidden touch-none font-sans" style={{ height: '100dvh', background: '#020408' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&family=Space+Grotesk:wght@300;400;700&family=JetBrains+Mono:wght@300;400;700&display=swap');
        
        :root {
          --cyan: #00f5c4;
          --blue: #38bdf8;
          --purple: #a78bfa;
          --bg: #040810;
        }

        .gf { font-family: 'Space Grotesk', sans-serif; }
        .tf { font-family: 'Plus Jakarta Sans', sans-serif; }
        .mf { font-family: 'JetBrains Mono', monospace; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .anim-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        .holo-card {
          position: relative;
          background: rgba(255, 255, 255, 0.03);
          border: 0.5px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .holo-card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.05), transparent);
          pointer-events: none;
        }

        .holo-card:active {
          transform: scale(0.97);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .corner-accent::after {
          content: ''; position: absolute; bottom: 0; right: 0; width: 6px; height: 6px;
          border-right: 1.5px solid var(--accent); border-bottom: 1.5px solid var(--accent);
          opacity: 0.6;
        }
        
        .corner-accent::before {
          content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 6px;
          border-left: 1.5px solid var(--accent); border-top: 1.5px solid var(--accent);
          opacity: 0.6;
        }

        .scanlines {
          position: absolute; inset: 0; pointer-events: none; z-index: 40;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), 
                      linear-gradient(90deg, rgba(255, 0, 0, 0.02), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.02));
          background-size: 100% 3px, 3px 100%;
          opacity: 0.3;
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(-1px, -1px); }
          60% { transform: translate(1px, 1px); }
          80% { transform: translate(1px, -1px); }
          100% { transform: translate(0); }
        }
        .glitch-hover:hover { animation: glitch 0.2s infinite; }

        .text-glow { text-shadow: 0 0 15px currentColor; }
      `}</style>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
        className="gf relative overflow-hidden flex flex-col items-center mx-auto" 
        style={{ 
          width: '100vw', height: '100dvh', maxWidth: '440px',
          background: '#040810', border: '0.5px solid rgba(255,255,255,0.05)'
        }}>

        {/* Scanlines layer */}
        <div className="scanlines" />

        {/* Dynamic Background */}
        <div className="absolute inset-0 pointer-events-none z-0 transition-transform duration-1000 ease-out"
          style={{ transform: `rotateY(${mousePos.x * 4}deg) rotateX(${mousePos.y * -4}deg) scale(1.1)` }}>
          <canvas ref={canvasRef} className="w-full h-full block opacity-40" />
        </div>

        {/* Header / Logo */}
        <div className="z-10 flex flex-col items-center justify-center w-full px-8 flex-grow"
          style={{ transform: `translateZ(40px)` }}>
          
          <div className="relative flex flex-col items-center mb-16 anim-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
            <div className="absolute -top-12 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full" />
            <h1 className="font-extrabold text-[64px] leading-[0.85] tracking-tight text-center flex flex-col items-center">
              <span className="text-white filter drop-shadow(0 0 10px rgba(255,255,255,0.2))">PROXY</span>
              <span className="text-[#00f5c4] text-glow filter drop-shadow(0 0 20px rgba(0,245,196,0.3))">TOWER</span>
            </h1>
          </div>

          {/* Main Action Nodes */}
          <div className="w-full space-y-4">
            <button onClick={() => setShowCareerTree(true)} className="anim-up relative w-full h-24 holo-card group corner-accent" style={{ animationDelay: '0.3s', opacity: 0, '--accent': '#00f5c4' } as any}>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-active:opacity-100 transition-opacity" />
              <div className="flex items-center gap-6 px-7 h-full">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5 transition-all group-active:scale-95 shadow-inner">
                    <Rocket className="text-[#00f5c4] filter drop-shadow(0 0 5px #00f5c4)" size={28} />
                  </div>
                </div>
                <div className="flex flex-col items-start">
                   <div className="mf text-[8px] text-cyan-400 font-bold tracking-[0.3em] uppercase mb-1 flex items-center gap-2">
                     <span className="w-1 h-1 bg-cyan-400 rounded-full" /> Mission_Standard
                   </div>
                   <span className="text-white text-2xl font-bold tracking-tight uppercase leading-none">Carrière</span>
                   <span className="tf text-[9px] text-white/30 font-medium tracking-wide mt-1.5 uppercase italic">Secteur Delta débloqué</span>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                  <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400/40 w-[65%]" />
                  </div>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </button>

            {!showLevelSelect ? (
              <button onClick={() => setShowLevelSelect(true)} className="anim-up relative w-full h-24 holo-card group corner-accent" style={{ animationDelay: '0.4s', opacity: 0, '--accent': '#38bdf8' } as any}>
                <div className="flex items-center gap-6 px-7 h-full">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-white/[0.03] flex items-center justify-center border border-white/5 transition-all group-hover:border-blue-400/20 shadow-inner">
                      <Sword className="text-[#38bdf8] opacity-60 group-hover:opacity-100 transition-opacity" size={24} />
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white/70 text-2xl font-bold tracking-tight uppercase group-hover:text-white transition-colors">Arcade</span>
                    <span className="tf text-[9px] text-white/20 font-bold tracking-widest uppercase mt-1">Simulations tactiques</span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="anim-up p-5 holo-card border-blue-500/20" style={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="mf text-[8px] text-[#38bdf8] font-bold tracking-widest uppercase">Select_Sector</span>
                  <button onClick={() => setShowLevelSelect(false)} className="text-white/20 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-5 gap-2.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
                    const isUnlocked = lvl <= 2 || !!(officialLevels || {})[lvl];
                    const isActive = lvl === currentLevel;
                    return (
                      <button 
                        key={lvl} 
                        disabled={!isUnlocked} 
                        onClick={() => onSelectLevel(lvl)} 
                        className={`h-11 rounded-lg border tf font-bold transition-all flex items-center justify-center text-sm active:scale-90
                          ${isUnlocked ? (
                            isActive 
                              ? 'bg-blue-500/20 border-blue-400 text-blue-400 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                              : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                          ) : 'bg-black/40 border-white/5 text-white/5 opacity-40 cursor-not-allowed'}`}
                      >
                        {lvl.toString().padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowBestiary(true)} className="anim-up h-16 holo-card flex items-center justify-center gap-3 group" style={{ animationDelay: '0.5s', opacity: 0 }}>
                <Database className="text-purple-400/50 group-hover:text-purple-400 transition-colors" size={18} />
                <span className="tf text-white/40 font-bold text-[9px] tracking-widest uppercase group-hover:text-white transition-colors">Bestiaire</span>
              </button>
              <button onClick={onOpenEditor} className="anim-up h-16 holo-card flex items-center justify-center gap-3 group" style={{ animationDelay: '0.55s', opacity: 0 }}>
                <Edit3 className="text-cyan-400/50 group-hover:text-cyan-400 transition-colors" size={18} />
                <span className="tf text-white/40 font-bold text-[9px] tracking-widest uppercase group-hover:text-white transition-colors">Éditeur</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Utility Bar */}
        <div className="z-20 w-full px-8 pb-10 mt-auto">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => updateAvailable ? window.location.reload() : onCheckUpdate?.()}
              className={`p-4 rounded-xl border transition-all active:scale-90 group
                ${updateAvailable 
                  ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(255,61,90,0.4)]' 
                  : 'bg-white/10 border-white/20 text-white/40 hover:text-cyan-400 hover:border-cyan-400/50 hover:bg-cyan-400/10 shadow-lg'}`}
              title={updateAvailable ? 'Mise à jour disponible' : 'Auto-Vérification'}
            >
              {updateAvailable ? <CloudDownload size={22} className="animate-bounce" /> : <RefreshCw size={22} className="group-hover:rotate-180 transition-transform duration-700" />}
            </button>

            <div className="flex flex-col items-center">
               <div className="flex gap-1.5 opacity-20">
                 {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 2 ? 'bg-cyan-500' : 'bg-white'}`} />)}
               </div>
            </div>

            <button 
              onClick={onOpenSettings} 
              className="p-4 rounded-xl border border-white/20 bg-white/10 text-white/40 hover:text-white hover:border-white/40 hover:bg-white/20 transition-all active:scale-90 shadow-lg group" 
            >
              <Settings size={22} className="group-hover:rotate-90 transition-transform duration-1000" />
            </button>
          </div>

          <div className="anim-up flex items-center justify-center gap-3 mf text-white/10 text-[7px] tracking-[0.5em] uppercase" style={{ animationDelay: '0.7s', opacity: 0 }}>
            <Shield size={10} className="opacity-50" />
            <span>Cryptage_Terminal_Actif</span>
          </div>
        </div>

        {/* MODAL - Bestiary (Refined) */}
        {showBestiary && (
          <div className="absolute inset-0 z-[100] bg-[#020408]/60 backdrop-blur-3xl flex flex-col pt-12" style={{ animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="px-8 pb-8 flex justify-between items-end border-b border-white/5">
              <div className="flex flex-col gap-2">
                <div className="mf text-[9px] text-purple-400 font-bold tracking-[0.4em] uppercase">Archive_Tactique</div>
                <h2 className="text-white font-black text-3xl tracking-tight uppercase leading-none">Bestiaire</h2>
              </div>
              <button onClick={() => setShowBestiary(false)} className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-all"><X size={20} /></button>
            </div>
            
            <div className="flex gap-8 px-8 py-6 border-b border-white/5 bg-white/[0.02]">
              <button onClick={() => setBestiaryTab('enemies')} className={`mf text-[9px] font-bold tracking-[0.3em] uppercase underline-offset-8 transition-all ${bestiaryTab === 'enemies' ? 'text-purple-400 underline' : 'text-white/20'}`}>Ennemis</button>
              <button onClick={() => setBestiaryTab('towers')} className={`mf text-[9px] font-bold tracking-[0.3em] uppercase underline-offset-8 transition-all ${bestiaryTab === 'towers' ? 'text-purple-400 underline' : 'text-white/20'}`}>Tours</button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
               {bestiaryTab === 'enemies' ? (ENEMIES || []).map((enemy) => (
                <div key={enemy.id} className={`holo-card border-none bg-white/[0.02] ${expandedId === enemy.id ? 'bg-white/[0.06]' : ''}`}>
                  <button onClick={() => setExpandedId(expandedId === enemy.id ? null : enemy.id)} className="w-full h-20 flex items-center gap-5 px-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${enemy.color}15`, border: `1px solid ${enemy.color}40`, color: enemy.color }}>{enemy.Icon && <enemy.Icon size={20} />}</div>
                    <div className="flex flex-col items-start translate-y-0.5">
                      <span className="text-white font-bold tracking-tight uppercase leading-none">{enemy.name}</span>
                      <span className="mf text-[7px] font-bold text-white/20 uppercase mt-1.5">{enemy.type}</span>
                    </div>
                    <ChevronDown size={14} className={`ml-auto text-white/10 transition-transform ${expandedId === enemy.id ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  {expandedId === enemy.id && (
                    <div className="px-6 pb-6 pt-0 transition-all">
                      <p className="tf text-[11px] text-white/40 leading-relaxed font-medium mb-5">{enemy.desc}</p>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                           <div className="mf text-[6px] text-white/20 uppercase mb-1">Vulnérabilité</div>
                           <div className="text-[10px] text-purple-300 font-bold uppercase">{enemy.counter}</div>
                         </div>
                         <div className="p-3 bg-black/20 rounded-lg border border-white/5">
                           <div className="mf text-[6px] text-white/20 uppercase mb-1">Indice Menace</div>
                           <div className="text-[10px] text-white/80 font-bold uppercase">{enemy.speed}</div>
                         </div>
                      </div>
                    </div>
                  )}
                </div>
               )) : (TOWERS_INFO || []).map((tower: any) => (
                <div key={tower.id} className={`holo-card border-none bg-white/[0.02] ${expandedId === tower.id ? 'bg-white/[0.06]' : ''}`}>
                  <button onClick={() => setExpandedId(expandedId === tower.id ? null : tower.id)} className="w-full h-20 flex items-center gap-5 px-5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `${tower.color}15`, border: `1px solid ${tower.color}40`, color: tower.color }}>{tower.Icon && <tower.Icon size={22} />}</div>
                    <div className="flex flex-col items-start translate-y-0.5">
                      <span className="text-white font-bold tracking-tight uppercase leading-none">{tower.name}</span>
                      <span className="mf text-[7px] font-bold text-white/20 uppercase mt-1.5">{tower.role}</span>
                    </div>
                    <ChevronDown size={14} className={`ml-auto text-white/10 transition-transform ${expandedId === tower.id ? 'rotate-180 text-white' : ''}`} />
                  </button>
                  {expandedId === tower.id && (
                    <div className="px-6 pb-6 pt-0">
                      <p className="tf text-[11px] text-white/40 leading-relaxed font-medium mb-6">{tower.desc}</p>
                      <div className="space-y-4">
                         <div className="grid grid-cols-4 gap-3">
                           {['DEG', 'VIT', 'POR', 'CRT'].map((stat, i) => (
                             <div key={stat} className="flex flex-col gap-2">
                               <div className="h-1 bg-white/5 rounded-full overflow-hidden flex items-end">
                                 <div className="h-full bg-white/30 rounded-full" style={{ width: `${(tower.stats?.[i] || 0) * 100}%`, background: tower.color }} />
                               </div>
                               <div className="mf text-[7px] text-center text-white/20 font-bold">{stat}</div>
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
                  )}
                </div>
               ))}
               <div className="h-20" />
            </div>
          </div>
        )}
        {showCareerTree && (
          <CareerTree 
            maxLevelUnlocked={maxLevelUnlocked} 
            onSelectLevel={(lvl) => {
              onSelectCareerLevel(lvl);
              setShowCareerTree(false);
            }} 
            onClose={() => setShowCareerTree(false)} 
          />
        )}
      </div>
    </div>
  );
}
