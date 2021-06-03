import Phaser from 'phaser';
import { playGame } from './000001/stringAvoiderGame';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	backgroundColor: 'black',
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: 640,
		height: 960,
	},
	render: {
		pixelArt: true,
		roundPixels: true
	},
	physics: {
		default: 'arcade',
		arcade: {
			debug: false
		}
	},
	scene: [playGame],
}

export default new Phaser.Game(config)