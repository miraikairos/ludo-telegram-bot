/*

🏏 FULL HAND CRICKET TELEGRAM BOT

✅ 1v1 Mode
✅ Team Mode
✅ Overs
✅ Toss
✅ Bat / Bowl
✅ DM Bowling
✅ Group Batting
✅ Innings
✅ Target Chasing
✅ Videos
✅ Webhook
✅ Render Ready

*/
process.on(
  "unhandledRejection",
  err => {

    console.log(
      "UNHANDLED:",
      err
    );

  }
);

process.on(
  "uncaughtException",
  err => {

    console.log(
      "CRASH:",
      err
    );

  }
);
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");

const token = process.env.BOT_TOKEN;

const app = express();

const bot = new TelegramBot(token);

app.use(express.json());

const rooms = {};

// ======================================
// ROOM CODE
// ======================================

function createRoomCode() {

  return Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

}

// ======================================
// BOWLING BUTTONS
// ======================================

function getBowlingButtons(roomCode) {

  return {

    reply_markup: {

      inline_keyboard: [

        [
          {
            text: "1",
            callback_data: `bowl_${roomCode}_1`
          },

          {
            text: "2",
            callback_data: `bowl_${roomCode}_2`
          },

          {
            text: "3",
            callback_data: `bowl_${roomCode}_3`
          }

        ],

        [
          {
            text: "4",
            callback_data: `bowl_${roomCode}_4`
          },

          {
            text: "5",
            callback_data: `bowl_${roomCode}_5`
          },

          {
            text: "6",
            callback_data: `bowl_${roomCode}_6`
          }

        ]

      ]

    }

  };

}

// ======================================
// SEND RUN VIDEOS
// ======================================

async function sendRunVideo(chatId, runs) {

  if (runs === 1) {
    bot.sendVideo(chatId, "BAACAgUAAxkBAAICOGolQEHMxQABoYl0knG9P3OsCY4WZQACuBwAAqMQKFWi_HmdeTT9YTsE").catch(console.log);
  }

  else if (runs === 2) {
    bot.sendVideo(chatId, "BAACAgUAAxkBAAICOWolQEzBc1xSsHt0fs3jBgV_J3DvAAK5HAACoxAoVe66Mz3tf8HWOwQ").catch(console.log);
  }

  else if (runs === 3) {
   bot.sendVideo(chatId, "3-run.mp4").catch(console.log);
  }

  else if (runs === 4) {
   bot.sendVideo(chatId, "BAACAgUAAxkBAAICO2olQGAg0TlEAvGXHXk-8cJJMlLuAAK7HAACoxAoVRTu3CZ7XEtpOwQ").catch(console.log);
  }

  else if (runs === 5) {
    bot.sendVideo(chatId, "BAACAgUAAxkBAAICU2olSFazZ_ToXKa6aL_1j3hZXlyNAALJHAACoxAoVcej4vl3ZXulOwQ").catch(console.log);
  }

  else if (runs === 6) {
    bot.sendVideo(chatId, "BAACAgUAAxkBAAICPWolQGxjhjmqXo2422M6me1dKbYHAAK8HAACoxAoVZk76ZRAxyeHOwQ").catch(console.log);
  }

}

// ======================================
// SEND BOWLER DM
// ======================================

async function sendBowlerDM(
  bowler,
  roomCode,
  groupChat
) {

  console.log(
    "TRYING DM:",
    bowler.name,
    bowler.id
  );

try {

  await bot.sendMessage(
    bowler.id,
    "🥎 Choose Bowling Number",
    getBowlingButtons(roomCode)
  );

  console.log(
    "DM SUCCESS:",
    bowler.name
  );

} catch (err) {

  console.log(
    "DM FAILED:",
    bowler.name,
    err.message
  );

  setTimeout(async () => {

    try {

      await bot.sendMessage(
        bowler.id,
        "🥎 Choose Bowling Number",
        getBowlingButtons(roomCode)
      );

      console.log(
        "DM RETRY SUCCESS:",
        bowler.name
      );

    } catch {

      bot.sendMessage(
        groupChat,
        `⚠️ ${bowler.name} must start bot in DM first and then type /resenddm in group chat`
      );

    }

  }, 3000);

}

}

// ======================================
// START
// ======================================

bot.onText(/\/start/, (msg) => {
     console.log(
    "START USER:",
    msg.from.first_name,
    msg.from.id
  );
  bot.sendMessage(

    msg.chat.id,

`🏏 HAND CRICKET ARENA

/create - 1v1 Match

/teamcreate - Team Match`

  );

});

// ======================================
// CREATE 1V1
// ======================================

bot.onText(/\/create/, (msg) => {

  const roomCode = createRoomCode();

  rooms[roomCode] = {
   groupChat: msg.chat.id,
    mode: "normal",

    players: [

      {
        id: msg.from.id,
        name: msg.from.first_name
      }

    ],

    innings: 1,

    batting: null,
    bowling: null,

    score: 0,
    target: 0,

    wickets: 0,
    balls: 0,

    choices: {},
    processing: false
  };

  bot.sendMessage(

    msg.chat.id,

`🏏 Room Created

Code: ${roomCode}

Join:
/join ${roomCode}`

  );

});

// ======================================
// JOIN 1V1
// ======================================

