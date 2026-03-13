import { C } from '../constants';

export class Enemy {
  x:number;y:number;isBoss:boolean;type:string='';color:string='#000';
  speed:number;baseSpeed:number;maxHp:number;hp:number;radius:number;
  history:{x:number,y:number}[]=[];hitFlash=0;wobble:number;spawnAnim=0;slowTimer=0;
  path:{x:number,y:number}[];targetWpIdx=0;shield=0;maxShield=0;
  constructor(abs:number,path:{x:number,y:number}[],isBoss=false){
    this.path=path;
    this.x=path[0].x+(Math.random()*16-8);
    this.y=path[0].y+(Math.random()*16-8);
    this.isBoss=isBoss;this.wobble=Math.random()*Math.PI*2;
    this.targetWpIdx=1;
    // Courbe HP progressive : linéaire jusqu'au niveau 3, puis légère accélération
    const hm = 1 + abs * 0.18 + Math.pow(Math.max(0, abs - 8), 1.4) * 0.04;
    const sb = abs * 2.2; 
    const rand = Math.random();
    if(isBoss){this.type='boss';this.color=C.eBoss;this.speed=28+sb*0.45;this.maxHp=320*hm;this.radius=22;}
    else if(abs>8&&rand>0.85){this.type='shield';this.color='#38bdf8';this.speed=45+sb*0.7;this.maxHp=35*hm;this.radius=11;this.shield=3;this.maxShield=3;}
    else if(abs>3&&rand>0.75){this.type='tank';this.color=C.eTank;this.speed=32+sb*0.55;this.maxHp=52*hm;this.radius=13;}
    else if(abs>2&&rand>0.5){this.type='fast';this.color=C.eFast;this.speed=95+sb*1.3;this.maxHp=13*hm;this.radius=7;}
    else{this.type='normal';this.color=C.eNormal;this.speed=58+sb;this.maxHp=22*hm;this.radius=9;}
    this.baseSpeed=this.speed;this.hp=this.maxHp;
  }
  update(dt:number){
    this.spawnAnim=Math.min(1,this.spawnAnim+dt*6);
    if(this.slowTimer>0){this.slowTimer-=dt;this.speed=this.baseSpeed*0.38;}
    else this.speed=Math.min(this.baseSpeed,this.speed+dt*60);
    
    if(this.targetWpIdx < this.path.length){
      const target = this.path[this.targetWpIdx];
      const dx = target.x - this.x, dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if(dist < this.speed * dt){
        this.x = target.x; this.y = target.y;
        this.targetWpIdx++;
      } else {
        this.x += (dx/dist) * this.speed * dt;
        this.y += (dy/dist) * this.speed * dt;
      }
    }

    if(this.hitFlash>0)this.hitFlash-=dt;
    this.history.push({x:this.x,y:this.y});if(this.history.length>8)this.history.shift();
    return this.targetWpIdx >= this.path.length;
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
    if(this.shield > 0 && !isHit) {
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#38bdf8'; ctx.fill(); ctx.globalAlpha = 1;
    }
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
