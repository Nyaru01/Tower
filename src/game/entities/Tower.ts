import { type TowerDef, type TalentBonuses, type TargetMode } from '../constants';
import { Projectile } from './Projectile';

export class Tower {
  x:number;y:number;side:string;def:TowerDef;level=1;
  damage:number;fireRate:number;range:number;critChance:number;critMult:number;
  upgradeCost:number;totalSpent:number;maxMulticrit=2;
  angle:number;scale=1;pulseRing=0;cooldown=0;targetMode:TargetMode='first';
  hp:number;maxHp:number;disabledTimer=0;repairRate=12;hitFlash=0;
  constructor(x:number,y:number,side:string,def:TowerDef){
    this.x=x;this.y=y;this.side=side;this.def=def;
    this.damage=def.damage;this.fireRate=def.fireRate;this.range=def.range;
    this.critChance=def.critChance;this.critMult=def.critMult;
    this.upgradeCost=def.upgradeCost;this.totalSpent=def.cost;
    this.angle=side==='left'?0:Math.PI;
    this.maxHp=350;this.hp=this.maxHp;
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
    // Audio Fire Rate Boost: Mid frequencies accelerate firing (reduced from x4 to x2)
    const audioBoost = state.audio ? 1 + state.audio.mid * 1.0 : 1;
    
    // Auto-repair & Disable logic
    if(this.disabledTimer > 0) {
      this.disabledTimer -= dt;
      this.hp = Math.min(this.maxHp, this.hp + this.repairRate * 2 * dt); // Faster repair when disabled
      this.scale = 0.95;
      return;
    }
    
    if(this.hitFlash > 0) this.hitFlash -= dt;
    if(this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.repairRate * dt);
    
    this.cooldown -= dt * audioBoost;
    const isTesla = this.def.id === 'tesla';
    const targets = isTesla ? this.pickMultiTargets(state.enemies, bon, 3) : [this.pickTarget(state.enemies, bon)];
    
    if(targets[0]){
      const primary = targets[0];
      const ta=Math.atan2(primary.y-this.y,primary.x-this.x);
      this.angle+=Math.atan2(Math.sin(ta-this.angle),Math.cos(ta-this.angle))*16*dt;
      
      if(this.cooldown<=0){
        const fr=this.fireRate*bon.globalFireRate*(state.speedBoost?0.80:1);
        const bd=this.damage*bon.globalDmg;
        const cc=Math.min(0.95,this.critChance+bon.globalCrit);
        const cm=this.critMult+bon.critMultBonus;

        targets.forEach(target => {
          if(!target) return;
          const sx=this.x+Math.cos(this.angle)*15,sy=this.y+Math.sin(this.angle)*15;
          let dmg=bd,cl=0;
          while(Math.random()<cc&&cl<this.maxMulticrit){cl++;dmg*=cm;}
          state.projectiles.push(new Projectile(sx,sy,target,dmg,cl,this.def.color,this.def.special));
        });

        this.cooldown=fr;this.scale=1.18;
      }
    } else{this.angle+=dt*0.35;}
  }
  pickMultiTargets(enemies:any[], bon:TalentBonuses, count:number):any[]{
    const rng=this.range*bon.globalRange;
    return enemies.filter((e:any)=>Math.hypot(e.x-this.x,e.y-this.y)<=rng)
                  .sort((a:any, b:any) => b.y - a.y)
                  .slice(0, count);
  }
  draw(ctx:CanvasRenderingContext2D,sel=false,audio?:{mid:number}){
    const col=this.def.color;
    if(sel){
      ctx.save();
      ctx.beginPath();ctx.arc(this.x,this.y,this.range,0,Math.PI*2);
      ctx.fillStyle=`${col}12`;ctx.fill();
      ctx.shadowBlur=15; ctx.shadowColor=col;
      ctx.strokeStyle=col; ctx.lineWidth=2.5; ctx.setLineDash([8,6]); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
    if(this.pulseRing>0){ctx.beginPath();ctx.arc(this.x,this.y,this.pulseRing,0,Math.PI*2);ctx.strokeStyle=`rgba(255,255,255,${(1-this.pulseRing/58)*0.8})`;ctx.lineWidth=2.5;ctx.stroke();}
    
    const audioPulse = audio ? audio.mid * 0.12 : 0;
    ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.scale + audioPulse,this.scale + audioPulse);
    
    if(this.disabledTimer > 0) {
      ctx.filter = 'grayscale(100%) opacity(0.6)';
    }

    const isHit = this.hitFlash > 0;
    const baseCol = isHit ? '#fff' : this.def.color;
    const gc=this.level>=5?'#c084fc':this.level>=3?'#fbbf24':this.def.glowColor;
    ctx.shadowColor=gc;ctx.shadowBlur=10+this.level*1.5;
    
    // Draw Base Platform (More detailed)
    ctx.fillStyle = '#171626';
    ctx.strokeStyle = baseCol;
    ctx.lineWidth = 1.5;
    const bs = 13.5;
    if(this.def.id==='frost') {
      ctx.beginPath(); ctx.arc(0,0,bs,0,Math.PI*2); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.roundRect(-bs,-bs,bs*2,bs*2,6); ctx.fill(); ctx.stroke();
      // Tech corners
      ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-bs,-bs+5); ctx.lineTo(-bs,-bs); ctx.lineTo(-bs+5,-bs); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bs,bs-5); ctx.lineTo(bs,bs); ctx.lineTo(bs-5,bs); ctx.stroke();
    }

    ctx.rotate(this.angle);
    ctx.fillStyle=baseCol;
    
    // Drawing the Weaponry with more detail
    if(this.def.id==='cannon'){
      ctx.beginPath();ctx.roundRect(8,-5,18,10,3);ctx.fill();
      ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12,-5);ctx.lineTo(12,5);ctx.stroke();
    }
    else if(this.def.id==='sniper'){
      ctx.beginPath();ctx.roundRect(6,-3,24,6,2);ctx.fill();
      ctx.beginPath();ctx.roundRect(6,-6,6,12,1);ctx.fill();
      ctx.fillStyle='#000';ctx.fillRect(18,-1,8,2); // Scope line
    }
    else if(this.def.id==='rapid'){
      ctx.beginPath();ctx.roundRect(8,-6.5,15,5,2);ctx.fill();
      ctx.beginPath();ctx.roundRect(8,1.5,15,5,2);ctx.fill();
      ctx.fillStyle=gc; ctx.fillRect(8,-3,4,6); // Energy core
    }
    else if(this.def.id==='frost'){
      ctx.beginPath();ctx.arc(10,0,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath();ctx.arc(10,0,3,0,Math.PI*2);ctx.fill();
    }
    else if(this.def.id==='mortar'){
      ctx.beginPath();ctx.roundRect(5,-7.5,12,15,4);ctx.fill();
      ctx.fillStyle='#000'; ctx.beginPath();ctx.arc(12,0,4,0,Math.PI*2);ctx.fill();
    }
    else if(this.def.id==='tesla'){
      ctx.beginPath();ctx.arc(9,0,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=gc; ctx.beginPath();ctx.arc(9,0,3,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=baseCol; ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(9,0);ctx.stroke();
    }
    
    // High-level visual indicators (Level 3+ and 5+)
    if(this.level >= 3) {
      ctx.strokeStyle='#fbbf24'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*0.5); ctx.stroke();
    }
    if(this.level >= 5) {
      ctx.strokeStyle='#c084fc'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,0,18, Math.PI, Math.PI*1.5); ctx.stroke();
    }

    ctx.shadowBlur=0;
    ctx.rotate(-this.angle);
    ctx.fillStyle=isHit?'#fff':(this.level>=5?'#c084fc':this.level>=3?'#fbbf24':col);
    ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    if(this.level>1)ctx.fillText(String(this.level),0,1);
    else{ctx.beginPath();ctx.arc(0,0,2.5,0,Math.PI*2);ctx.fill();}
    ctx.restore();

    // Tower Health Bar - Always Visible if Built
    {
      const bw=36, bh=6, bx=this.x-bw/2, by=this.y+26;
      ctx.fillStyle='rgba(0,0,0,1.0)'; ctx.fillRect(bx-2,by-2,bw+4,bh+4); // Thicker Border
      ctx.fillStyle='rgba(30,30,50,1.0)'; ctx.fillRect(bx,by,bw,bh);
      const hpRatio = Math.max(0, this.hp/this.maxHp);
      ctx.fillStyle=this.disabledTimer>0?'#94a3b8': (hpRatio < 0.4 ? '#ef4444' : (hpRatio < 0.7 ? '#fbbf24' : '#22c55e'));
      ctx.fillRect(bx,by,bw*hpRatio,bh);
    }
  }
}
