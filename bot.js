const { TelegramBot } = require("node-telegram-bot-api");

const {
  createLobby,
  joinLobby,
  getRoom,
} = require("./gameManager");

const renderBoard = require("./boardRenderer");
const PATH_LENGTH = 52;

const START_INDEX = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};
const TOKEN = process.env.BOT_TOKEN;
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);
const bot = new TelegramBot(TOKEN, {
  polling: true,
});

function buildLobbyText(room) {
  const emoji = {
    red: "🔴",
    blue: "🔵",
    green: "🟢",
    yellow: "🟡",
  };

  let text = "🎮 Ludo Lobby\n\n";

  room.players.forEach((p) => {
    text += `${emoji[p.color]} ${p.name}\n`;
  });

  text += `\nPlayers: ${room.players.length}/4`;
  text += `\n\nUse /join to enter`;
  text += `\nUse /startgame when ready`;

  return text;
}

bot.onText(/\/createludo/, async (msg) => {
  if (msg.chat.type === "private") {
    return bot.sendMessage(
      msg.chat.id,
      "This game works only in groups."
    );
  }

  const room = createLobby(
    msg.chat.id,
    msg.from.id,
    msg.from.first_name
  );

  if (room.error) {
    return bot.sendMessage(
      msg.chat.id,
      room.error
    );
  }

  const sent = await bot.sendMessage(
    msg.chat.id,
    buildLobbyText(room)
  );

  room.lobbyMessageId = sent.message_id;
});
bot.onText(/\/endludo/, (msg) => {
  const chatId = msg.chat.id;

  const room = rooms[chatId];

  if (!room) {
    return bot.sendMessage(chatId, "❌ No active Ludo game.");
  }

  delete rooms[chatId];

  bot.sendMessage(chatId, "🛑 Ludo game ended successfully.");
});
bot.onText(/\/join/, async (msg) => {
  const room = joinLobby(
    msg.chat.id,
    msg.from.id,
    msg.from.first_name
  );

  if (room.error) {
    return bot.sendMessage(
      msg.chat.id,
      room.error
    );
  }

  await bot.editMessageText(
    buildLobbyText(room),
    {
      chat_id: msg.chat.id,
      message_id: room.lobbyMessageId,
    }
  );
});

