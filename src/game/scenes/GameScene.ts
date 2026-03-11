import Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { Enemy } from '../entities/Enemy';
import { Tower } from '../entities/Tower';
import { useGameStore } from '../../store/gameStore';

export class GameScene extends Phaser.Scene {
    private grid: number[][] = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    private waypoints: { x: number, y: number }[] = [
        { x: 4.5, y: -1 }, { x: 4.5, y: 6.5 }
    ];

    private tileSize: number = 64;
    private pathGraphics!: Phaser.GameObjects.Graphics;
    private enemies!: Phaser.GameObjects.Group;
    private towers!: Phaser.GameObjects.Group;
    private placementPreview!: Phaser.GameObjects.Graphics;
    private spawnTimer: number = 0;

    constructor() {
        super('GameScene');
    }

    preload() {
        // Programmatically create a simple flare texture for particles
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('flare', 16, 16);

        // Simple Flame representation
        const g2 = this.make.graphics({ x: 0, y: 0 });
        g2.fillStyle(0xffa500, 1);
        g2.fillTriangle(8, 0, 0, 16, 16, 16);
        g2.generateTexture('flame', 16, 16);
    }

    create() {
        this.enemies = this.add.group({ runChildUpdate: true });
        this.towers = this.add.group();

        this.calculateTileSize();
        this.drawPath();

        // Add Goal (Flame emoji)
        const { offsetX, offsetY } = this.getMapOffsets();
        this.add.text(offsetX + 5 * this.tileSize, offsetY + 6.1 * this.tileSize, '🔥', {
            fontSize: '48px'
        }).setOrigin(0.5);
        
        this.placementPreview = this.add.graphics();
        
        // Input handling for tower placement
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            this.handlePointerDown(pointer);
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            this.updatePlacementPreview(pointer);
        });

        EventBus.emit('current-scene-ready', this);

        this.scale.on('resize', () => {
            this.calculateTileSize();
            this.drawPath();
        });
    }

    private updatePlacementPreview(pointer: Phaser.Input.Pointer) {
        this.placementPreview.clear();
        
        const { offsetX, offsetY } = this.getMapOffsets();
        const gridX = Math.floor((pointer.x - offsetX) / this.tileSize);
        const gridY = Math.floor((pointer.y - offsetY) / this.tileSize);

        if (gridX >= 0 && gridX < 10 && gridY >= 0 && gridY < 6) {
            const isValid = this.grid[gridY]?.[gridX] === 1; // 1 = Path in Outhold style
            const isOccupied = this.towers.getChildren().some((t: any) => 
                Math.floor((t.x - offsetX) / this.tileSize) === gridX && 
                Math.floor((t.y - offsetY) / this.tileSize) === gridY
            );

            const color = (isValid && !isOccupied) ? 0x1de9b6 : 0xff4d4d;
            this.placementPreview.lineStyle(2, color, 0.5);
            this.placementPreview.strokeRoundedRect(
                offsetX + gridX * this.tileSize + 4, 
                offsetY + gridY * this.tileSize + 4, 
                this.tileSize - 8, 
                this.tileSize - 8, 
                8
            );
        }
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        const { offsetX, offsetY } = this.getMapOffsets();
        const gridX = Math.floor((pointer.x - offsetX) / this.tileSize);
        const gridY = Math.floor((pointer.y - offsetY) / this.tileSize);

        if (gridX >= 0 && gridX < 10 && gridY >= 0 && gridY < 8) {
            // Check if on platform (1) and not occupied
            if (this.grid[gridY]?.[gridX] === 1) {
                const isOccupied = this.towers.getChildren().some((t: any) => 
                    Math.floor((t.x - offsetX) / this.tileSize) === gridX && 
                    Math.floor((t.y - offsetY) / this.tileSize) === gridY
                );

                if (!isOccupied) {
                    // Check gold via EventBus or external call if possible
                    // For now, emit event to React to check/deduct gold
                    EventBus.emit('try-place-tower', { x: offsetX + (gridX + 0.5) * this.tileSize, y: offsetY + (gridY + 0.5) * this.tileSize });
                }
            }
        }
    }

    public addTower(x: number, y: number) {
        const { upgrades } = useGameStore.getState();
        const tower = new Tower(this, x, y, upgrades);
        this.towers.add(tower);
    }

    private calculateTileSize() {
        const { width, height } = this.scale;
        this.tileSize = Math.floor(Math.min(width / 10, height / 8));
    }

    private getMapOffsets() {
        const offsetX = (this.scale.width - (10 * this.tileSize)) / 2;
        const offsetY = (this.scale.height - (8 * this.tileSize)) / 2;
        return { offsetX, offsetY };
    }

    private drawPath() {
        if (this.pathGraphics) this.pathGraphics.destroy();
        
        this.pathGraphics = this.add.graphics();
        const { offsetX, offsetY } = this.getMapOffsets();

        const leftX = offsetX + 2 * this.tileSize;
        const rightX = offsetX + 6 * this.tileSize;
        const pillarWidth = 2 * this.tileSize;
        const totalWidth = 6 * this.tileSize;
        const topY = offsetY - 64; // expand up offscreen
        const bottomY = offsetY + 6.5 * this.tileSize;
        const pillarHeight = bottomY - topY; 
        const bottomHeight = 1.0 * this.tileSize;

        const drawPartitionedU = (xOff: number, yOff: number, color: number, alpha: number) => {
            this.pathGraphics.fillStyle(color, alpha);
            
            // Left Pillar (sharp corners)
            this.pathGraphics.fillRect(leftX + xOff, topY + yOff, pillarWidth, pillarHeight);
            
            // Right Pillar (sharp corners)
            this.pathGraphics.fillRect(rightX + xOff, topY + yOff, pillarWidth, pillarHeight);
            
            // Bottom Bar (rounded outer bottom corners)
            this.pathGraphics.fillRoundedRect(leftX + xOff, bottomY + yOff, totalWidth, bottomHeight, { tl: 0, tr: 0, bl: 16, br: 16 } as any);
        };

        // Shadow down-right
        drawPartitionedU(30, 40, 0x000000, 0.4);
        
        // Main Teal U-Shape
        drawPartitionedU(0, 0, 0x1de9b6, 1);

        // Path Slots (Small subtle dots)
        this.pathGraphics.fillStyle(0x0e0c1b, 0.15); // Dark background color
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x] === 1) {
                    this.pathGraphics.fillCircle(
                        offsetX + (x + 0.5) * this.tileSize,
                        offsetY + (y + 0.5) * this.tileSize,
                        10
                    );
                }
            }
        }
    }

    update(time: number, delta: number) {
        this.spawnTimer += delta;
        if (this.spawnTimer > 2000) { // Spawn every 2s
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // Update towers manually since they need the enemy group
        this.towers.getChildren().forEach((t: any) => {
            t.update(time, delta, this.enemies);
        });
    }

    private spawnEnemy() {
        const { offsetX, offsetY } = this.getMapOffsets();
        const worldWaypoints = this.waypoints.map(p => ({
            x: offsetX + (p.x + 0.5) * this.tileSize,
            y: offsetY + (p.y + 0.5) * this.tileSize
        }));

        const enemy = new Enemy(this, worldWaypoints, 10, 100, 10);
        this.enemies.add(enemy);

        enemy.on('died', (reward: number) => {
            EventBus.emit('enemy-killed', reward);
        });

        enemy.on('escaped', () => {
            EventBus.emit('enemy-escaped');
        });
    }

}
