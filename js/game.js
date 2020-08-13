const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const rows = parseInt(urlParams.get('rows'));
const cols = parseInt(urlParams.get('cols'));
const mineCount = parseInt(urlParams.get('mines'));
const fieldType = {
    open: 'field-open',
    close: 'field-close',
    mine: 'field-mine',
    flag: 'field-flag'
};


const game = {
    init: function () {
        function drawBoard() {
            const minePlaces = getRandomMineIndexes(mineCount, cols, rows);

            let gameField = document.querySelector(".game-field");
            setGameFieldSize(gameField, rows, cols);
            let cellIndex = 0
            for (let row = 0; row < rows; row++) {
                const rowElement = addRow(gameField);
                for (let col = 0; col < cols; col++) {
                    addCell(rowElement, row, col, minePlaces.has(cellIndex));
                    cellIndex++;
                }
            }
        }

        function getRandomMineIndexes(mineCount, cols, rows) {
            const cellCount = cols * rows;
            let mines = new Set();
            do {
                mines.add(Math.round(Math.random() * (cellCount - 1)));
            } while (mines.size < mineCount && mines.size < cellCount);
            return mines;
        }

        function setGameFieldSize(gameField, rows, cols) {
            gameField.style.width = (gameField.dataset.cellWidth * rows) + 'px';
            gameField.style.height = (gameField.dataset.cellHeight * cols) + 'px';
        }

        function addRow(gameField) {
            gameField.insertAdjacentHTML(
                'beforeend',
                '<div class="row"></div>'
            );
            return gameField.lastElementChild;
        }

        function addCell(rowElement, row, col, isMine) {
            rowElement.insertAdjacentHTML(
                'beforeend',
                `<div class="field-${isMine ? 'mine' : 'close'}" 
                            data-row="${row}" 
                            data-col="${col}"
                            data-flagged="false"></div>`);
        }

        drawBoard();
    },

    engine: function () {
        function createNewGame() {
            // delete old game fields
            let board = document.querySelectorAll('.row');
            for (row = 0; row < board.length; row++) {
                board.item(row).remove();
            }

            // create new board
            game.init();
        }

        function clickOnFieldHandler(event) {
            const cField = event.target;
            const cFieldPos = {
                x: parseInt(cField.dataset.col),
                y: parseInt(cField.dataset.row)
            };

            function checkNeighborMineNumber() {
                const board = Array.from(document.querySelectorAll('div[data-row]'));  // all fields on the board

                function getFieldToCheck(seekedX, seekedY) {
                    let field = board.find(function (node) {
                        return parseInt(node.dataset.col) === seekedX && parseInt(node.dataset.row) === seekedY;
                    });
                    return field
                }

                // ------------- checkNeighborMineNumber() main code -------------
                let mineNumber = 0;
                for (x = -1; x <= 1; x++) {
                    for (y = -1; y <= 1; y++) {
                        posX = cFieldPos.x + x;
                        posY = cFieldPos.y + y;

                        // boundary conditions
                        if (x == 0 && y === 0) { continue; }  // the own field
                        if (posX < 0 || posX >= cols || posY < 0 || posY >= rows) { continue; }  // out of the board

                        // looks for the mine
                        let fieldToCheck = getFieldToCheck(posX, posY);
                        if (fieldToCheck.className === fieldType.mine) {
                            mineNumber++;
                        }
                    }
                }

                return mineNumber;
            }

            // ------------- clickOnFieldHandler() main code -------------
            if (cField.dataset.flagged === "true") { return; };

            switch (cField.className) {  // the field type
                case fieldType.close:
                    let mineNumber = checkNeighborMineNumber();
                    cField.setAttribute('class', fieldType.open);
                    if (mineNumber > 0) { cField.textContent = mineNumber; }
                    break;

                case fieldType.mine:
                    cField.style.backgroundImage = 'url("/img/mine-selected.png")';

                    // schow all mines
                    const rules = document.styleSheets[0].cssRules;
                    for (index in rules) {
                        if (rules[index].selectorText === '.game-field .row .field-mine') {
                            rules[index].style.background = 'url("/img/mine.png")';
                            break;
                        }
                    }
                    break;
            }
        }

        function flagOnFieldHandler(event) {
            const cField = event.target;

            // ------------- flagOnFieldHandler() main code -------------
            if (cField.className === fieldType.close || cField.className === fieldType.mine) {
                switch (cField.dataset.flagged) {
                    case "false":  // place the flag
                        if (mineLeftCounter.value > 0) {
                            cField.dataset.flagged = "true";
                            cField.style.backgroundImage = 'url("/img/flag.png")';
                            mineLeftCounter.value--;
                        }
                        break;

                    case "true":  // remove the flag
                        cField.dataset.flagged = "false";
                        cField.removeAttribute('style');
                        mineLeftCounter.value++;
                        break;
                }
            };

            // prevent to show the menu
            event.preventDefault()
            return false;
        }

        // ------------- engine() main code -------------
        let mineLeftCounter = document.querySelector('#mine-left-counter');
        mineLeftCounter.value = mineCount;

        const gameButton = document.querySelector('#game-button');
        gameButton.addEventListener('click', createNewGame);

        const boardContainer = document.querySelector('.game-field');
        boardContainer.addEventListener('click', clickOnFieldHandler);
        boardContainer.addEventListener('contextmenu', flagOnFieldHandler);
    }
};


game.init();
game.engine();