bot.onText(/\/startgame/, async (msg) => {
  const room = getRoom(msg.chat.id);

  if (!room) {
    return bot.sendMessage(
      msg.chat.id,
      "Create a lobby first using /createludo"
    );
  }

  if (room.players.length < 2) {
    return bot.sendMessage(
      msg.chat.id,
      "Need at least 2 players."
    );
  }

  room.started = true;
  const emoji = {
  red: "🔴",
  blue: "🔵",
  green: "🟢",
  yellow: "🟡",
};

const playerList = room.players
  .map((p) => `${emoji[p.color]} ${p.name}`)
  .join("\n");
  const image = await renderBoard(room);

  const sent = await bot.sendPhoto(
  msg.chat.id,
  image,
  {
    caption:
      `🎮 Ludo Started\n\n` +
      `Players:\n${playerList}\n` +
      `Current Turn: 🔴 ${room.players[0].name}`,

    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🎲 Roll Dice",
            callback_data: "ROLL",
          },
        ],
      ],
    },
  }
);

  room.boardMessageId = sent.message_id;
});
bot.onText(/\/test55/, async (msg) => {
  const room = getRoom(msg.chat.id);

  room.pieces.red[0] = 50;

  const image = await renderBoard(room);

  await bot.sendPhoto(msg.chat.id, image);
});
bot.onText(/\/board/, async (msg) => {
  const room = getRoom(msg.chat.id);

  if (!room) {
    return bot.sendMessage(
      msg.chat.id,
      "No active game."
    );
  }
 
 
  const image = await renderBoard(room);

  await bot.sendPhoto(
    msg.chat.id,
    image,
    {
      caption: "🎲 Current Board",
    }
  );
});
bot.on("callback_query", async (query) => {
  const room = getRoom(query.message.chat.id);

  if (!room) return;

  // =====================
  // ROLL DICE
  // =====================
  if (query.data === "ROLL") {
    const currentPlayer =
      room.players[room.currentTurn];

    if (query.from.id !== currentPlayer.id) {
      return bot.answerCallbackQuery(
        query.id,
        {
          text: "Not your turn!",
          show_alert: true,
        }
      );
    }

    const diceMsg = await bot.sendDice(
      query.message.chat.id,
      {
        emoji: "🎲",
      }
    );

    const dice = diceMsg.dice.value;

    room.lastDice = dice;
 const color = currentPlayer.color;

const movablePieces =
  room.pieces[color]
    .map((pos, index) => ({ pos, index }))
    .filter(
      (p) =>
        p.pos !== -1 ||
        dice === 6
    );
    await bot.answerCallbackQuery(
      query.id
    );
 setTimeout(async () => {
  console.log("Timeout reached");
  console.log("Current Player:", currentPlayer);
  console.log("Dice:", dice);

  try {

    const color = currentPlayer.color;

    const movablePieces =
      room.pieces[color]
        .map((pos, index) => ({
          pos,
          index,
        }))
        .filter(
          (p) =>
            p.pos !== -1 ||
            dice === 6
        );

    console.log("Movable:", movablePieces);

    // rest of code

  } catch (err) {
    console.error(err);
  }

}, 4000);
 setTimeout(async () => {

  const color = currentPlayer.color;

  const movablePieces =
    room.pieces[color]
      .map((pos, index) => ({
        pos,
        index,
      }))
      .filter(
        (p) =>
          p.pos !== -1 ||
          dice === 6
      );

 if (movablePieces.length === 0) {
  await bot.sendMessage(
    query.message.chat.id,
    `🎲 ${currentPlayer.name} rolled ${dice}\n\nNo possible moves.`
  );

  room.currentTurn =
    (room.currentTurn + 1) %
    room.players.length;

  const nextPlayer =
    room.players[room.currentTurn];

  await bot.sendMessage(
    query.message.chat.id,
    `➡️ Turn: ${nextPlayer.name}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎲 Roll Dice",
              callback_data: "ROLL",
            },
          ],
        ],
      },
    }
  );

  return;
}

  await bot.sendMessage(
    query.message.chat.id,
    `🎲 ${currentPlayer.name} rolled ${dice}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "P1",
              callback_data: "MOVE_0",
            },
            {
              text: "P2",
              callback_data: "MOVE_1",
            },
          ],
          [
            {
              text: "P3",
              callback_data: "MOVE_2",
            },
            {
              text: "P4",
              callback_data: "MOVE_3",
            },
          ],
        ],
      },
    }
  );

}, 4000);
    return;
  }

  // =====================
  // SELECT PIECE
  // =====================
  if (query.data.startsWith("MOVE_")) {
    const currentPlayer =
      room.players[room.currentTurn];

    if (query.from.id !== currentPlayer.id) {
      return bot.answerCallbackQuery(
        query.id,
        {
          text: "Not your turn!",
          show_alert: true,
        }
      );
    }

    const pieceIndex = parseInt(
      query.data.split("_")[1]
    );

    room.pendingMove = {
      playerId: currentPlayer.id,
      pieceIndex,
    };

    await bot.answerCallbackQuery(
      query.id
    );

    await bot.sendMessage(
      query.message.chat.id,
      `Move Piece ${pieceIndex + 1}?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "✅ Confirm",
                callback_data:
                  "CONFIRM_MOVE",
              },
            ],
            [
              {
                text: "❌ Cancel",
                callback_data:
                  "CANCEL_MOVE",
              },
            ],
          ],
        },
      }
    );

    return;
  }

  // =====================
  // CONFIRM MOVE
  // =====================
 if (query.data === "CONFIRM_MOVE") {
  const currentPlayer =
    room.players[room.currentTurn];

  const piece =
    room.pendingMove.pieceIndex;

  const color =
    currentPlayer.color;

  const currentPos =
    room.pieces[color][piece];

  if (currentPos === -1) {
    if (room.lastDice !== 6) {
      return bot.answerCallbackQuery(
        query.id,
        {
          text: "Need a 6 to leave home",
          show_alert: true,
        }
      );
    }

    room.pieces[color][piece] = 0;
  } else {
    const newPos =
      currentPos + room.lastDice;

    if (newPos > 56) {
      return bot.answerCallbackQuery(
        query.id,
        {
          text: "Need exact roll",
          show_alert: true,
        }
      );
    }

    room.pieces[color][piece] =
      newPos;
  }

  if (
  room.pieces[color][piece] === 56
  ) {
    await bot.sendMessage(
      query.message.chat.id,
      `🎉 Piece ${piece + 1} finished!`
    );
  }

  const finishedCount =
    room.pieces[color]
      .filter(
  p => p === 56
)
      .length;

  if (finishedCount === 4) {
    await bot.sendMessage(
      query.message.chat.id,
      `🏆 ${currentPlayer.name} wins!`
    );
    return;
  }
 let captured = false;
  const movedPos =
    room.pieces[color][piece];
 if (movedPos >= 51) {
  captured = false;
}
  const movedBoardIndex =
    (START_INDEX[color] + movedPos) %
    PATH_LENGTH;

  

  for (const player of room.players) {
    if (player.color === color)
      continue;

    for (let i = 0; i < 4; i++) {
      const oppPos =
        room.pieces[player.color][i];

     if (
  oppPos === -1 ||
  oppPos >= 51
)
  continue;
      const oppBoardIndex =
        (
          START_INDEX[player.color] +
          oppPos
        ) % PATH_LENGTH;

      if (
        oppBoardIndex ===
        movedBoardIndex
      ) {
        room.pieces[player.color][i] =
          -1;

        captured = true;

        await bot.sendMessage(
          query.message.chat.id,
          `✂️ ${color.toUpperCase()} captured ${player.color.toUpperCase()}'s P${i + 1}!`
        );
      }
    }
  }

  room.pendingMove = null;

  const image =
    await renderBoard(room);

  await bot.sendPhoto(
    query.message.chat.id,
    image,
    {
      caption: "🎲 Updated Board",
    }
  );

  await bot.answerCallbackQuery(
    query.id,
    {
      text: "Move confirmed",
    }
  );

  await bot.sendMessage(
    query.message.chat.id,
    `✅ Piece ${piece + 1} moved`
  );

  if (
    !captured &&
    room.lastDice !== 6
  ) {
    room.currentTurn =
      (room.currentTurn + 1) %
      room.players.length;
  }

  const nextPlayer =
    room.players[room.currentTurn];

  await bot.sendMessage(
    query.message.chat.id,
    `➡️ Turn: ${nextPlayer.name}`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎲 Roll Dice",
              callback_data: "ROLL",
            },
          ],
        ],
      },
    }
  );

  return;
}
  // =====================
  // CANCEL MOVE
  // =====================
  if (query.data === "CANCEL_MOVE") {

    room.pendingMove = null;

    await bot.answerCallbackQuery(
      query.id,
      {
        text: "Move cancelled",
      }
    );

    await bot.sendMessage(
      query.message.chat.id,
      "Choose another piece."
    );

    return;
  }
});

console.log("Ludo Bot Running...");