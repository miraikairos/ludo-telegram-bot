const { createCanvas, loadImage } = require("canvas");

const BOARD_SIZE = 1250;

async function renderSnakeBoard(room) {
  const canvas = createCanvas(
    BOARD_SIZE,
    BOARD_SIZE
  );

  const ctx = canvas.getContext("2d");

  const board = await loadImage(
    "./snakeboard.webp"
  );

  ctx.drawImage(
    board,
    0,
    0,
    BOARD_SIZE,
    BOARD_SIZE
  );

  return canvas.toBuffer();
}

module.exports = renderSnakeBoard;