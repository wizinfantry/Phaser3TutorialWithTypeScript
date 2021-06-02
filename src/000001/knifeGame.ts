import Phaser from 'phaser';
import {knifeOptions as gameOptions} from './knifeOptions';

export default class knifeGame extends Phaser.Scene {

    currentRotationSpeed!: number;
    newRotationSpeed!: number;
    canThrow!: boolean;
    knifeGroup!: Phaser.GameObjects.Group;
    knife!: Phaser.GameObjects.Sprite;
    target!: Phaser.GameObjects.Sprite;
    apple!: Phaser.GameObjects.Sprite;
    // startAngle!: number;
    // appleHit!: boolean;

    constructor() {
        super('knifeGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.image('target', 'target.png');
        this.load.image('knife', 'knife.png');
        this.load.spritesheet('apple', 'apple.png', {
            frameWidth: 70,
            frameHeight: 96
        });
    }

    create() {
        this.currentRotationSpeed = gameOptions.rotationSpeed;
        this.newRotationSpeed = gameOptions.rotationSpeed;
        this.canThrow = true;
        this.knifeGroup = this.add.group();
        this.knife = this.add.sprite(Number(this.game.config.width) / 2, Number(this.game.config.height) / 5 * 4, 'knife');
        this.target = this.add.sprite(Number(this.game.config.width) / 2, 400, 'target');
        this.target.depth = 1;
        let appleAngle = Phaser.Math.Between(0, 360);
        let radians = Phaser.Math.DegToRad(appleAngle - 90);
        this.apple = this.add.sprite(this.target.x + (this.target.width / 2) * Math.cos(radians), this.target.y + (this.target.width / 2) * Math.sin(radians), 'apple');
        this.apple.setOrigin(0.5, 1);
        this.apple.angle = appleAngle;

        this.apple.startAngle = appleAngle;
        // this.startAngle = appleAngle;

        this.apple.depth = 1;

        this.apple.hit = false;
        // this.appleHit = false;

        this.input.on('pointerdown', this.throwKnife, this);

        let timedEvent = this.time.addEvent({
            delay: gameOptions.changeTime,
            callback: this.changeSpeed,
            callbackScope: this,
            loop: true
        });
    }

    changeSpeed() {
        let sign = Phaser.Math.Between(0, 1) == 0 ? -1 : 1;
        let variation = Phaser.Math.FloatBetween(-gameOptions.rotationVariation, gameOptions.rotationVariation);
        this.newRotationSpeed = (this.currentRotationSpeed + variation) * sign;
        this.newRotationSpeed = Phaser.Math.Clamp(this.newRotationSpeed, -gameOptions.maxRotationSpeed, gameOptions.maxRotationSpeed);
    }

    throwKnife() {
        if (this.canThrow) {
            this.canThrow = false;
            this.tweens.add({
                targets: [this.knife],
                y: this.target.y + this.target.width / 2,
                duration: gameOptions.throwSpeed,
                callbackScope: this,
                onComplete: (tween) => {
                    let legalHit = true;
                    let children = this.knifeGroup.getChildren();
                    for (let i = 0; i < children.length; i++) {
                        if (Math.abs(Phaser.Math.Angle.ShortestBetween(this.target.angle, children[i].impactAngle)) < gameOptions.minAngle){
                            // this is not a legal hit
                            legalHit = false;
                            // no need to continue with the loop
                            break;
                        }
                    }

                    if (legalHit) {
                        if (Math.abs(Phaser.Math.Angle.ShortestBetween(this.target.angle, 180 - this.apple.startAngle)) < gameOptions.minAngle && !this.apple.hit) {
                            this.apple.hit = true;
                            this.apple.setFrame(1);
                            let slice = this.add.sprite(this.apple.x, this.apple.y, 'apple', 2);
                            slice.angle = this.apple.angle;
                            slice.setOrigin(0.5, 1);
                            this.tweens.add({
                                targets: [this.apple, slice],
                                y: Number(this.game.config.height) + this.apple.height,
                                x: {
                                    getEnd: (target: Phaser.GameObjects.Sprite, key: string, value: number) => {
                                        return Phaser.Math.Between(0, (Number(this.game.config.width) / 2) + (Number(this.game.config.width) / 2 * (Number(target.frame.name) - 1)));
                                    }
                                },
                                angle: 45,
                                duration: gameOptions.throwSpeed * 6,
                                callbackScope: this,
                                onComplete: (tween) => {
                                    this.scene.start('knifeGame');
                                }
                            });
                        }
                        this.canThrow = true;
                        let knife = this.add.sprite(this.knife.x, this.knife.y, 'knife');
                        knife.impactAngle = this.target.angle;
                        this.knifeGroup.add(knife);
                        this.knife.y = Number(this.game.config.height) / 5 * 4;
                    } else {
                        this.tweens.add({
                            targets: [this.knife],
                            y: Number(this.game.config.height) + this.knife.height,
                            rotation: 5,
                            duration: gameOptions.throwSpeed * 4,
                            callbackScope: this,
                            onComplete: (tween) => {
                                this.scene.start('knifeGame');
                            }
                        });
                    }
                }
            });
        }
    }

    update(time: number, delta: number) {
        this.target.angle += this.currentRotationSpeed;
        let children = this.knifeGroup.getChildren();
        for (let i = 0; i < children.length; i++) {
            // rotating the knife
            children[i].angle += this.currentRotationSpeed;
            // turning knife angle in radians
            let radians = Phaser.Math.DegToRad(children[i].angle + 90);
            // trigonometry to make the knife rotate around target center
            children[i].x = this.target.x + (this.target.width / 2) * Math.cos(radians);
            children[i].y = this.target.y + (this.target.width / 2) * Math.sin(radians);
        }

        // if the apple has not been hit...
        if(!this.apple.hit){
            // adjusting apple rotation
            this.apple.angle += this.currentRotationSpeed;
            // turning apple angle in radians
            let radians = Phaser.Math.DegToRad(this.apple.angle - 90);
            // adjusting apple position
            this.apple.x = this.target.x + (this.target.width / 2) * Math.cos(radians);
            this.apple.y = this.target.y + (this.target.width / 2) * Math.sin(radians);
        }
        // adjusting current rotation speed using linear interpolation
        this.currentRotationSpeed = Phaser.Math.Linear(this.currentRotationSpeed, this.newRotationSpeed, delta / 1000);
    }
}