const START_POS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

function movePiece(position, dice) {
  if (position === -1) {
    if (dice === 6) return 0;
    return -1;
  }

  return position + dice;
}

module.exports = {
  START_POS,
  movePiece,
};