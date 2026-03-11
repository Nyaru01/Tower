import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Pause, FastForward, Trophy, Lock as LockIcon, X, Target, Star, RotateCcw, TreePine, Flame, Skull, Swords, Pickaxe, Coins, Castle, HeartPulse, Radio, Settings, Crown, Shield, Heart, Wind, Tag, DollarSign, Zap, Dna, Crosshair, Snowflake, Bomb } from 'lucide-react';
import MainMenu from './ui/MainMenu';

const CW = 400, CH = 800;
const C = {
  bg: '#0b0a16', grid: 'rgba(255,255,255,0.01)', path: '#0b0a16',
  eNormal: '#ff4d6d', eFast: '#fbbf24', eTank: '#a78bfa', eBoss: '#ef4444', eHit: '#ffffff',
  diamond: '#fbbf24', health: '#22c55e', healthLow: '#ef4444',
  uiBg: '#171626', uiBorder: '#252438',
};

interface TowerDef {
  id: string; name: string; icon: any; cost: number;
  color: string; glowColor: string;
  damage: number; fireRate: number; range: number;
  critChance: number; critMult: number; upgradeCost: number;
  special: 'slow' | 'aoe' | null; desc: string; statBar: number[];
}

const TOWER_TYPES: Record<string, TowerDef> = {
  cannon:{ id:'cannon', name:'Canon',   icon:Crosshair, cost:15, color:'#cbd5e1', glowColor:'rgba(203,213,225,0.5)', damage:18, fireRate:0.85, range:175, critChance:0.12, critMult:2.0, upgradeCost:20, special:null,  desc:'Équilibré, polyvalent',       statBar:[0.50,0.50,0.50,0.50] },
  sniper:{ id:'sniper', name:'Sniper',  icon:Target,    cost:25, color:'#34d399', glowColor:'rgba(52,211,153,0.5)',  damage:55, fireRate:2.20, range:280, critChance:0.35, critMult:2.8, upgradeCost:35, special:null,  desc:'Longue portée, hauts dégâts', statBar:[0.90,0.20,0.90,0.85] },
  rapid: { id:'rapid',  name:'Rapide',  icon:Zap,       cost:20, color:'#fbbf24', glowColor:'rgba(251,191,36,0.5)',  damage:7,  fireRate:0.22, range:130, critChance:0.08, critMult:1.8, upgradeCost:28, special:null,  desc:'Cadence extrême',             statBar:[0.25,0.95,0.35,0.60] },
  frost: { id:'frost',  name:'Givrant', icon:Snowflake, cost:30, color:'#7dd3fc', glowColor:'rgba(125,211,252,0.5)', damage:10, fireRate:1.10, range:160, critChance:0.05, critMult:1.5, upgradeCost:30, special:'slow',desc:'Ralentit les ennemis',        statBar:[0.30,0.40,0.45,0.30] },
  mortar:{ id:'mortar', name:'Mortier', icon:Bomb,      cost:40, color:'#fb923c', glowColor:'rgba(251,146,60,0.5)',  damage:40, fireRate:3.00, range:220, critChance:0.10, critMult:2.0, upgradeCost:45, special:'aoe', desc:'Dégâts de zone',              statBar:[0.75,0.15,0.70,0.50] },
};

interface TalentNode {
  id: string; branch: 'atk'|'eco'|'def'|'tech'; tier: number;
  name: string; desc: string; icon: any; requires: string[]; cost: number;
}

