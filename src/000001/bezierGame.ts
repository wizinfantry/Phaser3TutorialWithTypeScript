import Phaser from 'phaser';

export default class playGame extends Phaser.Scene {
    bezierGraphics!: Phaser.GameObjects.Graphics;
    bezierCurve!: Phaser.Curves.CubicBezier;
    pointsArray!: any[];
    movingPoint!: Phaser.GameObjects.Image;
    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.image('point', 'point.png');
    }

    create () {
        let pointColors = [0x00ff00, 0x008800, 0x880000, 0xff0000];
        this.pointsArray = [];
        this.bezierGraphics = this.add.graphics();
        for (let i = 0; i < 4; i++) {
            let draggablePoint = this.add.image(Phaser.Math.Between(100, Number(this.game.config.width) - 100), Phaser.Math.Between(100, Number(this.game.config.height) - 100), 'point');
            draggablePoint.setTint(pointColors[i]);
            draggablePoint.setInteractive();
            this.pointsArray[i] = draggablePoint;
        }
        this.bezierCurve = new Phaser.Curves.CubicBezier(this.pointsArray[0], this.pointsArray[1], this.pointsArray[2], this.pointsArray[3]);
        this.input.setDraggable(this.pointsArray);
        this.input.on('drag', (pointer, gameObject, posX, posY) => {
            gameObject.x = posX;
            gameObject.y = posY;
            this.drawBezier();
        });
        this.movingPoint = this.add.image(0, 0, 'point');
        this.movingPoint.scaleX = 0.5;
        this.movingPoint.scaleY = 0.5;
        this.drawBezier();
        let tweenObject = {val: 0};
        this.tweens.add({
            targets: tweenObject,
            val: 1,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            callbackScope: this,
            onUpdate: (tween, target) => {
                let position = this.bezierCurve.getPoint(target.val);
                this.movingPoint.x = position.x;
                this.movingPoint.y = position.y;
            }
        });
    }

    drawBezier() {
        this.bezierGraphics.clear();
        this.bezierGraphics.lineStyle(4, 0xffffff);
        this.bezierCurve.draw(this.bezierGraphics);
        this.bezierGraphics.lineStyle(2, 0x00ff00);
        this.bezierGraphics.beginPath();
        this.bezierGraphics.moveTo(this.pointsArray[0].x, this.pointsArray[0].y);
        this.bezierGraphics.lineTo(this.pointsArray[1].x, this.pointsArray[1].y);
        this.bezierGraphics.strokePath();
        this.bezierGraphics.lineStyle(2, 0xff0000);
        this.bezierGraphics.beginPath();
        this.bezierGraphics.moveTo(this.pointsArray[2].x, this.pointsArray[2].y);
        this.bezierGraphics.lineTo(this.pointsArray[3].x, this.pointsArray[3].y);
        this.bezierGraphics.strokePath();
    }
}