bot.onText(/\/join (.+)/, (msg, match) => {

  const roomCode = match[1];

  const room = rooms[roomCode];

  if (!room) {
    bot.sendMessage(msg.chat.id, "❌ Room not found");
    return;
  }

  if (room.players.length >= 2) {
    bot.sendMessage(msg.chat.id, "❌ Room Full");
    return;
  }

  room.players.push({
    id: msg.from.id,
    name: msg.from.first_name
  });

  const tossWinner =
    room.players[Math.floor(Math.random() * 2)];

  room.batting = tossWinner.id;

  room.bowling =
    room.players.find(
      p => p.id !== tossWinner.id
    ).id;

  const batsman =
    room.players.find(
      p => p.id === room.batting
    );

  const bowler =
    room.players.find(
      p => p.id === room.bowling
    );
    if (!batsman) {

  console.log(
    "BATSMAN UNDEFINED",
    room
  );

  return;
}

if (!bowler) {

  console.log(
    "BOWLER UNDEFINED",
    room
  );

  return;
}

  bot.sendMessage(

    msg.chat.id,

`🏏 MATCH STARTED

🏏 Batter:
${batsman.name}

🥎 Bowler:
${bowler.name}

📩 Both players check DM`

  );

  sendBowlerDM(
    bowler,
    roomCode,
    msg.chat.id
  );
  bot.sendMessage(

  batsman.id,

`🏏 Your turn to bat

Send a number from 1-6`
);

});

// ======================================
// TEAM CREATE
// ======================================

bot.onText(/\/teamcreate/, (msg) => {
console.log("TEAMCREATE CALLED");
  const roomCode =
    String(msg.chat.id);

  rooms[roomCode] = {

    groupChat: msg.chat.id,
    owner: msg.from.id,
    ownerName: msg.from.first_name,
    mode: "team",

    teamA: [],
    teamB: [],
   battingOrderA: [],
battingOrderB: [],

bowlingOrderA: [],
bowlingOrderB: [],
    innings: 1,

    battingTeam: null,
    bowlingTeam: null,

    currentBowler: 0,
activeBatters: [],
outBatters: [],

striker: 0,
nonStriker: 1,
nextBatsman: 2,

strikerSelected: false,
nonStrikerSelected: false,

    overs: null,
    maxBalls: null,

    score: 0,
    wickets: 0,
    balls: 0,

    target: 0,

    choices: {},
    processing: false,
    matchStarted: false,
lineupLocked: false
  };

  bot.sendMessage(

    msg.chat.id,

`🏏 TEAM MATCH CREATED

Join Team A:
/joinA

Join Team B:
/joinB

Start:
/startmatch`

  );

});

// ======================================
// JOIN A
// ======================================

bot.onText(/\/joinA/, (msg) => {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (!room) {
    bot.sendMessage(msg.chat.id, "❌ Room not found");
    return;
  }

  if (
    room.teamA.find(
      p => p.id === msg.from.id
    )
  ) {
    bot.sendMessage(
      msg.chat.id,
      "⚠️ Already joined Team A"
    );
    return;
  }

  if (
    room.teamB.find(
      p => p.id === msg.from.id
    )
  ) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You already joined Team B"
    );
    return;
  }
 if (room.teamA.length >= 6) {

  bot.sendMessage(
    msg.chat.id,
    "❌ Team A is full (6 players max)"
  );

  return;
}
  room.teamA.push({
    id: msg.from.id,
    name: msg.from.first_name
  });

  bot.sendMessage(
    msg.chat.id,
    `✅ ${msg.from.first_name} joined Team A`
  );

});

// ======================================
// JOIN B
// ======================================

bot.onText(/\/joinB/, (msg) => {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (!room) {
    bot.sendMessage(msg.chat.id, "❌ Room not found");
    return;
  }

  if (
    room.teamB.find(
      p => p.id === msg.from.id
    )
  ) {
    bot.sendMessage(
      msg.chat.id,
      "⚠️ Already joined Team B"
    );
    return;
  }

  if (
    room.teamA.find(
      p => p.id === msg.from.id
    )
  ) {
    bot.sendMessage(
      msg.chat.id,
      "❌ You already joined Team A"
    );
    return;
  }
if (room.teamB.length >= 6) {

  bot.sendMessage(
    msg.chat.id,
    "❌ Team B is full (6 players max)"
  );

  return;
}
  room.teamB.push({
    id: msg.from.id,
    name: msg.from.first_name
  });

  bot.sendMessage(
    msg.chat.id,
    `✅ ${msg.from.first_name} joined Team B`
  );

});

// ======================================
// START MATCH
// ======================================

bot.onText(/\/startmatch/, (msg) => {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (!room) return;

  bot.sendMessage(

    msg.chat.id,

`Choose Overs

/overs 1
/overs 2
/overs 3
/overs 5`

  );

});
bot.onText(/\/solo/, (msg) => {

  const roomCode = String(msg.chat.id);

  rooms[roomCode] = {
    mode: "solo",
    groupChat: msg.chat.id,

    players: [],

    currentBatter: 0,
    currentBall: 0,

    currentScore: 0,

    leaderboard: {},

    activeBowler: null,

    choices: {},

    started: false
  };

  bot.sendMessage(
    msg.chat.id,

`🏏 SOLO TOURNAMENT CREATED

Join:
/joinsolo

Start:
/startsolo`
  );

});
bot.onText(/\/joinsolo/, (msg) => {

  const room =
    rooms[String(msg.chat.id)];

  if (
    !room ||
    room.mode !== "solo"
  ) return;

  if (
    room.players.some(
      p => p.id === msg.from.id
    )
  ) return;

  room.players.push({
    id: msg.from.id,
    name: msg.from.first_name
  });

  bot.sendMessage(
    msg.chat.id,
    `✅ ${msg.from.first_name} joined`
  );

});
bot.onText(/\/startsolo/, async (msg) => {

  const room =
    rooms[String(msg.chat.id)];

  if (
    !room ||
    room.mode !== "solo"
  ) return;

  room.started = true;

  await startSoloTurn(room);

});
async function startSoloTurn(room) {

  const batter =
    room.players[
      room.currentBatter
    ];

  room.currentBall = 0;
  room.currentScore = 0;

  const bowler =
    chooseSoloBowler(room);

  await bot.sendMessage(
    room.groupChat,

`🏏 ${batter.name}'s Turn

🥎 ${bowler.name} check DM`
  );

  await sendBowlerDM(
    bowler,
    String(room.groupChat),
    room.groupChat
  );

}

