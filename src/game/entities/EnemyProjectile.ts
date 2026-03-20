import { FloatingText, Particle } from './effects';

export class EnemyProjectile {
  x:number; y:number; target:any; speed=550; damage:number; color:string; history:{x:number,y:number}[]=[];
  constructor(x:number, y:number, target:any, dmg:number, color:string){
    this.x=x; this.y=y; this.target=target; this.damage=dmg; this.color=color;
    this.history=[{x,y}];
  }
  update(dt:number, state:any){
    const dx=this.target.x-this.x, dy=this.target.y-this.y, dist=Math.hypot(dx,dy);
    if(dist < this.speed*dt){
      this.target.hp = Math.max(0, this.target.hp - this.damage);
      this.target.hitFlash = 0.25;
      state.floatingTexts.push(new FloatingText(this.target.x, this.target.y - 15, Math.ceil(this.damage), 0, '#ef4444'));
      if(this.target.hp <= 0 && this.target.disabledTimer <= 0){
        this.target.hp = 0;
        this.target.disabledTimer = 8; // Disabled for 8s
        state.floatingTexts.push(new FloatingText(this.target.x, this.target.y-10, "OFFLINE", 0, '#94a3b8'));
      }
      for(let i=0;i<5;i++) state.particles.push(new Particle(this.target.x, this.target.y, this.color, 2.5));
      return true;
    }
    if(dist>0){
      this.x+=(dx/dist)*this.speed*dt; this.y+=(dy/dist)*this.speed*dt;
    }
    this.history.push({x:this.x,y:this.y}); if(this.history.length>4) this.history.shift();
    return false;
  }
  draw(ctx:CanvasRenderingContext2D){
    ctx.save();
    ctx.shadowColor=this.color; ctx.shadowBlur=8;
    ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,3.5,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    if(this.history.length>1){
      ctx.beginPath(); ctx.moveTo(this.history[0].x,this.history[0].y); ctx.lineTo(this.x,this.y);
      ctx.strokeStyle=this.color; ctx.lineWidth=2; ctx.globalAlpha=0.5; ctx.stroke();
    }
    ctx.restore();
  }
}
