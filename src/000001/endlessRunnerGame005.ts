/*
// object containing configuration options
let gameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: "thegame",
        width: 1334,
        height: 750
    },
    scene: [preloadGame, playGame],
    backgroundColor: 0x0c88c7,

    // physics settings
    physics: {
        default: "arcade"
    }
}
*/

import Phaser from 'phaser';

export const gameOptions = {
    // platform speed range, in pixels per second
    platformSpeedRange: [300, 300],
    // mountain speed, in pixels per second
    mountainSpeed: 80,
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
    coinPercent: 25,
    // % of probability a fire appears on the platform
    firePercent: 25
}

export class preloadGame extends Phaser.Scene {
    constructor() {
        super('preloadGame');
    }

    preload() {
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
        this.load.spritesheet('fire', 'fire.png', {
            frameWidth: 40,
            frameHeight: 70
        });
        this.load.spritesheet('mountain', 'mountain.png', {
            frameWidth: 512,
            frameHeight: 512
        });
    }

    create() {
        // 플레이어 에니메이션 설정
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('player', {
                start: 0,
                end: 1
            }),
            frameRate: 8,
            repeat: -1
        });
        // 코인 에니메이션 설정
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
        // 파이어 에니메이션 설정
        this.anims.create({
            key: 'burn',
            frames: this.anims.generateFrameNumbers('fire', {
                start: 0,
                end: 3
            }),
            frameRate: 15,
            repeat: -1
        });

        this.scene.start('playGame');
    }
}

export class playGame extends Phaser.Scene {
    mountainGroup: Phaser.GameObjects.Group;
    platformGroup: Phaser.GameObjects.Group;
    platformPool: Phaser.GameObjects.Group;
    coinGroup: Phaser.GameObjects.Group;
    coinPool: Phaser.GameObjects.Group;
    fireGroup: Phaser.GameObjects.Group;
    firePool: Phaser.GameObjects.Group;
    addedPlatforms: number;
    playerJumps: number;
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    dying: boolean;
    platformCollider: Phaser.Physics.Arcade.Collider;
    nextPlatformDistance: number;
    constructor() {
        super('playGame');
    }

    create() {
        this.mountainGroup = this.add.group();
        this.platformGroup = this.add.group({
            // 플랫폼이 제거되면 풀에 추가됩니다.
            removeCallback: (platform) => {
                this.platformPool.add(platform);
            }
        });
        this.platformPool = this.add.group({
            // 플랫폼이 풀에서 제거되면 활성 플랫폼 그룹에 추가됩니다.
            removeCallback: (platform) => {
                this.platformGroup.add(platform);
            }
        });

        this.coinGroup = this.add.group({
            // 코인이 제거되면 풀에 추가됩니다.
            removeCallback: (coin) => {
                this.coinPool.add(coin);
            }
        });
        this.coinPool = this.add.group({
            // 코인이 풀에서 제거되면 활성 코인 그룹에 추가됩니다.
            removeCallback: (coin) => {
                this.coinGroup.add(coin);
            }
        });

        this.fireGroup = this.add.group({
            removeCallback: (fire) => {
                this.firePool.add(fire);
            }
        });
        this.firePool = this.add.group({
            removeCallback: (fire) => {
                this.fireGroup.add(fire);
            }
        });

        this.addMountains();
        this.addedPlatforms = 0;

        // 지금까지 플레이어가 만든 연속 점프 수
        this.playerJumps = 0;

        // 게임에 플랫폼을 추가, 인수는 플랫폼 너비, x 위치 및 y 위치입니다.
        this.addPlatform(Number(this.game.config.width), Number(this.game.config.width) / 2, Number(this.game.config.height) * gameOptions.platformVerticalLimit[1]);

        // 플레이어 추가
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, Number(this.game.config.height) * 0.7, 'player');
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setDepth(2);

        this.dying = false;

        // 플레이어와 플랫폼 그룹 간의 충돌 설정
        this.platformCollider = this.physics.add.collider(this.player, this.platformGroup, () => {
            // 플레이어가 플랫폼에있는 경우 'run' 애니메이션 재생
            if (!this.player.anims.isPlaying) {
                this.player.anims.play('run');
            }
        });