function chooseSoloBowler(room) {

  const batter =
    room.players[
      room.currentBatter
    ];

  const available =
    room.players.filter(
      p => p.id !== batter.id
    );

  const bowler =
    available[
      Math.floor(
        Math.random() *
        available.length
      )
    ];

  room.activeBowler =
    bowler.id;

  return bowler;

}
// ======================================
// RESEND DM
// ======================================

bot.onText(/\/resenddm/, (msg) => {

  const roomCode = String(msg.chat.id);

  const room = rooms[roomCode];

  if (!room || room.mode !== "team") return;

  const bowlingPlayers =
    room.bowlingTeam === "A"
      ? room.bowlingOrderA
      : room.bowlingOrderB;

  const bowler =
    bowlingPlayers[
      room.currentBowler
    ];

  sendBowlerDM(
    bowler,
    roomCode,
    room.groupChat
  );

  bot.sendMessage(
    msg.chat.id,
    "📩 Bowling DM resent"
  );

});

// ======================================
// OVERS
// ======================================
bot.onText(/\/overs(\d+)/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "❌ Use: /overs 1, /overs 2, /overs 3 or /overs 5"
  );
});

bot.onText(/\/overs (.+)/, (msg, match) => {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (!room) return;
  if (msg.from.id !== room.owner) {

  bot.sendMessage(
    msg.chat.id,
    "❌ Only match creator can set overs"
  );

  return;

}
 if (room.oversLocked) {

  bot.sendMessage(
    msg.chat.id,
    "⚠️ Overs already selected"
  );

  return;

}
  const overs =
    Number(match[1]);
  if (![1, 2, 3, 5].includes(overs)) {
  return bot.sendMessage(
    msg.chat.id,
    "❌ Allowed overs: 1, 2, 3, 5"
  );
}
  room.overs = overs;

  room.maxBalls =
    overs * 6;
  room.oversLocked = true;
  room.tossWinner =
    Math.random() < 0.5
      ? "A"
      : "B";
 room.tossChooser =
  room.tossWinner === "A"
    ? room.teamA[0].id
    : room.teamB[0].id;
  bot.sendMessage(

    msg.chat.id,

`🪙 Toss won by Team ${room.tossWinner}

Choose:

/bat
or
/bowl`

  );

});

// ======================================
// BAT
// ======================================

// ======================================
// BAT
// ======================================

bot.onText(/\/bat/, (msg) => {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (!room) return;

  if (
    msg.from.id !== room.tossChooser
  ) {

    bot.sendMessage(
      msg.chat.id,
      "❌ Only toss winner can choose"
    );

    return;

  }

  if (room.choiceDone) {

    bot.sendMessage(
      msg.chat.id,
      "⚠️ Bat/Bowl already selected"
    );

    return;

  }

room.choiceDone = true;

room.battingOrderA = [...room.teamA];
room.battingOrderB = [...room.teamB];

room.bowlingOrderA = [...room.teamA];
room.bowlingOrderB = [...room.teamB];

room.battingTeam =
  room.tossWinner;

room.bowlingTeam =
  room.tossWinner === "A"
    ? "B"
    : "A";

bot.sendMessage(
  msg.chat.id,

`🏏 Team Setup Phase

Batting Team: ${room.battingTeam}
Bowling Team: ${room.bowlingTeam}

Use /status

Arrange lineup:
/battingorder TEAM POSITION PLAYER

/bowlingorder TEAM POSITION PLAYER

Example:

/battingorder A 1 3

/bowlingorder B 1 2

When ready:

/begin`
);

});

// ======================================
// BOWL
// ======================================

bot.onText(/\/bowl/, (msg) => {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (!room) return;

  if (
    msg.from.id !== room.tossChooser
  ) {

    bot.sendMessage(
      msg.chat.id,
      "❌ Only toss winner can choose"
    );

    return;

  }

  if (room.choiceDone) {

    bot.sendMessage(
      msg.chat.id,
      "⚠️ Bat/Bowl already selected"
    );

    return;

  }

room.choiceDone = true;

room.battingOrderA = [...room.teamA];
room.battingOrderB = [...room.teamB];

room.bowlingOrderA = [...room.teamA];
room.bowlingOrderB = [...room.teamB];

room.bowlingTeam =
  room.tossWinner;

room.battingTeam =
  room.tossWinner === "A"
    ? "B"
    : "A";

bot.sendMessage(
  msg.chat.id,

`🏏 Team Setup Phase

Batting Team: ${room.battingTeam}
Bowling Team: ${room.bowlingTeam}

Use /status

Arrange lineup:

/battingorder TEAM POSITION PLAYER

/bowlingorder TEAM POSITION PLAYER

Example:

/battingorder A 1 3

/bowlingorder B 1 2

When ready:

/begin`
);

});


