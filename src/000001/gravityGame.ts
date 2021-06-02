/**
 *  type: Phaser.AUTO,
    width: 480,
    height: 640,
    physics:{
        default:'arcade',
        arcade:{debug:true}
    }
 */

import Phaser from 'phaser';

export class playGame extends Phaser.Scene {
    ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    ground: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    timer: Phaser.Time.TimerEvent;
    power: number;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('ball', 'ball.png');
        this.load.image('block', 'block.png');
    }

    create(): void {
        this.ball = this.physics.add.sprite(Number(this.game.config.width) / 2, 0, 'ball');
        /**
         *  Y 축에 적용 할 중력을 설정합니다. 값은 양수 또는 음수 일 수 있습니다. 값이 클수록 효과가 더 강해집니다.
            @param y — Y 축에 적용 할 중력입니다.
         */
        this.ball.setGravityY(100);

        let groundX = Number(this.game.config.width) / 2;
        let groundY = Number(this.game.config.height) * .95;
        this.ground = this.physics.add.sprite(groundX, groundY, 'block');
        this.ground.displayWidth = Number(this.game.config.width);
        /**
         *  이 Body가 다른 바디와 충돌하는 동안 분리 될 수 있는지 여부를 설정합니다.
            몸체가 움직일 수 없다는 것은 충돌 겹침에서 분리하지 않고 전혀 움직이지 않음을 의미합니다.
            바디가 다른 바디에 의해 넘어지는 것을 막으려면 대신 setPushable 메서드를 참조하십시오.
            @param 값 — 다른 바디와 충돌하는 동안이 바디가 분리되는지 여부를 설정합니다. 기본값은 true입니다.
         */
        this.ground.setImmovable()

        this.physics.add.collider(this.ball, this.ground);
        this.input.on('pointerdown', this.startJump, this);
        this.input.on('pointerup', this.endJump, this);

        this.power = 0;
    }

    jump(): void {
        this.ball.setVelocityY(-100);
    }

    startJump(): void {
        this.timer = this.time.addEvent({
            delay: 100,
            callback: this.tick,
            callbackScope: this,
            loop: true
        });
    }
    endJump(): void {
        this.timer.remove();
        this.ball.setVelocityY(-this.power * 100);
        this.power = 0;
    }

    tick(): void {
        if (this.power < 5) {
            this.power += .1;
        }
    }
}