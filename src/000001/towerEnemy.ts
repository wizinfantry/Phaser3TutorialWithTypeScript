import Phaser from 'phaser';

const ENEMY_SPEED = 1 / 10000;

export default class ememy extends Phaser.GameObjects.Image {
    private follower: { t: number; vec: Phaser.Math.Vector2; };
    private path!: Phaser.Curves.Path;
    private hp!: number;
    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, 'sprites', 'enemy');
        this.follower = {t: 0, vec: new Phaser.Math.Vector2()};
    }

    setPath(path: Phaser.Curves.Path) {
        this.path = path;
    }

    startOnPath(): void {
        // 경로의 시작 부분에 t 매개 변수 설정
        this.follower.t = 0;
        // get x and y of the given t point
        this.path.getPoint(this.follower.t, this.follower.vec);
        // set the x and y of our enemy to the received from the previous step
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        this.hp = 100;
    }

    receiveDamage(damage: number): void {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    update(time: number, delta: number) {
        // 경로를 따라 t 점을 이동하면 0이 시작이고 0이 끝입니다.
        this.follower.t += ENEMY_SPEED * delta;
        // get the new x and y coordinates in vec
        this.path.getPoint(this.follower.t, this.follower.vec);
        // update enemy x and y to the newly obtained x and y
        this.setPosition(this.follower.vec.x, this.follower.vec.y);
        // if we have reached the end of the path, remove the enemy
        if (this.follower.t >= 1) {
            this.setActive(false);
            this.setVisible(false);
        }
    }
}