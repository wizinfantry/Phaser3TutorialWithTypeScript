/**
 *  width: 640,
    height: 960,
    scene: playGame,
    backgroundColor: 0x444444
 */
import Phaser from 'phaser';

export const gameOptions = {
    bgColors: [0x62bd18, 0xff5300, 0xd21034, 0xff475c, 0x8f16b2, 0x588c7e, 0x8c4646],
    holeWidthRange: [80, 260],
    wallRange: [10, 50],
    growTime: 1500,
    localStorageName: 'squaregamephaser3'
}

export const IDLE = 0;
export const WAITING = 1;
export const GROWING = 2;

let saveData: {level: number};

export default class playGame extends Phaser.Scene {
    leftSquare!: Phaser.GameObjects.Sprite;
    rightSquare!: Phaser.GameObjects.Sprite;
    leftWall!: Phaser.GameObjects.Sprite;
    rightWall!: Phaser.GameObjects.Sprite;
    square!: Phaser.GameObjects.Sprite;
    squareText!: Phaser.GameObjects.BitmapText;
    levelText!: Phaser.GameObjects.BitmapText;
    gameMode!: number;
    rotateTween!: Phaser.Tweens.Tween;
    infoGroup!: Phaser.GameObjects.Group;
    growTween!: Phaser.Tweens.Tween;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('base', 'base.png');
        this.load.image('square', 'square.png');
        this.load.image('top', 'top.png');
        this.load.bitmapFont('font', 'font.png', 'font.fnt');
    }

    create(): void {
        saveData = JSON.parse(localStorage.getItem(gameOptions.localStorageName) || '{"level": 1}');
        let tintColor = Phaser.Utils.Array.GetRandom(gameOptions.bgColors);
        this.cameras.main.setBackgroundColor(tintColor);
        this.leftSquare = this.add.sprite(0, Number(this.game.config.height), 'base');
        this.leftSquare.setOrigin(1, 1);
        this.rightSquare = this.add.sprite(Number(this.game.config.width), Number(this.game.config.height), 'base');
        this.rightSquare.setOrigin(0, 1);
        this.leftWall = this.add.sprite(0, Number(this.game.config.height) - this.leftSquare.height, 'top')
        this.leftWall.setOrigin(1, 1);
        this.rightWall = this.add.sprite(Number(this.game.config.width), Number(this.game.config.height) - this.rightSquare.height, 'top');
        this.rightWall.setOrigin(0, 1);
        this.square = this.add.sprite(Number(this.game.config.width) / 2, -400, 'square');
        this.square['successful'] = 0;
        this.square.setScale(0.2);
        this.squareText = this.add.bitmapText(Number(this.game.config.width) / 2, -500, 'font', (saveData.level - this.square['successful']).toString(), 120);
        this.squareText.setOrigin(0.5);
        this.squareText.setScale(0.4);
        this.squareText.setTint(tintColor, tintColor, tintColor, tintColor);
        this.levelText = this.add.bitmapText(Number(this.game.config.width) / 2, 0, 'font', 'level ' + (saveData.level).toString(), 60);
        this.levelText.setOrigin(0.5, 0);
        this.updateLevel();
        this.input.on('pointerdown', this.grow, this);
        this.input.on('pointerup', this.stop, this);
        this.gameMode = IDLE;
    }

    updateLevel(): void {
        let holeWidth = Phaser.Math.Between(gameOptions.holeWidthRange[0], gameOptions.holeWidthRange[1]);
        let wallWidth = Phaser.Math.Between(gameOptions.wallRange[0], gameOptions.wallRange[1]);
        this.placeWall(this.leftSquare, (Number(this.game.config.width) - holeWidth) / 2);
        this.placeWall(this.rightSquare, (Number(this.game.config.width) + holeWidth) / 2);
        this.placeWall(this.leftWall, (Number(this.game.config.width) - holeWidth) / 2 - wallWidth);
        this.placeWall(this.rightWall, (Number(this.game.config.width) + holeWidth) / 2 + wallWidth);
        let squareTween = this.tweens.add({
            targets: [this.square, this.squareText],
            y: 150,
            scaleX: 0.2,
            scaleY: 0.2,
            angle: 50,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.rotateTween = this.tweens.add({
                    targets: [this.square, this.squareText],
                    angle: 40,
                    duration: 300,
                    yoyo: true,
                    repeat: -1
                });
                if (this.square['successful'] == 0) {
                    this.addInfo(holeWidth, wallWidth);
                }
                this.gameMode = WAITING;
            }
        });
    }

    placeWall(target: Phaser.GameObjects.Sprite, posX: number): void {
        this.tweens.add({
            targets: target,
            x: posX,
            duration: 500,
            ease: 'Cubic.easeOut'
        });
    }

    grow(): void {
        if (this.gameMode == WAITING) {
            this.gameMode = GROWING;
            if (this.square['successful'] == 0) {
                this.infoGroup.toggleVisible();
            }
            this.growTween = this.tweens.add({
                targets: [this.square, this.squareText],
                scaleX: 1,
                scaleY: 1,
                duration: gameOptions.growTime
            });
        }
    }

    stop(): void {
        if (this.gameMode == GROWING) {
            this.gameMode = IDLE;
            this.growTween.stop();
            this.rotateTween.stop();
            this.rotateTween = this.tweens.add({
                targets: [this.square, this.squareText],
                angle: 0,
                duration: 300,
                ease: 'Cubic.easeOut',
                callbackScope: this,
                onComplete: () => {
                    if (this.square.displayWidth <= this.rightSquare.x - this.leftSquare.x) {
                        this.tweens.add({
                            targets: [this.square, this.squareText],
                            y: Number(this.game.config.height) + this.square.displayWidth,
                            duration: 600,
                            ease: 'Cubic.easeIn',
                            callbackScope: this,
                            onComplete: () => {
                                this.levelText.text = 'Oh no!!!';
                                this.gameOver();
                            }
                        });
                    } else {
                        if (this.square.displayWidth <= this.rightWall.x - this.leftWall.x) {
                            this.fallAndBounce(true);
                        } else {
                            this.fallAndBounce(false);
                        }
                    }
                }
            });
        }
    }

    fallAndBounce(success: boolean): void {
        let destY = Number(this.game.config.height) - this.leftSquare.displayHeight - this.square.displayHeight / 2;
        let message = 'Yeah!!!!';
        if (success) {
            this.square['successful']++;
        } else {
            destY = Number(this.game.config.height) - this.leftSquare.displayHeight - this.leftWall.displayHeight - this.square.displayHeight / 2;
            message = 'Oh no!!!!';
        }
        this.tweens.add({
            targets: [this.square, this.squareText],
            y: destY,
            duration: 600,
            ease: 'Bounce.easeOut',
            callbackScope: this,
            onComplete: () => {
                this.levelText.text = message;
                if (!success) {
                    this.gameOver();
                } else {
                    this.time.addEvent({
                        delay: 1000,
                        callback: () => {
                            if (this.square['successful'] == saveData.level) {
                                saveData.level++;
                                localStorage.setItem(gameOptions.localStorageName, JSON.stringify({
                                    level: saveData.level
                                }));
                                this.scene.start('playGame');
                            } else {
                                this.squareText.text = (saveData.level - this.square['successful']).toString();
                                this.squareText.setOrigin(1, 1);
                                this.levelText.text = 'level ' + (saveData.level).toString();
                                this.updateLevel();
                            }
                        },
                        callbackScope: this
                    });
                }
            }
        });
    }

    addInfo(holeWidth: number, wallWidth: number): void {
        this.infoGroup = this.add.group();
        let targetSquare = this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) - this.leftSquare.displayHeight, 'square');
        targetSquare.displayWidth = holeWidth + wallWidth;
        targetSquare.displayHeight = holeWidth + wallWidth;
        targetSquare.alpha = 0.3;
        targetSquare.setOrigin(0.5, 1);
        this.infoGroup.add(targetSquare);
        let targetText = this.add.bitmapText(Number(this.game.config.width) / 2, targetSquare.y - targetSquare.displayHeight - 20, 'font', 'land here', 48);
        targetText.setOrigin(0.5, 1);
        this.infoGroup.add(targetText);
        let holdText = this.add.bitmapText(Number(this.game.config.width) / 2, 250, 'font', 'tap and hold to grow', 40);
        holdText.setOrigin(0.5, 0);
        this.infoGroup.add(holdText);
        let releaseText = this.add.bitmapText(Number(this.game.config.width) / 2, 300, 'font', 'release to drop', 40);
        releaseText.setOrigin(0.5, 0);
        this.infoGroup.add(releaseText);
    }

    gameOver(): void {
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.scene.start('playGame');
            },
            callbackScope: this
        });
    }
}
