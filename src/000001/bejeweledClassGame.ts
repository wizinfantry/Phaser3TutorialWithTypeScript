/**
 *  width: 900,
    height: 900,
    scene: playGame,
    backgroundColor: 0x222222
 */

import Phaser from 'phaser';

export const gameOptions = {
    gemSize: 100,
    swapSpeed: 200,
    fallSpeed: 100,
    destroySpeed: 200,
    boardOffset: {
        x: 100,
        y: 50
    }
}

export class playGame extends Phaser.Scene {
    match3!: Match3;
    canPick!: boolean;
    dragging!: boolean;
    poolArray!: Phaser.GameObjects.Sprite[];
    swappingGems!: number;
    constructor() {
        super('playGame');
    }

    preload(): void {
        this.load.setBaseURL('image/');
        this.load.spritesheet('gems', 'gems.png', {
            frameWidth: gameOptions.gemSize,
            frameHeight:gameOptions.gemSize
        });
    }

    create(): void {
        this.match3 = new Match3({
            rows: 8,
            columns: 7,
            items: 6
        });
        this.match3.generateField();
        this.canPick = true;
        this.dragging = false;
        this.drawField();
        this.input.on('pointerdown', this.gemsSelect, this);
    }

    drawField(): void {
        this.poolArray = [];
        for (let i = 0; i < this.match3.getRows(); i++) {
            for (let j = 0; j < this.match3.getColumns(); j++) {
                let gemX = gameOptions.boardOffset.x + gameOptions.gemSize * j + gameOptions.gemSize / 2;
                let gemY = gameOptions.boardOffset.y + gameOptions.gemSize * i + gameOptions.gemSize / 2;
                let gem = this.add.sprite(gemX, gemY, 'gems', Number(this.match3.valueAt(i, j)));
                this.match3.setCustomData(i, j, gem);
            }
        }
    }

    gemsSelect(pointer: Phaser.Input.Pointer): void {
        if (this.canPick) {
            this.dragging = true;
            let row = Math.floor((pointer.y - gameOptions.boardOffset.y) / gameOptions.gemSize);
            let col = Math.floor((pointer.x - gameOptions.boardOffset.x) / gameOptions.gemSize);
            if (this.match3.validPick(row, col)) {
                let selectedGem = this.match3.getSelectedItem();
                if (typeof selectedGem === 'boolean' && !selectedGem) {
                    (this.match3.customDataOf(row, col) as Phaser.GameObjects.Sprite).setScale(1.2);
                    (this.match3.customDataOf(row, col) as Phaser.GameObjects.Sprite).setDepth(1);
                    this.match3.setSelectedItem(row, col);
                }
                if (typeof selectedGem !== 'boolean') {
                    if (this.match3.areNext(row, col, selectedGem.row, selectedGem.column)) {
                        (this.match3.customDataOf(selectedGem.row, selectedGem.column) as Phaser.GameObjects.Sprite).setScale(1);
                        this.match3.deleselectItem();
                        this.swapGems(row, col, selectedGem.row, selectedGem.column, true);
                    } else {
                        (this.match3.customDataOf(selectedGem.row, selectedGem.column) as Phaser.GameObjects.Sprite).setScale(1);
                        (this.match3.customDataOf(row, col) as Phaser.GameObjects.Sprite).setScale(1.2);
                        this.match3.setSelectedItem(row, col);
                    }
                }
            }
        }
    }

    swapGems(row: number, col: number, row2: number, col2: number, swapBack: boolean): void {
        let movements = this.match3.swapItems(row, col, row2, col2);
        this.swappingGems = 2;
        this.canPick = false;
        movements.forEach((movement) => {
            let target = <Phaser.GameObjects.Sprite>this.match3.customDataOf(movement.row, movement.column)
            this.tweens.add({
                targets: target,
                x: target.x + gameOptions.gemSize * movement.deltaColumn,
                y: target.y + gameOptions.gemSize * movement.deltaRow,
                duration: gameOptions.swapSpeed,
                callbackScope: this,
                onComplete: () => {
                    this.swappingGems--;
                    if (this.swappingGems == 0) {
                        if (!this.match3.matchInBoard()){
                            if (swapBack) {
                                this.swapGems(row, col, row2, col2, false);
                            } else {
                                this.canPick = true;
                            }
                        } else {
                            this.handleMatches();
                        }
                    }
                }
            });
        });
    }

    handleMatches(): void {
        let gemsToRemove = this.match3.getMatchList();
        let destroyed = 0;
        gemsToRemove.forEach((gem) => {
            let target: Phaser.GameObjects.Sprite = this.match3.customDataOf(gem.row, gem.column)
            this.poolArray.push(target);
            destroyed++;
            this.tweens.add({
                targets: target,
                alpha: 0,
                duration: gameOptions.destroySpeed,
                callbackScope: this,
                onComplete: () => {
                    destroyed--;
                    if (destroyed == 0) {
                        this.makeGemsFall();
                    }
                }
            });
        });
    }

