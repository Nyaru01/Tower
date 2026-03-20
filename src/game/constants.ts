import { Crosshair, Target, Zap, Snowflake, Bomb, Swords, Pickaxe, Skull, Coins, Crown, Shield, Castle, HeartPulse, Radio, Settings, Flame, Heart, Star, TreePine, Wind, DollarSign, Tag, Database, Layers } from 'lucide-react';

export const CW = 400;
export const CH = 800;

export const C = {
  bg: '#0b0a16', grid: 'rgba(255,255,255,0.01)', path: '#0b0a16',
  eNormal: '#ff4d6d', eFast: '#fbbf24', eTank: '#a78bfa', eBoss: '#ef4444', eHit: '#ffffff',
  diamond: '#fbbf24', health: '#22c55e', healthLow: '#ef4444',
  uiBg: '#171626', uiBorder: '#252438',
};

export interface TowerDef {
  id: string; name: string; icon: any; cost: number;
  color: string; glowColor: string;
  damage: number; fireRate: number; range: number;
  critChance: number; critMult: number; upgradeCost: number;
  special: 'slow' | 'aoe' | null; desc: string; statBar: number[];
}

export const TOWER_TYPES: Record<string, TowerDef> = {
  cannon:{ id:'cannon', name:'Canon',   icon:Crosshair, cost:12, color:'#94a3b8', glowColor:'rgba(148,163,184,0.5)', damage:20, fireRate:0.85, range:175, critChance:0.12, critMult:2.0, upgradeCost:20, special:null,  desc:'Équilibré, polyvalent',       statBar:[0.50,0.50,0.50,0.50] },
  sniper:{ id:'sniper', name:'Sniper',  icon:Target,    cost:22, color:'#10b981', glowColor:'rgba(16,185,129,0.5)',  damage:65, fireRate:2.20, range:280, critChance:0.35, critMult:2.8, upgradeCost:35, special:null,  desc:'Longue portée, hauts dégâts', statBar:[0.90,0.20,0.90,0.85] },
  rapid: { id:'rapid',  name:'Rapide',  icon:Wind,      cost:18, color:'#f59e0b', glowColor:'rgba(245,158,11,0.5)',  damage:9,  fireRate:0.22, range:130, critChance:0.08, critMult:1.8, upgradeCost:28, special:null,  desc:'Cadence extrême',             statBar:[0.25,0.95,0.35,0.60] },
  frost: { id:'frost',  name:'Givrant', icon:Snowflake, cost:25, color:'#38bdf8', glowColor:'rgba(56,189,248,0.5)',  damage:15, fireRate:1.10, range:160, critChance:0.05, critMult:1.5, upgradeCost:30, special:'slow',desc:'Ralentit les ennemis',        statBar:[0.30,0.40,0.45,0.30] },
  mortar:{ id:'mortar', name:'Mortier', icon:Bomb,      cost:35, color:'#f97316', glowColor:'rgba(249,115,22,0.5)',  damage:60, fireRate:3.00, range:220, critChance:0.10, critMult:2.0, upgradeCost:45, special:'aoe', desc:'Dégâts de zone',              statBar:[0.75,0.15,0.70,0.50] },
  tesla: { id:'tesla',  name:'Tesla',   icon:Zap,       cost:45, color:'#8b5cf6', glowColor:'rgba(139,92,246,0.5)',  damage:18, fireRate:0.50, range:140, critChance:0.05, critMult:1.5, upgradeCost:55, special:'aoe', desc:'Multi-cibles (Éclair)',      statBar:[0.40,0.80,0.40,0.40] },
};

export const ENEMY_TYPES = {
  runner: { id: 'runner', name: 'Scout-V', type: 'RAPIDE', color: '#60a5fa', icon: Zap,    counter: 'Tours de tir rapide', hp: 13,  speed: 'Rapide',   desc: 'Unité de reconnaissance légère. Très rapide mais fragile. Priorité basse mais dangereuse en groupe.' },
  tank:   { id: 'tank',   name: 'Goliath-X', type: 'BLINDÉ', color: '#a78bfa', icon: Database, counter: 'Tours Plasma / AOE',   hp: 52,  speed: 'Lent',     desc: 'Char d\'assaut lourd. Grande résistance aux projectiles standards. Nécessite une puissance de feu concentrée.' },
  heavy:  { id: 'heavy',  name: 'Phalanx', type: 'SOLIDE', color: '#fbbf24', icon: Layers,   counter: 'Ralentissement + AOE', hp: 22,  speed: 'Normal',   desc: 'Infanterie lourde équilibrée. Se déplace en formation serrée.' },
  boss:   { id: 'boss',   name: 'Overlord', type: 'BOSS',   color: '#ef4444', icon: Skull,    counter: 'Toutes les défenses',  hp: 300, speed: 'Très Lent', desc: 'Commandant suprême du secteur. Dispose de boucliers adaptatifs.' },
  striker:{ id: 'striker',name: 'Striker',  type: 'ASSAUT', color: '#fb7185', icon: Target,   counter: 'Défense haute',        hp: 45,  speed: 'Normal',   desc: 'Unité d\'assaut rapide capable de tirer sur vos tours.' },
  shield: { id: 'shield', name: 'Aegis',    type: 'BOUCLIER',color: '#38bdf8', icon: Shield,   counter: 'Dégâts de zone',       hp: 35,  speed: 'Normal',   desc: 'Unité équipée d\'un dôme protecteur absorbant les premiers impacts.' },
};

