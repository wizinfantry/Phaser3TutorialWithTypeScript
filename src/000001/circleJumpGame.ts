import Phaser from 'phaser';
import {gameOptions} from './circleJumpOptions';

/**
 * var gameConfig = {
        thpe: Phaser.CANVAS,
        width: 800,
        height: 800,
        scene: [playGame]
    }
 */

export default class playGame extends Phaser.Scene {
    bigCircle!: Phaser.GameObjects.Sprite;
    player!: Phaser.GameObjects.Sprite | any;
    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.image('bigcircle', 'bigcircle.png');
        this.load.image('player', 'player.png');
    }

    create() {
        this.bigCircle = this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'bigcircle');
        this.bigCircle.displayWidth = gameOptions.bigCircleRadius;
        this.bigCircle.displayHeight = gameOptions.bigCircleRadius;
        this.player = this.add.sprite(Number(this.game.config.width) / 2, (Number(this.game.config.height) - gameOptions.bigCircleRadius - gameOptions.playerRadius) / 2, 'player');
        this.player.displayWidth = gameOptions.playerRadius;
        this.player.displayHeight = gameOptions.playerRadius;
        this.player.currentAngle = -90;
        this.player.jumpOffset = 0;
        this.player.jumps = 0;
        this.player.jumpForce = 0;
        this.input.on('pointerdown', (e) => {
            if(this.player.jumps < 2){
                this.player.jumps ++;
                this.player.jumpForce = gameOptions.jumpForce[this.player.jumps - 1];
            }
        });
    }

    update() {
        if (this.player.jumps > 0) {
            this.player.jumpOffset += this.player.jumpForce;
            this.player.jumpForce -= gameOptions.worldGravity;
            if (this.player.jumpOffset < 0) {
                this.player.jumpOffset = 0;
                this.player.jumps = 0;
                this.player.jumpForce = 0;
            }
        }
        this.player.currentAngle = Phaser.Math.Angle.WrapDegrees(this.player.currentAngle + gameOptions.playerSpeed);
        let radians = Phaser.Math.DegToRad(this.player.currentAngle);
        let distanceFromCenter = (gameOptions.bigCircleRadius + gameOptions.playerRadius) / 2 + this.player.jumpOffset;
        this.player.x = this.bigCircle.x + distanceFromCenter * Math.cos(radians);
        this.player.y = this.bigCircle.y + distanceFromCenter * Math.sin(radians);
        let revolutions = gameOptions.bigCircleRadius / gameOptions.playerRadius + 1;
        this.player.angle = this.player.currentAngle * revolutions;
    }
}