import Phaser from 'phaser';
import {gameOptions} from './downOptions';

export default class playGame extends Phaser.Scene {

    playerMove!: boolean;
    playerCol!: number;
    playerRow!: number;
    hexagonContainer!: Phaser.GameObjects.Container;
    marker!: Phaser.GameObjects.Sprite;

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
        this.hexagonContainer = this.add.container();
        for (let i = 0; i < gameOptions.gridSizeY; i++) {
            this.addHexagonRow(i);
        }
        this.hexagonContainer.x = (Number(this.game.config.width) - gameOptions.hexagonWidth * gameOptions.gridSizeX) / 2;
        this.hexagonContainer.y = 20;
        this.marker = this.add.sprite(gameOptions.hexagonWidth * gameOptions.gridSizeX / 2, 6, 'marker');
        this.hexagonContainer.add(this.marker);
        this.input.on('pointerdown', (e) => {
            if (this.playerMove) {
                if (e.x < (Number(this.game.config.width) / 2) && (this.playerCol > 0 || (this.playerRow % 2 == 1))) {
                    this.placeMarker(this.playerCol - (1 - this.playerRow % 2), this.playerRow + 1);
                    this.marker.setFrame(0);
                }
                if (e.x >= (Number(this.game.config.width) / 2) && this.playerCol < gameOptions.gridSizeX - 1) {
                    this.placeMarker(this.playerCol + (this.playerRow % 2), this.playerRow + 1);
                    this.marker.setFrame(1);
                }
            }
        });
    }

    update() {
        let playerPosition = this.marker.y + this.hexagonContainer.y;
        if (playerPosition > 60) {
            let distance = 60 - playerPosition;
            this.hexagonContainer.y += distance / 25;
        }
        for (let i = 0; i < this.hexagonContainer.list.length; i++) {
            let blockPosition = this.hexagonContainer.list[i].y + this.hexagonContainer.y;
            if (blockPosition < -gameOptions.hexagonHeight) {
                this.hexagonContainer.list[i].y += gameOptions.hexagonHeight * (gameOptions.gridSizeY * 3 / 4);
            }
        }
    }

    addHexagonRow(i: number) {
        for (let j = 0; j < gameOptions.gridSizeX - i % 2; j++) {
            let singleHexagonContainer = this.add.container();
            let hexagonX = gameOptions.hexagonWidth * j + (gameOptions.hexagonWidth / 2) * (i % 2);
            let hexagonY = gameOptions.hexagonHeight * i / 4 * 3;
            singleHexagonContainer.x = hexagonX;
            singleHexagonContainer.y = hexagonY;
            let hexagon = this.add.sprite(0, 0, 'hexagon');
            hexagon.setOrigin(0, 0);
            singleHexagonContainer.add(hexagon);
            let hexagonText = this.add.text(gameOptions.hexagonWidth / 3, gameOptions.hexagonHeight / 5, i + ',' + j, {
                color: '#000000'
            });
            singleHexagonContainer.add(hexagonText);
            this.hexagonContainer.add(singleHexagonContainer);
        }
    }

    placeMarker(posX:number, posY:number) {
        this.playerRow = posY;
        this.playerCol = posX;
        let nextX = gameOptions.hexagonWidth * (2 * posX + 1 + posY % 2) / 2;
        let netxY = gameOptions.hexagonHeight * (3 * posY + 1) / 4 - 14;
        this.playerMove = false;
        let bezierX = gameOptions.hexagonWidth;
        if (this.marker.x > nextX) {
            bezierX *= -1;
        }
        this.tweens.add({
            targets: [this.marker],
            x: nextX,
            y: netxY,
            duration: 100,
            callbackScopr: this,
            onComplete: () => {
                this.playerMove = true;
            }
        });
    }
}