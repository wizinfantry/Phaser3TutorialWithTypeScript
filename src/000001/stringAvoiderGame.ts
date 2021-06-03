/**
 *  type: Phaser.WEBGL,
	backgroundColor: 'black',
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: 640,
		height: 960,
	},
	render: {
		pixelArt: true,
		roundPixels: true
	},
	physics: {
		default: 'arcade',
		arcade: {
			debug: false
		}
	},
	scene: [playGame],
 */
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
    segments: Phaser.Math.Vector2[];
    gameOver: boolean;
    consumeString: boolean;
    startPosition: Phaser.Math.Vector2;
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
        this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 2, 'level' + gameOptions.currentLevel);

        let levelObject = gameLevels[gameOptions.currentLevel - 1];
        this.startSpot = this.add.sprite(levelObject.startSpot.x, levelObject.startSpot.y, 'icons', 0);
        this.endSpot = this.add.sprite(levelObject.endSpot.x, levelObject.endSpot.y, 'icons', 1);

        this.firstInput = true;
        this.canDrag = false;

        /**
         * The Pointer Down Input Event.
         * This event is dispatched by the Input Plugin belonging to a Scene if a pointer is pressed down anywhere.
         * Listen to this event from within a Scene using: `this.input.on('pointerdown', listener)`.
         * The event hierarchy is as follows:
         * 1. [GAMEOBJECT_POINTER_DOWN]{@linkcode Phaser.Input.Events#event:GAMEOBJECT_POINTER_DOWN}
         * 2. [GAMEOBJECT_DOWN]{@linkcode Phaser.Input.Events#event:GAMEOBJECT_DOWN}
         * 3. [POINTER_DOWN]{@linkcode Phaser.Input.Events#event:POINTER_DOWN} or [POINTER_DOWN_OUTSIDE]{@linkcode Phaser.Input.Events#event:POINTER_DOWN_OUTSIDE}
         * With the top event being dispatched first and then flowing down the list. Note that higher-up event handlers can stop
         * the propagation of this event.
         */
        this.input.on('pointerdown', this.startMoving, this);

        /**
         * The Pointer Move Input Event.
         * This event is dispatched by the Input Plugin belonging to a Scene if a pointer is moved anywhere.
         * Listen to this event from within a Scene using: `this.input.on('pointermove', listener)`.
         * The event hierarchy is as follows:
         * 1. [GAMEOBJECT_POINTER_MOVE]{@linkcode Phaser.Input.Events#event:GAMEOBJECT_POINTER_MOVE}
         * 2. [GAMEOBJECT_MOVE]{@linkcode Phaser.Input.Events#event:GAMEOBJECT_MOVE}
         * 3. [POINTER_MOVE]{@linkcode Phaser.Input.Events#event:POINTER_MOVE}
         * With the top event being dispatched first and then flowing down the list. Note that higher-up event handlers can stop
         * the propagation of this event.
         */
        this.input.on('pointermove', this.dragString, this);

        /**
         * The Pointer Up Input Event.
         * This event is dispatched by the Input Plugin belonging to a Scene if a pointer is released anywhere.
         * Listen to this event from within a Scene using: `this.input.on('pointerup', listener)`.
         * The event hierarchy is as follows:
         * 1. [GAMEOBJECT_POINTER_UP]{@linkcode Phaser.Input.Events#event:GAMEOBJECT_POINTER_UP}
         * 2. [GAMEOBJECT_UP]{@linkcode Phaser.Input.Events#event:GAMEOBJECT_UP}
         * 3. [POINTER_UP]{@linkcode Phaser.Input.Events#event:POINTER_UP} or [POINTER_UP_OUTSIDE]{@linkcode Phaser.Input.Events#event:POINTER_UP_OUTSIDE}
         * With the top event being dispatched first and then flowing down the list. Note that higher-up event handlers can stop
         * the propagation of this event.
         */
        this.input.on('pointerup', this.stopMoving, this);

        this.canvas = this.add.graphics({ x: 0, y: 0 });
        this.segments = [];
        this.gameOver = false;
        this.consumeString = false;
    }

    /**
     * startMoving 메서드는 플레이어가 캔버스를 터치 / 클릭 할 때마다 호출됩니다.
     * @param e Phaser.Input.Pointer
     */
    startMoving(e: Phaser.Input.Pointer): void {
        if (!this.gameOver) {
            this.canDrag = true;
            // 첫 번째 입력인지 확인 : 플레이어가 캔버스를 처음으로 클릭 / 터치합니다.
            if (this.firstInput) {
                // 더 이상 첫 번째 입력이 아닙니다.
                this.firstInput = false;
                // makeing start icon invisible
                this.startSpot.visible = false;
                // "gameOptions.tailSegments" Phaser Vector2 객체의 양으로 세그먼트 배열 채우기
                for (let i = 0; i < gameOptions.tailSegments; i++) {
                    // 처음에는 문자열이 원이되기를 원하므로 작은 삼각법을 사용하여이 점을 적절하게 배치합니다.
                    let radians = 12 * Math.PI * 1 / gameOptions.tailSegments + Math.PI / 4;
                    // Vector2 객체를 만들고 세그먼트 배열에 배치합니다. "10"은 원의 반지름입니다.
                    this.segments[i] = new Phaser.Math.Vector2(this.startSpot.x + 10 * Math.cos(radians), this.startSpot.y + 10 * Math.sin(radians));
                }
                // moveString 함수를 호출합니다. 실제로이 함수는 문자열을 이동하고 렌더링하며, 두 인수는 각각 문자열의 머리에 적용 할 x 및 y 이동을 나타냅니다.
                // 아직 움직임이 없기 때문에 0으로 설정했습니다.
                this.moveString(0, 0);
            }
            // 현재 이벤트 위치 저장, 즉 플레이어가 현재 터치 / 클릭하는 위치
            this.startPosition = e.position;
        }
    }

    /**
     * moveString method updates and renders the string
     * @param x number
     * @param y number
     */
    moveString(x: number, y: number): void {
        // the head of the string is current input position
        let head = new Phaser.Math.Vector2(this.segments[0].x + x, this.segments[0].y + y);
        // the first segment is the head itself
        this.segments[0] = new Phaser.Math.Vector2(head.x, head.y);
        // renders the string and checks for game over
        this.gameOver = this.renderString();

        // if it's game over or the head of the string is fairly inside the end spot.....
        if (this.segments[0].distance(new Phaser.Math.Vector2(this.endSpot.x, this.endSpot.y)) < this.endSpot.width / 4 || this.gameOver) {
            // can't drag anymore
            this.canDrag = false;
            // if it's not game over, this means the player solved the level and we consume the string
            if (!this.gameOver) {
                this.consumeString = true;
            }
            // wait 2 sec before restarting the game.
            this.time.addEvent({
                delay: 2000,
                callbackScope: this,
                callback: () => {
                    // if it's not game over, this means the player solved the level so we move on to next level
                    if (!this.gameOver) {
                        gameOptions.currentLevel = (gameOptions.currentLevel % gameLevels.length) + 1;
                    }
                    this.scene.start('playGame');
                }
            })
        }

    }

    /**
     * dragString method is called when the player moves the finger or the mouse while keeping mouse button pressed
     * @param e Phaser.Input.Pointer
     */
    dragString(e: Phaser.Input.Pointer): void {
        // if the player can drag
        if (this.canDrag) {
            // moveString 함수를 호출합니다.
            // 실제로 이 함수는 문자열을 이동하고 렌더링하며, 두 인수는 각각 문자열의 머리에 적용 할 x 및 y 이동을 나타냅니다.
            // 현재 입력 위치와 이전 입력 위치로부터의 거리를 나타내도록 설정합니다.
            this.moveString(e.position.x - this.startPosition.x, e.position.y - this.startPosition.y);
            // updating startPosition variable
            this.startPosition = new Phaser.Math.Vector2(e.position.x, e.position.y);
        }
    }

    /**
     * method to render the string, returns true if the string collided with maze
     * @returns boolean
     */
    renderString(): boolean {
        // did the string collide?
        let collided = false;
        // clearing the canvas, ready to be redrawn
        this.canvas.clear();
        // only draw if there's something to draw
        if (this.segments.length > 0) {
            // setting line style to a 4 pixel thick line, black, 100% opaque
            this.canvas.lineStyle(4, 0x000000, 1);
            // placing the pen on the head
            this.canvas.moveTo(this.segments[0].x, this.segments[0].y);
            // looping through all segments starting fomr the second one
            for (let i = 1; i < this.segments.length - 1; i++) {
                // determining the angle between current segment and previous segment
                let nodeAngle = Math.atan2(this.segments[i].y - this.segments[i - 1].y, this.segments[i].x - this.segments[i - 1].x);
                // calculating new segment position according to previous segment position and the angle
                this.segments[i] = new Phaser.Math.Vector2(this.segments[i - 1].x + gameOptions.segmentLength * Math.cos(nodeAngle), this.segments[i - 1].y + gameOptions.segmentLength * Math.sin(nodeAngle));
                // getting the transparency behind the segment
                let alpha = this.textures.getPixelAlpha(Math.round(this.segments[i].x), Math.round(this.segments[i].y), 'level' + gameOptions.currentLevel);
                // if the color alpha is different than zero, that is it's not a transparent pixel....
                if (alpha != 0) {
                    // from now on, draw thestring in red
                    this.canvas.lineStyle(4, 0xff0000, 1);
                    // collision...
                    collided = true;
                }
                // drawing the segment
                this.canvas.lineTo(this.segments[i].x, this.segments[i].y);
                this.canvas.moveTo(this.segments[i].x, this.segments[i].y);
            }
            this.canvas.strokePath();
        }
        return collided;
    }

    /**
     * method to be executed at each frame
     */
    update(): void {
        // if we need to consume the string...
        if (this.consumeString) {
            // if there are more than 5 segments
            if (this.segments.length >= 5) {
                // remove the latest 5 segments
                this.segments.length = this.segments.length - 5;
            } else {
                this.segments.length = 0;
            }
            // then render the string
            this.renderString();
        }
    }

    /**
     * stopMoving method, the player cannot drag anymore
     * @param e Phaser.Input.Pointer
     */
    stopMoving(e: Phaser.Input.Pointer): void {
        this.canDrag = false;
    }
}