export interface TalentNode {
  id: string; branch: 'atk'|'eco'|'def'|'tech'; tier: number;
  name: string; desc: string; icon: any; requires: string[]; cost: number;
}

export const TALENT_TREE: TalentNode[] = [
  { id:'atk1', branch:'atk',  tier:1, name:'Acier Aiguisé', desc:'+15% dégâts globaux',           icon:Swords, requires:[],       cost:1 },
  { id:'atk2', branch:'atk',  tier:2, name:'Œil de Lynx',   desc:'+12% chance critique globale',   icon:Target, requires:['atk1'], cost:1 },
  { id:'atk3', branch:'atk',  tier:3, name:'Dévastation',   desc:'Crit ×1.5 multiplicateur',       icon:Skull, requires:['atk2'], cost:2 },
  { id:'eco1', branch:'eco',  tier:1, name:'Mineur',         desc:'+1♦ garanti par kill',           icon:Pickaxe, requires:[],       cost:1 },
  { id:'eco2', branch:'eco',  tier:2, name:'Négociant',      desc:'Vente des tours à 75%',          icon:Coins, requires:['eco1'], cost:1 },
  { id:'eco3', branch:'eco',  tier:3, name:'Fortune',        desc:'+75% récompense fin niveau',     icon:Crown, requires:['eco2'], cost:2 },
  { id:'def1', branch:'def',  tier:1, name:'Rempart',        desc:'+3 points de vie de base',       icon:Shield, requires:[],       cost:1 },
  { id:'def2', branch:'def',  tier:2, name:'Fortification',  desc:'Boss infligent −2 dégâts',       icon:Castle, requires:['def1'], cost:1 },
  { id:'def3', branch:'def',  tier:3, name:'Régénération',   desc:'+1 vie par niveau complet',      icon:HeartPulse, requires:['def2'], cost:2 },
  { id:'tec1', branch:'tech', tier:1, name:'Longue Portée',  desc:'+20% portée de toutes les tours',icon:Radio, requires:[],       cost:1 },
  { id:'tec2', branch:'tech', tier:2, name:'Mécanisme',      desc:'−15% temps de rechargement',     icon:Settings, requires:['tec1'], cost:1 },
  { id:'tec3', branch:'tech', tier:3, name:'Suprématie',     desc:'+20% dégâts supplémentaires',    icon:Flame, requires:['tec2'], cost:2 },
];

export interface TalentBonuses {
  globalDmg: number; globalRange: number; globalFireRate: number;
  globalCrit: number; critMultBonus: number;
  bonusDrop: number; sellRatio: number; levelBonusMult: number;
  bonusHp: number; bossReduct: number; regenPerLevel: number;
}

export function computeBonuses(u: Set<string>): TalentBonuses {
  return {
    globalDmg:      1+(u.has('atk1')?0.15:0)+(u.has('tec3')?0.20:0),
    globalRange:    1+(u.has('tec1')?0.20:0),
    globalFireRate: 1-(u.has('tec2')?0.15:0),
    globalCrit:     u.has('atk2')?0.12:0,
    critMultBonus:  u.has('atk3')?0.50:0,
    bonusDrop:      u.has('eco1')?1:0,
    sellRatio:      u.has('eco2')?0.75:0.60,
    levelBonusMult: u.has('eco3')?1.75:1,
    bonusHp:        u.has('def1')?3:0,
    bossReduct:     u.has('def2')?2:0,
    regenPerLevel:  u.has('def3')?1:0,
  };
}

export type RewardId = 'heal'|'diamonds'|'talent'|'upgrade_free'|'speed_boost'|'gold_rush'|'tower_discount'|'aoe_bomb';
export interface Reward { id:RewardId; icon:any; label:string; desc:string; color:string; }

export const ALL_REWARDS: Reward[] = [
  {id:'heal',           icon:Heart,       label:'Soin',          desc:'Récupère +2 points de vie',               color:'#4ade80'},
  {id:'diamonds',       icon:Star,        label:'Trésor',         desc:'Bonus de +40 diamants',                   color:'#fbbf24'},
  {id:'talent',         icon:TreePine,    label:'Inspiration',    desc:'+1 point de talent supplémentaire',       color:'#c084fc'},
  {id:'upgrade_free',   icon:Zap,         label:'Amélioration',   desc:'Prochaine amélioration de tour gratuite', color:'#60a5fa'},
  {id:'speed_boost',    icon:Wind,        label:'Frénésie',       desc:'+20% cadence de feu ce niveau',           color:'#fb923c'},
  {id:'gold_rush',      icon:DollarSign,  label:"Rush d'Or",      desc:'+50% diamants gagnés ce niveau',          color:'#fbbf24'},
  {id:'tower_discount', icon:Tag,         label:'Rabais',         desc:'Tours -20% moins chères ce niveau',       color:'#34d399'},
  {id:'aoe_bomb',       icon:Bomb,        label:'Bombe AOE',      desc:'Ajoute +1 Bombe AOE à votre arsenal',    color:'#ef4444'},
];

