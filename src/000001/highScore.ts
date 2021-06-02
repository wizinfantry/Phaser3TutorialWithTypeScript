import Phaser from 'phaser';

class highScore extends Phaser.Scene {
    playerText!: Phaser.GameObjects.BitmapText;
    constructor() {
        super({key: 'highScore', active: true});
    }

    prelaod() {
        this.load.setBaseURL('image/');
        this.load.image('block', 'block.png');
        this.load.image('rub', 'rub.png');
        this.load.image('end', 'end.png');
        this.load.bitmapFont('arcade', 'arcade.png', 'arcade.xml');
    }

    create() {
        this.add.bitmapText(100, 260, 'arcade', 'RANK   SCORE    NAME').setTint(0xff00ff);
        this.add.bitmapText(100, 300, 'arcade', '1ST    50000').setTint(0xff0000);
        this.playerText = this.add.bitmapText(500, 310, 'arcade', '').setTint(0xff0000);

        // do this, otherwise this Scene will steal all keyboard input
        this.input.keyboard.enabled = false;

        this.scene.launch('inputPanel');
        let panel = this.scene.get('inputPanel');

        // listen to events from the Input Panel scene
        panel.events.on('updateName', this.updateName, this);
        panel.events.on('submitName', this.submitName, this);
    }

    submitName() {
        this.scene.stop('inputPanel');

        this.add.bitmapText(100, 360, 'arcade', '2ND    40000     ANT').setTint(0xff8200);
        this.add.bitmapText(100, 410, 'arcade', '3RD    30000     .-.').setTint(0xffff00);
        this.add.bitmapText(100, 460, 'arcade', '4TH    20000     BOB').setTint(0x00ff00);
        this.add.bitmapText(100, 510, 'arcade', '5TH    10000     ZIK').setTint(0x00bfff);
    }

    updateName(name) {
        this.playerText.setText(name)
    }
}

class inputPanel extends Phaser.Scene {
    chars: string[][];
    cursors: Phaser.Math.Vector2;
    name: string;
    charLimit: number;
    text!: Phaser.GameObjects.BitmapText;
    block!: Phaser.GameObjects.Image;
    constructor() {
        super({key: 'inputPanel', active: false});
        this.chars = [
            [ 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J' ],
            [ 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T' ],
            [ 'U', 'V', 'W', 'X', 'Y', 'Z', '.', '-', '<', '>' ]
        ]

        this.cursors = new Phaser.Math.Vector2();
        this.text;
        this.block;
        this.name = '';
        this.charLimit = 3;
    }

    create() {
        let text = this.add.bitmapText(130, 50, 'arcade', 'ABCDEFGHIJ\n\nKLMNOPQRST\n\nUVWXYZ.-');

        text.setLetterSpacing(20);
        text.setInteractive();

        this.add.image(text.x + 430, text.y + 148, 'rub');
        this.add.image(text.x + 482, text.y + 148, 'end');

        this.block = this.add.image(text.x - 10, text.y - 2, 'block').setOrigin(0);

        this.text = text;

        this.input.keyboard.on('keyup_LEFT', this.moveLeft, this);
        this.input.keyboard.on('keyup_RIGHT', this.moveRight, this);
        this.input.keyboard.on('keyup_UP', this.moveUp, this);
        this.input.keyboard.on('keyup_DOWN', this.moveDown, this);
        this.input.keyboard.on('keyup_ENTER', this.pressKey, this);
        this.input.keyboard.on('keyup_SPACE', this.pressKey, this);
    }
    moveDown() {
        
    }
    moveUp() {
        
    }
    moveRight() {
        
    }
    moveLeft() {
        if (this.cursors.x > 0) {
            this.cursors.x--;
            this.block.x -= 52;
        } else {
            this.cursors.x = 9;
            this.block.x += 52 * 9;
        }
    }

    moveBlock(pointer, x: number, y: number): void {
        let cx = Phaser.Math.Snap.Floor(x, 52, 0, true);
        let cy = Phaser.Math.Snap.Floor(y, 64, 0, true);
        let char = this.chars[cy][cx];

        this.cursors.set(cx, cy);

        this.block.x = this.text.x - 10 + (cx * 52);
        this.block.y = this.text.y - 2 + (cy * 64);
    }

    pressKey(): void {
        let x = this.cursors.x;
        let y = this.cursors.y;
        let nameLength = this.name.length;

        this.block.x = this.text.x - 10 + (x * 52);
        this.block.y = this.text.y - 2 + (y * 64);

        if (x === 9 && y === 2 && nameLength > 0) {
            // submit
            this.events.emit('submitName', this.name);
        } else if (x === 8 && y === 2 && nameLength > 0) {
            // rub
            this.name = this.name.substr(0, nameLength - 1);
            this.events.emit('updateName', this.name);
        } else if (this.name.length < this.charLimit) {
            // add
            this.name = this.name.concat(this.chars[y][x]);
            this.events.emit('updateName', this.name);
        }
    }
}