import { C, type TowerDef, type TalentBonuses, type TargetMode } from '../constants';
import { Projectile } from './Projectile';

export class Tower {
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
    else if(this.def.id==='tesla'){
      ctx.beginPath();ctx.arc(8,0,6,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(6,-2,10,4,1);ctx.fill();
    }
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
