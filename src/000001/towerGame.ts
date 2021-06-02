import Phaser from 'phaser';
import { map } from './towerOptions';
import Enemy from './towerEnemy';
import Turret from './towerTurret';
import Bullet from './towerBullet';
/**
var config = {
    type: Phaser.AUTO,
    parent: 'content',
    width: 640,
    height: 512,
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};
*/
export default class playGame extends Phaser.Scene {

    /**
     * 적 매개 변수의 경로는 경로의 시작 x와 y입니다.
     */
    private path!: Phaser.Curves.Path;
    private enemies!: Phaser.GameObjects.Group;
    private nextEnemy!: number;
    private turrets!: Phaser.GameObjects.Group;
    private bullets!: Phaser.GameObjects.Group;

    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.atlas('sprites', 'spritesheet.png', 'spritesheet.json');
        this.load.image('bullet', 'bullet.png');
    }

    create() {
        this.drawGrid(this.add.graphics());
        /**
         * 이 그래픽 요소는 시각화 용이며 경로와 관련이 없습니다.
        */
        let graphics: Phaser.GameObjects.Graphics = this.add.graphics();
        this.path = this.add.path(96, -32);
        this.path.lineTo(96, 164);
        this.path.lineTo(480, 164);
        this.path.lineTo(480, 544);

        graphics.lineStyle(3, 0xffffff, 1);
        this.path.draw(graphics);

        // this.enemies = this.add.group({classType: Enemy, runChildUpdate: true});
        this.enemies = this.physics.add.group({classType: Enemy, runChildUpdate: true});
        this.nextEnemy = 0;

        this.turrets = this.add.group({classType: Turret, runChildUpdate: true});
        this.input.on('pointerdown', this.placeTurret, this);

        // this.bullets = this.add.group({classType: Bullet, runChildUpdate: true});
        this.bullets = this.physics.add.group({classType: Bullet, runChildUpdate: true});

        this.physics.add.overlap(this.enemies, this.bullets, this.damageEnemy, undefined, this);
    }

    damageEnemy(enemy: Enemy, bullet: Bullet) {
        if (enemy.active === true && bullet.active === true) {
            bullet.setActive(false);
            bullet.setVisible(false);

            enemy.receiveDamage(2)
        }
    }

    placeTurret(pointer: {x: number, y: number}): void {
        let i:number = Math.floor(pointer.y / 64);
        let j:number = Math.floor(pointer.x / 64);
        if (this.canPlaceTurret(i, j)) {
            let turret: Turret = this.turrets.get();
            if (turret) {
                turret.setEnemies(this.enemies);
                turret.setBullets(this.bullets);
                turret.setActive(true);
                turret.setVisible(true);
                turret.place(i, j);
            }
        }
    }

    canPlaceTurret(i: number, j: number): boolean {
        return map[i][j] === 0;
    }

    drawGrid(graphics: Phaser.GameObjects.Graphics) {
        graphics.lineStyle(1, 0x0000ff, 0.8);
        for (let i = 0; i < 8; i++) {
            graphics.moveTo(0, i * 64);
            graphics.lineTo(640, i * 64);
        }
        for (let j = 0; j < 10; j++) {
            graphics.moveTo(j * 64, 0);
            graphics.lineTo(j * 64, 512);
        }
        graphics.strokePath();
    }

    update(time: number, delta: number) {
        // if its time for the next enemy
        if (time > this.nextEnemy) {
            let enemy: Enemy = this.enemies.get();
            if (enemy) {
                enemy.setPath(this.path);
                enemy.setActive(true);
                enemy.setVisible(true);
                // place the enemy at the start of the path
                enemy.startOnPath();
                this.nextEnemy = time + 500;
            }
        }
    }

}