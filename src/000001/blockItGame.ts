/**
 *  width: 480,
    height: 640,
    scene: playGame,
    backgroundColor: 0x222222,
    physics: {
        default: "arcade"
    }
 */
import Phaser from 'phaser';

export const gameOptions = {
    // duration of the wall, in milliseconds
    wallDuration: 100,
    // ball start speed, in pixels/second
    ballStartSpeed: 500,
    // ball speed increase at each successful bounce, in pixels/second
    ballSpeedIncrease: 20
}

export class playGame extends Phaser.Scene {
    gameOver!: boolean;
    canActivateWall!: boolean;
    ballSpeed!: number;
    wallGroup!: Phaser.Physics.Arcade.Group;
    theBall!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    lowerWall!: Phaser.Types.Physics.Arcade.ImageWithDynamicBody;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.image('ball', 'ball.png');
        this.load.image('wall', 'wall.png');
    }

    create(): void {
        this.gameOver = false;
        this.canActivateWall = true;
        this.ballSpeed = gameOptions.ballStartSpeed;
        this.wallGroup = this.physics.add.group();
        this.theBall = this.physics.add.image(Number(this.game.config.width) / 2, Number(this.game.config.height) * 4 / 5, 'ball');
        this.theBall.body.setCircle(25);
        /**
         *  바운스는 신체가 다른 물체와 충돌 할 때 갖는 회복 또는 탄력의 양입니다.
         *  값 1은 리바운드 후에도 전체 속도를 유지함을 의미합니다.
         *  0 값은 전혀 리바운드되지 않음을 의미합니다.
            @param x — 충돌시 적용 할 수평 바운스 양입니다. 일반적으로 0과 1 사이의 부동 소수점입니다.
            @param y — 충돌시 적용 할 수직 바운스 양입니다. 일반적으로 0과 1 사이의 부동 소수점입니다. 기본 x.
         */
        this.theBall.setBounce(1)
        this.createWall(32, Number(this.game.config.height) / 2, 32, Number(this.game.config.height) - 96);
        this.createWall(Number(this.game.config.width) - 32, Number(this.game.config.height) / 2, 32, Number(this.game.config.height) - 96);
        this.createWall(Number(this.game.config.width) / 2, 32, Number(this.game.config.width) - 32, 32)
        this.lowerWall = this.createWall(Number(this.game.config.width) / 2, Number(this.game.config.height) - 32, Number(this.game.config.width) - 32, 32);
        this.physics.add.collider(this.theBall, this.wallGroup, (checkBall, checkWall) => {
            let ball = <Phaser.Types.Physics.Arcade.ImageWithDynamicBody>checkBall;
            let wall = <Phaser.Types.Physics.Arcade.ImageWithDynamicBody>checkWall;
            this.canActivateWall = true;
            if (wall.x == this.lowerWall.x && wall.y == this.lowerWall.y) {
                this.ballSpeed += gameOptions.ballSpeedIncrease;
                let ballVelocity = this.physics.velocityFromAngle(Phaser.Math.Between(220, 320), this.ballSpeed);
                this.theBall.setVelocity(ballVelocity.x, ballVelocity.y);
            }
        }, undefined, this);
        this.input.on('pointerdown', this.activateWall, this);

    }

    createWall(posX: number, posY: number, width: number, height: number): Phaser.Types.Physics.Arcade.ImageWithDynamicBody {
        let wall = this.physics.add.image(posX, posY, 'wall');
        wall.displayWidth = width;
        wall.displayHeight = height;
        this.wallGroup.add(wall);
        /**
         *  이 Body가 다른 바디와 충돌하는 동안 분리 될 수 있는지 여부를 설정합니다.
            몸체가 움직일 수 없다는 것은 충돌 겹침에서 분리하지 않고 전혀 움직이지 않음을 의미합니다.
            바디가 다른 바디에 의해 넘어지는 것을 막으려면 대신 setPushable 메서드를 참조하십시오.
            @param 값 — 다른 바디와 충돌하는 동안이 바디가 분리되는지 여부를 설정합니다. 기본값은 true입니다.
         */
        wall.setImmovable();
        return wall;
    }

    activateWall(): void {
        if (this.theBall.body.speed == 0) {
            /**
             *  각도 (도)와 속도가 주어지면 속도를 계산하고 벡터로 반환하거나 주어진 벡터 객체로 설정합니다.
             *  이것을 사용하는 한 가지 방법은 : velocityFromAngle (angle, 200, sprite.body.velocity) 값을 스프라이트의 속도로 직접 설정하고 새 벡터 객체를 생성하지 않습니다.
                @param angle — 시계 방향 양의 방향으로 계산 된 각도 (아래 = 양수 90도, 오른쪽 = 양수 0도, 위 = 음수 90도)
                @param speed — 이동할 속도 (제곱 초당 픽셀 수)입니다. 기본값은 60입니다.
             */
            let ballVelocity = this.physics.velocityFromAngle(Phaser.Math.Between(220, 320), this.ballSpeed);
            this.theBall.setVelocity(ballVelocity.x, ballVelocity.y);
            this.lowerWall.alpha = 0;
            /**
             *  이 Body의 충돌 여부와 방향. 충돌 검사를 비활성화하려면 checkCollision.none = true를 설정할 수 있습니다.
             *  이 StaticBody의 충돌 및 방향 확인 여부입니다.
             *  충돌 검사를 비활성화하려면 checkCollision.none = false를 설정할 수 있습니다.
             */
            this.lowerWall.body.checkCollision.none = true;
            return
        }
        if (this.canActivateWall) {
            this.canActivateWall = false;
            this.lowerWall.alpha = 1;
            this.lowerWall.body.checkCollision.none = false;
            /**
             *  타이머 이벤트를 생성하고 프레임 시작시 시계에 추가합니다.
                기존 타이머 이벤트를 전달할 수도 있습니다.이 이벤트는 재설정되고 이 시계에 추가됩니다.
                타이머 이벤트가 다른 시계 (다른 장면에서)에서 사용되는 경우 해당 시계에서도 업데이트 되므로이 기능을 사용할 때주의하십시오.
                @param config — Timer Event 또는 기존 Timer Event 객체에 대한 구성입니다.
             */
            let wallEvent = this.time.addEvent({
                delay: gameOptions.wallDuration,
                callbackScope: this,
                callback: () => {
                    this.lowerWall.alpha = 0;
                    this.lowerWall.body.checkCollision.none = true;
                }
            });
        }
    }

    /**
     *  자신의 장면으로 재정의해야합니다. 이 메서드는 씬이 실행되는 동안 게임 단계 당 한 번씩 호출됩니다.
        @param time — 현재 시간입니다. 애니메이션 요청 프레임에서 가져온 경우 고해상도 타이머 값이고 SetTimeout을 사용하는 경우 Date.now입니다.
        @param delta — 마지막 프레임 이후의 델타 시간 (ms)입니다. 이것은 FPS 속도를 기반으로 한 평활화 및 제한 값입니다.
     */
    update(): void {
        if ((this.theBall.y > Number(this.game.config.height) || this.theBall.y < 0) && !this.gameOver) {
            this.gameOver = true;
            this.cameras.main.shake(800, 0.05);
            this.time.addEvent({
                delay: 800,
                callbackScope: this,
                callback: () => {
                    this.scene.start('playGame');
                }
            });
        }
    }
}