import Phaser from 'phaser';
import {gameOptions} from './downOptions1';

export default class playGame extends Phaser.Scene {
    playerMove!: boolean;
    playerCol!: number;
    playerRow!: number;
    hexagonPool!: never[];
    hexagonGroup!: Phaser.GameObjects.Group;
    marker!: Phaser.GameObjects.Sprite;
    bezierGraphics!: Phaser.GameObjects.Graphics;
    bezierCurve!: Phaser.Curves.CubicBezier;

    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.image('hexagon', 'hexagon.png');
        this.load.spritesheet('marker', 'marker.png', {
            frameWidth: 56,
            frameHeight: 64
        });
    }

    create() {
        this.playerMove = true;
        this.playerCol = 2;
        this.playerRow = 0;
        this.hexagonPool = [];
        this.hexagonGroup = this.add.group();
        for (let i = 0; i < gameOptions.gridSizeY; i++) {
            this.addHexagonRow(i);
        }
        this.marker = this.add.sprite(Number(this.game.config.width) / 2, 6, 'marker');
        this.bezierGraphics = this.add.graphics();
        this.input.on('pointerdown', (e) => {
            if (this.playerMove) {
                if (e.x < (Number(this.game.config.width) / 2) && (this.playerCol > 0 || (this.playerRow % 2 == 1))) {
                    this.playerCol -= (1 - this.playerRow % 2);
                    this.playerRow++;
                    this.marker.setFrame(0);
                    this.movePlayer(-1);
                }
                if (e.x >= (Number(this.game.config.width) / 2) && this.playerCol < gameOptions.gridSizeX - 1) {
                    this.playerCol += (this.playerRow % 2);
                    this.playerRow++;
                    this.marker.setFrame(1);
                    this.movePlayer(1);
                }
            }
        });
    }

    update() {
        if (this.marker.y > 60) {
            let distance = (this.marker.y - 6) / -25;
            Phaser.Actions.IncY(this.hexagonGroup.getChildren(), distance);
            this.marker.y += distance;
            this.bezierGraphics.y += distance;
        }
        this.hexagonGroup.children.iterate((hexagaon) => {
            if (hexagaon.y < -gameOptions.hexagonHeight) {
                hexagaon.y += gameOptions.hexagonHeight * (gameOptions.gridSizeY * 3 / 4);
            }
        });
    }

    addHexagonRow(i: number) {
        let offset = (Number(this.game.config.width) - gameOptions.gridSizeX * gameOptions.hexagonWidth) / 2;
        for (let j = 0; j < gameOptions.gridSizeX - 1 % 2; j++) {
            let hexagonX = gameOptions.hexagonWidth * j + (gameOptions.hexagonWidth / 2) * (i % 2) + offset;
            let hexagonY = gameOptions.hexagonHeight * i / 4 * 3;
            let hexagon = this.add.sprite(hexagonX, hexagonY, 'hexagon');
            hexagon.setOrigin(0, 0);
            this.hexagonGroup.add(hexagon);
        }
    }

    movePlayer(delta: number) {
        let stepX = gameOptions.hexagonWidth / 2 * delta;
        let stepY = gameOptions.hexagonHeight / 4 * 3;
        this.playerMove = false;
        let startPoint = new Phaser.Math.Vector2(this.marker.x, this.marker.y);
        let endPoint = new Phaser.Math.Vector2(this.marker.x + stepX, this.marker.y + stepY);
        let controlPoint1 = new Phaser.Math.Vector2(this.marker.x + stepX, this.marker.y + stepY / 2);
        let controlPoint2 = new Phaser.Math.Vector2(this.marker.x + stepX, this.marker.y + stepY / 2);
        this.bezierCurve = new Phaser.Curves.CubicBezier(startPoint, controlPoint1, controlPoint2, endPoint);
        this.bezierGraphics.y = 0;
        this.bezierGraphics.clear();
        this.bezierGraphics.lineStyle(4, 0xffffff);
        this.bezierCurve.draw(this.bezierGraphics);
        let tweenValue = {
            value: 0,
            previousValue: 0
        };
        this.tweens.add({
            targets: tweenValue,
            value: 1,
            duration: 100 + (Phaser.Math.Between(0, 10) == 10 ? 1000 : 0),
            callbackScope: this,
            onComplete: () => {
                this.playerMove = true;
            },
            onUpdate: (tween, target) => {
                let position = this.bezierCurve.getPoint(target.value);
                let prevPosition = this.bezierCurve.getPoint(target.previousValue);
                this.marker.x += position.x - prevPosition.x;
                this.marker.y += position.y - prevPosition.y;
                target.previousValue = target.value;
            }
        });
    }
}