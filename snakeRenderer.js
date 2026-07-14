const { createCanvas, loadImage } = require("canvas");
 const path = require("path");
const BOARD_SIZE = 1250;
let boardImage = null;

function getCellPosition(cell) {
  const size = 125;

  const row = Math.floor((cell - 1) / 10);
  const colInRow = (cell - 1) % 10;

  const col =
    row % 2 === 0
      ? colInRow
      : 9 - colInRow;

  const x = col * size + size / 2;

  const y =
    1250 -
    (row * size + size / 2);

  return { x, y };
}
async function getBoard() {
  if (!boardImage) {
    boardImage = await loadImage(
      path.join(__dirname, "snakeboard.png")
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
    x + (i % 2) * 20 - 10,
    y + Math.floor(i / 2) * 20 - 10,
    18,
    0,
    Math.PI * 2
  );

  ctx.fillStyle = colors[i];
  ctx.fill();

  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.stroke();
});

 return canvas.toBuffer("image/jpeg", {
  quality: 0.8,
});
}

module.exports = renderSnakeBoard;