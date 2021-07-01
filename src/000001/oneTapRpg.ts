/**
 *  type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: "thegame",
        width: 750,
        height: 1334
    },
    scene: playGame,
    physics: {
        default: "matter",
        matter: {
            gravity: {
                y: gameOptions.gravity
            }
        }
    }
*/

import Phaser from 'phaser';

export const gameOptions = {
    gravity: 1,
    maxItemsPerLevel: 30,
    maxIterations: 10,
    minItemsDistance: 160
}

const HERO = 0;
const COIN = 1;
const SKULL = 2;

export class playGame extends Phaser.Scene {
    canSummonHero: boolean;
    gameItems: Phaser.GameObjects.Group;
    constructor() {
        super('playGame');
    }

    preload() {
        this.load.setBaseURL('image/');
        this.load.spritesheet('items', 'items.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    create() {
        this.canSummonHero = true;
        /**
         *  Runs the Matter Engine.update at a fixed timestep of 30Hz.
         */
        this.matter.world.update30Hz();
        /**
         *  주어진 세계 픽셀 치수와 일치하도록 물리 세계의 경계를 설정합니다.
         *  생성 할 '벽'(왼쪽, 오른쪽, 위쪽 또는 아래쪽)을 선택적으로 설정할 수 있습니다.
         *  벽이 지정되지 않은 경우 기본적으로 이전에 있던 벽 설정을 사용합니다.
         *  즉 이전에 왼쪽 또는 오른쪽 벽이 없다고 말한 다음 월드 크기를 조정하면 새로 생성 된 경계에도 왼쪽 및 오른쪽 벽이 없습니다.
         *  이를 재정의하려면 매개 변수에 명시 적으로 명시하십시오.
            @param x — The x coordinate of the top-left corner of the bounds. Default 0.
            @param y — The y coordinate of the top-left corner of the bounds. Default 0.
            @param width — The width of the bounds.
         */
        this.matter.world.setBounds(0, -400, Number(this.game.config.width), Number(this.game.config.height) + 800);
        this.createLevel();
        this.input.on('pointerdown', this.releaseHero, this);
        this.matter.world.on('collisionstart', (e, b1, b2) => {
            switch (b1.gameObject && b1.gameObject.getData('Label')) {
                case COIN:
                    b1.gameObject.visible = false;
                    this.matter.world.remove(b1);
                    break;
                case SKULL:
                    if (b1.gameObject.y > b2.gameObject.y) {
                        b1.gameObject.visible = false;
                        this.matter.world.remove(b1);
                    } else {
                        this.cameras.main.flash(50, 255, 0, 0);
                    }
                    break;
                default:
                    if (b2.gameObject.y > Number(this.game.config.height)) {
                        this.scene.start('playGame');
                    } else {
                        if (b2.gameObject.y > 0) {
                            this.cameras.main.flash(50, 255, 0, 0);
                        }
                    }
                    break;
            }
        })
    }

    createLevel() {
        this.gameItems = this.add.group();
        let spawnRectangle = new Phaser.Geom.Rectangle(80, 250, Number(this.game.config.width) - 160, Number(this.game.config.height) - 350);
        for (let i = 0; i < gameOptions.maxItemsPerLevel; i++) {
            let iterations = 0;
            let point: Phaser.Geom.Rectangle;
            do {
                point = Phaser.Geom.Rectangle.Random(spawnRectangle, undefined);
                iterations++;
            } while (iterations < gameOptions.maxIterations && this.itemOverlap(point))
            if (iterations == gameOptions.maxIterations) {
                break;
            } else {
                let item = this.matter.add.image(point.x, point.y, 'items');
                /**
                 *  게임 오브젝트의 몸체를 원으로 설정합니다.
                    이 메서드를 호출하면 플러그인, 질량, 마찰 등을 포함하여 본문에 설정했을 수있는 이전 속성이 재설정됩니다.
                    따라서 필요한 경우 옵션 개체에 다시 적용해야합니다.
                    @param radius — The radius of the circle.
                    @param options — An optional Body configuration object that is used to set initial Body properties on creation.
                 */
                item.setCircle(undefined);
                /**
                 *  물리 몸체를 정적 참 또는 동적 거짓으로 변경합니다.
                    @param value — true to set the body as being static, or false to make it dynamic.
                 */
                item.setStatic(true);

                /**
                 *  이 Body가 속한 게임 오브젝트입니다. 이 정적 바디가 속한 게임 오브젝트입니다.
                 *  이 바디가 속한 Phaser 게임 오브젝트에 대한 참조입니다 (있는 경우).
                    @property — gameObject
                    @type — Phaser.GameObjects.GameObject
                 */
                item.body.gameObject = item;

                this.gameItems.add(item);
                if (Phaser.Math.Between(0, 99) > 50) {
                    item.setFrame(1);
                    // item.body.label = COIN;
                    item.setData('Label', COIN)
                } else {
                    item.setFrame(2);
                    // item.body.label = SKULL;
                    item.setData('Label', SKULL)
                }
            }
        }
    }

    itemOverlap(p: Phaser.Geom.Rectangle): boolean {
        let overlap = false;
        this.gameItems.getChildren().forEach((child) => {
            let item = <Phaser.Physics.Matter.Image>child;
            /**
             *  getCenter()
             *  원점에 관계없이 이 게임 오브젝트의 중심 좌표를 가져옵니다.
             *  반환 된 포인트는 로컬 공간에서 계산되며 상위 컨테이너를 고려하지 않습니다.
                @param output — An object to store the values in. If not provided a new Vector2 will be created.
             */
            /**
             *  distance(src)
             *  Calculate the distance between this Vector and the given Vector.
                @param src — The Vector to calculate the distance to.
             */
            if (item.getCenter().distance(p) < gameOptions.minItemsDistance) {
                overlap = true;
            }
        })
        return overlap;
    }

    releaseHero(e: Phaser.Input.Pointer) {
        if (this.canSummonHero) {
            this.canSummonHero = false;
            let item = this.matter.add.image(e.x, -200, 'items');
            item.body.gameObject = item;
            item.setCircle(undefined);
            item.setBounce(1);
            item.setData('Label', HERO);
        }
    }
}