const TALENT_TREE: TalentNode[] = [
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

interface TalentBonuses {
  globalDmg: number; globalRange: number; globalFireRate: number;
  globalCrit: number; critMultBonus: number;
  bonusDrop: number; sellRatio: number; levelBonusMult: number;
  bonusHp: number; bossReduct: number; regenPerLevel: number;
}

function computeBonuses(u: Set<string>): TalentBonuses {
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

// ─── Level rewards ────────────────────────────────────────────────────────────
type RewardId = 'heal'|'diamonds'|'talent'|'upgrade_free'|'speed_boost'|'gold_rush'|'tower_discount';
interface Reward { id:RewardId; icon:any; label:string; desc:string; color:string; }
const ALL_REWARDS: Reward[] = [
  {id:'heal',           icon:Heart,       label:'Soin',          desc:'Récupère +2 points de vie',               color:'#4ade80'},
  {id:'diamonds',       icon:Star,        label:'Trésor',         desc:'Bonus de +40 diamants',                   color:'#fbbf24'},
  {id:'talent',         icon:TreePine,    label:'Inspiration',    desc:'+1 point de talent supplémentaire',       color:'#c084fc'},
  {id:'upgrade_free',   icon:Zap,         label:'Amélioration',   desc:'Prochaine amélioration de tour gratuite', color:'#60a5fa'},
  {id:'speed_boost',    icon:Wind,        label:'Frénésie',       desc:'+20% cadence de feu ce niveau',           color:'#fb923c'},
  {id:'gold_rush',      icon:DollarSign,  label:"Rush d'Or",      desc:'+50% diamants gagnés ce niveau',          color:'#fbbf24'},
  {id:'tower_discount', icon:Tag,         label:'Rabais',         desc:'Tours -20% moins chères ce niveau',       color:'#34d399'},
];
function pickRewards(lvl: number): Reward[] {
  const pool=[...ALL_REWARDS];const chosen:Reward[]=[];const used=new Set<number>();
  if(lvl>=2&&Math.random()<0.6){used.add(0);chosen.push(pool[0]);}
  while(chosen.length<3){const i=Math.floor(Math.random()*pool.length);if(!used.has(i)){used.add(i);chosen.push(pool[i]);}}
  return chosen;
}

const LEVELS_DATA = [
  {waves:4,baseMobs:3,mobMult:1},{waves:5,baseMobs:4,mobMult:2},{waves:5,baseMobs:5,mobMult:2},
  {waves:6,baseMobs:6,mobMult:3},{waves:6,baseMobs:8,mobMult:3},
];
const getLevelData = (lvl: number) =>
  lvl<=LEVELS_DATA.length ? LEVELS_DATA[lvl-1]
  : {waves:6+Math.floor(lvl/5), baseMobs:8+lvl, mobMult:3+Math.floor(lvl/3)};

// ── Game classes ──────────────────────────────────────────────────────────────
class FloatingText {
  x:number;y:number;text:string;color:string;life=1.0;scale:number;vy:number;cl:number;
  constructor(x:number,y:number,text:any,cl=0,cc:string|null=null){
    this.x=x+(Math.random()*24-12);this.y=y;this.cl=cl;
    if(cc){this.text=String(text);this.color=cc;this.scale=0.9;this.vy=32;}
    else if(cl>=2){this.text=`${text}!!`;this.color='#c084fc';this.scale=0.6;this.vy=60;}
    else if(cl===1){this.text=`${text}!`;this.color='#fbbf24';this.scale=0.55;this.vy=48;}
    else{this.text=String(text);this.color='#f8fafc';this.scale=0.45;this.vy=40;}
  }
  update(dt:number){
    this.y-=this.vy*dt;this.life-=dt*1.6;
    const t=1+this.cl*0.45;if(this.scale<t)this.scale=Math.min(t,this.scale+dt*9);
    return this.life<=0;
  }
  draw(ctx:CanvasRenderingContext2D){
    ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.scale,this.scale);
    ctx.globalAlpha=Math.max(0,this.life);
    ctx.font=`900 ${this.cl>=2?18:15}px 'Space Grotesk',sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.lineWidth=4;ctx.strokeText(this.text,0,0);
    ctx.fillStyle=this.color;ctx.fillText(this.text,0,0);ctx.restore();
  }
}

class Particle {
  x:number;y:number;vx:number;vy:number;life=1.0;color:string;size:number;decay:number;
  constructor(x:number,y:number,color:string,size=2.5,sm=1){
    this.x=x;this.y=y;this.color=color;this.size=size;
    const a=Math.random()*Math.PI*2,s=(Math.random()*140+40)*sm;
    this.vx=Math.cos(a)*s;this.vy=Math.sin(a)*s;this.decay=2.5+Math.random()*1.5;
  }
  update(dt:number){this.x+=this.vx*dt;this.y+=this.vy*dt;this.vx*=0.88;this.vy*=0.88;this.life-=dt*this.decay;return this.life<=0;}
  draw(ctx:CanvasRenderingContext2D){
    ctx.globalAlpha=Math.max(0,this.life*this.life);ctx.fillStyle=this.color;
    ctx.beginPath();ctx.arc(this.x,this.y,this.size*Math.max(0.1,this.life),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
}

class RingBurst {
  x:number;y:number;color:string;radius=0;max:number;life=1.0;
  constructor(x:number,y:number,color:string,max:number){this.x=x;this.y=y;this.color=color;this.max=max;}
  update(dt:number){this.radius+=this.max*dt*3.5;this.life-=dt*3.5;return this.life<=0;}
  draw(ctx:CanvasRenderingContext2D){
    ctx.globalAlpha=Math.max(0,this.life*0.55);
    ctx.strokeStyle=this.color;ctx.lineWidth=2;ctx.shadowColor=this.color;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
}

class AoeBlast {
  x:number;y:number;radius=0;max:number;life=1.0;
  constructor(x:number,y:number,r:number){this.x=x;this.y=y;this.max=r;}
  update(dt:number){this.radius+=this.max*dt*4;this.life-=dt*4;return this.life<=0;}
  draw(ctx:CanvasRenderingContext2D){
    const g=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.radius);
    g.addColorStop(0,'rgba(251,146,60,0)');g.addColorStop(0.6,`rgba(251,146,60,${this.life*0.22})`);g.addColorStop(1,'rgba(251,146,60,0)');
    ctx.globalAlpha=this.life;ctx.fillStyle=g;ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=`rgba(251,146,60,${this.life*0.65})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
  }
}

type TargetMode = 'first'|'last'|'strong';

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
function playKillSound(isBoss: boolean) {
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  if (isBoss) {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } else {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500 + Math.random()*300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
}

function killEnemy(e:any,state:any,addDia:(n:number)=>void,bon:TalentBonuses){
  playKillSound(e.isBoss);
  if(e.isBoss) state.bossPoints = (state.bossPoints||0) + 1;
  const cnt=e.isBoss?28:10;
  for(let i=0;i<cnt;i++)state.particles.push(new Particle(e.x,e.y,e.color,e.isBoss?4.5:2.5,e.isBoss?1.4:1));
  state.rings.push(new RingBurst(e.x,e.y,e.color,e.isBoss?55:30));
  if(e.isBoss)state.rings.push(new RingBurst(e.x,e.y,'#fff',72));
  let gained=bon.bonusDrop;
  if(e.isBoss)gained+=15+Math.floor(Math.random()*10);
  else if(e.type==='tank'&&Math.random()<0.6)gained+=2;
  else if(Math.random()<0.25)gained+=1;
  if(gained>0){
    const actualGained=state.goldRush?Math.ceil(gained*1.5):gained;
    addDia(actualGained);
    state.floatingTexts.push(new FloatingText(e.x,e.y-25,`+${actualGained}♦`,0,C.diamond));
  }
  state.kills++;
}

class Projectile {
  x:number;y:number;target:any;speed:number;damage:number;cl:number;color:string;special:string|null;size:number;history:{x:number,y:number}[];
  constructor(x:number,y:number,target:any,dmg:number,cl:number,color:string,special:string|null){
    this.x=x;this.y=y;this.target=target;this.damage=dmg;this.cl=cl;this.color=color;this.special=special;
    this.speed=special==='slow'?900:special==='aoe'?650:1350;
    this.size=special==='aoe'?5:special==='slow'?4:2.5;
    this.history=[{x,y}];
  }
  update(dt:number,state:any,addDia:(n:number)=>void,bon:TalentBonuses){
    if(!state.enemies.includes(this.target))return true;
    const dx=this.target.x-this.x,dy=this.target.y-this.y,dist=Math.hypot(dx,dy);
    if(dist<this.speed*dt){
      if(this.special==='aoe'){
        const r=68;state.aoeBlasts.push(new AoeBlast(this.target.x,this.target.y,r));
        for(const e of state.enemies){
          if(Math.hypot(e.x-this.target.x,e.y-this.target.y)<=r){
            e.hp-=this.damage;e.hitFlash=0.07;
            state.floatingTexts.push(new FloatingText(e.x,e.y-e.radius,Math.ceil(this.damage),this.cl));
            for(let i=0;i<3;i++)state.particles.push(new Particle(e.x,e.y,'#fb923c',2));
            if(e.hp<=0)killEnemy(e,state,addDia,bon);
          }
        }
      } else {
        this.target.hp-=this.damage;this.target.hitFlash=0.07;
        if(this.special==='slow')this.target.slowTimer=2.8;
        state.floatingTexts.push(new FloatingText(this.target.x,this.target.y-this.target.radius,Math.ceil(this.damage),this.cl));
        const col=this.cl>=2?'#c084fc':this.cl===1?'#fbbf24':this.color;
        for(let i=0;i<4;i++)state.particles.push(new Particle(this.target.x,this.target.y,col,2));
        if(this.special==='slow')for(let i=0;i<4;i++)state.particles.push(new Particle(this.target.x,this.target.y,'#7dd3fc',2.5));
        if(this.target.hp<=0)killEnemy(this.target,state,addDia,bon);
      }
      return true;
    }
    this.x+=(dx/dist)*this.speed*dt;this.y+=(dy/dist)*this.speed*dt;
    this.history.push({x:this.x,y:this.y});if(this.history.length>4)this.history.shift();
    return false;
  }
  draw(ctx:CanvasRenderingContext2D){
    const col=this.cl>=2?'#c084fc':this.cl===1?'#fbbf24':this.color;
    ctx.shadowColor=col;ctx.shadowBlur=this.cl>0?12:6;
    ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.shadowBlur=0;
    if(this.history.length>1){
      ctx.beginPath();ctx.moveTo(this.history[0].x,this.history[0].y);ctx.lineTo(this.x,this.y);
      ctx.strokeStyle=col;ctx.lineWidth=this.cl>0?2.5:1.5;ctx.globalAlpha=0.4;ctx.lineCap='round';ctx.stroke();ctx.globalAlpha=1;
    }
  }
}

class Enemy {
  x:number;y:number;isBoss:boolean;type:string;color:string;
  speed:number;baseSpeed:number;maxHp:number;hp:number;radius:number;
  history:{x:number,y:number}[]=[];hitFlash=0;wobble:number;spawnAnim=0;slowTimer=0;
  constructor(abs:number,isBoss=false){
    this.x=200+(Math.random()*28-14);this.y=70;this.isBoss=isBoss;this.wobble=Math.random()*Math.PI*2;
    // Courbe HP progressive : linéaire jusqu'au niveau 3, puis légère accélération
    // abs=1→×1.2  abs=5→×1.9  abs=10→×2.9  abs=15→×4.0  (vs 1.25^abs qui donnait ×9 à abs=10)
    const hm = 1 + abs * 0.18 + Math.pow(Math.max(0, abs - 8), 1.4) * 0.04;
    const sb = abs * 2.2; // vitesse aussi légèrement réduite
    const rand = Math.random();
    if(isBoss){this.type='boss';this.color=C.eBoss;this.speed=28+sb*0.45;this.maxHp=320*hm;this.radius=22;}
    else if(abs>3&&rand>0.8){this.type='tank';this.color=C.eTank;this.speed=32+sb*0.55;this.maxHp=52*hm;this.radius=13;}
    else if(abs>2&&rand>0.5){this.type='fast';this.color=C.eFast;this.speed=95+sb*1.3;this.maxHp=13*hm;this.radius=7;}
    else{this.type='normal';this.color=C.eNormal;this.speed=58+sb;this.maxHp=22*hm;this.radius=9;}
    this.baseSpeed=this.speed;this.hp=this.maxHp;
  }
  update(dt:number){
    this.spawnAnim=Math.min(1,this.spawnAnim+dt*6);
    if(this.slowTimer>0){this.slowTimer-=dt;this.speed=this.baseSpeed*0.38;}
    else this.speed=Math.min(this.baseSpeed,this.speed+dt*60);
    this.y+=this.speed*dt;
    if(this.hitFlash>0)this.hitFlash-=dt;
    this.history.push({x:this.x,y:this.y});if(this.history.length>8)this.history.shift();
    return this.y>675;
  }
  draw(ctx:CanvasRenderingContext2D,ts:number){
    const sl=this.slowTimer>0;
    this.history.forEach((p,i)=>{
      const r=i/this.history.length;ctx.globalAlpha=r*0.28*this.spawnAnim;
      ctx.fillStyle=sl?'#7dd3fc':this.color;ctx.beginPath();
      if(this.isBoss)ctx.roundRect(p.x-this.radius*r*0.8,p.y-this.radius*r*0.8,this.radius*r*1.6,this.radius*r*1.6,5);
      else ctx.arc(p.x,p.y,this.radius*r*0.8,0,Math.PI*2);ctx.fill();
    });ctx.globalAlpha=1;
    const wb=1+Math.sin(ts*0.005+this.wobble)*(this.isBoss?0.04:0.07);
    ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.spawnAnim*wb,this.spawnAnim*wb);
    const isHit=this.hitFlash>0;
    const dc=isHit?C.eHit:sl?'#7dd3fc':this.color;
    if(!isHit){ctx.shadowColor=sl?'#7dd3fc':this.color;ctx.shadowBlur=this.isBoss?22:12;}
    ctx.fillStyle=dc;ctx.beginPath();
    if(this.type==='tank')ctx.roundRect(-this.radius,-this.radius,this.radius*2,this.radius*2,5);
    else if(this.isBoss)ctx.roundRect(-this.radius,-this.radius,this.radius*2,this.radius*2,9);
    else ctx.arc(0,0,this.radius,0,Math.PI*2);
    ctx.fill();ctx.shadowBlur=0;
    if(this.type==='tank'&&!isHit){ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-this.radius+3,0);ctx.lineTo(this.radius-3,0);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-this.radius+3);ctx.lineTo(0,this.radius-3);ctx.stroke();}
    if(this.type==='fast'&&!isHit){ctx.fillStyle='rgba(0,0,0,0.3)';ctx.beginPath();ctx.moveTo(0,-this.radius+2);ctx.lineTo(3,1);ctx.lineTo(-3,1);ctx.closePath();ctx.fill();}
    if(this.isBoss&&!isHit){ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(-9,-6,7,10);ctx.fillRect(2,-6,7,10);ctx.fillStyle='#fff';ctx.fillRect(-7,-3,3,5);ctx.fillRect(4,-3,3,5);}
    if(sl){ctx.strokeStyle='rgba(125,211,252,0.55)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,0,this.radius+4,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
    const hr=Math.max(0,this.hp/this.maxHp);
    if(hr<1){
      const bw=this.isBoss?36:20,bx=this.x-bw/2,by=this.y-this.radius-11;
      ctx.globalAlpha=this.spawnAnim;ctx.fillStyle='rgba(0,0,0,0.65)';ctx.beginPath();ctx.roundRect(bx-1,by-1,bw+2,6,3);ctx.fill();
      ctx.fillStyle=hr>0.4?C.health:C.healthLow;ctx.beginPath();ctx.roundRect(bx,by,bw*hr,4,2);ctx.fill();ctx.globalAlpha=1;
    }
  }
}

