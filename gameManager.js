const rooms = {};

const COLORS = ["red", "blue", "green", "yellow"];

function createLobby(chatId, creatorId, creatorName) {
  if (rooms[chatId]) {
    return { error: "A game already exists in this group." };
  }

  rooms[chatId] = {
    chatId,

    started: false,

    lobbyMessageId: null,
    boardMessageId: null,

    currentTurn: 0,
    lastDice: 0,

    players: [
      {
        id: creatorId,
        name: creatorName,
        color: COLORS[0],
      },
    ],

    pieces: {
      red: [-1, -1, -1, -1],
      blue: [-1, -1, -1, -1],
      green: [-1, -1, -1, -1],
      yellow: [-1, -1, -1, -1],
    },
  };

  return rooms[chatId];
}

function joinLobby(chatId, userId, userName) {
  const room = rooms[chatId];

  if (!room) {
    return { error: "No lobby exists. Use /createludo" };
  }

  if (room.started) {
    return { error: "Game already started" };
  }

  const alreadyJoined = room.players.find(
    (p) => p.id === userId
  );

  if (alreadyJoined) {
    return { error: "Already joined" };
  }

  if (room.players.length >= 4) {
    return { error: "Lobby full" };
  }

  room.players.push({
    id: userId,
    name: userName,
    color: COLORS[room.players.length],
  });

  return room;
}

function getRoom(chatId) {
  return rooms[chatId];
}

function deleteRoom(chatId) {
  delete rooms[chatId];
}

module.exports = {
  createLobby,
  joinLobby,
  getRoom,
  deleteRoom,
};