// ======================================
// START TEAM GAME
// ======================================

async function startTeamGame(
  msg,
  batFirst
) {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (!room) return;

  if (batFirst) {

    room.battingTeam =
      room.tossWinner;

    room.bowlingTeam =
      room.tossWinner === "A"
        ? "B"
        : "A";

  }

  else {

    room.bowlingTeam =
      room.tossWinner;

    room.battingTeam =
      room.tossWinner === "A"
        ? "B"
        : "A";

  }
const battingPlayers =
  room.battingTeam === "A"
    ? room.battingOrderA
    : room.battingOrderB;

  const bowlingPlayers =
  room.bowlingTeam === "A"
    ? room.bowlingOrderA
    : room.bowlingOrderB;
 room.activeBatters =
  battingPlayers.map((_, i) => i);

room.outBatters = [];


 const batsman =
  battingPlayers[
    room.activeBatters[0]
  ];
  const bowler =
    bowlingPlayers[0];

  await bot.sendMessage(

  room.groupChat,

`🏏 MATCH STARTED

🎯 Overs:
${room.overs}

🏏 Batting Team:
${room.battingTeam}

🥎 Bowling Team:
${room.bowlingTeam}

🏏 Batter:
${batsman.name}

🥎 Bowler:
${bowler.name}`

);

await bot.sendMessage(

  room.groupChat,

`🥎 ${bowler.name}

Check your DM and choose bowling number`
);

  await sendBowlerDM(
    bowler,
    roomCode,
    room.groupChat
  );

}

// ======================================
// BATTER SENDS NUMBER
// ======================================



  bot.on("message", (msg) => {

  if (msg.video) {

    console.log(
      "VIDEO ID:",
      msg.video.file_id
    );

  }

  const trimmedText =
    (msg.text || "").trim();

  const number =
    /^[1-6]$/.test(trimmedText)
      ? parseInt(trimmedText)
      : NaN;

  if (
    isNaN(number) ||
    number < 1 ||
    number > 6
  ) return;

  const roomCode =
    Object.keys(rooms).find(code => {

      const room =
        rooms[code];

      if (!room) return false;

      // NORMAL
      if (room.mode === "normal") {

        return room.players.some(
          p => p.id === msg.from.id
        );

      }

      // TEAM
      return (

        room.teamA.some(
          p => p.id === msg.from.id
        ) ||

        room.teamB.some(
          p => p.id === msg.from.id
        )

      );

    });

  if (!roomCode) return;

  const room =
    rooms[roomCode];

  // ======================================
  // NORMAL
  // ======================================

  if (room.mode === "normal") {

    const batsman =
      room.players.find(
        p => p.id === room.batting
      );

    const bowler =
      room.players.find(
        p => p.id === room.bowling
      );
 
    if (
      batsman &&
      msg.from.id === batsman.id
    ) {

     

      room.choices[
        batsman.id
      ] = number;

      if (
        room.choices[
          bowler.id
        ] !== undefined
      ) {

        playNormalBall(
          room,
          roomCode,
          room.groupChat,
          batsman,
          bowler
        );

      }

    }

  }
  /////\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  /////SOLO MODEEEEEEEEEEEE\\\\\\\\\\\\\\\
else  if (room.mode === "solo") {

  const batter =
    room.players[
      room.currentBatter
    ];

  if (
    msg.from.id !== batter.id
  ) return;

  room.choices[
    batter.id
  ] = number;
const bowler =
  room.players.find(
    p => p.id === room.activeBowler
  );

if (
  room.choices[
    bowler.id
  ] !== undefined
) {

  playSoloBall(
    room,
    batter,
    bowler
  );

}
  

}

  // ======================================
  // TEAM
  // ======================================

  else {

    const battingPlayers =
      room.battingTeam === "A"
       ? room.battingOrderA
    : room.battingOrderB;

    const batsman =
      battingPlayers[
         room.activeBatters[0]
      ];
     console.log(
  "CURRENT BATSMAN:",
  batsman?.name,
     room.activeBatters[0]
);

console.log(
  "MSG FROM:",
  msg.from.first_name
);
if (
  msg.chat.id !== room.groupChat
) return;

    if (
      batsman &&
      msg.from.id === batsman.id
    ) {

   

     
 
      const bowlingPlayers =
        room.bowlingTeam === "A"
          ? room.bowlingOrderA
          : room.bowlingOrderB;

      const bowler =
        bowlingPlayers[
          room.currentBowler
        ];
    if (
  room.choices[
    bowler.id
  ] === undefined
) {

  bot.sendMessage(
    room.groupChat,
    "⏳ Wait for bowler to choose first"
  );

  return;

}

// Ignore a repeat/duplicate message once this ball's number is already
// recorded, so it can't overwrite state after the ball has been played.
if (
  room.choices[
    batsman.id
  ] !== undefined
) {

  return;

}

 room.choices[
        batsman.id
      ] = number;

          console.log(
  "BATTER NUMBER:",
  batsman.name,
  number
);
     
      if (
        room.choices[
          bowler.id
        ] !== undefined
      ) {

        playTeamBall(
          room,
          roomCode,
          room.groupChat,
          batsman,
          bowler
        );

      }

    }

  }

});

// ======================================
// STATUS
// ======================================
// ======================================
// STATUS
// ======================================

