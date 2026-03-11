import { useEffect, useRef, useState } from 'react';
import { X, ShieldAlert, Database } from 'lucide-react';

interface MainMenuProps {
  onPlay: () => void;
}

const ENEMIES = [
  { id: 'normal', name: 'Ennemi Normal', type: 'Standard', hp: 'Moyen', speed: 'Moyenne', color: '#ff4d6d', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ), desc: "L'unité de base. Stable et prévisible, elle constitue la majorité des vagues entrantes." },
  { id: 'fast', name: 'Ennemi Rapide', type: 'Véloce', hp: 'Faible', speed: 'Très Rapide', color: '#fbbf24', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" strokeWidth="2"/>
      <path d="M12 7l3 6H9l3-6z" fill="currentColor" stroke="none" />
    </svg>
  ), desc: "Une version optimisée pour la vitesse. Son triangle interne lui permet de transiter plus rapidement." },
  { id: 'tank', name: 'Ennemi Blindé', type: 'Lourd', hp: 'Élevé', speed: 'Lent', color: '#a78bfa', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" opacity="0.6"/>
    </svg>
  ), desc: "Un bloc lourdement protégé. Sa structure carrée absorbe les impacts directs, nécessitant une grande puissance de feu." },
  { id: 'boss', name: 'Noyau Alpha (Boss)', type: 'Élite', hp: 'Massif', speed: 'Très Lent', color: '#ef4444', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="2.5"/>
      <rect x="7" y="9" width="3" height="4" fill="currentColor" stroke="none"/>
      <rect x="14" y="9" width="3" height="4" fill="currentColor" stroke="none"/>
    </svg>
  ), desc: "L'entité maîtresse. Ce noyau massif possède une résistance extrême et des points de vie colossaux." },
];

