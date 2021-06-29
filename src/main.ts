import Phaser from 'phaser';
import { preloadGame, playGame } from './000001/endlessRunnerGame005';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	backgroundColor: 0x0c88c7,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: 1334,
		height: 750,
	},
	render: {
		pixelArt: true,
	},
	physics: {
		default: 'arcade',
		arcade: {
			debug: false
		}
	},
	scene: [preloadGame, playGame],
}

export default new Phaser.Game(config)