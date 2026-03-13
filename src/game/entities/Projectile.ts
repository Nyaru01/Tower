import { C, type TalentBonuses } from '../constants';
import { FloatingText, Particle, RingBurst, AoeBlast } from './effects';
import { playKillSound } from '../utils/audio';

export function killEnemy(e: any, state: any, addDia: (n: number) => void, bon: TalentBonuses) {
  playKillSound(e.isBoss);
  if (e.isBoss) state.bossPoints = (state.bossPoints || 0) + 1;
  const cnt = e.isBoss ? 28 : 10;
  for (let i = 0; i < cnt; i++) state.particles.push(new Particle(e.x, e.y, e.color, e.isBoss ? 4.5 : 2.5, e.isBoss ? 1.4 : 1));
  state.rings.push(new RingBurst(e.x, e.y, e.color, e.isBoss ? 55 : 30));
  if (e.isBoss) state.rings.push(new RingBurst(e.x, e.y, '#fff', 72));
  let gained = bon.bonusDrop;
  if (e.isBoss) gained += 15 + Math.floor(Math.random() * 10);
  else if (e.type === 'tank' && Math.random() < 0.6) gained += 2;
  else if (Math.random() < 0.25) gained += 1;
  if (gained > 0) {
    const actualGained = state.goldRush ? Math.ceil(gained * 1.5) : gained;
    addDia(actualGained);
    state.floatingTexts.push(new FloatingText(e.x, e.y - 25, `+${actualGained}♦`, 0, C.diamond));
  }
  state.kills++;
}

export class Projectile {
  x: number; y: number; target: any; speed: number; damage: number; cl: number; color: string; special: string | null; size: number; history: { x: number, y: number }[];
  constructor(x: number, y: number, target: any, dmg: number, cl: number, color: string, special: string | null) {
    this.x = x; this.y = y; this.target = target; this.damage = dmg; this.cl = cl; this.color = color; this.special = special;
    this.speed = special === 'slow' ? 900 : special === 'aoe' ? 650 : 1350;
    this.size = special === 'aoe' ? 5 : special === 'slow' ? 4 : 2.5;
    this.history = [{ x, y }];
  }
  update(dt: number, state: any, addDia: (n: number) => void, bon: TalentBonuses) {
    if (!state.enemies.includes(this.target)) return true;
    const dx = this.target.x - this.x, dy = this.target.y - this.y, dist = Math.hypot(dx, dy);
    if (dist < this.speed * dt) {
      if (this.special === 'aoe') {
        const r = 68; state.aoeBlasts.push(new AoeBlast(this.target.x, this.target.y, r));
        for (const e of state.enemies) {
          if (Math.hypot(e.x - this.target.x, e.y - this.target.y) <= r) {
            if (e.shield > 0) {
              e.shield--;
              state.floatingTexts.push(new FloatingText(e.x, e.y - e.radius, "BLOCKED", 0, '#38bdf8'));
              for (let i = 0; i < 3; i++) state.particles.push(new Particle(e.x, e.y, '#38bdf8', 2.5));
            } else {
              e.hp -= this.damage; e.hitFlash = 0.07;
              state.floatingTexts.push(new FloatingText(e.x, e.y - e.radius, Math.ceil(this.damage), this.cl));
              for (let i = 0; i < 3; i++) state.particles.push(new Particle(e.x, e.y, '#fb923c', 2));
              if (e.hp <= 0) killEnemy(e, state, addDia, bon);
            }
          }
        }
      } else {
        if (this.target.shield > 0) {
          this.target.shield--;
          state.floatingTexts.push(new FloatingText(this.target.x, this.target.y - this.target.radius, "BLOCKED", 0, '#38bdf8'));
          for (let i = 0; i < 5; i++) state.particles.push(new Particle(this.target.x, this.target.y, '#38bdf8', 3));
        } else {
          this.target.hp -= this.damage; this.target.hitFlash = 0.07;
          if (this.special === 'slow') this.target.slowTimer = 2.8;
          state.floatingTexts.push(new FloatingText(this.target.x, this.target.y - this.target.radius, Math.ceil(this.damage), this.cl));
          const col = this.cl >= 2 ? '#c084fc' : this.cl === 1 ? '#fbbf24' : this.color;
          for (let i = 0; i < 4; i++) state.particles.push(new Particle(this.target.x, this.target.y, col, 2));
          if (this.special === 'slow') for (let i = 0; i < 4; i++) state.particles.push(new Particle(this.target.x, this.target.y, '#7dd3fc', 2.5));
          if (this.target.hp <= 0) killEnemy(this.target, state, addDia, bon);
        }
      }
      return true;
    }
    this.x += (dx / dist) * this.speed * dt; this.y += (dy / dist) * this.speed * dt;
    this.history.push({ x: this.x, y: this.y }); if (this.history.length > 4) this.history.shift();
    return false;
  }
  draw(ctx: CanvasRenderingContext2D) {
    const col = this.cl >= 2 ? '#c084fc' : this.cl === 1 ? '#fbbf24' : this.color;
    ctx.shadowColor = col; ctx.shadowBlur = this.cl > 0 ? 12 : 6;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.shadowBlur = 0;
    if (this.history.length > 1) {
      ctx.beginPath(); ctx.moveTo(this.history[0].x, this.history[0].y); ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = col; ctx.lineWidth = this.cl > 0 ? 2.5 : 1.5; ctx.globalAlpha = 0.4; ctx.lineCap = 'round'; ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
}
