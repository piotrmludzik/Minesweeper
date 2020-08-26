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
const gameButton = document.querySelector('#game-button');
const timerCounter = document.querySelector('#elapsed-time-counter');

const fieldType = {
    opended: 'field-opended',
    closed: 'field-closed',
    mine: 'field-mine',
    flag: 'field-flag'
};

const minesNumberColor = {
    1: 'blue',
    2: 'green',
    3: 'red',
    4: 'darkblue',
    5: 'darkred',
    6: 'darkcyan',
    7: 'black',
    8: 'darkgray'
};

const buttonName = {
    gameInProgress: 'inprogress',
    win: 'win',
    gameOver: 'gameover'
}

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

        function addCell(rowElement, row, col, isMined) {
            rowElement.insertAdjacentHTML(
                'beforeend',
                `<div class="field-${isMined ? 'mine' : 'closed'}" 
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

    function changeGameButton(name) {
        gameButton.src = `img/game_${name}.png`;
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
    function isClosed(field) {
        return field.className === fieldType.closed;
    }

    function isMined(field) {
        return field.className === fieldType.mine;
    }

    function isFlagged(field) {
        return field.dataset.flagged === "true";
    }

    function isNoMinesInNeighborhood(field) {
        return !field.textContent;
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

        // ------------- createNewGameHandler() main code -------------
        deleteGameFields();
        allMinesChangeGraphic('url("/img/field-closed.png")')  // hide all mines
        changeGameButton(buttonName.gameInProgress);
        gameInit();  // create new board
        timerReset();
        addFieldsEventListener();
    }

    function clickOnFieldHandler(event) {
        function isOutOfTheBoard(mainField, neighborField) {
            return (neighborField.x < 0 || neighborField.y < 0 || neighborField.x >= cols || neighborField.y >= rows)
        }

        function setOpenField(field) {
            field.setAttribute('class', fieldType.opended);
        }

        function getFieldToCheck(board, seekedPos) {
            return board.find(function (field) {
                return parseInt(field.dataset.col) === seekedPos.x && parseInt(field.dataset.row) === seekedPos.y;
            })
        }

        function checkNeighborMineNumber(fieldPos) {
            const board = Array.from(document.querySelectorAll('div[data-row]'));  // all fields on the board

            let neighborMinesNumber = 0;
            for (let x = -1; x <= 1; x++) {  // loop for cols
                for (let y = -1; y <= 1; y++) {  // loop for rows
                    let neighborFieldPos = {x: fieldPos.x + x, y: fieldPos.y + y};
                    if (isOutOfTheBoard(fieldPos, neighborFieldPos)) { continue; }

                    // looks for the mine
                    let neighborField = getFieldToCheck(board, neighborFieldPos);
                    if (isMined(neighborField)) {
                        neighborMinesNumber++;
                    }
                }
            }

            return neighborMinesNumber;
        }

        function openField(field, fieldPos) {
            function setMinesNumber(field, minesNumber) {
                field.style.color = minesNumberColor[minesNumber];
                field.textContent = minesNumber;
            }

            // ------------- openField() main code -------------
            setOpenField(field);
            let neighborMinesNumber = checkNeighborMineNumber(fieldPos);
            if (neighborMinesNumber > 0) { setMinesNumber(field, neighborMinesNumber) }
        }

        function openFieldsInNeighborhood(mainField, mainFieldPos) {
            const board = Array.from(document.querySelectorAll('div[data-row]'));  // all fields on the board

            for (let x = -1; x <= 1; x++) {  // loop for cols
                for (let y = -1; y <= 1; y++) {  // loop for rows
                    let neighborFieldPos = {x: mainFieldPos.x + x, y: mainFieldPos.y + y};
                    if (isOutOfTheBoard(mainFieldPos, neighborFieldPos)) { continue; }

                    let neighborField = getFieldToCheck(board, neighborFieldPos);
                    if (!isClosed(neighborField)) { continue; }  // field should be closed

                    openField(neighborField, neighborFieldPos);
                    if (isNoMinesInNeighborhood(neighborField)) {  // continue opening fields if the field is unnumbered
                        openFieldsInNeighborhood(neighborField, neighborFieldPos);
                    }
                }
            }
        }

        function checkVictory() {
            function isVictory() {
                const board = Array.from(document.querySelectorAll('div[data-row]'));  // all fields on the board
    
                for (index in board) {
                    if (isClosed(board[index])) { return false;}
                }
        
                return true;
            }

            // ------------- checkVictory() main code -------------
            if (isVictory()) {
                timerStop();
                changeGameButton(buttonName.win);
                alert("You win!");
            }
        }

        function gameOver(field) {
            function showWrongFlags() {
                const board = Array.from(document.querySelectorAll('div[data-row]'));  // all fields on the board
    
                for (index in board) {
                    if (isFlagged(board[index]) && !isMined(board[index])) {
                        board[index].style.backgroundImage = 'url("/img/mine-missing.png")';  // clicked mine
                    }
                }
            }

            // ------------- gameOver() main code -------------
            timerStop();
            removeFieldsEventListener();  // block fields from clicking

            changeGameButton(buttonName.gameOver);
            field.style.backgroundImage = 'url("/img/mine-selected.png")';  // clicked mine
            allMinesChangeGraphic('url("/img/mine.png")');  // show all mines
            showWrongFlags();
        }

        // ------------- clickOnFieldHandler() main code -------------
        const cField = event.target;

        if (isTimerNotRunning()) { timerStart(); }
        if (isFlagged(cField)) { return; }  // block the flagged field

        cFieldType = cField.className;
        switch (cFieldType) {
            case fieldType.closed:
                const cFieldPos = {x: parseInt(cField.dataset.col), y: parseInt(cField.dataset.row)};

                openField(cField, cFieldPos);
                if (isNoMinesInNeighborhood(cField)) {
                    openFieldsInNeighborhood(cField, cFieldPos);
                }

                checkVictory();
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
        if (isClosed(cField) || isMined(cField)) {
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
