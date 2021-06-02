import Phaser from 'phaser';
import {gameOptions} from './gameOptions';

export class playGame extends Phaser.Scene {

    wheel!: Phaser.GameObjects.Sprite;
    pin!: Phaser.GameObjects.Sprite;
    prizeText!: Phaser.GameObjects.Text;
    canSpin!: boolean;

    constructor() {
        super('playGame');
    }

    preload() {
        this.load.image('pin', 'image/pin.png');
    }

    create() {
        let sliceDegrees = 360 / gameOptions.slices.length;
        let graphics = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });

        for (let i = 0; i < gameOptions.slices.length; i++) {
            let startColor = Phaser.Display.Color.ValueToColor(gameOptions.slices[i].startColor);
            let endColor = Phaser.Display.Color.ValueToColor(gameOptions.slices[i].endColor);
            for (let j = gameOptions.slices[i].rings; j > 0; j--) {
                 // interpolate colors
                 let ringColor = Phaser.Display.Color.Interpolate.ColorWithColor(startColor,endColor, gameOptions.slices[i].rings, j);
                 // converting the interpolated color to 0xRRGGBB format
                 let ringColorString = Number(Phaser.Display.Color.RGBToString(Math.round(ringColor.r), Math.round(ringColor.g), Math.round(ringColor.b), 0, "0x"));
                 // setting fill style
                 graphics.fillStyle(ringColorString, 1);
                 // drawing the slice
                 graphics.slice(gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius + gameOptions.strokeWidth, j * gameOptions.wheelRadius / gameOptions.slices[i].rings, Phaser.Math.DegToRad(270 + i * sliceDegrees), Phaser.Math.DegToRad(270 + (i  + 1) * sliceDegrees), false);
                 // filling the slice
                 graphics.fillPath();
            }
            // setting line style
            graphics.lineStyle(gameOptions.strokeWidth, gameOptions.strokeColor, 1);
            // drawing the biggest slice
            graphics.slice(gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius + gameOptions.strokeWidth, gameOptions.wheelRadius, Phaser.Math.DegToRad(270 + i * sliceDegrees), Phaser.Math.DegToRad(270 + (i  + 1) * sliceDegrees), false);
            // stroking the slice
            graphics.strokePath();
        }

        // generate a texture called "wheel" from graphics data
        graphics.generateTexture("wheel", (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2, (gameOptions.wheelRadius + gameOptions.strokeWidth) * 2);

        this.wheel = this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'wheel');
        this.pin = this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'pin');
        this.prizeText = this.add.text(Number(this.game.config.width) / 2, Number(this.game.config.height) - 20, 'Spin the wheel', {
            font: 'bold 32px Arial',
            align: 'center',
            color: 'white'
        });
        this.prizeText.setOrigin(0.5);
        this.canSpin = true;
        this.input.on('pointerdown', this.spinWheel, this);
    }

    spinWheel() {
        if (this.canSpin) {
            this.prizeText.setText('');
            let rounds = Phaser.Math.Between(gameOptions.wheelRounds.min, gameOptions.wheelRounds.max);
            let degrees = Phaser.Math.Between(0, 360);
            let backDegrees = Phaser.Math.Between(gameOptions.backSpin.min, gameOptions.backSpin.max);
            let prize = gameOptions.slices.length - 1 - Math.floor((degrees - backDegrees) / (360 / gameOptions.slices.length));
            this.canSpin = false;

            this.tweens.add({
                targets: [this.wheel],
                angle: 360 * rounds + degrees,
                duration: Phaser.Math.Between(gameOptions.rotationTimeRange.min, gameOptions.rotationTimeRange.max),
                ease: 'Cubic.easeIn',
                callbackScope: this,
                onComplete: () => {
                    this.prizeText.setText(gameOptions.slices[prize].text);
                    this.canSpin = true;
                }
            });
        }
    }
}