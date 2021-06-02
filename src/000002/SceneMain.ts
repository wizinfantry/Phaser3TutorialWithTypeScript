import Phaser from 'phaser';
import {Entity, Player, GunShip, ChaserShip, CarrierShip, ScrollingBackground} from './Entities';

export default class SceneMain extends Phaser.Scene {
    private keyW!: Phaser.Input.Keyboard.Key;
    private keyS!: Phaser.Input.Keyboard.Key;
    private keyA!: Phaser.Input.Keyboard.Key;
    private keyD!: Phaser.Input.Keyboard.Key;
    private keySpace!: Phaser.Input.Keyboard.Key;
    private enemies!: Phaser.GameObjects.Group;

    public sfx!: { explosions: Phaser.Sound.BaseSound[]; laser: Phaser.Sound.BaseSound; };
    public player!: Player;
    public enemyLasers!: Phaser.GameObjects.Group;
    public playerLasers!: Phaser.GameObjects.Group;
    public backgrounds!: ScrollingBackground[];

    constructor() {
        super('SceneMain');
    }

    preload(): void {
        this.load.setBaseURL('content/');

        this.load.spritesheet('sprExplosion', 'sprExplosion.png', {
            frameHeight: 32,
            frameWidth: 32
        });
        this.load.spritesheet('sprEnemy0', 'sprEnemy0.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.image('sprEnemy1', 'sprEnemy1.png');
        this.load.spritesheet('sprEnemy2', 'sprEnemy2.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.image('sprLaserEnemy0', 'sprLaserEnemy0.png');
        this.load.image('sprLaserPlayer', 'sprLaserPlayer.png');
        this.load.spritesheet('sprPlayer', 'sprPlayer.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.audio('sndExplode0', 'sndExplode0.wav');
        this.load.audio('sndExplode1', 'sndExplode1.wav');
        this.load.audio('sndLaser', 'sndLaser.wav');
    }

    create(): void {
        this.anims.create({
            key: 'sprEnemy0',
            frames: this.anims.generateFrameNumbers('sprEnemy0', {start:0, end:3}),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprEnemy2',
            frames: this.anims.generateFrameNumbers('sprEnemy2', {start:0, end:3}),
            frameRate: 20,
            repeat: -1
        });
        this.anims.create({
            key: 'sprExplosion',
            frames: this.anims.generateFrameNumbers('sprExplosion', {start:0, end:15}),
            frameRate: 20,
            repeat: 0
        });
        this.anims.create({
            key: 'sprPlayer',
            frames: this.anims.generateFrameNumbers('sprPlayer', {start:0, end:3}),
            frameRate: 20,
            repeat: -1
        });
        this.sfx = {
            explosions: [
                this.sound.add('sndExplode0'),
                this.sound.add('sndExplode1')
            ],
            laser: this.sound.add('sndLaser')
        };

        this.backgrounds = [];
        for (let i = 0; i < 5; i++) {
            let bg = new ScrollingBackground(this, 'sprBg0', i * 10);
            this.backgrounds.push(bg)
        }

        this.player = new Player(
            this,
            Number(this.game.config.width) * 0.5,
            Number(this.game.config.height) * 0.5,
            'sprPlayer'
        );

        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.enemies = this.add.group();
        this.enemyLasers = this.add.group();
        this.playerLasers = this.add.group();

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                let enemy: GunShip | ChaserShip | CarrierShip | null = null;
                if (Phaser.Math.Between(0, 10) >= 3) {
                    enemy = new GunShip(
                        this,
                        Phaser.Math.Between(0, Number(this.game.config.width)),
                        0
                    );
                } else if (Phaser.Math.Between(0, 10) >= 5) {
                    if (this.getEnemiesByType('ChaserShip').length < 5) {
                        enemy = new ChaserShip(
                            this,
                            Phaser.Math.Between(0, Number(this.game.config.width)),
                            0
                        )
                    }
                } else {
                    enemy = new CarrierShip(
                        this,
                        Phaser.Math.Between(0, Number(this.game.config.width)),
                        0
                    );
                }

                if (enemy !== null) {
                    enemy.setScale(Phaser.Math.Between(10, 20) * 0.1);
                    this.enemies.add(enemy);
                }
            },
            callbackScope: this,
            loop: true
        });

        this.physics.add.collider(this.playerLasers, this.enemies, (playerLasers, enemy) => {
            if (enemy) {
                if ((enemy as GunShip).onDestroy !== undefined) {
                    (enemy as GunShip).onDestroy();
                }
                (enemy as Entity).explode(true);
                playerLasers.destroy();
            }
        });

        this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
            if (!player.getData('isDead') && !enemy.getData('isDead')) {
                (player as Entity).explode(false);
                (enemy as Entity).explode(true);
                (player as Player).onDestroy();
            }
        });

        this.physics.add.overlap(this.player, this.enemyLasers, (player, laser) => {
            if (!player.getData('isDead') && !laser.getData('isDead')) {
                (player as Entity).explode(false);
                (player as Player).onDestroy();
                laser.destroy();
            }
        });
    }

    update(): void {
        for (let i = 0; i < this.backgrounds.length; i++) {
            this.backgrounds[i].update();
        }

        if (!this.player.getData('isDead')) {
            this.player.update();

            if (this.keyW.isDown) {
                this.player.moveUp();
            } else if (this.keyS.isDown) {
                this.player.moveDown();
            }

            if (this.keyA.isDown) {
                this.player.moveLeft();
            } else if (this.keyD.isDown) {
                this.player.moveRight();
            }

            if (this.keySpace.isDown) {
                this.player.setData('isShooting', true);
            } else {
                this.player.setData('timerShootTick', this.player.getData('timerShootDelay') - 1);
                this.player.setData('isShooting', false);
            }
        }

        for (let i = 0; i < this.enemies.getChildren().length; i++) {
            let enemy = (this.enemies.getChildren()[i] as Phaser.GameObjects.Sprite);
            enemy.update();
            if (enemy.x < -enemy.displayWidth ||
                enemy.x > Number(this.game.config.width) + enemy.displayWidth ||
                enemy.y < -enemy.displayHeight * 4 ||
                enemy.y > Number(this.game.config.height) + enemy.displayHeight) {
                if (enemy) {
                    if ((enemy as GunShip).onDestroy !== undefined) {
                        (enemy as GunShip).onDestroy();
                    }
                    enemy.destroy();
                }
            }
        }

        for (let i = 0; i < this.enemyLasers.getChildren().length; i++) {
            let laser = (this.enemyLasers.getChildren()[i] as Phaser.GameObjects.Sprite);
            laser.update();

            if (laser.x < -laser.displayWidth ||
                laser.x > Number(this.game.config.width) + laser.displayWidth ||
                laser.y < -laser.displayHeight * 4 ||
                laser.y > Number(this.game.config.height) + laser.displayHeight) {
                if (laser) {
                    laser.destroy();
                }
            }
        }

        for (let i = 0; i < this.playerLasers.getChildren().length; i++) {
            let laser = (this.playerLasers.getChildren()[i] as Phaser.GameObjects.Sprite);
            laser.update();
            if (laser.x < -laser.displayWidth ||
                laser.x > Number(this.game.config.width) + laser.displayWidth ||
                laser.y < -laser.displayHeight * 4 ||
                laser.y > Number(this.game.config.height) + laser.displayHeight) {
                if (laser) {
                    laser.destroy();
                }
            }
        }
    }

    getEnemiesByType(type: string): Phaser.GameObjects.GameObject[] {
        let arr:Phaser.GameObjects.GameObject[] = [];
        for (let i = 0; i < this.enemies.getChildren().length; i++) {
            let enemy = this.enemies.getChildren()[i];
            if (enemy.getData('type') == type) {
                arr.push(enemy);
            }
        }
        return arr;
    }
}