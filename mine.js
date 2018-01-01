const DEFAULT_ROWS = 8;
const DEFAULT_COLUMNS = 8;
const DEFAULT_MINES = 8;

class MineSpot {
  constructor(clickCallback, flagCallback) {
    this.value = 0;
    this.element = document.createElement('td');
    this.element.className = 'mine-spot';
    this.button = document.createElement('button');
    this.button.className = 'mine-button';
    this.button.onclick = () => this.processClick();
    this.button.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      this.toggleFlag();
      return false;
    }, false);
    this.element.appendChild(this.button);
    this.clickCallback = clickCallback;
    this.flagCallback = flagCallback;
  }

  readyForWin() {
    const isMarkedMine =
      this.value === -1 &&
      !this.button.disabled &&
      this.button.innerText === String.fromCodePoint(128681);
    const isClearedNonMine =
      this.value !== -1 &&
      this.button.disabled;
    return isMarkedMine || isClearedNonMine;
  }

  setWon() {
    if (this.value === -1) {
      this.button.disabled = true;
      this.button.innerText = String.fromCodePoint(128512);
    }
  }

  toggleFlag() {
    if (this.button.innerText) {
      this.button.innerText = '';
    } else {
      this.button.innerText = String.fromCodePoint(128681);
    }
    this.flagCallback();
  }

  getText() {
    if (this.value === 0) return '';
    if (this.value === -1) return String.fromCodePoint(128163);
    return '' + this.value;
  }

  placeMine() {
    this.value = -1;
  }

  isMine() {
    return this.value === -1;
  }

  increment() {
    this.value++;
  }

  forceClick() {
    this.button.click();
  }

  processClick() {
    if (!this.button.disabled) {
      this.button.disabled = true;
      this.button.innerText = this.getText();
    }

    this.clickCallback(this.value);
  }
}

class MineBoard {
  constructor(numRows, numCols, mines) {
    this.numRows = numRows;
    this.numCols = numCols;
    this.spaces = [];
    this.allCoordinates = [];
    this.rootElement = document.createElement('table');
    this.rootElement.className = 'mine-board';

    // Set the empty board.
    for (let i = 0; i < numRows; i++) {
      const row = [];
      const rowElement = document.createElement('tr');
      rowElement.className = 'mine-row';
      for (let j = 0; j < numCols; j++) {
        const mineSpot = new MineSpot((isMine) => this.afterClick(i, j, isMine), () => this.checkForWin());
        row.push(mineSpot);
        rowElement.appendChild(mineSpot.element);
        this.allCoordinates.push([i, j]);
      }
      this.spaces.push(row);
      this.rootElement.appendChild(rowElement);
    }

    // Place all mines.
    let spacesLeft = numRows * numCols;
    let minesLeft = mines;

    const shouldPlaceMine = () =>
      Math.random() < (minesLeft / spacesLeft);

    this.allCoordinates.forEach(([row, col]) => {
      if (shouldPlaceMine()) {
        this.spaces[row][col].placeMine();
        minesLeft--;
      }
      spacesLeft--;
    });

    // Add all mine counts.
    this.allCoordinates.forEach(([row, col]) => {
      if (this.spaces[row][col].isMine()) return;

      this.forEachNeighbor(row, col, ([i, j]) => {
        if (this.spaces[i][j].isMine()) {
          this.spaces[row][col].increment();
        }
      });
    });
  }

  afterClick(row, col, value) {
    if (value === -1) {
      this.allCoordinates.forEach(([i, j]) => this.spaces[i][j].forceClick())
    } else if (value === 0) {
      this.forEachNeighbor(row, col, ([i, j]) => {
        const horizontal = row === i;
        const vertical = col === j;
        if ((horizontal || vertical) || this.spaces[i][j].value > 0) {
          this.spaces[i][j].forceClick();
        }
      });
    }
    this.checkForWin();
  }

  forEachNeighbor(row, col, operation) {
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        const isSame = i === row && j === col;
        const onBoard = i >= 0 && i < this.numRows && j >= 0 && j < this.numRows;
        if (onBoard && !isSame) {
          operation([i, j]);
        }
      }
    }
  }

  checkForWin() {
    if (this.allCoordinates.every(([i, j]) => this.spaces[i][j].readyForWin())) {
      this.allCoordinates.forEach(([i, j]) => this.spaces[i][j].setWon());
    }
  }
}

class ControlPanel {
  constructor(submitCallback) {
    const formElement = document.createElement('form');
    formElement.className = 'mine-controls';
    this.formElement = formElement;

    const rowsControl = document.createElement('input');
    rowsControl.type = 'number';
    rowsControl.value = DEFAULT_ROWS;
    rowsControl.name = 'rows-control';

    const rowsLabel = document.createElement('label');
    rowsLabel.innerText = 'Rows';
    rowsLabel.for = 'rows-control';

    const columnsControl = document.createElement('input');
    columnsControl.type = 'number';
    columnsControl.value = DEFAULT_COLUMNS;
    columnsControl.name = 'columns-control';

    const columnsLabel = document.createElement('label');
    columnsLabel.innerText = 'Columns';
    columnsLabel.for = 'columns-control';

    const minesControl = document.createElement('input');
    minesControl.type = 'number';
    minesControl.value = DEFAULT_MINES;
    minesControl.name = 'mines-control';

    const minesLabel = document.createElement('label');
    minesLabel.innerText = 'Mines';
    minesLabel.for = 'mines-control';

    const submitButton = document.createElement('input');
    submitButton.type = 'submit';
    submitButton.value = 'Start';

    [
      rowsLabel,
      rowsControl,
      columnsLabel,
      columnsControl,
      minesLabel,
      minesControl,
      submitButton,
    ].forEach(
      (el) => formElement.appendChild(el)
    );

    formElement.onsubmit = (event) => {
      event.preventDefault();
      submitCallback({
        rows: rowsControl.value,
        columns: columnsControl.value,
        mines: minesControl.value,
      });
    };
  }
}

const startGame = ({rows, columns, mines}) => {
  const currentGame = document.getElementById('current-game');
  if (currentGame) {
    document.body.removeChild(currentGame);
  }
  const mineBoard = new MineBoard(rows, columns, mines);
  mineBoard.rootElement.id = 'current-game';
  document.body.appendChild(mineBoard.rootElement);
};

const controlPanel = new ControlPanel(startGame);
document.body.appendChild(controlPanel.formElement);

startGame({rows: DEFAULT_ROWS, columns: DEFAULT_COLUMNS, mines: DEFAULT_MINES});
