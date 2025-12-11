const board = document.getElementById("board");
const body = document.querySelector("body");

function createBoard() {
    for (let i = 0; i < 8; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((i + j) % 2 === 0 ? "white" : "black");
            cell.dataset.i = i;
            cell.dataset.j = j;

            if (i < 3 && (i + j) % 2 !== 0) {
                addPiece(cell, "black", i, j);
            } else if (i > 4 && (i + j) % 2 !== 0) {
                addPiece(cell, "white", i, j);
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
    board.dataset.move = "white";
    board.colored = {
        "moving": [],
        "possible": [],
        "eat": [],
        "danger": []
    };
    board.dataset.awaitingTurn = null;
    board.dataset.killingSpree = null;
    board.counterWhite = 12;
    board.counterBlack = 12;
}

function addPiece(cell, color, row, col) {
    const piece = document.createElement("div");
    piece.classList.add("piece", color);
    piece.dataset.color = color;
    piece.dataset.col = col;
    piece.dataset.row = row;
    cell.appendChild(piece);
}

function colorCell(cell, color) {
    cell.classList.add(color);
    board.colored[color].push(cell)
}

function checkOverflow(i, j) {
    return i >= 0 && j >= 0 && i <= 7 && j <= 7;
}

function possibleMove(board, i, j) {
    if (!checkOverflow(i, j)) {
        return false;
    }
    const cell = board.childNodes[i].childNodes[j];
    return cell.childNodes.length === 0;
}

function colorMove(board, i, j) {
    if (possibleMove(board, i, j)) {
        colorCell(board.childNodes[i].childNodes[j], "possible");
    }
}

function possibleEatMove(board, srcI, srcJ, newI, newJ) {
    if (!possibleMove(board, newI, newJ)) {
        return false;
    }
    const movingCell = board.childNodes[srcI].childNodes[srcJ];
    const eatenCell = board.childNodes[(srcI + newI) / 2].childNodes[(srcJ + newJ) / 2];

    if (movingCell.childNodes.length === 0 || eatenCell.childNodes.length === 0) {
        return false;
    }

    const movingPiece = movingCell.childNodes[0];
    const eatenPiece = eatenCell.childNodes[0];

    return movingPiece.dataset["color"] !== eatenPiece.dataset["color"];
}


function colorEatMove(board, srcI, srcJ, newI, newJ) {
    if (possibleEatMove(board, srcI, srcJ, newI, newJ)) {
        colorCell(board.childNodes[newI].childNodes[newJ], "eat");
        colorCell(board.childNodes[(srcI + newI) / 2].childNodes[(srcJ + newJ) / 2], "danger");
    }
}


function colorPossibleMoves(board, i, j, killingSpree) {
    colorCell(board.childNodes[i].childNodes[j], "moving");

    if (!killingSpree) {
        if (board.childNodes[i].childNodes[j].childNodes[0].dataset.color === "white") {
            colorMove(board, i-1, j-1);
            colorMove(board, i-1, j+1);
        } else {
            colorMove(board, i+1, j-1);
            colorMove(board, i+1, j+1);
        }
    }

    colorEatMove(board, i, j, i-2, j-2);
    colorEatMove(board, i, j, i-2, j+2);
    colorEatMove(board, i, j, i+2, j-2);
    colorEatMove(board, i, j, i+2, j+2);

    board.dataset.awaitingTurn = "true";
}

function checkMove(board, i, j) {
    if (board.childNodes[i].childNodes[j].classList.contains("possible")) {
        return "ok";
    }
    if (board.childNodes[i].childNodes[j].classList.contains("eat")) {
        return "eat";
    }
    if (board.childNodes[i].childNodes[j].classList.contains("moving")) {
        return "abort";
    }
    return "no";
}

function clearColors(board) {
    board.dataset.awaitingTurn = null;
    for (const [key, value] of Object.entries(board.colored)) {
        for (const cell of value) {
            cell.classList.remove(key);
        }
    }
    board.colored = {
        "moving": [],
        "possible": [],
        "eat": [],
        "danger": []
    };
}

function switchMove(board) {
    board.dataset.move = (board.dataset.move === "white") ? "black" : "white";
}


function animatePiece(board, piece, cell, dstCell) {
    const deltaX = (dstCell.dataset.i - cell.dataset.i) * 12.5;
    const deltaY = (dstCell.dataset.j - cell.dataset.j) * 12.5;

    const movingPiece = piece.cloneNode(true);
    movingPiece.classList.add("moving");

    cell.appendChild(movingPiece);
    cell.removeChild(piece);

    setTimeout(function() {
        if (deltaY > 0) {
            movingPiece.style.setProperty("margin-left", deltaY + "%");
        } else {
            movingPiece.style.setProperty("margin-right", -deltaY + "%");
        }

        if (deltaX > 0) {
            movingPiece.style.setProperty("margin-top", deltaX + "%");
        } else {
            movingPiece.style.setProperty("margin-bottom", -deltaX + "%");
        }
    }, 50)

    piece.dataset.row = dstCell.dataset.i;
    piece.dataset.col = dstCell.dataset.j;

    setTimeout(function() {
        dstCell.appendChild(piece);
        cell.removeChild(movingPiece)
    }, 350);
}

function erasePiece(board, cell, piece) {
    const vanishingPiece = piece.cloneNode(true);
    vanishingPiece.classList.add("vanishing");
    cell.appendChild(vanishingPiece);
    cell.removeChild(piece);

    setTimeout(function() {
        vanishingPiece.style.setProperty("opacity", 0);
    }, 50)

    setTimeout(function() {
        cell.removeChild(vanishingPiece);
    }, 350);
}

function checkWin(board) {
    if (board.counterWhite === 0) {
        return "black";
    } else if (board.counterBlack === 0) {
        return "white";
    } else {
        return "none";
    }
}

function createMessage(text) {
    console.log("Error: " + text);
    const popup = document.createElement("div");
    popup.classList.add("popup");
    body.appendChild(popup);
    const content = document.createElement("div");
    content.classList.add("content");
    content.textContent = text;
    popup.appendChild(content);

    setTimeout(function() {
        popup.style.setProperty("opacity", "0");
    }, 100)
    setTimeout(function() {
        popup.remove();
    }, 3000)
}

function createWinMessage(text) {
    const winningPopup = document.createElement("div");
    winningPopup.classList.add("winning");
    const content = document.createElement("div");
    content.classList.add("content");
    content.textContent = text;
    winningPopup.appendChild(content);
    body.appendChild(winningPopup);
}

function makeMove(board, oldI, oldJ, newI, newJ) {
    const cell = board.childNodes[oldI].childNodes[oldJ];
    const dstCell = board.childNodes[newI].childNodes[newJ];
    const piece = cell.childNodes[0];

    if (checkMove(board, newI, newJ) === "ok") {
        animatePiece(board, piece, cell, dstCell);
        switchMove(board);
        clearColors(board);

    } else if (checkMove(board, newI, newJ) === "eat") {
        const eatenCell = board.childNodes[(oldI + newI) / 2].childNodes[(oldJ + newJ) / 2];
        const eatenPiece = eatenCell.childNodes[0];

        erasePiece(board, eatenCell, eatenPiece);
        if (board.dataset.move === "white") {
            --board.counterBlack;
        } else {
            --board.counterWhite;
        }

        if (checkWin(board) !== "none") {
            createWinMessage((checkWin(board) === "white") ? "Белые победили!" : "Черные победили!");
        }

        animatePiece(board, piece, cell, dstCell);
        clearColors(board);
        setTimeout(function() {
            colorPossibleMoves(board, newI, newJ, true);
            if (board.colored["eat"].length === 0) {
                clearColors(board);
                switchMove(board);
            } else {
                board.dataset.killingSpree = "true";
            }
        }, 400)

    } else if (checkMove(board, newI, newJ) === "abort") {
        if (board.dataset.killingSpree === "true") {
            switchMove(board);
            clearColors(board);
        } else {
            clearColors(board);
        }

    } else {
        createMessage("Неправильная позиция конца хода");
        clearColors(board);
    }
}

createBoard();
board.addEventListener("click", function(evt) {
    if (board.dataset.awaitingTurn === "true") {
        if (evt.target.classList.contains("cell") || evt.target.classList.contains("piece")) {
            const oldI = parseInt(board.colored["moving"][0].dataset["i"]);
            const oldJ = parseInt(board.colored["moving"][0].dataset["j"]);
            if (evt.target.classList.contains("cell")) {
                const i = parseInt(evt.target.dataset["i"]);
                const j = parseInt(evt.target.dataset["j"]);
                makeMove(board, oldI, oldJ, i, j);
            } else {
                const i = parseInt(evt.target.dataset["row"]);
                const j = parseInt(evt.target.dataset["col"]);
                makeMove(board, oldI, oldJ, i, j);
            }
            return;

        } else {
            createMessage("Ход должен заканчиваться в пустой клетке")
            if (board.dataset.killingSpree !== "true") {
                board.dataset.awaitingTurn = null;
                clearColors(board);
            }
            return;
        }
    }

    if (evt.target.classList.contains("piece")) {
        if (evt.target.dataset.color !== board.dataset.move) {
            createMessage("Попытка походить шашкой не в свой ход")
            return;
        }
        const i = evt.target.dataset.row;
        const j = evt.target.dataset.col;
        colorPossibleMoves(board, parseInt(i), parseInt(j), false);

    } else {
        createMessage("Ход должен начинаться в шашке");
    }
})
