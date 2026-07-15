const { createCanvas, loadImage } = require("canvas");
 const path = require("path");
// Telegram displays/compresses photos small anyway, so a smaller
// canvas cuts render + JPEG-encode + upload time on every roll with
// no visible quality loss, while keeping cell math in proportion.
const BOARD_SIZE = 800;
const CELL_SIZE = BOARD_SIZE / 10;
let boardImage = null;

function getCellPosition(cell) {
  const row = Math.floor((cell - 1) / 10);
  const colInRow = (cell - 1) % 10;

  const col =
    row % 2 === 0
      ? colInRow
      : 9 - colInRow;

  const x = col * CELL_SIZE + CELL_SIZE / 2;

  const y =
    BOARD_SIZE -
    (row * CELL_SIZE + CELL_SIZE / 2);

  return { x, y };
}
async function getBoard() {
  if (!boardImage) {
    boardImage = await loadImage(
      path.join(__dirname, "snakeboard.jpeg")
    );
  }

  return boardImage;
}
async function renderSnakeBoard(room) {
  const canvas = createCanvas(
    BOARD_SIZE,
    BOARD_SIZE
  );

  const ctx = canvas.getContext("2d");
 
 
const board = await getBoard();


  ctx.drawImage(
    board,
    0,
    0,
    BOARD_SIZE,
    BOARD_SIZE
  );
  const colors = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
];

room.players.forEach((player, i) => {
  const pos =
    room.positions[player.id] || 1;

  const { x, y } =
    getCellPosition(pos);

  ctx.beginPath();

  ctx.arc(
    x + (i % 2) * 13 - 6,
    y + Math.floor(i / 2) * 13 - 6,
    12,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = colors[i];
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
});

 return canvas.toBuffer("image/jpeg", {
  quality: 0.75,
});
}

module.exports = renderSnakeBoard;