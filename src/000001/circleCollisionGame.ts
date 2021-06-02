import Phaser, { GameObjects } from 'phaser';

const gameOptions = {
    circleRadius: 50
}

export default class playGame extends Phaser.Scene {
    graphics!: Phaser.GameObjects.Graphics;
    circleCenter!: Phaser.GameObjects.Sprite;
    segmentStart!: Phaser.GameObjects.Sprite;
    segmentEnd!: Phaser.GameObjects.Sprite;
    distancePoint!: Phaser.GameObjects.Sprite;
    text!: Phaser.GameObjects.Text;
    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.image('crosshair', 'crosshair.png');
    }

    create() {
        let game = this.game;
        this.graphics = this.add.graphics();
        this.circleCenter = this.add.sprite(Phaser.Math.Between(50, Number(game.config.width) - 50), Phaser.Math.Between(50, Number(game.config.height) - 50), 'crosshair');
        this.circleCenter.setInteractive();
        this.segmentStart = this.add.sprite(Phaser.Math.Between(20, Number(game.config.width) - 20), Phaser.Math.Between(20, Number(game.config.height) - 20), 'crosshair');
        this.segmentStart.setInteractive();
        this.segmentEnd = this.add.sprite(Phaser.Math.Between(20, Number(game.config.width) - 20), Phaser.Math.Between(20, Number(game.config.height) - 20), 'crosshair');
        this.segmentEnd.setInteractive();
        this.input.setDraggable([this.circleCenter, this.segmentStart, this.segmentEnd]);
        this.distancePoint = this.add.sprite(0, 0, 'crosshair');
        this.text = this.add.text(0, 0, '', {
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        this.drawStuff();
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
            this.drawStuff();
        });
    }

    drawStuff() {
        this.graphics.clear();
        if (this.distToSegmentSquared({
            x: this.circleCenter.x,
            y: this.circleCenter.y
        }, gameOptions.circleRadius, {
            x: this.segmentStart.x,
            y: this.segmentStart.y
        }, {
            x: this.segmentEnd.x,
            y: this.segmentEnd.y
        })) {
            this.graphics.lineStyle(2, 0x880000);
        } else {
            this.graphics.lineStyle(2, 0x008800);
        }
        this.graphics.strokeCircle(this.circleCenter.x, this.circleCenter.y, gameOptions.circleRadius);
        this.graphics.lineStyle(2, 0x008800);
        this.graphics.beginPath();
        this.graphics.moveTo(this.segmentStart.x, this.segmentStart.y);
        this.graphics.lineTo(this.segmentEnd.x, this.segmentEnd.y);
        this.graphics.closePath();
        this.graphics.strokePath();
        this.graphics.lineStyle(2, 0x888800);
        this.graphics.beginPath();
        this.graphics.moveTo(this.distancePoint.x, this.distancePoint.y);
        this.graphics.lineTo(this.circleCenter.x, this.circleCenter.y);
        this.graphics.closePath();
        this.graphics.strokePath();
        this.text.setText('Segment: (' + this.segmentStart.x + ', ' + this.segmentStart.y +') to (' + this.segmentEnd.x + ', ' + this.segmentEnd.y +')\nCircle center: (' + this.circleCenter.x + ', ' + this.circleCenter.y +')\nPoint to watch: (' + this.distancePoint.x + ', ' + this.distancePoint.y +')');
    }

    getDistance(p1, p2) {
        return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
    }

    distToSegmentSquared(circleCenter:{x: number, y: number}, circleRadius: number, segmentStart:{x: number, y: number}, segmentEnd:{x: number, y: number}) {
        let l2 = this.getDistance(segmentStart, segmentEnd);
        let t = ((circleCenter.x - segmentStart.x) * (segmentEnd.x - segmentStart.x) + (circleCenter.y - segmentStart.y) * (segmentEnd.y - segmentStart.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        let tX = segmentStart.x + t * (segmentEnd.x - segmentStart.x);
        let tY = segmentStart.y + t * (segmentEnd.y - segmentStart.y);
        let tPoint = {
            x: tX,
            y: tY
        }
        this.distancePoint.x = Math.round(tX);
        this.distancePoint.y =  Math.round(tY);
        return this.getDistance(circleCenter, tPoint) < circleRadius * circleRadius;
    }
}