    makeGemsFall(): void {
        let moved = 0;
        this.match3.removeMatches()
        let fallingMovements = this.match3.arrangeBoardAfterMatch();
        fallingMovements.forEach((movement) => {
            moved++;
            let target: Phaser.GameObjects.Sprite = this.match3.customDataOf(movement.row, movement.column);
            this.tweens.add({
                targets: target,
                y: target.y + movement.deltaRow * gameOptions.gemSize,
                duration: gameOptions.fallSpeed * Math.abs(movement.deltaRow),
                callbackScope: this,
                onComplete: () => {
                    moved--;
                    if (moved == 0) {
                        this.endOfMove();
                    }
                }
            });
        });
        let replenishMovements = this.match3.replenishBoard();
        replenishMovements.forEach((movement) => {
            moved++;
            let sprite = this.poolArray.pop();
            sprite = <Phaser.GameObjects.Sprite>sprite;
            sprite.alpha = 1;
            sprite.y = gameOptions.boardOffset.y + gameOptions.gemSize * (movement.row - movement.deltaRow + 1) - gameOptions.gemSize / 2;
            sprite.x = gameOptions.boardOffset.x + gameOptions.gemSize * movement.column + gameOptions.gemSize / 2,
            sprite.setFrame(Number(this.match3.valueAt(movement.row, movement.column)));
            this.match3.setCustomData(movement.row, movement.column, sprite);
            this.tweens.add({
                targets: sprite,
                y: gameOptions.boardOffset.y + gameOptions.gemSize * movement.row + gameOptions.gemSize / 2,
                duration: gameOptions.fallSpeed * movement.deltaRow,
                callbackScope: this,
                onComplete: () => {
                    moved--;
                    if (moved == 0) {
                        this.endOfMove();
                    }
                }
            });
        });
    }

    endOfMove(): void {
        if (this.match3.matchInBoard()) {
            this.time.addEvent({
                delay: 250,
                callback: () => this.handleMatches()
            });
        } else {
            this.canPick = true;
            // this.selectedGem = nudefined;
        }
    }

}

export class Match3 {
    rows: number;
    columns: number;
    items: number;
    gameArray: {value: number, isEmpty: boolean, row: number, column: number, customData: any}[][];
    selectedItem: {row: number, column: number} | boolean;

    constructor(obj: {rows: number, columns: number, items: number}) {
        this.rows = obj.rows;
        this.columns = obj.columns;
        this.items = obj.items;
    }

    /**
     * generates the game field
     */
    generateField(): void {
        this.gameArray = [];
        this.selectedItem = false;
        for (let i = 0; i < this.rows; i++) {
            this.gameArray[i] = [];
            for (let j = 0; j < this.columns; j++) {
                do {
                    let randomValue = Math.floor(Math.random() * this.items);
                    this.gameArray[i][j] = {
                        value: randomValue,
                        isEmpty: false,
                        row: i,
                        column: j,
                        customData: undefined
                    }
                } while (this.isPartOfMatch(i, j));
            }
        }
    }