export default function MainMenu({ onPlay }: MainMenuProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showBestiary, setShowBestiary] = useState(false);
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
        }
        .glitch-cyan {
          color: #00f5c4;
          clip-path: polygon(0 55%, 100% 55%, 100% 100%, 0 100%);
          transform: translate(3px, -2px);
        }

        .btn-tech {
          position: relative;
          background: rgba(0, 245, 196, 0.03);
          border: 1px solid rgba(0, 245, 196, 0.2);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .btn-tech::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(0, 245, 196, 0.1), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .btn-tech:hover::before { transform: translateX(100%); }
        .btn-tech:hover {
          background: rgba(0, 245, 196, 0.08);
          border-color: rgba(0, 245, 196, 0.6);
          box-shadow: 0 0 20px rgba(0, 245, 196, 0.15) inset;
        }
        .btn-tech:active { transform: scale(0.96); }

        .scanlines::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 5;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px);
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
            <h1 className="font-black text-[52px] leading-[0.9] tracking-tighter text-center relative z-10">
              <span className="text-white">Proxy</span><br />
              <span className="text-[#00f5c4]" style={{ textShadow: '0 0 30px rgba(0,245,196,0.4)' }}>Tower</span>
            </h1>
            
            {glitchTitle && (
              <>
                <h1 className="font-black text-[52px] leading-[0.9] tracking-tighter text-center absolute top-0 left-0 right-0 glitch-layer glitch-red z-20 pointer-events-none">
                  <span className="text-white">Proxy</span><br /><span className="text-[#ff3d5a]">Tower</span>
                </h1>
                <h1 className="font-black text-[52px] leading-[0.9] tracking-tighter text-center absolute top-0 left-0 right-0 glitch-layer glitch-cyan z-20 pointer-events-none">
                  <span className="text-white">Proxy</span><br /><span className="text-[#00f5c4]">Tower</span>
                </h1>
              </>
            )}

            <div className="mt-8 flex items-center gap-3 w-full max-w-[220px] opacity-50">
              <div className="flex-1 h-px bg-gradient-to-l from-[#00f5c4] to-transparent shadow-[0_0_5px_#00f5c4]" />
              <p className="mf text-[#00f5c4] text-[10px] tracking-[0.5em] uppercase font-bold">System_Ready</p>
              <div className="flex-1 h-px bg-gradient-to-r from-[#00f5c4] to-transparent shadow-[0_0_5px_#00f5c4]" />
            </div>
          </div>

          {/* Buttons Area */}
          <div className="w-full max-w-[260px] flex flex-col gap-4">
            {/* Play Button */}
            <button
              onClick={onPlay}
              className="anim-up relative w-full h-[64px] flex justify-center items-center cursor-pointer btn-tech group"
              style={{ animationDelay: '0.3s', opacity: 0, clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00f5c4] shadow-[0_0_15px_rgba(0,245,196,0.8)]" />
              <div className="flex items-center gap-3">
                <ShieldAlert size={20} className="text-[#00f5c4] group-hover:scale-110 transition-transform" />
                <span className="text-[#00f5c4] font-black text-xl tracking-[0.25em] pl-1 group-hover:text-white transition-colors duration-300">INITIALISER</span>
              </div>
            </button>

            {/* Bestiary Button */}
            <button
              onClick={() => setShowBestiary(true)}
              className="anim-up relative w-full h-[52px] flex flex-row justify-between items-center px-5 cursor-pointer btn-tech group"
              style={{ animationDelay: '0.4s', opacity: 0, borderRadius: '8px' }}
            >
              <div className="flex items-center gap-3">
                <Database size={16} className="text-[#a78bfa]" />
                <span className="text-white/80 font-bold text-sm tracking-[0.2em] group-hover:text-white transition-colors">BESTIAIRE</span>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom minimal tag */}
        <div className="absolute bottom-8 mf text-white/20 text-[9px] tracking-[0.3em] uppercase text-center w-full pointer-events-none anim-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
          Connexion sécurisée // Actif
        </div>

        {/* Bestiary Modal */}
        {showBestiary && (
          <div className="absolute inset-0 z-50 bg-[#040810]/95 backdrop-blur-md flex flex-col" style={{ animation: 'fadeUp 0.3s ease-out' }}>
            <div className="flex items-center justify-between px-6 pt-12 pb-4 border-b border-[#00f5c4]/20">
              <div className="flex items-center gap-3">
                <Database className="text-[#00f5c4]" size={24} />
                <div>
                  <h2 className="text-white font-black text-xl tracking-widest uppercase">Base de données</h2>
                  <p className="text-[#00f5c4]/60 mf text-[10px] uppercase tracking-wider mt-0.5">Classification des cibles</p>
                </div>
              </div>
              <button onClick={() => setShowBestiary(false)} className="w-10 h-10 rounded-xl border border-[#00f5c4]/30 flex items-center justify-center text-[#00f5c4]/70 hover:text-white hover:bg-[#00f5c4]/10 transition-colors active:scale-95">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
              {ENEMIES.map((enemy) => (
                <div key={enemy.id} className="bg-[#0b0a16] border border-white/10 rounded-2xl p-4 relative overflow-hidden group hover:border-white/20 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-10 transition-opacity" style={{ background: `radial-gradient(circle at top right, ${enemy.color}, transparent)` }} />
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${enemy.color}15`, border: `1px solid ${enemy.color}40`, color: enemy.color }}>
                      {enemy.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-white font-black text-lg leading-tight uppercase tracking-wide">{enemy.name}</h3>
                        <span className="mf text-[9px] px-2 py-0.5 rounded border tracking-widest uppercase" style={{ color: enemy.color, borderColor: `${enemy.color}40`, background: `${enemy.color}10` }}>
                          {enemy.type}
                        </span>
                      </div>
                      <p className="text-white/50 text-[11px] leading-relaxed mb-3">
                        {enemy.desc}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                          <div className="text-white/30 mf text-[8px] uppercase tracking-widest mb-1">Résistance</div>
                          <div className="text-white text-xs font-bold">{enemy.hp}</div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                          <div className="text-white/30 mf text-[8px] uppercase tracking-widest mb-1">Vélocité</div>
                          <div className="text-white text-xs font-bold">{enemy.speed}</div>
                        </div>
                      </div>
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
