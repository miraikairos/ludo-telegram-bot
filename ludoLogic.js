const START_POS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

function movePiece(position, dice) {
  if (position === -1) {
    if (dice === 1 || dice === 6) return 0;
    return -1;
  }

  const newPos = position + dice;

  // Must land exactly on 56 (finish) - overshoot is an invalid move,
  // so the piece stays put.
  if (newPos > 56) return position;

  return newPos;
}

module.exports = {
  START_POS,
  movePiece,
};
