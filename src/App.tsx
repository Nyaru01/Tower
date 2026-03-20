import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Zap, Skull, Flame, Heart, Star, Wind, DollarSign, Tag, Pause, FastForward, RotateCcw, Trophy, X, ChevronRight, Dna, Music, Swords, Target, ArrowUpCircle, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import MainMenu from './ui/MainMenu';
import LevelEditor from './ui/LevelEditor';
import { 
  CW, CH, C, TOWER_TYPES, TALENT_TREE, ALL_REWARDS, computeBonuses, getLevelData, pickRewards, TM_CYCLE, TM_LABELS, INITIAL_LEVELS,
  type TalentBonuses, type Reward
} from './game/constants';
import { FloatingText, Particle, RingBurst, AoeBlast } from './game/entities/effects';
import { EnemyProjectile } from './game/entities/Projectile';
import { Enemy } from './game/entities/Enemy';
import { Tower } from './game/entities/Tower';
import TalentModal from './ui/TalentModal';
import SettingsModal from './ui/SettingsModal';
import IntroScreen from './ui/IntroScreen';
import { setMasterVolume, getAudioData, analyser, audioCtx, playBuySound } from './game/utils/audio';
import { GameAPI } from './game/api';
import { useRegisterSW } from 'virtual:pwa-register/react';