export function pickRewards(lvl: number): Reward[] {
  const pool=[...ALL_REWARDS];const chosen:Reward[]=[];const used=new Set<number>();
  if(lvl>=2&&Math.random()<0.6){used.add(0);chosen.push(pool[0]);}
  while(chosen.length<3){const i=Math.floor(Math.random()*pool.length);if(!used.has(i)){used.add(i);chosen.push(pool[i]);}}
  return chosen;
}

export const LEVELS_DATA = [
  {waves:4,baseMobs:3,mobMult:1}, // Level 1
  {waves:5,baseMobs:4,mobMult:1.5}, // Level 2
  {waves:5,baseMobs:6,mobMult:2}, // Level 3
  {waves:6,baseMobs:7,mobMult:2.5}, // Level 4
  {waves:7,baseMobs:8,mobMult:3}, // Level 5
];

export const getLevelData = (lvl: number) =>
  lvl<=LEVELS_DATA.length ? LEVELS_DATA[lvl-1]
  : {waves:6+Math.floor(lvl/5), baseMobs:8+lvl, mobMult:3+Math.floor(lvl/3)};

export type TargetMode = 'first'|'last'|'strong';

export const TM_LABELS:Record<TargetMode,string>={first:'1er',last:'Dern.',strong:'Fort'};
export const TM_CYCLE:TargetMode[]=['first','last','strong'];

export const BRANCH_META=[
  {id:'atk', label:'ATTAQUE',  color:'#ff4d6d', icon:Swords},
  {id:'eco', label:'ÉCONOMIE', color:'#fbbf24', icon:Pickaxe},
  {id:'def', label:'DÉFENSE',  color:'#4ade80', icon:Shield},
  {id:'tech',label:'TECH',     color:'#60a5fa', icon:Settings},
];
export const INITIAL_LEVELS: Record<number, any> = {
  1: {
    path: [{x:200,y:70},{x:200,y:675}],
    slots: [
      {id:1,x:106,y:250,r:16,tower:null,side:'left'},{id:2,x:106,y:400,r:16,tower:null,side:'left'},
      {id:3,x:106,y:550,r:16,tower:null,side:'left'},{id:4,x:294,y:250,r:16,tower:null,side:'right'},
      {id:5,x:294,y:400,r:16,tower:null,side:'right'},{id:6,x:294,y:550,r:16,tower:null,side:'right'},
    ]
  },
  2: {
    path: [{x:200,y:70}, {x:100,y:250}, {x:300,y:450}, {x:200,y:750}],
    slots: [
      {id:1,x:240,y:180,r:16,tower:null,side:'right'}, {id:2,x:50,y:350,r:16,tower:null,side:'left'},
      {id:3,x:350,y:350,r:16,tower:null,side:'right'}, {id:4,x:180,y:500,r:16,tower:null,side:'left'},
      {id:5,x:280,y:650,r:16,tower:null,side:'right'}, {id:6,x:100,y:600,r:16,tower:null,side:'left'},
    ]
  },
  3: {
    path: [{x:100,y:70}, {x:100,y:550}, {x:300,y:550}, {x:300,y:750}],
    slots: [
      {id:1,x:200,y:300,r:16,tower:null,side:'center'}, {id:2,x:200,y:450,r:16,tower:null,side:'center'},
      {id:3,x:40,y:300,r:16,tower:null,side:'left'}, {id:4,x:360,y:300,r:16,tower:null,side:'right'},
      {id:5,x:40,y:450,r:16,tower:null,side:'left'}, {id:6,x:360,y:450,r:16,tower:null,side:'right'},
    ]
  },
  4: {
    path: [{x:200,y:70}, {x:350,y:200}, {x:50,y:350}, {x:350,y:500}, {x:200,y:750}],
    slots: [
      {id:1,x:200,y:250,r:16,tower:null,side:'center'}, {id:2,x:200,y:400,r:16,tower:null,side:'center'},
      {id:3,x:80,y:150,r:16,tower:null,side:'left'}, {id:4,x:320,y:350,r:16,tower:null,side:'right'},
      {id:5,x:80,y:550,r:16,tower:null,side:'left'}, {id:6,x:320,y:650,r:16,tower:null,side:'right'},
    ]
  },
  5: {
    path: [{x:100,y:70}, {x:100,y:200}, {x:300,y:200}, {x:300,y:400}, {x:100,y:400}, {x:100,y:600}, {x:300,y:600}, {x:300,y:750}],
    slots: [
      {id:1,x:200,y:110,r:16,tower:null,side:'center'}, {id:2,x:200,y:300,r:16,tower:null,side:'center'},
      {id:3,x:200,y:500,r:16,tower:null,side:'center'}, {id:4,x:40,y:300,r:16,tower:null,side:'left'},
      {id:5,x:360,y:500,r:16,tower:null,side:'right'}, {id:6,x:200,y:680,r:16,tower:null,side:'center'},
    ]
  },
};
