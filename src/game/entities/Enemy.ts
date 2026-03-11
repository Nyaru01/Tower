import Phaser from 'phaser';

export class Enemy extends Phaser.GameObjects.Container {
    private waypoints: { x: number, y: number }[];
    private currentWaypointIndex: number = 0;
    private speed: number = 100;
    private hp: number = 10;
    private reward: number = 10;
    
    private sprite: Phaser.GameObjects.Arc;

    constructor(scene: Phaser.Scene, waypoints: { x: number, y: number }[], hp: number, speed: number, reward: number) {
        // Initial position at first waypoint
        super(scene, waypoints[0].x, waypoints[0].y);
        
        this.waypoints = waypoints;
        this.hp = hp;
        this.speed = speed;
        this.reward = reward;

        // Enemy visual shadow
        const shadow = scene.add.circle(10, 15, 10, 0x000000, 0.4);
        this.add(shadow);

        // Enemy visual: Red body
        this.sprite = scene.add.circle(0, 0, 10, 0xff4d4d);
        this.add(this.sprite);

        scene.add.existing(this);
        scene.physics.add.existing(this);
    }

    update(_time: number, delta: number) {
        if (this.currentWaypointIndex >= this.waypoints.length) return;

        const target = this.waypoints[this.currentWaypointIndex];
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

        if (distance < 5) {
            this.currentWaypointIndex++;
            if (this.currentWaypointIndex >= this.waypoints.length) {
                this.onReachedEnd();
                return;
            }
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const vx = Math.cos(angle) * this.speed * (delta / 1000);
        const vy = Math.sin(angle) * this.speed * (delta / 1000);
        
        this.x += vx;
        this.y += vy;
    }

    takeDamage(amount: number) {
        this.hp -= amount;
        
        // Floating damage number
        const damageText = this.scene.add.text(this.x, this.y - 20, `-${amount}`, {
            fontSize: '14px',
            fontStyle: 'bold',
            color: '#1de9b6'
        });
        this.scene.tweens.add({
            targets: damageText,
            y: this.y - 50,
            alpha: 0,
            duration: 500,
            onComplete: () => damageText.destroy()
        });

        if (this.hp <= 0) {
            this.die();
        }
    }

    private die() {
        // Explosion particles
        const particles = this.scene.add.particles(this.x, this.y, 'flare', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            tint: 0xff4d4d,
            maxParticles: 15
        } as any);
        
        this.scene.time.delayedCall(500, () => particles.destroy());

        this.emit('died', this.reward);
        this.destroy();
    }

    private onReachedEnd() {
        this.emit('escaped');
        this.destroy();
    }
}