bot.onText(/\/status/, (msg) => {

  const roomCode =
    String(msg.chat.id);

  const room =
    rooms[roomCode];

  if (
    !room ||
    room.mode !== "team"
  ) {

    return bot.sendMessage(
      msg.chat.id,
      "❌ No active team match."
    );

  }

  const battingPlayers =
    room.battingTeam === "A"
      ? room.battingOrderA
      : room.battingOrderB;

  const bowlingPlayers =
    room.bowlingTeam === "A"
      ? room.bowlingOrderA
      : room.bowlingOrderB;

  const batsman =
    battingPlayers[
        room.activeBatters[0]
    ];

  const bowler =
    bowlingPlayers[
      room.currentBowler
    ];

  const text =

`📊 TEAM MATCH STATUS

👑 Match Creator:
${room.ownerName || "Unknown"}

🏏 Innings:
${room.innings}

🎯 Score:
${room.score}/${room.wickets}

🏏 Batting Team (${room.battingTeam})

${battingPlayers
  .map((p, i) =>
    `${i + 1}. ${i === room.activeBatters[0]? "➡️" : ""} ${p.name}`
  )
  .join("\n")}

🥎 Bowling Team (${room.bowlingTeam})

${bowlingPlayers
  .map((p, i) =>
    `${i + 1}. ${i === room.currentBowler ? "➡️" : ""} ${p.name}`
  )
  .join("\n")}

🏏 Current Batter:
${batsman?.name || "None"}

🥎 Current Bowler:
${bowler?.name || "None"}

🏏 Balls:
${room.balls || 0}/${room.maxBalls || 0}

🎯 Target:
${room.target || "Not set"}

${!room.matchStarted
  ? "⚠️ Setup Phase Active\nUse /begin when lineup is ready"
  : "✅ Match In Progress"}`;

  bot.sendMessage(
    msg.chat.id,
    text
  );

});
///////////batting//////////

bot.onText(
  /\/battingorder ([AB]) (\d+) (\d+)/,
  (msg, match) => {

    const room =
      rooms[String(msg.chat.id)];

    if (!room) return;

    if (
      msg.from.id !== room.owner
    ) {

      return bot.sendMessage(
        msg.chat.id,
        "❌ Only match creator can edit lineup"
      );

    }

    if (
      room.lineupLocked
    ) {

      return bot.sendMessage(
        msg.chat.id,
        "❌ Lineup locked"
      );

    }

   const team =
  match[1];

const battingPlayers =
  team === "A"
    ? room.battingOrderA
    : room.battingOrderB;
  const pos =
  parseInt(match[2]) - 1;

const player =
  parseInt(match[3]) - 1;

    if (
      pos < 0 ||
      player < 0 ||
      pos >= battingPlayers.length ||
      player >= battingPlayers.length
    ) {

      return bot.sendMessage(
        msg.chat.id,
        "❌ Invalid player number"
      );

    }

    [
      battingPlayers[pos],
      battingPlayers[player]
    ] = [
      battingPlayers[player],
      battingPlayers[pos]
    ];

    bot.sendMessage(
      msg.chat.id,
      "✅ Batting order updated"
    );

  }
);

///////////bowling/////////

bot.onText(
  /\/bowlingorder ([AB]) (\d+) (\d+)/,
  (msg, match) => {

    const room =
      rooms[String(msg.chat.id)];

    if (!room) return;

    if (
      msg.from.id !== room.owner
    ) {

      return bot.sendMessage(
        msg.chat.id,
        "❌ Only match creator can edit lineup"
      );

    }

    if (
      room.lineupLocked
    ) {

      return bot.sendMessage(
        msg.chat.id,
        "❌ Lineup locked"
      );

    }

  const team =
  match[1];

const bowlingPlayers =
  team === "A"
    ? room.bowlingOrderA
    : room.bowlingOrderB; 
    const pos =
  parseInt(match[2]) - 1;

const player =
  parseInt(match[3]) - 1;

    if (
      pos < 0 ||
      player < 0 ||
      pos >= bowlingPlayers.length ||
      player >= bowlingPlayers.length
    ) {

      return bot.sendMessage(
        msg.chat.id,
        "❌ Invalid player number"
      );

    }

    [
      bowlingPlayers[pos],
      bowlingPlayers[player]
    ] = [
      bowlingPlayers[player],
      bowlingPlayers[pos]
    ];

    bot.sendMessage(
      msg.chat.id,
      "✅ Bowling order updated"
    );

  }
);
//////begin/////////

bot.onText(/\/begin/, (msg) => {

  const room =
    rooms[String(msg.chat.id)];

  if (!room) return;

  if (
    room.mode !== "team"
  ) return;

  if (
    msg.from.id !== room.owner
  ) {

    return bot.sendMessage(
      msg.chat.id,
      "❌ Only match creator can start match."
    );

  }
  if (room.matchStarted) {

  return bot.sendMessage(
    msg.chat.id,
    "⚠️ Match already started"
  );

}
room.matchStarted = true;
room.lineupLocked = true;
  startTeamGame(
    msg,
    room.battingTeam === room.tossWinner
  );

});
// ======================================
// CALLBACK
// ======================================

