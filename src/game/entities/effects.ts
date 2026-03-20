export class FloatingText {
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

export class Particle {
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

export class RingBurst {
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

export class AoeBlast {
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
