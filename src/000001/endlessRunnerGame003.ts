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
        this.load.spritesheet('mountain', 'mountain.png', {
            frameWidth: 512,
            frameHeight: 512
        });
    }

    create(): void {
        /**
         *  setting player animation
         */
        /**
         *  새 애니메이션을 만들고 애니메이션 관리자에 추가합니다.
            애니메이션은 글로벌입니다. 일단 생성되면 게임의 모든 씬에서 사용할 수 있습니다. 장면에 한정되지 않습니다.
            유효하지 않은 키가 주어지면 이 메서드는 false를 반환합니다.
            애니메이션 관리자에 이미 있는 애니메이션의 키를 전달하면 해당 애니메이션이 반환됩니다.
            새로운 애니메이션은 키가 유효하고 아직 사용 중이 아닌 경우에만 생성됩니다.
            기존 키를 다시 사용하려면 먼저 AnimationManager.remove를 호출 한 다음 이 메서드를 호출합니다.
            @param config — 애니메이션의 구성 설정입니다.
         */
        this.anims.create({
            /**
             *  애니메이션이 연결될 키입니다. 즉 sprite.animations.play (key
             */
            key: 'run',
            /**
             *  frames:
             *  문자열,이 경우 일치하는 키가있는 텍스처의 모든 프레임 또는 애니메이션 프레임 구성 개체의 배열을 사용합니다.
             *
             *  this.anims.generateFrameNumbers
             *  텍스처 키 및 구성 개체에서 {@link Phaser.Types.Animations.AnimationFrame} 개체의 배열을 생성합니다.
                지정된 {@link Phaser.Types.Animations.GenerateFrameNumbers}에서 구성한대로 번호가 매겨진 프레임 이름으로 개체를 생성합니다.
                텍스처 아틀라스로 작업하는 경우 대신 generateFrameNames 메서드를 참조하십시오.
                스프라이트 시트에서 프레임을 쉽게 추출 할 수 있도록 설계된 도우미 메서드입니다. 텍스처 아틀라스로 작업하는 경우 대신 generateFrameNames 메서드를 참조하십시오.
             */
            frames: this.anims.generateFrameNumbers('player', {
                start: 0,
                end: 1
            }),
            /**
             *  재생 프레임 속도 (초당 프레임 수) (기간이 null 인 경우 기본값 24)
             */
            frameRate: 8,
            /**
             *  애니메이션 반복 횟수 (무한대는 -1)
             */
            repeat: -1
        });

        /**
         *  setting coin animation
         */
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

        this.scene.start('playGame');
    }
}

export class playGame extends Phaser.Scene {
    mountainGroup: Phaser.GameObjects.Group;
    platformGroup: Phaser.GameObjects.Group;
    platformPool: Phaser.GameObjects.Group;
    coinGroup: Phaser.GameObjects.Group;
    coinPool: Phaser.GameObjects.Group;
    /**
     *  keeping track of added platforms
     */
    addedPlatforms: number;
    /**
     *  number of consecutive jumps made by the player so far
     */
    playerJumps: number;
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    nextPlatformDistance: number;
    constructor() {
        super('playGame');
    }

