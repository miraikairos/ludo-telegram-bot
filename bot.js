const { TelegramBot } = require("node-telegram-bot-api");
const express = require("express");
const app = express();
const {
  rooms,
  createLobby,
  joinLobby,
  getRoom,
  deleteRoom,
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

const bot = new TelegramBot(TOKEN);

app.use(express.json());

app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});


process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
});


bot.on("error", (err) => {
  console.error("BOT ERROR:", err);
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

  const room = getRoom(chatId);

  if (!room) {
    return bot.sendMessage(
      chatId,
      "❌ No active Ludo game."
    );
  }

  deleteRoom(chatId);

  return bot.sendMessage(
    chatId,
    "🛑 Ludo game ended successfully."
  );
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
  console.log("Before render");
  const image = await renderBoard(room);
 console.log("After render");
 const sent = await bot.sendPhoto(
  msg.chat.id,
  image,
  {
    caption:
      `🎮 Ludo Started\n\n` +
      `Players:\n${playerList}\n` +
      `Current Turn: 🔴 ${room.players[0].name}`,

    reply_markup: {
      inline_keyboard: [[
        {
          text: "🎲 Roll Dice",
          callback_data: "ROLL",
        },
      ]],
    },
  }
);

console.log("Board sent");

  room.boardMessageId = sent.message_id;
});
bot.onText(/\/resume/, async (msg) => {
  const room = getRoom(msg.chat.id);

  if (!room) {
    return bot.sendMessage(
      msg.chat.id,
      "No active game."
    );
  }

  room.processing = false;

  const currentPlayer =
    room.players[room.currentTurn];

  await bot.sendMessage(
    msg.chat.id,
    `🔄 Game resumed\n\n➡️ Turn: ${currentPlayer.name}`,
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🎲 Roll Dice",
            callback_data: "ROLL"
          }
        ]]
      }
    }
  );
});
bot.onText(/\/test55/, async (msg) => {
  const room = getRoom(msg.chat.id);

  room.pieces.red[0] = 50;
  room.pieces.blue[0] = 46;
  const image = await renderBoard(room);

  await bot.sendPhoto(msg.chat.id, image);
});
bot.onText(/\/skip/, async (msg) => {
  const room = getRoom(msg.chat.id);

  if (!room) {
    return bot.sendMessage(
      msg.chat.id,
      "No active game."
    );
  }

  const currentPlayer =
    room.players[room.currentTurn];

  if (msg.from.id !== currentPlayer.id) {
    return bot.sendMessage(
      msg.chat.id,
      "❌ Not your turn."
    );
  }

  room.currentTurn =
    (room.currentTurn + 1) %
    room.players.length;
  console.log(
  "Current Turn:",
  room.currentTurn
);

console.log(
  "Players Length:",
  room.players.length
);

console.log(
  "Next Player:",
  room.players[room.currentTurn]
);
  const nextPlayer =
    room.players[room.currentTurn];

  await bot.sendMessage(
    msg.chat.id,
    `⏭️ ${currentPlayer.name} skipped the turn.\n\n➡️ Turn: ${nextPlayer.name}`,
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
});
bot.onText(/\/board/, async (msg) => {
  const room = getRoom(msg.chat.id);
  if (!room) {
    return bot.sendMessage(
      msg.chat.id,
      "No active game."
    );
  }
 
 
 try {
  console.log("Rendering board...");

  const image = await renderBoard(room);

  console.log("Board rendered");

  await bot.sendPhoto(
    msg.chat.id,
    image,
    {
      caption: "🎲 Current Board",
    }
  );

  console.log("Board sent");
} catch (err) {
  console.error("BOARD ERROR:", err);
}
});
bot.on("callback_query", async (query) => {
  const room = getRoom(query.message.chat.id);
if (
  query.data === "ROLL" &&
  room &&
  room.processing
) {
  return bot.answerCallbackQuery(
    query.id,
    {
      text: "⏳ Dice already rolling..."
    }
  );
}
  
   console.log(
    "CALLBACK RECEIVED:",
    query.data
  );
  if (!room) return;

  // =====================
  // ROLL DICE
  // =====================
  if (query.data === "ROLL") {
    console.log("ROLL START");
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

 let diceMsg;

try {
  console.log("Before sendDice");

const dicePromise = bot.sendDice(
  query.message.chat.id
);

const timeoutPromise = new Promise((_, reject) =>
  setTimeout(
    () => reject(new Error("sendDice timeout")),
    10000
  )
);

diceMsg = await Promise.race([
  dicePromise,
  timeoutPromise
]);

console.log("After sendDice");
} catch (err) {
  console.error("SEND DICE FAILED:", err);
  return;
}

    const dice = diceMsg.dice.value;

    room.lastDice = dice;
 const color = currentPlayer.color;

const movablePieces =
  room.pieces[color]
    .map((pos, index) => ({ pos, index }))
    .filter((p) => {
      if (p.pos === -1) {
        return dice === 6;
      }
     if(p.pos === 56){
      return false;
     }
      return p.pos + dice <= 56;
    });

    await bot.answerCallbackQuery(
      query.id
    );
 console.log("After answerCallbackQuery");
 if (room.processing) {
  return bot.answerCallbackQuery(query.id, {
    text: "⏳ Please wait..."
  });
}

room.processing = true;
// Emergency unlock after 15 sec
setTimeout(() => {
  room.processing = false;
  console.log("Processing auto-reset");
}, 15000);
 setTimeout(async () => {
  try {
    console.log("Processing roll");

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

    console.log(
      "Movable:",
      movablePieces.length
    );
console.log(
  "Dice:",
  dice,
  "Movable:",
  movablePieces
);
if (
  room.pieces[color].some(
    (pos) =>
      pos > 50 &&
      pos < 56 &&
      pos + dice > 56
  ) &&
  movablePieces.length === 0
) {
  room.currentTurn =
    (room.currentTurn + 1) %
    room.players.length;
  
console.log(
  "Next turn:",
  room.players[room.currentTurn].name
);
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
 console.log("Before move selection message");
 await bot.deleteMessage(
  query.message.chat.id,
  query.message.message_id
).catch(() => {});
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
 
console.log("After move selection message");
  } catch (err) {
    console.error(
      "ROLL TIMEOUT ERROR:",
      err
    );
  } finally {
    room.processing = false;
  }
}, 4000);


return;
}

  // =====================
  // SELECT PIECE
  // =====================
 

 
 // =====================
// MOVE PIECE
// =====================
if (query.data.startsWith("MOVE_")) {
try {

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

  const piece = parseInt(
    query.data.split("_")[1]
  );

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
      deleteRoom(query.message.chat.id);
    return;
  }
 let captured = false;
  const movedPos =
    room.pieces[color][piece];
  
  // capture logic

 // Pieces in home lane cannot capture
if (movedPos < 51) {

  const movedBoardIndex =
    (START_INDEX[color] + movedPos) %
    PATH_LENGTH;

  for (const player of room.players) {

    if (player.color === color)
      continue;

    for (let i = 0; i < 4; i++) {

      const oppPos =
        room.pieces[player.color][i];

      // Ignore home and home-lane pieces
      if (
        oppPos === -1 ||
        oppPos >= 51
      ) continue;

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
}


 

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
  query.id
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

  } catch (err) {

    console.error(
      "MOVE HANDLER ERROR:",
      err
    );

    await bot.sendMessage(
      query.message.chat.id,
      `❌ MOVE ERROR: ${err.message}`
    ).catch(() => {});
  }
}
});  
setInterval(() => {
  const mem = process.memoryUsage();

  console.log(
    "RAM:",
    Math.round(mem.heapUsed / 1024 / 1024),
    "MB"
  );
}, 30000);
  // =====================
  // CANCEL MOVE
  // =====================
  
app.get("/", (req, res) => {
  res.send("Ludo Bot Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

    try {
    await bot.setWebHook(
      `https://ludo-telegram-bot-1.onrender.com/bot8784131458:AAH1anMO-VIOgjeWcEP55TyqPSgrfQbifQU`
    );

    console.log("Webhook set");
  } catch (err) {
    console.error(
      "WEBHOOK ERROR:",
      err
    );
  }
});

console.log("Ludo Bot Running...");
setInterval(() => {
  console.log(
    "HEARTBEAT",
    new Date().toISOString()
  );
}, 60000);