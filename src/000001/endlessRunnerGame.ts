/**
 *  type: Phaser.AUTO,
    width: 1334,
    height: 750,
    scene: playGame,
    backgroundColor: 0x444444,

    // physics settings
    physics: {
        default: "arcade"
    }
 */
import Phaser from 'phaser';

export const gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
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
        this.load.image('player', 'player.png');
    }

    create(): void {
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
        this.playerJumps = 0;
        this.addPlatform(Number(this.game.config.width), Number(this.game.config.width) / 2);
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, Number(this.game.config.height) / 2, 'player');
        this.player.setGravityY(gameOptions.playerGravity);
        this.physics.add.collider(this.player, this.platformGroup);
        this.input.on('pointerdown', this.jump, this);
    }

    addPlatform(platformWidth: number, posX: number): void {
        let platform:Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        if (this.platformPool.getLength()) {
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        } else {
            platform = this.physics.add.sprite(posX, Number(this.game.config.height) * 0.8, 'platform');
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    jump() {
        if (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)) {
            if (this.player.body.touching.down) {
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps ++;
        }
    }

    update() {
        // game over
        if (this.player.y > Number(this.game.config.height)) {
            this.scene.start('playGame');
        }
        this.player.x = gameOptions.playerStartPosition;

        // recycling platforms
        let minDistance = Number(this.game.config.width);
        (this.platformGroup.getChildren() as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody[]).forEach((platform: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) => {
            let platformDistance = Number(this.game.config.width) - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // adding new platforms
        if(minDistance > this.nextPlatformDistance){
            let nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, Number(this.game.config.width) + nextPlatformWidth / 2);
        }
    }

}