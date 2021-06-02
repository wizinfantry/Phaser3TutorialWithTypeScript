/**
 *  type: Phaser.AUTO,
    width: 1334,
    height: 750,
    scene: [preloadGame, playGame],
    backgroundColor: 0x0c88c7,

    // physics settings
    physics: {
        default: "arcade"
    }
 */

import Phaser from 'phaser';

export const gameOptions = {
    // platform speed range, in pixels per second
    platformSpeedRange: [300, 300],
    // spawn range, how far should be the rightmost platform from the right edge
    // before next platform spawns, in pixels
    spawnRange: [80, 300],
    // platform width range, in pixels
    platformSizeRange: [90, 300],
    // a height range between rightmost platform and next platform to be spawned
    platformHeightRange: [-5, 5],
    // a scale to be multiplied by platformHeightRange
    platformHeighScale: 20,
    // platform max and min height, as screen height ratio
    platformVerticalLimit: [0.4, 0.8],
    // player gravity
    playerGravity: 900,
    // player jump force
    jumpForce: 400,
    // player starting X position
    playerStartPosition: 200,
    // consecutive jumps allowed
    jumps: 2,
    // % of probability a coin appears on the platform
    coinPercent: 25
}

export class preloadGame extends Phaser.Scene {
    constructor() {
        super('preloadGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('platform', 'platform.png');
        this.load.spritesheet('player', 'player.png', {
            frameWidth: 24,
            frameHeight: 48
        });
        this.load.spritesheet('coin', 'coin.png', {
            frameWidth: 20,
            frameHeight: 20
        });
    }

    create(): void {
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', {
                start: 0,
                end: 1
            }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'rotate',
            frames: this.anims.generateFrameNumbers('coin', {
                start: 0,
                end: 5
            }),
            frameRate: 15,
            yoyo: true,
            repeat: -1
        });
        this.scene.start('playGame')
    }
}

export class playGame extends Phaser.Scene {
    addedPlatforms!: number;
    platformGroup!: Phaser.GameObjects.Group;
    platformPool!: Phaser.GameObjects.Group;
    coinGroup!: Phaser.GameObjects.Group;
    coinPool!: Phaser.GameObjects.Group;
    playerJumps!: number;
    player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    nextPlatformDistance!: number;
    constructor() {
        super('playGame');
    }

    create(): void {
        this.addedPlatforms = 0;
        this.platformGroup = this.add.group({
            removeCallback: (platform) => {
                (<this>platform.scene).platformPool.add(platform);
            }
        });
        this.platformPool = this.add.group({
            removeCallback: (platform) => {
                (<this>platform.scene).platformGroup.add(platform);
            }
        });
        this.coinGroup = this.add.group({
            removeCallback: (coin) => {
                (<this>coin.scene).coinPool.add(coin);
            }
        });
        this.coinPool = this.add.group({
            removeCallback: (coin) => {
                (<this>coin.scene).coinGroup.add(coin);
            }
        });

        this.playerJumps = 0;
        this.addPlatform(Number(this.game.config.width), Number(this.game.config.width) / 2, Number(this.game.config.height) * gameOptions.platformVerticalLimit[1]);
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, Number(this.game.config.height) * 0.7, 'player');
        this.player.setGravityY(gameOptions.playerGravity);
        this.physics.add.collider(this.player, this.platformGroup, () => {
            if (!this.player.anims.isPlaying) {
                this.player.anims.play('run');
            }
        }, undefined, this);
        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            this.tweens.add({
                targets: coin,
                y: (coin as Phaser.GameObjects.Sprite).y - 100,
                alpha: 0,
                duration: 800,
                ease: 'cubic.easeOut',
                callbackScope: this,
                onComplete: () => {
                    this.coinGroup.killAndHide(coin);
                    this.coinGroup.remove(coin);
                }
            });
        }, undefined, this);
        this.input.on('pointerdown', this.jump, this);
    }

    addPlatform(platformWidth: number, posX: number, posY: number): void {
        this.addedPlatforms++;
        let platform;
        if (this.platformPool.getLength()) {
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.y = posY;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
            let newRatio = platformWidth / platform.displayWidth;
            platform.displayWidth = platformWidth;
            platform.tileScaleX = 1 / platform.scaleX;
        } else {
            platform = this.add.tileSprite(posX, posY, platformWidth, 32, 'platform');
            this.physics.add.existing(platform);
            platform.body.setImmovable(true);
            platform.body.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            this.platformGroup.add(platform);
        }
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
        if (this.addedPlatforms > 1) {
            if (Phaser.Math.Between(1, 100) <= gameOptions.coinPercent) {
                if (this.coinPool.getLength()) {
                    let coin = this.coinPool.getFirst();
                    coin.x = posX;
                    coin.y = posY - 96;
                    coin.alpha = 1;
                    coin.active = true;
                    coin.visible = true;
                    this.coinPool.remove(coin);
                } else {
                    let coin = this.physics.add.sprite(posX, posY - 96, 'coin');
                    coin.setImmovable(true);
                    coin.setVelocityX(platform.body.velocity.x);
                    coin.anims.play('rotate');
                    this.coinGroup.add(coin);
                }
            }
        }
    }

    jump(): void {
        if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
            if (this.player.body.touching.down) {
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps ++;
            // stops animation
            this.player.anims.stop();
        }
    }

    update(): void {
        // game over
        if (this.player.y > Number(this.game.config.height)) {
            this.scene.start('playGame');
        }
        this.player.x = gameOptions.playerStartPosition;

        // recycling platforms
        let minDistance = Number(this.game.config.width);
        let rightmostPlatformHeight = 0;
        this.platformGroup.getChildren().forEach((platform) => {
            let platformDistance = Number(this.game.config.width) - platform.x - platform.displayWidth / 2;
            if (platformDistance < minDistance) {
                minDistance = platformDistance;
                rightmostPlatformHeight = platform.y;
            }
            if (platform.x < - platform.displayWidth / 2) {
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // recycling coins
        this.coinGroup.getChildren().forEach((coin) => {
            if (coin.x < - coin.displayWidth / 2) {
                this.coinGroup.killAndHide(coin);
                this.coinGroup.remove(coin);
            }
        }, this);

        // adding new platforms
        if (minDistance > this.nextPlatformDistance) {
            let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            let platformRandomHeight = gameOptions.platformHeighScale * Phaser.Math.Between(gameOptions.platformHeightRange[0], gameOptions.platformHeightRange[1]);
            let nextPlatformGap = rightmostPlatformHeight + platformRandomHeight;
            let minPlatformHeight = Number(this.game.config.height) * gameOptions.platformVerticalLimit[0];
            let maxPlatformHeight = Number(this.game.config.height) * gameOptions.platformVerticalLimit[1];
            let nextPlatformHeight = Phaser.Math.Clamp(nextPlatformGap, minPlatformHeight, maxPlatformHeight);
            this.addPlatform(nextPlatformWidth, Number(this.game.config.width) + nextPlatformWidth / 2, nextPlatformHeight);
        }
    }
}
