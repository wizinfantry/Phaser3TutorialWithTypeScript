import Phaser from 'phaser';
import { ScrollingBackground } from './Entities';

export default class SceneGameOver extends Phaser.Scene {
    private title!: Phaser.GameObjects.Text;
    private sfx!: { btnOver: Phaser.Sound.BaseSound; btnDown: Phaser.Sound.BaseSound; };
    private btnRestart!: Phaser.GameObjects.Sprite;
    private backgrounds!: ScrollingBackground[];
    constructor() {
        super('SceneGameOver');
    }

    create(): void {
        this.backgrounds = [];
        for (let i = 0; i < 5; i++) {
            let keys = ['sprBg0', 'sprBg1'];
            let key = keys[Phaser.Math.Between(0, keys.length - 1)];
            let bg = new ScrollingBackground(this, key, i * 10);
            this.backgrounds.push(bg);
        }

        this.title = this.add.text(Number(this.game.config.width) * 0.5, 128, 'GAME OVER', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        });
        this.title.setOrigin(0.5);

        this.sfx = {
            btnOver: this.sound.add('sndBtnOver'),
            btnDown: this.sound.add('sndBtnDown')
        }

        this.btnRestart = this.add.sprite(
            Number(this.game.config.width) * 0.5,
            Number(this.game.config.height) * 0.5,
            'sprBtnRestart'
        );

        this.btnRestart.setInteractive();

        this.btnRestart.on('pointerover', () => {
            this.btnRestart.setTexture('sprBtnRestartHover');
            this.sfx.btnOver.play();
        }, this);

        this.btnRestart.on('pointerout', () => {
            this.btnRestart.setTexture('sprBtnRestart');
        }, this);

        this.btnRestart.on('pointerdown', () => {
            this.btnRestart.setTexture('sprBtnRestartDown');
            this.sfx.btnDown.play();
        });

        this.btnRestart.on('pointerup', () => {
            this.btnRestart.setTexture('sprBtnRestart');
            this.scene.start('SceneMain');
        });
    }

    update(): void {
        for (let i = 0; i < this.backgrounds.length; i++) {
            this.backgrounds[i].update();
        }
    }
}