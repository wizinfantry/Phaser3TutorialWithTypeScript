import Phaser from 'phaser';

export class TextButton extends Phaser.GameObjects.Text {
    constructor(scene: Phaser.Scene, x: number, y: number, text: string, style: object, callback: VoidFunction) {
        super(scene, x, y, text, {});
        this.setStyle(style);

        this.setInteractive({useHandCursor: true})
            .on('pointerover', () => this.enterButtonHoverState())
            .on('pointerout', () => this.enterButtonRestState())
            .on('pointerdown', () => this.enterButtonActiveState())
            .on('pointerup', () => {
                this.enterButtonHoverState();
                callback();
            });
    }

    enterButtonHoverState(): void {
        this.setStyle({fill: '#ff0'});
    }

    enterButtonRestState(): void {
        this.setStyle({fill: '#0f0'});
    }

    enterButtonActiveState(): void {
        this.setStyle({fill: '#0ff'});
    }
}
