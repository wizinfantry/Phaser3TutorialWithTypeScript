/**
 *  let gameConfig = {
        type: Phaser.AUTO,
        width: 750,
        height: 1334,
        scene: [playGame],
        backgroundColor: 0x0c88c7
    }
*/

import Phaser from 'phaser';

const gameOptions = {
    platformGapRange: [200, 400],
    platformWidthRange: [50, 150],
    platformHeight: 600,
    playerWidth: 32,
    playerHeight: 64,
    poleWidth: 8,
    growTime: 500,
    rotateTime: 500,
    walkTime: 3,
    fallTime: 500,
    scrollTime: 250
}

const IDLE = 0;
const WAITING = 1;
const GROWING = 2;
const WALKING = 3;

export class playGame extends Phaser.Scene {
    mainPlatform: number;
    platforms: Phaser.GameObjects.Sprite[];
    coin: Phaser.GameObjects.Sprite;
    gameMode: number;
    player: Phaser.GameObjects.Sprite;
    pole: Phaser.GameObjects.Sprite;
    growTween: Phaser.Tweens.Tween;
    walkTween: Phaser.Tweens.Tween;
    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.image('tile', 'tile.png');
        this.load.image('coin', 'stick_coin.png');
        this.load.image('player', 'stick_player.png');
    }

    create() {
        this.addCoin();
        this.addPlatforms();
        this.addPlayer();
        this.addPole();
        this.input.on('pointerdown', this.grow, this);
        this.input.on('pointerup', this.stop, this);
    }

    addPlatforms(): void {
        this.mainPlatform = 0;
        this.platforms = [];
        this.platforms.push(this.addPlatform(0));
        this.platforms.push(this.addPlatform(Number(this.game.config.width)));
        this.tweenPlatform();
    }

    addPlatform(posX: number): Phaser.GameObjects.Sprite {
        let platform = this.add.sprite(posX, Number(this.game.config.height) - gameOptions.platformHeight, 'tile');
        platform.displayWidth = (gameOptions.platformWidthRange[0] + gameOptions.platformWidthRange[1]) / 2;
        platform.displayHeight = gameOptions.platformHeight;
        platform.alpha = 0.7;
        platform.setOrigin(0, 0);
        return platform;
    }

    addCoin(): void {
        this.coin = this.add.sprite(0, Number(this.game.config.height) - gameOptions.platformHeight + gameOptions.playerHeight / 2, 'coin');
        this.coin.visible = true;
    }

    placeCoin(): void {
        this.coin.x = Phaser.Math.Between(this.platforms[this.mainPlatform].getBounds().right + 10, this.platforms[1 - this.mainPlatform ].getBounds().left - 10);
        this.coin.visible = true;
    }

    tweenPlatform(): void {
        let destination = this.platforms[this.mainPlatform].displayWidth + Phaser.Math.Between(gameOptions.platformGapRange[0], gameOptions.platformGapRange[1]);
        let size = Phaser.Math.Between(gameOptions.platformWidthRange[0], gameOptions.platformWidthRange[1]);
        this.tweens.add({
            targets: [this.platforms[1 - this.mainPlatform]],
            x: destination,
            displayWidth: size,
            duration: gameOptions.scrollTime,
            callbackScope: this,
            onComplete: () => {
                this.gameMode = WAITING;
                this.placeCoin();
            }
        });
    }

    addPlayer(): void {
        this.player = this.add.sprite(this.platforms[this.mainPlatform].displayWidth - gameOptions.poleWidth, Number(this.game.config.height) - gameOptions.platformHeight, 'player');
        this.player.setOrigin(1, 1);
    }

    addPole(): void {
        this.pole = this.add.sprite(this.platforms[this.mainPlatform].displayWidth, Number(this.game.config.height) - gameOptions.platformHeight, 'tile');
        this.pole.setOrigin(1, 1);
        this.pole.displayWidth = gameOptions.poleWidth;
        this.pole.displayHeight = gameOptions.playerHeight / 4;
    }

    grow(): void {
        if (this.gameMode == WAITING) {
            this.gameMode = GROWING;
            this.growTween = this.tweens.add({
                targets: [this.pole],
                displayHeight: gameOptions.platformGapRange[1] + gameOptions.platformWidthRange[1],
                duration: gameOptions.growTime
            });
        }
        if (this.gameMode == WALKING) {
            if (this.player.flipY) {
                this.player.flipY = false;
                this.player.y = Number(this.game.config.height) - gameOptions.platformHeight;
            } else {
                this.player.flipY = true;
                this.player.y = Number(this.game.config.height) - gameOptions.platformHeight + gameOptions.playerHeight - gameOptions.poleWidth;
                /**
                 *  getBounds()
                 *  원점에 관계없이 이 Game Object의 경계를 가져옵니다.
                 *  값은 Rectangle 또는 Rectangle과 유사한 객체에 저장되고 반환됩니다.
                    @param output — 값을 저장할 개체입니다. 제공되지 않으면 새 Rectangle이 생성됩니다.
                 */
                let playerBound = this.player.getBounds();
                let platformBound = this.platforms[1 - this.mainPlatform].getBounds();
                /**
                 *  Phaser.Geom.Rectangle.Intersection
                 *  두 개의 Rectangle을 akes하고 먼저 교차하는지 확인합니다.
                 *  교차하면 out Rectangle의 교차 영역을 반환합니다.
                 *  교차하지 않으면 out Rectangle은 너비와 높이가 0이됩니다.
                    @param rectA — 교차점을 가져올 첫 번째 Rectangle입니다.
                    @param rectB — 교차점을 가져올 두 번째 Rectangle입니다.
                    @param out — 교차점 결과를 저장할 Rectangle입니다.
                 */
                if (Phaser.Geom.Rectangle.Intersection(playerBound, platformBound).width != 0) {
                    this.player.flipY = false;
                    this.player.y = Number(this.game.config.height) - gameOptions.platformHeight;
                }
            }
        }
    }

    stop(): void {
        if (this.gameMode == GROWING) {
            this.gameMode = IDLE;
            this.growTween.stop();
            if (this.pole.displayHeight > this.platforms[1 - this.mainPlatform].x - this.pole.x) {
                this.tweens.add({
                    targets: [this.pole],
                    angle: 90,
                    duration: gameOptions.rotateTime,
                    ease: 'Bounce.easeOut',
                    callbackScope: this,
                    onComplete: () => {
                        this.gameMode = WALKING;
                        if (this.pole.displayHeight < this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.x) {
                            this.walkTween = this.tweens.add({
                                targets: [this.player],
                                x: this.platforms[1 - this.mainPlatform].x + this.platforms[1 - this.mainPlatform].displayWidth - this.pole.displayWidth,
                                duration: gameOptions.walkTime * this.pole.displayHeight,
                                callbackScope: this,
                                onComplete: () => {
                                    this.coin.visible = false;
                                    this.tweens.add({
                                        targets: [this.player, this.pole, this.platforms[1 - this.mainPlatform], this.platforms[this.mainPlatform]],
                                        props: {
                                            x: {
                                                value: '-= ' + this.platforms[1 - this.mainPlatform].x
                                            }
                                        },
                                        duration: gameOptions.scrollTime,
                                        callbackScope: this,
                                        onComplete: () => {
                                            this.prepareNextMove();
                                        }
                                    });
                                }
                            });
                        } else {
                            this.platformTooLong();
                        }
                    }
                });
            } else {
                this.platformTooShort()
            }
        }
    }

    platformTooLong(): void {
        this.walkTween = this.tweens.add({
            targets: [this.player],
            x: this.pole.x + this.pole.displayHeight + this.player.displayWidth,
            duration: gameOptions.walkTime * this.pole.displayHeight,
            callbackScope: this,
            onComplete: () => {
                this.fallAndDie();
            }
        });
    }

    platformTooShort(): void {
        this.tweens.add({
            targets: [this.pole],
            angle: 90,
            duration: gameOptions.rotateTime,
            callbackScope: this,
            onComplete: () => {
                this.gameMode = WALKING;
                this.tweens.add({
                    targets: [this.player],
                    x: this.pole.x + this.pole.displayHeight,
                    duration: gameOptions.walkTime * this.pole.displayHeight,
                    callbackScope: this,
                    onComplete: () => {
                        this.tweens.add({
                            targets: [this.pole],
                            angle: 180,
                            duration: gameOptions.rotateTime,
                            ease: 'Cubic.easeIn'
                        });
                        this.fallAndDie();
                    }
                });
            }
        });
    }

    fallAndDie(): void {
        this.gameMode = IDLE;
        this.tweens.add({
            targets: [this.player],
            y: Number(this.game.config.height) + this.player.displayHeight * 2,
            duration: gameOptions.fallTime,
            ease: 'Cubic.easeIn',
            callbackScope: this,
            onComplete: () => {
                this.shakeAndRestart();
            }
        });
    }

    prepareNextMove(): void {
        this.gameMode = IDLE;
        this.platforms[this.mainPlatform].x = Number(this.game.config.width);
        this.mainPlatform = 1 - this.mainPlatform;
        this.tweenPlatform();
        this.pole.angle = 0;
        this.pole.x = this.platforms[this.mainPlatform].displayWidth;
        this.pole.displayHeight = gameOptions.poleWidth;
    }

    shakeAndRestart(): void {
        this.cameras.main.shake(800, 0.01);
        this.time.addEvent({
            delay: 2000,
            callbackScope: this,
            callback: () => {
                this.scene.start('playGame');
            }
        });
    }

    update(): void {
        if (this.player.flipY) {
            let playerBound = this.player.getBounds();
            let coinBound = this.coin.getBounds();
            let platformBound = this.platforms[1 - this.mainPlatform].getBounds();
            if (Phaser.Geom.Rectangle.Intersection(playerBound, platformBound).width != 0) {
                this.walkTween.stop();
                this.gameMode = IDLE;
                this.shakeAndRestart();
            }
            if (this.coin.visible && Phaser.Geom.Rectangle.Intersection(playerBound, coinBound).width != 0) {
                this.coin.visible = false;
            }
        }
    }
}