        // 플레이어와 코인 그룹 간의 충돌 설정
        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            this.tweens.add({
                targets: coin,
                y: (<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>coin).y,
                alpha: 0,
                duration: 800,
                ease: 'Cubic.easeOut',
                callbackScope: this,
                onComplete: () => {
                    /**
                     *  이 그룹의 구성원을 비활성화하고 숨깁니다.
                        @param gameObject — A member of this group.
                     */
                    this.coinGroup.killAndHide(coin);
                    this.coinGroup.remove(coin);
                }
            });
        });

        // setting collisions between the player and the fire group
        this.physics.add.overlap(this.player, this.fireGroup, (player, fire) => {
            this.dying = true;
            this.player.anims.stop();
            this.player.setFrame(2);
            this.player.body.setVelocityY(-200);
            /**
             *  더 이상 처리되지 않도록 시뮬레이션에서 Collider를 제거합니다.
                이 방법은 Collider를 파괴하지 않습니다.
                나중에 다시 추가하려면 World.colliders.add (Collider)를 호출 할 수 있습니다.
                Collider가 더 이상 필요하지 않은 경우 Collider.destroy 메서드를 대신 호출 할 수 있습니다.
                그러면 자동으로 모든 참조를 지운 다음 월드에서 제거됩니다.
                Collider에서 destroy를 호출하면 이 메서드에도 전달할 필요가 없습니다.
                @param collider — The Collider to remove from the simulation.
             */
            this.physics.world.removeCollider(this.platformCollider);
        });

        this.input.on('pointerdown', this.jump, this);

        this.add.text(20, 0, 'Press SPACEBAR to enter fullscreen', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#ffffff'
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.scale.isFullscreen) {
                this.scale.startFullscreen();
            }
        });
    }

    addMountains(): void {
        let rightmostMountain = this.getRightmostMountain();
        if (rightmostMountain < Number(this.game.config.width) * 2) {
            let mountain = this.physics.add.sprite(rightmostMountain + Phaser.Math.Between(100, 350), Number(this.game.config.height) + Phaser.Math.Between(0, 100), 'mountain');
            mountain.setOrigin(0.5, 1);
            mountain.body.setVelocityX(gameOptions.mountainSpeed * -1);
            this.mountainGroup.add(mountain);
            if (Phaser.Math.Between(0, 1)) {
                mountain.setDepth(1);
            }
            mountain.setFrame(Phaser.Math.Between(0, 3));
            this.addMountains();
        }
    }

    getRightmostMountain(): number {
        let rightmostMountain = -200;
        this.mountainGroup.getChildren().forEach((child) => {
            let mountain = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>child;
            rightmostMountain = Math.max(rightmostMountain, mountain.x);
        });
        return rightmostMountain;
    }

    addPlatform(platformWidth: number, posX: number, posY: number): void {
        this.addedPlatforms++;
        let platform: Phaser.GameObjects.TileSprite & Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
        if (this.platformPool.getLength()) {
            platform =  this.platformPool.getFirst();
            platform.x = posX;
            platform.y = posY;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
            let newRatio = platformWidth / platform.displayWidth;
            platform.displayWidth = platformWidth;
            platform.tileScaleX = 1 / platform.scaleX;
        } else {
            platform = (this.add.tileSprite(posX, posY, platformWidth, 32, 'platform') as any);
            /**
             *  주어진 게임 오브젝트에 Arcade Physics Body를 추가합니다.
                @param gameObject — A Game Object.
                @param isStatic — Create a Static body (true) or Dynamic body (false). Default false.
             */
            this.physics.add.existing(platform);
            /**
             *  Body의 부동 속성을 설정합니다.
                @param value — The value to assign to immovable. Default true.
             */
            platform.body.setImmovable(true);
            platform.body.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            platform.setDepth(2);
            this.platformGroup.add(platform);
        }
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);

        // 이것이 시작 플랫폼이 아니라면 ...
        if (this.addedPlatforms > 1) {
            // 플랫폼 위에 동전이 있습니까?
            if (Phaser.Math.Between(1, 100) <= gameOptions.coinPercent) {
                if (this.coinPool.getLength()) {
                    let coin = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>this.coinPool.getFirst();
                    coin.x = posX;
                    coin.y = posY - 96;
                    coin.alpha = 1;
                    /**
                     * 이 게임 오브젝트의 활성 상태입니다. 활성 상태가 true 인 게임 오브젝트는 추가 된 경우 Scenes UpdateList에 의해 처리됩니다.
                     * 활성 개체는 논리 및 내부 시스템이 업데이트 된 개체입니다.
                     */
                    coin.active = true;
                    coin.visible = true;
                    this.coinPool.remove(coin);
                } else {
                    let coin = this.physics.add.sprite(posX, posY - 96, 'coin');
                    coin.setImmovable(true);
                    coin.setVelocityX(platform.body.velocity.x);
                    coin.anims.play('rotate');
                    coin.setDepth(2);
                    this.coinGroup.add(coin);
                }
            }
            // is there a fire over the platform?
            if (Phaser.Math.Between(1, 100) <= gameOptions.firePercent) {
                if (this.firePool.getLength()) {
                    let fire = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>this.firePool.getFirst();
                    fire.x = posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth);
                    fire.y = posY - 46;
                    fire.alpha = 1;
                    fire.active = true;
                    fire.visible = true;
                    this.firePool.remove(fire);
                } else {
                    let fire = this.physics.add.sprite(posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth), posY - 46, 'fire');
                    fire.setImmovable(true);
                    fire.setVelocityX(platform.body.velocity.x);
                    /**
                     *  프레임 또는 피직스 바디 생성에 사용되는 이 게임 오브젝트의 내부 크기를 설정합니다.
                        이것은 게임 오브젝트가 게임 내에서 렌더링되는 크기를 변경하지 않습니다.
                        이를 위해서는 게임 오브젝트 (setScale)의 크기를 설정하거나 setDisplaySize 메서드를 호출해야 합니다.
                        이는 크기를 변경하는 것과 동일하지만 픽셀 값을 제공하여 그렇게 할 수 있습니다.
                        입력을 위해 이 게임 오브젝트를 활성화 한 경우 크기를 변경해도 히트 영역의 크기가 변경되지 않습니다.
                        이렇게 하려면 input.hitArea 객체를 직접 조정해야합니다.
                        @param width — The width of this Game Object.
                        @param height — The height of this Game Object.
                     */
                    fire.setSize(8, 2);
                    fire.anims.play('burn');
                    fire.setDepth(2);
                    this.fireGroup.add(fire);
                }
            }
        }
    }

    /**
     * 플레이어는지면에있을 때 점프하거나, 점프가 남아 있고 첫 번째 점프가 지면에있는 한 공중에서 한 번 점프하며 플레이어가 죽지 않는 것이 분명합니다.
     */
    jump(): void {
        if ((!this.dying) && (this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps))) {
            if (this.player.body.touching.down) {
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps++;

            this.player.anims.stop();
        }
    }

    update(): void {

        // game over
        if (this.player.y > Number(this.game.config.height)) {
            this.scene.start('playGame');
        }

        // this.player.x = gameOptions.playerStartPosition;
        this.player.body.x = gameOptions.playerStartPosition;

        // recycling platform
        let minDistance = Number(this.game.config.width);
        let rightmostPlatformHeight = 0;
        this.platformGroup.getChildren().forEach((child) => {
            let platform = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>child;
            let platformDistance = Number(this.game.config.width) - platform.x - platform.displayWidth / 2;
            if (platformDistance < minDistance) {
                minDistance = platformDistance;
                rightmostPlatformHeight = platform.y;
            }
            if (platform.x < -platform.displayWidth / 2) {
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        });

        // recycling coin
        this.coinGroup.getChildren().forEach((child) => {
            let coin = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>child;
            if (coin.x < -coin.displayWidth / 2) {
                this.coinGroup.killAndHide(coin);
                this.coinGroup.remove(coin);
            }
        });

        // recycling fire
        this.fireGroup.getChildren().forEach((child) => {
            let fire = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>child;
            if (fire.x < -fire.displayWidth / 2) {
                this.fireGroup.killAndHide(fire);
                this.fireGroup.remove(fire);
            }
        });

        // recycling mountain
        this.mountainGroup.getChildren().forEach((child) => {
            let mountain = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>child;
            if (mountain.x < -mountain.displayWidth) {
                let rightmostMountain = this.getRightmostMountain();
                mountain.x = rightmostMountain + Phaser.Math.Between(100, 350);
                mountain.y = Number(this.game.config.height) + Phaser.Math.Between(0, 100);
                mountain.setFrame(Phaser.Math.Between(0, 3));
                if (Phaser.Math.Between(0, 1)) {
                    mountain.setDepth(1);
                }
            }
        });

        // adding new platform
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