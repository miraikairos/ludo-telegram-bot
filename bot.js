const { TelegramBot } = require("node-telegram-bot-api");
const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");
const {
  rooms,
  createLobby,
  joinLobby,
  getRoom,
  deleteRoom,
} = require("./gameManager");
const renderBoard = require("./boardRenderer");
const renderSnakeBoard =
  require("./snakeRenderer");
const {
  ladders,
  snakes,
} = require("./snakesData");
const { START_POS, movePiece } = require("./ludoLogic");
const PATH_LENGTH = 52;

// ======================================
// UNIQUE USER TRACKING (all-time count)
// ======================================
const USERS_FILE = path.join(__dirname, "users.json");

let knownUsers = new Set();

// Load previously seen users on startup (if the file exists)
try {
  const raw = fs.readFileSync(USERS_FILE, "utf8");
  knownUsers = new Set(JSON.parse(raw));
  console.log("Loaded", knownUsers.size, "known users");
} catch (err) {
  console.log("No existing users.json found, starting fresh");
}

function saveUsers() {
  fs.writeFile(
    USERS_FILE,
    JSON.stringify([...knownUsers]),
    (err) => {
      if (err) console.error("Failed to save users.json:", err);
    }
  );
}

// Call this with a Telegram `from` object on every incoming
// message/callback to record a new unique user if not seen before.
function trackUser(from) {
  if (!from || !from.id) return;

  if (!knownUsers.has(from.id)) {
    knownUsers.add(from.id);
    saveUsers();
  }
}

// Returns "@username" if the player has one set on Telegram,
// otherwise falls back to their display name.
function mention(player) {
  return player.username
    ? `@${player.username}`
    : player.name;
}

// Optional: restrict /users to the bot owner by setting this env var
// to your own Telegram numeric user id. If unset, anyone can check it.
const OWNER_ID = process.env.OWNER_ID
  ? Number(process.env.OWNER_ID)
  : null;

const START_INDEX = START_POS;

// Safe squares: each color's own start square, plus the star square
// 8 cells ahead of every start square (matches the stars drawn on the board).
// Pieces sitting on any of these cannot be captured.
const SAFE_INDICES = new Set([
  ...Object.values(START_INDEX),
  ...Object.values(START_INDEX).map(
    (idx) => (idx + 8) % PATH_LENGTH
  ),
]);

const TOKEN = process.env.BOT_TOKEN;
console.log("BOT_TOKEN exists:", !!process.env.BOT_TOKEN);

const bot = new TelegramBot(TOKEN);

// Track every user who sends any message to the bot (DM or group)
bot.on("message", (msg) => {
  trackUser(msg.from);
});

// /users - report the all-time unique user count
bot.onText(/\/users/, (msg) => {
  if (OWNER_ID && msg.from.id !== OWNER_ID) {
    return; // silently ignore for non-owners
  }

  bot.sendMessage(
    msg.chat.id,
    `👥 ${knownUsers.size.toLocaleString("en-IN")} users have started the bot`
  );
});

// Retries a Telegram API call on transient network failures
// (e.g. "EFATAL: fetch failed", timeouts, connection resets).
// Permission/validation errors from Telegram itself are NOT retried,
// since retrying those just wastes time before failing anyway.
async function withRetry(
  fn,
  { retries = 3, delayMs = 700, shouldRetry } = {}
) {
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;

      const canRetry = shouldRetry
        ? shouldRetry(err)
        : true;

      if (!canRetry || attempt === retries) {
        throw err;
      }

      console.error(
        `Attempt ${attempt}/${retries} failed, retrying:`,
        err.message
      );

      await new Promise((r) =>
        setTimeout(r, delayMs * attempt)
      );
    }
  }

  throw lastErr;
}

// Wraps bot.sendMessage with retry-on-transient-failure.
async function safeSendMessage(chatId, text, options) {
  return withRetry(() =>
    bot.sendMessage(chatId, text, options)
  );
}