bot.on("callback_query", async (query) => {

  const data =
    query.data;

  if (
    !data.startsWith("bowl_")
  ) return;

  const parts =
    data.split("_");

  const roomCode =
    parts[1];

  const number =
    Number(parts[2]);

  const room =
    rooms[roomCode];

  if (!room) return;
console.log(
  "BOWL CLICK:",
  query.from.first_name,
  "Room:",
  roomCode,
  "Number:",
  number
);
  // ======================================
  // NORMAL MODE
  // ======================================

  if (room.mode === "normal") {
 
    const batsman =
      room.players.find(
        p => p.id === room.batting
      );

    const bowler =
      room.players.find(
        p => p.id === room.bowling
      );

    console.log(
  "NORMAL MODE",
  "Batsman:",
  batsman.name,
  "Bowler:",
  bowler.name
);
    room.choices[
      bowler.id
    ] = number;
console.log(
  "BOWLER PICKED:",
  number
);
console.log(
  "BATTER CHOICE:",
  room.choices[batsman.id]
);
    if (
  room.choices[
    batsman.id
  ] !== undefined
) {
    console.log(
    "WAITING FOR BATTER"
  );

  console.log(
  "PROCESSING BALL",
  room.choices[batsman.id],
  room.choices[bowler.id]
);

  playNormalBall(
    room,
    roomCode,
    room.groupChat,
    batsman,
    bowler
  );

}
  bot.answerCallbackQuery(
  query.id,
  {
    text:
      "Bowling number selected"
  }
);

  }
  ///\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  ///SOLO MODEEEEEEEEEEEEEEE\\\\\\\\\\\\\\\\\
 else if (room.mode === "solo") {

  const bowler =
    room.players.find(
      p =>
        p.id ===
        room.activeBowler
    );

  if (
    query.from.id !== bowler.id
  ) {

    return bot.answerCallbackQuery(
      query.id,
      {
        text:
          "Not your turn"
      }
    );

  }

  room.choices[
    bowler.id
  ] = number;

  const batter =
    room.players[
      room.currentBatter
    ];

 bot.sendMessage(
  room.groupChat,
  `🥎 ${bowler.name} selected bowling number

🏏 ${batter.name} send your number now`
);

  if (
    room.choices[
      batter.id
    ] !== undefined
  ) {

    playSoloBall(
      room,
      batter,
      bowler
    );

  }

}

  // ======================================
  // TEAM MODE
  // ======================================

  else {

    const battingPlayers =
      room.battingTeam === "A"
        ? room.battingOrderA
    : room.battingOrderB;

const bowlingPlayers =
  room.bowlingTeam === "A"
    ? room.bowlingOrderA
    : room.bowlingOrderB;
    const batsman =
      battingPlayers[
          room.activeBatters[0]
      ];

    const bowler =
      bowlingPlayers[
        room.currentBowler
      ];
    if (query.from.id !== bowler.id) {

  bot.answerCallbackQuery(
    query.id,
    {
      text: "❌ Not your turn to bowl"
    }
  );

  return;

}
if (!batsman || !bowler) {

  console.log("INVALID PLAYER STATE");

  console.log("batsman =", batsman);
  console.log("bowler =", bowler);

  bot.answerCallbackQuery(
    query.id,
    {
      text: "⚠️ Invalid batting/bowling state"
    }
  );

  return;
}

// Guard against a double-tap on the same "choose bowling number" DM:
// once the bowler has already picked for this ball, ignore repeat taps
// instead of silently overwriting the number after the ball may have
// already been played and rotated to someone else.
if (room.choices[bowler.id] !== undefined) {

  bot.answerCallbackQuery(
    query.id,
    {
      text: "Already chosen, waiting for batsman"
    }
  );

  return;

}

    room.choices[
      bowler.id
    ] = number;

  // Disable the DM keyboard now that it's been used, so a second tap
  // can't reach this handler again for the same message.
  bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: query.message.chat.id, message_id: query.message.message_id }
  ).catch(() => {});

  console.log(
  "BOWLER NUMBER:",
  bowler.name,
  number
);
console.log("========== TEAM DEBUG ==========");
console.log("Batting Team:", room.battingTeam);
console.log("Bowling Team:", room.bowlingTeam);

console.log("currentBatsman:",    room.activeBatters[0]);
console.log("currentBowler:", room.currentBowler);

console.log(
  "battingPlayers:",
  battingPlayers?.map(p => p.name)
);

console.log(
  "bowlingPlayers:",
  bowlingPlayers?.map(p => p.name)
);

console.log("batsman:", batsman);
console.log("bowler:", bowler);
console.log("================================");
    // ask batter after bowler selects
if (
  room.choices[
    batsman.id
  ] !== undefined
) {

  await playTeamBall(
    room,
    roomCode,
    room.groupChat,
    batsman,
    bowler
  );

  bot.answerCallbackQuery(
    query.id,
    {
      text: "Bowling number selected"
    }
  );

  return;

}


bot.sendMessage(
  room.groupChat,

`🥎 ${bowler.name} selected bowling number

🏏 ${batsman.name} send your number now`
);

   bot.answerCallbackQuery(
  query.id,
  {
    text:
      "Bowling number selected"
  }
);
  }

});

// ======================================
// NORMAL BALL
// ======================================

