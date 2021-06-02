/**
 *  width: 1334,
    height: 750,
    scene: playGame,
    backgroundColor: 0x87CEEB,

    // physics settings
    physics: {
        default: "arcade"
    }
 */

import Phaser from 'phaser';

export const gameOptions = {
    // platform speed range, in pixels per second
    platformSpeedRange: [300, 400],
     // spawn range, how far should be the rightmost platform from the right edge
    // before next platform spawns, in pixels
    spawnRange: [80, 300],
    // platform width range, in pixels
    platformSizeRange: [90, 300],
    // a height range between rightmost platform and next platform to be spawned
    platformHeightRange: [-10, 10],
    // a scale to be multiplied by platformHeightRange
    platformHeighScale: 10,
    // platform max and min height, as screen height ratio
    platformVerticalLimit: [0.4, 0.8],
    // player gravity
    playerGravity: 900,
    // player jump force
    jumpForce: 400,
    // player starting X position
    playerStartPosition: 200,
    // consecutive jumps allowed
    jumps: 2
}


export default class playGame extends Phaser.Scene {
    platformGroup!: Phaser.GameObjects.Group;
    platformPool!: Phaser.GameObjects.Group;
    playerJumps!: number;
    player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    nextPlatformDistance!: number;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('platform', 'platform.png');
        this.load.spritesheet('player', 'player.png', {
            frameWidth: 24,
            frameHeight: 48
        });
    }

    create(): void {
        this.platformGroup = this.add.group({
            removeCallback: (platform) => {
                (<this>platform.scene).platformGroup.add(platform);
            }
        });

        this.platformPool = this.add.group({
            removeCallback: (platform) => {
                (<this>platform.scene).platformGroup.add(platform);
            }
        });

        this.playerJumps = 0;
        this.addPlatform(Number(this.game.config.width), Number(this.game.config.width) / 2, Number(this.game.config.height) * gameOptions.platformVerticalLimit[1]);
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, Number(this.game.config.height) * 0.7, 'player');
        this.player.setGravityY(gameOptions.playerGravity);
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', {
                start: 0,
                end: 1
            }),
            frameRate: 0,
            repeat: -1
        });
        this.physics.add.collider(this.player, this.platformGroup, () => {
            if (!this.player.anims.isPlaying) {
                this.player.anims.play('run');
            }
        }, undefined, this);
        this.input.on('pointerdown', this.jump, this);
    }

    addPlatform(platformWidth: number, posX: number, posY: number): void {
        let platform: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        if (this.platformPool.getLength()) {
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        } else {
            platform = this.physics.add.sprite(posX, posY, 'platform');
            platform.setImmovable(true);
            platform.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
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
        if (this.player.y > Number(this.game.config.height)) {
            this.scene.start('playGame');
        }
        this.player.x = gameOptions.playerStartPosition;

        let minDistance = Number(this.game.config.width);
        let rightmostPlatformHeight = 0;
        (<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[]>this.platformGroup.getChildren()).forEach((platform) => {
            let platformDistance = Number(this.game.config.width) - platform.x - platform.displayWidth / 2;
            if (platformDistance < minDistance) {
                minDistance = platformDistance;
                rightmostPlatformHeight = platform.y;
            }
            if (platform.x < -platform.displayWidth / 2) {
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

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