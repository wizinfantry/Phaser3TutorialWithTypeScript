/**
 *  type: Phaser.WEBGL,
    width: 480,
    height: 640,
    backgroundColor: "black",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [
        SceneMainMenu,
        SceneMain,
        SceneGameOver
    ],
    pixelArt: true,
    roundPixels: true
 */
import Phaser from 'phaser';
import {Entity, Player, GunShip, ChaserShip, CarrierShip, ScrollingBackground} from './Entities';

export default class SceneMainMenu extends Phaser.Scene {
    private sfx!: { btnOver: Phaser.Sound.BaseSound; btnDown: Phaser.Sound.BaseSound; };
    private btnPlay!: Phaser.GameObjects.Sprite;
    private title!: Phaser.GameObjects.Text;
    private backgrounds!: ScrollingBackground[];
    constructor() {
        super('SceneMainMenu');
    }

    preload(): void {
        this.load.setBaseURL('content/');

        this.load.image('sprBg0', 'sprBg0.png');
        this.load.image('sprBg1', 'sprBg1.png');

        this.load.image('sprBtnPlay', 'sprBtnPlay.png');
        this.load.image('sprBtnPlayHover', 'sprBtnPlayHover.png');
        this.load.image('sprBtnPlayDown', 'sprBtnPlayDown.png');
        this.load.image('sprBtnRestart', 'sprBtnRestart.png');
        this.load.image('sprBtnRestartHover', 'sprBtnRestartHover.png');
        this.load.image('sprBtnRestartDown', 'sprBtnRestartDown.png');

        this.load.audio('sndBtnOver', 'sndBtnOver.wav');
        this.load.audio('sndBtnDown', 'sndBtnDown.wav');
    }

    create(): void {
        this.sfx = {
            btnOver: this.sound.add('sndBtnOver'),
            btnDown: this.sound.add('sndBtnDown')
        };

        this.btnPlay = this.add.sprite(
            Number(this.game.config.width) * 0.5,
            Number(this.game.config.height) * 0.5,
            'sprBtnPlay'
        );
        this.btnPlay.setInteractive();
        this.btnPlay.on('pointerover', () => {
            this.btnPlay.setTexture('sprBtnPlayHover');
            this.sfx.btnOver.play();
        }, this);
        this.btnPlay.on('pointerout', () => {
            this.btnPlay.setTexture('sprBtnPlay');
        }, this);
        this.btnPlay.on('pointerdown', () => {
            this.btnPlay.setTexture('sprBtnPlayDown');
            this.sfx.btnDown.play();
        }, this);
        this.btnPlay.on('pointerup', () => {
            this.btnPlay.setTexture('sprBtnPlay');
            this.scene.start('SceneMain');
        }, this);

        this.title = this.add.text(Number(this.game.config.width) * 0.5, 128, 'SPACE SHOOTER', {
            fontFamily: 'monospace',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        });
        this.title.setOrigin(0.5);

        this.backgrounds = [];
        for (let i = 0; i < 5; i++) {
            let keys = ['sprBg0', 'sprBg1'];
            let key = keys[Phaser.Math.Between(0, keys.length - 1)];
            let bg = new ScrollingBackground(this, key, i * 10);
            this.backgrounds.push(bg);
        }
    }

    update() {
        for (let i = 0; i < this.backgrounds.length; i++) {
            this.backgrounds[i].update();
        }
    }
}