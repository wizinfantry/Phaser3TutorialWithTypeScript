import Phaser from 'phaser';

export default class playGame extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private arrow!: Phaser.Types.Input.Keyboard.CursorKeys;
    private coin!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private score!: number;
    private scoreText!: Phaser.GameObjects.Text;
    constructor() {
        super('payGame');
    }

    preload(): void {
        this.load.setBaseURL('image/')
        this.load.image('player', 'player.png');
        this.load.image('coin', 'bullet.png');
    }

    create(): void {
        this.player = this.physics.add.sprite(100, 100, 'player');
        this.coin = this.physics.add.sprite(300, 300, 'coin');
        this.arrow = this.input.keyboard.createCursorKeys();

        this.score = 0;
        let style = {font: '20px Arial', fill: '#fff'};
        this.scoreText = this.add.text(20, 20, 'score: ' + this.score, style);
    }

    update() {
        if (this.arrow.right.isDown) {
            this.player.x += 3;
        } else if (this.arrow.left.isDown) {
            this.player.x -= 3;
        }
        if (this.arrow.down.isDown) {
            this.player.y += 3;
        } else if (this.arrow.up.isDown) {
            this.player.y -= 3;
        }

        if (this.physics.overlap(this.player, this.coin)) {
            this.hit();
        }
    }

    hit(): void {
        this.tweens.add({
            targets: this.player,
            duration: 200,
            scaleX: 1.2,
            scaleY: 1.2,
            yoyo: true
        });

        this.coin.x = Phaser.Math.Between(100, 600);
        this.coin.y = Phaser.Math.Between(100, 300);
        this.score += 10;
        this.scoreText.setText('score: ' + this.score);
    }
}

/**
 * width: 700, // Width of the game in pixels
 * height: 400, // Height of the game in pixels
 * backgroundColor: '#3498db', // The background color (blue)
 * scene: mainScene, // The name of the scene we created
 * physics: { default: 'arcade' }, // The physics engine to use
 * */
