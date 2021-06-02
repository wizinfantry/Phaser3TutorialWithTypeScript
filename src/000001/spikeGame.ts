/**
 *  type: Phaser.AUTO,
    width: gameOptions.triangleBase * 9.5,
    height: gameOptions.triangleBase * 15.5,
    backgroundColor: 0x000000,
    scene: playGame,
    physics: {
        default: "matter",
        matter: {
            debug: true
        }
    }
 */
import Phaser from 'phaser';

export const gameOptions = {
    triangleBase: 60,
    ballSpeed: 3,
    jumpForce: 5
}

export default class playGame extends Phaser.Scene {
    leftSpikes!: Phaser.Physics.Matter.Image[];
    rightSpikes!: Phaser.Physics.Matter.Image[];
    ball!: Phaser.Physics.Matter.Image;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('spike', 'spike.png');
        this.load.image('wall', 'wall.png');
        this.load.image('ball', 'ball.png');
    }

    create(): void {
        let spikeDistance = gameOptions.triangleBase * 1.25;
        this.leftSpikes = [];
        this.rightSpikes = [];
        for (let i = 0; i < 11; i++) {
            if (i < 7) {
                this.addSpike(gameOptions.triangleBase + i * spikeDistance, Number(this.game.config.height) - gameOptions.triangleBase / 2);
                this.addSpike(gameOptions.triangleBase + i * spikeDistance, gameOptions.triangleBase / 2);
            }
            this.leftSpikes.push(this.addSpike(-gameOptions.triangleBase / 4, gameOptions.triangleBase * 1.5 + i * spikeDistance));
            this.rightSpikes.push(this.addSpike(Number(this.game.config.width) + gameOptions.triangleBase / 4, gameOptions.triangleBase * 1.5 + i * spikeDistance));
        }
        this.addWall(gameOptions.triangleBase / 4, Number(this.game.config.height) / 2, gameOptions.triangleBase / 2, Number(this.game.config.height), 'leftwall');
        this.addWall(Number(this.game.config.width) - gameOptions.triangleBase / 4, Number(this.game.config.height) / 2, gameOptions.triangleBase / 2, Number(this.game.config.height), 'rightwall');
        this.addWall(Number(this.game.config.width) / 2, gameOptions.triangleBase / 4, Number(this.game.config.width) - gameOptions.triangleBase, gameOptions.triangleBase / 2, '');
        this.addWall(Number(this.game.config.width) / 2, Number(this.game.config.height) - gameOptions.triangleBase / 4, Number(this.game.config.width) - gameOptions.triangleBase, gameOptions.triangleBase / 2, '');
        var ballTexture = this.textures.get('ball');
        this.ball = this.matter.add.image(Number(this.game.config.width) / 4, Number(this.game.config.height) / 2, 'ball');
        this.ball.setScale(gameOptions.triangleBase / ballTexture.source[0].width);
        this.ball.setBody({
            type: 'circle',
            radius: gameOptions.triangleBase / 2
        });
        this.ball.setVelocity(gameOptions.ballSpeed, 0);
        this.input.on('pointerdown', this.jump, this);
        this.matter.world.on('collisionstart', (e, b1, b2) => {
            if (b1.label == 'spike' || b2.label == 'spike') {
                this.scene.start('playGame');
            }
            if (b1.label == 'leftwall' || b2.label == 'leftwall') {
                this.setSpikes(true);
                this.ball.setVelocity(gameOptions.ballSpeed, this.ball.body.velocity.y);
            }
            if (b1.label == 'rightwall' || b2.label == 'rightwall') {
                this.setSpikes(false);
                this.ball.setVelocity(-gameOptions.ballSpeed, this.ball.body.velocity.y);
            }
        }, this);
    }

    addWall(x: number, y: number, w: number, h: number, label: string): void {
        let wallTexture = this.textures.get('wall');
        let wall = this.matter.add.image(x, y, 'wall', undefined, {
            isStatic: true,
            label: label
        });
        wall.setScale(w / wallTexture.source[0].width, h / wallTexture.source[0].width);
    }

    addSpike(x: number, y: number): Phaser.Physics.Matter.Image {
        let spikeTexture = this.textures.get('spike');
        let squareSize = gameOptions.triangleBase / Math.sqrt(2);
        let squareScale = squareSize / spikeTexture.source[0].width;
        let spike = this.matter.add.image(x, y, 'spike', undefined, {
            isStatic: true,
            label: 'spike'
        });
        spike.setScale(squareScale);
        spike.rotation = Math.PI / 4;
        return spike;
    }

    setSpikes(isRight: boolean): void {
        for (let i = 0; i < 11; i++) {
            if (isRight) {
                this.rightSpikes[i].x = Number(this.game.config.width) + gameOptions.triangleBase / 4;
            } else {
                this.leftSpikes[i].x = -gameOptions.triangleBase / 4;
            }
        }

        let randomPositions = Phaser.Utils.Array.NumberArray(0, 10);
        let numberOfSpikes = Phaser.Math.Between(3, 6);
        for (let i = 0; i < numberOfSpikes; i++) {
            let randomSpike = Phaser.Utils.Array.RemoveRandomElement(randomPositions);
            if (isRight) {
                this.rightSpikes[Number(randomSpike)].x = Number(this.game.config.width) - gameOptions.triangleBase / 2;
            } else {
                this.leftSpikes[Number(randomSpike)].x = gameOptions.triangleBase / 2;
            }
        }
    }

    jump(): void {
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : - gameOptions.ballSpeed, -gameOptions.jumpForce);
    }

    update(): void {
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, this.ball.body.velocity.y);
    }
}