class Tower {
  x:number;y:number;side:string;def:TowerDef;level=1;
  damage:number;fireRate:number;range:number;critChance:number;critMult:number;
  upgradeCost:number;totalSpent:number;maxMulticrit=2;
  angle:number;scale=0;pulseRing=0;cooldown=0;targetMode:TargetMode='first';
  constructor(x:number,y:number,side:string,def:TowerDef){
    this.x=x;this.y=y;this.side=side;this.def=def;
    this.damage=def.damage;this.fireRate=def.fireRate;this.range=def.range;
    this.critChance=def.critChance;this.critMult=def.critMult;
    this.upgradeCost=def.upgradeCost;this.totalSpent=def.cost;
    this.angle=side==='left'?0:Math.PI;
  }
  getSellValue(r:number){return Math.floor(this.totalSpent*r);}
  get dps(){return(this.damage/this.fireRate)*(1+this.critChance*(this.critMult-1));}
  upgrade(){
    this.level++;this.damage+=this.def.damage*0.4;this.fireRate=Math.max(0.1,this.fireRate*0.92);
    this.range+=8;this.critChance=Math.min(0.85,this.critChance+0.025);
    if(this.level%5===0)this.maxMulticrit++;
    this.totalSpent+=this.upgradeCost;this.upgradeCost=Math.floor(this.upgradeCost*1.55);
    this.scale=1.4;this.pulseRing=0.1;
  }
  pickTarget(enemies:any[],bon:TalentBonuses):any{
    const rng=this.range*bon.globalRange;
    const inR=enemies.filter((e:any)=>Math.hypot(e.x-this.x,e.y-this.y)<=rng);
    if(!inR.length)return null;
    if(this.targetMode==='first')return inR.reduce((a:any,b:any)=>b.y>a.y?b:a);
    if(this.targetMode==='last')return inR.reduce((a:any,b:any)=>b.y<a.y?b:a);
    return inR.reduce((a:any,b:any)=>b.hp>a.hp?b:a);
  }
  update(dt:number,state:any,bon:TalentBonuses){
    this.cooldown-=dt;
    if(this.scale>1)this.scale=Math.max(1,this.scale-dt*3.5);
    else if(this.scale<1)this.scale=Math.min(1,this.scale+dt*6);
    if(this.pulseRing>0){this.pulseRing+=dt*185;if(this.pulseRing>58)this.pulseRing=0;}
    const target=this.pickTarget(state.enemies,bon);
    if(target){
      const ta=Math.atan2(target.y-this.y,target.x-this.x);
      this.angle+=Math.atan2(Math.sin(ta-this.angle),Math.cos(ta-this.angle))*16*dt;
      if(this.cooldown<=0){
        const fr=this.fireRate*bon.globalFireRate*(state.speedBoost?0.80:1);
        const sx=this.x+Math.cos(this.angle)*15,sy=this.y+Math.sin(this.angle)*15;
        const bd=this.damage*bon.globalDmg;
        const cc=Math.min(0.95,this.critChance+bon.globalCrit);
        const cm=this.critMult+bon.critMultBonus;
        let dmg=bd,cl=0;
        while(Math.random()<cc&&cl<this.maxMulticrit){cl++;dmg*=cm;}
        state.projectiles.push(new Projectile(sx,sy,target,dmg,cl,this.def.color,this.def.special));
        this.cooldown=fr;this.scale=1.18;
      }
    } else{this.angle+=dt*0.35;}
  }
  draw(ctx:CanvasRenderingContext2D,sel=false){
    const col=this.def.color;
    if(sel){
      ctx.beginPath();ctx.arc(this.x,this.y,this.range,0,Math.PI*2);
      ctx.fillStyle=`${col}07`;ctx.fill();
      ctx.strokeStyle=`${col}30`;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    }
    if(this.pulseRing>0){ctx.beginPath();ctx.arc(this.x,this.y,this.pulseRing,0,Math.PI*2);ctx.strokeStyle=`rgba(255,255,255,${(1-this.pulseRing/58)*0.8})`;ctx.lineWidth=2.5;ctx.stroke();}
    ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.scale,this.scale);
    const gc=this.level>=5?'#c084fc':this.level>=3?'#fbbf24':this.def.glowColor;
    ctx.shadowColor=gc;ctx.shadowBlur=10+this.level*1.5;
    ctx.rotate(this.angle);ctx.fillStyle=col;
    if(this.def.id==='cannon'){ctx.beginPath();ctx.roundRect(8,-4.5,17,9,3);ctx.fill();}
    else if(this.def.id==='sniper'){ctx.beginPath();ctx.roundRect(6,-2.5,22,5,2);ctx.fill();ctx.beginPath();ctx.roundRect(6,-5,5,10,1);ctx.fill();}
    else if(this.def.id==='rapid'){ctx.beginPath();ctx.roundRect(8,-5.5,14,4,2);ctx.fill();ctx.beginPath();ctx.roundRect(8,1.5,14,4,2);ctx.fill();}
    else if(this.def.id==='frost'){ctx.beginPath();ctx.roundRect(8,-3.5,16,7,3.5);ctx.fill();}
    else if(this.def.id==='mortar'){ctx.beginPath();ctx.roundRect(5,-6.5,10,13,3);ctx.fill();}
    ctx.shadowBlur=0;
    const bs=13;
    ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.fillStyle=C.bg;
    if(this.def.id==='frost'){ctx.beginPath();ctx.arc(0,0,bs,0,Math.PI*2);ctx.stroke();ctx.fill();}
    else if(this.def.id==='sniper'){ctx.beginPath();ctx.roundRect(-bs,-bs,bs*2,bs*2,4);ctx.stroke();ctx.fill();}
    else{ctx.beginPath();ctx.roundRect(-bs,-bs,bs*2,bs*2,7);ctx.stroke();ctx.fill();}
    ctx.rotate(-this.angle);
    ctx.fillStyle=this.level>=5?'#c084fc':this.level>=3?'#fbbf24':col;
    ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    if(this.level>1)ctx.fillText(String(this.level),0,1);
    else{ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}


const TM_LABELS:Record<TargetMode,string>={first:'1er',last:'Dern.',strong:'Fort'};
const TM_CYCLE:TargetMode[]=['first','last','strong'];

const BRANCH_META=[
  {id:'atk', label:'ATTAQUE',  color:'#ff4d6d', icon:Swords},
  {id:'eco', label:'ÉCONOMIE', color:'#fbbf24', icon:Pickaxe},
  {id:'def', label:'DÉFENSE',  color:'#4ade80', icon:Shield},
  {id:'tech',label:'TECH',     color:'#60a5fa', icon:Settings},
];

function TalentModal({open,onClose,pts,unlocked,onUnlock}:{open:boolean;onClose:()=>void;pts:number;unlocked:Set<string>;onUnlock:(id:string)=>void;}){
  const [selNode, setSelNode] = useState<any>(null);

  if(!open)return null;

  const handleConfirm = () => {
    if(selNode) {
      onUnlock(selNode.id);
      setSelNode(null);
    }
  };

  return(
    <div className="absolute inset-0 z-[100] bg-[#0b0a16] flex flex-col overflow-hidden" style={{animation:'fadeIn 0.3s ease-out'}}>
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff4d6d]/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#60a5fa]/30 blur-[120px] rounded-full" />
      </div>

      <div className="flex items-center justify-between px-6 pt-16 pb-6 shrink-0 relative z-10">
        <div>
          <h2 className="text-white font-black text-3xl tracking-tighter flex items-center gap-3">
            TALENTS
          </h2>
          <p className="text-white/40 text-xs font-bold tracking-widest mt-1 uppercase">Évolution de la Séquence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#fbbf24]/10 to-transparent pointer-events-none" />
            <Star size={16} className="text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" fill="currentColor"/>
            <span className="font-black text-[#fbbf24] text-sm tracking-tight">{pts} <span className="text-white/40 text-[10px] ml-0.5">PTS</span></span>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90">
            <X size={22}/>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-20 relative z-10 custom-scrollbar flex flex-col justify-center">
        {/* Branch grid */}
        <div className="grid grid-cols-4 gap-4 py-2 flex-grow">
          {BRANCH_META.map(b => (
            <div key={b.id} className="flex flex-col gap-8 items-center">
              {/* Branch Header */}
              <div className="flex flex-col items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{background:`${b.color}15`, border:`1px solid ${b.color}30`}}>
                  <b.icon size={20} color={b.color} />
                </div>
                <div className="text-[10px] font-black tracking-[0.2em] text-center" style={{color:b.color}}>{b.label}</div>
                <div className="w-8 h-0.5 rounded-full" style={{background:b.color, opacity:0.3}} />
              </div>

              {/* Branch Tiers */}
              {[1,2,3].map(tier => {
                const node = TALENT_TREE.find(t => t.branch === b.id && t.tier === tier)!;
                const isUnlocked = unlocked.has(node.id);
                const prereqMet = node.requires.every(r => unlocked.has(r));
                const canUnlock = !isUnlocked && prereqMet && pts >= node.cost;
                const isAvail = !isUnlocked && prereqMet;
                const Icon = node.icon;

                return (
                  <div key={node.id} className="w-full flex flex-col items-center relative">
                    {tier > 1 && (
                      <div className="absolute top-[-32px] w-0.5 h-8 animate-pulse" style={{background:isUnlocked ? b.color : 'rgba(255,255,255,0.05)'}} />
                    )}
                    <button 
                      onClick={() => !isUnlocked && isAvail && setSelNode(node)}
                      className={`w-full flex flex-col items-center justify-center gap-1.5 py-4 px-1 rounded-[22px] border transition-all duration-300 relative overflow-hidden group
                        ${isUnlocked ? 'scale-100' : 'scale-[0.98]'}
                        ${isAvail ? 'active:scale-95 cursor-pointer shadow-lg' : 'cursor-default'}
                        ${!isUnlocked && !prereqMet ? 'opacity-20 grayscale' : 'opacity-100'}
                      `}
                      style={{
                        background: isUnlocked ? `${b.color}12` : 'rgba(255,255,255,0.02)',
                        borderColor: isUnlocked ? b.color : isAvail ? `${b.color}30` : 'rgba(255,255,255,0.05)',
                        boxShadow: isUnlocked ? `0 0 25px ${b.color}20` : 'none'
                      }}
                    >
                      {/* Inner Glow for unlocked */}
                      {isUnlocked && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />}
                      
                      {/* Icon */}
                      <div className={`p-2 rounded-xl mb-0.5 transition-all duration-500 ${isUnlocked ? 'bg-transparent' : 'bg-white/5'}`} style={{color: isUnlocked ? b.color : 'rgba(255,255,255,0.4)'}}>
                        <Icon size={24} strokeWidth={isUnlocked ? 2.5 : 2} />
                      </div>

                      {/* Name & Desc */}
                      <div className="flex flex-col items-center gap-1 px-1 relative z-10">
                        <div className={`font-black text-[10px] text-center leading-[1.1] uppercase tracking-wide ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                          {node.name}
                        </div>
                        {isUnlocked && (
                          <div className="text-[9px] font-bold text-white/40 text-center leading-tight mt-0.5 px-1">
                            {node.desc}
                          </div>
                        )}
                      </div>

                      {/* Badges (Top) */}
                      {!isUnlocked && isAvail && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/40 border border-white/5 text-[7px] font-black z-20" style={{color: canUnlock ? '#fbbf24' : 'rgba(255,255,255,0.3)'}}>
                          {node.cost}PT
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg" style={{background:b.color}}>
                          <span className="text-[10px] font-black text-black">✓</span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION POPUP */}
      {selNode && (
        <div className="absolute inset-0 z-[110] bg-[#0b0a16]/90 backdrop-blur-xl flex items-center justify-center p-6" style={{animation:'fadeIn 0.2s ease-out'}}>
          <div className="w-full max-w-[320px] bg-[#171626] border border-white/10 rounded-[32px] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden" style={{animation:'scaleUp 0.3s cubic-bezier(0.22,1,0.36,1)'}}>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-white blur-[60px] rounded-full" />
            </div>

            <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center" 
              style={{background:`${BRANCH_META.find(b=>b.id===selNode.branch)?.color}15`, border:`1px solid ${BRANCH_META.find(b=>b.id===selNode.branch)?.color}30`, color:BRANCH_META.find(b=>b.id===selNode.branch)?.color}}>
              <selNode.icon size={44} strokeWidth={2.5} />
            </div>

            <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-2 text-center">{selNode.name}</h3>
            <p className="text-white/40 text-[13px] font-bold text-center leading-relaxed mb-8 px-2">{selNode.desc}</p>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={handleConfirm}
                disabled={pts < selNode.cost}
                className={`w-full py-4 rounded-2xl font-black tracking-[.2em] transition-all active:scale-95 flex items-center justify-center gap-2
                ${pts >= selNode.cost ? 'bg-[#fbbf24] text-black shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}>
                {pts < selNode.cost && <LockIcon size={16} />}
                {pts >= selNode.cost ? `DÉVERROUILLER (${selNode.cost}PT)` : `PT INSUFFISANTS (${selNode.cost}PT)`}
              </button>
              
              <button 
                onClick={() => setSelNode(null)}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black tracking-[.2em] active:scale-95 transition-all">
                RETOUR
              </button>
            </div>
          </div>
        </div>
      )}

      {unlocked.size > 0 && (
        <div className="px-6 py-6 bg-white/[0.02] border-t border-white/5 shrink-0 relative z-10">
          <div className="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase mb-4 text-center">Protocoles Actifs</div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(unlocked).map(id => {
              const node = TALENT_TREE.find(t => t.id === id)!;
              const bm = BRANCH_META.find(b => b.id === node.branch)!;
              return (
                <div key={id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-xl"
                  style={{background: `${bm.color}15`, color: bm.color, border: `1px solid ${bm.color}30`}}>
                  <node.icon size={12} />
                  {node.name.toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [diamonds,setDiamonds]=useState(80);
  const dRef=useRef(80);
  const setDia=useCallback((v:number|((p:number)=>number))=>{
    setDiamonds(prev=>{const n=typeof v==='function'?v(prev):v;dRef.current=n;return n;});
  },[]);
  const addDia=useCallback((n:number)=>setDia(p=>p+n),[setDia]);
  const [unlockedTalents,setUnlockedTalents]=useState<Set<string>>(new Set());
  const [talentPoints,setTalentPoints]=useState(0);
  const [showTalents,setShowTalents]=useState(false);
  const [showPauseModal,setShowPauseModal]=useState(false);
  const [isInMenu,setIsInMenu]=useState(true);
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
  const [autoWaveMax,setAutoMax]=useState(10); // Added autoWaveMax state

  const gs=useRef<any>({
    lastTime:0,speedMultiplier:1,shakeTime:0,flashAlpha:0,
    enemies:[],projectiles:[],particles:[],floatingTexts:[],orbParticles:[],rings:[],aoeBlasts:[],
    spawnTimer:0,enemiesToSpawn:0,totalWaveEnemies:0,waveActive:false,
    autoWaveTimer:0,
    level:1,wave:1,status:'idle',baseHp:10,kills:0,bossPoints:0,
    slots:[
      {id:1,x:106,y:325,r:16,tower:null,side:'left'},{id:2,x:106,y:462,r:16,tower:null,side:'left'},
      {id:3,x:106,y:590,r:16,tower:null,side:'left'},{id:4,x:294,y:288,r:16,tower:null,side:'right'},
      {id:5,x:294,y:425,r:16,tower:null,side:'right'},{id:6,x:294,y:555,r:16,tower:null,side:'right'},
    ],
    bokeh:Array.from({length:22}).map(()=>{const l=Math.random()>0.5;return{x:l?62+Math.random()*58:280+Math.random()*58,y:140+Math.random()*560,r:4+Math.random()*13,speed:8+Math.random()*18,alpha:0.03+Math.random()*0.12};}),
  });

  const syncUI=useCallback(()=>{
    const s=gs.current;const left=s.enemies.length+s.enemiesToSpawn;
    const boss=s.enemies.find((e:any)=>e.isBoss);
    setUiState({level:s.level,wave:s.wave,maxWaves:getLevelData(s.level).waves,status:s.status,
      baseHp:s.baseHp,kills:s.kills,enemiesLeft:left,totalEnemies:s.totalWaveEnemies,
      bossHp:boss?boss.hp:0,bossMaxHp:boss?boss.maxHp:0,bossPoints:s.bossPoints||0});
    setAutoCountdown(s.status==='idle'?Math.ceil(s.autoWaveTimer):0);
    setAutoMax(s.autoWaveMax||10);
  },[]);

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
    if (bgMusicRef.current) {
      if (!isInMenu && !showPauseModal) bgMusicRef.current.play().catch(()=>{});
      else bgMusicRef.current.pause();
    }
  }, [isInMenu, showPauseModal]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d')!;let raf:number;
    const spawnOrb=(s:any)=>{const a=Math.random()*Math.PI*2,r=10+Math.random()*16;s.orbParticles.push({x:200+Math.cos(a)*r,y:662+Math.sin(a)*r*0.35,vx:(Math.random()-0.5)*12,vy:-8-Math.random()*18,life:1.0,size:2+Math.random()*3.5,hue:160+Math.random()*40});};

    const drawScene=(ts:number)=>{
      const state=gs.current;
      ctx.fillStyle=C.bg;ctx.fillRect(0,0,CW,CH);
      ctx.strokeStyle=C.grid;ctx.lineWidth=1;
      for(let i=0;i<=CW;i+=40){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,CH);ctx.stroke();}
      for(let i=0;i<=CH;i+=40){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(CW,i);ctx.stroke();}
      let sx=0,sy=0;if(state.shakeTime>0){sx=(Math.random()-0.5)*13*state.shakeTime;sy=(Math.random()-0.5)*13*state.shakeTime;}
      ctx.save();ctx.translate(sx,sy);
      ctx.fillStyle='rgba(0,0,0,0.48)';ctx.beginPath();ctx.roundRect(68,148,280,563,18);ctx.fill();
      const ag=ctx.createLinearGradient(60,140,340,700);ag.addColorStop(0,'#1cb899');ag.addColorStop(0.5,'#17a68a');ag.addColorStop(1,'#0f8070');
      ctx.fillStyle=ag;ctx.beginPath();ctx.roundRect(60,140,280,560,16);ctx.fill();
      const ig=ctx.createLinearGradient(60,140,140,280);ig.addColorStop(0,'rgba(255,255,255,0.07)');ig.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=ig;ctx.beginPath();ctx.roundRect(60,140,280,560,16);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.07)';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(60,140,280,560,16);ctx.stroke();
      ctx.fillStyle=C.path;ctx.shadowColor='rgba(0,0,0,0.8)';ctx.shadowBlur=20;ctx.shadowOffsetY=10;
      ctx.beginPath();ctx.roundRect(150,90,100,572,[0,0,24,24]);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
      ctx.strokeStyle='rgba(255,255,255,0.025)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(151,92);ctx.lineTo(151,662);ctx.stroke();
      ctx.beginPath();ctx.moveTo(249,92);ctx.lineTo(249,662);ctx.stroke();
      state.bokeh.forEach((p:any)=>{const bg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);bg.addColorStop(0,`rgba(40,234,192,${p.alpha*1.5})`);bg.addColorStop(1,'rgba(40,234,192,0)');ctx.fillStyle=bg;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
      // Crystal orb portal at base
      const ot=ts*0.001;
      ctx.save();ctx.translate(200,660);
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
      state.orbParticles.forEach((p:any)=>{
        ctx.globalAlpha=p.life*0.7;ctx.shadowColor=`hsl(${p.hue},90%,65%)`;ctx.shadowBlur=6;
        ctx.fillStyle=`hsl(${p.hue},90%,72%)`;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill();
      });
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.shadowBlur=0;
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
            state.enemies.push(new Enemy(abs,isBoss));state.enemiesToSpawn--;ns=true;
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
      // Auto-wave countdown when idle
      if(state.status==='idle'){
        if(state.autoWaveTimer>0){
          state.autoWaveTimer-=dt;
          const prevCeil=Math.ceil(state.autoWaveTimer+dt);
          const newCeil=Math.ceil(state.autoWaveTimer);
          if(newCeil!==prevCeil)setAutoCountdown(Math.max(0,newCeil));
          if(state.autoWaveTimer<=0){
            // Auto-launch wave
            const ld=getLevelData(state.level);const isBoss=state.wave===ld.waves;
            const total=isBoss?1:ld.baseMobs+state.wave*ld.mobMult;
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
      state.particles=state.particles.filter((p:Particle)=>!p.update(dt));
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
  },[addDia,syncUI,isInMenu]);

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
    state.wave = 1;
    state.status = 'idle';
    state.autoWaveTimer = 12;
    syncUI();
  }, [syncUI]);

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
      setDia(80);setIsPlaying(true);isPlayingRef.current=true;setGameSpeed(1);
      setTalentPoints(0);setUnlockedTalents(new Set());bonusesRef.current=computeBonuses(new Set());
      freeUpgradeRef.current=false;goldRushRef.current=false;speedBoostRef.current=false;towerDiscountRef.current=false;
      setActiveBuffs({freeUpgrade:false,speedBoost:false,goldRush:false,towerDiscount:false});
      setShowPauseModal(false);
      syncUI();
    } else if(state.status==='idle'){
      const ld=getLevelData(state.level);const isBoss=state.wave===ld.waves;
      const total=isBoss?1:ld.baseMobs+state.wave*ld.mobMult;
      state.enemiesToSpawn=total;state.totalWaveEnemies=total;
      state.spawnTimer=0;state.waveActive=true;state.status='playing';
      // Early bird bonus: proportional to time remaining
      const timeLeft=state.autoWaveTimer;
      state.autoWaveTimer=0;
      setAutoCountdown(0);
      if(timeLeft>1){
        const maxT=autoWaveMax; // Use the state variable here
        const bonus=timeLeft/maxT>0.7?5:timeLeft/maxT>0.4?3:1;
        addDia(bonus);
        state.floatingTexts.push(new FloatingText(200,380,`+${bonus}♦ Rapide!`,0,'#4ade80'));
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
      s.enemies.forEach((e: Enemy) => {
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

  if(isInMenu){
    return <MainMenu onPlay={()=>setIsInMenu(false)} />;
  }

  return(
    <div className="flex justify-center items-center w-full bg-black select-none overflow-hidden touch-none" style={{height:'100dvh'}}>
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
            <div className="si absolute inset-x-0 bottom-0 z-40 shop-console pb-24 overflow-hidden" style={{animation:'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)'}}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex flex-col">
                  <div className="text-white font-black text-sm tracking-widest uppercase">BAIE_DE_CONSTRUCTION</div>
                  <div className="text-white/30 text-[9px] mf uppercase tracking-widest">Emplacement {shopSlot.side==='left'?'ALPHA':'BETA'}</div>
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
                    className={`flex flex-col items-center py-5 px-1 gap-2.5 transition-all relative group pointer-events-auto
                      ${ok ? 'tower-card ok' : 'opacity-20 cursor-not-allowed'}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all
                      ${ok ? 'bg-white/5 group-hover:bg-white/10' : 'bg-black/20'}`} style={{color: ok ? def.color : 'white'}}>
                      <Icon size={24} />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="text-white font-black text-[9px] tracking-tighter text-center uppercase leading-tight">{def.name}</div>
                      <div className="mf font-black text-[10px]" style={{color:ok?C.diamond:'rgba(255,255,255,0.2)'}}>{def.cost}♦</div>
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

        {/* Active buff indicators */}
        {(activeBuffs.freeUpgrade||activeBuffs.speedBoost||activeBuffs.goldRush||activeBuffs.towerDiscount)&&(
          <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1.5 z-20 pointer-events-none px-4">
            {activeBuffs.freeUpgrade&&<div className="bg-[#60a5fa]/15 border border-[#60a5fa]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#60a5fa] flex items-center gap-1"><Zap size={10}/> Gratuit</div>}
            {activeBuffs.speedBoost&&<div className="bg-[#fb923c]/15 border border-[#fb923c]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#fb923c] flex items-center gap-1"><Wind size={10}/> +Cadence</div>}
            {activeBuffs.goldRush&&<div className="bg-[#fbbf24]/15 border border-[#fbbf24]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#fbbf24] flex items-center gap-1"><DollarSign size={10}/> ×1.5♦</div>}
            {activeBuffs.towerDiscount&&<div className="bg-[#34d399]/15 border border-[#34d399]/30 px-2 py-1 rounded-lg text-[10px] font-bold text-[#34d399] flex items-center gap-1"><Tag size={10}/> −20%</div>}
          </div>
        )}

        {/* FOOTER */}
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

          <div className="absolute left-1/2 -translate-x-1/2 bottom-12 pointer-events-auto">
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
              className="w-16 h-16 rounded-[20px] bg-[#171626] border border-white/10 flex flex-col items-center justify-center pointer-events-auto active:scale-95 transition-all shadow-xl">
              <div className="text-[7px] font-black text-white/30 tracking-widest mb-1">VAGUE</div>
              <div className="mf text-base font-black text-white">{uiState.wave}/{uiState.maxWaves}</div>
              {uiState.status==='idle' && autoCountdown > 0 && (
                <div className="absolute -bottom-1 w-full text-center">
                  <span className="text-[8px] font-black text-[#22c55e] bg-[#0b0a16] px-1 rounded">{autoCountdown}s</span>
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
                <div className="h-px w-full bg-white/5 my-2" />
                <button onClick={() => { setShowPauseModal(false); setIsInMenu(true); }} 
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/60 font-bold tracking-widest active:scale-95 transition-all hover:bg-white/10 hover:text-white">
                  QUITTER LE JEU
                </button>
              </div>
              <p className="mt-8 mf text-[10px] text-white/20 tracking-[0.3em] uppercase">Session Active // ID-PX01</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}