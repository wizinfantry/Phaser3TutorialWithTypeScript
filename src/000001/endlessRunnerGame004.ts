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
};

export class preloadGame extends Phaser.Scene {
    constructor() {
        super('preloadGame');
    }

    preload(): void {
        /**
         *  자산 경로 앞에 URL을 추가하려면 여기에서 설정할 수 있습니다.
            자산 기반 URL이 게임 코드 외부에서 구성되도록 허용하는 경우 유용합니다.
            기본 URL이 설정되면 해당 시점부터 로더가 로드 한 모든 파일에 영향을 줍니다.
            이미 로드중인 파일은 변경되지 않습니다. 재설정 하려면 인수없이 이 메서드를 호출하십시오.
            @param url — 사용할 URL입니다. 재설정하려면 비워 둡니다.
         */
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
            frameWidth: 32,
            frameHeight: 58
        });
        this.load.spritesheet('mountain', 'mountain.png', {
            frameWidth: 512,
            frameHeight: 512
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
        this.anims.create({
            key: 'burn',
            frames: this.anims.generateFrameNumbers('fire', {
                start: 0,
                end: 4
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

    create(): void {
        this.mountainGroup = this.add.group();

        this.platformGroup = this.add.group({
            removeCallback: (platform) => {
                this.platformPool.add(platform);
            }
        });
        this.platformPool = this.add.group({
            removeCallback: (platform) => {
                this.platformGroup.add(platform);
            }
        });

        this.coinGroup = this.add.group({
            removeCallback: (coin) => {
                this.coinPool.add(coin);
            }
        });
        this.coinPool = this.add.group({
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
        this.playerJumps = 0;
        this.addPlatform(Number(this.game.config.width), Number(this.game.config.width) / 2, Number(this.game.config.height) * gameOptions.platformVerticalLimit[1]);

        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, Number(this.game.config.height) * 0.7, 'player');
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setDepth(2);

        this.dying = false;

        this.platformCollider = this.physics.add.collider(this.player, this.platformGroup, () => {
            if (!this.player.anims.isPlaying) {
                this.player.anims.play('run');
            }
        }, null, this);

        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            let target = coin as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            this.tweens.add({
                targets: target,
                y: target.y - 100,
                alpha: 0,
                duration: 100,
                ease: 'Cubic.easeOut',
                callbackScope: this,
                onComplete: () => {
                    this.coinGroup.killAndHide(target);
                    this.coinGroup.remove(target);
                }
            });
        }, null, this);

        this.physics.add.overlap(this.player, this.fireGroup, (player, fire) => {
            this.dying = true;
            this.player.anims.stop();
            /**
             *  이 게임 오브젝트가 렌더링에 사용할 프레임을 설정합니다.
                프레임은 현재 사용중인 텍스처에 속해야합니다.
                문자열 또는 색인 일 수 있습니다.
                setFrame을 호출하면 게임 오브젝트의 너비와 높이 속성이 수정됩니다.
                또한 Texture Packer와 같은 패키지에서 내 보낸 것처럼 프레임에 사용자 정의 피벗 점이있는 경우 원점을 변경합니다.
                @param frame — 텍스처 내 프레임의 이름 또는 인덱스입니다.
                @param updateSize —이 호출이 게임 오브젝트의 크기를 조정해야합니까? 기본값은 true입니다.
                @param updateOrigin —이 호출이 게임 오브젝트의 원점을 조정해야합니까? 기본값은 true입니다.
             */
            this.player.setFrame(2);
            this.player.body.setVelocityY(-200);
            /**
             *  더 이상 처리되지 않도록 시뮬레이션에서 Collider를 제거합니다.
                이 방법은 Collider를 파괴하지 않습니다. 나중에 다시 추가하려면 World.colliders.add (Collider)를 호출 할 수 있습니다.
                Collider가 더 이상 필요하지 않은 경우 Collider.destroy 메서드를 대신 호출 할 수 있습니다.
                그러면 자동으로 모든 참조를 지운 다음 월드에서 제거됩니다. Collider에서 destroy를 호출하면 이 메서드에도 전달할 필요가 없습니다.
                @param collider — 시뮬레이션에서 제거 할 Collider입니다.
             */
            this.physics.world.removeCollider(this.platformCollider);
        }, null, this);

        this.input.on('pointerdown', this.jump, this);
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
            let mountain = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            rightmostMountain = Math.max(rightmostMountain, mountain.x);
        });
        return rightmostMountain;
    }

    addPlatform(platformWidth: number, posX: number, posY: number): void {
        this.addedPlatforms++;
        let platform: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody & Phaser.GameObjects.TileSprite;
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
            platform = (this.add.tileSprite(posX, posY, platformWidth, 32, 'platform') as any);
            this.physics.add.existing(platform);
            platform.body.setImmovable(true);
            platform.body.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            platform.setDepth(2);
            this.platformGroup.add(platform);
        }
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);

        if (this.addedPlatforms > 1) {
            if (Phaser.Math.Between(1, 100) <= gameOptions.coinPercent) {
                if (this.coinPool.getLength()) {
                    let coin:Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = this.coinPool.getFirst();
                    coin.x = posY;
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
                    coin.setDepth(2);
                    this.coinGroup.add(coin);
                }
            }
        }

        if (Phaser.Math.Between(1, 100) <= gameOptions.firePercent) {
            if (this.firePool.getLength()) {
                let fire:Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = this.firePool.getFirst();
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
                fire.setSize(8, 2);
                fire.anims.play('burn');
                fire.setDepth(2);
                this.fireGroup.add(fire);
            }
        }
    }

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
        if (this.player.y > Number(this.game.config.height)) {
            this.scene.start('playGame');
        }

        this.player.x = gameOptions.playerStartPosition;

        let minDistance = Number(this.game.config.width);
        let rightmostPlatformHeight = 0;
        this.platformGroup.getChildren().forEach((child) => {
            let platform = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
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

        this.coinGroup.getChildren().forEach((child) => {
            let coin = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            if (coin.x < -coin.displayWidth / 2) {
                this.coinGroup.killAndHide(coin);
                this.coinGroup.remove(coin);
            }
        }, this);

        this.fireGroup.getChildren().forEach((child) => {
            let fire = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            if (fire.x < -fire.displayWidth / 2) {
                this.fireGroup.killAndHide(fire);
                this.fireGroup.remove(fire);
            }
        }, this);

        this.mountainGroup.getChildren().forEach((child) => {
            let mountain = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            if (mountain.x < -mountain.displayWidth) {
                let rightmostMountain = this.getRightmostMountain();
                mountain.x = rightmostMountain + Phaser.Math.Between(100, 350);
                mountain.y = Number(this.game.config.height) + Phaser.Math.Between(0, 100);
                mountain.setFrame(Phaser.Math.Between(0, 3));
                if (Phaser.Math.Between(0, 1)) {
                    mountain.setDepth(1);
                }
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