function playNormalBall(
  room,
  roomCode,
  chatId,
  batsman,
  bowler
) {
  if (room.processing) return;

  room.processing = true;
  const bat =
    room.choices[
      batsman.id
    ];

  const bowl =
    room.choices[
      bowler.id
    ];

  room.balls++;

  let message =
`🏏 Ball ${room.balls}

🏏 ${batsman.name}: ${bat}
🥎 ${bowler.name}: ${bowl}

`;

  // OUT

  if (bat === bowl) {



    if (
      room.innings === 1
    ) {

      room.target =
        room.score + 1;

      room.innings = 2;

      room.score = 0;

      room.balls = 0;

      const temp =
        room.batting;

      room.batting =
        room.bowling;

      room.bowling =
        temp;

      message +=
`\n❌ OUT

🎯 Target:
${room.target}

🏏 Second Innings`;

    }

    else {

      message +=
`\n❌ OUT

🏆 ${bowler.name} Wins`;

      // send score to batter
bot.sendMessage(
  batsman.id,
  message
);

// send score to bowler
bot.sendMessage(
  bowler.id,
  message
);
delete rooms[
  roomCode
];
console.log(
  "PLAYTEAMBALL END",
  roomCode
);
room.processing = false;

return;

    }

  }

  // RUNS

  else {

    room.score += bat;

// send instantly without waiting
sendRunVideo(
  batsman.id,
  bat
);

sendRunVideo(
  bowler.id,
  bat
);
    message +=
      `🏏 +${bat} Runs`;

  }

  // CHASE COMPLETE

  if (
    room.innings === 2 &&
    room.score >= room.target
  ) {

    message +=
`\n🏆 ${batsman.name} Wins`;

    // send score to batter
bot.sendMessage(
  batsman.id,
  message
);

// send score to bowler
bot.sendMessage(
  bowler.id,
  message
);

 delete rooms[
  roomCode
];
console.log(
  "PLAYTEAMBALL END",
  roomCode
);
room.processing = false;

return;

  }

  message +=
`\n\nScore:
${room.score}`;

  room.choices = {};

  const newBatsman =
    room.players.find(
      p => p.id === room.batting
    );

  const newBowler =
    room.players.find(
      p => p.id === room.bowling
    );

// send score to batter
bot.sendMessage(
  batsman.id,
  message
);

// send score to bowler
bot.sendMessage(
  bowler.id,
  message
);
   bot.sendMessage(

  newBatsman.id,

`🏏 Your turn to bat

Send number from 1-6`
);
 // wait video to batter
bot.sendVideo(
  batsman.id,
  "BAACAgUAAxkDAAICLmolLnzhrXw_GPlbh5Littz0qkzeAAKRHAACoxAoVYhYGaXqOeMxOwQ"
).catch(console.log);

// wait video to bowler
bot.sendVideo(
  bowler.id,
  "BAACAgUAAxkDAAICLmolLnzhrXw_GPlbh5Littz0qkzeAAKRHAACoxAoVYhYGaXqOeMxOwQ"
).catch(console.log);

  sendBowlerDM(
    newBowler,
    roomCode,
    chatId
  );
  console.log(
  "PLAYTEAMBALL END",
  roomCode
);
room.processing = false;
}
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
////SOLO MODEEEEEEEEEEEEEEEE\\\\\\\\\\\\
////////////////////////////////////////
async function playSoloBall(
  room,
  batter,
  bowler
) {

  const bat =
    room.choices[batter.id];

  const bowl =
    room.choices[bowler.id];

  room.currentBall++;

  if (bat === bowl) {

    await finishSoloTurn(room);

    return;

  }
const newBowler =
  chooseSoloBowler(room);

await bot.sendMessage(

  room.groupChat,

`🥎 ${newBowler.name}

Check your DM and choose bowling number`
);

await sendBowlerDM(
  newBowler,
  String(room.groupChat),
  room.groupChat
);
  room.currentScore += bat;

  await bot.sendMessage(

    room.groupChat,

`🏏 ${batter.name}: ${bat}
🥎 ${bowler.name}: ${bowl}

+${bat} Runs

Score:
${room.currentScore}`
  );

  room.choices = {};
  room.activeBowler = null;

  if (
    room.currentBall >= 6
  ) {

    await finishSoloTurn(room);

  }

}
async function finishSoloTurn(room) {

  const batter =
    room.players[
      room.currentBatter
    ];

  room.leaderboard[
    batter.name
  ] = room.currentScore;

  await bot.sendMessage(

    room.groupChat,

`✅ ${batter.name}

Final Score:
${room.currentScore}`
  );

  room.currentBatter++;

  room.choices = {};
  room.activeBowler = null;

  if (
    room.currentBatter >=
    room.players.length
  ) {

    const sorted =
      Object.entries(
        room.leaderboard
      ).sort(
        (a,b) => b[1]-a[1]
      );

    let text =
      "🏆 LEADERBOARD\n\n";

    sorted.forEach(
      ([name, score], i) => {

        text +=
          `${i+1}. ${name} - ${score}\n`;

      }
    );

    await bot.sendMessage(
      room.groupChat,
      text
    );

    return;
  }

  await startSoloTurn(room);

}

// ======================================
// TEAM BALL
// ======================================

