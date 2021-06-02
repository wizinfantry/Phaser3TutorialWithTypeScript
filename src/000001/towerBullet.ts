import Phaser from 'phaser';

export default class bullet extends Phaser.GameObjects.Image {
    private dx: number;
    private dy: number;
    private lifeSpan: number;
    private speed: number;
    constructor(scene) {
        super(scene, 0, 0, 'bullet');
        this.dx = 0;
        this.dy = 0;
        this.lifeSpan = 0;
        this.speed = Phaser.Math.GetSpeed(600, 1);
    }

    fire(x: number, y: number, angle: number): void {
        this.setActive(true);
        this.setVisible(true);
        // 총알이 화면 중앙에서 주어진 x / y까지 발사됩니다.
        this.setPosition(x, y);
        this.dx = Math.cos(angle);
        this.dy = Math.sin(angle);
        this.lifeSpan = 300;
    }

    update(time: number, delta: number) {
        this.lifeSpan -= delta;
        this.x += this.dx * (this.speed * delta);
        this.y += this.dy * (this.speed * delta);
        if (this.lifeSpan <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}