    create(): void {
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
            removeCallback: (coin) => {
                this.coinPool.add(coin);
            }
        });
        this.coinPool = this.add.group({
            removeCallback: (coin) => {
                this.coinGroup.add(coin);
            }
        });

        this.addMountains();

        this.addedPlatforms = 0;
        this.playerJumps = 0;
        // 게임에 플랫폼을 추가하면 인수는 플랫폼 너비, x 위치 및 y 위치입니다.
        this.addPlatform(Number(this.game.config.width), Number(this.game.config.width) / 2, Number(this.game.config.height) * gameOptions.platformVerticalLimit[1]);

        /**
         *  Creates a new Arcade Sprite object with a Dynamic body.
            @param x — The horizontal position of this Game Object in the world.
            @param y — The vertical position of this Game Object in the world.
            @param key — The key of the Texture this Game Object will use to render with, as stored in the Texture Manager.
            @param frame — An optional frame from the Texture this Game Object is rendering with.
         */
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, Number(this.game.config.height) * 0.7, 'player');
        this.player.setGravityY(gameOptions.playerGravity);
        this.player.setDepth(2);

        /**
         *  setting collisions between the player and the platform group
         */
        /**
         *  새로운 Arcade Physics Collider 오브젝트를 만듭니다.
            @param object1 — The first object to check for collision.
            @param object2 — The second object to check for collision.
            @param collideCallback — The callback to invoke when the two objects collide.
            @param processCallback — The callback to invoke when the two objects collide. Must return a boolean.
            @param callbackContext — The scope in which to call the callbacks.
         */
        this.physics.add.collider(this.player, this.platformGroup, () => {
            if (!this.player.anims.isPlaying) {
                this.player.anims.play('run');
            }
        }, null, this);

        /**
         *  setting collisions between the player and the coin group
         */
        /**
         *  Creates a new Arcade Physics Collider Overlap object.
            @param object1 — The first object to check for overlap.
            @param object2 — The second object to check for overlap.
            @param collideCallback — The callback to invoke when the two objects collide.
            @param processCallback — The callback to invoke when the two objects collide. Must return a boolean.
            @param callbackContext — The scope in which to call the callbacks.
         */
        this.physics.add.overlap(this.player, this.coinGroup, (player, coin) => {
            this.tweens.add({
                targets: coin,
                y: (<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>coin).y - 100,
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
                    /**
                     *  이 그룹의 구성원을 제거하고 선택적으로 장면에서 제거하거나 파괴합니다.
                        Calls {@link Phaser.GameObjects.Group#removeCallback}.
                        @param child — The Game Object to remove.
                        @param removeFromScene — Optionally remove the Group member from the Scene it belongs to. Default false.
                        @param destroyChild — Optionally call destroy on the removed Group member. Default false.
                     */
                    this.coinGroup.remove(coin);
                }
            })
        }, null, this);

        /**
         *  Add a listener for a given event.
            @param event — The event name.
            @param fn — The listener function.
            @param context — The context to invoke the listener with. Default this.
         */
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
            /**
             *  이 게임 오브젝트가 렌더링에 사용할 프레임을 설정합니다.
                프레임은 현재 사용중인 텍스처에 속해야합니다.
                문자열 또는 색인 일 수 있습니다.
                setFrame을 호출하면 게임 오브젝트의 너비와 높이 속성이 수정됩니다.
                또한 Texture Packer와 같은 패키지에서 내 보낸 것처럼 프레임에 사용자 정의 피벗 점이있는 경우 원점을 변경합니다.
                @param frame — The name or index of the frame within the Texture.
                @param updateSize — Should this call adjust the size of the Game Object? Default true.
                @param updateOrigin — Should this call adjust the origin of the Game Object? Default true.
             */
            mountain.setFrame(Phaser.Math.Between(0, 3));
            this.addMountains();
        }
    }

    /**
     * getting rightmost mountain x position
     * @returns number
     */
    getRightmostMountain(): number {
        let rightmostMountain = -200;
        this.mountainGroup.getChildren().forEach((mountain) => {
            rightmostMountain = Math.max(rightmostMountain, (<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>mountain).x);
        });
        return rightmostMountain;
    }

    /**
     * the core of the script: platform are added from the pool or created on the fly
     * @param platformWidth number
     * @param posX number
     * @param posY number
     */
    addPlatform(platformWidth: number, posX: number, posY: number):void {
        this.addedPlatforms++;
        let platform;
        if (this.platformPool.getLength()) {
            platform = <Phaser.GameObjects.TileSprite>this.platformPool.getFirst();
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
            /**
             *  Adds an Arcade Physics Body to the given Game Object.
                @param gameObject — A Game Object.
                @param isStatic — Create a Static body (true) or Dynamic body (false). Default false.
             */
            this.physics.add.existing(platform);
            let body = (platform as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).body;
            /**
             *  이 Body가 다른 바디와 충돌하는 동안 분리 될 수 있는지 여부를 설정합니다.
                몸체가 움직일 수 없다는 것은 충돌 겹침에서 분리하지 않고 전혀 움직이지 않음을 의미합니다.
                바디가 다른 바디에 의해 넘어지는 것을 막으려면 대신 setPushable 메서드를 참조하십시오.
                @param 값 — 다른 바디와 충돌하는 동안이 바디가 분리되는지 여부를 설정합니다. 기본값은 true입니다.
             */
            body.setImmovable(true);
            body.setVelocityX(Phaser.Math.Between(gameOptions.platformSpeedRange[0], gameOptions.platformSpeedRange[1]) * -1);
            platform.setDepth(2);
            this.platformGroup.add(platform);
        }
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);

        /**
         *  is there a coin over the platform?
         */
        if (this.addedPlatforms > 1) {
            if (Phaser.Math.Between(1, 100) < gameOptions.coinPercent) {
                if (this.coinPool.getLength()) {
                    let coin: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody = this.coinPool.getFirst();
                    coin.x = posX;
                    coin.y = posY - 96;
                    coin.alpha = 1;
                    coin.active = true;
                    coin.visible = true;
                    /**
                     *  이 그룹의 구성원을 제거하고 선택적으로 장면에서 제거하거나 파괴합니다.
                        {@link Phaser.GameObjects.Group # removeCallback}을 호출합니다.
                        @param child — 제거 할 게임 개체입니다.
                        @param removeFromScene — 선택적으로 자신이 속한 씬에서 그룹 구성원을 제거합니다. 기본값은 false입니다.
                        @param destroyChild — 선택적으로 제거 된 그룹 구성원에 대해 destroy를 호출합니다. 기본값은 false입니다.
                    */
                    this.coinPool.remove(coin);
                } else {
                    let coin = this.physics.add.sprite(posX, posY - 96, 'coin');
                    coin.setImmovable(true);
                    let body = (platform  as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody).body;
                    coin.setVelocityX(body.velocity.x);
                    coin.anims.play('rotate');
                    coin.setDepth(2);
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
            this.playerJumps++;

            this.player.anims.stop();
        }
    }

    update(): void {
        /**
         *  game over
         */
        if (this.player.y > Number(this.game.config.height)) {
            this.scene.start('playGame');
        }
        this.player.x = gameOptions.playerStartPosition;

        /**
         *  recycling platforms
         */
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

        /**
         *  recycling coin
         */
        this.coinGroup.getChildren().forEach((child) => {
            let coin = child as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
            if (coin.x < -coin.displayWidth / 2) {
                this.coinGroup.killAndHide(coin);
                this.coinGroup.remove(coin);
            }
        }, this);

        /**
         *  recycling mountain
         */
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