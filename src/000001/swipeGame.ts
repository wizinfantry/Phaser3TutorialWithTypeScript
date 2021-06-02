import Phaser from 'phaser';
import {gameOptions} from './swipeOptions';

interface ThumbImage {
    image: Phaser.GameObjects.Image,
    levelNumber: number
}

export default class playGame extends Phaser.Scene {
    private stars!: string[];
    private canMove!: boolean;
    private savedData!: string | null;
    private pageText!: Phaser.GameObjects.Text;
    private scrollingMap!: Phaser.GameObjects.TileSprite;
    private currentPage!: number;
    private itemGroup!: Phaser.GameObjects.Group;
    private pageSelectors!: Phaser.GameObjects.Sprite[];

    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.spritesheet('levelthumb', 'levelthumb.png', {
            frameWidth: 60,
            frameHeight: 80
        });
        this.load.image('levelpages', 'levelpages.png');
        this.load.image('transp', 'transp.png');
    }

    create(): void {
        this.stars = [];
        this.stars[0] = '0';
        this.canMove = true;
        this.itemGroup = this.add.group();
        for (let l = 1; l < gameOptions.columns * gameOptions.rows * gameOptions.colors.length; l++) {
            this.stars[l] = '-1';
        }
        this.savedData = localStorage.getItem(gameOptions.localStorageName) == null ? this.stars.toString() : localStorage.getItem(gameOptions.localStorageName);
        if (this.savedData !== null) {
            this.stars = this.savedData.split(',');
            console.log(this.stars);
        }
        this.pageText = this.add.text(Number(this.game.config.width) / 2, 16, 'Swipe to select level page (1 / ' + gameOptions.colors.length + ')', {
            font: '18px Arial',
            align: 'center'
        });
        this.pageText.setStyle({fill: '#ffffff'});
        this.pageText.setOrigin(0.5);
        this.scrollingMap = this.add.tileSprite(0, 0, gameOptions.colors.length * Number(this.game.config.width), Number(this.game.config.height), 'transp');
        this.scrollingMap.setInteractive();
        this.input.setDraggable(this.scrollingMap);
        this.scrollingMap.setOrigin(0, 0);
        this.currentPage = 0;
        this.pageSelectors = [];
        var rowLength = gameOptions.thumbWidth * gameOptions.columns + gameOptions.spacing * (gameOptions.columns - 1);
        var leftMargin = (Number(this.game.config.width) - rowLength) / 2 + gameOptions.thumbWidth / 2;
        var colHeight = gameOptions.thumbHeight * gameOptions.rows + gameOptions.spacing * (gameOptions.rows - 1);
        var topMargin = (Number(this.game.config.height) - colHeight) / 2 + gameOptions.thumbHeight / 2;
        for (let k = 0; k < gameOptions.colors.length; k++) {
            for(let i = 0; i < gameOptions.columns; i++){
                for(let j = 0; j < gameOptions.rows; j++){
                    let thumb:ThumbImage = {image : this.add.image(k * Number(this.game.config.width) + leftMargin + i * (gameOptions.thumbWidth + gameOptions.spacing), topMargin + j * (gameOptions.thumbHeight + gameOptions.spacing), 'levelthumb'), levelNumber: 0 };
                    thumb.image.setTint(Number(gameOptions.colors[k]));
                    thumb.levelNumber = k * (gameOptions.rows * gameOptions.columns) + j * gameOptions.columns + i;
                    thumb.image.setFrame(parseInt(this.stars[thumb.levelNumber]) + 1);
                    this.itemGroup.add(thumb.image);
                    console.log(thumb.levelNumber);
                    let levelText = this.add.text(thumb.image.x, thumb.image.y - 12, String(thumb.levelNumber), {
                        font: '24px Arial',
                    });
                    levelText.setStyle({fill: '#000000'});
                    levelText.setOrigin(0.5);
                    this.itemGroup.add(levelText);
                }
                this.pageSelectors[k] = this.add.sprite(Number(this.game.config.width) / 2 + (k - Math.floor(gameOptions.colors.length / 2) + 0.5 * (1 - gameOptions.colors.length % 2)) * 40, Number(this.game.config.height) - 40, 'levelpages');
                this.pageSelectors[k].setInteractive();
            }
        }

    }
}


/**
 * var gameConfig = {
        width: 320,
        height: 480,
        backgroundColor: 0x222222,
        scene: [playGame, playLevel]
    }
 */
