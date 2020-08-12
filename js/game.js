
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const rows = parseInt(urlParams.get('rows'));
const cols = parseInt(urlParams.get('cols'));
const mineCount = parseInt(urlParams.get('mines'));
const fieldType = {
    empty: 'field',
    mine: 'field mine',
    flag: 'flag'
};


const game = {
    init: function () {
        function drawBoard () {
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

        function getRandomMineIndexes (mineCount, cols, rows) {
            const cellCount = cols * rows;
            let mines = new Set();
            do {
                mines.add(Math.round(Math.random() * (cellCount - 1)));
            } while (mines.size < mineCount && mines.size < cellCount);
            return mines;
        }
    
        function setGameFieldSize (gameField, rows, cols) {
            gameField.style.width = (gameField.dataset.cellWidth * rows) + 'px';
            gameField.style.height = (gameField.dataset.cellHeight * cols) + 'px';
        }
    
        function addRow (gameField) {
            gameField.insertAdjacentHTML(
                'beforeend',
                '<div class="row"></div>'
            );
            return gameField.lastElementChild;
        }
    
        function addCell (rowElement, row, col, isMine) {
            rowElement.insertAdjacentHTML(
                'beforeend',
                `<div class="field${isMine ? ' mine' : ''}" 
                            data-row="${row}" 
                            data-col="${col}"></div>`);
        }

        drawBoard();
    },

    engine: function () {
        function clickHandlerOnField(event) {
            const cField = event.target;
            const cFieldPos = {
                x: parseInt(cField.dataset.col),
                y: parseInt(cField.dataset.row)
            };

            function checkNeighborMineNumber() {
                const board = Array.from(document.querySelectorAll('div[data-row]'));  // all fields on the board

                function getFieldToCheck(seekedX, seekedY) {
                    let field = board.find(function(node) {
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
                        if (posX < 0 || posX >= cols  || posY < 0 || posY >= rows) {continue; }  // out of the board

                        // looks for the mine
                        let fieldToCheck = getFieldToCheck(posX, posY);
                        if (fieldToCheck.className === fieldType.mine) {
                            mineNumber++;
                        }
                    }
                }

                return mineNumber;
            }

            // ------------- clickHandlerOnField() main code -------------
            console.log(`clicked coordinates: ${cFieldPos.x}x${cFieldPos.y}; field type: ${cField.className}`);  // Note: the development code.

            // The game main logic
            switch (cField.className) {  // the field type
                case fieldType.empty:
                    let mineNumber = checkNeighborMineNumber();
                    cField.setAttribute('class', 'open-field');
                    if (mineNumber > 0) { cField.textContent = mineNumber; }
                    break;

                case fieldType.mine:
                    const rules = document.styleSheets[0].cssRules;
                    for (index in rules) {
                        if (rules[index].selectorText === '.game-field .row .mine') {
                            rules[index].style.background = 'url("/img/mine.png")';
                            break;
                        }
                    }
                    break;
            }
        }

        function placeTheFlagHandler(event) {
            const cField = event.target;
            const cFieldPos = {
                x: parseInt(cField.dataset.col),
                y: parseInt(cField.dataset.row)
            };

            // ------------- placeTheFlagHandler() main code -------------
            console.log(`right clicked coordinates: ${cFieldPos.x}x${cFieldPos.y}`);  // Note: the development code.

            // the flag logic
            switch (cField.className) {  // the field type
                case fieldType.empty:
                    cField.setAttribute('class', fieldType.flag);
                    break;

                case fieldType.flag:
                    cField.setAttribute('class', fieldType.empty);
                    break;
            }

            // prevent to show the menu
            event.preventDefault()  
            return false;
        }

        const boardContainer = document.querySelector('.game-field');
        boardContainer.addEventListener('click', clickHandlerOnField);
        boardContainer.addEventListener('contextmenu', placeTheFlagHandler);
    }
};


game.init();
game.engine();
