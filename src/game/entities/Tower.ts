import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Tower extends Phaser.GameObjects.Container {
    public static COST = 100;
    
    private range: number = 200;
    private fireRate: number = 1000; // ms
    private damage: number = 5;
    private lastFired: number = 0;
    
    private rangeCircle: Phaser.GameObjects.Arc;
    private towerBody: Phaser.GameObjects.Graphics;
    private targetLine: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, upgrades: any) {
        super(scene, x, y);

        // Apply upgrades from meta-progression
        this.damage = 5 + (upgrades?.damage || 0) * 2;
        this.range = 200 + (upgrades?.range || 0) * 20;
        this.fireRate = Math.max(200, 1000 - (upgrades?.fireRate || 0) * 100);

        // Tower visual: rounded outline square (Outhold style)
        this.towerBody = scene.add.graphics();
        this.towerBody.lineStyle(4, 0xffffff, 1);
        this.towerBody.strokeRoundedRect(-20, -20, 40, 40, 8);
        this.add(this.towerBody);

        this.rangeCircle = scene.add.circle(0, 0, this.range, 0xffffff, 0.05);
        this.rangeCircle.setStrokeStyle(1, 0xffffff, 0.1);
        this.add(this.rangeCircle);
        this.rangeCircle.setVisible(false);

        this.targetLine = scene.add.graphics();
        this.add(this.targetLine);

        scene.add.existing(this);
        
        this.setInteractive(new Phaser.Geom.Rectangle(-20, -20, 40, 40), Phaser.Geom.Rectangle.Contains);
        this.on('pointerover', () => this.rangeCircle.setVisible(true));
        this.on('pointerout', () => this.rangeCircle.setVisible(false));
    }

    update(time: number, _delta: number, enemies: Phaser.GameObjects.Group) {
        if (!enemies) return;
        this.targetLine.clear();
        
        const target = this.getClosestEnemy(enemies);
        if (!target) return;

        // Draw targeting line (Outhold aesthetic)
        this.targetLine.lineStyle(2, 0xffffff, 0.3);
        this.targetLine.beginPath();
        this.targetLine.moveTo(0, 0);
        this.targetLine.lineTo(target.x - this.x, target.y - this.y);
        this.targetLine.strokePath();

        // Shooting logic
        if (time > this.lastFired + this.fireRate) {
            this.shoot(target);
            this.lastFired = time;
        }
    }

    private shoot(target: Enemy) {
        target.takeDamage(this.damage);
        
        // Muzzle flash / impact effect
        const flash = this.scene.add.circle(target.x, target.y, 10, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    private getClosestEnemy(enemies: Phaser.GameObjects.Group): Enemy | null {
        let closest: Enemy | null = null;
        let minDist = this.range;

        enemies.getChildren().forEach((child) => {
            const enemy = child as Enemy;
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        });

        return closest;
    }
}
