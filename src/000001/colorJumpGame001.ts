/**
 *  // render type: let the game decide if CANVAS of WEBGL
    type: Phaser.AUTO,
    // width of the game, in pixels
    width: 750,
    // height of the game, in pixels
    height: 1334,
    // background color (black)
    backgroundColor: 0x000000,
    // scene to play
    scene: playGame,
    // physics settings
    physics: {
        // we are using Matter JS
        default: "matter",
        matter: {
            // gravity settings
            gravity: {
                x: 0,
                y: gameOptions.gravity
            }
        }
    }
 */

import Phaser from 'phaser';

export const gameOptions = {
    // world gravity
    gravity: 4,
    // ball horizontal speed
    ballSpeed: 4,
    // jump force
    jumpForce: 30,
    // amount of bars each wall is divided in
    bars: 4,
    // array with the colors to pick from
    barColors: [0x1abc9c, 0x2980b9, 0x9b59b6, 0xf1c40f, 0xc0392b, 0xecf0f1]
};

const LEFT = 0;
const RIGHT = 1;

export default class playGame extends Phaser.Scene {
    leftWalls!: Phaser.Physics.Matter.Image[];
    rightWalls!: Phaser.Physics.Matter.Image[];
    ball!: Phaser.Physics.Matter.Image;
    coin!: Phaser.Physics.Matter.Image;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('ball', 'ball.png');
        this.load.image('wall', 'wall.png');
        this.load.image('coin', 'coin.png');
    }

    create(): void {
        this.leftWalls = [];
        this.rightWalls = [];

        for (let i = 0; i < gameOptions.bars; i++) {
            this.leftWalls[i] = this.addWall(i, LEFT);
            this.rightWalls[i] = this.addWall(i, RIGHT);
        }

        this.ball = this.matter.add.image(Number(this.game.config.width) / 4, Number(this.game.config.height) / 2, 'ball');
        this.ball.setBody({
            type: 'circle'
        })
        this.coin = this.matter.add.image(0, 0, 'coin', undefined, {
            isSensor: true,
            label: 'coin'
        });
        this.coin.setCircle(this.coin.displayHeight / 2);
        this.coin.setStatic(true);
        this.placeCoin();
        this.ball.setVelocity(gameOptions.ballSpeed, 0);
        this.input.on('pointerdown', this.jump, this);
        this.matter.world.on('collisionstart', (e: MatterJS.IEventCollision<MatterJS.Engine>, b1: MatterJS.BodyType, b2: MatterJS.BodyType) => {
            if (b1.label == 'leftwall' || b2.label == 'leftwall') {
                this.handleWallCollision(LEFT, b1, b2);
            }
            if (b1.label == 'rightwall' || b2.label == 'rightwall') {
                this.handleWallCollision(RIGHT, b1, b2);
            }
            if (b1.label == 'coin' || b2.label == 'coin') {
                this.placeCoin();
            }
        }, this)
    }

    addWall(wallNumber: number, side: number): Phaser.Physics.Matter.Image {
        let wallTexture = this.textures.get('wall');
        let wallHeight = Number(this.game.config.height) / gameOptions.bars;
        let wallX = side * Number(this.game.config.width) + wallTexture.source[0].width / 2 - wallTexture.source[0].width * side;
        let wallY = wallHeight * wallNumber + wallHeight / 2;
        let wall = this.matter.add.image(wallX, wallY, 'wall', undefined, {
            isStatic: true,
            label: (side == RIGHT) ? 'rightwall' : 'leftwall'
        });
        wall.displayHeight = wallHeight;
        return wall;
    }

    placeCoin() {
        this.coin.x = Phaser.Math.Between(Number(this.game.config.width) * 0.2, Number(this.game.config.width) * 0.8);
        this.coin.y = Phaser.Math.Between(Number(this.game.config.height) * 0.2, Number(this.game.config.height) * 0.8);
    }

    handleWallCollision(side: number, bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType) {
        if (bodyA['color'] != bodyB['color']) {
            this.scene.start('playGame');
        }
        this.paintWalls((side == LEFT) ? this.rightWalls : this.leftWalls);
        this.ball.setVelocity(gameOptions.ballSpeed, this.ball.body.velocity.y);
    }

    paintWalls(walls: Phaser.Physics.Matter.Image[]) {
        walls.forEach((wall: Phaser.Physics.Matter.Image) => {
            let color = Phaser.Math.RND.pick(gameOptions.barColors);
            wall.setTint(color);
            wall.body['color'] = color;
        });
        let randomWall = Phaser.Math.RND.pick(walls);
        this.ball.setTint(randomWall.body['color']);
        this.ball.body['color'] = randomWall.body['color'];
    }

    jump() {
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, -gameOptions.jumpForce);
    }

    update() {
        // updating ball velocity
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, this.ball.body.velocity.y);
        // if the ball flies off the screen...
        if (this.ball.y < 0 || this.ball.y > Number(this.game.config.height)) {
            // restart the game
            this.scene.start('playGame');
        }
    }


}