// ── Radial Shop Component ───────────────────────────────────────────────────
function RadialShop({ slot, diamonds, onBuy, onClose }: { slot: any, diamonds: number, onBuy: (tid: string) => void, onClose: () => void }) {
  const towers = Object.values(TOWER_TYPES);
  const [hovered, setHovered] = useState<string | null>(null);
  
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 350);
    return () => clearTimeout(t);
  }, []);

  // Center the menu on screen to avoid edge clipping (as requested)
  const menuX = 50;
  const menuY = 40;

  // Actual slot positions for the highlight indicator
  const slotX = (slot.x / CW) * 100;
  const slotY = (slot.y / CH) * 100;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden font-sans">
      <style>{`
        .inner-light { box-shadow: inset 0 0 10px rgba(0, 242, 255, 0.1); }
      `}</style>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#020508]/60 backdrop-blur-[2.5px] pointer-events-auto"
        onPointerDown={(e) => { 
          e.stopPropagation(); 
          if (canClose) onClose(); 
        }}
      >
        {/* Highlight the actual slot to show context */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.8 }}
          style={{ left: `${slotX}%`, top: `${slotY}%`, width: 48, height: 48 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_#00f2ff]"
        />
        {/* Connection line from menu to slot (Subtle) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <line x1={`${menuX}%`} y1={`${menuY}%`} x2={`${slotX}%`} y2={`${slotY}%`} stroke="#00f2ff" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      </motion.div>
      
      <div className="absolute" style={{ left: `${menuX}%`, top: `${menuY}%`, transform: 'translate(-50%, -50%)' }}>
        <div className="relative flex items-center justify-center">
          
          <AnimatePresence>
            {towers.map((def, i) => {
              const radius = 100;
              const total = towers.length;
              const angle = (i * (2 * Math.PI / total)) - (Math.PI / 2);
              const tx = Math.cos(angle) * radius;
              const ty = Math.sin(angle) * radius;
              
              const isHovered = hovered === def.id;
              const ok = diamonds >= def.cost;
              const Icon = def.icon;

              return (
                <motion.div
                  key={def.id}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ scale: 1, x: tx, y: ty, opacity: 1 }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35, delay: i * 0.01 }}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{ width: 64, height: 64, x: '-50%', y: '-50%' }}
                >
                  <motion.button
                    onPointerEnter={() => setHovered(def.id)}
                    onPointerLeave={() => setHovered(null)}
                    onPointerDown={(e) => { e.stopPropagation(); if (ok) onBuy(def.id); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`pointer-events-auto relative w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 backdrop-blur-md inner-light
                      ${!ok ? 'bg-black/40 border-white/5 opacity-20 grayscale cursor-not-allowed' : 'bg-black/95'}
                    `}
                    style={ok ? {
                      borderColor: isHovered ? def.color : `${def.color}44`,
                      backgroundColor: isHovered ? `${def.color}33` : 'rgba(0,0,0,0.95)',
                      boxShadow: isHovered ? `0 0 20px ${def.glowColor}` : '0 10px 15px -3px rgba(0,0,0,0.1)',
                      color: ok ? def.color : 'rgba(255,255,255,0.2)'
                    } : {}}
                  >
                    <div className="transition-all duration-300" style={{ filter: isHovered && ok ? `drop-shadow(0 0 8px #fff)` : ok ? `drop-shadow(0 0 5px ${def.color})` : 'none' }}>
                      <Icon size={24} strokeWidth={2.5} />
                    </div>
                    {ok && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black border-2 rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums shadow-lg z-20" 
                        style={{ borderColor: `${def.color}88`, color: def.color }}>
                        {def.cost}
                      </div>
                    )}
                  </motion.button>
                  <span className={`absolute whitespace-nowrap text-[10px] font-black uppercase tracking-widest leading-none transition-all duration-300
                    ${isHovered ? 'opacity-100 scale-110' : 'opacity-60 scale-100'}`} 
                    style={{ 
                      color: def.color, 
                      textShadow: isHovered ? `0 0 10px ${def.color}, 0 2px 4px rgba(0,0,0,1)` : '0 2px 4px rgba(0,0,0,1)',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translate(${Math.cos(angle) * 52}px, ${Math.sin(angle) * 52}px)`,
                    }}>
                    {def.name}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <motion.button
            onPointerDown={(e) => { 
              e.stopPropagation(); 
              if (canClose) onClose(); 
            }}
            whileTap={{ scale: 0.92 }}
            className={`relative z-50 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 border-[3px] bg-[#00F2FF] border-white shadow-[0_0_40px_rgba(0,242,255,0.6),inset_0_0_15px_rgba(255,255,255,0.3)] pointer-events-auto active:scale-95`}
          >
            <motion.div animate={{ rotate: 90 }} className="text-black transition-colors duration-300">
              <X size={40} strokeWidth={3} />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 0.4, scale: 1.4 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute inset-0 bg-cyan-400 rounded-full blur-2xl -z-10"
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Radial Upgrade Component ──────────────────────────────────────────────────
function RadialUpgrade({ slot, diamonds, onUpgrade, onSell, onClose, sellRatio }: { slot: any, diamonds: number, onUpgrade: () => void, onSell: () => void, onClose: () => void, sellRatio: number }) {
  const tower = slot.tower;
  const radius = 80;
  const sellValue = tower.getSellValue(sellRatio);
  
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanClose(true), 350);
    return () => clearTimeout(t);
  }, []);

  // Center the menu on screen
  const menuX = 50;
  const menuY = 40;
  const slotX = (slot.x / CW) * 100;
  const slotY = (slot.y / CH) * 100;

  return (
    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden font-sans">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#020508]/60 backdrop-blur-[2.5px] pointer-events-auto"
        onPointerDown={(e) => { e.stopPropagation(); if (canClose) onClose(); }}
      >
        {/* Highlight context */}
        <motion.div 
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 0.8 }}
          style={{ left: `${slotX}%`, top: `${slotY}%`, width: 48, height: 48 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_#00f2ff]"
        />
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <line x1={`${menuX}%`} y1={`${menuY}%`} x2={`${slotX}%`} y2={`${slotY}%`} stroke="#00f2ff" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      </motion.div>
      
      <div className="absolute" style={{ left: `${menuX}%`, top: `${menuY}%`, transform: 'translate(-50%, -50%)' }}>
        <div className="relative flex items-center justify-center">
          
          <AnimatePresence>
            {(() => {
              // UPGRADE BUTTON (TOP)
              const tx_u = 0;
              const ty_u = -radius;

              return (
                <motion.div
                  key="upgrade"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ scale: 1, x: tx_u, y: ty_u, opacity: 1 }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{ width: 64, height: 64, x: '-50%', y: '-50%' }}
                >
                  <motion.button
                    onPointerDown={(e) => { e.stopPropagation(); onUpgrade(); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={`pointer-events-auto relative w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-200 backdrop-blur-md 
                      ${diamonds >= tower.upgradeCost 
                        ? 'bg-[#00f5c4]/30 border-[#00f5c4] shadow-[0_0_20px_rgba(0,245,196,0.4)] text-[#00f5c4]' 
                        : 'bg-black/80 border-white/10 text-white/20 opacity-40 grayscale cursor-not-allowed'}`}
                  >
                    <ArrowUpCircle size={30} strokeWidth={2.5} />
                    <div className="absolute -top-2 -right-4 bg-black border-2 border-[#00f5c4]/50 rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums text-[#00f5c4] shadow-lg">
                      {tower.upgradeCost}♦
                    </div>
                  </motion.button>
                  <span className={`absolute -top-12 text-[12px] font-black uppercase tracking-[0.2em] leading-none transition-colors drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]
                    ${diamonds >= tower.upgradeCost ? 'text-[#00f5c4] drop-shadow-[0_0_10px_rgba(0,245,196,0.4)]' : 'text-white/30'}`}>UPGRADE</span>
                </motion.div>
              );
            })()}

            {(() => {
              // SELL BUTTON (BOTTOM)
              const tx_s = 0;
              const ty_s = radius;

              return (
                <motion.div
                  key="sell"
                  initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  animate={{ scale: 1, x: tx_s, y: ty_s, opacity: 1 }}
                  exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35, delay: 0.05 }}
                  className="absolute flex items-center justify-center pointer-events-none"
                  style={{ width: 64, height: 64, x: '-50%', y: '-50%' }}
                >
                  <motion.button
                    onPointerDown={(e) => { e.stopPropagation(); onSell(); onClose(); }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="pointer-events-auto relative w-12 h-12 rounded-full border border-[#ef4444]/40 bg-[#ef4444]/15 flex items-center justify-center transition-all duration-200 backdrop-blur-md text-[#ef4444]"
                  >
                    <Trash2 size={24} strokeWidth={2.5} />
                    <div className="absolute -bottom-2 -right-4 bg-black border-2 border-[#ef4444]/50 rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums text-[#ef4444] shadow-lg">
                      +{sellValue}♦
                    </div>
                  </motion.button>
                  <span className="absolute -bottom-12 text-[12px] font-black uppercase text-[#ef4444] tracking-[0.2em] leading-none drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]">VENDRE</span>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          {/* Central Handle (CLOSE) */}
          <motion.button
            onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
            className="relative z-50 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 border-2 bg-black/80 border-white/20 shadow-xl pointer-events-auto active:scale-95"
          >
            <motion.div animate={{ rotate: 45 }} className="text-white/40">
              <X size={32} strokeWidth={2} />
            </motion.div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [diamonds,setDiamonds]=useState(100);
  const dRef=useRef(100);
  const [unlockedTalents,setUnlockedTalents]=useState<Set<string>>(new Set());
  const [talentPoints,setTalentPoints]=useState(0);
  const tpRef=useRef(0);
  useEffect(()=>{ tpRef.current = talentPoints; },[talentPoints]);
  const [showTalents,setShowTalents]=useState(false);
  const [showPauseModal,setShowPauseModal]=useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [maxLevelUnlocked, setMaxLevelUnlocked] = useState(1);
  const [gameMode, setGameMode] = useState<'career' | 'arcade'>('career');
  const [officialLevels, setOfficialLevels] = useState<Record<number, any>>({});
  const [isInMenu,setIsInMenu]=useState(true);
  const [isInEditor,setIsInEditor]=useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [levelRewards,setLevelRewards]=useState<Reward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);

  const freeUpgradeRef=useRef(false);
  const goldRushRef=useRef(false);
  const speedBoostRef=useRef(false);
  const towerDiscountRef=useRef(false);
  const bonusesRef=useRef<TalentBonuses>(computeBonuses(new Set()));
  const isPlayingRef=useRef(true);
  const selSlotIdRef=useRef<string|number|null>(null);
  const shopSlotIdRef=useRef<string|number|null>(null);
  const wasPlayingBeforeModal = useRef(false);

  const [isPlaying,setIsPlaying]=useState(true);
  const [gameSpeed,setGameSpeed]=useState(1);
  const [selSlotId,setSelSlotId]=useState<string|number|null>(null);
  const [shopSlotId,setShopSlotId]=useState<string|number|null>(null);
  useEffect(()=>{
    shopSlotIdRef.current = shopSlotId;
  },[shopSlotId]);
  useEffect(()=>{
    selSlotIdRef.current = selSlotId;
  },[selSlotId]);
  const [waveAnnounce,setWaveAnnounce]=useState<{title:string,subtitle?:string}|null>(null);
  const [uiState,setUiState]=useState({level:1,wave:1,maxWaves:4,status:'idle',baseHp:10,kills:0,enemiesLeft:0,totalEnemies:0,bossHp:0,bossMaxHp:0,aoeBombs:0});
  const [activeBuffs,setActiveBuffs]=useState({freeUpgrade:false,speedBoost:false,goldRush:false,towerDiscount:false});
  const [autoCountdown,setAutoCountdown]=useState(0);
  const tracks = ['1.mp3', '2.mp3', '3.mp3'];
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * 3));

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('pt_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setMasterVolume(parsed.volume);
      return parsed;
    }
    return { volume: 0.5, effects: true, bloom: true };
  });

  const setDia=useCallback((v:number|((p:number)=>number))=>{
    setDiamonds(prev=>{const n=typeof v==='function'?v(prev):v;dRef.current=n;return n;});
  },[]);
  const addDia=useCallback((n:number)=>setDia(p=>p+n),[setDia]);

  const loadCareerProgress = useCallback(() => {
    const s_talents = localStorage.getItem('pt_talents');
    if (s_talents) {
      try {
        const parsed = JSON.parse(s_talents);
        setUnlockedTalents(new Set(parsed));
        bonusesRef.current = computeBonuses(new Set(parsed));
      } catch(e) {}
    } else {
      setUnlockedTalents(new Set());
      bonusesRef.current = computeBonuses(new Set());
    }
    const s_pts = localStorage.getItem('pt_talent_points');
    if (s_pts) setTalentPoints(Number(s_pts));
    else setTalentPoints(0);
    
    const s_dia = localStorage.getItem('pt_diamonds');
    if (s_dia) { setDia(Number(s_dia)); dRef.current = Number(s_dia); }
    else { setDia(100); dRef.current = 100; }
  }, [setDia]);

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
      const s_bombs = localStorage.getItem('pt_aoe_bombs');
      if (s_bombs) gs.current.aoeBombs = Number(s_bombs);
      const s_official = localStorage.getItem('pt_official_levels');
      if (s_official) {
        try { setOfficialLevels(JSON.parse(s_official)); } catch(e) {}
      }

      // Cloud attempt
      const tid = GameAPI.getTerminalId();
      try {
        // Load progress & custom levels
        const cloudData = await GameAPI.loadProgress(tid);
        if (cloudData) {
          setDia(cloudData.diamonds);
          setTalentPoints(cloudData.talentPoints);
          setMaxLevelUnlocked(cloudData.maxLevelUnlocked);
          setUnlockedTalents(new Set(cloudData.unlockedTalents));
          bonusesRef.current = computeBonuses(new Set(cloudData.unlockedTalents));
        }
        
        // Load Global/Official levels
        const offLevels = await GameAPI.loadOfficialLevels();
        if (offLevels && Array.isArray(offLevels)) {
          const map: any = {};
          offLevels?.forEach((l: any) => {
            if (l.data) map[l.levelNumber] = l.data;
          });
          setOfficialLevels(prev => ({ ...prev, ...map }));
        }
      } catch (e) {
        console.warn('Cloud load failed, using local data', e);
      }
    };
    loadAll();
  }, [setDia]);

  // Persistence: Save
  useEffect(() => {
    if (!showIntro && gameMode === 'career') {
      localStorage.setItem('pt_diamonds', String(diamonds));
      localStorage.setItem('pt_talents', JSON.stringify(Array.from(unlockedTalents)));
      localStorage.setItem('pt_talent_points', String(talentPoints));
      localStorage.setItem('pt_max_level', String(maxLevelUnlocked));
      localStorage.setItem('pt_aoe_bombs', String(gs.current.aoeBombs));
      localStorage.setItem('pt_official_levels', JSON.stringify(officialLevels));
    }
    
    // Throttled cloud sync
    const timer = setTimeout(syncWithCloud, 2000);
    return () => clearTimeout(timer);
  }, [diamonds, unlockedTalents, talentPoints, maxLevelUnlocked, showIntro, syncWithCloud, officialLevels]);

  const handleUnlockTalent=useCallback((id:string)=>{
    const node=TALENT_TREE.find(t=>t.id===id);if(!node)return;
    setTalentPoints(p=>{if(p<node.cost)return p;return p-node.cost;});
    setUnlockedTalents(prev=>{const s=new Set(prev);s.add(id);bonusesRef.current=computeBonuses(s);return s;});
  },[]);

  const toggleTalents = useCallback((open: boolean) => {
    if (open) {
      wasPlayingBeforeModal.current = isPlayingRef.current;
      setIsPlaying(false);
      isPlayingRef.current = false;
      setShowTalents(true);
    } else {
      setShowTalents(false);
      if (wasPlayingBeforeModal.current) {
        setIsPlaying(true);
        isPlayingRef.current = true;
      }
    }
  }, []);

  const gs=useRef<any>({
    lastTime:0,speedMultiplier:1,shakeTime:0,flashAlpha:0,
    enemies:[],projectiles:[],enemyProjectiles:[],particles:[],floatingTexts:[],orbParticles:[],rings:[],aoeBlasts:[],
    spawnTimer:0,enemiesToSpawn:0,totalWaveEnemies:0,waveActive:false,
    autoWaveTimer:0,
    level:1,wave:1,status:'idle',baseHp:10,kills:0,bossPoints:0, aoeBombs:0,
    slots:[], path:[{x:200,y:70},{x:200,y:675}], bgColor: '#168f78',
    bokeh:Array.from({length:22}).map(()=>{const l=Math.random()>0.5;return{x:l?62+Math.random()*58:280+Math.random()*58,y:140+Math.random()*560,r:4+Math.random()*13,speed:8+Math.random()*18,alpha:0.03+Math.random()*0.12};}),
    audio: { energy: 0, bass: 0, mid: 0, high: 0 },
  });

  const syncUI=useCallback(()=>{
    const s=gs.current;const left=s.enemies.length+s.enemiesToSpawn;
    const boss=s.enemies.find((e:any)=>e.isBoss);
    setUiState({level:s.level,wave:s.wave,maxWaves:getLevelData(s.level).waves,status:s.status,
      baseHp:s.baseHp,kills:s.kills,enemiesLeft:left,totalEnemies:s.totalWaveEnemies,
      bossHp:boss?boss.hp:0,bossMaxHp:boss?boss.maxHp:0,aoeBombs:s.aoeBombs||0});
    setAutoCountdown(s.status==='idle'?Math.ceil(s.autoWaveTimer):0);
  },[]);

  // Initialize slots based on level
  const initLevel = useCallback((lvl: number) => {
    const s = gs.current;
    s.level = lvl;
    s.enemies = [];
    s.projectiles = [];
    s.enemyProjectiles = [];
    s.particles = [];
    s.floatingTexts = [];
    s.rings = [];
    s.aoeBlasts = [];
    s.orbParticles = [];
    s.wave = 1;
    s.status = 'idle';
    s.autoWaveTimer = 0;
    s.waveActive = false;
    s.enemiesToSpawn = 0;
    s.totalWaveEnemies = 0;
    s.spawnTimer = 0;
    s.baseHp = 10 + bonusesRef.current.bonusHp;
    s.kills = 0;
    s.flashAlpha = 0;
    
    // Check official levels from DB first, then hardcoded defaults
    const lvlConfig = (officialLevels || {})[lvl] || INITIAL_LEVELS[lvl];
    
    if (lvlConfig) {
      s.path = lvlConfig.path || [{x:200,y:70},{x:200,y:675}];
      s.slots = (lvlConfig.slots || [])?.map((sl: any) => ({ ...sl, tower: null }));
      s.bgColor = lvlConfig.bgColor || '#168f78';
    } else {
      // Procedural fallback for levels > Max
      s.path = [{x:200,y:70},{x:200,y:750}];
      s.slots = [
        {id:1,x:106,y:250,r:16,tower:null,side:'left'}, {id:2,x:294,y:250,r:16,tower:null,side:'right'},
        {id:3,x:106,y:400,r:16,tower:null,side:'left'}, {id:4,x:294,y:400,r:16,tower:null,side:'right'},
        {id:5,x:106,y:550,r:16,tower:null,side:'left'}, {id:6,x:294,y:550,r:16,tower:null,side:'right'},
      ];
    }
  }, [officialLevels]);



  useEffect(() => {
    if (!isInMenu && !isInEditor && uiState.level === 1 && gs.current.slots.length === 0) {
      initLevel(1);
      syncUI();
    }
  }, [isInMenu, isInEditor, initLevel, syncUI, uiState.level]);

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch('/api/version');
      const data = await res.json();
      if (appVersion && data.version !== appVersion) {
        setUpdateAvailable(true);
      } else if (!appVersion) {
        setAppVersion(data.version);
      }
    } catch (e) {}
  }, [appVersion]);

  useEffect(() => {
    checkVersion();
    const timer = setInterval(checkVersion, 60000);
    return () => clearInterval(timer);
  }, [checkVersion]);

  useEffect(()=>{gs.current.speedMultiplier=gameSpeed;},[gameSpeed]);
  useEffect(()=>{isPlayingRef.current=isPlaying;},[isPlaying]);
  
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    const audio = new Audio(`/Music/${tracks[trackIndex]}`);
    audio.loop = false; // Disable loop to allow random sequencing
    audio.volume = 0.35;
    bgMusicRef.current = audio;

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    audioSourceRef.current = source;

    const handleEnded = () => {
      let next;
      do { next = Math.floor(Math.random() * tracks.length); } while(next === trackIndex);
      setTrackIndex(next);
    };
    audio.addEventListener('ended', handleEnded);

    if (!isInMenu && !showPauseModal && !document.hidden) {
      setTimeout(() => {
        audio.play().catch(() => {});
      }, 100);
    }

    return () => { 
      audio.pause(); 
      audio.src = ''; 
      audio.removeEventListener('ended', handleEnded);
      source.disconnect();
    };
  }, [trackIndex]);
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
      if (!isInMenu && !showPauseModal && !document.hidden) {
        // We still keep this as a secondary check, but primary play is now in click handlers
        bgMusicRef.current.play().catch(() => {});
      }
      else bgMusicRef.current.pause();
    }
  }, [isInMenu, showPauseModal]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d', { alpha: false })!;
    
    // Antialiasing fix: High-DPI Support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CW * dpr;
    canvas.height = CH * dpr;
    canvas.style.width = `${CW}px`;
    canvas.style.height = `${CH}px`;
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;

    let raf:number;
    const spawnOrb=(s:any)=>{
      if(!s.path.length) return;
      const last = s.path[s.path.length-1];
      const a=Math.random()*Math.PI*2,r=10+Math.random()*16;
      s.orbParticles.push({
        x:last.x+Math.cos(a)*r,y:last.y+Math.sin(a)*r*0.35,
        vx:(Math.random()-0.5)*12,vy:-8-Math.random()*18,
        life:1.0,size:2+Math.random()*3.5,hue:160+Math.random()*40
      });
    };

    const drawScene=(ts:number)=>{
      const state=gs.current;
      const px=(state.path || [])?.map((p:any)=>p.x), py=(state.path || [])?.map((p:any)=>p.y);
      (state.slots || [])?.forEach((s:any)=>{px.push(s.x);py.push(s.y);});
      const pad=50;
      const maxCX=Math.max(...(px || []).map((x:number)=>Math.abs(x-CW/2)),100);
      const bw=maxCX*2+pad*2, bh=CH+410, bx=CW/2-bw/2, by=-205;

      ctx.fillStyle=C.bg;ctx.fillRect(0,0,CW,CH);
      ctx.strokeStyle=C.grid;ctx.lineWidth=1;
      for(let i=0;i<=CW;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,CH);ctx.stroke();}
      for(let i=0;i<=CH;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(CW,i);ctx.stroke();}

      let sx=0,sy=0;if(state.shakeTime>0){sx=(Math.random()-0.5)*12*state.shakeTime;sy=(Math.random()-0.5)*12*state.shakeTime;}
      ctx.save();ctx.translate(sx,sy);
      
      // 1. Dynamic Background Plate
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(bx+8,by+8,bw,bh);
      const ag=ctx.createLinearGradient(bx,by,bx+bw,by+bh);
      const baseCol = state.bgColor || '#168f78';
      ag.addColorStop(0, baseCol);
      ag.addColorStop(1, baseCol + 'CC');
      ctx.fillStyle=ag; ctx.fillRect(bx,by,bw,bh);
      
      const ig=ctx.createLinearGradient(bx,by,bx+bw/3,by+bh/3);ig.addColorStop(0,'rgba(255,255,255,0.05)');ig.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=ig; ctx.fillRect(bx,by,bw,bh);
      ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;ctx.strokeRect(bx,by,bw,bh);

      // Path Rendering
      const points = state.path;
      const { energy } = getAudioData();

      const strips: {z: number, pts: {x:number, y:number}[], isRamp?: boolean, z1?: number, z2?: number, seq: number}[] = [];
      if (points.length > 0) {
        for (let i = 1; i < points.length; i++) {
          const p1 = points[i-1], p2 = points[i];
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

      const drawPathStroke = (w: number, col: string, alpha: number = 1, dashed: boolean = false, pts: any[] = points, cap: CanvasLineCap = 'round') => {
        if (!pts.length) return;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineCap = cap; ctx.lineJoin = 'round';
        ctx.strokeStyle = col; ctx.lineWidth = w;
        if (dashed) ctx.setLineDash([8, 16]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for(let i=1; i<pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        if (dashed) ctx.setLineDash([]);
        ctx.restore();
      };

      const sortedStrips = [...(strips || [])].sort((a,b) => (a.z||0) - (b.z||0));
      const maxZ = sortedStrips.length > 0 ? Math.max(...sortedStrips?.map(s=>s.z||0)) : 0;

      sortedStrips.forEach(strip => {
        if (strip.z > 0 || strip.isRamp) {
          ctx.save();
          if (strip.isRamp) {
            const p1 = strip.pts[0], p2 = strip.pts[strip.pts.length-1];
            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            const isUp = (strip.z2||0) > (strip.z1||0);
            grad.addColorStop(isUp?0:1, 'rgba(0,0,0,0)');
            grad.addColorStop(isUp?1:0, 'rgba(0,0,0,0.4)');
            drawPathStroke(60, grad as any, 1, false, strip.pts, 'butt');
          } else {
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 18;
            ctx.shadowOffsetX = 12; ctx.shadowOffsetY = 16;
            drawPathStroke(60, 'rgba(0,0,0,0.3)', 1, false, strip.pts, 'butt');
          }
          ctx.restore();
        }
      });

      ctx.globalCompositeOperation = 'screen';
      const drawGlowPath = (width: number, color: any) => {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'butt';
        points?.forEach((p: {x:number, y:number}, i: number) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        [points[0], points[points.length-1]].forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, width/2, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      };
      drawGlowPath(74, 'rgba(0, 245, 196, 0.12)');
      ctx.globalCompositeOperation = 'source-over';

      for (let z = 0; z <= maxZ; z++) {
        const layerStrips = sortedStrips
          .filter(s => (s.z || 0) === z || (s.isRamp && Math.max(s.z1||0, s.z2||0) === z))
          .sort((a,b) => (a.seq || 0) - (b.seq || 0));
        
        if (layerStrips.length > 0) {
          const drawLayerPath = (width: number, color: any, dashed: boolean = false) => {
            ctx.beginPath();
            ctx.lineWidth = width;
            ctx.strokeStyle = color;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'butt';

            let lastP: {x:number, y:number} | null = null;
            layerStrips?.forEach((strip: any) => {
              strip.pts?.forEach((p: {x:number, y:number}, i: number) => {
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

            layerStrips?.forEach((strip: any) => {
              strip.pts?.forEach((p: any) => {
                const isStart = Math.abs(p.x - (points?.[0]?.x || 0)) < 0.5 && Math.abs(p.y - (points?.[0]?.y || 0)) < 0.5;
                const isEnd = Math.abs(p.x - (points?.[points.length-1]?.x || 0)) < 0.5 && Math.abs(p.y - (points?.[points.length-1]?.y || 0)) < 0.5;
                if (isStart || isEnd) {
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
          drawLayerPath(1.5, `rgba(0, 245, 196, ${0.15 + energy * 0.3})`, true);
        }

        state.enemies?.forEach((e:Enemy) => {
          if (e.getZ() === z) e.draw(ctx, ts, state.audio);
        });

        if (z === 0) {
           state.slots?.forEach((slot:any) => {
             const sid = selSlotIdRef.current;
             if(slot.tower) slot.tower.draw(ctx, sid === slot.id, state.audio);
             else {
               // --- HIGH-VISIBILITY TECH PAD ---
               ctx.save();
               
               // Outer Glow / Pulse
               const pulse = 0.5 + Math.sin(ts*0.005)*0.5;
               const glow = ctx.createRadialGradient(slot.x, slot.y, 10, slot.x, slot.y, 24);
               glow.addColorStop(0, 'rgba(0, 245, 196, 0.1)');
               glow.addColorStop(1, 'rgba(0, 245, 196, 0)');
               ctx.fillStyle = glow; ctx.fillRect(slot.x-24, slot.y-24, 48, 48);

               // Main Disk (More opaque)
               ctx.beginPath(); ctx.arc(slot.x, slot.y, 18, 0, Math.PI * 2);
               ctx.fillStyle = 'rgba(14, 12, 27, 0.9)'; ctx.fill();
               ctx.strokeStyle = '#00f5c4'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6 + pulse * 0.4;
               ctx.stroke();
               
               // Inner tech detail
               ctx.beginPath(); ctx.arc(slot.x, slot.y, 14, 0, Math.PI * 2);
               ctx.strokeStyle = 'rgba(0, 245, 196, 0.2)'; ctx.lineWidth = 0.5; ctx.stroke();

               // Clean ID
               ctx.globalAlpha = 1;
               ctx.fillStyle = '#00f5c4';
               ctx.font = '900 11px Orbitron';
               ctx.textAlign = 'center';
               ctx.fillText(slot.id.toString(), slot.x, slot.y + 4);

               // Tech Crosshair
               ctx.strokeStyle = '#00f5c4'; ctx.lineWidth = 0.5;
               [0, Math.PI/2, Math.PI, Math.PI*1.5].forEach(a => {
                 ctx.beginPath();
                 ctx.moveTo(slot.x + Math.cos(a)*18, slot.y + Math.sin(a)*18);
                 ctx.lineTo(slot.x + Math.cos(a)*22, slot.y + Math.sin(a)*22);
                 ctx.stroke();
               });

               ctx.restore();
             }
          });
          state.projectiles?.forEach((p:any) => p.draw(ctx));
          state.enemyProjectiles?.forEach((p:any) => p.draw(ctx));
        }
      }

      state.particles?.forEach((p:Particle) => p.draw(ctx));
      state.rings?.forEach((r:RingBurst) => r.draw(ctx));
      state.aoeBlasts?.forEach((b:AoeBlast) => b.draw(ctx));
      state.floatingTexts?.forEach((t:FloatingText) => t.draw(ctx));

      // Bokeh & Effects
      state.bokeh?.forEach((p:any)=>{const bg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);bg.addColorStop(0,`rgba(40,234,192,${p.alpha*1.5})`);bg.addColorStop(1,'rgba(40,234,192,0)');ctx.fillStyle=bg;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
      
      const lastWp=points[points.length-1];
      if(lastWp){
        const ot=ts*0.001; 
        ctx.save();ctx.translate(lastWp.x,lastWp.y);
        const og=ctx.createRadialGradient(0,0,10,0,0,38);og.addColorStop(0,'rgba(40,234,192,0)');og.addColorStop(0.6,'rgba(40,234,192,0.08)');og.addColorStop(1,'rgba(40,234,192,0)');
        ctx.fillStyle=og;ctx.beginPath();ctx.ellipse(0,0,38,14,0,0,Math.PI*2);ctx.fill();
        for(let i=0;i<6;i++){const a=ot*1.4+i*Math.PI/3,x=Math.cos(a)*26,y=Math.sin(a)*10;ctx.strokeStyle='#28EAC0';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.stroke();}
        const cg=ctx.createRadialGradient(0,0,0,0,0,18);cg.addColorStop(0,'rgba(200,255,245,0.9)');cg.addColorStop(0.3,'rgba(40,234,192,0.6)');cg.addColorStop(1,'rgba(20,160,130,0)');
        ctx.globalAlpha=0.7+Math.sin(ot*3)*0.15;ctx.fillStyle=cg;ctx.beginPath();ctx.ellipse(0,0,18,7,0,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;ctx.restore();
      }
      ctx.restore();

      if(state.flashAlpha>0){ctx.globalAlpha=state.flashAlpha;ctx.fillStyle='rgba(255,0,0,0.3)';ctx.fillRect(0,0,CW,CH);ctx.globalAlpha=1;}
      const vg=ctx.createRadialGradient(CW/2,CH/2,CW*0.3,CW/2,CH/2,CW*0.9);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.5)');ctx.fillStyle=vg;ctx.fillRect(0,0,CW,CH);
    };

    const update=(dt:number)=>{
      const state=gs.current;const bon=bonusesRef.current;let ns=false;
      if(Math.random()<0.55)spawnOrb(state);
      state.orbParticles=state.orbParticles?.filter((p:any)=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=0.92;p.vy*=0.94;p.life-=dt*2.2;return p.life>0;});
      if(state.waveActive){
        if(state.enemiesToSpawn>0){
          state.spawnTimer-=dt;
          if(state.spawnTimer<=0){
            const isBossWave = state.wave % getLevelData(state.level).waves === 0;
            const isFinalSpawn = state.enemiesToSpawn === 1;
            
            // If boss wave: spawn boss only at the very end or middle, otherwise regular mobs
            const spawnBossNow = isBossWave && isFinalSpawn;
            const abs = (state.level-1)*5 + state.wave;
            
            state.enemies.push(new Enemy(abs, state.path, spawnBossNow));
            state.enemiesToSpawn--;
            state.spawnTimer = isBossWave ? 0.35 : 0.6; // Faster spawning for boss escorts
          }
        }
        state.enemies=state.enemies?.filter((e:Enemy)=>{
          if(e.update(dt,state.audio)){
            const dmg=e.isBoss?Math.max(1,5-bon.bossReduct):1;
            state.baseHp-=dmg;state.shakeTime=e.isBoss?0.9:0.4;state.flashAlpha=0.3;ns=true;
            if(state.baseHp<=0){state.baseHp=0;state.status='game_over';setIsPlaying(false);isPlayingRef.current=false;}
            return false;
          }
          if (e.hp <= 0) {
            if (e.isBoss) {
              state.aoeBombs++;
              state.floatingTexts.push(new FloatingText(e.x, e.y - 40, "+1 BOMBE AOE!", 2, '#ef4444'));
            }
            return false;
          }
          return true;
        });
        if(state.enemies.length===0&&state.enemiesToSpawn===0&&state.status!=='game_over'){
          state.waveActive=false;const ld=getLevelData(state.level);
          if(state.wave>=ld.waves){
            state.status='level_complete';
            addDia(100); // 100 Credits cumulative bonus
            setTalentPoints(p=>p+1);
            setLevelRewards(pickRewards(state.level));
            if(bon.regenPerLevel>0)state.baseHp=Math.min(10+bon.bonusHp,state.baseHp+bon.regenPerLevel);
            speedBoostRef.current=false;goldRushRef.current=false;towerDiscountRef.current=false;
          } else {state.wave++;state.status='idle';state.autoWaveTimer=10;}ns=true;
        }
      }
      if(state.status==='idle'&&state.autoWaveTimer>0 && tpRef.current === 0){
        state.autoWaveTimer-=dt;
        ns=true; // Sync UI counter
        if(state.autoWaveTimer<=0){
          const ld=getLevelData(state.level),isBoss=state.wave===ld.waves;
          const mobCount = Math.floor(ld.baseMobs+state.wave*ld.mobMult);
          const total = isBoss ? mobCount + 5 : mobCount; // Boss gets 5 extra escorts
          state.enemiesToSpawn=total;state.totalWaveEnemies=total;state.spawnTimer=0;state.waveActive=true;state.status='playing';
          setWaveAnnounce({
            title: isBoss ? 'ALERTE BOSS' : `VAGUE ${state.wave}`,
            subtitle: isBoss ? 'DÉGÂTS CRITIQUES : 5' : `SECTEUR ${state.level}`
          });
          setTimeout(()=>setWaveAnnounce(null),2000);
        }
      }
      state.slots?.forEach((s:any)=>{if(s.tower)s.tower.update(dt,state,bon);});
      state.projectiles = state.projectiles?.filter((p:any)=>!p.update(dt,state,addDia,bon,state.audio));
      state.enemyProjectiles = state.enemyProjectiles?.filter((p:any)=>!p.update(dt,state));
      
      // Enemy Offense Logic
      state.enemies?.forEach((e:any)=>{
        if((e.isBoss || e.type === 'striker') && (state.slots || [])?.some((s:any)=>s.tower && s.tower.disabledTimer <= 0)){
          e.shootTimer -= dt;
          if(e.shootTimer <= 0){
            const towers = state.slots?.filter((s:any)=>s.tower && s.tower.disabledTimer <= 0)?.map((s:any)=>s.tower);
            if(towers.length > 0){
              const nearest = towers.reduce((prev:any,curr:any)=>{
                const d1=Math.hypot(e.x-prev.x, e.y-prev.y), d2=Math.hypot(e.x-curr.x, e.y-curr.y);
                return d1 < d2 ? prev : curr;
              });
              if(Math.hypot(e.x-nearest.x, e.y-nearest.y) < 280){
                state.enemyProjectiles.push(new EnemyProjectile(e.x, e.y, nearest, e.isBoss ? 60 : 30, e.color));
                e.shootTimer = e.isBoss ? 2.5 : 3.5;
              } else {
                e.shootTimer = 0.5;
              }
            } else {
              e.shootTimer = 1.0;
            }
          }
        }
      });
      state.floatingTexts=state.floatingTexts?.filter((t:FloatingText)=>!t.update(dt));
      if(settings.effects)state.particles=state.particles?.filter((p:Particle)=>!p.update(dt)); else state.particles=[];
      state.rings=state.rings?.filter((r:RingBurst)=>!r.update(dt));
      state.aoeBlasts=state.aoeBlasts?.filter((b:AoeBlast)=>!b.update(dt));
      if(ns)syncUI();
    };

    const loop=(ts:number)=>{
      const rawDt=Math.min((ts-gs.current.lastTime)/1000,0.1);
      const dt=rawDt*gs.current.speedMultiplier;gs.current.lastTime=ts;
      gs.current.audio=getAudioData();
      
      // Visual/Feedback updates (ALWAYS RUN)
      const state=gs.current;
      if(state.shakeTime>0)state.shakeTime-=dt;
      if(state.flashAlpha>0)state.flashAlpha=Math.max(0,state.flashAlpha-dt*4.5);
      state.bokeh?.forEach((p:any)=>{p.y-=p.speed*dt;if(p.y<128)p.y=710;});
      state.slots?.forEach((s:any)=>{if(s.tower){
        if(s.tower.scale>1)s.tower.scale=Math.max(1,s.tower.scale-dt*3.5);
        else if(s.tower.scale<1)s.tower.scale=Math.min(1,s.tower.scale+dt*6);
        if(s.tower.pulseRing>0){s.tower.pulseRing+=dt*185;if(s.tower.pulseRing>58)s.tower.pulseRing=0;}
      }});

      // Game Logic updates
      if(isPlayingRef.current&&state.status!=='game_over')update(dt);
      
      drawScene(ts);raf=requestAnimationFrame(loop);
    };
    raf=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(raf);
  },[addDia,syncUI,isInMenu,isInEditor,settings.effects]);

  const shopOpenTimeRef = useRef(0);
  const handlePointer=useCallback((e:React.PointerEvent<HTMLCanvasElement>)=>{
    // Prevent default and stop propagation to avoid ghost clicks/bubbling
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();

    // Audio resume on first interation
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});

    const state=gs.current;
    if(!state || state.status==='game_over') return;
    
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (CW / rect.width);
    const y = (e.clientY - rect.top) * (CH / rect.height);
    
    // Lenient hit detection
    const slots = state.slots || [];
    const clicked = slots.find((s:any) => Math.hypot(s.x-x, s.y-y) < 90);

    if(!clicked){
      // Only close if it's been open for a bit
      if (Date.now() - shopOpenTimeRef.current > 300) {
        setShopSlotId(null);
        setSelSlotId(null);
        selSlotIdRef.current = null;
      }
      return;
    }
    
    if(!clicked.tower){
      // Open Shop
      setShopSlotId(clicked.id);
      shopSlotIdRef.current = clicked.id;
      shopOpenTimeRef.current = Date.now();
      setSelSlotId(null);
      selSlotIdRef.current = null;
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    } else {
      // Toggle Selection (Shows RadialUpgrade)
      const ns = selSlotIdRef.current === clicked.id ? null : clicked.id;
      setSelSlotId(ns);
      selSlotIdRef.current = ns;
      setShopSlotId(null);
      shopSlotIdRef.current = null;
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
    }
  }, []);

  const buyTower=useCallback((tid:string)=>{
    const def=TOWER_TYPES[tid];if(!def)return;
    const slot=(gs.current.slots || [])?.find((s:any)=>s.id===shopSlotId);
    const disc=towerDiscountRef.current?0.80:1;
    const finalCost=Math.floor(def.cost*disc);
    if(!slot||slot.tower||dRef.current<finalCost)return;
    if(tid==='tesla' && (gs.current.slots || [])?.some((s:any)=>s.tower?.def.id==='tesla')){
      gs.current.floatingTexts.push(new FloatingText(slot.x, slot.y-20, "MAX: 1 TESLA", 1, '#ef4444'));
      return;
    }
    setDia(p=>p-finalCost);slot.tower=new Tower(slot.x,slot.y,slot.side,def);setShopSlotId(null);
    playBuySound();
  },[shopSlotId,setDia]);

  const handleUpgrade=useCallback(()=>{
    if(selSlotId===null)return;
    const slot=(gs.current.slots || [])?.find((s:any)=>s.id===selSlotId);
    if(!slot?.tower)return;
    
    let success = false;
    if(freeUpgradeRef.current){
      slot.tower.upgrade();
      freeUpgradeRef.current=false;
      gs.current.floatingTexts.push(new FloatingText(slot.tower.x,slot.tower.y-20,'GRATUIT!',1,'#60a5fa'));
      setActiveBuffs(b=>({...b,freeUpgrade:false}));
      success = true;
    } else if(diamonds >= slot.tower.upgradeCost){
      setDia(p=>p-slot.tower.upgradeCost);
      slot.tower.upgrade();
      playBuySound();
      success = true;
    }
    
    if(success) {
      syncUI();
      setSelSlotId(null);
      selSlotIdRef.current = null;
    }
  },[selSlotId,setDia,syncUI,diamonds]);

  const handleSell=useCallback(()=>{
    if(selSlotId===null)return;const slot=(gs.current.slots || [])?.find((s:any)=>s.id===selSlotId);if(!slot?.tower)return;
    const val=slot.tower.getSellValue(bonusesRef.current.sellRatio);addDia(val);
    gs.current.floatingTexts.push(new FloatingText(slot.tower.x,slot.tower.y-20,`+${val}♦`,0,C.diamond));
    slot.tower=null;setSelSlotId(null);selSlotIdRef.current=null;
  },[selSlotId,addDia]);

  const handleReward=useCallback((r:Reward)=>{
    if (selectedRewardId) return;
    setSelectedRewardId(r.id);
    const state=gs.current;
    if(r.id==='heal'){
      const currentMax = 10 + bonusesRef.current.bonusHp;
      state.baseHp=Math.min(currentMax, state.baseHp+2);
      syncUI();
    }
    else if(r.id==='diamonds'){addDia(40);}
    else if(r.id==='talent'){setTalentPoints(p=>p+1);}
    else if(r.id==='upgrade_free'){freeUpgradeRef.current=true;}
    else if(r.id==='speed_boost'){speedBoostRef.current=true;}
    else if(r.id==='gold_rush'){goldRushRef.current=true;}
    else if(r.id==='tower_discount'){towerDiscountRef.current=true;}
    else if(r.id==='aoe_bomb'){state.aoeBombs++;}
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
    syncUI();
  }, [syncUI, initLevel, maxLevelUnlocked, officialLevels]);

  const cycleTarget=useCallback(()=>{
    if(selSlotId===null)return;const slot=gs.current.slots.find((s:any)=>s.id===selSlotId);if(!slot?.tower)return;
    const cur=TM_CYCLE.indexOf(slot.tower.targetMode);slot.tower.targetMode=TM_CYCLE[(cur+1)%3];
    setUiState(u=>({...u}));
  },[selSlotId]);

  const handleAction=useCallback(()=>{
    const state=gs.current;setSelSlotId(null);selSlotIdRef.current=null;setShopSlotId(null);
    if(state.status==='game_over'){
      state.enemies=[];state.projectiles=[];state.particles=[];state.floatingTexts=[];state.rings=[];state.aoeBlasts=[];state.orbParticles=[];
      setDia(100);setIsPlaying(true);isPlayingRef.current=true;setGameSpeed(1);
      setShowPauseModal(false);
      if (gameMode === 'arcade') {
        // Full talent reset for Arcade attempt
        setUnlockedTalents(new Set());
        setTalentPoints(0);
        bonusesRef.current = computeBonuses(new Set());
      } else {
        loadCareerProgress();
      }
      initLevel(state.level);
      syncUI();
    } else if(state.status==='idle'){
      const ld=getLevelData(state.level);const isBoss=state.wave===ld.waves;
      const mobCount = Math.floor(ld.baseMobs+state.wave*ld.mobMult);
      const total=isBoss?mobCount+5:mobCount;
      state.enemiesToSpawn=total;state.totalWaveEnemies=total;
      state.spawnTimer=0;state.waveActive=true;state.status='playing';
      if(state.autoWaveTimer>0){
        addDia(10);
        state.floatingTexts.push(new FloatingText(200,380,"+10♦ Manuel!",0,'#4ade80'));
      }
      setIsPlaying(true);isPlayingRef.current=true;
      setWaveAnnounce({
        title: isBoss ? 'ALERTE BOSS' : `VAGUE ${state.wave}`,
        subtitle: isBoss ? 'DÉGÂTS CRITIQUES : 5' : `SECTEUR ${state.level}`
      });
      setTimeout(()=>setWaveAnnounce(null),2000);
      syncUI();
    }
  },[setDia,syncUI,initLevel,bonusesRef,addDia,setWaveAnnounce,officialLevels,gameMode,loadCareerProgress]);

  const restartLevel = useCallback(() => {
    const state = gs.current;
    if (!state) return;
    
    // Clean up
    state.enemies=[]; state.projectiles=[]; state.particles=[]; state.floatingTexts=[]; 
    state.rings=[]; state.aoeBlasts=[]; state.orbParticles=[];
    
    if (gameMode === 'arcade') {
      setDia(100);
      setUnlockedTalents(new Set());
      setTalentPoints(0);
      bonusesRef.current = computeBonuses(new Set());
    } else {
      loadCareerProgress();
    }
    
    setGameSpeed(1);
    setIsPlaying(true);
    isPlayingRef.current = true;
    setShowPauseModal(false);
    
    initLevel(state.level);
    syncUI();
  }, [gameMode, loadCareerProgress, initLevel, syncUI, setDia]);

  const handleAoESpell = useCallback(() => {
    const s = gs.current;
    if (s.aoeBombs >= 1 && s.status === 'playing') {
      s.aoeBombs -= 1;
      s.shakeTime = 0.8;
      s.flashAlpha = 0.6;
      s.aoeBlasts.push(new AoeBlast(200, 400, 280));
      s.enemies.forEach((e: any) => {
        e.hp -= 500;
        e.hitFlash = 0.2;
        s.floatingTexts.push(new FloatingText(e.x, e.y - e.radius - 20, 500, 2));
      });
      syncUI();
    }
  }, [syncUI]);

  const selSlot=selSlotId!==null?gs.current.slots.find((s:any)=>s.id===selSlotId):null;
  const selTower:Tower|null=selSlot?.tower??null;
  const shopSlot=shopSlotId!==null?gs.current.slots.find((s:any)=>s.id===shopSlotId):null;
  const bon=bonusesRef.current;
  const maxHp=10+bon.bonusHp;


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
            // Explicitly resume audio on click
            if (audioCtx.state === 'suspended') audioCtx.resume();
            bgMusicRef.current?.play().catch(e => console.error("Audio trigger failed:", e));
            
            setGameMode('career');
            loadCareerProgress(); // Load saved career
            setIsInMenu(false); 
            // In Career, we don't force reset diamonds here to allow resuming with what was saved
            initLevel(maxLevelUnlocked); 
            syncUI(); 
          }}
          onSelectLevel={(lvl) => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            bgMusicRef.current?.play().catch(e => console.error("Audio trigger failed:", e));

            setGameMode('arcade');
            // Full reset for Arcade Start
            setUnlockedTalents(new Set());
            const initialPts = lvl - 1;
            setTalentPoints(initialPts);
            bonusesRef.current = computeBonuses(new Set());
            setIsInMenu(false);
            setDia(100); 
            initLevel(lvl);
            syncUI();
            
            // Open talent panel if points available
            if (initialPts > 0) {
              toggleTalents(true);
            }
          }}
          currentLevel={uiState.level}
          onOpenEditor={() => { setIsInMenu(false); setIsInEditor(true); }}
          onOpenSettings={() => setShowSettings(true)}
          officialLevels={officialLevels}
          updateAvailable={updateAvailable}
          onCheckUpdate={checkVersion}
        />
      ) : isInEditor ? (
        <LevelEditor
          onBack={() => { setIsInEditor(false); setIsInMenu(true); }}
          initialLevelId={uiState.level}
          initialConfig={(officialLevels || {})[uiState.level] || INITIAL_LEVELS[uiState.level]}
          officialLevels={officialLevels}
          onSave={(lvlId, config) => {
            // All levels are now saved as official (Global)
            setOfficialLevels(prev => {
              const next = { ...prev, [lvlId]: config };
              localStorage.setItem('pt_official_levels', JSON.stringify(next));
              GameAPI.saveOfficialLevel(GameAPI.getTerminalId(), lvlId, config);
              return next;
            });
          }}
          onTest={(config) => {
            // Test current level
            const s = gs.current;
            s.slots = (config.slots || []).map((sl: any) => ({ ...sl, id: sl.id, x: sl.x, y: sl.y, r: 16, tower: null, side: sl.side }));
            s.path = config.path || [{x:200,y:70},{x:200,y:675}];
            s.bgColor = config.bgColor || '#168f78';
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

        @keyframes fadeInOut {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); filter: blur(10px); }
          15% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          85% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
          100% { opacity: 0; transform: scale(1.1) translateY(-10px); filter: blur(20px); }
        }

        .glitch-text {
          position: relative;
          color: #fff;
          text-shadow: 0 0 10px rgba(0,245,196,0.5), 0 0 20px rgba(0,245,196,0.3);
          animation: neon-pulse 1.5s ease-in-out infinite alternate;
        }
        @keyframes neon-pulse {
          from { text-shadow: 0 0 5px rgba(0,245,196,0.5), 0 0 10px rgba(0,245,196,0.3); }
          to { text-shadow: 0 0 15px rgba(0,245,196,0.8), 0 0 30px rgba(0,245,196,0.5), 0 0 40px #00f5c4; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(-5px) rotate(45deg); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 1s infinite ease-in-out;
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
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
        @keyframes bombGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(239,68,68,0.4), inset 0 0 10px rgba(239,68,68,0.2); border-color: rgba(239,68,68,0.8); }
          50% { box-shadow: 0 0 35px rgba(239,68,68,0.7), inset 0 0 20px rgba(239,68,68,0.4); border-color: #ef4444; }
        }
        .bomb-active { animation: bombGlow 1.2s ease-in-out infinite; }

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
          background: '#0b0a16', // Match internal game bg
        }}>

        {/* TOP HUD - REFINED CONSOLE */}
        {/* TOP HUD - REFINED CONSOLE */}
        {/* TOP HUD - CONSOLE V5 (COHERENT) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[98%] z-20 pointer-events-none" style={{paddingTop:'env(safe-area-inset-top, 5px)'}}>
          <div className="grid grid-cols-[1.2fr_1fr_1.2fr] items-center px-4 rounded-2xl bg-black/80 backdrop-blur-3xl border border-white/10 shadow-[0_15px_50px_rgba(0,0,0,0.9)] pointer-events-auto shrink-0 h-[65px] relative overflow-hidden">
            
            {/* HUD Scanline */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
              style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.05) 1px, rgba(255,255,255,0.05) 2px)' }} />

            {/* Left Column: Integrity Pod */}
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 py-2 px-3 rounded-xl h-[45px] transition-all">
              <div className="w-1 h-6 bg-[#00f5c4] rounded-sm opacity-50 shrink-0 shadow-[0_0_8px_#00f5c466]" />
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-black text-[#00f5c4] tracking-widest uppercase mf opacity-50 mt-0.5">HEALTH</span>
                  <span className="text-[11px] font-black text-white tabular-nums">[{uiState.baseHp < 10 ? '0' : ''}{uiState.baseHp}/{maxHp}]</span>
                </div>
                <div className="flex gap-0.5 items-center">
                  {Array.from({length:maxHp}).map((_,i)=>(
                    <div key={i} className={`h-1.5 w-1.5 rounded-[1px] transition-all duration-700
                      ${i < uiState.baseHp 
                        ? (uiState.baseHp <= 3 ? 'bg-[#ff3d5a] shadow-[0_0_6px_#ff3d5a]' : 'bg-[#00f5c4] shadow-[0_0_6px_#00f5c488]') 
                        : 'bg-white/5'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Center Column: Sector Info */}
            <div className="flex flex-col items-center justify-center px-2">
               <div className="text-white gf text-[14px] font-black tracking-[0.2em] leading-none mb-1.5 uppercase opacity-90">
                 SECTOR.0{uiState.level}
               </div>
               <div className="text-[8px] text-[#00f5c4] mf tracking-[0.4em] font-black uppercase opacity-60 leading-none">
                 VAGUE::{uiState.wave}/{uiState.maxWaves}
               </div>
            </div>

            {/* Right Column: Audio Pod */}
            <div className="flex items-center justify-end">
              <button 
                onClick={() => {
                  let next;
                  const total = tracks.length;
                  do { next = Math.floor(Math.random() * total); } while(next === trackIndex && total > 1);
                  setTrackIndex(next);
                }}
                className="flex items-center gap-3 bg-white/[0.03] border border-white/5 py-2 px-3 rounded-xl h-[45px] hover:bg-[#00f5c4]/5 hover:border-[#00f5c4]/20 transition-all group pointer-events-auto"
              >
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-[#00f5c4] tracking-widest uppercase mf opacity-50 mb-1 mt-0.5">TRACK</span>
                  <div className="flex items-center gap-1.5">
                    <Music size={10} className="text-[#00f5c4] opacity-30 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[11px] font-black text-white group-hover:text-[#00f5c4] transition-colors truncate max-w-[80px] uppercase tabular-nums">
                      {tracks[trackIndex].replace('.mp3', '')}
                    </span>
                  </div>
                </div>
                <div className="w-1 h-6 bg-white/10 rounded-sm group-hover:bg-[#00f5c4] group-hover:shadow-[0_0_8px_#00f5c466] transition-all shrink-0" />
              </button>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f5c444] to-transparent" />
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
            onContextMenu={(e)=>e.preventDefault()}
            className="block touch-none" style={{cursor:'pointer', maxWidth:'100%', maxHeight:'100%', aspectRatio:'1/2'}}/>

          {/* Wave announce */}
          {waveAnnounce && (
            <div className="wa absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-25 bg-[#0b0a16]/10" style={{animation:'fadeInOut 2s ease-in-out forwards'}}>
               <div className="flex flex-col items-center">
                  <div className="text-[#00f5c4]/40 text-[10px] font-black tracking-[0.4em] uppercase mb-2 animate-pulse">{waveAnnounce.subtitle}</div>
                  <div style={{
                    fontFamily:"'Orbitron',monospace",fontWeight:900,fontSize:38,letterSpacing:'0.15em',
                    WebkitTextStroke:'1px rgba(255,255,255,0.1)',
                    textAlign: 'center',
                    lineHeight: '1.1',
                    width: '100%',
                    padding: '0 20px'
                  }} className="glitch-text">
                    {waveAnnounce.title}
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-[#00f5c4] shadow-[0_0_10px_#00f5c4]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00f5c4] shadow-[0_0_10px_#00f5c4]" />
                    <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-[#00f5c4] shadow-[0_0_10px_#00f5c4]" />
                  </div>
               </div>
            </div>
          )}

          {/* RADIAL SHOP WRAPPER FOR ALIGNMENT */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative pointer-events-none" style={{ width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/2' }}>
              <AnimatePresence>
                {shopSlot && uiState.status !== 'game_over' && (
                  <RadialShop
                    slot={shopSlot}
                    diamonds={diamonds}
                    onBuy={buyTower}
                    onClose={() => setShopSlotId(null)}
                  />
                )}
                {selSlot && selSlot.tower && !shopSlot && uiState.status !== 'game_over' && (
                  <RadialUpgrade
                    slot={selSlot}
                    diamonds={diamonds}
                    onUpgrade={handleUpgrade}
                    onSell={handleSell}
                    onClose={() => setSelSlotId(null)}
                    sellRatio={bonusesRef.current.sellRatio}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* TACTICAL CONSOLE (Tower Details) */}
          {selTower&&!shopSlot&&uiState.status!=='game_over'&&(
            <div className="si absolute inset-x-0 bottom-0 z-40 pb-0 overflow-hidden hud-panel border-t border-white/20" 
              style={{ background: 'rgba(14,12,27,0.95)', backdropFilter: 'blur(20px)', animation: 'slideUp 0.4s cubic-bezier(0.22,1,0.36,1)' }}>
              
              {/* Scanline Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-20" 
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 245, 196, 0.05) 2px, rgba(0, 245, 196, 0.05) 4px)' }} />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.04] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                    style={{ background: `${selTower.def.color}15`, border: `1.5px solid ${selTower.def.color}40`, color: selTower.def.color }}>
                    <selTower.def.icon size={24} style={{ filter: `drop-shadow(0 0 8px ${selTower.def.color}66)` }} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-black text-sm tracking-widest uppercase">{selTower.def.name}</div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-md leading-none shadow-sm"
                        style={{ background: selTower.level>=5?'rgba(192,132,252,0.18)':selTower.level>=3?'rgba(251,191,36,0.18)':'rgba(255,255,255,0.07)',
                          color: selTower.level>=5?'#c084fc':selTower.level>=3?'#fbbf24':'rgba(255,255,255,0.42)',
                          border: `1px solid ${selTower.level>=5?'rgba(192,132,252,0.3)':selTower.level>=3?'rgba(251,191,36,0.3)':'transparent'}` }}>
                        NIV.{selTower.level}
                      </span>
                    </div>
                    <div className="text-white/25 text-[8px] mf uppercase tracking-[0.3em] font-bold mt-0.5 flex items-center gap-2">
                      <span>CONSOLE_TACTIQUE</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span>{selSlot?.side==='left'?'S_ALPHA':'S_BETA'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end leading-none">
                    <div className="text-[#fbbf24] font-black text-xl mf leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.2)]">{diamonds} <span className="text-[10px]">♦</span></div>
                    <div className="text-white/20 text-[7px] font-black tracking-widest mt-1.5 uppercase">Crédits Dispo</div>
                  </div>
                  <button onClick={()=>{setSelSlotId(null);selSlotIdRef.current=null;}} 
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 hover:border-white/20 border border-transparent flex items-center justify-center text-white/20 hover:text-white transition-all active:scale-90">
                    <X size={18}/>
                  </button>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="px-4 py-5 flex items-center justify-between gap-4 relative z-10">
                {/* Visual Stats Row */}
                <div className="flex gap-3 flex-1">
                  {[
                    { label: 'DMG', val: Math.round(selTower.damage * bonusesRef.current.globalDmg), color: '#ff4d6d', icon: Flame },
                    { label: 'SPD', val: (1/selTower.fireRate).toFixed(1), color: '#60a5fa', icon: Zap },
                    { label: 'RNG', val: Math.round(selTower.range * bonusesRef.current.globalRange), color: '#fbbf24', icon: Target }
                  ].map(s => (
                    <div key={s.label} className="flex flex-col gap-1 flex-1 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="text-white/20 text-[6px] font-black tracking-widest">{s.label}</div>
                        <s.icon size={8} style={{ color: s.color }} />
                      </div>
                      <div className="font-black text-sm mf text-white leading-none my-0.5">{s.val}</div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" 
                          style={{ background: s.color, width: '45%', boxShadow: `0 0 10px ${s.color}66` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Target Strategy */}
                <div className="flex flex-col items-center gap-2 px-4 border-l border-r border-white/5">
                  <div className="text-white/25 text-[7px] font-black tracking-widest uppercase">Ciblage</div>
                  <button onClick={cycleTarget} 
                    className="mf text-[10px] font-black text-[#00f5c4] px-3 py-1.5 rounded-xl bg-[#00f5c4]/5 border border-[#00f5c4]/20 hover:bg-[#00f5c4]/15 hover:border-[#00f5c4]/40 transition-all uppercase flex items-center gap-1.5 shadow-sm">
                    <RotateCcw size={10} className="animate-spin-slow" /> {TM_LABELS[selTower.targetMode]}
                  </button>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleSell} 
                    className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-[#ff3d5a]/10 hover:border-[#ff3d5a]/40 transition-all group active:scale-95">
                    <div className="text-[#ff3d5a] font-black text-xs mf group-hover:scale-110 transition-transform">{selTower.getSellValue(bonusesRef.current.sellRatio)}♦</div>
                    <div className="text-white/20 text-[7px] font-black tracking-widest uppercase mt-1 opacity-60">Vendre</div>
                  </button>
                  
                  <button onClick={handleUpgrade} disabled={diamonds<selTower.upgradeCost}
                    className={`flex flex-col items-center justify-center px-5 h-14 rounded-2xl transition-all active:scale-95 relative overflow-hidden
                    ${diamonds >= selTower.upgradeCost 
                      ? 'bg-[#00f5c4] text-[#0b0a16] shadow-[0_10px_30px_rgba(0,245,196,0.3)] hover:brightness-110' 
                      : 'bg-white/5 border border-white/10 text-white/20 opacity-40 cursor-not-allowed'}`}>
                    <div className="font-black text-base mf leading-none">{selTower.upgradeCost}<span className="text-[10px] ml-0.5">♦</span></div>
                    <div className="font-black text-[9px] tracking-widest uppercase mt-1">Upgrade</div>
                    {diamonds >= selTower.upgradeCost && (
                      <motion.div 
                        initial={{ x: '-100%' }} animate={{ x: '200%' }} 
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                    )}
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
              <div className="flex flex-col gap-3 w-full max-w-[280px]">
                <button onClick={handleAction} className="w-full bg-[#22c55e] text-[#0b0a16] py-4 rounded-2xl font-black text-lg active:scale-95 transition-transform shadow-[0_0_40px_rgba(34,197,94,0.25)] hover:bg-[#16a34a] pointer-events-auto">
                  RECOMMENCER
                </button>
                <button onClick={() => { 
                  if (gameMode === 'arcade') loadCareerProgress();
                  setIsInMenu(true); 
                }} className="w-full bg-white/5 border border-white/10 text-white/60 py-4 rounded-2xl font-black text-lg active:scale-95 transition-all hover:bg-white/10 pointer-events-auto">
                  RETOURNER AU MENU
                </button>
              </div>
              <p className="text-white/18 text-[10px] mt-6">La vague sera réinitialisée</p>
            </div>
          )}

          {/* LEVEL COMPLETE reward screen */}
          {uiState.status==='level_complete'&&levelRewards.length>0&&(
            <div className="fi absolute inset-0 z-30 flex flex-col justify-between py-6 px-6" style={{background:'linear-gradient(180deg,#0a0914 0%,#12112b 100%)',animation:'fadeIn 0.5s ease-out'}}>
              {/* Top Section: Success Message */}
              <div className="flex flex-col items-center mb-2">
                <div className="relative mb-2">
                  <div className="absolute inset-0 bg-[#fbbf24]/20 blur-2xl rounded-full animate-pulse" />
                  <Trophy size={42} className="text-[#fbbf24] relative z-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                </div>
                <div className="text-white/30 text-[8px] tracking-[0.4em] uppercase mb-0.5 font-black">Mission Accomplie</div>
                <h1 className="text-white font-black text-2xl tracking-tighter italic">BIEN JOUÉ !</h1>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[340px] mb-4 mx-auto">
                {[
                  { icon: Skull, val: uiState.kills, label: 'KILLS', color: '#a78bfa' },
                  { icon: Star, val: diamonds, label: 'TOTAL', color: '#fbbf24' },
                  { icon: Heart, val: `${uiState.baseHp}/${10+bonusesRef.current.bonusHp}`, label: 'PV', color: '#4ade80' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-2 flex flex-col items-center gap-0.5 backdrop-blur-sm">
                    <s.icon size={12} className="text-white/20" />
                    <div className="text-sm font-black mf leading-none" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[6px] font-black text-white/15 tracking-widest">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Middle Section: Flow-based Content */}
              <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar py-2">
                {!selectedRewardId ? (
                  /* STEP 1: REWARDS */
                  <div animate-in fade-in slide-in-from-bottom-4 duration-500>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                      <div className="text-white/40 text-[9px] font-black tracking-[0.2em] uppercase whitespace-nowrap">Choisir un bonus</div>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                    </div>
                    <div className="flex flex-col gap-3">
                      {levelRewards.map((r) => (
                        <button key={r.id} onClick={() => handleReward(r)}
                          className="group relative flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all active:scale-[0.98] pointer-events-auto overflow-hidden">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden" 
                               style={{ background: `${r.color}15`, border: `1px solid ${r.color}30` }}>
                            <r.icon size={24} style={{ color: r.color }} />
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-black text-sm text-white tracking-wide uppercase leading-none mb-2">{r.label}</div>
                            <div className="text-white/40 text-[11px] font-medium leading-tight">{r.desc}</div>
                          </div>
                          <ChevronRight className="text-white/10 group-hover:text-white/30 transition-colors" size={20} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* STEP 2: TALENTS & CONFIRMATION */
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                          {(() => {
                            const r = ALL_REWARDS.find((x: any) => x.id === selectedRewardId);
                            return r ? <r.icon size={16} style={{ color: r.color }} /> : null;
                          })()}
                        </div>
                        <div>
                          <div className="text-white/20 text-[7px] font-black tracking-widest uppercase">Bonus Sélectionné</div>
                          <div className="text-white font-black text-[10px] uppercase">{ALL_REWARDS.find((x: any) => x.id === selectedRewardId)?.label}</div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedRewardId(null)} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 text-[8px] font-black tracking-widest uppercase hover:bg-white/10 transition-all">
                        Changer
                      </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c084fc]/10" />
                      <div className="text-[#c084fc]/60 text-[9px] font-black tracking-[0.2em] uppercase whitespace-nowrap">Dépenser vos points ({talentPoints} PT)</div>
                      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c084fc]/10" />
                    </div>

                    <div className="flex flex-col gap-3">
                      {TALENT_TREE?.filter(t => !unlockedTalents.has(t.id) && t.requires.every(req => unlockedTalents.has(req)))?.map(t => (
                        <button key={t.id} onClick={() => handleUnlockTalent(t.id)} disabled={talentPoints < t.cost}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all active:scale-95 pointer-events-auto
                          ${talentPoints >= t.cost ? 'bg-[#c084fc]/5 border-[#c084fc]/20 hover:bg-[#c084fc]/10' : 'bg-white/[0.02] border-white/5 opacity-40 grayscale'}`}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#c084fc]/10 border border-[#c084fc]/20">
                            <t.icon size={20} className="text-[#c084fc]" />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-black text-xs text-white uppercase mb-1">{t.name}</div>
                            <div className="text-white/40 text-[10px] line-clamp-2">{t.desc}</div>
                          </div>
                          <div className="px-3 py-2 rounded-xl bg-[#c084fc]/20 text-[#c084fc] font-black text-[11px] mf border border-[#c084fc]/20">
                            {t.cost} PT
                          </div>
                        </button>
                      ))}
                      
                      <button onClick={() => setShowTalents(true)} className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/30 font-black text-[9px] tracking-[0.3em] uppercase hover:bg-white/10 transition-all pointer-events-auto mt-2">
                        Arbre de Talents complet
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Section: Proceed */}
              <div className="pt-6 border-t border-white/5">
                <button onClick={handleProceed} disabled={!selectedRewardId}
                  className={`w-full py-4 rounded-2xl font-black tracking-[0.15em] transition-all flex items-center justify-center gap-3 pointer-events-auto
                  ${selectedRewardId ? 'bg-[#00f5c4] text-[#0b0a16] shadow-[0_0_30px_rgba(0,245,196,0.3)] hover:scale-[1.02]' : 'bg-white/5 border border-white/10 text-white/20 grayscale cursor-not-allowed'}`}>
                  PASSER AU NIVEAU {uiState.level + 1}
                  <FastForward size={20} />
                </button>
                <div className="text-center mt-4 flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#c084fc] animate-pulse" />
                  <span className="text-white/20 text-[9px] font-black tracking-widest uppercase">+1 Point de Talent acquis</span>
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

          {/* DIAMONDS (Shop Button) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="relative group active:scale-90 transition-transform cursor-default" onClick={handleAction}>
              <div className="w-16 h-16 bg-[#fbbf24] rotate-45 rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.3)] flex items-center justify-center border-4 border-[#0b0a16] group-hover:bg-[#fcd34d] transition-colors">
                <div className="-rotate-45 mf text-xl font-black text-[#0b0a16]">{diamonds}</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {/* BOUTON AOE FLAMME */}
            <button onClick={handleAoESpell} disabled={gs.current.aoeBombs < 1 || uiState.status !== 'playing'}
              className={`w-14 h-14 rounded-2xl border active:scale-90 transition-all flex flex-col items-center justify-center relative shadow-xl
                ${gs.current.aoeBombs >= 1 && uiState.status === 'playing' 
                  ? 'bg-red-500/30 border-red-500/80 text-white bomb-active' 
                  : 'bg-[#171626] border-white/5 opacity-50'}
              `}>
              <Flame size={18} className={gs.current.aoeBombs >= 1 && uiState.status === 'playing' ? 'text-red-400 drop-shadow-[0_0_5px_#ef4444]' : 'text-white/20'}/>
              <div className="text-[8px] font-black text-white/30 mt-0.5">{gs.current.aoeBombs} {gs.current.aoeBombs > 1 ? 'BOMBES' : 'BOMBE'}</div>
              {gs.current.aoeBombs >= 3 && (
                <div className="absolute inset-0 rounded-2xl bg-[#ef4444]/20 animate-ping pointer-events-none" />
              )}
            </button>

            {/* BOUTON VAGUE PRENIUM / TALENTS */}
            <button 
              onClick={() => {
                if (talentPoints > 0 && uiState.status !== 'playing') {
                  toggleTalents(true);
                } else {
                  handleAction();
                }
              }} 
              disabled={uiState.status==='playing'}
              className={`w-14 h-14 rounded-2xl relative flex flex-col items-center justify-center pointer-events-auto active:scale-95 transition-all shadow-2xl overflow-hidden group
                ${uiState.status==='playing' ? 'bg-[#171626]/50 border border-white/5 opacity-50' 
                  : (talentPoints > 0 ? 'bg-[#ff4d6d]/20 border-2 border-[#ff4d6d]/60 shadow-[0_0_20px_#ff4d6d44]' : 'bg-[#171626] border-2 border-white/10 hover:border-white/30')}`}>
              
              {uiState.status === 'idle' && talentPoints === 0 && autoCountdown === 0 && (
                <div className="absolute inset-0 bg-[#00f5c4]/10 animate-pulse" />
              )}
              
              {uiState.status === 'idle' && talentPoints > 0 ? (
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                   <div className="relative mb-1">
                      <Dna size={20} className="text-[#ff4d6d] animate-pulse drop-shadow-[0_0_8px_#ff4d6d]" />
                      <div className="absolute -top-2 -right-2 w-3 h-3 bg-white rounded-full flex items-center justify-center text-[8px] font-black text-black border border-[#ff4d6d]">!</div>
                   </div>
                   <span className="gf text-[8px] font-black text-[#ff4d6d] tracking-widest uppercase">TALENTS</span>
                </div>
              ) : uiState.status === 'idle' && autoCountdown > 0 ? (
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                  <div className={`mf font-black text-xl transition-colors duration-300 ${autoCountdown <= 3 ? 'text-[#ff3d5a] count-urgent' : 'text-[#22c55e]'}`}>
                    {autoCountdown}s
                  </div>
                  <div className="text-[6px] font-black text-white/20 tracking-[0.2em] uppercase mt-0.5">AUTO</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full relative z-10">
                  {uiState.status === 'idle' && autoCountdown === 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="relative mb-1">
                        <Swords size={20} className="text-[#00f5c4] drop-shadow-[0_0_10px_#00f5c4]" />
                      </div>
                      <span className="gf text-[10px] font-black text-[#00f5c4] tracking-[0.1em] uppercase">GO</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-[8px] font-black text-white/20 tracking-widest mb-1 uppercase">Secteur</div>
                      <div className="mf text-base font-black text-white">{uiState.wave}/{uiState.maxWaves}</div>
                    </>
                  )}
                </div>
              )}

              {/* Progress Fill for Countdown */}
              {uiState.status==='idle' && autoCountdown > 0 && talentPoints === 0 && (
                <div className="absolute bottom-0 left-0 right-0 z-0 pointer-events-none opacity-20 bg-[#22c55e]" style={{ height: `${(autoCountdown/10)*100}%`, transition: 'height 1s linear' }} />
              )}
            </button>
          </div>
        </div>

        {/* TALENT MODAL */}
    <TalentModal open={showTalents} onClose={()=>toggleTalents(false)} pts={talentPoints} unlocked={unlockedTalents} onUnlock={handleUnlockTalent}/>
        
    {/* PWA UPDATE PROMPT */}
    {needRefresh && (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-[#1a192d] border-2 border-[#00f5c4] px-5 py-3 rounded-2xl shadow-[0_0_30px_rgba(0,245,196,0.2)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col">
          <div className="text-[#00f5c4] font-black text-xs tracking-widest uppercase">Mise à jour disponible</div>
          <div className="text-white/40 text-[10px]">De nouvelles tours sont prêtes !</div>
        </div>
        <button onClick={() => updateServiceWorker(true)} className="bg-[#00f5c4] text-[#0b0a16] px-4 py-2 rounded-xl font-black text-[10px] tracking-widest hover:scale-105 transition-transform active:scale-95">
          ACTUALISER
        </button>
        <button onClick={() => setNeedRefresh(false)} className="text-white/20 hover:text-white/40 transition-colors">
          <X size={16}/>
        </button>
      </div>
    )}

    {/* PAUSE MODAL */}
        {showPauseModal && (
          <div className="absolute inset-0 z-50 bg-[#0b0a16]/95 backdrop-blur-md flex flex-col items-center justify-center p-8" style={{animation:'fadeIn 0.2s ease-out'}}>
            <div className="w-full max-w-[280px] flex flex-col items-center">
              <div className="relative mb-12">
                <h2 className="text-white font-black text-4xl tracking-tighter opacity-10">PAUSE</h2>
                <h2 className="absolute inset-0 text-[#00f5c4] font-black text-4xl tracking-tighter glitch" style={{textShadow:'0 0 20px rgba(0,245,196,0.5)'}}>PAUSE</h2>
              </div>
              <div className="flex flex-col gap-4 w-full">
                <button onClick={() => setShowPauseModal(false)} 
                  className="w-full py-5 rounded-2xl bg-[#00f5c4] text-[#0b0a16] font-black tracking-[0.2em] active:scale-95 transition-all shadow-[0_0_30px_rgba(0,245,196,0.3)] hover:brightness-110">
                  REPRENDRE
                </button>
                <button onClick={restartLevel} 
                  className="w-full py-4 rounded-xl bg-[#ff3d5a]/20 border border-[#ff3d5a]/40 text-[#ff3d5a] font-bold tracking-widest active:scale-95 transition-all hover:bg-[#ff3d5a]/30">
                  RECOMMENCER
                </button>
                <button onClick={() => setShowSettings(true)} 
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold tracking-widest active:scale-95 transition-all hover:bg-white/10">
                  RÉGLAGES
                </button>
                <div className="h-px w-full bg-white/5 my-2" />
                <button onClick={() => { 
                  setShowPauseModal(false); 
                  if (gameMode === 'arcade') loadCareerProgress();
                  setIsInMenu(true); 
                }} 
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

      {/* Update Available Popup */}
      <AnimatePresence>
        {updateAvailable && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-[#0b0a16] border border-[#00f5c4]/30 rounded-[32px] p-8 max-w-sm w-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] tech-border relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00f5c4] to-transparent opacity-50" />
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#00f5c4]/10 flex items-center justify-center mb-6 border border-[#00f5c4]/20">
                  <RotateCcw size={32} className="text-[#00f5c4] animate-spin-slow" />
                </div>
                <h2 className="gf text-white font-black text-2xl tracking-tighter uppercase mb-2">Mise à jour</h2>
                <p className="mf text-white/50 text-xs leading-relaxed mb-8 uppercase tracking-widest font-bold">
                  Une nouvelle version est disponible sur le serveur.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-[#00f5c4] text-[#0b0a16] font-black tracking-[0.2em] rounded-2xl hover:bg-[#00f5c4]/90 transition-all active:scale-95 shadow-[0_10px_30px_rgba(0,245,196,0.3)]"
                >
                  RECHARGER MAINTENANT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}