import Phaser from 'phaser';

export const gameOptions = {
    // game width
    gameWidth: 640,
    // game height
    gameHeight: 960,
    // number of segments which build the tail
    tailSegments: 300,
    // lenght of each segment
    segmentLength: 2,
    // number of levels. Useful to preload each level PNGs
    levels: 3,
    // current level
    currentLevel: 1
}

export let gameLevels = [
    {
        startSpot: {
            x: 320,
            y: 120
        },
        endSpot: {
            x: 320,
            y: 840
        }
    },
    {
        startSpot: {
            x: 80,
            y: 80
        },
        endSpot: {
            x: 280,
            y: 80
        }
    },
    {
        startSpot: {
            x: 80,
            y: 830
        },
        endSpot: {
            x: 80,
            y: 130
        }
    }
]

export class playGame extends Phaser.Scene {
    startSpot: Phaser.GameObjects.Sprite;
    endSpot: Phaser.GameObjects.Sprite;
    firstInput: boolean;
    canDrag: boolean;
    canvas: Phaser.GameObjects.Graphics;
    segments: any[];
    gameOver: boolean;
    consumeString: boolean;
    constructor() {
        super('playGame');
    }

    preload(): void {
        // preloading all level images, PNG images with transparency
        for (let i = 1; i <= gameLevels.length; i++) {
            this.load.image('level' + i, 'assets/sprites/level' + i + '.png');
        }

        // preloading game icons as spritesheet
        this.load.spritesheet('icons', 'assets/sprites/icons.png', {
            frameWidth: 80,
            frameHeight: 80
        });
    }

    create(): void {
        // creation of a graphic object without adding it to the game
        let background = this.make.graphics({
            x: 0,
            y: 0,
            add: false
        });
        // we are going to create a gradient background, that is a series of retangles filled with different color
        let gradientSteps = Number(this.game.config.height) / 2;
        // determining rectangle height according to game height and gradient steps
        let rectangleHeight = Math.floor(Number(this.game.config.height) / gradientSteps);
        // looping through all gradient steps
        for (let i = 0; i <= gradientSteps; i++) {
            let color = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor('0x0e2be3'), Phaser.Display.Color.ValueToColor('0xa6e1ff'), gradientSteps, i);
            background.fillStyle(Number(Phaser.Display.Color.RGBToString(Math.round(color.r), Math.round(color.g), Math.round(color.b), 0, '0x')));
            background.fillRect(0, rectangleHeight * i, Number(this.game.config.width), rectangleHeight);
        }
        /**
         *  이 Graphics 객체에서 텍스처를 생성합니다.
            키가 문자열이면이를 사용하여 새 텍스처를 생성하고 텍스처 관리자에 추가합니다 (키 충돌이 발생하지 않는다고 가정).
            키가 Canvas이면 해당 캔버스 컨텍스트에 텍스처를 그립니다. WebGL 모드에서는 GPU에 자동으로 업로드되지 않습니다.
            텍스처는 브라우저의 Canvas API를 통해 생성되므로 fillGradientStyle과 같은 일부 그래픽 기능은 Canvas API에서 지원하지 않으므로 결과 텍스처에 표시되지 않습니다.
            @param 키 — 텍스처 관리자에서 텍스처를 저장할 키 또는 그릴 캔버스입니다.
            @param width — 생성 할 그래픽의 너비입니다.
            @param height — 생성 할 그래픽의 높이입니다.
         */
        background.generateTexture('gradient', Number(this.game.config.width), Number(this.game.config.height));
        background.destroy();
        this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'gradient');
        this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'level', gameOptions.currentLevel);

        let levelObject = gameLevels[gameOptions.currentLevel - 1];
        this.startSpot = this.add.sprite(levelObject.startSpot.x, levelObject.startSpot.y, 'icons', 0);
        this.endSpot = this.add.sprite(levelObject.endSpot.x, levelObject.endSpot.y, 'icons', 1);

        this.firstInput = true;
        this.canDrag = false;

        this.input.on('pointerdown', this.startMoving, this);
        this.input.on('pointermove', this.dragString, this);
        this.input.on('pointerup', this.stopMoving, this);

        this.canvas = this.add.graphics({ x: 0, y: 0 });
        this.segments = [];
        this.gameOver = false;
        this.consumeString = false;
    }

    startMoving(e): void {}

    moveString(x, y): void {}

    dragString(e): void {}

    renderString(): void {}

    update(): void {}

    stopMoving(e): void {}
}