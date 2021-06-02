import Phaser, { Tilemaps } from 'phaser';

export const gameOptions = {
    fieldSize: 7,
    gemColors: 6,
    gemSize: 100,
    swapSpeed: 200,
    fallSpeed: 100,
    destroySpeed: 200
};

export const HORIZONTAL = 1;
export const VERTICAL = 2;

export interface gemList {
    gemColor: number,
    gemSprite: Phaser.GameObjects.Sprite | undefined,
    isEmpty: boolean
}

export default class playGame extends Phaser.Scene {
    canPick!: boolean;
    dragging!: boolean;
    selectedGem!: gemList | undefined;
    gameArray!: gemList[][];
    poolArray!: Phaser.GameObjects.Sprite[];
    gemGroup!: Phaser.GameObjects.Group;
    swappingGems!: number;
    removeMap!: number[][];
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.spritesheet('gems', 'gems.png', {
            frameWidth: gameOptions.gemSize,
            frameHeight: gameOptions.gemSize
        });
    }

    create(): void {
        this.canPick = true;
        this.dragging = false;
        this.drawField();
        this.selectedGem = undefined;
        this.input.on('pointerdown', this.gemSelect, this);
        this.input.on('pointermove', this.startSwipe, this);
        this.input.on('pointerup', this.stopSwipe, this);
    }

    drawField(): void {
        this.gameArray = [];
        this.poolArray = [];
        this.gemGroup = this.add.group();
        for (let i = 0; i < gameOptions.fieldSize; i++) {
            this.gameArray[i] = [];
            for (let j = 0; j < gameOptions.fieldSize; j++) {
                let gem = this.add.sprite(gameOptions.gemSize * j + gameOptions. gemSize / 2, gameOptions.gemSize * i + gameOptions.gemSize / 2, 'gems');
                this.gemGroup.add(gem);
                do {
                    let randomColor = Phaser.Math.Between(0, gameOptions.gemColors - 1);
                    gem.setFrame(randomColor);
                    this.gameArray[i][j] = {
                        gemColor: randomColor,
                        gemSprite: gem,
                        isEmpty: false
                    };
                } while (this.isMatch(i, j));
            }
        }
    }

    isMatch(row: number, col: number): boolean {
        return this.isHorizontalMatch(row, col) || this.isVerticalMatch(row, col);
    }

    isHorizontalMatch(row: number, col: number): boolean {
        return this.gemAt(row, col).gemColor == this.gemAt(row, col - 1).gemColor && this.gemAt(row, col).gemColor == this.gemAt(row, col - 2).gemColor;
    }

    isVerticalMatch(row: number, col: number): boolean {
        return this.gemAt(row, col).gemColor == this.gemAt(row - 1, col).gemColor && this.gemAt(row, col).gemColor == this.gemAt(row - 2, col).gemColor;
    }

    gemAt(row: number, col: number): gemList {
        if (row < 0 || row >= gameOptions.fieldSize || col < 0 || col >= gameOptions.fieldSize) {
            return {gemColor: -1, gemSprite: undefined, isEmpty: true};
        }
        return this.gameArray[row][col]
    }

    gemSelect(pointer: Phaser.Input.Pointer): void {
        if (this.canPick) {
            this.dragging = true;
            let row = Math.floor(pointer.y / gameOptions.gemSize);
            let col = Math.floor(pointer.x / gameOptions.gemSize);
            let pickedGem = this.gemAt(row, col);
            if (pickedGem.gemColor != -1 && pickedGem.gemSprite != undefined) {
                if (this.selectedGem == undefined) {
                    pickedGem.gemSprite.setScale(1.2);
                    pickedGem.gemSprite.setDepth(1);
                    this.selectedGem = pickedGem;
                } else {
                    if (this.areTheSame(pickedGem, this.selectedGem)) {
                        if (this.selectedGem.gemSprite != undefined) {
                            this.selectedGem.gemSprite.setScale(1);
                            this.selectedGem = undefined;
                        }
                    } else {
                        if (this.selectedGem.gemSprite != undefined) {
                            this.selectedGem.gemSprite.setScale(1.2);
                            this.selectedGem = pickedGem;
                        }
                    }
                }
            }
        }
    }

    startSwipe(pointer: Phaser.Input.Pointer): void {
        if (this.dragging && this.selectedGem != undefined) {
            let deltaX = pointer.downX - pointer.x;
            let deltaY = pointer.downY - pointer.y;
            let deltaRow = 0;
            let deltaCol = 0;
            if (deltaX > gameOptions.gemSize / 2 && Math.abs(deltaY) < gameOptions.gemSize / 4) {
                deltaCol = -1;
            }
            if (deltaX < -gameOptions.gemSize / 2 && Math.abs(deltaY) < gameOptions.gemSize / 4) {
                deltaCol = 1;
            }
            if (deltaY > gameOptions.gemSize / 2 && Math.abs(deltaX) < gameOptions.gemSize / 4) {
                deltaRow = -1;
            }
            if (deltaY < -gameOptions.gemSize / 2 && Math.abs(deltaX) < gameOptions.gemSize / 4) {
                deltaRow = 1;
            }
            if (deltaRow + deltaCol != 0) {
                let pickedGem = this.gemAt(this.getGemRow(this.selectedGem) + deltaRow, this.getGemCol(this.selectedGem) + deltaCol);
                if (pickedGem.gemColor != -1) {
                    this.selectedGem.gemSprite!.setScale(1);
                    this.swapGems(this.selectedGem, pickedGem, true);
                    this.dragging = false;
                }
            }
        }
    }

    stopSwipe(): void {
        this.dragging = false;
    }

    areTheSame(gem1: gemList, gem2: gemList): boolean {
        return this.getGemRow(gem1) == this.getGemRow(gem2) && this.getGemCol(gem1) == this.getGemCol(gem2);
    }

    getGemRow(gem: gemList): number {
        let row = 0;
        if (gem.gemSprite != undefined) {
            row = Math.floor(gem.gemSprite.y / gameOptions.gemSize);
        }
        return row;
    }

    getGemCol(gem: gemList): number {
        let col = 0;
        if (gem.gemSprite != undefined) {
            col = Math.floor(gem.gemSprite.x / gameOptions.gemSize);
        }
        return col;
    }

    areNext(gem1: gemList, gem2: gemList): boolean {
        return Math.abs(this.getGemRow(gem1) - this.getGemRow(gem2)) + Math.abs(this.getGemCol(gem1) - this.getGemCol(gem2)) == 1;
    }

    swapGems(gem1: gemList, gem2:gemList, swapBack: boolean): void {
        this.swappingGems = 2;
        this.canPick = false;
        let fromColor = gem1.gemColor;
        let fromSprite = gem1.gemSprite;
        let toColor = gem2.gemColor;
        let toSprite = gem2.gemSprite;
        let gem1Row = this.getGemRow(gem1);
        let gem1Col = this.getGemCol(gem1);
        let gem2Row = this.getGemRow(gem2);
        let gem2Col = this.getGemCol(gem2);
        this.gameArray[gem1Row][gem1Col].gemColor = toColor;
        this.gameArray[gem1Row][gem1Col].gemSprite = toSprite;
        this.gameArray[gem2Row][gem2Col].gemColor = fromColor;
        this.gameArray[gem2Row][gem2Col].gemSprite = fromSprite;
        this.tweenGem(gem1, gem2, swapBack);
        this.tweenGem(gem2, gem1, swapBack);
    }

    tweenGem(gem1: gemList, gem2: gemList, swapBack: boolean): void {
        let row = this.getGemRow(gem1);
        let col = this.getGemCol(gem1);
        this.tweens.add({
            targets: this.gameArray[row][col].gemSprite,
            x: col * gameOptions.gemSize + gameOptions.gemSize / 2,
            y: row * gameOptions.gemSize + gameOptions.gemSize / 2,
            duration: gameOptions.swapSpeed,
            callbackScope: this,
            onComplete: () => {
                this.swappingGems--;
                if (this.swappingGems == 0) {
                    if (!this.matchInBoard() && swapBack) {
                        this.swapGems(gem1, gem2, false);
                    } else {
                        if (this.matchInBoard()) {
                            this.handleMatches();
                        } else {
                            this.canPick = true;
                            this.selectedGem = undefined;
                        }
                    }
                }
            }
        });
    }

    matchInBoard(): boolean {
        for (let i = 0; i < gameOptions.fieldSize; i++) {
            for (let j = 0; j < gameOptions.fieldSize; j++) {
                if (this.isMatch(i, j)) {
                    return true;
                }
            }
        }
        return false;
    }

    handleMatches(): void {
        this.removeMap = [];
        for (let i = 0; i < gameOptions.fieldSize; i++) {
            this.removeMap[i] = [];
            for (let j = 0; j < gameOptions.fieldSize; j++) {
                this.removeMap[i].push(0);
            }
        }
        this.markMatches(HORIZONTAL);
        this.markMatches(VERTICAL);
        this.destroyGems();
    }

    markMatches(direction: number): void {
        for (let i = 0; i < gameOptions.fieldSize; i++) {
            let colorStreak = 1;
            let currentColor = -1;
            let startStreak = 0;
            let colorToWatch = 0;
            for (let j = 0; j < gameOptions.fieldSize; j++) {
                if (direction == HORIZONTAL) {
                    colorToWatch = this.gemAt(i, j).gemColor;
                } else {
                    colorToWatch = this.gemAt(j, i).gemColor;
                }
                if (colorToWatch == currentColor) {
                    colorStreak++;
                }
                if (colorToWatch != currentColor || j == gameOptions.fieldSize - 1) {
                    if (colorStreak >= 3) {
                        if (direction == HORIZONTAL) {
                            console.log('HORIZONTAL :: Length = ' + colorStreak + ' :: Start = (' + i + ',' + startStreak + ') :: Color = ' + currentColor);
                        } else {
                            console.log('VERTICAL :: Length = ' + colorStreak + ' :: Start = (' + startStreak + ',' + i + ') :: Color = ' + currentColor);
                        }
                        for (let k = 0; k < colorStreak; k++) {
                            if (direction == HORIZONTAL) {
                                this.removeMap[i][startStreak + k]++;
                            } else {
                                this.removeMap[startStreak + k][i]++;
                            }
                        }
                    }
                    startStreak = j;
                    colorStreak = 1;
                    currentColor = colorToWatch;
                }
            }
        }
    }

    destroyGems(): void {
        let destroyed = 0;
        for (let i = 0; i < gameOptions.fieldSize; i++) {
            for (let j = 0; j < gameOptions.fieldSize; j++) {
                if (this.removeMap[i][j] > 0) {
                    destroyed++;
                    this.tweens.add({
                        targets: this.gameArray[i][j].gemSprite,
                        alpha: 0.5,
                        duration: gameOptions.destroySpeed,
                        callbackScope: this,
                        onComplete: () => {
                            destroyed--;
                            this.gameArray[i][j].gemSprite!.visible = false;
                            // @ts-ignore
                            this.poolArray.push(this.gameArray[i][j].gemSprite);
                            if (destroyed == 0) {
                                this.makeGemsFall();
                                this.replenishField();
                            }
                        }
                    });
                    this.gameArray[i][j].isEmpty = true;
                }
            }
        }
    }

    makeGemsFall(): void {
        for (let i = gameOptions.fieldSize - 2; i >= 0; i--) {
            for (let j = 0; j < gameOptions.fieldSize; j++) {
                if (!this.gameArray[i][j].isEmpty) {
                    let fallTiles = this.holesBelow(i, j);
                    if (fallTiles > 0) {
                        this.tweens.add({
                            targets: this.gameArray[i][j].gemSprite,
                            y: this.gameArray[i][j].gemSprite!.y + fallTiles * gameOptions.gemSize,
                            duration: gameOptions.fallSpeed * fallTiles
                        });
                        this.gameArray[i + fallTiles][j] = {
                            gemSprite: this.gameArray[i][j].gemSprite,
                            gemColor: this.gameArray[i][j].gemColor,
                            isEmpty: false
                        }
                        this.gameArray[i][j].isEmpty = true;
                    }
                }
            }
        }
    }

    holesBelow(row: number, col: number): number {
        let result = 0
        for (let i = row; i < gameOptions.fieldSize; i++) {
            if (this.gameArray[i][col].isEmpty) {
                result++;
            }
        }
        return result;
    }

    replenishField(): void {
        let replenished = 0;
        for (let j = 0; j < gameOptions.fieldSize; j++) {
            let emptySpots = this.holesInCol(j);
            if (emptySpots > 0) {
                for (let i = 0; i < emptySpots; i++) {
                    replenished ++;
                    let randomColor = Phaser.Math.Between(0, gameOptions.gemColors - 1);
                    this.gameArray[i][j].gemColor = randomColor;
                    // @ts-ignore
                    this.gameArray[i][j].gemSprite = this.poolArray.pop()
                    // @ts-ignore
                    this.gameArray[i][j].gemSprite.setFrame(randomColor);
                    // @ts-ignore
                    this.gameArray[i][j].gemSprite.visible = true;
                    // @ts-ignore
                    this.gameArray[i][j].gemSprite.x = gameOptions.gemSize * j + gameOptions.gemSize / 2;
                    // @ts-ignore
                    this.gameArray[i][j].gemSprite.y = gameOptions.gemSize / 2 - (emptySpots - i) * gameOptions.gemSize;
                    // @ts-ignore
                    this.gameArray[i][j].gemSprite.alpha = 1;
                    this.gameArray[i][j].isEmpty = false;
                    this.tweens.add({
                        targets: this.gameArray[i][j].gemSprite,
                        y: gameOptions.gemSize * i + gameOptions.gemSize / 2,
                        duration: gameOptions.fallSpeed * emptySpots,
                        callbackScope: this,
                        onComplete: () =>{
                            replenished --;
                            if (replenished == 0) {
                                if (this.matchInBoard()) {
                                    this.time.addEvent({
                                        delay: 250,
                                        callback: () => this.handleMatches()
                                    });
                                }
                                else{
                                    this.canPick = true;
                                    this.selectedGem = undefined;
                                }
                            }
                        }
                    });
                }
            }
        }
    }

    holesInCol(col: number): number {
        let result = 0;
        for (let i = 0; i < gameOptions.fieldSize; i++) {
            if (this.gameArray[i][col].isEmpty) {
                result++;
            }
        }
        return result;
    }

}