// --------------------------------------------------------------------------------------------------------------------
//                                                    The minesweeper
// version: 1.0.0
// contributors: Piotr Młudzik
// --------------------------------------------------------------------------------------------------------------------


const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const rows = parseInt(urlParams.get('rows'));
const cols = parseInt(urlParams.get('cols'));
const mineLeftCounter = document.querySelector('#mine-left-counter');
const timerCounter = document.querySelector('#elapsed-time-counter');

const fieldType = {
    open: 'field-open',
    closed: 'field-closed',
    mine: 'field-mine',
    flag: 'field-flag'
};

let timerIntervalID = null;


// -------------------------------------------------- main functions --------------------------------------------------
function gameInit() {
    function drawBoard() {
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
                `<div class="field-${isMine ? 'mine' : 'closed'}" 
                            data-row="${row}" 
                            data-col="${col}"
                            data-flagged="false"></div>`);
        }

        // ------------- drawBoard() main code -------------
        const minePlaces = getRandomMineIndexes(mineLeftCounter.value, cols, rows);

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

    function showMineLeftValue() {
        const mineCount = parseInt(urlParams.get('mines'));
        mineLeftCounter.value = mineCount;
    }

    // ------------- init() main code -------------
    showMineLeftValue();
    drawBoard();
}

function gameEngine() {
    // ----------------------------------------------- common functions ------------------------------------------------
    function allMinesChangeGraphic(urlGraphic) {
        const rules = document.styleSheets[0].cssRules;
        for (let index in rules) {
            if (rules[index].selectorText === '.game-field .row .field-mine') {
                rules[index].style.background = urlGraphic;
                break;
            }
        }
    }

    // ------------------------------------------------ timer functions ------------------------------------------------
    function showTime() {
        timerCounter.value++;
    }

    function timerStart() {
        timerIntervalID = setInterval(showTime, 1000);
    }

    function timerStop() {
        clearInterval(timerIntervalID);
        timerIntervalID = null;
    }

    function timerReset() {
        timerCounter.value = 0;
    }

    // ---------------------------------------------- checking functions -----------------------------------------------
    function isFlagged(field) {
        return field.dataset.flagged === "true";
    }

    function isMine(field) {
        return field.className === fieldType.mine;
    }

    function isNotClosedAndNotMine(field) {
        return field.className === fieldType.closed || field.className === fieldType.mine;
    }

    function isTimerNotRunning() {
        return timerIntervalID === null;
    }

    // ----------------------------------------- html objects event listeners -----------------------------------------
    function addGameButtonEventListener () {
        const gameButton = document.querySelector('#game-button');
        gameButton.addEventListener('click', createNewGameHandler);
    }

    function addFieldsEventListener() {
        const boardContainer = document.querySelector('.game-field');
        boardContainer.addEventListener('click', clickOnFieldHandler);
        boardContainer.addEventListener('contextmenu', flagOnFieldHandler);
    }

    function removeFieldsEventListener() {
        const boardContainer = document.querySelector('.game-field');
        boardContainer.removeEventListener('click', clickOnFieldHandler);
        boardContainer.removeEventListener('contextmenu', flagOnFieldHandler);
    }

    // ----------------------------------------- handlers for event listener ------------------------------------------
    function createNewGameHandler() {
        function deleteGameFields() {
            let board = document.querySelectorAll('.row');
            for (let row = 0; row < board.length; row++) {
                board.item(row).remove();
            }
        }

        // ------------- createNewGameHandler main code -------------
        deleteGameFields();
        allMinesChangeGraphic('url("/img/field-closed.png")')  // hide all mines
        gameInit();  // create new board
        timerReset();
        addFieldsEventListener();
    }

    function clickOnFieldHandler(event) {
        function openField(field, fieldPos) {
            function checkNeighborMineNumber(fieldPos) {
                function getFieldToCheck(seekedX, seekedY) {
                    return board.find(function (node) {
                        return parseInt(node.dataset.col) === seekedX && parseInt(node.dataset.row) === seekedY;
                    })
                }

                // ------------- checkNeighborMineNumber() main code -------------
                const board = Array.from(document.querySelectorAll('div[data-row]'));  // all fields on the board

                let neighborMineNumber = 0;
                for (let x = -1; x <= 1; x++) {  // loop for cols
                    for (let y = -1; y <= 1; y++) {  // loop for rows
                        let posX = fieldPos.x + x;
                        let posY = fieldPos.y + y;
    
                        // boundary conditions
                        if (x === 0 && y === 0) { continue; }  // the own field
                        if (posX < 0 || posX >= cols || posY < 0 || posY >= rows) { continue; }  // out of the board
    
                        // looks for the mine
                        let fieldToCheck = getFieldToCheck(posX, posY);
                        if (isMine(fieldToCheck)) { neighborMineNumber++; }
                    }
                }
    
                return neighborMineNumber;
            }

            // ------------- openField() main code -------------
            field.setAttribute('class', fieldType.open);
            let neighborMineNumber = checkNeighborMineNumber(fieldPos);
            if (neighborMineNumber > 0) { field.textContent = neighborMineNumber; }
        }

        function gameOver(field) {
            timerStop();
            field.style.backgroundImage = 'url("/img/mine-selected.png")';
            allMinesChangeGraphic('url("/img/mine.png")');  // show all mines
            removeFieldsEventListener();  // block fields from clicking
        }

        // ------------- clickOnFieldHandler() main code -------------
        const cField = event.target;
        const cFieldPos = {x: parseInt(cField.dataset.col), y: parseInt(cField.dataset.row)};

        if (isTimerNotRunning()) { timerStart(); }
        if (isFlagged(cField)) { return; }  // block the flagged field

        switch (cField.className) {  // the field type
            case fieldType.closed:
                openField(cField, cFieldPos);
                break;
            case fieldType.mine:
                gameOver(cField);
                break;
        }
    }

    function flagOnFieldHandler(event) {
        function placeFlag() {
            if (mineLeftCounter.value > 0) {
                cField.dataset.flagged = "true";
                cField.style.backgroundImage = 'url("/img/flag.png")';
                mineLeftCounter.value--;
            }
        }

        function removeFlag() {
            cField.dataset.flagged = "false";
            cField.removeAttribute('style');
            mineLeftCounter.value++;
        }

        // ------------- flagOnFieldHandler() main code -------------
        if (isTimerNotRunning()) { timerStart(); }

        const cField = event.target;
        if (isNotClosedAndNotMine(cField)) {
            switch (cField.dataset.flagged) {
                case "false":
                    placeFlag();
                    break;
                case "true":
                    removeFlag();
                    break;
            }
        }

        // prevent to show the menu
        event.preventDefault();
        return false;
    }

    // ------------- engine() main code -------------
    addGameButtonEventListener();
    addFieldsEventListener();
}


// ------------------------------------------------- the main script --------------------------------------------------
gameInit();
gameEngine();
