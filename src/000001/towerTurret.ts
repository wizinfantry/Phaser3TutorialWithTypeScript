import Phaser from 'phaser';
import Enemy from './towerEnemy';
import Bullet from './towerBullet';
import { map } from './towerOptions';


export default class turret extends Phaser.GameObjects.Image {
    private nextTick: number;
    enemies!: Phaser.GameObjects.Group;
    bullets!: Phaser.GameObjects.Group;
    constructor(scene) {
        super(scene, 0, 0, 'sprites', 'turret');
        this.nextTick = 0;
    }

    /**
     * we will place the turret according to the grid
     */
    place(i: number, j: number): void {
        this.y = i * 64 + 64 / 2;
        this.x = j * 64 + 64 / 2;
        map[i][j] = 1;
    }

    setEnemies(enemies: Phaser.GameObjects.Group): void {
        this.enemies = enemies;
    }

    setBullets(bullets: Phaser.GameObjects.Group): void {
        this.bullets = bullets;
    }

    addBullet(x: number, y: number, angle: number): void {
        let bullet: Bullet = this.bullets.get();
        if (bullet) {
            bullet.fire(x, y, angle);
        }
    }

    getEnemy(x: number, y: number, distance: number): any {
        let enemyUnits: Enemy[] = this.enemies.getChildren();
        for (let i = 0; i < enemyUnits.length; i++) {
            if (enemyUnits[i].active && Phaser.Math.Distance.Between(x, y, enemyUnits[i].x, enemyUnits[i].y) <= distance) {
                return enemyUnits[i];
            }
        }
        return false;
    }

    fire(): void {
        let enemy:Enemy = this.getEnemy(this.x, this.y, 100);
        if (enemy) {
            let angle = Phaser.Math.Angle.Between(this.x, this.y, enemy.x, enemy.y);
            this.addBullet(this.x, this.y, angle);
            this.angle = (angle + Math.PI / 2) * Phaser.Math.RAD_TO_DEG;
        }
    }

    update(time: number, delta: number) {
        // time to shoot
        if (time > this.nextTick) {
            this.fire();
            this.nextTick = time + 50;
        }
    }
}