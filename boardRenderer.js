const { createCanvas, loadImage } = require("canvas");
const path = require("path");

async function renderBoard(room) {
  const board = await loadImage(
    path.join(__dirname, "assets", "board.jpg")
  );
console.log(
  "Board size:",
  board.width,
  board.height
);
 const canvas = createCanvas(1250, 1250);

const ctx = canvas.getContext("2d");

ctx.drawImage(board, 0, 0, 1250, 1250);
  

 const homes = {
    
 red: [
  { x: 175, y: 175 },
  { x: 325, y: 175 },
  { x: 175, y: 325 },
  { x: 325, y: 325 },
],

blue: [
  { x: 175, y: 925 },
  { x: 325, y: 925 },
  { x: 175, y: 1075 },
  { x: 325, y: 1075 },
],
 green: [
  { x: 825, y: 175 },
  { x: 975, y: 175 },
  { x: 825, y: 325 },
  { x: 975, y: 325 },
],
  yellow: [
  { x: 825, y: 825 },
  { x: 975, y: 825 },
  { x: 825, y: 975 },
  { x: 975, y: 975 },
],
};
const PATH = [
  { x: 125, y: 542 },
  { x: 208, y: 542 },
  { x: 292, y: 542 },
  { x: 375, y: 542 },
  { x: 458, y: 542 },

  { x: 542, y: 458 },
  { x: 542, y: 375 },
  { x: 542, y: 292 },
  { x: 542, y: 208 },
  { x: 542, y: 125 },
  { x: 542, y: 42 },

  { x: 625, y: 42 },

  { x: 708, y: 42 },
  { x: 708, y: 125 },
  { x: 708, y: 208 },
  { x: 708, y: 292 },
  { x: 708, y: 375 },
  { x: 708, y: 458 },

  { x: 792, y: 542 },
  { x: 875, y: 542 },
  { x: 958, y: 542 },
  { x: 1042, y: 542 },
  { x: 1125, y: 542 },
  { x: 1208, y: 542 },

  { x: 1208, y: 625 },

  { x: 1208, y: 708 },
  { x: 1125, y: 708 },
  { x: 1042, y: 708 },
  { x: 958, y: 708 },
  { x: 875, y: 708 },
  { x: 792, y: 708 },

  { x: 708, y: 792 },
  { x: 708, y: 875 },
  { x: 708, y: 958 },
  { x: 708, y: 1042 },
  { x: 708, y: 1125 },
  { x: 708, y: 1208 },

  { x: 625, y: 1208 },

  { x: 542, y: 1208 },
  { x: 542, y: 1125 },
  { x: 542, y: 1042 },
  { x: 542, y: 958 },
  { x: 542, y: 875 },
  { x: 542, y: 792 },

  { x: 458, y: 708 },
  { x: 375, y: 708 },
  { x: 292, y: 708 },
  { x: 208, y: 708 },
  { x: 125, y: 708 },

  { x: 42, y: 708 },

  { x: 42, y: 625 },
];
console.log("PATH LENGTH =", PATH.length);
 const START_INDEX = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};
const HOME_LANE = {
    
red: [
  { x: 125, y: 625 },
  { x: 208, y: 625 },
  { x: 292, y: 625 },
  { x: 375, y: 625 },
  { x: 458, y: 625 },
],

  green: [
  { x: 625, y: 125 },
  { x: 625, y: 208 },
  { x: 625, y: 292 },
  { x: 625, y: 375 },
  { x: 625, y: 458 },
],

 yellow: [
  { x: 708, y: 625 },
  { x: 792, y: 625 },
  { x: 875, y: 625 },
  { x: 958, y: 625 },
  { x: 1042, y: 625 },
],

 blue: [
  { x: 625, y: 1125 },
  { x: 625, y: 1042 },
  { x: 625, y: 958 },
  { x: 625, y: 875 },
  { x: 625, y: 792 },
],
};

const FINISH = {
  x: 625,
  y: 625,
};

  room.players.forEach((player) => {
 console.log(player.color, room.pieces[player.color]);
  room.pieces[player.color].forEach(
    
    (piecePos, index) => {
         console.log(
      "Color:",
      player.color,
      "Piece:",
      index + 1,
      "Pos:",
      piecePos
    );

      let x;
      let y;

     if (piecePos === -1) {

  x = homes[player.color][index].x;
  y = homes[player.color][index].y;

}
else if (
  piecePos >= 51 &&
  piecePos <= 55
) {
   console.log(
  "Lane Pos:",
  piecePos,
  HOME_LANE[player.color][piecePos - 51]
);
  const lanePos =
  HOME_LANE[player.color][
    piecePos - 51
  ];
  

  x = lanePos.x;
  y = lanePos.y;

}
else if (piecePos === 56){

  x = FINISH.x;
  y = FINISH.y;

}
else {

  const boardIndex =
    (
      START_INDEX[player.color] +
      piecePos
    ) % PATH.length;

  const pathPos =
    PATH[boardIndex];

  x = pathPos.x;
  y = pathPos.y;
}

      ctx.fillStyle = player.color;

      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 5;
      ctx.strokeStyle = "white";
      ctx.stroke();

      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";

      ctx.fillText(
        index + 1,
        x,
        y + 7
      );
    }

  );

});

  return canvas.toBuffer("image/jpeg");
}

module.exports = renderBoard;