import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, ArrowLeft, Download, Upload, Cpu, Waypoints, ChevronDown, ChevronUp, Layers, Check } from 'lucide-react';
import { INITIAL_LEVELS } from '../game/constants';

const CW = 400, CH = 800;

interface Point { x: number; y: number; }
interface Slot { id: number; x: number; y: number; side: 'left' | 'right'; }

interface LevelEditorProps {
  onBack: () => void;
  onSave: (id: number, config: any) => void;
  onTest: (config: any) => void;
  initialConfig?: any;
  initialLevelId?: number;
  customLevels?: Record<number, any>;
}

export default function LevelEditor({ onBack, onSave, onTest, initialConfig, initialLevelId = 1, customLevels = {} }: LevelEditorProps) {
  const [editMode, setEditMode] = useState<'slots' | 'path'>('slots');
  const [currentLevelId, setCurrentLevelId] = useState(initialLevelId);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [slots, setSlots] = useState<Slot[]>(initialConfig?.slots.map((s:any, i:number)=>({id:s.id||i+1, x:s.x, y:s.y, side:s.side})) || []);
  const [path, setPath] = useState<Point[]>(initialConfig?.path || [{x:200, y:70}, {x:200, y:675}]);
  
  const loadLevel = (id: number) => {
    setCurrentLevelId(id);
    const config = customLevels[id] || INITIAL_LEVELS[id];
    if (config) {
      setSlots(config.slots.map((s:any, i:number)=>({id:s.id||i+1, x:s.x, y:s.y, side:s.side})));
      setPath(config.path);
    }
  };
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<number | null>(null);
  const [draggingPathIdx, setDraggingPathIdx] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragOffset = useRef<Point>({ x: 0, y: 0 });

  const getCanvasCoords = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CW / rect.width),
      y: (e.clientY - rect.top) * (CH / rect.height)
    };
  };

  const drawPreview = useCallback((ts: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Dynamic Background Plate
    const px = path.map(p => p.x), py = path.map(p => p.y);
    slots.forEach(s => { px.push(s.x); py.push(s.y); });
    
    // Symmetrical Centering Logic
    const pad = 50;
    const maxCX = Math.max(...px.map((x: number) => Math.abs(x - CW/2)), 100);
    const maxCY = Math.max(...py.map((y: number) => Math.abs(y - CH/2)), 200);
    const bw = maxCX * 2 + pad * 2;
    const bh = maxCY * 2 + pad * 2;
    const bx = CW/2 - bw/2;
    const by = CH/2 - bh/2;

    ctx.fillStyle = '#0b0a16';
    ctx.fillRect(0, 0, CW, CH);

    // Draw dynamic green platform
    ctx.fillStyle='rgba(0,0,0,0.48)';ctx.beginPath();ctx.roundRect(bx+8,by+8,bw,bh,18);ctx.fill();
    const ag=ctx.createLinearGradient(bx,by,bx+bw,by+bh);ag.addColorStop(0,'#1cb899');ag.addColorStop(0.5,'#17a68a');ag.addColorStop(1,'#0f8070');
    ctx.fillStyle=ag;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,16);ctx.fill();
    const ig=ctx.createLinearGradient(bx,by,bx+bw/3,by+bh/3);ig.addColorStop(0,'rgba(255,255,255,0.07)');ig.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=ig;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,16);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,16);ctx.stroke();

    // Path rendering with double bands
    const pathPath = new Path2D();
    path.forEach((p, i) => {
      if(i === 0) pathPath.moveTo(p.x, p.y);
      else pathPath.lineTo(p.x, p.y);
    });

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // 1. Subtle Glow Background
    ctx.strokeStyle = 'rgba(0, 245, 196, 0.1)';
    ctx.lineWidth = 74;
    ctx.stroke(pathPath);

    // 2. Sharp Neon Borders
    ctx.strokeStyle = '#00f5c4';
    ctx.lineWidth = 66;
    ctx.stroke(pathPath);

    // 3. Main Corridor Fill
    ctx.strokeStyle = '#0b0a16';
    ctx.lineWidth = 60;
    ctx.stroke(pathPath);

    // 4. Subtle Center Detail
    ctx.strokeStyle = 'rgba(0, 245, 196, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 20]);
    ctx.stroke(pathPath);
    ctx.setLineDash([]);

    // Draw waypoints in path mode
    if (editMode === 'path') {
      // Ghost line to mouse
      if (mousePos && path.length > 0) {
        const last = path[path.length - 1];
        ctx.strokeStyle = 'rgba(28, 184, 153, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      path.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#1cb899';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // Draw existing slots
    slots.forEach(slot => {
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 245, 196, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#00f5c4';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(slot.id.toString(), slot.x, slot.y + 4);
    });

    // Crystal orb portal at the end of path
    if (path.length > 0) {
      const lastWp = path[path.length - 1];
      const ot = ts * 0.001;
      ctx.save();
      ctx.translate(lastWp.x, lastWp.y);
      
      // outer ring
      const og = ctx.createRadialGradient(0,0,10,0,0,38);
      og.addColorStop(0,'rgba(40,234,192,0)');
      og.addColorStop(0.6,`rgba(40,234,192,0.08)`);
      og.addColorStop(1,'rgba(40,234,192,0)');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.ellipse(0,0,38,14,0,0,Math.PI*2);
      ctx.fill();

      // spinning ring segments
      for(let i=0; i<6; i++){
        const a = ot*1.4 + i*Math.PI/3;
        const x = Math.cos(a)*26, y = Math.sin(a)*10;
        ctx.globalAlpha = 0.35 + Math.sin(ot*2+i)*0.15;
        ctx.strokeStyle = '#28EAC0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x,y,2.5,0,Math.PI*2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // core orb glow
      const cg = ctx.createRadialGradient(0,0,0,0,0,18);
      cg.addColorStop(0,'rgba(200,255,245,0.9)');
      cg.addColorStop(0.3,'rgba(40,234,192,0.6)');
      cg.addColorStop(0.7,'rgba(20,160,130,0.2)');
      cg.addColorStop(1,'rgba(20,160,130,0)');
      ctx.globalAlpha = 0.7 + Math.sin(ot*3)*0.15;
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.ellipse(0,0,18,7,0,0,Math.PI*2);
      ctx.fill();

      // inner bright dot
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = '#28EAC0';
      ctx.shadowBlur = 18;
      ctx.fillStyle = 'rgba(200,255,248,0.95)';
      ctx.beginPath();
      ctx.ellipse(0,0,5,2,0,0,Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }, [slots, path, editMode, mousePos]);

  useEffect(() => {
    let raf: number;
    const loop = (t: number) => {
      drawPreview(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drawPreview]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    
    if (editMode === 'slots') {
      const hit = slots.find(s => Math.hypot(s.x - x, s.y - y) < 20);
      if (hit) {
        setDraggingSlotId(hit.id);
        dragOffset.current = { x: hit.x - x, y: hit.y - y };
        return;
      }
      
      // Add new if no hit and not too close to others
      if (slots.some(s => Math.hypot(s.x - x, s.y - y) < 32)) return;
      const newSlot: Slot = {
        id: slots.length > 0 ? Math.max(...slots.map(s => s.id)) + 1 : 1,
        x, y,
        side: x < 200 ? 'left' : 'right'
      };
      setSlots([...slots, newSlot]);
    } else {
      const hitIdx = path.findIndex(p => Math.hypot(p.x - x, p.y - y) < 12);
      if (hitIdx !== -1) {
        setDraggingPathIdx(hitIdx);
        dragOffset.current = { x: path[hitIdx].x - x, y: path[hitIdx].y - y };
        return;
      }
      setPath([...path, { x, y }]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    if (draggingSlotId !== null) {
      setSlots(prev => prev.map(s => s.id === draggingSlotId ? { 
        ...s, 
        x: x + dragOffset.current.x, 
        y: y + dragOffset.current.y, 
        side: (x + dragOffset.current.x) < 200 ? 'left' : 'right' 
      } : s));
    } else if (draggingPathIdx !== null) {
      setPath(prev => prev.map((p, i) => i === draggingPathIdx ? { 
        x: x + dragOffset.current.x, 
        y: y + dragOffset.current.y 
      } : p));
    }
  };

  const handlePointerUp = () => {
    setDraggingSlotId(null);
    setDraggingPathIdx(null);
  };

  const removeSlot = (id: number) => setSlots(slots.filter(s => s.id !== id));
  const removePathPoint = (idx: number) => {
    if (path.length <= 1) return;
    setPath(path.filter((_, i) => i !== idx));
  };
  const clearPath = () => setPath([{x:200, y:70}]);

  const getConfig = () => ({
    slots: slots.map(({ id, x, y, side }) => ({ id, x, y, r: 16, tower: null, side })),
    path: path,
    waves: [
      { waves: 4, baseMobs: 3, mobMult: 1 },
      { waves: 5, baseMobs: 4, mobMult: 2 },
      { waves: 6, baseMobs: 6, mobMult: 3 },
    ]
  });

  const handleSave = () => {
    onSave(currentLevelId, getConfig());
    setShowSaveConfirm(true);
    setTimeout(() => setShowSaveConfirm(false), 2000);
  };

  const handleTest = () => {
    onTest(getConfig());
  };

  const exportJSON = () => {
    const data = JSON.stringify({ slots, path }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom_level.json';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex overflow-hidden gf">
      {/* Immersive Canvas Area */}
      <div className="absolute inset-0 flex items-center justify-center p-0 bg-[#0b0a16]">
        <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
          {/* Subtle Grid Background (fills the void) */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ 
            backgroundImage: 'radial-gradient(#1cb899 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }} />

          <div className="relative h-full flex items-center justify-center pointer-events-auto" style={{ aspectRatio: '1/2' }}>
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                cursor: (draggingSlotId !== null || draggingPathIdx !== null) ? 'grabbing' : 'crosshair'
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={() => {
                handlePointerUp();
                setMousePos(null);
              }}
              className="shadow-[0_0_100px_rgba(0,0,0,0.5)] touch-none"
            />
            
            {/* Context Widget (Mode indicator) */}
            <div className="absolute top-6 right-6 pointer-events-none bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
               <div className="w-2 h-2 bg-[#00f5c4] rounded-full animate-pulse shadow-[0_0_10px_#00f5c4]" />
               <span className="text-[#00f5c4] text-[10px] font-black tracking-widest uppercase">{editMode === 'slots' ? 'Emplacements' : 'Tracé'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-3 p-2 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 pointer-events-auto shadow-2xl">
          <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 transition-all active:scale-90">
            <ArrowLeft size={18} />
          </button>
          <div className="pr-4">
            <h2 className="text-white font-black text-sm tracking-tighter uppercase leading-none">ÉDITEUR - NVX.{currentLevelId}</h2>
            <span className="text-white/20 text-[8px] font-bold uppercase tracking-widest">{editMode} mode</span>
          </div>
        </div>
      </div>

      {/* Floating Control Panel */}
      <div className={`absolute bottom-6 right-6 left-6 md:left-auto md:w-[320px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-500 ease-in-out ${isCollapsed ? 'translate-y-[calc(100%-80px)] opacity-60' : 'translate-y-0'}`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-8 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-t-xl flex items-center justify-center hover:bg-white/5 transition-all pointer-events-auto shadow-2xl"
        >
          {isCollapsed ? <ChevronUp size={16} className="text-[#00f5c4]" /> : <ChevronDown size={16} className="text-white/40" />}
        </button>

        {/* Level Selector */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Layers size={12} className="text-[#00f5c4]" />
            <span className="text-white/40 text-[9px] font-black tracking-widest uppercase">Éditer NVX.</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map(id => (
              <button
                key={id}
                onClick={() => loadLevel(id)}
                className={`h-8 rounded-lg border mf font-black text-[11px] transition-all
                  ${currentLevelId === id 
                    ? 'bg-[#00f5c4]/20 border-[#00f5c4] text-[#00f5c4] shadow-[0_0_10px_#00f5c430]' 
                    : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl mb-6 border border-white/5 shrink-0">
          <button 
            onClick={() => setEditMode('slots')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${editMode === 'slots' ? 'bg-[#00f5c4] text-[#0b0a16] shadow-[0_0_20px_rgba(0,245,196,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            <Cpu size={14} /> SLOTS
          </button>
          <button 
            onClick={() => setEditMode('path')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${editMode === 'path' ? 'bg-[#00f5c4] text-[#0b0a16] shadow-[0_0_20px_rgba(0,245,196,0.3)]' : 'text-white/40 hover:text-white'}`}
          >
            <Waypoints size={14} /> TRACÉ
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {editMode === 'slots' ? (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-white/40 text-[10px] font-black tracking-widest uppercase">Slots ({slots.length})</h3>
              </div>
              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar pb-4">
                {slots.length === 0 && (
                  <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-white/20 text-[10px] uppercase font-bold tracking-widest">Appuyez pour ajouter</p>
                  </div>
                )}
                {slots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00f5c4]/10 flex items-center justify-center text-[#00f5c4] text-[10px] font-black">
                        #{slot.id}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[8px] mf uppercase font-bold">{slot.side}</span>
                        <span className="text-white/20 text-[7px] mf">X:{Math.round(slot.x)} Y:{Math.round(slot.y)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeSlot(slot.id)} className="p-2 text-white/10 hover:text-red-400 transition-colors bg-white/5 rounded-xl hover:bg-red-400/10">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-white/40 text-[10px] font-black tracking-widest uppercase">Waypoints ({path.length})</h3>
                <button onClick={clearPath} className="text-[9px] text-red-400/60 font-black uppercase hover:text-red-400">RESET</button>
              </div>
              <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar pb-4">
                {path.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 rounded-xl group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2">
                       <span className="text-white/60 font-black text-[10px] tracking-tighter">P{i+1}</span>
                       <span className="text-white/20 text-[8px] mf">➔</span>
                       <span className="text-white/20 text-[7px] mf uppercase">x:{Math.round(p.x)} y:{Math.round(p.y)}</span>
                    </div>
                    {path.length > 1 && (
                      <button onClick={() => removePathPoint(i)} className="p-1.5 text-white/10 hover:text-red-400 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 mt-4 border-t border-white/5 space-y-3 shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleSave} 
              className={`py-4 rounded-2xl border font-black tracking-widest text-[10px] active:scale-95 transition-all uppercase flex items-center justify-center gap-2
                ${showSaveConfirm ? 'bg-[#00f5c4]/20 border-[#00f5c4] text-[#00f5c4]' : 'bg-white/5 border-white/10 text-white'}`}
            >
              {showSaveConfirm ? <><Check size={14} /> ENREGISTRÉ !</> : 'Sauvegarder'}
            </button>
            <button onClick={handleTest} className="py-4 rounded-2xl bg-[#00f5c4] text-[#0b0a16] font-black tracking-[0.2em] text-[11px] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,245,196,0.3)] uppercase">
              TESTER
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={exportJSON} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black tracking-widest hover:bg-white/10 transition-all uppercase">
              <Download size={12} /> JSON
            </button>
            <button className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white/30 text-[10px] font-black tracking-widest opacity-50 cursor-not-allowed uppercase">
              <Upload size={12} /> IMPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
