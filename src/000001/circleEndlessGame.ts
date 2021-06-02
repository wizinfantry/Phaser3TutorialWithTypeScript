import Phaser from 'phaser';
import {gameOptions} from './circleEndlessOptios';


class TPlayer extends Phaser.GameObjects.Sprite {
    public currentAngle!: number;
    public jumpOffset!: number;
    public jumps!: number;
    public jumpForce!: number;
    // constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number | undefined) {
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture) {
        super(scene, x, y, texture);
    }
}

class TSpike extends Phaser.GameObjects.Sprite {
    public quadrant!: number;
    public top!: Phaser.Math.Vector2;
    public base1!: Phaser.Math.Vector2;
    public base2!: Phaser.Math.Vector2;
    public approaching!: boolean;
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string | Phaser.Textures.Texture, frame?: string | number | undefined) {
        super(scene, x, y, texture);
    }
}

export default class playGame extends Phaser.Scene {
    private graphics!: Phaser.GameObjects.Graphics;
    private bigCircle!: Phaser.GameObjects.Sprite;
    private player!: TPlayer;
    private spikeGroup!: Phaser.GameObjects.Group;
    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.image('bigcircle', 'bigcircle.png');
        this.load.image('player', 'player.png');
        this.load.image('spike', 'spike.png');
    }

    create() {
        this.graphics = this.add.graphics();
        this.bigCircle = this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'bigcircle');
        this.bigCircle.displayWidth = gameOptions.bigCircleRadius * 2;
        this.bigCircle.displayHeight = gameOptions.bigCircleRadius * 2;
        this.player = new TPlayer(this, Number(this.game.config.width) / 2, Number(this.game.config.height) / 2 - gameOptions.bigCircleRadius - gameOptions.playerRadius, 'player');
        this.add.existing(this.player);
        this.player.displayWidth = gameOptions.playerRadius * 2;
        this.player.displayHeight = gameOptions.playerRadius * 2;
        this.player.currentAngle = -90;
        this.player.jumpOffset = 0;
        this.player.jumps = 0;
        this.player.jumpForce = 0;
        this.spikeGroup = this.add.group();
        this.input.on('pointerdown', (e) => {
            if (this.player.jumps < 2) {
                this.player.jumps++;
                this.player.jumpForce = gameOptions.jumpForce[this.player.jumps - 1];
            }
        }, this);
        for (let i = 0; i < 6; i++) {
            let spike = new TSpike(this, 0, 0, 'spike');
            this.add.existing(spike);
            spike.setOrigin(0, 0.5);
            this.spikeGroup.add(spike);
            this.placeSpike(spike, Math.floor(i / 2));
        }
    }

    placeSpike(spike: TSpike, quadrant: number): void {
        let randomAngle = Phaser.Math.Between(quadrant * 90, (quadrant + 1) * 90);
        randomAngle = Phaser.Math.Angle.WrapDegrees(randomAngle);
        let randomAngleRadians = Phaser.Math.DegToRad(randomAngle);
        let spikeX = this.bigCircle.x + (gameOptions.bigCircleRadius - 4) * Math.cos(randomAngleRadians);
        let spikeY = this.bigCircle.y + (gameOptions.bigCircleRadius - 4) * Math.sin(randomAngleRadians);
        spike.x = spikeX;
        spike.y = spikeY;
        spike.quadrant = quadrant;
        spike.angle = randomAngle;
        spike.top = new Phaser.Math.Vector2(spikeX + gameOptions.spikeSize[1] * Math.cos(randomAngleRadians), spikeY + gameOptions.spikeSize[1] * Math.sin(randomAngleRadians));
        spike.base1 = new Phaser.Math.Vector2(spikeX + gameOptions.spikeSize[0] / 2 * Math.cos(randomAngleRadians + Math.PI / 2), spikeY + gameOptions.spikeSize[0] / 2 * Math.sin(randomAngleRadians + Math.PI / 2));
        spike.base2 = new Phaser.Math.Vector2(spikeX + gameOptions.spikeSize[0] / 2 * Math.cos(randomAngleRadians - Math.PI / 2), spikeY + gameOptions.spikeSize[0] / 2 * Math.sin(randomAngleRadians - Math.PI / 2));
        spike.approaching = false;
    }

    update(): void {
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
        let distanceFromCenter = (gameOptions.bigCircleRadius * 2 + gameOptions.playerRadius * 2) / 2 + this.player.jumpOffset;
        this.player.x = this.bigCircle.x + distanceFromCenter * Math.cos(radians);
        this.player.y = this.bigCircle.y + distanceFromCenter * Math.sin(radians);
        let revolutions = (gameOptions.bigCircleRadius * 2) / (gameOptions.playerRadius * 2) + 1;
        this.player.angle = this.player.currentAngle * revolutions;
        this.graphics.clear();
        this.spikeGroup.children.iterate((child: Phaser.GameObjects.GameObject) => {
            let spike = <TSpike>child;
            let angleDiff = this.getAngleDifference(spike.angle, this.player.currentAngle);
            if (!spike.approaching && angleDiff < gameOptions.closeToSpike) {
                spike.approaching = true;
            }
            if (spike.approaching) {
                this.graphics.lineStyle(4, 0xff0000);
                this.graphics.beginPath();
                this.graphics.moveTo(spike.top.x, spike.top.y);
                this.graphics.lineTo(spike.base1.x, spike.base1.y);
                this.graphics.closePath();
                this.graphics.strokePath();
                this.graphics.beginPath();
                this.graphics.moveTo(spike.top.x, spike.top.y);
                this.graphics.lineTo(spike.base2.x, spike.base2.y);
                this.graphics.closePath();
                this.graphics.strokePath();
                if (this.distToSegmentSquared(new Phaser.Math.Vector2(this.player.x, this.player.y), gameOptions.playerRadius, spike.top, spike.base1) || this.distToSegmentSquared(new Phaser.Math.Vector2(this.player.x, this.player.y), gameOptions.playerRadius, spike.top, spike.base2)) {
                    this.scene.start('playGame');
                }
                if(angleDiff > gameOptions.farFromSpike){
                    this.placeSpike(spike, (spike.quadrant + 3) % 4);
                }
            }
        }, this);
    }

    getAngleDifference(a1: number, a2:number): number {
        let angleDifference = a1 - a2;
        angleDifference += (angleDifference > 180) ? -360 : (angleDifference < -180) ? 360 : 0;
        return Math.abs(angleDifference);
    }

    getDistance(p1:Phaser.Math.Vector2, p2:Phaser.Math.Vector2): number {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }

    distToSegmentSquared(circleCenter: Phaser.Math.Vector2, circleRadius: number, segmentStart: Phaser.Math.Vector2, segmentEnd: Phaser.Math.Vector2): boolean {
        var l2 = this.getDistance(segmentStart, segmentEnd);
        var t = ((circleCenter.x - segmentStart.x) * (segmentEnd.x - segmentStart.x) + (circleCenter.y - segmentStart.y) * (segmentEnd.y - segmentStart.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        var tX = segmentStart.x + t * (segmentEnd.x - segmentStart.x);
        var tY = segmentStart.y + t * (segmentEnd.y - segmentStart.y);
        var tPoint = {
            x: tX,
            y: tY
        }
        return this.getDistance(circleCenter, <Phaser.Math.Vector2>tPoint) < circleRadius * circleRadius;
    }
}

/**
 * window.onload = function() {
    var gameConfig = {
        thpe: Phaser.CANVAS,
        width: 800,
        height: 800,
        scene: [playGame]
    }
    game = new Phaser.Game(gameConfig);
    window.focus()
    resize();
    window.addEventListener("resize", resize, false);
}
 */