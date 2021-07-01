import Phaser from 'phaser';
import { playGame } from './000001/oneTapRpg';

const config: Phaser.Types.Core.GameConfig = {
	type: Phaser.WEBGL,
	backgroundColor: 0x0c88c7,
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: 750,
		height: 1334,
	},
	render: {
		pixelArt: true,
	},
	physics: {
		default: 'matter',
		matter: {
			debug: false,
			gravity: {
				y: 1
			}
		}
	},
	scene: [playGame],
}

export default new Phaser.Game(config)