// Wraps bot.sendPhoto so that if the bot lacks permission to post photos
// in a group (Telegram error: "not enough rights to send photos to the
// chat"), we tell the group what's wrong instead of failing silently.
async function safeSendPhoto(chatId, photo, options) {
  try {
    return await withRetry(
      () => bot.sendPhoto(chatId, photo, options),
      {
        shouldRetry: (err) => {
          const desc =
            err?.response?.body?.description ||
            err?.message ||
            "";
          return !desc.includes(
            "not enough rights to send photos"
          );
        },
      }
    );
  } catch (err) {
    const desc =
      err?.response?.body?.description ||
      err?.message ||
      "";

    if (
      desc.includes(
        "not enough rights to send photos"
      )
    ) {
      await bot.sendMessage(
        chatId,
        "⚠️ I don't have permission to send photos in this chat.\n\n" +
          "An admin needs to open this group's settings → Administrators → " +
          "give me the \"Send Photos\" (Send Media) permission, then run the last command again."
      );
      return null;
    }

    // Unknown error - log it and re-throw so nothing is silently swallowed
    console.error("sendPhoto failed:", err);
    throw err;
  }
}

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
 bot.onText(/\/createsnl/, async (msg) => {
  const room = createLobby(
    msg.chat.id,
    msg.from.id,
    msg.from.first_name
  );

  room.gameType = "snl";

  const sent = await bot.sendMessage(
    msg.chat.id,
    "🐍 Snakes & Ladders Lobby\n\nUse /join"
  );

  room.lobbyMessageId = sent.message_id;
});
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
    msg.from.first_name,
    msg.from.username
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