async function playTeamBall(
  
  room,
  roomCode,
  chatId,
  batsman,
  bowler
) {
  console.log(
  "PLAYTEAMBALL START",
  roomCode,
  room.processing
);
if (room.processing) return;

room.processing = true;
room.lastActive = Date.now();
  const bat =
    room.choices[
      batsman.id
    ];

  const bowl =
    room.choices[
      bowler.id
    ];

  room.balls++;

  let message =
`🏏 Ball ${room.balls}/${room.maxBalls}

🏏 ${batsman.name}: ${bat}
🥎 ${bowler.name}: ${bowl}

`;

  // OUT

if (bat === bowl) {

  room.wickets++;

  const outPlayer =
    room.activeBatters.shift();

  room.outBatters.push(
    outPlayer
  );

  message +=
    `❌ OUT`;

}

  // RUNS

  else {

    room.score += bat;

    await sendRunVideo(
      chatId,
      bat
    );

    message +=
      `🏏 +${bat} Runs`;

  }
    // ======================================
  // SCORE
  // ======================================

  message +=
`\n\nScore:
${room.score}/${room.wickets}`;

  // ======================================
  // TARGET
  // ======================================

  if (
    room.innings === 2
  ) {

    const need =
      room.target -
      room.score;

    const ballsLeft =
      room.maxBalls -
      room.balls;

    message +=
`\n🎯 Target:
${room.target}

Need ${need} in ${ballsLeft} balls`;

  }

  // clear old choices

  room.choices = {};

  // ======================================
  // SEND SCORE
  // ======================================

  await bot.sendMessage(
    chatId,
    message
  );

  // ======================================
  // WAIT VIDEO
  // ======================================


const battingPlayers =
  room.battingTeam === "A"
    ? room.battingOrderA
    : room.battingOrderB;
  

 const bowlingPlayers =
  room.bowlingTeam === "A"
    ? room.bowlingOrderA
    : room.bowlingOrderB;

    // Change bowler after every over
if (room.balls % 6 === 0) {

  // Rotate batter

  if (
    room.activeBatters.length > 1
  ) {

    room.activeBatters.push(
      room.activeBatters.shift()
    );

  }

  // Rotate bowler

  if (
    bowlingPlayers.length > 1
  ) {

    room.currentBowler++;

    if (
      room.currentBowler >=
      bowlingPlayers.length
    ) {

      room.currentBowler = 0;

    }

  }

}
  const newBatsman =
    battingPlayers[
          room.activeBatters[0]
    ];

  const newBowler =
    bowlingPlayers[
      room.currentBowler
    ];


  // ======================================
  // INNINGS END
  // ======================================

  if (
    !newBatsman ||
    room.balls >= room.maxBalls
  ) {

    if (
      room.innings === 1
    ) {

      room.target =
        room.score + 1;

      room.innings = 2;

      room.score = 0;
      room.wickets = 0;
      room.balls = 0;

  

room.striker = 0;
room.nonStriker = 1;
room.nextBatsman = 2;
     room.currentBowler = 0;
      const temp =
        room.battingTeam;

      room.battingTeam =
        room.bowlingTeam;

      room.bowlingTeam =
        temp;
        const secondBattingPlayers =
  room.battingTeam === "A"
    ? room.battingOrderA
    : room.battingOrderB;

room.activeBatters =
  secondBattingPlayers.map((_, i) => i);

room.outBatters = [];

      await bot.sendMessage(

        chatId,

`🎯 Target:
${room.target}

🏏 Second Innings Begins`

      );

      const secondBowling =
        room.bowlingTeam === "A"
          ? room.bowlingOrderA
          : room.bowlingOrderB;
     await bot.sendMessage(

  room.groupChat,

`🥎 ${secondBowling[0].name}

Check your DM and choose bowling number`
);
     await sendBowlerDM(
  secondBowling[0],
  roomCode,
  room.groupChat
);
console.log(
  "PLAYTEAMBALL END",
  roomCode
);
room.processing = false;


      return;

    }

    else {

      await bot.sendVideo(
        chatId,
        "https://media.tenor.com/2roX3uxz_68AAAPo/trophy-win.mp4"
      );

      await bot.sendMessage(

        chatId,

`🏆 Team ${room.bowlingTeam} Wins`

      );

     delete rooms[
  roomCode
];
console.log(
  "PLAYTEAMBALL END",
  roomCode
);
room.processing = false;

return;

    }

  }

  // ======================================
  // CHASE COMPLETE
  // ======================================

  if (
    room.innings === 2 &&
    room.score >= room.target
  ) {

    await bot.sendVideo(
      chatId,
      "https://media.tenor.com/2roX3uxz_68AAAPo/trophy-win.mp4"
    );

    await bot.sendMessage(

      chatId,

`🏆 Team ${room.battingTeam} Wins`

    );

   delete rooms[
  roomCode
];
console.log(
  "PLAYTEAMBALL END",
  roomCode
);
room.processing = false;

return;

  }

  // ======================================
  // NEXT BALL
  // ======================================

 // ======================================
// NEXT BALL
// ======================================

// wait video before next ball


// tell bowler to check DM
await bot.sendMessage(

  room.groupChat,

`🥎 ${newBowler.name}

Check your DM and choose bowling number`
);
console.log(
  "PLAYTEAMBALL END",
  roomCode
);
room.processing = false;
// send DM buttons
setTimeout(() => {

  sendBowlerDM(
    newBowler,
    roomCode,
    room.groupChat
  );

}, 1500);

}

// ======================================
// WEBHOOK
// ======================================

app.post(`/bot${token}`, (req, res) => {

  bot.processUpdate(
    req.body
  );

  res.sendStatus(200);

});

// ======================================
// HOME
// ======================================

app.get("/", (req, res) => {

  res.send("Bot Running");

});
setInterval(() => {

  Object.keys(rooms).forEach(code => {

    const room = rooms[code];

    if (!room) return;

    if (
      Date.now() - (room.lastActive || 0)
      > 1000 * 60 * 30
    ) {

      delete rooms[code];

      console.log(
        "Deleted inactive room:",
        code
      );

    }

  });

}, 600000);
// ======================================
// SERVER
// ======================================

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `Server running on ${PORT}`
  );

});
