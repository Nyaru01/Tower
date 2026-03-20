import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, ArrowLeft, Download, Upload, Cpu, Waypoints, ChevronDown, ChevronUp, Check, Plus } from 'lucide-react';
import { INITIAL_LEVELS } from '../game/constants';

const CW = 400, CH = 800;

interface Point { x: number; y: number; z?: number; }
interface Slot { id: number; x: number; y: number; side: 'left' | 'right'; }

interface LevelEditorProps {
  onBack: () => void;
  onSave: (id: number, config: any) => void;
  onTest: (config: any) => void;
  initialConfig?: any;
  initialLevelId?: number;
  officialLevels?: Record<number, any>;
}

export default function LevelEditor({ onBack, onSave, onTest, initialConfig, initialLevelId = 1, officialLevels = {} }: LevelEditorProps) {
  const [editMode, setEditMode] = useState<'slots' | 'path'>('slots');
  const [altitudeMode, setAltitudeMode] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState(initialLevelId);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [slots, setSlots] = useState<Slot[]>(initialConfig?.slots?.map((s:any, i:number)=>({id:s.id||i+1, x:s.x, y:s.y, side:s.side})) || []);
  const [path, setPath] = useState<Point[]>(initialConfig?.path || [{x:200, y:70}, {x:200, y:675}]);
  const [bgColor, setBgColor] = useState(initialConfig?.bgColor || '#1cb899');
  
  const addNewLevel = () => {
    const ids = Object.keys(officialLevels || {})?.map(Number);
    const nextId = (ids && ids.length > 0 ? Math.max(...ids) : 5) + 1;
    setCurrentLevelId(nextId);
    setSlots([]);
    setPath([{x:200, y:70}, {x:200, y:675}]);
    setBgColor('#1cb899');
  };

  const loadLevel = (id: number) => {
    setCurrentLevelId(id);
    const config = (officialLevels || {})[id] || INITIAL_LEVELS[id];
    if (config) {
      setSlots((config.slots || [])?.map((s:any, i:number)=>({id:s.id||i+1, x:s.x, y:s.y, side:s.side})));
      setPath(config.path || [{x:200, y:70}, {x:200, y:675}]);
      setBgColor(config.bgColor || '#1cb899');
    }
  };
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<number | null>(null);
  const [draggingPathIdx, setDraggingPathIdx] = useState<number | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    const px = (path || [])?.map(p => p.x);
    const py = (path || [])?.map(p => p.y);
    (slots || [])?.forEach(s => { px.push(s.x); py.push(s.y); });
    
    // Symmetrical Centering Logic (Matching App.tsx Immersive)
    const pad = 50;
    const maxCX = Math.max(...(px || [])?.map((x: number) => Math.abs(x - CW/2)), 100);
    const bw = maxCX * 2 + pad * 2;
    const bh = CH + 400;
    const bx = CW/2 - bw/2;
    const by = -200;

    ctx.fillStyle = '#0b0a16';
    ctx.fillRect(0, 0, CW, CH);

    // Draw full-height platform with selected background color
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 0);
    ctx.fill();
    
    // Subtle overlay gradient for depth
    const ag=ctx.createLinearGradient(bx,by,bx,by+bh);
    ag.addColorStop(0,'rgba(255,255,255,0.1)');
    ag.addColorStop(0.5,'rgba(255,255,255,0)');
    ag.addColorStop(1,'rgba(0,0,0,0.1)');
    ctx.fillStyle=ag; ctx.fill();
    const ig=ctx.createLinearGradient(bx,by,bx+bw/3,by+bh/3);ig.addColorStop(0,'rgba(255,255,255,0.07)');ig.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=ig;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,0);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,0);ctx.stroke();

    // --- SYSTÈME DE RENDU ÉLITE V6 (Soudure Séquentielle) ---
    const strips: {z: number, pts: Point[], isRamp?: boolean, z1?: number, z2?: number, seq: number}[] = [];
    if (path.length > 0) {
      for (let i = 1; i < path.length; i++) {
        const p1 = path[i-1], p2 = path[i];
        const z1 = p1.z || 0, z2 = p2.z || 0;
        if (z1 !== z2) {
          strips.push({ z: Math.max(z1, z2), pts: [p1, p2], isRamp: true, z1, z2, seq: i });
        } else {
          const last = strips[strips.length-1];
          if (last && !last.isRamp && last.z === z1) last.pts.push(p2);
          else strips.push({ z: z1, pts: [p1, p2], seq: i });
        }
      }
    }

    const drawPath = (pts: Point[], width: number, color: string, isDashed: boolean = false, cap: CanvasLineCap = 'round') => {
      ctx.beginPath();
      pts.forEach((p, i) => {
        if(i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.lineCap = cap; ctx.lineJoin = 'round';
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      if (isDashed) ctx.setLineDash([10, 20]);
      ctx.stroke();
      if (isDashed) ctx.setLineDash([]);
    };

    // 1. Passe d'Ombre
    strips.forEach(strip => {
      if (strip.z > 0 || strip.isRamp) {
        ctx.save();
        if (strip.isRamp) {
          const p1 = strip.pts[0], p2 = strip.pts[strip.pts.length-1];
          const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          const isUp = (strip.z2||0) > (strip.z1||0);
          grad.addColorStop(isUp?0:1, 'rgba(0,0,0,0)');
          grad.addColorStop(isUp?1:0, 'rgba(0,0,0,0.4)');
          drawPath(strip.pts, 60, grad as any, false, 'butt');
        } else {
          ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 18;
          ctx.shadowOffsetX = 12; ctx.shadowOffsetY = 16;
          drawPath(strip.pts, 60, 'rgba(0,0,0,0.3)', false, 'butt');
        }
        ctx.restore();
      }
    });

    // 2. Lueur Globale Manuelle
    ctx.globalCompositeOperation = 'screen';
    const drawGlowPath = (width: number, color: any) => {
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'butt';
      path?.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Embouts de lueur
      if (path && path.length > 0) {
        [(path || [])[0], (path || [])[path.length-1]]?.forEach(p => {
          if (p) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, width/2, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
          }
        });
      }
    };
    drawGlowPath(74, 'rgba(0, 245, 196, 0.12)');
    ctx.globalCompositeOperation = 'source-over';

    // 3. Rendu Principal (Élite V6)
    const maxZ = path && path.length > 0 ? Math.max(...path?.map(p => p.z || 0)) : 0;
    for (let z = 0; z <= maxZ; z++) {
      const layerStrips = (strips || [])
        .filter(s => (s.z || 0) === z || (s.isRamp && Math.max(s.z1||0, s.z2||0) === z))
        .sort((a,b) => a.seq - b.seq);
      
      if (layerStrips.length > 0) {
        const drawLayerPath = (width: number, color: any, dashed: boolean = false) => {
          ctx.beginPath();
          ctx.lineWidth = width;
          ctx.strokeStyle = color;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'butt'; 

          let lastP: Point | null = null;
          layerStrips?.forEach(strip => {
            strip.pts?.forEach((p, i) => {
              if (i === 0 && (!lastP || Math.abs(lastP.x - p.x) > 0.5 || Math.abs(lastP.y - p.y) > 0.5)) {
                ctx.moveTo(p.x, p.y);
              } else {
                ctx.lineTo(p.x, p.y);
              }
              lastP = p;
            });
          });
          if (dashed) ctx.setLineDash([10, 20]);
          ctx.stroke();
          if (dashed) ctx.setLineDash([]);

          // Embouts Manuels
          layerStrips?.forEach(strip => {
            strip.pts?.forEach(p => {
              const isExtreme = (path && path.length > 0 && ((Math.abs(p.x - path[0].x) < 0.5 && Math.abs(p.y - path[0].y) < 0.5) || 
                               (Math.abs(p.x - path[path.length-1].x) < 0.5 && Math.abs(p.y - path[path.length-1].y) < 0.5)));
              if (isExtreme) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, width/2, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
              }
            });
          });
        };

        drawLayerPath(66, '#00f5c4');
        drawLayerPath(60, '#0b0a16');
        drawLayerPath(2, 'rgba(0, 245, 196, 0.25)', true);
      }
    }

    // --- ÉDITION : WAYPOINTS ---
    if (editMode === 'path') {
      if (mousePos && path.length > 0) {
        const last = path[path.length - 1];
        ctx.strokeStyle = altitudeMode ? 'rgba(0, 245, 196, 0.4)' : 'rgba(28, 184, 153, 0.3)';
        ctx.lineWidth = altitudeMode ? 4 : 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      path?.forEach((p, _idx) => {
        const isElevated = (p?.z || 0) > 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isElevated ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isElevated ? '#00f5c4' : '#1cb899';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = isElevated ? 3 : 2;
        ctx.stroke();
        
        if (isElevated) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0, 245, 196, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });
    }

    // Draw existing slots
    slots?.forEach(slot => {
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
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    }


  }, [slots, path, editMode, mousePos, altitudeMode, bgColor]);

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
      const hit = (slots || [])?.find(s => Math.hypot(s.x - x, s.y - y) < 20);
      if (hit) {
        setDraggingSlotId(hit.id);
        dragOffset.current = { x: hit.x - x, y: hit.y - y };
        return;
      }
      
      // Add new if no hit and not too close to others
      if ((slots || [])?.some(s => Math.hypot(s.x - x, s.y - y) < 32)) return;
      const newSlot: Slot = {
        id: (slots && slots.length > 0) ? Math.max(...slots.map(s => s.id)) + 1 : 1,
        x, y,
        side: x < 200 ? 'left' : 'right'
      };
      setSlots([...(slots || []), newSlot]);
    } else {
      const hitIdx = path.findIndex(p => Math.hypot(p.x - x, p.y - y) < 12);
      if (hitIdx !== -1) {
        setDraggingPathIdx(hitIdx);
        dragOffset.current = { x: path[hitIdx].x - x, y: path[hitIdx].y - y };
        return;
      }
      setPath([...path, { x, y, z: altitudeMode ? 1 : 0 }]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    setMousePos({ x, y });

    if (draggingSlotId !== null) {
      setSlots(prev => (prev || [])?.map(s => s.id === draggingSlotId ? { 
        ...s, 
        x: x + dragOffset.current.x, 
        y: y + dragOffset.current.y, 
        side: (x + dragOffset.current.x) < 200 ? 'left' : 'right' 
      } : s));
    } else if (draggingPathIdx !== null) {
      setPath(prev => (prev || [])?.map((p, i) => i === draggingPathIdx ? { 
        ...p,
        x: x + dragOffset.current.x, 
        y: y + dragOffset.current.y 
      } : p));
    }
  };

  const handlePointerUp = () => {
    setDraggingSlotId(null);
    setDraggingPathIdx(null);
  };

  const removeSlot = (id: number) => setSlots((slots || [])?.filter(s => s.id !== id));
  const removePathPoint = (idx: number) => {
    if ((path || [])?.length <= 1) return;
    setPath((path || [])?.filter((_, i) => i !== idx));
  };
  const clearPath = () => setPath([{x:200, y:70, z:0}]);

  const togglePointAltitude = (idx: number) => {
    setPath(prev => (prev || [])?.map((p, i) => i === idx ? { ...p, z: (p.z || 0) > 0 ? 0 : 1 } : p));
  };

  const getConfig = () => ({
    slots: (slots || [])?.map(({ id, x, y, side }) => ({ id, x, y, r: 16, tower: null, side })),
    path: path,
    bgColor: bgColor,
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

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        if (config?.slots) {
          setSlots(config.slots?.map((s:any, i:number)=>({
            id: s.id || i+1,
            x: s.x,
            y: s.y,
            side: s.side || (s.x < 200 ? 'left' : 'right')
          })));
        }
        if (config.path) setPath(config.path);
        if (config.bgColor) setBgColor(config.bgColor);
      } catch (e) {
        alert("Erreur lors de l'import : format invalide.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const exportJSON = () => {
    const data = JSON.stringify({ slots, path, bgColor }, null, 2);
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
            
          </div>
        </div>
      </div>

      {/* Minimalist Header */}
      <div className="absolute top-6 left-6 p-0 pointer-events-none z-[160]">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-white/40 hover:text-white transition-all active:scale-90 pointer-events-auto shadow-xl flex items-center justify-center">
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* Floating Control Panel */}
      <div className={`absolute top-6 bottom-6 right-6 left-6 md:left-auto md:w-[350px] bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 flex flex-col shadow-[0_30px_60px_rgba(0,0,0,0.8)] transition-all duration-500 ease-in-out pointer-events-none z-[150] ${isCollapsed ? 'translate-y-[calc(100%-40px)] opacity-40' : 'translate-y-0'}`}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-8 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-t-xl flex items-center justify-center hover:bg-white/5 transition-all pointer-events-auto shadow-2xl"
        >
          {isCollapsed ? <ChevronUp size={16} className="text-[#00f5c4]" /> : <ChevronDown size={16} className="text-white/40" />}
        </button>

        {/* Level Selector unified in Panel */}
        <div className="mb-6 pointer-events-auto">
          <h3 className="text-white/20 text-[10px] font-black tracking-widest uppercase mb-3 px-1">Choisir Niveau</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set([1, 2, 3, 4, 5, ...Object.keys(officialLevels).map(Number)]))
              .sort((a, b) => a - b)
              .map(id => (
                <button
                  key={id}
                  onClick={() => loadLevel(id)}
                  className={`w-10 h-10 rounded-xl font-black text-sm transition-all flex items-center justify-center border
                    ${currentLevelId === id 
                      ? 'bg-[#00f5c4] text-[#0b0a16] border-[#00f5c4] shadow-[0_0_15px_rgba(0,245,196,0.3)]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'}`}
                >
                  {id}
                </button>
              ))}
            <button
              onClick={addNewLevel}
              className="w-10 h-10 rounded-xl border-2 border-dashed border-white/10 text-white/20 hover:text-[#00f5c4] hover:border-[#00f5c4]/40 hover:bg-[#00f5c4]/5 transition-all flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        <div className="mb-6 pointer-events-auto">
          <h3 className="text-white/20 text-[10px] font-black tracking-widest uppercase mb-3 px-1">Couleur du Sol</h3>
          <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20">
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e) => setBgColor(e.target.value)}
                className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
              />
            </div>
            <span className="mf text-[10px] text-white/60 font-black uppercase tracking-widest">{bgColor}</span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl mb-4 border border-white/5 shrink-0 pointer-events-auto">
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

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 pointer-events-auto overflow-hidden">
          {editMode === 'slots' ? (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                <h3 className="text-white/40 text-[10px] font-black tracking-widest uppercase">Slots ({slots.length})</h3>
              </div>
              <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
                {slots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-2xl group hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#00f5c4]/10 flex items-center justify-center text-[#00f5c4] text-[10px] font-black">
                        #{slot.id}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white/40 text-[8px] uppercase font-bold">{slot.side}</span>
                        <span className="text-white/20 text-[7px]">X:{Math.round(slot.x)} Y:{Math.round(slot.y)}</span>
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
              <div className="flex justify-between items-center mb-4 shrink-0 px-1">
                <h3 className="text-white/40 text-[10px] font-black tracking-widest uppercase">Waypoints ({path.length})</h3>
                <div className="flex gap-2 items-center">
                   <button onClick={() => setAltitudeMode(!altitudeMode)} className={`px-2 py-1 rounded-lg border text-[8px] font-black transition-all ${altitudeMode ? 'bg-[#00f5c4]/20 border-[#00f5c4] text-[#00f5c4]' : 'bg-white/5 border-white/10 text-white/20'}`}>ALT</button>
                   <button onClick={clearPath} className="text-[9px] text-red-400/60 font-black uppercase hover:text-red-400 ml-2">RESET</button>
                </div>
              </div>
              <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
                {path.map((p, i) => (
                  <div key={i} className={`flex items-center justify-between p-2.5 bg-white/5 border rounded-xl group transition-all ${p.z ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5'}`}>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => togglePointAltitude(i)}>
                       <span className={`font-black text-[10px] tracking-tighter ${p.z ? 'text-cyan-400' : 'text-white/60'}`}>P{i+1}</span>
                       <span className="text-white/20 text-[8px]">➔</span>
                       <span className="text-white/20 text-[7px] uppercase">x:{Math.round(p.x)} y:{Math.round(p.y)}</span>
                       {p.z ? <Waypoints size={10} className="text-cyan-400 ml-1" /> : null}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePointAltitude(i)} className={`p-1.5 rounded-lg transition-colors ${p.z ? 'text-cyan-400 bg-cyan-400/10' : 'text-white/10 hover:bg-white/5'}`}>
                        <Cpu size={11} />
                      </button>
                      {path.length > 1 && (
                        <button onClick={() => removePathPoint(i)} className="p-1.5 text-white/10 hover:text-red-400 transition-colors">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 mt-4 border-t border-white/5 space-y-3 shrink-0 pointer-events-auto">
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
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black tracking-widest hover:bg-[#00f5c4]/10 hover:text-[#00f5c4] hover:border-[#00f5c4]/40 transition-all uppercase"
            >
              <Upload size={12} /> IMPORT
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={importJSON} 
              accept=".json" 
              style={{ display: 'none' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