bot.onText(/\/startsnl/, async (msg) => {
  const room = getRoom(msg.chat.id);

  if (!room) return;

  if (room.players.length < 2)
    return bot.sendMessage(
      msg.chat.id,
      "Need at least 2 players"
    );

  if (room.players.length > 5)
    return bot.sendMessage(
      msg.chat.id,
      "Maximum 5 players"
    );

  room.started = true;

  room.players.forEach((p) => {
    room.positions[p.id] = 1;
  });

  const image =
    await renderSnakeBoard(room);

  await bot.sendPhoto(
    msg.chat.id,
    image,
    {
      caption:
        "🐍 Snakes & Ladders Started",

      reply_markup: {
        inline_keyboard: [[
          {
            text: "🎲 Roll",
            callback_data: "SNL_ROLL",
          },
        ]],
      },
    }
  );
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
    msg.from.first_name,
    msg.from.username
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
 const sent = await safeSendPhoto(
  msg.chat.id,
  image,
  {
    caption:
      `🎮 Ludo Started\n\n` +
      `Players:\n${playerList}\n` +
      `Current Turn: 🔴 ${mention(room.players[0])}`,

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

  room.boardMessageId = sent?.message_id;
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
    `🔄 Game resumed\n\n➡️ Turn: ${mention(currentPlayer)}`,
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

  await safeSendPhoto(msg.chat.id, image);
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
    `⏭️ ${mention(currentPlayer)} skipped the turn.\n\n➡️ Turn: ${mention(nextPlayer)}`,
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

  await safeSendPhoto(
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
  trackUser(query.from);

  const room = getRoom(query.message.chat.id);

   console.log(
    "CALLBACK RECEIVED:",
    query.data
  );
  if (!room) return;
if (query.data === "SNL_ROLL") {
  try {
    const currentPlayer =
      room.players[room.currentTurn];

    if (
      query.from.id !==
      currentPlayer.id
    ) {
      return bot.answerCallbackQuery(
        query.id,
        {
          text: "Not your turn!",
          show_alert: true,
        }
      );
    }

    const diceMsg =
      await bot.sendDice(
        query.message.chat.id
      );

    const dice =
      diceMsg.dice.value;

    let currentPos =
      room.positions[
        currentPlayer.id
      ];

    let newPos =
      currentPos + dice;

    // Exact 100 rule
    if (newPos > 100) {
      newPos = currentPos;

      await bot.sendMessage(
        query.message.chat.id,
        `🎲 ${currentPlayer.name} rolled ${dice}.\nNeed exact roll to reach 100.`
      );
    } else {

      // Ladder
      if (ladders[newPos]) {

        await bot.sendMessage(
          query.message.chat.id,
          `🪜 ${currentPlayer.name} climbed a ladder from ${newPos} to ${ladders[newPos]}`
        );

        newPos =
          ladders[newPos];
      }

      // Snake
      else if (
        snakes[newPos]
      ) {

        await bot.sendMessage(
          query.message.chat.id,
          `🐍 ${currentPlayer.name} got bitten and fell from ${newPos} to ${snakes[newPos]}`
        );

        newPos =
          snakes[newPos];
      }

      room.positions[
        currentPlayer.id
      ] = newPos;
    }

    // Winner
    if (
      newPos === 100 &&
      !room.finishedPlayers.includes(
        currentPlayer.id
      )
    ) {

      room.finishedPlayers.push(
        currentPlayer.id
      );

      await bot.sendMessage(
        query.message.chat.id,
        `🏆 ${currentPlayer.name} finished #${room.finishedPlayers.length}`
      );
    }

    // Render board
    const image =
      await renderSnakeBoard(room);

    await bot.sendPhoto(
      query.message.chat.id,
      image,
      {
        caption:
          `🎲 ${currentPlayer.name} rolled ${dice}\nPosition: ${newPos}`
      }
    );

    // Check if game should end
    const activePlayers =
      room.players.filter(
        p =>
          !room.finishedPlayers.includes(
            p.id
          )
      );

    if (
      activePlayers.length <= 1
    ) {

      let result =
        "🏁 Final Rankings\n\n";

      room.finishedPlayers.forEach(
        (id, index) => {

          const player =
            room.players.find(
              p => p.id === id
            );

          result +=
            `${index + 1}. ${player.name}\n`;
        }
      );

      await bot.sendMessage(
        query.message.chat.id,
        result
      );

      deleteRoom(
        query.message.chat.id
      );

      return;
    }

    // Extra turn on 6
    if (dice !== 6) {

      do {

        room.currentTurn =
          (room.currentTurn + 1) %
          room.players.length;

      } while (
        room.finishedPlayers.includes(
          room.players[
            room.currentTurn
          ].id
        )
      );
    }

    const nextPlayer =
      room.players[
        room.currentTurn
      ];

    await bot.sendMessage(
      query.message.chat.id,
      `➡️ Turn: ${nextPlayer.name}`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🎲 Roll",
                callback_data:
                  "SNL_ROLL",
              },
            ],
          ],
        },
      }
    );

    await bot.answerCallbackQuery(
      query.id
    );

  } catch (err) {

    console.error(
      "SNL ERROR:",
      err
    );

    await bot.sendMessage(
      query.message.chat.id,
      `❌ ${err.message}`
    );
  }

  return;
}
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

    // Acquire the lock RIGHT HERE, synchronously, before any
    // await. This is what actually stops a fast double-click:
    // if two ROLL clicks arrive close together, whichever one's
    // handler runs first sets this flag before yielding control,
    // so the second one sees it immediately and bails out instead
    // of also sending a dice roll.
    if (room.processing) {
      return bot.answerCallbackQuery(
        query.id,
        {
          text: "⏳ Dice already rolling...",
        }
      );
    }
    room.processing = true;

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
  room.processing = false;
  await bot.sendMessage(
    query.message.chat.id,
    "⚠️ That roll didn't go through (network hiccup). Please tap 🎲 Roll Dice again."
  ).catch(() => {});
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
        return dice === 6 || dice === 1;
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
            dice === 6 ||
            dice === 1
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
    `➡️ Turn: ${mention(nextPlayer)}`,
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
    `➡️ Turn: ${mention(nextPlayer)}`,
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
    await bot.sendMessage(
      query.message.chat.id,
      "⚠️ Something went wrong processing that roll. Please tap 🎲 Roll Dice again."
    ).catch(() => {});
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
    if (room.lastDice !== 6 && room.lastDice !== 1) {
      return bot.answerCallbackQuery(
        query.id,
        {
          text: "Need a 6 or 1 to leave home",
          show_alert: true,
        }
      );
    }
  } else if (currentPos + room.lastDice > 56) {
    return bot.answerCallbackQuery(
      query.id,
      {
        text: "Need exact roll",
        show_alert: true,
      }
    );
  }

  const newPos = movePiece(
    currentPos,
    room.lastDice
  );

   console.log(
  "MOVE",
  color,
  "current:",
  currentPos,
  "dice:",
  room.lastDice,
  "new:",
  newPos
);
    room.pieces[color][piece] =
      newPos;

  if (
  room.pieces[color][piece] === 56
  ) {
    await safeSendMessage(
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
    await safeSendMessage(
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

  // Safe square (start square or star square) - no captures happen here
  if (SAFE_INDICES.has(movedBoardIndex)) {
    // skip capture check entirely
  } else {

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

        await safeSendMessage(
          query.message.chat.id,
          `✂️ ${color.toUpperCase()} captured ${player.color.toUpperCase()}'s P${i + 1}!`
        );
      }
    }
  }
  }
}


 

  const image =
    await renderBoard(room);

  await safeSendPhoto(
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

  await safeSendMessage(
    query.message.chat.id,
    `➡️ Turn: ${mention(nextPlayer)}`,
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
      `❌ MOVE ERROR: ${err.message}\n\n⚠️ Please try tapping your piece again.`
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