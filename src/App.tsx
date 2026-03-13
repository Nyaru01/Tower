import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, FastForward, X, Flame, Skull, Zap, Dna, RotateCcw, Trophy, Star, Heart, Wind, DollarSign, Tag } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import MainMenu from './ui/MainMenu';
import LevelEditor from './ui/LevelEditor';
import { 
  CW, CH, C, TOWER_TYPES, TALENT_TREE, computeBonuses, getLevelData, pickRewards, TM_CYCLE, TM_LABELS, INITIAL_LEVELS,
  type TalentBonuses, type Reward
} from './game/constants';
import { FloatingText, Particle, RingBurst, AoeBlast } from './game/entities/effects';
import { Projectile } from './game/entities/Projectile';
import { Enemy } from './game/entities/Enemy';
import { Tower } from './game/entities/Tower';
import TalentModal from './ui/TalentModal';
import SettingsModal from './ui/SettingsModal';
import IntroScreen from './ui/IntroScreen';
import { setMasterVolume } from './game/utils/audio';
import { GameAPI } from './game/api';

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [diamonds,setDiamonds]=useState(100);
  const dRef=useRef(100);
  const setDia=useCallback((v:number|((p:number)=>number))=>{
    setDiamonds(prev=>{const n=typeof v==='function'?v(prev):v;dRef.current=n;return n;});
  },[]);
  const addDia=useCallback((n:number)=>setDia(p=>p+n),[setDia]);
  const [unlockedTalents,setUnlockedTalents]=useState<Set<string>>(new Set());
  const [talentPoints,setTalentPoints]=useState(0);
  const [showTalents,setShowTalents]=useState(false);
  const [showPauseModal,setShowPauseModal]=useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pt_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMasterVolume(parsed.volume);
      return parsed;
    }
    return { volume: 0.5, effects: true, bloom: true };
  });

  // Cloud Sync Logic
  const syncWithCloud = useCallback(async () => {
    const tid = GameAPI.getTerminalId();
    const data = {
      terminalId: tid,
      diamonds,
      talentPoints,
      maxLevelUnlocked,
      unlockedTalents: Array.from(unlockedTalents)
    };
    await GameAPI.syncProgress(data);
  }, [diamonds, talentPoints, maxLevelUnlocked, unlockedTalents]);

  // Persistence: Load
  useEffect(() => {
    const loadAll = async () => {
      // Local load first
      const s_dia = localStorage.getItem('pt_diamonds');
      if (s_dia) { setDia(Number(s_dia)); dRef.current = Number(s_dia); }
      const s_talents = localStorage.getItem('pt_talents');
      if (s_talents) {
        try {
          const parsed = JSON.parse(s_talents);
          setUnlockedTalents(new Set(parsed));
          bonusesRef.current = computeBonuses(new Set(parsed));
        } catch(e) {}
      }
      const s_pts = localStorage.getItem('pt_talent_points');
      if (s_pts) setTalentPoints(Number(s_pts));
      const s_maxLvl = localStorage.getItem('pt_max_level');
      if (s_maxLvl) setMaxLevelUnlocked(Number(s_maxLvl));
      const s_custom = localStorage.getItem('pt_custom_levels');
      if (s_custom) {
        try { setCustomLevels(JSON.parse(s_custom)); } catch(e) {}
      }

      // Cloud attempt
      const tid = GameAPI.getTerminalId();
      const cloudData = await GameAPI.loadProgress(tid);
      if (cloudData) {
        setDia(cloudData.diamonds);
        setTalentPoints(cloudData.talentPoints);
        setMaxLevelUnlocked(cloudData.maxLevelUnlocked);
        setUnlockedTalents(new Set(cloudData.unlockedTalents));
        bonusesRef.current = computeBonuses(new Set(cloudData.unlockedTalents));
        if (cloudData.customLevels) {
          const levels: any = {};
          cloudData.customLevels.forEach((l: any) => { levels[l.levelNumber] = l.data; });
          setCustomLevels(prev => ({ ...prev, ...levels }));
        }
      }
    };
    loadAll();
  }, [setDia]);

  // Persistence: Save
  useEffect(() => {
    if (!showIntro) {
      localStorage.setItem('pt_diamonds', String(diamonds));
      localStorage.setItem('pt_talents', JSON.stringify(Array.from(unlockedTalents)));
      localStorage.setItem('pt_talent_points', String(talentPoints));
      localStorage.setItem('pt_max_level', String(maxLevelUnlocked));
    }
    
    // Throttled cloud sync
    const timer = setTimeout(syncWithCloud, 2000);
    return () => clearTimeout(timer);
  }, [diamonds, unlockedTalents, talentPoints, maxLevelUnlocked, showIntro, syncWithCloud]);
  const [isInMenu,setIsInMenu]=useState(true);
  const [isInEditor,setIsInEditor]=useState(false);
  const [customLevels, setCustomLevels] = useState<Record<number, any>>({});
  const [levelRewards,setLevelRewards]=useState<Reward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const freeUpgradeRef=useRef(false);
  const goldRushRef=useRef(false);
  const speedBoostRef=useRef(false);
  const towerDiscountRef=useRef(false);
  const bonusesRef=useRef<TalentBonuses>(computeBonuses(new Set()));
  useEffect(()=>{bonusesRef.current=computeBonuses(unlockedTalents);},[unlockedTalents]);
  const handleUnlockTalent=useCallback((id:string)=>{
    const node=TALENT_TREE.find(t=>t.id===id);if(!node)return;
    setTalentPoints(p=>{if(p<node.cost)return p;return p-node.cost;});
    setUnlockedTalents(prev=>{const s=new Set(prev);s.add(id);bonusesRef.current=computeBonuses(s);return s;});
  },[]);
  const [isPlaying,setIsPlaying]=useState(true);
  const isPlayingRef=useRef(true);
  const [gameSpeed,setGameSpeed]=useState(1);
  const [selSlotId,setSelSlotId]=useState<number|null>(null);
  const selSlotIdRef=useRef<number|null>(null);
  const [shopSlotId,setShopSlotId]=useState<number|null>(null);
  const [waveAnnounce,setWaveAnnounce]=useState<{text:string}|null>(null);
  const [uiState,setUiState]=useState({level:1,wave:1,maxWaves:4,status:'idle',baseHp:10,kills:0,enemiesLeft:0,totalEnemies:0,bossHp:0,bossMaxHp:0,bossPoints:0});
  const [activeBuffs,setActiveBuffs]=useState({freeUpgrade:false,speedBoost:false,goldRush:false,towerDiscount:false});
  const [autoCountdown,setAutoCountdown]=useState(0);

  const gs=useRef<any>({
    lastTime:0,speedMultiplier:1,shakeTime:0,flashAlpha:0,
    enemies:[],projectiles:[],particles:[],floatingTexts:[],orbParticles:[],rings:[],aoeBlasts:[],
    spawnTimer:0,enemiesToSpawn:0,totalWaveEnemies:0,waveActive:false,
    autoWaveTimer:0,
    level:1,wave:1,status:'idle',baseHp:10,kills:0,bossPoints:0,
    slots:[], path:[{x:200,y:70},{x:200,y:675}],
    bokeh:Array.from({length:22}).map(()=>{const l=Math.random()>0.5;return{x:l?62+Math.random()*58:280+Math.random()*58,y:140+Math.random()*560,r:4+Math.random()*13,speed:8+Math.random()*18,alpha:0.03+Math.random()*0.12};}),
  });

  const syncUI=useCallback(()=>{
    const s=gs.current;const left=s.enemies.length+s.enemiesToSpawn;
    const boss=s.enemies.find((e:any)=>e.isBoss);
    setUiState({level:s.level,wave:s.wave,maxWaves:getLevelData(s.level).waves,status:s.status,
      baseHp:s.baseHp,kills:s.kills,enemiesLeft:left,totalEnemies:s.totalWaveEnemies,
      bossHp:boss?boss.hp:0,bossMaxHp:boss?boss.maxHp:0,bossPoints:s.bossPoints||0});
    setAutoCountdown(s.status==='idle'?Math.ceil(s.autoWaveTimer):0);
  },[]);

  // Initialize slots based on level
  const initLevel = useCallback((lvl: number) => {
    const s = gs.current;
    s.level = lvl;
    s.enemies = [];
    s.projectiles = [];
    s.particles = [];
    s.floatingTexts = [];
    s.rings = [];
    s.aoeBlasts = [];
    s.orbParticles = [];
    s.wave = 1;
    s.status = 'idle';
    
    // Check custom levels first, then initial levels, then procedural
    const lvlConfig = customLevels[lvl] || INITIAL_LEVELS[lvl];
    
    if (lvlConfig) {
      s.path = lvlConfig.path || [{x:200,y:70},{x:200,y:675}];
      s.slots = lvlConfig.slots.map((sl: any) => ({ ...sl, tower: null }));
    } else {
      // Procedural fallback for levels > Max
      s.path = [{x:200,y:70},{x:200,y:750}];
      s.slots = [
        {id:1,x:106,y:250,r:16,tower:null,side:'left'}, {id:2,x:294,y:250,r:16,tower:null,side:'right'},
        {id:3,x:106,y:400,r:16,tower:null,side:'left'}, {id:4,x:294,y:400,r:16,tower:null,side:'right'},
        {id:5,x:106,y:550,r:16,tower:null,side:'left'}, {id:6,x:294,y:550,r:16,tower:null,side:'right'},
      ];
    }
  }, [customLevels]);

  useEffect(() => {
    if (!isInMenu && !isInEditor && uiState.level === 1 && gs.current.slots.length === 0) {
      initLevel(1);
      syncUI();
    }
  }, [isInMenu, isInEditor, initLevel, syncUI, uiState.level]);

  useEffect(()=>{gs.current.speedMultiplier=gameSpeed;},[gameSpeed]);
  useEffect(()=>{isPlayingRef.current=isPlaying;},[isPlaying]);

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio('/Music/1.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    bgMusicRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, []);
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        bgMusicRef.current?.pause();
        import('./game/utils/audio').then(m => m.audioCtx.suspend());
      } else if (!isInMenu && !showPauseModal) {
        bgMusicRef.current?.play().catch(() => {});
        import('./game/utils/audio').then(m => m.audioCtx.resume());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isInMenu, showPauseModal]);

  useEffect(() => {
    if (bgMusicRef.current) {
      if (!isInMenu && !showPauseModal && !document.hidden) bgMusicRef.current.play().catch(()=>{});
      else bgMusicRef.current.pause();
    }
  }, [isInMenu, showPauseModal]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d')!;let raf:number;
    const spawnOrb=(s:any)=>{
      if(!s.path.length) return;
      const last = s.path[s.path.length - 1];
      const a=Math.random()*Math.PI*2,r=10+Math.random()*16;
      s.orbParticles.push({
        x:last.x+Math.cos(a)*r,
        y:last.y+Math.sin(a)*r*0.35,
        vx:(Math.random()-0.5)*12,
        vy:-8-Math.random()*18,
        life:1.0,
        size:2+Math.random()*3.5,
        hue:160+Math.random()*40
      });
    };

    const drawScene=(ts:number)=>{
      const state=gs.current;
      // Calculate dynamic background plate
      const px = state.path.map((p:any)=>p.x), py = state.path.map((p:any)=>p.y);
      state.slots.forEach((s:any)=>{px.push(s.x);py.push(s.y);});
      
      // Symmetrical Centering Logic
      const pad = 50;
      const maxCX = Math.max(...px.map((x: number) => Math.abs(x - CW/2)), 100);
      const maxCY = Math.max(...py.map((y: number) => Math.abs(y - CH/2)), 200);
      const bw = maxCX * 2 + pad * 2;
      const bh = maxCY * 2 + pad * 2;
      const bx = CW/2 - bw/2;
      const by = CH/2 - bh/2;

      ctx.fillStyle=C.bg;ctx.fillRect(0,0,CW,CH);
      ctx.strokeStyle=C.grid;ctx.lineWidth=1;
      for(let i=0;i<=CW;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,CH);ctx.stroke();}
      for(let i=0;i<=CH;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(CW,i);ctx.stroke();}
      let sx=0,sy=0;if(state.shakeTime>0){sx=(Math.random()-0.5)*13*state.shakeTime;sy=(Math.random()-0.5)*13*state.shakeTime;}
      ctx.save();ctx.translate(sx,sy);
      
      // Dynamic Plate Rendering
      ctx.fillStyle='rgba(0,0,0,0.48)';ctx.beginPath();ctx.roundRect(bx+8,by+8,bw,bh,18);ctx.fill();
      const ag=ctx.createLinearGradient(bx,by,bx+bw,by+bh);ag.addColorStop(0,'#1cb899');ag.addColorStop(0.5,'#17a68a');ag.addColorStop(1,'#0f8070');
      ctx.fillStyle=ag;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,16);ctx.fill();
      const ig=ctx.createLinearGradient(bx,by,bx+bw/3,by+bh/3);ig.addColorStop(0,'rgba(255,255,255,0.07)');ig.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=ig;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,16);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bx,by,bw,bh,16);ctx.stroke();
      // Path rendering: Refined "Neon Corridor"
      const pathPath = new Path2D();
      state.path.forEach((p:any, i:number) => {
        if(i===0) pathPath.moveTo(p.x, p.y);
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

      // 3. Main Corridor Fill (cuts through to create borders)
      ctx.strokeStyle = '#0b0a16';
      ctx.lineWidth = 60;
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 15;
      ctx.stroke(pathPath);
      ctx.shadowBlur = 0;

      // 4. Subtle Center Detail
      ctx.strokeStyle = 'rgba(0, 245, 196, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 20]);
      ctx.stroke(pathPath);
      ctx.setLineDash([]);
      state.bokeh.forEach((p:any)=>{const bg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);bg.addColorStop(0,`rgba(40,234,192,${p.alpha*1.5})`);bg.addColorStop(1,'rgba(40,234,192,0)');ctx.fillStyle=bg;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
      // Crystal orb portal at base
      const ot=ts*0.001;
      const lastWp=state.path[state.path.length-1];
      ctx.save();ctx.translate(lastWp.x,lastWp.y);
      // outer ring
      const og=ctx.createRadialGradient(0,0,10,0,0,38);og.addColorStop(0,'rgba(40,234,192,0)');og.addColorStop(0.6,`rgba(40,234,192,0.08)`);og.addColorStop(1,'rgba(40,234,192,0)');
      ctx.fillStyle=og;ctx.beginPath();ctx.ellipse(0,0,38,14,0,0,Math.PI*2);ctx.fill();
      // spinning ring segments
      for(let i=0;i<6;i++){const a=ot*1.4+i*Math.PI/3;const x=Math.cos(a)*26,y=Math.sin(a)*10;ctx.globalAlpha=0.35+Math.sin(ot*2+i)*0.15;ctx.strokeStyle='#28EAC0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.stroke();}
      ctx.globalAlpha=1;
      // core orb glow
      const cg=ctx.createRadialGradient(0,0,0,0,0,18);
      cg.addColorStop(0,'rgba(200,255,245,0.9)');cg.addColorStop(0.3,'rgba(40,234,192,0.6)');cg.addColorStop(0.7,'rgba(20,160,130,0.2)');cg.addColorStop(1,'rgba(20,160,130,0)');
      ctx.globalAlpha=0.7+Math.sin(ot*3)*0.15;ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(0,0,18,7,0,0,Math.PI*2);ctx.fill();
      // inner bright dot
      ctx.globalAlpha=0.9;ctx.shadowColor='#28EAC0';ctx.shadowBlur=18;ctx.fillStyle='rgba(200,255,248,0.95)';ctx.beginPath();ctx.ellipse(0,0,5,2,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.globalAlpha=1;
      ctx.restore();
      // orb particles
      ctx.globalCompositeOperation='screen';
      ctx.globalCompositeOperation='screen';
      state.projectiles.forEach((p:any)=>p.draw(ctx));
      state.aoeBlasts.forEach((b:any)=>b.draw(ctx));
      state.particles.forEach((p:any)=>p.draw(ctx));
      ctx.globalCompositeOperation='source-over';

      state.rings.forEach((r:any)=>r.draw(ctx));
      state.floatingTexts.forEach((t:any)=>t.draw(ctx,ts));

      const sid=selSlotIdRef.current;
      state.slots.forEach((slot:any)=>{
        if(slot.tower){slot.tower.draw(ctx,sid===slot.id,bonusesRef.current.sellRatio);}
        else{
          // Effet creusé "Outhold"
          ctx.beginPath();ctx.arc(slot.x,slot.y,12,0,Math.PI*2);
          ctx.fillStyle='rgba(0, 0, 0, 0.2)';ctx.fill();
          ctx.beginPath();ctx.arc(slot.x,slot.y,12,0.1,Math.PI-0.1,false);
          ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1.5;ctx.stroke();
          ctx.beginPath();ctx.arc(slot.x,slot.y,12,Math.PI+0.1,Math.PI*2-0.1,false);
          ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=1.5;ctx.stroke();
        }
      });

      ctx.restore();

      // Final Bloom Overlay (Global)
      if(state.waveActive && settings.bloom) {
        ctx.globalAlpha = 0.05 + Math.sin(ts*0.002)*0.02;
        ctx.fillStyle = '#00f5c4';
        ctx.fillRect(0,0,CW,CH);
        ctx.globalAlpha = 1;
      }

      if(state.flashAlpha>0){ctx.globalAlpha=state.flashAlpha;const fg=ctx.createRadialGradient(CW/2,CH,0,CW/2,CH/2,CH);fg.addColorStop(0,'rgba(255,50,50,0.6)');fg.addColorStop(1,'rgba(255,0,0,0)');ctx.fillStyle=fg;ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1;}
      const vg=ctx.createRadialGradient(CW/2,CH/2,CW*0.28,CW/2,CH/2,CW*0.85);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.5)');ctx.fillStyle=vg;ctx.fillRect(0,0,CW,CH);
    };

    const update=(dt:number)=>{
      const state=gs.current;const bon=bonusesRef.current;let ns=false;
      if(state.shakeTime>0)state.shakeTime-=dt;
      if(state.flashAlpha>0)state.flashAlpha=Math.max(0,state.flashAlpha-dt*4.5);
      if(Math.random()<0.55)spawnOrb(state);
      state.orbParticles=state.orbParticles.filter((p:any)=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.92;p.vy*=0.94;p.life-=dt*2.2;return p.life>0;});
      state.bokeh.forEach((p:any)=>{p.y-=p.speed*dt;if(p.y<128)p.y=710;});
      if(state.waveActive){
        if(state.enemiesToSpawn>0){
          state.spawnTimer-=dt;
          if(state.spawnTimer<=0){
            const ld=getLevelData(state.level);const isBoss=state.wave===ld.waves&&state.enemiesToSpawn===1;
            const abs=(state.level-1)*5+state.wave;
            state.enemies.push(new Enemy(abs,state.path,isBoss));state.enemiesToSpawn--;ns=true;
            state.spawnTimer=isBoss?2.2:Math.max(0.18,0.8-abs*0.02);
          }
        }
        state.enemies=state.enemies.filter((e:Enemy)=>{
          const done=e.update(dt);
          if(done){
            const bd=e.isBoss?5:1;
            const ad=Math.max(1,bd-(e.isBoss?bon.bossReduct:0));
            state.baseHp-=ad;state.shakeTime=e.isBoss?0.95:0.4;state.flashAlpha=e.isBoss?0.4:0.2;ns=true;
            if(state.baseHp<=0){state.baseHp=0;state.status='game_over';setIsPlaying(false);isPlayingRef.current=false;}
            return false;
          }
          return e.hp>0;
        });
        if(state.enemies.length===0&&state.enemiesToSpawn===0&&state.status!=='game_over'){
          state.waveActive=false;const ld=getLevelData(state.level);
          if(state.wave>=ld.waves){
            state.status='level_complete';
            const bonus=Math.floor((20+state.level*5)*bon.levelBonusMult);
            const regen=bon.regenPerLevel;
            const maxHp=10+bon.bonusHp;
            if(regen>0)state.baseHp=Math.min(maxHp,state.baseHp+regen);
            addDia(bonus);
            // Clear per-level buffs
            speedBoostRef.current=false;goldRushRef.current=false;towerDiscountRef.current=false;
            setTalentPoints(p=>p+1);
            setLevelRewards(pickRewards(state.level));
          } else{state.wave++;state.status='idle';state.autoWaveTimer=10;state.autoWaveMax=10;}ns=true;
        }
      }
      state.speedBoost=speedBoostRef.current;
      state.goldRush=goldRushRef.current;
      // Auto-wave countdown when idle (but not for wave 1)
      if(state.status==='idle' && state.wave > 1){
        if(state.autoWaveTimer>0){
          state.autoWaveTimer-=dt;
          const prevCeil=Math.ceil(state.autoWaveTimer+dt);
          const newCeil=Math.ceil(state.autoWaveTimer);
          if(newCeil!==prevCeil)setAutoCountdown(Math.max(0,newCeil));
          if(state.autoWaveTimer<=0){
            // Auto-launch wave
            const ld=getLevelData(state.level);const isBoss=state.wave===ld.waves;
            const total=isBoss?1:Math.floor(ld.baseMobs+state.wave*ld.mobMult);
            state.enemiesToSpawn=total;state.totalWaveEnemies=total;
            state.spawnTimer=0;state.waveActive=true;state.status='playing';state.autoWaveTimer=0;
            setAutoCountdown(0);
            setWaveAnnounce({text:isBoss?'⚠ BOSS':`Vague ${state.wave}/${ld.waves}`});
            setTimeout(()=>setWaveAnnounce(null),1600);
            ns=true;
          }
        }
      }
      state.slots.forEach((slot:any)=>{if(slot.tower)slot.tower.update(dt,state,bon);});
      state.projectiles=state.projectiles.filter((p:Projectile)=>!p.update(dt,state,addDia,bon));
      state.floatingTexts=state.floatingTexts.filter((t:FloatingText)=>!t.update(dt));
      if (settings.effects) {
        state.particles=state.particles.filter((p:Particle)=>!p.update(dt));
      } else {
        state.particles = [];
      }
      state.rings=state.rings.filter((r:RingBurst)=>!r.update(dt));
      state.aoeBlasts=state.aoeBlasts.filter((b:AoeBlast)=>!b.update(dt));
      if(ns)syncUI();
    };

    const loop=(ts:number)=>{
      if(!gs.current.lastTime)gs.current.lastTime=ts;
      const rawDt=Math.min((ts-gs.current.lastTime)/1000,0.1);
      const dt=rawDt*gs.current.speedMultiplier;gs.current.lastTime=ts;
      if(isPlayingRef.current&&gs.current.status!=='game_over')update(dt);
      drawScene(ts);
      gs.current.aoeBlasts.forEach((b:AoeBlast)=>b.draw(ctx));
      gs.current.rings.forEach((r:RingBurst)=>r.draw(ctx));
      gs.current.enemies.forEach((e:Enemy)=>e.draw(ctx,ts));
      gs.current.projectiles.forEach((p:Projectile)=>p.draw(ctx));
      gs.current.particles.forEach((p:Particle)=>p.draw(ctx));
      gs.current.floatingTexts.forEach((t:FloatingText)=>t.draw(ctx));
      raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(raf);
  },[addDia,syncUI,isInMenu,isInEditor]);

  const handlePointer=useCallback((e:React.PointerEvent<HTMLCanvasElement>)=>{
    if(e.pointerType==='touch')e.preventDefault();
    const state=gs.current;if(state.status==='game_over')return;
    const canvas=canvasRef.current!;const rect=canvas.getBoundingClientRect();
    const x=(e.clientX-rect.left)*(CW/rect.width);const y=(e.clientY-rect.top)*(CH/rect.height);
    const clicked=state.slots.find((s:any)=>Math.hypot(s.x-x,s.y-y)<34);
    if(!clicked){setSelSlotId(null);selSlotIdRef.current=null;setShopSlotId(null);return;}
    if(!clicked.tower){setShopSlotId(clicked.id);setSelSlotId(null);selSlotIdRef.current=null;}
    else{const ns=selSlotId===clicked.id?null:clicked.id;setSelSlotId(ns);selSlotIdRef.current=ns;setShopSlotId(null);}
  },[selSlotId]);

  const buyTower=useCallback((tid:string)=>{
    const def=TOWER_TYPES[tid];if(!def)return;
    const slot=gs.current.slots.find((s:any)=>s.id===shopSlotId);
    const disc=towerDiscountRef.current?0.80:1;
    const finalCost=Math.floor(def.cost*disc);
    if(!slot||slot.tower||dRef.current<finalCost)return;
    setDia(p=>p-finalCost);slot.tower=new Tower(slot.x,slot.y,slot.side,def);setShopSlotId(null);
  },[shopSlotId,setDia]);

  const handleUpgrade=useCallback(()=>{
    if(selSlotId===null)return;const slot=gs.current.slots.find((s:any)=>s.id===selSlotId);if(!slot?.tower)return;
    if(freeUpgradeRef.current){
      slot.tower.upgrade();freeUpgradeRef.current=false;
      gs.current.floatingTexts.push(new FloatingText(slot.tower.x,slot.tower.y-20,'GRATUIT!',1,'#60a5fa'));
      setActiveBuffs(b=>({...b,freeUpgrade:false}));
      syncUI();
    } else if(dRef.current>=slot.tower.upgradeCost){setDia(p=>p-slot.tower.upgradeCost);slot.tower.upgrade();syncUI();}
  },[selSlotId,setDia,syncUI]);

  const handleSell=useCallback(()=>{
    if(selSlotId===null)return;const slot=gs.current.slots.find((s:any)=>s.id===selSlotId);if(!slot?.tower)return;
    const val=slot.tower.getSellValue(bonusesRef.current.sellRatio);addDia(val);
    gs.current.floatingTexts.push(new FloatingText(slot.tower.x,slot.tower.y-20,`+${val}♦`,0,C.diamond));
    slot.tower=null;setSelSlotId(null);selSlotIdRef.current=null;
  },[selSlotId,addDia]);

  const handleReward=useCallback((r:Reward)=>{
    if (selectedRewardId) return;
    setSelectedRewardId(r.id);
    const state=gs.current;const maxHp=10+bonusesRef.current.bonusHp;
    if(r.id==='heal'){state.baseHp=Math.min(maxHp,state.baseHp+2);syncUI();}
    else if(r.id==='diamonds'){addDia(40);}
    else if(r.id==='talent'){setTalentPoints(p=>p+1);}
    else if(r.id==='upgrade_free'){freeUpgradeRef.current=true;}
    else if(r.id==='speed_boost'){speedBoostRef.current=true;}
    else if(r.id==='gold_rush'){goldRushRef.current=true;}
    else if(r.id==='tower_discount'){towerDiscountRef.current=true;}
    setActiveBuffs({freeUpgrade:freeUpgradeRef.current,speedBoost:speedBoostRef.current,goldRush:goldRushRef.current,towerDiscount:towerDiscountRef.current});
    syncUI();
  },[selectedRewardId, addDia, syncUI]);

  const handleProceed = useCallback(() => {
    const state = gs.current;
    setLevelRewards([]);
    setSelectedRewardId(null);
    state.level++;
    if (state.level > maxLevelUnlocked) {
      setMaxLevelUnlocked(state.level);
    }
    initLevel(state.level);
    state.wave = 1;
    state.status = 'idle';
    state.autoWaveTimer = 10;
    syncUI();
  }, [syncUI, initLevel, maxLevelUnlocked]);

  const cycleTarget=useCallback(()=>{
    if(selSlotId===null)return;const slot=gs.current.slots.find((s:any)=>s.id===selSlotId);if(!slot?.tower)return;
    const cur=TM_CYCLE.indexOf(slot.tower.targetMode);slot.tower.targetMode=TM_CYCLE[(cur+1)%3];
    setUiState(u=>({...u}));
  },[selSlotId]);

  const handleAction=useCallback(()=>{
    const state=gs.current;setSelSlotId(null);selSlotIdRef.current=null;setShopSlotId(null);
    if(state.status==='game_over'){
      state.enemies=[];state.projectiles=[];state.particles=[];state.floatingTexts=[];state.rings=[];state.aoeBlasts=[];state.orbParticles=[];
      const mh=10+bonusesRef.current.bonusHp;state.baseHp=mh;
      state.level=1;state.wave=1;state.kills=0;state.flashAlpha=0;
      state.slots.forEach((s:any)=>s.tower=null);state.status='idle';state.autoWaveTimer=0;
      setDia(100);setIsPlaying(true);isPlayingRef.current=true;setGameSpeed(1);
      // Don't reset talents on Level Replay if user just want to retry
      setShowPauseModal(false);
      initLevel(state.level);
      syncUI();
    } else if(state.status==='idle'){
      const ld=getLevelData(state.level);const isBoss=state.wave===ld.waves;
      const total=isBoss?1:Math.floor(ld.baseMobs+state.wave*ld.mobMult);
      state.enemiesToSpawn=total;state.totalWaveEnemies=total;
      state.spawnTimer=0;state.waveActive=true;state.status='playing';
      if(state.autoWaveTimer>0){
        addDia(5);
        state.floatingTexts.push(new FloatingText(200,380,"+5♦ Manuel!",0,'#4ade80'));
      }
      setIsPlaying(true);isPlayingRef.current=true;
      setWaveAnnounce({text:isBoss?'⚠ BOSS':`Vague ${state.wave}/${ld.waves}`});
      setTimeout(()=>setWaveAnnounce(null),1600);
      syncUI();
    }
  },[setDia,syncUI]);

  const handleAoESpell = useCallback(() => {
    const s = gs.current;
    if (s.bossPoints >= 1 && s.status === 'playing') {
      s.bossPoints -= 1;
      s.shakeTime = 0.8;
      s.flashAlpha = 0.6;
      s.aoeBlasts.push(new AoeBlast(200, 400, 280));
      s.enemies.forEach((e: any) => {
        e.hp -= 500;
        e.hitFlash = 0.2;
        s.floatingTexts.push(new FloatingText(e.x, e.y-e.radius, 500, 2));
      });
      syncUI();
    }
  }, [syncUI]);

  const selSlot=selSlotId!==null?gs.current.slots.find((s:any)=>s.id===selSlotId):null;
  const selTower:Tower|null=selSlot?.tower??null;
  const shopSlot=shopSlotId!==null?gs.current.slots.find((s:any)=>s.id===shopSlotId):null;
  const bon=bonusesRef.current;
  const maxHp=10+bon.bonusHp;
  const SL=['DMG','SPD','RNG','CRIT'];
  const SC=['#f87171','#fbbf24','#22c55e','#c084fc'];

  return (
    <div className="flex justify-center items-center w-full bg-black select-none overflow-hidden touch-none" style={{ height: '100dvh' }}>
      <AnimatePresence>
        {showIntro && (
          <IntroScreen key="intro" onComplete={() => setShowIntro(false)} />
        )}
      </AnimatePresence>

      {isInMenu ? (
        <MainMenu
          onPlay={() => { 
            setIsInMenu(false); 
            if (uiState.level === 1 && diamonds < 100) setDia(100);
            initLevel(uiState.level); 
            syncUI(); 
          }}
          onSelectLevel={(lvl) => {
            setIsInMenu(false);
            setDia(100); // Reset budget when picking a level manually
            initLevel(lvl);
            syncUI();
          }}
          maxLevelUnlocked={maxLevelUnlocked}
          currentLevel={uiState.level}
          onOpenEditor={() => { setIsInMenu(false); setIsInEditor(true); }}
          onOpenSettings={() => setShowSettings(true)}
        />
      ) : isInEditor ? (
        <LevelEditor
          onBack={() => { setIsInEditor(false); setIsInMenu(true); }}
          initialLevelId={uiState.level}
          initialConfig={customLevels[uiState.level] || INITIAL_LEVELS[uiState.level]}
          customLevels={customLevels}
          onSave={(lvlId, config) => {
            setCustomLevels(prev => {
              const next = { ...prev, [lvlId]: config };
              localStorage.setItem('pt_custom_levels', JSON.stringify(next));
              GameAPI.saveCustomLevel(GameAPI.getTerminalId(), lvlId, config);
              return next;
            });
          }}
          onTest={(config) => {
            // Save before test to ensure consistency
            setCustomLevels(prev => {
              const next = { ...prev, [uiState.level]: config };
              localStorage.setItem('pt_custom_levels', JSON.stringify(next));
              return next;
            });
            // Test current level
            const s = gs.current;
            s.slots = config.slots.map((sl: any) => ({ ...sl, id: sl.id, x: sl.x, y: sl.y, r: 16, tower: null, side: sl.side }));
            s.path = config.path;
            s.wave = 1;
            s.status = 'idle';
            s.baseHp = 10 + bonusesRef.current.bonusHp;
            s.enemies = []; s.projectiles = []; s.particles = []; s.floatingTexts = []; s.rings = []; s.aoeBlasts = []; s.orbParticles = [];
            s.lastTime = 0;
            setIsInMenu(false);
            setIsInEditor(false); // Stop editing to test
            setIsPlaying(true);
            isPlayingRef.current = true;
            syncUI();
          }}
        />
      ) : (
        <div className="w-full h-full">
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=IBM+Plex+Mono:wght@400;600;700&display=swap');

            :root {
              --teal: #00f5c4;
              --teal-dim: rgba(0,245,196,0.12);
              --teal-border: rgba(0,245,196,0.25);
              --red: #ff3d5a;
              --gold: #f5b800;
              --purple: #9d72ff;
              --panel: rgba(4,8,20,0.92);
              --panel-border: rgba(0,245,196,0.18);
            }

        .gf { font-family: 'Orbitron', monospace; }
        .mf { font-family: 'IBM Plex Mono', monospace; }

        /* Scanline overlay */
        .scanlines::after {
          content:''; position:absolute; inset:0; pointer-events:none; z-index:1;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px);
        }

        .hud-panel {
          background: rgba(14,12,27,0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.06);
          border-top: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 4px 24px rgba(0,0,0,0.4);
          position: relative;
          overflow: hidden;
        }
        .hud-panel::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(0deg, transparent 50%, rgba(255,255,255,0.02) 50%);
          background-size: 100% 4px; pointer-events: none;
        }

        .console-bar {
          background: linear-gradient(180deg, rgba(14,12,27,0.95) 0%, rgba(7,6,15,0.98) 100%);
          backdrop-filter: blur(20px);
          border-bottom: 2px solid rgba(0,245,196,0.3);
          box-shadow: 0 10px 40px rgba(0,0,0,0.6);
          position: relative;
        }
        .console-bar::after {
          content: ""; position: absolute; bottom: -2px; left: 10%; right: 10%; height: 2px;
          background: linear-gradient(90deg, transparent, #00f5c4, transparent);
          box-shadow: 0 0 20px #00f5c4;
        }

        .shop-console {
          background: rgba(14,12,27,0.98);
          backdrop-filter: blur(25px);
          border-top: 2px solid rgba(255,255,255,0.08);
          box-shadow: 0 -10px 50px rgba(0,0,0,0.7);
        }

        .tower-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
        }
        .tower-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
        .tower-card.ok:active { transform: translateY(0) scale(0.96); }

        /* Neon glow button */
        .btn-neon {
          position:relative; overflow:hidden;
          background: rgba(0,245,196,0.08);
          border: 1px solid var(--teal-border);
          color: var(--teal);
          transition: all 0.15s;
        }
        .btn-neon:active { transform:scale(0.96); background:rgba(0,245,196,0.18); }
        .btn-neon::before {
          content:''; position:absolute; inset:0; opacity:0; transition:opacity 0.15s;
          background: radial-gradient(ellipse at center, rgba(0,245,196,0.15) 0%, transparent 70%);
        }
        .btn-neon:hover::before { opacity:1; }

        .btn-danger {
          background: rgba(255,61,90,0.08);
          border: 1px solid rgba(255,61,90,0.25);
          color: rgba(255,61,90,0.6);
          transition: all 0.15s;
        }
        .btn-danger:hover { background:rgba(255,61,90,0.18); color:#ff3d5a; }
        .btn-danger:active { transform:scale(0.96); }

        .btn-upgrade {
          background: linear-gradient(135deg, rgba(0,245,196,0.15) 0%, rgba(0,245,196,0.05) 100%);
          border: 1px solid rgba(0,245,196,0.4);
          color: var(--teal);
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 700;
          transition: all 0.15s;
          box-shadow: 0 0 12px rgba(0,245,196,0.12), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .btn-upgrade:hover { box-shadow:0 0 20px rgba(0,245,196,0.3), inset 0 1px 0 rgba(255,255,255,0.08); }
        .btn-upgrade:active { transform:scale(0.97); }
        .btn-upgrade:disabled { opacity:0.25; cursor:not-allowed; box-shadow:none; }

        /* Stat chip */
        .stat-chip {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-top-color: rgba(255,255,255,0.12);
        }

        /* Animated hp dot */
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes scaleIn { from{transform:scale(0.88);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes waveIn { 0%{letter-spacing:0.5em;opacity:0} 30%{opacity:1} 100%{letter-spacing:0.08em;opacity:0} }
        @keyframes bossWarn { 0%,100%{opacity:1;text-shadow:0 0 12px #ff3d5a} 50%{opacity:0.4;text-shadow:none} }
        @keyframes ping2 { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
        @keyframes talentPulse { 0%,100%{box-shadow:0 0 0 0 rgba(245,184,0,0.6)} 50%{box-shadow:0 0 0 5px rgba(245,184,0,0)} }
        @keyframes scanSlide { from{background-position:0 0} to{background-position:0 100%} }
        @keyframes rgbShift { 0%,100%{text-shadow:1px 0 #ff3d5a,-1px 0 #00f5c4} 50%{text-shadow:-1px 0 #ff3d5a,1px 0 #00f5c4} }
        @keyframes arrowPulse { 0%,100%{transform:scaleX(1);opacity:0.7} 50%{transform:scaleX(1.04);opacity:1} }
        @keyframes countUrgent { 0%,100%{transform:scale(1);color:#00f5c4} 50%{transform:scale(1.08);color:#fff} }

        .su { animation:slideUp 0.2s cubic-bezier(0.22,1,0.36,1); }
        .si { animation:scaleIn 0.22s cubic-bezier(0.22,1,0.36,1); }
        .fi { animation:fadeIn 0.28s ease-out; }
        .bw { animation:bossWarn 0.75s ease-in-out infinite; }
        .wa { animation:waveIn 1.8s ease-out forwards; pointer-events:none; }
        .p2 { animation:ping2 1s ease-in-out infinite; }
        .tp { animation:talentPulse 1.4s ease-in-out infinite; }
        .glitch { animation:rgbShift 0.4s steps(2) infinite; }
        .count-urgent { animation:countUrgent 0.5s ease-in-out infinite; }

        *{-webkit-tap-highlight-color:transparent;}
        ::-webkit-scrollbar{display:none;}
        html,body{height:100%;overflow:hidden;background:#000;overscroll-behavior:none;}
      `}</style>

      <div className="gf relative overflow-hidden flex flex-col mx-auto shadow-2xl" 
        style={{
          width: '100vw',
          height: '100dvh',
          maxWidth: 'min(100vw, 50dvh)', // Ratio 1:2 strict
          maxHeight: '100dvh',
          background: '#040810',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>

        {/* TOP HUD - CONSOLE BAR */}
        <div className="absolute top-0 w-full z-20 pointer-events-none" style={{paddingTop:'env(safe-area-inset-top, 0px)'}}>
          <div className="console-bar w-full px-4 pt-4 pb-3 flex items-center justify-between pointer-events-auto">
            
            {/* Left: HP & Status */}
            <div className="flex flex-col gap-1.5 min-w-[100px]">
              <div className="flex items-center gap-2 leading-none">
                <span className="text-[10px] font-black tracking-[0.2em] text-[#00f5c4]">HP_STATUS</span>
                <span className="mf text-[10px] font-black text-white/40">{uiState.baseHp}/10</span>
              </div>
              <div className="flex gap-[3px]">
                {Array.from({length:maxHp}).map((_,i)=>(
                  <div key={i} style={{
                    width:8,height:4,borderRadius:1,transition:'all 0.3s',
                    background:i<uiState.baseHp
                      ?(uiState.baseHp<=3?'#ff3d5a':i<uiState.baseHp*0.4?'#f5b800':'#00f5c4')
                      :'rgba(255,255,255,0.05)',
                    boxShadow:i<uiState.baseHp?(uiState.baseHp<=3?'0 0 10px #ff3d5a':'0 0 6px rgba(0,245,196,0.3)'):'none',
                  }}/>
                ))}
              </div>
            </div>

            {/* Center: Wave & Progress */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="h-px w-6 bg-gradient-to-r from-transparent to-[#00f5c4]/30" />
                <div className="gf text-sm font-black tracking-[0.15em] text-white">NVX.{uiState.level}</div>
                <div className="h-px w-6 bg-gradient-to-l from-transparent to-[#00f5c4]/30" />
              </div>
              <div className="mf text-[8px] font-bold text-white/30 tracking-[0.3em] uppercase">VAGUE {uiState.wave}/{uiState.maxWaves}</div>
            </div>

            {/* Right: Data Readouts */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 leading-none mb-1">
                  <Skull size={11} className="text-[#a78bfa] opacity-60"/>
                  <span className="mf text-[10px] font-black text-white">{uiState.kills}</span>
                </div>
                <div className="text-[7px] font-bold text-white/20 tracking-widest uppercase">KILLS</div>
              </div>
              <button onClick={()=>setShowTalents(true)} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 relative
                  ${talentPoints > 0 ? 'bg-[#ff4d6d]/10 border border-[#ff4d6d]/40' : 'bg-white/5 border border-white/10'}`}>
                <Dna size={18} className={talentPoints > 0 ? 'text-[#ff4d6d] tp' : 'text-white/20'}/>
                {talentPoints > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#ff4d6d] rounded-full border-2 border-[#0b0a16]" />}
              </button>
            </div>
          </div>
        </div>

        {/* BOSS HP BAR */}
        {uiState.bossMaxHp>0&&uiState.status==='playing'&&(
          <div className="fi absolute top-[72px] left-1/2 -translate-x-1/2 z-20 w-[200px] pointer-events-none">
            <div className="flex items-center gap-1.5 mb-1">
              <Skull size={10} color="#ef4444"/>
              <span className="text-[#ef4444] text-[9px] font-black tracking-widest bw">BOSS</span>
              <span className="mf text-white/35 text-[8px]">{Math.ceil(uiState.bossHp)}/{Math.ceil(uiState.bossMaxHp)}</span>
            </div>
            <div className="h-3 bg-black/55 rounded-full overflow-hidden border border-[#ef4444]/22">
              <div className="h-full rounded-full transition-all duration-200"
                style={{width:`${(uiState.bossHp/uiState.bossMaxHp)*100}%`,background:'linear-gradient(to right,#ef4444,#f97316)',boxShadow:'0 0 10px rgba(239,68,68,0.45)'}}/>
            </div>
          </div>
        )}

        {/* CANVAS */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <canvas ref={canvasRef} width={CW} height={CH}
            onPointerDown={handlePointer}
            className="block touch-none" style={{cursor:'pointer', maxWidth:'100%', maxHeight:'100%', aspectRatio:'1/2'}}/>

          {/* Wave announce */}
          {waveAnnounce&&(
            <div className="wa absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-25">
              <div className="mb-2" style={{
                fontFamily:"'Orbitron',monospace",fontWeight:900,fontSize:42,letterSpacing:'0.12em',
                color:'#00f5c4',
                textShadow:'0 0 20px rgba(0,245,196,0.9),0 0 60px rgba(0,245,196,0.4)',
                WebkitTextStroke:'1px rgba(0,245,196,0.5)',
              }}>
                {waveAnnounce.text}
              </div>
              <div style={{width:120,height:1,background:'linear-gradient(to right,transparent,#00f5c4,transparent)',boxShadow:'0 0 8px #00f5c4'}}/>
            </div>
          )}

          {/* SHOP CONSOLE */}
          {shopSlot&&uiState.status!=='game_over'&&(
            <div className="si absolute inset-x-0 bottom-0 z-40 shop-console pb-6 overflow-hidden" style={{animation:'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)'}}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col">
                  <div className="text-[#00f5c4] font-black text-[11px] tracking-[0.2em] uppercase">LOGISTIQUE DE DÉFENSE</div>
                  <div className="text-white/20 text-[8px] mf uppercase tracking-widest mt-0.5">Secteur {shopSlot.side==='left'?'ALPHA':'BETA'} // Acquisition</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end leading-none">
                    <div className="text-[#fbbf24] font-black text-lg mf leading-none">{diamonds}♦</div>
                    <div className="text-white/20 text-[7px] font-black tracking-widest mt-1">RESERVES</div>
                  </div>
                  <button onClick={()=>setShopSlotId(null)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all active:scale-90">
                    <X size={18}/>
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-5 gap-0 px-2 pt-2">
                {Object.values(TOWER_TYPES).map(def=>{
                  const ok=diamonds>=def.cost;
                  const Icon = def.icon;
                  return(<button key={def.id} onClick={()=>ok&&buyTower(def.id)}
                    className={`flex flex-col items-center py-3 px-1 gap-1.5 transition-all relative group pointer-events-auto
                      ${ok ? 'tower-card ok' : 'opacity-20 cursor-not-allowed'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                      ${ok ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/20'}`} style={{color: ok ? def.color : 'white'}}>
                      <Icon size={20} />
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-white font-black text-[8px] tracking-tighter text-center uppercase leading-tight">{def.name}</div>
                      <div className="mf font-black text-[9px]" style={{color:ok?C.diamond:'rgba(255,255,255,0.2)'}}>{def.cost}♦</div>
                    </div>
                    
                    {/* Tooltip Hover Overlay */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                      <div className="bg-[#0b0a16] border border-white/10 rounded-2xl p-4 w-[160px] shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={16} color={def.color} />
                          <span className="text-white font-black text-xs">{def.name}</span>
                        </div>
                        <p className="text-white/40 text-[9px] leading-relaxed mb-3">{def.desc}</p>
                        <div className="flex flex-col gap-1.5">
                          {SL.map((l,i)=>(
                            <div key={l} className="flex items-center gap-2">
                              <div className="text-white/20 text-[7px] w-8 font-black">{l}</div>
                              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{width:`${def.statBar[i]*100}%`,background:SC[i]}}/>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="w-3 h-3 bg-[#0b0a16] border-r border-b border-white/10 rotate-45 mx-auto -mt-1.5"/>
                    </div>
                  </button>);
                })}
              </div>
            </div>
          )}

          {/* TACTICAL CONSOLE (Tower Details) */}
          {selTower&&!shopSlot&&uiState.status!=='game_over'&&(
            <div className="si absolute inset-x-0 bottom-0 z-40 shop-console pb-0 overflow-hidden" style={{animation:'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)'}}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
                    style={{background:`${selTower.def.color}15`, border:`1px solid ${selTower.def.color}40`, color: selTower.def.color}}>
                    <selTower.def.icon size={24} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-black text-sm tracking-widest uppercase">{selTower.def.name}</div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md leading-none"
                        style={{background:selTower.level>=5?'rgba(192,132,252,0.18)':selTower.level>=3?'rgba(251,191,36,0.18)':'rgba(255,255,255,0.07)',
                          color:selTower.level>=5?'#c084fc':selTower.level>=3?'#fbbf24':'rgba(255,255,255,0.42)'}}>
                        NIV.{selTower.level}
                      </span>
                    </div>
                    <div className="text-white/25 text-[8px] mf uppercase tracking-widest mt-0.5">CONSOLE_TACTIQUE • {selSlot?.side==='left'?'ALPHA':'BETA'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end leading-none mr-2">
                    <div className="text-[#fbbf24] font-black text-lg mf leading-none">{diamonds}♦</div>
                    <div className="text-white/20 text-[7px] font-black tracking-widest mt-1 uppercase">Crédits</div>
                  </div>
                  <button onClick={()=>{setSelSlotId(null);selSlotIdRef.current=null;}} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/20 hover:text-white transition-all active:scale-90">
                    <X size={18}/>
                  </button>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="px-3 py-4 flex items-center justify-between gap-2">
                {/* Visual Stats Row */}
                <div className="flex gap-2 flex-1">
                  {[
                    { label: 'DMG', val: Math.round(selTower.damage * bonusesRef.current.globalDmg), color: '#ff4d6d' },
                    { label: 'SPD', val: (1/selTower.fireRate).toFixed(1), color: '#60a5fa' },
                    { label: 'RNG', val: Math.round(selTower.range * bonusesRef.current.globalRange), color: '#fbbf24' }
                  ].map(s => (
                    <div key={s.label} className="flex flex-col gap-0.5 flex-1">
                      <div className="text-white/20 text-[6px] font-black tracking-widest">{s.label}</div>
                      <div className="font-black text-xs mf text-white">{s.val}</div>
                      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{background:s.color, width: '40%', boxShadow: `0 0 8px ${s.color}60`}} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target Strategy */}
                <div className="flex flex-col items-center gap-1 px-2 border-l border-r border-white/5">
                  <div className="text-white/25 text-[6px] font-black tracking-widest uppercase">Cible</div>
                  <button onClick={cycleTarget} className="mf text-[9px] font-black text-[#00f5c4] px-2 py-1 rounded-lg bg-[#00f5c4]/5 border border-[#00f5c4]/20 hover:bg-[#00f5c4]/10 transition-all uppercase flex items-center gap-1">
                    <RotateCcw size={8}/> {TM_LABELS[selTower.targetMode]}
                  </button>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={handleSell} className="flex flex-col items-center justify-center px-3 h-12 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-[#ff3d5a]/10 hover:border-[#ff3d5a]/30 transition-all group active:scale-95">
                    <div className="text-[#ff3d5a] font-black text-xs mf group-hover:scale-110 transition-transform">{selTower.getSellValue(bonusesRef.current.sellRatio)}♦</div>
                    <div className="text-white/20 text-[6px] font-black tracking-widest uppercase mt-0.5">Vendre</div>
                  </button>
                  
                  <button onClick={handleUpgrade} disabled={diamonds<selTower.upgradeCost}
                    className={`flex flex-col items-center justify-center px-4 h-12 rounded-xl transition-all active:scale-95 relative overflow-hidden
                    ${diamonds >= selTower.upgradeCost ? 'bg-[#00f5c4] text-[#0b0a16] shadow-[0_0_20px_rgba(0,245,196,0.3)]' : 'bg-white/5 border border-white/10 text-white/20 opacity-40'}`}>
                    <div className="font-black text-sm mf leading-none">{selTower.upgradeCost}♦</div>
                    <div className="font-black text-[8px] tracking-widest uppercase mt-1">Améliorer</div>
                    {diamonds >= selTower.upgradeCost && <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GAME OVER */}
          {uiState.status==='game_over'&&(
            <div className="fi absolute inset-0 bg-[#0b0a16]/94 flex flex-col justify-center items-center z-30">
              <div className="w-20 h-20 rounded-3xl bg-[#ef4444]/10 border border-[#ef4444]/20 flex items-center justify-center mb-5"><Skull size={38} color="#ef4444"/></div>
              <h1 className="text-[#ef4444] text-3xl font-black mb-1.5 tracking-tight">BASE DÉTRUITE</h1>
              <p className="text-white/32 mb-6 text-sm">Niveau {uiState.level} atteint</p>
              <div className="flex gap-3 mb-8">
                <div className="bg-[#171626] px-4 py-2 rounded-2xl border border-[#252438] flex items-center gap-1.5"><Skull size={12} color="#a78bfa"/><span className="mf text-[#a78bfa] text-sm">{uiState.kills}</span></div>
                <div className="bg-[#171626] px-4 py-2 rounded-2xl border border-[#252438] flex items-center gap-1.5"><Trophy size={12} color="#fbbf24"/><span className="mf text-[#fbbf24] text-sm">Niv.{uiState.level}</span></div>
              </div>
              <button onClick={handleAction} className="bg-[#22c55e] text-[#0b0a16] px-14 py-4 rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-[0_0_50px_rgba(34,197,94,0.35)] hover:bg-[#16a34a] pointer-events-auto">
                REJOUER
              </button>
              <p className="text-white/18 text-[10px] mt-4">Les talents seront réinitialisés</p>
            </div>
          )}

          {/* LEVEL COMPLETE reward screen */}
          {uiState.status==='level_complete'&&levelRewards.length>0&&(
            <div className="fi absolute inset-0 z-30 flex flex-col justify-center" style={{background:'linear-gradient(180deg,#0b0a16 0%,#111028 100%)'}}>
              {/* Header */}
              <div className="flex flex-col items-center pt-8 pb-4 px-6">
                <div className="relative mb-2">
                  <Trophy size={48} color="#fbbf24" style={{filter:'drop-shadow(0 0 24px #fbbf24) drop-shadow(0 0 48px rgba(251,191,36,0.4))'}}/>
                  <div className="absolute inset-0 animate-ping opacity-20" style={{background:'radial-gradient(circle,#fbbf24 0%,transparent 70%)',borderRadius:'50%'}}/>
                </div>
                <div className="text-white/35 text-xs tracking-[0.3em] uppercase mb-1">Niveau {uiState.level} terminé</div>
                <h1 className="text-white font-black text-3xl tracking-tight">Bien joué !</h1>
              </div>

              {/* Stats row */}
              <div className="flex gap-3 px-5 mb-4">
                {[
                  {icon:Skull, label:'Ennemis', val:uiState.kills, color:'#a78bfa'},
                  {icon:Star, label:'Diamants', val:diamonds, color:'#fbbf24'},
                  {icon:Heart, label:'PV restants', val:`${uiState.baseHp}/${10+bonusesRef.current.bonusHp}`, color:'#4ade80'},
                ].map(s=>(
                  <div key={s.label} className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl p-2 flex flex-col items-center gap-0.5">
                    <div className="text-white/40"><s.icon size={18} /></div>
                    <div className="font-black text-base" style={{color:s.color}}>{s.val}</div>
                    <div className="text-white/28 text-[7px] tracking-wide uppercase">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Reward choice */}
              <div className="px-5 mb-2">
                <div className="text-white/40 text-[10px] tracking-[0.2em] uppercase mb-2 text-center">Choisissez votre récompense</div>
                <div className="flex flex-col gap-2">
                  {levelRewards.map((r,i)=>(
                    <button key={r.id} onClick={()=>handleReward(r)}
                      className="group flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-[0.98] pointer-events-auto"
                      style={{
                        background:`${r.color}0a`,
                        borderColor:`${r.color}28`,
                        animationDelay:`${i*80}ms`,
                      }}
                      onMouseEnter={e=>(e.currentTarget.style.background=`${r.color}18`,e.currentTarget.style.borderColor=`${r.color}55`)}
                      onMouseLeave={e=>(e.currentTarget.style.background=`${r.color}0a`,e.currentTarget.style.borderColor=`${r.color}28`)}
                      onPointerDown={e=>(e.currentTarget.style.transform='scale(0.97)')}
                      onPointerUp={e=>(e.currentTarget.style.transform='')}>
                      <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0"
                        style={{background:`${r.color}18`,border:`1px solid ${r.color}30`}}>
                        <div className="text-white"><r.icon size={20} /></div>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-black text-sm text-white leading-tight">{r.label}</div>
                        <div className="text-white/45 text-[10px] mt-0.5 leading-relaxed">{r.desc}</div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all"
                        style={{borderColor:selectedRewardId === r.id ? r.color : `${r.color}50`, background: selectedRewardId === r.id ? r.color : 'transparent'}}/>
                    </button>
                  ))}
                </div>
              </div>

              {/* +1 talent note */}
              <div className="flex flex-col items-center gap-3 mt-4 px-5 pb-6">
                <button onClick={() => setShowTalents(true)} className="w-full py-4 rounded-2xl bg-[#c084fc]/10 border border-[#c084fc]/40 text-[#c084fc] font-black tracking-widest active:scale-95 transition-all pointer-events-auto">
                  OUVRIR LES TALENTS ({talentPoints} PT)
                </button>
                {selectedRewardId && (
                  <button onClick={handleProceed} className="w-full py-4 rounded-2xl bg-[#00f5c4] text-[#0b0a16] font-black tracking-widest active:scale-95 transition-all shadow-[0_0_20px_rgba(0,245,196,0.3)] pointer-events-auto">
                    PASSER AU NIVEAU {uiState.level + 1}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#c084fc] animate-pulse" />
                  <span className="text-white/35 text-[10px] uppercase tracking-widest font-bold">+1 point de talent accordé</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Active buff indicators */}
        {(activeBuffs.freeUpgrade||activeBuffs.speedBoost||activeBuffs.goldRush||activeBuffs.towerDiscount)&&(
          <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1.5 z-20 pointer-events-none px-4">
            {activeBuffs.freeUpgrade&&<div className="bg-[#60a5fa]/15 border border-[#60a5fa]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#60a5fa] flex items-center gap-1"><Zap size={10}/> Gratuit</div>}
            {activeBuffs.speedBoost&&<div className="bg-[#fb923c]/15 border border-[#fb923c]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#fb923c] flex items-center gap-1"><Wind size={10}/> +Cadence</div>}
            {activeBuffs.goldRush&&<div className="bg-[#fbbf24]/15 border border-[#fbbf24]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#fbbf24] flex items-center gap-1"><DollarSign size={10}/> ×1.5♦</div>}
            {activeBuffs.towerDiscount&&<div className="bg-[#34d399]/15 border border-[#34d399]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#34d399] flex items-center gap-1"><Tag size={10}/> −20%</div>}
          </div>
        )}

        <div className="absolute bottom-0 w-full px-4 pb-4 flex justify-between items-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <button onClick={()=>{setIsPlaying(false);isPlayingRef.current=false;setShowPauseModal(true);}}
              className="bg-[#171626] w-14 h-14 rounded-2xl border border-[#252438] active:scale-90 transition-all flex items-center justify-center hover:bg-[#1e1d32] shadow-xl">
              <Pause size={20} className="text-white"/>
            </button>
            <button onClick={()=>setGameSpeed(p=>p===1?2:1)}
              className={`w-14 h-14 rounded-2xl border pointer-events-auto active:scale-90 transition-all flex items-center justify-center shadow-xl
                ${gameSpeed===2?'bg-[#22c55e] border-[#22c55e] text-[#0b0a16]':'bg-[#171626] border-[#252438] text-white'}`}>
              <FastForward size={20}/>
            </button>
          </div>

          {/* DIAMONDS */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="relative group active:scale-90 transition-transform cursor-default">
              <div className="w-16 h-16 bg-[#fbbf24] rotate-45 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center border-4 border-[#0b0a16]">
                <div className="-rotate-45 mf text-xl font-black text-[#0b0a16]">{diamonds}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* BOUTON AOE FLAMME */}
            <button onClick={handleAoESpell} disabled={uiState.bossPoints < 1 || uiState.status !== 'playing'}
              className={`w-14 h-14 rounded-2xl border active:scale-90 transition-all flex flex-col items-center justify-center relative shadow-xl
                ${uiState.bossPoints >= 1 && uiState.status === 'playing' ? 'bg-[#ef4444]/10 border-[#ef4444]/60' : 'bg-[#171626] border-white/5 opacity-50'}`}>
              <Flame size={18} className={uiState.bossPoints >= 1 && uiState.status === 'playing' ? 'text-[#ef4444]' : 'text-white/20'}/>
              <div className="text-[8px] font-black text-white/30 mt-0.5">{uiState.bossPoints}/8</div>
            </button>

            {/* BOUTON VAGUE */}
            <button onClick={handleAction} disabled={uiState.status==='playing'}
              className={`w-16 h-16 rounded-[24px] bg-[#171626] border relative flex flex-col items-center justify-center pointer-events-auto active:scale-95 transition-all shadow-2xl overflow-hidden
                ${uiState.status==='playing' ? 'border-white/5 opacity-50' : 'border-white/15'}`}>
              
              {uiState.status==='idle' && autoCountdown > 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={`mf font-black text-xl transition-colors duration-300 ${autoCountdown <= 3 ? 'text-[#ff3d5a] count-urgent' : 'text-[#22c55e]'}`}>
                    {autoCountdown}s
                  </div>
                  <div className="text-[6px] font-black text-white/20 tracking-[0.2em] uppercase mt-0.5">AUTO_WAVE</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-[7px] font-black text-white/30 tracking-widest mb-1 uppercase">Vague</div>
                  <div className="mf text-base font-black text-white">{uiState.wave}/{uiState.maxWaves}</div>
                </div>
              )}

              {/* Progress Ring or Background Fill for Countdown */}
              {uiState.status==='idle' && autoCountdown > 0 && (
                <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                  <div className="absolute inset-0 bg-white" style={{ transform: `translateY(${(autoCountdown/10)*100}%)`, transition: 'transform 1s linear' }} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* TALENT MODAL */}
        <TalentModal open={showTalents} onClose={()=>setShowTalents(false)} pts={talentPoints} unlocked={unlockedTalents} onUnlock={handleUnlockTalent}/>
        
        {/* PAUSE MODAL */}
        {showPauseModal && (
          <div className="absolute inset-0 z-50 bg-[#0b0a16]/95 backdrop-blur-md flex flex-col items-center justify-center p-8" style={{animation:'fadeIn 0.2s ease-out'}}>
            <div className="w-full max-w-[280px] flex flex-col items-center">
              <div className="relative mb-12">
                <h2 className="text-white font-black text-4xl tracking-tighter opacity-10">PAUSE</h2>
                <h2 className="absolute inset-0 text-[#00f5c4] font-black text-4xl tracking-tighter glitch" style={{textShadow:'0 0 20px rgba(0,245,196,0.5)'}}>PAUSE</h2>
              </div>
              <div className="flex flex-col gap-4 w-full">
                <button onClick={() => { setShowPauseModal(false); setIsPlaying(true); isPlayingRef.current = true; }} 
                  className="w-full py-5 rounded-2xl bg-[#00f5c4] text-[#0b0a16] font-black tracking-[0.2em] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,245,196,0.3)]">
                  REPRENDRE
                </button>
                <button onClick={() => setShowSettings(true)} 
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold tracking-widest active:scale-95 transition-all hover:bg-white/10">
                  RÉGLAGES
                </button>
                <div className="h-px w-full bg-white/5 my-2" />
                <button onClick={() => { setShowPauseModal(false); setIsInMenu(true); }} 
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold tracking-widest active:scale-95 transition-all hover:bg-white/10 hover:text-white">
                  QUITTER LE JEU
                </button>
              </div>
              <p className="mt-8 mf text-[10px] text-white/20 tracking-[0.3em] uppercase">Session Active - ID-PX01</p>
            </div>
          </div>
        )}
      </div>
    )}

    {showSettings && (
      <SettingsModal 
        settings={settings} 
        onClose={() => setShowSettings(false)} 
        onUpdate={(s) => {
          setSettings(s);
          setMasterVolume(s.volume);
          localStorage.setItem('pt_settings', JSON.stringify(s));
        }} 
      />
    )}
    </div>
  );
}