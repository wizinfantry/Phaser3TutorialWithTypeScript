/**
 *  type: Phaser.AUTO,
    width: 750,
    height: 1334,
    backgroundColor: 0x000000,
    scene: playGame,
    physics: {
        default: "matter",
        matter: {
            gravity: {
                x: 0,
                y: 4
            },
            debug: true
        }
    }
 */

import { Bounds } from 'matter';
import Phaser from 'phaser'

export const gameOptions = {
    ballSpeed: 4,
    jumpForce: 30,
    bars: 4,
    barColors: [0x1abc9c, 0x2980b9, 0x9b59b6, 0xf1c40f, 0xc0392b, 0xecf0f1]
}

export const LEFT = 0;
export const RIGHT = 1;

export default class playGame extends Phaser.Scene {
    leftWalls!: Phaser.Physics.Matter.Image[];
    rightWalls!: Phaser.Physics.Matter.Image[];
    ball!: Phaser.Physics.Matter.Image;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('wall', 'wall.png');
        this.load.image('ball', 'ball.png');
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
        });
        let randomWall = Phaser.Math.RND.pick(this.rightWalls);
        this.ball.setTint(0xFFFFFF);
        this.ball.body['color'] = 0xFFFFFF;
        this.ball.setVelocity(gameOptions.ballSpeed, 0);
        this.input.on('pointerdown', this.jump, this);
        this.matter.world.on('collisionstart', (e, b1, b2) => {
            console.log(e, b1, b2);
            if (b1.label == 'leftwall' || b2.label == 'leftwall') {
                this.handleWallCollision(LEFT, b1, b2);
            }
            if (b1.label == 'rightwall' || b2.label == 'rightwall') {
                this.handleWallCollision(RIGHT, b1, b2);
            }
        }, this);
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
        wall.setTint(0xFFFFFF);
        wall.body['color'] = 0xFFFFFF;
        return wall;
    }

    handleWallCollision(side, bodyA, bodyB) {
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

    jump(): void {
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, -gameOptions.jumpForce);
    }

    update(){
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, this.ball.body.velocity.y);
        if (this.ball.y < 0 || this.ball.y > Number(this.game.config.height)) {
            this.scene.start('playGame');
        }
    }
}

