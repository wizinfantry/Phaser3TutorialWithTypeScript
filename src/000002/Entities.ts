import Phaser from 'phaser';
import SceneMain from './SceneMain';

export class Entity extends Phaser.GameObjects.Sprite {
    constructor(scene: Phaser.Scene, x: number, y: number, key: string, type: string) {
        super(scene, x, y, key);
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.world.enableBody(this, 0);
        this.setData('type', type);
        this.setData('isDead', false);
    }

    explode(canDestroy: boolean):void {
        if (!this.getData('isDead')) {
            this.setTexture('sprExplosion');
            this.play('sprExplosion');
            (this.scene as SceneMain).sfx.explosions[Phaser.Math.Between(0, (this.scene as SceneMain).sfx.explosions.length - 1)].play();

            if ('shootTimer' in this) {
                if ((<GunShip>this).shootTimer) {
                    (<GunShip>this).shootTimer.remove(false);
                }
            }

            this.setAngle(0);
            this.body.velocity.x = 0;
            this.body.velocity.y = 0;

            this.on('animationcomplete', () => {
                if (canDestroy) {
                    this.destroy();
                } else {
                    this.setVisible(false);
                }
            }, this);

            this.setData('isDead', true);
        }
    }
}

export class Player extends Entity {
    constructor(scene: Phaser.Scene, x: number, y: number, key: string) {
        super(scene, x, y, key, 'Player');
        this.setData('speed', 200);
        this.play('sprPlayer');
        this.setData('isShooting', false);
        this.setData('timerShootDelay', 10);
        this.setData('timerShootTick', this.getData('timerShootDelay') - 1);
    }

    moveUp(): void {
        this.body.velocity.y = -Number(this.getData('speed'));
    }

    moveDown(): void {
        this.body.velocity.y = Number(this.getData('speed'));
    }

    moveLeft(): void {
        this.body.velocity.x = -Number(this.getData('speed'));
    }

    moveRight(): void {
        this.body.velocity.x = Number(this.getData('speed'));
    }

    update(): void {
        this.body.velocity.x = 0;
        this.body.velocity.y = 0;

        this.x = Phaser.Math.Clamp(this.x, 0, Number(this.scene.game.config.width));
        this.y = Phaser.Math.Clamp(this.y, 0, Number(this.scene.game.config.height));

        if (this.getData('isShooting')) {
            if (this.getData('timerShootTick') < this.getData('timerShootDelay')) {
                this.setData('timerShootTick', this.getData('timerShootTick') + 1);
            } else {
                let laser = new PlayerLaser(this.scene, this.x, this.y);
                (this.scene as SceneMain).playerLasers.add(laser);
                (this.scene as SceneMain).sfx.laser.play();
                this.setData('timerShootTick', 0);
            }
        }
    }

    onDestroy(): void {
        this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.scene.scene.start('SceneGameOver');
            },
            callbackScope: this,
            loop: false
        });
    }
}

export class ChaserShip extends Entity {
    private states: { MOVE_DOWN: string; CHASE: string; };
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprEnemy1', 'ChaserShip');
        this.body.velocity.y = Phaser.Math.Between(50, 100);
        this.states = {
            MOVE_DOWN: 'MOVE_DOWN',
            CHASE: 'CHASE'
        };
        this.state = this.states.MOVE_DOWN;
    }

    update() {
        if (!this.getData('isDead') && (this.scene as SceneMain).player) {
            if (Phaser.Math.Distance.Between(
                this.x,
                this.y,
                (this.scene as SceneMain).player.x,
                (this.scene as SceneMain).player.y
            ) < 320) {
                this.state = this.states.CHASE;
            }

            if (this.state == this.states.CHASE) {
                let dx = (this.scene as SceneMain).player.x - this.x;
                let dy = (this.scene as SceneMain).player.y - this.y;
                let angle = Math.atan2(dy, dx);
                let speed = 100;
                this.body.velocity.x = Math.cos(angle) * speed;
                this.body.velocity.y = Math.sin(angle) * speed;
            }

            if (this.x < (this.scene as SceneMain).player.x) {
                this.angle -= 5;
            } else {
                this.angle += 5;
            }
        }
    }
}

export class GunShip extends Entity {
    public shootTimer: Phaser.Time.TimerEvent;
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprEnemy0', 'GunShip');
        this.body.velocity.y = Phaser.Math.Between(50, 100);
        this.shootTimer = this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                let laser = new EnemyLaser(
                    this.scene,
                    this.x,
                    this.y
                );
                laser.setScale(this.scaleX);
                (this.scene as SceneMain).enemyLasers.add(laser);
            }
        })
        this.play('sprEnemy0');
    }
    onDestroy(): void {
        if (this.shootTimer !== undefined) {
            if (this.shootTimer) {
                this.shootTimer.remove(false);
            }
        }
    }
}

export class CarrierShip extends Entity {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprEnemy2', 'CarrierShip');
        this.body.velocity.y = Phaser.Math.Between(50, 100);
        this.play('sprEnemy2');
    }
}

export class EnemyLaser extends Entity {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprLaserEnemy0', '');
        this.body.velocity.y = 200;
    }
}

export class PlayerLaser extends Entity {
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'sprLaserPlayer', '');
        this.body.velocity.y = -200;
    }
}

export class ScrollingBackground {
    private scene: Phaser.Scene;
    private key: string;
    private velocityY: number;
    private layers: Phaser.GameObjects.Group;
    constructor(scene: Phaser.Scene, key: string, velocityY: number) {
        this.scene = scene;
        this.key = key;
        this.velocityY = velocityY;
        this.layers = this.scene.add.group();
        this.createLayers();
    }

    createLayers(): void {
        for (let i = 0; i < 2; i++) {
            let layer = this.scene.add.sprite(0, 0, this.key);
            layer.y = layer.displayHeight * i;
            let flipX = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1;
            let flipY = Phaser.Math.Between(0, 10) >= 5 ? -1 : 1;
            layer.setScale(flipX * 2, flipY * 2);
            layer.setDepth(-5 - (i - 1));
            this.scene.physics.world.enableBody(layer, 0);
            layer.body.velocity.y = this.velocityY;
            this.layers.add(layer);
        }
    }

    update():void {
        if ((this.layers.getChildren()[0] as Phaser.GameObjects.Sprite).y > 0) {
            for (let i = 0; i < this.layers.getChildren().length; i++) {
                let layer = (this.layers.getChildren()[i] as Phaser.GameObjects.Sprite);
                layer.y = (-layer.displayHeight) + (layer.displayHeight * i);
            }
        }
    }
}