    /**
     * returns true if there is a match in the board
     */
    matchInBoard(): boolean {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                if (this.isPartOfMatch(i, j)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * returns true if the item at (row, column) is part of a match
     */
    isPartOfMatch(row: number, column: number): boolean {
        return this.isPartOfHorizontalMatch(row, column) || this.isPartOfVerticalMatch(row, column);
    }

    /**
     * returns true if the item at (row, column) is part of an horizontal match
     */
    isPartOfHorizontalMatch(row: number, column: number): boolean {
        return this.valueAt(row, column) === this.valueAt(row, column - 1) && this.valueAt(row, column) === this.valueAt(row, column - 2) ||
                this.valueAt(row, column) === this.valueAt(row, column + 1) && this.valueAt(row, column) === this.valueAt(row, column + 2) ||
                this.valueAt(row, column) === this.valueAt(row, column - 1) && this.valueAt(row, column) === this.valueAt(row, column + 1);
    }

    /**
     * returns true if the item at (row, column) is part of an vertical match
     */
    isPartOfVerticalMatch(row: number, column: number): boolean {
        return this.valueAt(row, column) === this.valueAt(row - 1, column) && this.valueAt(row, column) === this.valueAt(row - 2, column) ||
                this.valueAt(row, column) === this.valueAt(row + 1, column) && this.valueAt(row, column) === this.valueAt(row + 2, column) ||
                this.valueAt(row, column) === this.valueAt(row - 1, column) && this.valueAt(row, column) === this.valueAt(row + 1, column)
    }

    /**
     * returns the value of the item at (row, column), or -1 if it's not a valid pick
     */
    valueAt(row: number, column: number): number | boolean {
        if (!this.validPick(row, column)) {
            return false;
        }
        return this.gameArray[row][column].value;
    }

    /**
     * returns true if the item at (row, column) is a valid pick
     */
    validPick(row: number, column: number): boolean {
        return row >= 0 && row < this.rows && column >= 0 && column < this.columns && this.gameArray[row] != undefined && this.gameArray[row][column] != undefined;
    }

    /**
     * returns the number of board rows
     */
    getRows(): number {
        return this.rows;
    }

    /**
     * returns the number of board columns
     */
    getColumns(): number {
        return this.columns;
    }

    /**
     * sets a custom data on the item at (row, column)
     */
    setCustomData(row: number, column: number, customData: any): void {
        this.gameArray[row][column].customData = customData;
    }

    /**
     * returns the custom data of the item at (row, column)
     */
    customDataOf(row: number, columns: number): any {
        return this.gameArray[row][columns].customData;
    }

    /**
     * returns the selected item
     */
    getSelectedItem(): {row: number, column: number} | boolean {
        return this.selectedItem;
    }

    /**
     * set the selected item as a {row, column} object
     */
    setSelectedItem(row: number, column: number) {
        this.selectedItem = {
            row: row,
            column: column
        }
    }

    /**
     * deleselects any item
     */
    deleselectItem() {
        this.selectedItem = false;
    }

    /**
     * check if the item at (row, column) is the same as the item at (row2, column2)
     */
    areTheSame(row: number, column: number, row2: number, column2: number): boolean {
        return row == row2 && column == column2;
    }

    /**
     * returns true if at (row, column) and (row2, column2) ar next to each other horizontally or vertically
     */
    areNext(row: number, column: number, row2: number, column2: number): boolean {
        return Math.abs(row - row2) + Math.abs(column - column2) == 1;
    }

    /**
     * swap the items at (row, column) and (row2, column2) and returns an object with movement information
     */
    swapItems(row: number, column: number, row2: number, column2: number): {row: number, column: number, deltaRow: number, deltaColumn: number}[] {
        let tempObject = Object.assign(this.gameArray[row][column]);
        this.gameArray[row][column] = Object.assign(this.gameArray[row2][column2]);
        this.gameArray[row2][column2] = Object.assign(tempObject);
        return [{
            row: row,
            column: column,
            deltaRow: row - row2,
            deltaColumn: column - column2
        },
        {
            row: row2,
            column: column2,
            deltaRow: row2 - row,
            deltaColumn: column2 - column
        }]
    }

    /**
     * return the items part of match in the board as an array of {row, column} object
     */
    getMatchList(): {row: number, column: number}[] {
        let matches = [];
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                if (this.isPartOfMatch(i, j)) {
                    matches.push({
                        row: i,
                        column: j
                    });
                }
            }
        }
        return matches;
    }

    /**
     * rmeoves all items forming a match
     */
    removeMatches() {
        let matches = this.getMatchList();
        matches.forEach((item) => {
            this.setEmpty(item.row, item.column)
        })
    }

    /**
     * set the item at (row, column) as empty
     */
    setEmpty(row: number, column: number): void {
        this.gameArray[row][column].isEmpty = true;
    }

    /**
     * returns true if the item at (row, column) is empty
     */
    isEmpty(row: number, column: number): boolean {
        return this.gameArray[row][column].isEmpty;
    }

    /**
     * returns the amount of empty space below the item at (row, column)
     */
    emptySpacesBelow(row: number, column: number): number {
        let result = 0;
        if (row != this.getRows()) {
            for (let i = row + 1; i < this.getRows(); i ++) {
                if (this.isEmpty(i, column)) {
                    result++;
                }
            }
        }
        return result;
    }

    /**
     * arranges the board after a match, making items fall down. Returns an object with movement information
     */
    arrangeBoardAfterMatch(): {row: number, column: number, deltaRow: number, deltaColumn: number}[] {
        let result = []
        for(let i = this.getRows() - 2; i >= 0; i--) {
            for(let j = 0; j < this.getColumns(); j++) {
                let emptySpaces = this.emptySpacesBelow(i, j);
                if (!this.isEmpty(i, j) && emptySpaces > 0) {
                    this.swapItems(i, j, i + emptySpaces, j)
                    result.push({
                        row: i + emptySpaces,
                        column: j,
                        deltaRow: emptySpaces,
                        deltaColumn: 0
                    });
                }
            }
        }
        return result;
    }

    /**
     * replenished the board and returns an object with movement information
     */
    replenishBoard(): {row: number, column: number, deltaRow: number, deltaColumn: number}[] {
        let result = [];
        for (let i = 0; i < this.getColumns(); i++) {
            if (this.isEmpty(0, i)) {
                let emptySpaces = this.emptySpacesBelow(0, i) + 1;
                for (let j = 0; j < emptySpaces; j++) {
                    let randomValue = Math.floor(Math.random() * this.items);
                    result.push({
                        row: j,
                        column: i,
                        deltaRow: emptySpaces,
                        deltaColumn: 0
                    });
                    this.gameArray[j][i].value = randomValue;
                    this.gameArray[j][i].isEmpty = false;
                }
            }
        }
        return result;
    }
}